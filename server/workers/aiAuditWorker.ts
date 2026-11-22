import { auditCertificateFile, AIAuditResult } from '../services/geminiAudit';
import { executeRun, queryAll } from '../db/database';

export interface AuditTask {
  submissionId: string;
  filePath: string;
  studentName?: string;
  rollNo?: string;
  attempts: number;
  enqueuedAt: number;
}

export interface QueueStats {
  queueLength: number;
  isProcessing: boolean;
  totalProcessed: number;
  totalFailed: number;
  lastProcessedAt: string | null;
}

class AIAuditQueueWorker {
  private queue: AuditTask[] = [];
  private isProcessing = false;
  private maxAttempts = 3;
  private totalProcessed = 0;
  private totalFailed = 0;
  private lastProcessedAt: string | null = null;
  // Enforce minimum delay between calls to respect Gemini API rate limits
  private minDelayMs = 1200;
  private lastCallTime = 0;

  /**
   * Enqueue a submission for background AI audit processing with persistent SQLite journaling
   */
  public enqueue(task: Omit<AuditTask, 'attempts' | 'enqueuedAt'>): void {
    if (this.queue.some((t) => t.submissionId === task.submissionId)) {
      return;
    }

    const nowIso = new Date().toISOString();
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Transactionally persist job to database so it survives server crashes & reboots
    try {
      executeRun(`
        INSERT OR REPLACE INTO audit_queue_jobs 
        (id, submission_id, file_path, student_name, roll_no, attempts, max_attempts, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 0, ?, 'pending', ?, ?)
      `, [jobId, task.submissionId, task.filePath, task.studentName || null, task.rollNo || null, this.maxAttempts, nowIso, nowIso]);
    } catch (err: any) {
      console.warn('[AIAuditQueueWorker] Queue persistence note:', err.message);
    }

    this.queue.push({
      ...task,
      attempts: 0,
      enqueuedAt: Date.now(),
    });

    // Schedule asynchronous background processing
    setImmediate(() => this.processNext());
  }

  /**
   * Resumes any pending or interrupted jobs from database on server startup
   */
  public async recoverPendingJobs(): Promise<void> {
    try {
      const pendingJobs = await queryAll(`
        SELECT submission_id, file_path, student_name, roll_no, attempts
        FROM audit_queue_jobs
        WHERE status IN ('pending', 'processing') AND attempts < max_attempts
      `);

      if (pendingJobs && pendingJobs.length > 0) {
        for (const job of pendingJobs) {
          if (!this.queue.some((t) => t.submissionId === job.submission_id)) {
            this.queue.push({
              submissionId: job.submission_id,
              filePath: job.file_path,
              studentName: job.student_name,
              rollNo: job.roll_no,
              attempts: Number(job.attempts) || 0,
              enqueuedAt: Date.now(),
            });
          }
        }
        console.log(`[AIAuditQueueWorker] ✓ Recovered ${pendingJobs.length} persistent audit jobs from database.`);
        setImmediate(() => this.processNext());
      }
    } catch (err: any) {
      console.warn('[AIAuditQueueWorker] Persistent job recovery note:', err.message);
    }
  }

  /**
   * Get queue health metrics and telemetry
   */
  public getStats(): QueueStats {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      totalProcessed: this.totalProcessed,
      totalFailed: this.totalFailed,
      lastProcessedAt: this.lastProcessedAt,
    };
  }

  /**
   * Check if a submission is currently in the queue
   */
  public isQueued(submissionId: string): boolean {
    return this.queue.some((t) => t.submissionId === submissionId);
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const task = this.queue.shift()!;

    try {
      // Throttle calls to respect rate limits
      const now = Date.now();
      const elapsedSinceLast = now - this.lastCallTime;
      if (elapsedSinceLast < this.minDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, this.minDelayMs - elapsedSinceLast));
      }

      // Mark status as 'auditing' in database & update queue status
      const nowIso = new Date().toISOString();
      await executeRun(
        'UPDATE submissions SET verification_status = ? WHERE id = ?',
        ['auditing', task.submissionId]
      );
      await executeRun(
        'UPDATE audit_queue_jobs SET status = ?, attempts = ?, updated_at = ? WHERE submission_id = ?',
        ['processing', task.attempts + 1, nowIso, task.submissionId]
      );

      this.lastCallTime = Date.now();
      const auditResult: AIAuditResult = await auditCertificateFile(task.filePath, {
        name: task.studentName,
        roll_no: task.rollNo,
      });

      // Determine proper verification status based on audit findings
      let verStatus = 'pre_verified';
      if (auditResult.authenticity_status === 'SUSPICIOUS') {
        verStatus = 'suspicious';
      } else if (auditResult.authenticity_status === 'INCONCLUSIVE') {
        verStatus = 'inconclusive';
      }

      await executeRun(
        `UPDATE submissions 
         SET ai_audit_results = ?, verification_status = ? 
         WHERE id = ?`,
        [JSON.stringify(auditResult), verStatus, task.submissionId]
      );

      // Mark job completed in persistent queue
      await executeRun(
        'UPDATE audit_queue_jobs SET status = ?, updated_at = ? WHERE submission_id = ?',
        ['completed', new Date().toISOString(), task.submissionId]
      );

      // Record in activity log
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await executeRun(
        `INSERT INTO activity_logs (id, user_id, action, details, created_at)
         VALUES (?, ?, 'AI_AUDIT_COMPLETED', ?, ?)`,
        [
          logId,
          'system',
          `AI Audit completed for submission ${task.submissionId}: status ${auditResult.authenticity_status || 'VERIFIED'} (confidence: ${auditResult.confidence_score ?? 90}%)`,
          new Date().toISOString(),
        ]
      );

      this.totalProcessed++;
      this.lastProcessedAt = new Date().toISOString();
    } catch (err: any) {
      console.warn(`[AIAuditQueueWorker] Audit attempt ${task.attempts + 1} failed for ${task.submissionId}:`, err.message);
      task.attempts++;

      if (task.attempts < this.maxAttempts) {
        const backoffMs = 2000 * Math.pow(2, task.attempts);
        setTimeout(() => {
          this.queue.push(task);
          this.processNext();
        }, backoffMs);
      } else {
        this.totalFailed++;
        // Exhausted attempts, mark job as failed and submission as audit_pending for manual review
        try {
          await executeRun(
            'UPDATE audit_queue_jobs SET status = ?, error_message = ?, updated_at = ? WHERE submission_id = ?',
            ['failed', err.message, new Date().toISOString(), task.submissionId]
          );

          await executeRun(
            `UPDATE submissions 
             SET verification_status = ?, 
                 ai_audit_results = ? 
             WHERE id = ?`,
            [
              'audit_pending',
              JSON.stringify({
                error: err.message,
                authenticity_status: 'INCONCLUSIVE',
                audit_summary: 'Automated AI audit could not complete. Manual faculty review required.',
              }),
              task.submissionId,
            ]
          );
        } catch (updateErr: any) {
          console.error('[AIAuditQueueWorker] Failed to update fallback status:', updateErr.message);
        }
      }
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setImmediate(() => this.processNext());
      }
    }
  }
}

export const aiAuditQueue = new AIAuditQueueWorker();
