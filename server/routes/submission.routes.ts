import crypto from 'crypto';
import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { queryAll, queryOne, executeRun } from '../db/database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { auditCertificateFile } from '../services/geminiAudit';
import { aiAuditQueue } from '../workers/aiAuditWorker';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

// Multer Storage Configuration for PDF / Evidence Uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `cert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg', '.svg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext) || file.mimetype.includes('pdf') || file.mimetype.includes('image')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Image certificates (.png, .jpg, .svg) are supported'));
    }
  },
});

export function isBloodDonationSubmission(
  schemaRule?: any,
  activityTitle?: string,
  categoryId?: string
): boolean {
  if (schemaRule?.id === 'sch_vol_2' || schemaRule?.id === 'sch_vol_3') return true;
  const title = (activityTitle || '').toLowerCase();
  const schemaName = (schemaRule?.activity_name || '').toLowerCase();
  return title.includes('blood') || schemaName.includes('blood');
}

// 1. Upload File Endpoint with rate limiting
router.post('/upload', uploadLimiter, authenticate, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const filePath = req.file.path;
    const fileBuf = fs.readFileSync(filePath);
    const fileHash = crypto.createHash('sha256').update(fileBuf).digest('hex');

    // Query submissions table for duplicate file_hash
    const existingSubmission = await queryOne(`
      SELECT 
        s.id,
        s.activity_title,
        s.student_id,
        s.submitted_at,
        s.status,
        u.name as student_name,
        u.roll_no as student_roll_no
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.file_hash = ?
      LIMIT 1
    `, [fileHash]);

    let duplicateInfo = null;
    if (existingSubmission) {
      const isSelf = existingSubmission.student_id === req.user?.id;
      duplicateInfo = {
        type: isSelf ? 'self' : 'collusion',
        original_submission_id: existingSubmission.id,
        activity_title: existingSubmission.activity_title,
        submitted_at: existingSubmission.submitted_at,
        status: existingSubmission.status,
        student_name: existingSubmission.student_name,
        student_roll_no: existingSubmission.student_roll_no,
        message: isSelf
          ? `You have already submitted this exact certificate for "${existingSubmission.activity_title}" on ${new Date(existingSubmission.submitted_at).toLocaleDateString()} (Status: ${existingSubmission.status}). Duplicate submissions are not allowed.`
          : `Academic Integrity Alert: This exact certificate file was already submitted by another student (${existingSubmission.student_name}, ${existingSubmission.student_roll_no}). Reusing another student's certificate is strictly prohibited.`,
      };
    }

    res.json({
      file_url: fileUrl,
      file_name: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      file_hash: fileHash,
      is_duplicate: !!duplicateInfo,
      duplicate_info: duplicateInfo,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Submit Activity Evidence (Student only)
router.post('/', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      schema_id,
      activity_title,
      description,
      file_url,
      file_name,
      file_size,
      completion_date,
      semester,
      hours_spent,
      ai_audit_results,
    } = req.body;

    if (!activity_title || !file_url || !completion_date) {
      res.status(400).json({ error: 'activity_title, file_url, and completion_date are required' });
      return;
    }

    const subSemester = semester ? Math.max(1, Math.min(8, Number(semester))) : (req.user?.semester || 1);

    // Fetch schema rule or default to active rule
    let schemaRule = null;
    if (schema_id) {
      schemaRule = await queryOne('SELECT * FROM activity_schema WHERE id = ?', [schema_id]);
    }
    if (!schemaRule) {
      schemaRule = await queryOne('SELECT * FROM activity_schema WHERE is_active = 1 ORDER BY id ASC LIMIT 1');
    }
    if (!schemaRule) {
      schemaRule = { id: 'rule_default', version: 1, category_id: 'cat_technical', base_points: 20, activity_name: 'Activity / Event' };
    }

    // Strict Institutional Policy: Max frequency per academic year for ANY certificate kind (default max: 1 per year)
    const targetYear = Math.ceil(subSemester / 2);
    const maxPerYear = Number(schemaRule?.max_per_year || 1);

    const existingSameYearSubmission = await queryOne(`
      SELECT 
        s.id, 
        s.activity_title, 
        s.semester, 
        s.submitted_at, 
        s.completion_date, 
        s.status,
        sch.activity_name as schema_name
      FROM submissions s
      LEFT JOIN activity_schema sch ON s.schema_id = sch.id
      WHERE s.student_id = ?
        AND s.status != 'rejected'
        AND (
          (s.schema_id IS NOT NULL AND s.schema_id = ?)
          OR LOWER(TRIM(s.activity_title)) = LOWER(TRIM(?))
          OR (sch.activity_name IS NOT NULL AND LOWER(TRIM(sch.activity_name)) = LOWER(TRIM(?)))
          OR (
            (LOWER(s.activity_title) LIKE '%blood%' OR (sch.activity_name IS NOT NULL AND LOWER(sch.activity_name) LIKE '%blood%'))
            AND (LOWER(?) LIKE '%blood%' OR LOWER(?) LIKE '%blood%')
          )
        )
        AND (
          CAST(((s.semester + 1) / 2) AS INTEGER) = ?
          OR strftime('%Y', s.completion_date) = strftime('%Y', ?)
        )
      LIMIT 1
    `, [
      req.user!.id,
      schemaRule.id,
      activity_title,
      schemaRule.activity_name || activity_title,
      activity_title,
      schemaRule.activity_name || activity_title,
      targetYear,
      completion_date,
    ]);

    if (existingSameYearSubmission) {
      const existingYear = Math.ceil(existingSameYearSubmission.semester / 2);
      res.status(409).json({
        error: `Institutional Policy Violation: This certificate / activity ("${activity_title}") can only be claimed ${maxPerYear} time(s) per academic year. You have already submitted a certificate for this activity in Academic Year ${existingYear} ("${existingSameYearSubmission.activity_title}", Semester ${existingSameYearSubmission.semester}, Status: ${existingSameYearSubmission.status}). AICTE/University regulations restrict each certificate type to ${maxPerYear} claim(s) per academic year.`,
      });
      return;
    }

    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const hoursVal = hours_spent ? Number(hours_spent) : 0;
    const credentialHash = crypto.createHash('sha256').update(`${id}-${req.user!.id}-${Date.now()}`).digest('hex').substring(0, 24).toUpperCase();
    const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    const qrCodeData = `${baseUrl}/verify/${credentialHash}`;

    // Compute or verify file_hash
    let calculatedFileHash = req.body.file_hash;
    if (!calculatedFileHash && file_url) {
      let diskPath = file_url;
      if (!fs.existsSync(diskPath)) {
        const relPath = path.join(process.cwd(), file_url.replace(/^\//, ''));
        if (fs.existsSync(relPath)) {
          diskPath = relPath;
        } else {
          const inUploads = path.join(process.cwd(), 'uploads', path.basename(file_url));
          if (fs.existsSync(inUploads)) {
            diskPath = inUploads;
          }
        }
      }

      if (fs.existsSync(diskPath)) {
        try {
          const buf = fs.readFileSync(diskPath);
          calculatedFileHash = crypto.createHash('sha256').update(buf).digest('hex');
        } catch {}
      }
    }

    // Server-side strict duplicate validation by file_hash
    if (calculatedFileHash) {
      const existingByHash = await queryOne(`
        SELECT 
          s.id, 
          s.student_id, 
          s.activity_title, 
          s.submitted_at, 
          s.status,
          u.name as student_name, 
          u.roll_no as student_roll_no
        FROM submissions s
        JOIN users u ON s.student_id = u.id
        WHERE s.file_hash = ?
        LIMIT 1
      `, [calculatedFileHash]);

      if (existingByHash) {
        if (existingByHash.student_id === req.user!.id) {
          res.status(409).json({
            error: `Duplicate Submission: You have already submitted this certificate for "${existingByHash.activity_title}" on ${new Date(existingByHash.submitted_at).toLocaleDateString()} (Status: ${existingByHash.status}).`,
          });
          return;
        } else {
          res.status(409).json({
            error: `Academic Integrity Violation: This exact certificate document was already submitted by another student (${existingByHash.student_name}, ${existingByHash.student_roll_no}). Collusion is strictly prohibited.`,
          });
          return;
        }
      }
    }

    let finalAiAudit = ai_audit_results ? (typeof ai_audit_results === 'string' ? ai_audit_results : JSON.stringify(ai_audit_results)) : null;

    // Check if certificate_id in AI audit results is already used by another student
    let parsedAudit: any = null;
    try {
      parsedAudit = typeof finalAiAudit === 'string' ? JSON.parse(finalAiAudit) : finalAiAudit;
    } catch {}

    if (parsedAudit && parsedAudit.certificate_id && typeof parsedAudit.certificate_id === 'string' && parsedAudit.certificate_id.trim().length > 3) {
      const certIdToTest = parsedAudit.certificate_id.trim();
      const existingByCertId = await queryOne(`
        SELECT 
          s.id, 
          s.student_id, 
          s.activity_title, 
          s.submitted_at, 
          u.name as student_name, 
          u.roll_no as student_roll_no
        FROM submissions s
        JOIN users u ON s.student_id = u.id
        WHERE s.ai_audit_results IS NOT NULL
          AND json_extract(s.ai_audit_results, '$.certificate_id') = ?
          AND s.student_id != ?
        LIMIT 1
      `, [certIdToTest, req.user!.id]);

      if (existingByCertId) {
        res.status(409).json({
          error: `Duplicate Credential ID: Credential ID "${certIdToTest}" has already been claimed by student ${existingByCertId.student_name} (${existingByCertId.student_roll_no}) for "${existingByCertId.activity_title}". Reusing credentials is not permitted.`,
        });
        return;
      }
    }

    let initialVerificationStatus = 'pre_verified';
    
    // Asynchronous AI Audit Queue: If pre-scan audit wasn't provided, enqueue in background
    if (!finalAiAudit) {
      initialVerificationStatus = 'auditing';
      aiAuditQueue.enqueue({
        submissionId: id,
        filePath: file_url,
        studentName: req.user?.name,
        rollNo: req.user?.roll_no,
      });
    }

    await executeRun(`
      INSERT INTO submissions (
        id, student_id, schema_id, schema_version_snapshot, activity_title, category_id,
        description, file_url, file_name, file_size, file_hash, status, points_awarded,
        hours_spent, credential_hash, qr_code_data, verification_status,
        semester, mentor_feedback, ai_audit_results, completion_date, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?, ?, ?, ?, NULL, ?, ?, ?)
    `, [
      id,
      req.user!.id,
      schemaRule.id,
      schemaRule.version || 1,
      activity_title.trim(),
      schemaRule.category_id || 'cat_technical',
      description ? description.trim() : '',
      file_url,
      file_name || path.basename(file_url),
      file_size || 1024,
      calculatedFileHash || null,
      hoursVal,
      credentialHash,
      qrCodeData,
      initialVerificationStatus,
      subSemester,
      finalAiAudit,
      completion_date,
      now,
    ]);

    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'ACTIVITY_SUBMITTED', ?, ?)
    `, [`log_${Date.now()}`, req.user!.id, `Submitted "${activity_title}" for verification against rule "${schemaRule.activity_name}" (v${schemaRule.version})`, now]);

    // Notify assigned mentor of new certificate submission
    const studentUser = await queryOne<{ id: string; name: string; roll_no: string; mentor_id: string }>(
      'SELECT id, name, roll_no, mentor_id FROM users WHERE id = ?',
      [req.user!.id]
    );

    if (studentUser?.mentor_id) {
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await executeRun(`
        INSERT INTO notifications (
          id, sender_id, sender_name, sender_role, recipient_id, recipient_role, category,
          title, message, is_read, created_at
        ) VALUES (?, ?, ?, 'student', ?, 'mentor', 'activity', ?, ?, 0, ?)
      `, [
        notifId,
        studentUser.id,
        studentUser.name,
        studentUser.mentor_id,
        `New Certificate Submitted: ${activity_title.trim()}`,
        `${studentUser.name} (${studentUser.roll_no || 'USN'}) submitted a certificate for "${activity_title.trim()}" awaiting your verification.`,
        now,
      ]);
    }

    const created = await queryOne(`
      SELECT 
        s.*,
        sch.activity_name as schema_activity_name,
        sch.base_points,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        u.name as student_name
      FROM submissions s
      JOIN activity_schema sch ON s.schema_id = sch.id
      JOIN schema_categories c ON s.category_id = c.id
      JOIN users u ON s.student_id = u.id
      WHERE s.id = ?
    `, [id]);

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2b. Check Annual Eligibility for ANY Certificate Type (AICTE 1-per-year rule)
router.get('/check-annual-eligibility', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const semester = req.query.semester ? Number(req.query.semester) : (req.user?.semester || 1);
    const completionDate = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const schemaId = req.query.schema_id as string | undefined;
    const activityTitle = (req.query.activity_title as string) || '';
    const targetYear = Math.ceil(semester / 2);

    if (!activityTitle && !schemaId) {
      res.json({ eligible: true, target_year: targetYear, message: 'Eligible: No certificate specified.' });
      return;
    }

    let schemaRule = null;
    if (schemaId) {
      schemaRule = await queryOne('SELECT * FROM activity_schema WHERE id = ?', [schemaId]);
    }
    const maxPerYear = Number(schemaRule?.max_per_year || 1);

    const existingSubmission = await queryOne(`
      SELECT 
        s.id, 
        s.activity_title, 
        s.semester, 
        s.submitted_at, 
        s.completion_date, 
        s.status,
        sch.activity_name as schema_name
      FROM submissions s
      LEFT JOIN activity_schema sch ON s.schema_id = sch.id
      WHERE s.student_id = ?
        AND s.status != 'rejected'
        AND (
          (s.schema_id IS NOT NULL AND s.schema_id = ?)
          OR LOWER(TRIM(s.activity_title)) = LOWER(TRIM(?))
          OR (sch.activity_name IS NOT NULL AND LOWER(TRIM(sch.activity_name)) = LOWER(TRIM(?)))
          OR (
            (LOWER(s.activity_title) LIKE '%blood%' OR (sch.activity_name IS NOT NULL AND LOWER(sch.activity_name) LIKE '%blood%'))
            AND (LOWER(?) LIKE '%blood%' OR LOWER(?) LIKE '%blood%')
          )
        )
        AND (
          CAST(((s.semester + 1) / 2) AS INTEGER) = ?
          OR strftime('%Y', s.completion_date) = strftime('%Y', ?)
        )
      LIMIT 1
    `, [
      req.user!.id,
      schemaId || 'none',
      activityTitle,
      schemaRule?.activity_name || activityTitle,
      activityTitle,
      schemaRule?.activity_name || activityTitle,
      targetYear,
      completionDate,
    ]);

    if (existingSubmission) {
      res.json({
        eligible: false,
        target_year: targetYear,
        max_per_year: maxPerYear,
        existing_submission: existingSubmission,
        message: `Annual Policy Restriction: You already have a submission for "${existingSubmission.activity_title}" in Academic Year ${targetYear} (Semester ${existingSubmission.semester}, Status: ${existingSubmission.status}). University guidelines permit only ${maxPerYear} certificate claim(s) of this kind per academic year.`,
      });
    } else {
      res.json({
        eligible: true,
        target_year: targetYear,
        max_per_year: maxPerYear,
        message: `Eligible: No prior submissions found for this certificate kind in Academic Year ${targetYear}.`,
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2c. Check Blood Donation Eligibility (Backward compatibility)
router.get('/check-blood-eligibility', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const semester = req.query.semester ? Number(req.query.semester) : (req.user?.semester || 1);
    const completionDate = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const targetYear = Math.ceil(semester / 2);

    const existingBlood = await queryOne(`
      SELECT 
        s.id, 
        s.activity_title, 
        s.semester, 
        s.submitted_at, 
        s.completion_date, 
        s.status
      FROM submissions s
      LEFT JOIN activity_schema sch ON s.schema_id = sch.id
      WHERE s.student_id = ?
        AND s.status != 'rejected'
        AND (
          s.schema_id IN ('sch_vol_2', 'sch_vol_3')
          OR LOWER(s.activity_title) LIKE '%blood%'
          OR (sch.activity_name IS NOT NULL AND LOWER(sch.activity_name) LIKE '%blood%')
        )
        AND (
          CAST(((s.semester + 1) / 2) AS INTEGER) = ?
          OR strftime('%Y', s.completion_date) = strftime('%Y', ?)
        )
      LIMIT 1
    `, [req.user!.id, targetYear, completionDate]);

    if (existingBlood) {
      res.json({
        eligible: false,
        target_year: targetYear,
        existing_submission: existingBlood,
        message: `You already have an active blood donation submission for Academic Year ${targetYear} (Semester ${existingBlood.semester}): "${existingBlood.activity_title}". University regulations allow credit for blood donation only once per academic year.`,
      });
    } else {
      res.json({
        eligible: true,
        target_year: targetYear,
        message: `Eligible: No prior blood donation credits claimed for Academic Year ${targetYear}.`,
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Student's Own Submissions
router.get('/my', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const submissions = await queryAll(`
      SELECT 
        s.*,
        sch.activity_name as schema_activity_name,
        sch.base_points,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        reviewer.name as reviewer_name
      FROM submissions s
      JOIN activity_schema sch ON s.schema_id = sch.id
      JOIN schema_categories c ON s.category_id = c.id
      LEFT JOIN users reviewer ON s.reviewed_by = reviewer.id
      WHERE s.student_id = ?
      ORDER BY s.submitted_at DESC
    `, [req.user!.id]);

    res.json(submissions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get Assigned Mentees' Submissions (Mentor only)
router.get(['/assigned', '/mentee'], authenticate, requireRole(['mentor', 'hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    let sql = `
      SELECT 
        s.*,
        sch.activity_name as schema_activity_name,
        sch.base_points,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        u.name as student_name,
        u.roll_no as student_roll_no,
        u.semester as student_semester,
        u.cgpa as student_cgpa,
        reviewer.name as reviewer_name
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      JOIN activity_schema sch ON s.schema_id = sch.id
      JOIN schema_categories c ON s.category_id = c.id
      LEFT JOIN users reviewer ON s.reviewed_by = reviewer.id
    `;
    const params: any[] = [];

    if (req.user!.role === 'mentor') {
      sql += ` WHERE u.mentor_id = ?`;
      params.push(req.user!.id);
    }

    sql += ` ORDER BY CASE s.status WHEN 'pending' THEN 1 WHEN 'approved' THEN 2 WHEN 'rejected' THEN 3 END, s.submitted_at DESC`;

    const submissions = await queryAll(sql, params);
    res.json(submissions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4b. Batch Review Submissions (Mentor or HOD)
router.post('/batch-review', authenticate, requireRole(['mentor', 'hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submission_ids, action, mentor_feedback } = req.body;

    if (!Array.isArray(submission_ids) || submission_ids.length === 0) {
      res.status(400).json({ error: 'submission_ids array is required and must not be empty' });
      return;
    }

    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ error: "action must be 'approve' or 'reject'" });
      return;
    }

    const now = new Date().toISOString();
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const verStatus = action === 'approve' ? 'verified' : 'rejected';

    let processedCount = 0;
    for (const subId of submission_ids) {
      const submission = await queryOne(`
        SELECT s.*, sch.base_points, u.mentor_id, u.name as student_name
        FROM submissions s
        JOIN activity_schema sch ON s.schema_id = sch.id
        JOIN users u ON s.student_id = u.id
        WHERE s.id = ?
      `, [subId]);

      if (!submission) continue;

      if (req.user!.role === 'mentor' && submission.mentor_id !== req.user!.id) {
        continue;
      }

      const pointsAwarded = action === 'approve' ? Number(submission.base_points || 20) : 0;

      await executeRun(`
        UPDATE submissions
        SET 
          status = ?,
          points_awarded = ?,
          mentor_feedback = COALESCE(?, mentor_feedback),
          reviewed_at = ?,
          reviewed_by = ?,
          verification_status = ?
        WHERE id = ?
      `, [
        newStatus,
        pointsAwarded,
        mentor_feedback ? mentor_feedback.trim() : (action === 'approve' ? 'Batch verified & approved' : 'Rejected in batch review'),
        now,
        req.user!.id,
        verStatus,
        subId,
      ]);

      await executeRun(`
        INSERT INTO activity_logs (id, user_id, action, details, created_at)
        VALUES (?, ?, 'SUBMISSION_EVALUATED', ?, ?)
      `, [
        `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        req.user!.id,
        `${req.user!.name} batch-evaluated submission "${submission.activity_title}" for ${submission.student_name}: ${action.toUpperCase()} (${pointsAwarded} pts)`,
        now,
      ]);

      // Notify student of evaluation result
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const notifTitle = action === 'approve'
        ? `Certificate Approved: ${submission.activity_title}`
        : `Certificate Rejected: ${submission.activity_title}`;
      const notifMsg = action === 'approve'
        ? `Your mentor ${req.user!.name} approved "${submission.activity_title}" (+${pointsAwarded} activity points).`
        : `Your mentor ${req.user!.name} rejected "${submission.activity_title}".`;

      await executeRun(`
        INSERT INTO notifications (
          id, sender_id, sender_name, sender_role, recipient_id, recipient_role, category,
          title, message, is_read, created_at
        ) VALUES (?, ?, ?, 'mentor', ?, 'student', 'activity', ?, ?, 0, ?)
      `, [
        notifId,
        req.user!.id,
        req.user!.name,
        submission.student_id,
        notifTitle,
        notifMsg,
        now,
      ]);

      processedCount++;
    }

    res.json({ success: true, processedCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Review Submission (Mentor or HOD)
router.post('/:id/review', authenticate, requireRole(['mentor', 'hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action, mentor_feedback, custom_points, verification_checklist } = req.body; // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ error: "action must be 'approve' or 'reject'" });
      return;
    }

    const submission = await queryOne(`
      SELECT s.*, sch.base_points, u.mentor_id, u.name as student_name
      FROM submissions s
      JOIN activity_schema sch ON s.schema_id = sch.id
      JOIN users u ON s.student_id = u.id
      WHERE s.id = ?
    `, [id]);

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    // Role check: Mentors can only evaluate their own assigned mentees
    if (req.user!.role === 'mentor' && submission.mentor_id !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized: Student is not assigned to you' });
      return;
    }

    // Strict Policy Check: Do not approve multiple submissions of the same certificate kind in the same academic year
    if (action === 'approve') {
      const targetYear = Math.ceil((submission.semester || 1) / 2);
      const priorApprovedSameType = await queryOne(`
        SELECT s.id, s.activity_title, s.semester, s.reviewed_at
        FROM submissions s
        LEFT JOIN activity_schema sch ON s.schema_id = sch.id
        WHERE s.student_id = ?
          AND s.id != ?
          AND s.status = 'approved'
          AND (
            (s.schema_id IS NOT NULL AND s.schema_id = ?)
            OR LOWER(TRIM(s.activity_title)) = LOWER(TRIM(?))
            OR (sch.activity_name IS NOT NULL AND LOWER(TRIM(sch.activity_name)) = LOWER(TRIM(?)))
            OR (
              (LOWER(s.activity_title) LIKE '%blood%' OR (sch.activity_name IS NOT NULL AND LOWER(sch.activity_name) LIKE '%blood%'))
              AND LOWER(?) LIKE '%blood%'
            )
          )
          AND (
            CAST(((s.semester + 1) / 2) AS INTEGER) = ?
            OR strftime('%Y', s.completion_date) = strftime('%Y', ?)
          )
        LIMIT 1
      `, [
        submission.student_id,
        id,
        submission.schema_id,
        submission.activity_title,
        submission.activity_title,
        submission.activity_title,
        targetYear,
        submission.completion_date,
      ]);

      if (priorApprovedSameType) {
        res.status(400).json({
          error: `Cannot approve: Student ${submission.student_name} already has an approved certificate for "${priorApprovedSameType.activity_title}" in Academic Year ${targetYear} (Semester ${priorApprovedSameType.semester}). AICTE/University policy allows only 1 certificate claim of this type per academic year.`,
        });
        return;
      }
    }

    const now = new Date().toISOString();
    const rawPoints = Number(custom_points !== undefined ? custom_points : submission.base_points);
    const safePoints = isNaN(rawPoints) ? Number(submission.base_points || 20) : Math.max(0, Math.min(100, rawPoints));
    const pointsAwarded = action === 'approve' ? safePoints : 0;
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const verStatus = action === 'approve' ? 'verified' : 'rejected';
    const checklistStr = verification_checklist ? (typeof verification_checklist === 'string' ? verification_checklist : JSON.stringify(verification_checklist)) : null;

    await executeRun(`
      UPDATE submissions
      SET 
        status = ?,
        points_awarded = ?,
        mentor_feedback = ?,
        reviewed_at = ?,
        reviewed_by = ?,
        verification_status = ?,
        verification_checklist = ?
      WHERE id = ?
    `, [newStatus, pointsAwarded, mentor_feedback ? mentor_feedback.trim() : null, now, req.user!.id, verStatus, checklistStr, id]);

    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'SUBMISSION_EVALUATED', ?, ?)
    `, [
      `log_${Date.now()}`,
      req.user!.id,
      `${req.user!.name} evaluated submission "${submission.activity_title}" for ${submission.student_name}: ${action.toUpperCase()} (${pointsAwarded} pts)`,
      now,
    ]);

    // Dispatch direct notification to student with mentor's decision and feedback
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const notifTitle = action === 'approve'
      ? `Certificate Approved: ${submission.activity_title}`
      : `Certificate Rejected: ${submission.activity_title}`;
    const notifMsg = action === 'approve'
      ? `Your mentor ${req.user!.name} approved "${submission.activity_title}" (+${pointsAwarded} activity points).${mentor_feedback ? ' Note: ' + mentor_feedback.trim() : ''}`
      : `Your mentor ${req.user!.name} rejected "${submission.activity_title}".${mentor_feedback ? ' Reason: ' + mentor_feedback.trim() : ''}`;

    await executeRun(`
      INSERT INTO notifications (
        id, sender_id, sender_name, sender_role, recipient_id, recipient_role, category,
        title, message, is_read, created_at
      ) VALUES (?, ?, ?, 'mentor', ?, 'student', 'activity', ?, ?, 0, ?)
    `, [
      notifId,
      req.user!.id,
      req.user!.name,
      submission.student_id,
      notifTitle,
      notifMsg,
      now,
    ]);

    const updated = await queryOne(`
      SELECT 
        s.*,
        sch.activity_name as schema_activity_name,
        sch.base_points,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        u.name as student_name,
        reviewer.name as reviewer_name
      FROM submissions s
      JOIN activity_schema sch ON s.schema_id = sch.id
      JOIN schema_categories c ON s.category_id = c.id
      JOIN users u ON s.student_id = u.id
      LEFT JOIN users reviewer ON s.reviewed_by = reviewer.id
      WHERE s.id = ?
    `, [id]);

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Real Gemini Vision Multimodal Certificate Pre-Audit (Student/Mentor/HOD)
router.post('/ai-audit-file', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { file_url, student_name, roll_no } = req.body;
    if (!file_url) {
      res.status(400).json({ error: 'file_url is required' });
      return;
    }

    const auditResult = await auditCertificateFile(file_url, {
      name: student_name || req.user?.name,
      roll_no: roll_no || req.user?.roll_no,
    });

    // Semantic Duplicate Check: Verify if the extracted certificate_id is already in the database
    if (auditResult.certificate_id && auditResult.certificate_id.trim().length > 3) {
      const cleanCertId = auditResult.certificate_id.trim();
      const existingCert = await queryOne(`
        SELECT 
          s.id,
          s.activity_title,
          s.student_id,
          s.submitted_at,
          u.name as student_name,
          u.roll_no as student_roll_no
        FROM submissions s
        JOIN users u ON s.student_id = u.id
        WHERE s.ai_audit_results IS NOT NULL
          AND json_extract(s.ai_audit_results, '$.certificate_id') = ?
        LIMIT 1
      `, [cleanCertId]);

      if (existingCert) {
        const isSelf = existingCert.student_id === req.user?.id;
        auditResult.authenticity_status = 'SUSPICIOUS';
        if (!auditResult.anomalies_detected) auditResult.anomalies_detected = [];
        const msg = isSelf
          ? `Duplicate Credential ID: Credential "${cleanCertId}" was already claimed by you on ${new Date(existingCert.submitted_at).toLocaleDateString()} for "${existingCert.activity_title}".`
          : `Credential Reuse Alert: Credential ID "${cleanCertId}" was already submitted by student ${existingCert.student_name} (${existingCert.student_roll_no}) for "${existingCert.activity_title}".`;

        auditResult.anomalies_detected.push(msg);
        auditResult.duplicate_credential_info = {
          type: isSelf ? 'self' : 'collusion',
          certificate_id: cleanCertId,
          original_submission_id: existingCert.id,
          activity_title: existingCert.activity_title,
          student_name: existingCert.student_name,
          student_roll_no: existingCert.student_roll_no,
          submitted_at: existingCert.submitted_at,
          message: msg,
        };
      }
    }

    res.json(auditResult);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Audit Existing Submission Certificate with Gemini Vision
router.post('/:id/ai-audit', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const submission = await queryOne(`
      SELECT s.*, u.name as student_name, u.roll_no as student_roll_no, u.mentor_id
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.id = ?
    `, [id]);

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    // Role check: Student can only audit own submission, mentor can audit assigned mentee, HOD can audit all
    if (req.user!.role === 'student' && submission.student_id !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized to audit this submission' });
      return;
    }
    if (req.user!.role === 'mentor' && submission.mentor_id !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized: Student is not assigned to you' });
      return;
    }

    const auditResult = await auditCertificateFile(submission.file_url, {
      name: submission.student_name,
      roll_no: submission.student_roll_no,
    });

    // Save audit result to database
    await executeRun(`
      UPDATE submissions
      SET ai_audit_results = ?
      WHERE id = ?
    `, [JSON.stringify(auditResult), id]);

    res.json({
      success: true,
      submission_id: id,
      audit: auditResult,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Real-time Status of Background AI Verification
router.get('/:id/audit-status', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const submission = await queryOne(`
      SELECT s.id, s.student_id, s.verification_status, s.ai_audit_results, s.status, s.points_awarded, u.mentor_id
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.id = ?
    `, [id]);

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    // Role check: Student can only view own submission audit, mentor can inspect assigned mentee, HOD/Dean can inspect all
    if (req.user!.role === 'student' && submission.student_id !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized to view audit status for this submission' });
      return;
    }
    if (req.user!.role === 'mentor' && submission.mentor_id && submission.mentor_id !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized: Student is not assigned to you' });
      return;
    }

    const isQueued = aiAuditQueue.isQueued(id);

    let parsedAudit = null;
    if (submission.ai_audit_results) {
      try {
        parsedAudit = JSON.parse(submission.ai_audit_results);
      } catch {
        parsedAudit = submission.ai_audit_results;
      }
    }

    res.json({
      submission_id: id,
      verification_status: submission.verification_status,
      is_queued: isQueued,
      ai_audit_results: parsedAudit,
      status: submission.status,
      points_awarded: submission.points_awarded,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
