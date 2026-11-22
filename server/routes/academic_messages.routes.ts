import { Router, Response } from 'express';
import { queryAll, queryOne, executeRun } from '../db/database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * 1. GET /status
 * Returns allocation status for current user (student or mentor)
 */
router.get('/status', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;

    if (user.role === 'student') {
      const student = await queryOne<{
        id: string;
        name: string;
        roll_no: string;
        mentor_id: string | null;
      }>(
        `SELECT id, name, roll_no, mentor_id FROM users WHERE id = ?`,
        [user.id]
      );

      if (!student || !student.mentor_id) {
        res.json({
          isAllocated: false,
          role: 'student',
          mentor: null,
          message: 'No faculty mentor is currently allocated. Academic messaging is disabled.',
        });
        return;
      }

      const mentor = await queryOne<{
        id: string;
        name: string;
        email: string;
        designation: string | null;
        office_location: string | null;
        avatar: string | null;
      }>(
        `SELECT id, name, email, designation, office_location, avatar FROM users WHERE id = ?`,
        [student.mentor_id]
      );

      res.json({
        isAllocated: true,
        role: 'student',
        mentor,
      });
    } else if (user.role === 'mentor') {
      const activeMentees = await queryAll<{
        id: string;
        name: string;
        roll_no: string;
        email: string;
        semester: number;
        avatar: string | null;
      }>(
        `SELECT id, name, roll_no, email, semester, avatar
         FROM users
         WHERE role = 'student' AND mentor_id = ?
         ORDER BY name ASC`,
        [user.id]
      );

      res.json({
        isAllocated: activeMentees.length > 0,
        role: 'mentor',
        activeMenteesCount: activeMentees.length,
        activeMentees,
      });
    } else {
      // HOD or Dean
      res.json({
        isAllocated: true,
        role: user.role,
        message: 'Administrative account: academic messaging is scoped to student-mentor guidance.',
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2. GET /thread
 * Returns the conversation thread between mentee and mentor.
 * Dynamically enforces allocation:
 * - If student: only loads messages with currently assigned mentor.
 * - If mentor: requires ?student_id, and verifies that student is actively allocated to this mentor.
 */
router.get('/thread', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;

    if (user.role === 'student') {
      const student = await queryOne<{ mentor_id: string | null }>(
        `SELECT mentor_id FROM users WHERE id = ?`,
        [user.id]
      );

      if (!student || !student.mentor_id) {
        res.json({
          isAllocated: false,
          mentor: null,
          messages: [],
          notice: 'Academic messaging is locked because you have no assigned faculty mentor.',
        });
        return;
      }

      const mentor = await queryOne<{
        id: string;
        name: string;
        email: string;
        designation: string | null;
        office_location: string | null;
      }>(
        `SELECT id, name, email, designation, office_location FROM users WHERE id = ?`,
        [student.mentor_id]
      );

      const messages = await queryAll(
        `SELECT * FROM academic_messages
         WHERE (sender_id = ? AND recipient_id = ?)
            OR (sender_id = ? AND recipient_id = ?)
         ORDER BY created_at ASC`,
        [user.id, student.mentor_id, student.mentor_id, user.id]
      );

      res.json({
        isAllocated: true,
        mentor,
        messages,
      });
    } else if (user.role === 'mentor') {
      const studentId = req.query.student_id as string;

      // Mentors must select a mentee
      if (!studentId) {
        // Return first allocated mentee thread if available
        const firstMentee = await queryOne<{ id: string }>(
          `SELECT id FROM users WHERE role = 'student' AND mentor_id = ? ORDER BY name ASC LIMIT 1`,
          [user.id]
        );

        if (!firstMentee) {
          res.json({
            isAllocated: false,
            student: null,
            messages: [],
            notice: 'You currently have no mentees allocated to you.',
          });
          return;
        }

        const messages = await queryAll(
          `SELECT * FROM academic_messages
           WHERE (sender_id = ? AND recipient_id = ?)
              OR (sender_id = ? AND recipient_id = ?)
           ORDER BY created_at ASC`,
          [user.id, firstMentee.id, firstMentee.id, user.id]
        );

        const studentData = await queryOne(
          `SELECT id, name, roll_no, email, semester FROM users WHERE id = ?`,
          [firstMentee.id]
        );

        res.json({
          isAllocated: true,
          student: studentData,
          messages,
        });
        return;
      }

      // Verify that this specific student is actively allocated to this mentor
      const allocatedStudent = await queryOne<{
        id: string;
        name: string;
        roll_no: string;
        email: string;
        semester: number;
        mentor_id: string | null;
      }>(
        `SELECT id, name, roll_no, email, semester, mentor_id
         FROM users
         WHERE id = ? AND role = 'student'`,
        [studentId]
      );

      if (!allocatedStudent || allocatedStudent.mentor_id !== user.id) {
        res.status(403).json({
          isAllocated: false,
          error: 'Student is not currently allocated to you. Messaging is prohibited.',
          messages: [],
        });
        return;
      }

      const messages = await queryAll(
        `SELECT * FROM academic_messages
         WHERE (sender_id = ? AND recipient_id = ?)
            OR (sender_id = ? AND recipient_id = ?)
         ORDER BY created_at ASC`,
        [user.id, studentId, studentId, user.id]
      );

      res.json({
        isAllocated: true,
        student: allocatedStudent,
        messages,
      });
    } else {
      res.json({
        isAllocated: false,
        messages: [],
        notice: 'Direct 1-on-1 academic messaging is reserved for Mentees and Mentors.',
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 3. POST /
 * Sends a message between allocated mentee and mentor.
 * STOPS IMMEDIATELY IF DEALLOCATED.
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { message, category = 'general', subject = 'Academic Guidance', recipient_id } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Message content is required.' });
      return;
    }

    let targetRecipientId: string;
    let targetRecipientName: string;
    let targetRecipientRole: string;

    if (user.role === 'student') {
      // Look up current mentor allocation
      const student = await queryOne<{ mentor_id: string | null }>(
        `SELECT mentor_id FROM users WHERE id = ?`,
        [user.id]
      );

      if (!student || !student.mentor_id) {
        res.status(403).json({
          error: 'You do not have an active allocated mentor. Academic messaging is disabled.',
        });
        return;
      }

      const mentor = await queryOne<{ id: string; name: string }>(
        `SELECT id, name FROM users WHERE id = ? AND role = 'mentor'`,
        [student.mentor_id]
      );

      if (!mentor) {
        res.status(403).json({
          error: 'Assigned faculty mentor was not found in institutional directory.',
        });
        return;
      }

      targetRecipientId = mentor.id;
      targetRecipientName = mentor.name;
      targetRecipientRole = 'mentor';
    } else if (user.role === 'mentor') {
      if (!recipient_id) {
        res.status(400).json({ error: 'Mentee recipient_id is required.' });
        return;
      }

      // Verify that this mentee is actively allocated to THIS mentor
      const mentee = await queryOne<{ id: string; name: string; mentor_id: string | null }>(
        `SELECT id, name, mentor_id FROM users WHERE id = ? AND role = 'student'`,
        [recipient_id]
      );

      if (!mentee || mentee.mentor_id !== user.id) {
        res.status(403).json({
          error: 'This student is not allocated to you. Messaging stops once a mentee is deallocated.',
        });
        return;
      }

      targetRecipientId = mentee.id;
      targetRecipientName = mentee.name;
      targetRecipientRole = 'student';
    } else {
      res.status(403).json({
        error: 'Only allocated students and faculty mentors can exchange academic messages.',
      });
      return;
    }

    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    await executeRun(
      `INSERT INTO academic_messages (
        id, sender_id, sender_name, sender_role,
        recipient_id, recipient_name, recipient_role,
        subject, message, category, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        msgId,
        user.id,
        user.name,
        user.role,
        targetRecipientId,
        targetRecipientName,
        targetRecipientRole,
        subject.trim(),
        message.trim(),
        category,
        now,
      ]
    );

    // Also mirror to notifications table for unread badge support
    try {
      const notifId = `notif_msg_${Date.now()}`;
      await executeRun(
        `INSERT INTO notifications (
          id, sender_id, sender_name, sender_role,
          recipient_id, recipient_role, category,
          title, message, is_read, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'academic_message', ?, ?, 0, ?)`,
        [
          notifId,
          user.id,
          user.name,
          user.role,
          targetRecipientId,
          targetRecipientRole,
          `Message from ${user.name}: ${subject}`,
          message.trim().substring(0, 160),
          now,
        ]
      );
    } catch {}

    const created = await queryOne(`SELECT * FROM academic_messages WHERE id = ?`, [msgId]);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 4. POST /mark-read
 * Marks messages in thread as read
 */
router.post('/mark-read', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { partner_id } = req.body;

    if (partner_id) {
      await executeRun(
        `UPDATE academic_messages
         SET is_read = 1
         WHERE recipient_id = ? AND sender_id = ?`,
        [user.id, partner_id]
      );
    } else {
      await executeRun(
        `UPDATE academic_messages
         SET is_read = 1
         WHERE recipient_id = ?`,
        [user.id]
      );
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
