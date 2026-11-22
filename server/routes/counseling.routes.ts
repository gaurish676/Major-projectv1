import { Router, Response } from 'express';
import { queryAll, queryOne, executeRun } from '../db/database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { CounselingLog } from '../../src/types';

const router = Router();

// 1. Submit a Counseling Intervention Note & Notify Mentee
router.post('/', authenticate, requireRole(['mentor', 'hod', 'dean']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      student_id,
      subject_code,
      subject_name,
      mse_marks,
      mse_max = 30,
      reason,
      counseling_notes,
      action_plan,
    } = req.body;

    if (!student_id || !counseling_notes || !action_plan) {
      res.status(400).json({ error: 'student_id, counseling_notes, and action_plan are required' });
      return;
    }

    const student = await queryOne('SELECT id, name, mentor_id, roll_no FROM users WHERE id = ?', [student_id]);
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    const cslId = `csl_${Date.now()}`;
    const now = new Date().toISOString();

    await executeRun(`
      INSERT INTO counseling_logs (
        id, mentor_id, student_id, subject_code, subject_name,
        mse_marks, mse_max, reason, counseling_notes, action_plan,
        status, student_acknowledged, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', 0, ?)
    `, [
      cslId,
      req.user!.id,
      student.id,
      subject_code || 'GEN-CIE',
      subject_name || 'Mid-Semester Exam Performance',
      Number(mse_marks) || 0,
      Number(mse_max) || 30,
      reason || 'MSE Remedial Academic Counseling',
      counseling_notes.trim(),
      action_plan.trim(),
      now,
    ]);

    // Dispatch instant notification to mentee
    const notifId = `notif_csl_${Date.now()}`;
    const notifTitle = `Academic Performance Counseling: ${subject_name || 'MSE Review'}`;
    const notifMessage = `Dear ${student.name}, your mentor ${req.user!.name} has initiated an academic counseling action plan regarding your recent Mid-Semester Exam (MSE) performance. Please review the recommended remedial steps in your portal.`;

    await executeRun(`
      INSERT INTO notifications (
        id, sender_id, sender_name, sender_role, recipient_id, recipient_role, category,
        title, message, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, 'student', 'meeting', ?, ?, 0, ?)
    `, [
      notifId,
      req.user!.id,
      req.user!.name,
      req.user!.role,
      student.id,
      notifTitle,
      notifMessage,
      now,
    ]);

    // Activity Log
    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'COUNSELING_RECORDED', ?, ?)
    `, [
      `log_${Date.now()}`,
      req.user!.id,
      `Conducted MSE academic counseling with ${student.name} (${student.roll_no}) for ${subject_name || 'CIE'}`,
      now,
    ]);

    const created = await queryOne('SELECT * FROM counseling_logs WHERE id = ?', [cslId]);
    res.status(201).json({ success: true, counseling: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Counseling Logs for a Student
router.get('/student/:studentId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const user = req.user!;

    // Enforce authorization: Students can only view their own counseling logs. Mentors can view their mentees.
    if (user.role === 'student' && user.id !== studentId) {
      res.status(403).json({ error: 'Access denied: You cannot view another student\'s counseling logs.' });
      return;
    }

    if (user.role === 'mentor') {
      const student = await queryOne('SELECT mentor_id FROM users WHERE id = ?', [studentId]);
      if (student && student.mentor_id && student.mentor_id !== user.id) {
        res.status(403).json({ error: 'Access denied: You are not the assigned mentor for this student.' });
        return;
      }
    }

    const logs = await queryAll(`
      SELECT 
        c.*,
        m.name as mentor_name,
        s.name as student_name,
        s.roll_no as student_roll_no
      FROM counseling_logs c
      JOIN users m ON c.mentor_id = m.id
      JOIN users s ON c.student_id = s.id
      WHERE c.student_id = ?
      ORDER BY c.created_at DESC
    `, [studentId]);

    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Student's Own Counseling Notices
router.get('/my', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await queryAll(`
      SELECT 
        c.*,
        m.name as mentor_name
      FROM counseling_logs c
      JOIN users m ON c.mentor_id = m.id
      WHERE c.student_id = ?
      ORDER BY c.created_at DESC
    `, [req.user!.id]);

    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Student Acknowledge Counseling
router.post('/:id/acknowledge', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await executeRun(`
      UPDATE counseling_logs
      SET student_acknowledged = 1, status = 'in_progress'
      WHERE id = ? AND student_id = ?
    `, [id, req.user!.id]);

    res.json({ success: true, message: 'Action plan acknowledged.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Update MSE Marks & Auto-Trigger Mentor Alert on Poor Performance (Faculty Mentor/HOD/Dean Only)
router.put('/update-mse', authenticate, requireRole(['mentor', 'hod', 'dean']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { mark_id, mse1_marks, mse2_marks } = req.body;
    if (!mark_id) {
      res.status(400).json({ error: 'mark_id is required' });
      return;
    }

    const mark = await queryOne(`
      SELECT sm.*, u.name as student_name, u.mentor_id, u.roll_no
      FROM student_marks sm
      JOIN users u ON sm.student_id = u.id
      WHERE sm.id = ?
    `, [mark_id]);

    if (!mark) {
      res.status(404).json({ error: 'Mark entry not found' });
      return;
    }

    if (req.user!.role === 'mentor' && mark.mentor_id && mark.mentor_id !== req.user!.id) {
      res.status(403).json({ error: 'Access denied: You can only update MSE marks for your assigned mentees.' });
      return;
    }

    const m1 = mse1_marks !== undefined ? Math.max(0, Math.min(30, Number(mse1_marks))) : Number(mark.mse1_marks);
    const m2 = mse2_marks !== undefined ? Math.max(0, Math.min(30, Number(mse2_marks))) : Number(mark.mse2_marks);
    const isPoor = (m1 < 12 || m2 < 12) ? 1 : 0; // Less than 40% (12/30)

    const now = new Date().toISOString();

    await executeRun(`
      UPDATE student_marks
      SET 
        mse1_marks = ?,
        mse2_marks = ?,
        is_poor_performance = ?,
        updated_at = ?
      WHERE id = ?
    `, [m1, m2, isPoor, now, mark_id]);

    // If poor performance and mentor is assigned, trigger high-priority notification to mentor
    if (isPoor && mark.mentor_id) {
      const notifId = `notif_mse_alert_${Date.now()}`;
      const lowestMse = Math.min(m1, m2);
      const title = `🚨 Poor MSE Performance Alert: ${mark.student_name}`;
      const message = `Mentee ${mark.student_name} (${mark.roll_no || 'USN'}) scored below benchmark in ${mark.subject_name} (${lowestMse}/30, <40%). Immediate academic mentoring and remedial counseling recommended.`;

      await executeRun(`
        INSERT INTO notifications (
          id, sender_id, sender_name, sender_role, recipient_id, recipient_role, category,
          title, message, is_read, created_at
        ) VALUES (?, ?, ?, 'system', ?, 'mentor', 'meeting', ?, ?, 0, ?)
      `, [
        notifId,
        mark.student_id,
        mark.student_name,
        mark.mentor_id,
        title,
        message,
        now,
      ]);
    }

    const updated = await queryOne('SELECT * FROM student_marks WHERE id = ?', [mark_id]);
    res.json({
      success: true,
      mark: updated,
      is_poor_performance: Boolean(isPoor),
      mentor_notified: Boolean(isPoor && mark.mentor_id),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
