import { Router, Response } from 'express';
import { queryAll, queryOne } from '../db/database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Student Dashboard Full Summary
router.get('/dashboard', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;

    const student = await queryOne(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.department_id, 
        u.cgpa, 
        u.semester, 
        u.roll_no, 
        u.avatar, 
        d.name as department_name,
        d.code as department_code,
        m.name as mentor_name,
        m.email as mentor_email
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users m ON u.mentor_id = m.id
      WHERE u.id = ?
    `, [studentId]);

    // Categories breakdown with earned points and caps
    const categories = await queryAll(`
      SELECT 
        c.id,
        c.name,
        c.description,
        c.max_cap_points,
        c.icon,
        c.color,
        COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.points_awarded ELSE 0 END), 0) as raw_earned_points,
        COUNT(s.id) as submissions_count
      FROM schema_categories c
      LEFT JOIN submissions s ON s.category_id = c.id AND s.student_id = ?
      GROUP BY c.id
      ORDER BY c.name ASC
    `, [studentId]);

    // Calculate capped points per category
    let totalCappedPoints = 0;
    const categoriesBreakdown = categories.map((cat) => {
      const earned = Number(cat.raw_earned_points);
      const capped = Math.min(earned, cat.max_cap_points);
      totalCappedPoints += capped;
      return {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        max_cap_points: cat.max_cap_points,
        icon: cat.icon,
        color: cat.color,
        earned_points: earned,
        capped_points: capped,
        submissions_count: Number(cat.submissions_count),
      };
    });

    const targetPoints = 200;
    const progressPercentage = Math.min(100, Math.round((totalCappedPoints / targetPoints) * 1000) / 10);

    let milestoneTier = 'Not Started';
    if (totalCappedPoints >= 200) milestoneTier = 'Diamond';
    else if (totalCappedPoints >= 150) milestoneTier = 'Gold';
    else if (totalCappedPoints >= 100) milestoneTier = 'Silver';
    else if (totalCappedPoints >= 50) milestoneTier = 'Bronze';

    // Counts of submissions
    const subCounts = await queryOne(`
      SELECT 
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
      FROM submissions
      WHERE student_id = ?
    `, [studentId]);

    // Recent submissions
    const recentSubmissions = await queryAll(`
      SELECT 
        s.*,
        sch.activity_name as schema_activity_name,
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
      LIMIT 6
    `, [studentId]);

    // Upcoming events
    const upcomingEvents = await queryAll(`
      SELECT 
        e.*,
        c.name as category_name,
        c.color as category_color
      FROM events e
      JOIN schema_categories c ON e.category_id = c.id
      ORDER BY e.event_date ASC
      LIMIT 4
    `);

    res.json({
      student,
      total_points: totalCappedPoints,
      target_points: targetPoints,
      progress_percentage: progressPercentage,
      milestone_tier: milestoneTier,
      cgpa: student.cgpa || 0,
      semester: student.semester || 1,
      approved_submissions_count: subCounts?.approved_count || 0,
      pending_submissions_count: subCounts?.pending_count || 0,
      rejected_submissions_count: subCounts?.rejected_count || 0,
      categories_breakdown: categoriesBreakdown,
      recent_submissions: recentSubmissions,
      upcoming_events: upcomingEvents,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
