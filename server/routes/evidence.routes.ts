import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { queryOne } from '../db/database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { aiAuditQueue } from '../workers/aiAuditWorker';

const router = Router();
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

/**
 * 1. Stream certificate evidence with granular Resource-Based Access Control (RBAC)
 * Verifies that requester is either the owning student, their assigned mentor, or an HOD/Dean.
 */
router.get('/:submissionId/file', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const user = req.user!;

    // 1. Fetch submission and mentee relationship
    const submission = await queryOne(`
      SELECT s.id, s.student_id, s.file_url, s.file_name, u.mentor_id, u.name as student_name
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.id = ?
    `, [submissionId]);

    if (!submission) {
      res.status(404).json({ error: 'Evidence record not found in university database' });
      return;
    }

    // 2. Enforce Role-Based Access Control (RBAC)
    const isOwner = user.id === submission.student_id;
    const isAssignedMentor = user.role === 'mentor' && user.id === submission.mentor_id;
    const isExecutive = user.role === 'hod' || user.role === 'dean';

    if (!isOwner && !isAssignedMentor && !isExecutive) {
      res.status(403).json({
        error: 'Access denied: You do not have institutional authorization to inspect this student document.',
      });
      return;
    }

    // 3. Resolve file safely to prevent path traversal
    const safeFileName = path.basename(submission.file_url);
    const diskPath = path.join(UPLOADS_DIR, safeFileName);

    if (!fs.existsSync(diskPath)) {
      res.status(404).json({ error: 'Physical certificate file not found on server disk' });
      return;
    }

    // 4. Stream file with strict MIME headers
    const ext = path.extname(diskPath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
    };

    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${safeFileName}"`);
    res.setHeader('Cache-Control', 'private, max-age=1800'); // 30 mins browser cache for authenticated session

    fs.createReadStream(diskPath).pipe(res);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2. Get Telemetry & Real-Time Status of AI Verification Queue
 */
router.get('/queue/stats', authenticate, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    status: 'ok',
    queue: aiAuditQueue.getStats(),
  });
});

/**
 * 3. Enqueue a submission for asynchronous re-audit (Mentor/HOD/Dean)
 */
router.post('/:submissionId/re-audit', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const user = req.user!;

    if (user.role === 'student') {
      res.status(403).json({ error: 'Students cannot trigger re-audit manually' });
      return;
    }

    const submission = await queryOne(`
      SELECT s.id, s.file_url, u.name as student_name, u.roll_no as student_roll_no, u.mentor_id
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.id = ?
    `, [submissionId]);

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    if (user.role === 'mentor' && user.id !== submission.mentor_id) {
      res.status(403).json({ error: 'Unauthorized: Student is not assigned to you' });
      return;
    }

    aiAuditQueue.enqueue({
      submissionId: submission.id,
      filePath: submission.file_url,
      studentName: submission.student_name,
      rollNo: submission.student_roll_no,
    });

    res.json({
      success: true,
      message: 'Submission enqueued for background AI verification',
      submissionId,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
