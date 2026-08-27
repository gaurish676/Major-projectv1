import { Router, Response } from 'express';
import { queryAll, queryOne, executeRun } from '../db/database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// 1. Get all events
router.get('/', async (req, res) => {
  try {
    const events = await queryAll(`
      SELECT 
        e.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        u.name as creator_name
      FROM events e
      JOIN schema_categories c ON e.category_id = c.id
      JOIN users u ON e.created_by = u.id
      ORDER BY e.event_date ASC
    `);
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Create Event (HOD or Mentor)
router.post('/', authenticate, requireRole(['hod', 'mentor']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, category_id, description, potential_points, event_date, venue, registration_link } = req.body;

    if (!title || !category_id || !description || potential_points === undefined || !event_date || !venue) {
      res.status(400).json({ error: 'title, category_id, description, potential_points, event_date, and venue are required' });
      return;
    }

    const id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    await executeRun(`
      INSERT INTO events (id, title, category_id, description, potential_points, event_date, venue, registration_link, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, title.trim(), category_id, description.trim(), Number(potential_points), event_date, venue.trim(), registration_link ? registration_link.trim() : null, req.user!.id, now]);

    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'EVENT_CREATED', ?, ?)
    `, [`log_${Date.now()}`, req.user!.id, `Posted new activity opportunity "${title}" (+${potential_points} pts)`, now]);

    const created = await queryOne(`
      SELECT e.*, c.name as category_name, c.color as category_color, u.name as creator_name
      FROM events e
      JOIN schema_categories c ON e.category_id = c.id
      JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `, [id]);

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
