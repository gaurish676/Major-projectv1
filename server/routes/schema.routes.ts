import { Router, Response } from 'express';
import { queryAll, queryOne, executeRun } from '../db/database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// 1. Get all Schema Categories with Max Caps
router.get('/categories', async (req, res) => {
  try {
    const categories = await queryAll(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM activity_schema WHERE category_id = c.id AND is_active = 1) as rules_count
      FROM schema_categories c
      ORDER BY c.name ASC
    `);
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 1b. Update Category Domain Cap (HOD only)
router.put('/categories/:id', authenticate, requireRole(['hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { max_cap_points } = req.body;

    if (max_cap_points === undefined) {
      res.status(400).json({ error: 'max_cap_points is required' });
      return;
    }

    const existing = await queryOne('SELECT * FROM schema_categories WHERE id = ?', [id]);
    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    await executeRun(`
      UPDATE schema_categories
      SET max_cap_points = ?
      WHERE id = ?
    `, [Number(max_cap_points), id]);

    const now = new Date().toISOString();
    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'CATEGORY_CAP_UPDATED', ?, ?)
    `, [`log_${Date.now()}`, req.user!.id, `Updated domain cap for "${existing.name}" to ${max_cap_points} pts`, now]);

    const updated = await queryOne('SELECT * FROM schema_categories WHERE id = ?', [id]);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get all Schema Rules (active only by default, or all for HOD)
router.get('/rules', async (req, res) => {
  try {
    const includeInactive = req.query.include_inactive === 'true';
    const categoryId = req.query.category_id as string | undefined;

    let sql = `
      SELECT 
        s.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        c.max_cap_points
      FROM activity_schema s
      JOIN schema_categories c ON s.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (!includeInactive) {
      sql += ` AND s.is_active = 1`;
    }
    if (categoryId) {
      sql += ` AND s.category_id = ?`;
      params.push(categoryId);
    }

    sql += ` ORDER BY c.name ASC, s.base_points DESC`;

    const rules = await queryAll(sql, params);
    res.json(rules);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create a new official Schema Rule (HOD only)
router.post('/rules', authenticate, requireRole(['hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category_id, activity_name, base_points, criteria } = req.body;

    if (!category_id || !activity_name || base_points === undefined) {
      res.status(400).json({ error: 'category_id, activity_name, and base_points are required' });
      return;
    }

    const id = `sch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    await executeRun(`
      INSERT INTO activity_schema (id, category_id, activity_name, base_points, criteria, version, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)
    `, [id, category_id, activity_name.trim(), Number(base_points), criteria ? criteria.trim() : 'Official HOD marking criteria', now, now]);

    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'SCHEMA_RULE_CREATED', ?, ?)
    `, [`log_${Date.now()}`, req.user!.id, `Created schema rule: "${activity_name}" (${base_points} pts) [v1]`, now]);

    const createdRule = await queryOne(`
      SELECT s.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM activity_schema s
      JOIN schema_categories c ON s.category_id = c.id
      WHERE s.id = ?
    `, [id]);

    res.status(201).json(createdRule);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Update Schema Rule weightage/criteria (HOD only - increments Version)
router.put('/rules/:id', authenticate, requireRole(['hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { base_points, criteria, is_active, activity_name } = req.body;

    const existing = await queryOne('SELECT * FROM activity_schema WHERE id = ?', [id]);
    if (!existing) {
      res.status(404).json({ error: 'Schema rule not found' });
      return;
    }

    const newVersion = existing.version + 1;
    const now = new Date().toISOString();

    await executeRun(`
      UPDATE activity_schema
      SET 
        activity_name = COALESCE(?, activity_name),
        base_points = COALESCE(?, base_points),
        criteria = COALESCE(?, criteria),
        is_active = COALESCE(?, is_active),
        version = ?,
        updated_at = ?
      WHERE id = ?
    `, [
      activity_name ? activity_name.trim() : null,
      base_points !== undefined ? Number(base_points) : null,
      criteria ? criteria.trim() : null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      newVersion,
      now,
      id,
    ]);

    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'SCHEMA_RULE_UPDATED', ?, ?)
    `, [`log_${Date.now()}`, req.user!.id, `Updated schema rule "${existing.activity_name}" to v${newVersion} (Points: ${base_points ?? existing.base_points})`, now]);

    const updated = await queryOne(`
      SELECT s.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM activity_schema s
      JOIN schema_categories c ON s.category_id = c.id
      WHERE s.id = ?
    `, [id]);

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Mentor Schema Change Requests (List)
router.get(['/requests', '/requests/my'], authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let sql = `
      SELECT 
        r.*,
        u.name as mentor_name,
        u.email as mentor_email,
        c.name as category_name
      FROM schema_requests r
      JOIN users u ON r.mentor_id = u.id
      JOIN schema_categories c ON r.category_id = c.id
    `;
    const params: any[] = [];

    // If role is mentor, only show their own requests
    if (req.user!.role === 'mentor') {
      sql += ` WHERE r.mentor_id = ?`;
      params.push(req.user!.id);
    }

    sql += ` ORDER BY CASE r.status WHEN 'pending' THEN 1 WHEN 'approved' THEN 2 WHEN 'rejected' THEN 3 END, r.created_at DESC`;

    const requests = await queryAll(sql, params);
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Mentor submits a Schema Change Request to HOD
router.post('/requests', authenticate, requireRole(['mentor']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { activity_name, category_id, requested_points, reason } = req.body;

    if (!activity_name || !category_id || !requested_points || !reason) {
      res.status(400).json({ error: 'activity_name, category_id, requested_points, and reason are required' });
      return;
    }

    const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    await executeRun(`
      INSERT INTO schema_requests (id, mentor_id, activity_name, category_id, requested_points, reason, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `, [id, req.user!.id, activity_name.trim(), category_id, Number(requested_points), reason.trim(), now]);

    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'SCHEMA_REQUEST_SUBMITTED', ?, ?)
    `, [`log_${Date.now()}`, req.user!.id, `Mentor ${req.user!.name} requested new activity "${activity_name}" (${requested_points} pts)`, now]);

    const created = await queryOne(`
      SELECT r.*, u.name as mentor_name, c.name as category_name
      FROM schema_requests r
      JOIN users u ON r.mentor_id = u.id
      JOIN schema_categories c ON r.category_id = c.id
      WHERE r.id = ?
    `, [id]);

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. HOD reviews Schema Request (Approve with optional point adjustment, or Reject)
router.post('/requests/:id/review', authenticate, requireRole(['hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action, approved_points, hod_remarks } = req.body; // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ error: "action must be 'approve' or 'reject'" });
      return;
    }

    const request = await queryOne('SELECT * FROM schema_requests WHERE id = ?', [id]);
    if (!request) {
      res.status(404).json({ error: 'Schema request not found' });
      return;
    }

    if (request.status !== 'pending') {
      res.status(400).json({ error: `Request has already been ${request.status}` });
      return;
    }

    const now = new Date().toISOString();
    const finalPoints = action === 'approve' ? Number(approved_points || request.requested_points) : null;
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await executeRun(`
      UPDATE schema_requests
      SET 
        status = ?,
        approved_points = ?,
        hod_remarks = ?,
        reviewed_at = ?
      WHERE id = ?
    `, [newStatus, finalPoints, hod_remarks ? hod_remarks.trim() : null, now, id]);

    // If approved, automatically add as a new official Schema Rule!
    let newRuleId = null;
    if (action === 'approve') {
      newRuleId = `sch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await executeRun(`
        INSERT INTO activity_schema (id, category_id, activity_name, base_points, criteria, version, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)
      `, [
        newRuleId,
        request.category_id,
        request.activity_name,
        finalPoints,
        `Approved via Mentor Request (${hod_remarks || 'Official HOD Approved Criteria'})`,
        now,
        now,
      ]);
    }

    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'SCHEMA_REQUEST_REVIEWED', ?, ?)
    `, [
      `log_${Date.now()}`,
      req.user!.id,
      `HOD ${req.user!.name} ${action}d schema request for "${request.activity_name}" (${finalPoints ?? request.requested_points} pts)`,
      now,
    ]);

    const updatedRequest = await queryOne(`
      SELECT r.*, u.name as mentor_name, c.name as category_name
      FROM schema_requests r
      JOIN users u ON r.mentor_id = u.id
      JOIN schema_categories c ON r.category_id = c.id
      WHERE r.id = ?
    `, [id]);

    res.json({ request: updatedRequest, rule_created_id: newRuleId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
