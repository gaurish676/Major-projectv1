import { Router, Response } from 'express';
import { queryAll, queryOne, executeRun } from '../db/database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// 1. Get recipients available for sending notifications
router.get('/recipients', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    let recipients: any[] = [];

    if (user.role === 'hod') {
      // HOD can send to mentors
      recipients = await queryAll(`
        SELECT id, name, email, designation, office_location
        FROM users
        WHERE role = 'mentor' AND department_id = ?
        ORDER BY name ASC
      `, [user.department_id]);
    } else if (user.role === 'mentor') {
      // Mentor can send to their assigned mentees
      recipients = await queryAll(`
        SELECT id, name, roll_no, email, semester
        FROM users
        WHERE role = 'student' AND mentor_id = ?
        ORDER BY name ASC
      `, [user.id]);
    } else if (user.role === 'student') {
      // Student can send to their assigned mentor
      const studentRecord = await queryOne<{ mentor_id?: string }>(`SELECT mentor_id FROM users WHERE id = ?`, [user.id]);
      const mentorId = studentRecord?.mentor_id;
      if (mentorId) {
        recipients = await queryAll(`
          SELECT id, name, email, designation, office_location
          FROM users
          WHERE id = ?
        `, [mentorId]);
      }
    }

    res.json(recipients);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get user notifications
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    let notifications: any[] = [];

    if (user.role === 'hod') {
      notifications = await queryAll(`
        SELECT n.*
        FROM notifications n
        WHERE n.recipient_role = 'hod'
           OR n.recipient_id = ?
           OR n.sender_id = ?
           OR (n.sender_role = 'mentor' AND n.category = 'meeting')
        ORDER BY n.created_at DESC
        LIMIT 50
      `, [user.id, user.id]);
    } else if (user.role === 'mentor') {
      notifications = await queryAll(`
        SELECT n.*
        FROM notifications n
        WHERE (n.recipient_role = 'mentor' AND (n.recipient_id IS NULL OR n.recipient_id = ?))
           OR n.recipient_id = ?
           OR n.sender_id = ?
        ORDER BY n.created_at DESC
        LIMIT 50
      `, [user.id, user.id, user.id]);
    } else {
      // Student
      const studentRecord = await queryOne<{ mentor_id?: string }>(`SELECT mentor_id FROM users WHERE id = ?`, [user.id]);
      const mentorId = studentRecord?.mentor_id || '';
      notifications = await queryAll(`
        SELECT n.*
        FROM notifications n
        WHERE (n.recipient_role = 'student' AND (n.recipient_id = ? OR (n.recipient_id IS NULL AND n.sender_id = ?)))
           OR n.recipient_id = ?
           OR n.sender_id = ?
        ORDER BY n.created_at DESC
        LIMIT 50
      `, [user.id, mentorId, user.id, user.id]);
    }

    const unreadCount = notifications.filter((n) => n.is_read === 0 && n.sender_id !== user.id).length;

    res.json({
      notifications,
      unread_count: unreadCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Post a new notification / meeting announcement
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      title,
      message,
      category = 'meeting',
      meeting_time,
      meeting_venue,
      recipient_role,
      recipient_id,
    } = req.body;

    if (!title || !message) {
      res.status(400).json({ error: 'Title and message are required' });
      return;
    }

    let targetRole = recipient_role;
    let targetId = recipient_id || null;

    if (user.role === 'hod') {
      targetRole = recipient_role || 'mentor';
    } else if (user.role === 'mentor') {
      targetRole = recipient_role || 'student';
    } else if (user.role === 'student') {
      const studentRecord = await queryOne<{ mentor_id?: string }>(`SELECT mentor_id FROM users WHERE id = ?`, [user.id]);
      targetRole = 'mentor';
      targetId = studentRecord?.mentor_id || null;
    }

    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    await executeRun(`
      INSERT INTO notifications (
        id, sender_id, sender_name, sender_role,
        recipient_id, recipient_role, category,
        title, message, meeting_time, meeting_venue,
        is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `, [
      notifId,
      user.id,
      user.name,
      user.role,
      targetId,
      targetRole,
      category,
      title.trim(),
      message.trim(),
      meeting_time ? meeting_time.trim() : null,
      meeting_venue ? meeting_venue.trim() : null,
      now,
    ]);

    const created = await queryOne(`SELECT * FROM notifications WHERE id = ?`, [notifId]);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Mark all as read
router.post('/mark-read', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    await executeRun(`
      UPDATE notifications
      SET is_read = 1
      WHERE (recipient_id = ? OR recipient_role = ?) AND sender_id != ?
    `, [user.id, user.role, user.id]);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
