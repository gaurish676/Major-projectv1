import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { queryAll, queryOne, executeRun } from '../db/database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { auditCertificateFile } from '../services/geminiAudit';

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

// 1. Upload File Endpoint
router.post('/upload', authenticate, upload.single('file'), (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      file_url: fileUrl,
      file_name: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
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

    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    let finalAiAudit = ai_audit_results ? (typeof ai_audit_results === 'string' ? ai_audit_results : JSON.stringify(ai_audit_results)) : null;
    
    // If not provided in body, try generating audit immediately
    if (!finalAiAudit) {
      try {
        const audit = await auditCertificateFile(file_url, {
          name: req.user?.name,
          roll_no: req.user?.roll_no,
        });
        finalAiAudit = JSON.stringify(audit);
      } catch (e) {
        console.warn('Initial AI audit skipped/failed:', e);
      }
    }

    await executeRun(`
      INSERT INTO submissions (
        id, student_id, schema_id, schema_version_snapshot, activity_title, category_id,
        description, file_url, file_name, file_size, status, points_awarded,
        semester, mentor_feedback, ai_audit_results, completion_date, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, NULL, ?, ?, ?)
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
      subSemester,
      finalAiAudit,
      completion_date,
      now,
    ]);

    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'ACTIVITY_SUBMITTED', ?, ?)
    `, [`log_${Date.now()}`, req.user!.id, `Submitted "${activity_title}" for verification against rule "${schemaRule.activity_name}" (v${schemaRule.version})`, now]);

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

// 5. Review Submission (Mentor or HOD)
router.post('/:id/review', authenticate, requireRole(['mentor', 'hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action, mentor_feedback, custom_points } = req.body; // action: 'approve' | 'reject'

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

    const now = new Date().toISOString();
    const pointsAwarded = action === 'approve' ? Number(custom_points !== undefined ? custom_points : submission.base_points) : 0;
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await executeRun(`
      UPDATE submissions
      SET 
        status = ?,
        points_awarded = ?,
        mentor_feedback = ?,
        reviewed_at = ?,
        reviewed_by = ?
      WHERE id = ?
    `, [newStatus, pointsAwarded, mentor_feedback ? mentor_feedback.trim() : null, now, req.user!.id, id]);

    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'SUBMISSION_EVALUATED', ?, ?)
    `, [
      `log_${Date.now()}`,
      req.user!.id,
      `${req.user!.name} evaluated submission "${submission.activity_title}" for ${submission.student_name}: ${action.toUpperCase()} (${pointsAwarded} pts)`,
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

export default router;
