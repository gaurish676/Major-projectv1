import { Router, Response } from 'express';
import { queryAll, queryOne } from '../db/database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// 1. Mentor Dashboard Summary
router.get('/dashboard', authenticate, requireRole(['mentor']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const mentorId = req.user!.id;

    const mentor = await queryOne(`
      SELECT u.id, u.name, u.email, u.role, u.department_id, u.avatar, d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [mentorId]);

    // Assigned mentees with their total approved points & pending points
    const mentees = await queryAll(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.roll_no, 
        u.semester, 
        u.cgpa, 
        u.avatar,
        COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.points_awarded ELSE 0 END), 0) as approved_points,
        COALESCE(SUM(CASE WHEN s.status = 'pending' THEN 1 ELSE 0 END), 0) as pending_submissions_count
      FROM users u
      LEFT JOIN submissions s ON s.student_id = u.id
      WHERE u.mentor_id = ?
      GROUP BY u.id
      ORDER BY approved_points DESC, u.name ASC
    `, [mentorId]);

    const formattedMentees = mentees.map((m) => {
      const pts = Number(m.approved_points);
      return {
        ...m,
        approved_points: pts,
        pending_submissions_count: Number(m.pending_submissions_count),
        completed_percentage: Math.min(100, Math.round((pts / 200) * 1000) / 10),
      };
    });

    // Counts
    const menteesCount = mentees.length;
    const totalPointsSum = formattedMentees.reduce((acc, curr) => acc + curr.approved_points, 0);
    const avgMenteePoints = menteesCount > 0 ? Math.round((totalPointsSum / menteesCount) * 10) / 10 : 0;

    const pendingSubmissions = await queryAll(`
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
        u.cgpa as student_cgpa
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      JOIN activity_schema sch ON s.schema_id = sch.id
      JOIN schema_categories c ON s.category_id = c.id
      WHERE u.mentor_id = ? AND s.status = 'pending'
      ORDER BY s.submitted_at ASC
    `, [mentorId]);

    const reviewsCount = await queryOne(`
      SELECT 
        COUNT(CASE WHEN s.status = 'pending' THEN 1 END) as pending_reviews_count,
        COUNT(CASE WHEN s.status = 'approved' THEN 1 END) as approved_reviews_count,
        COUNT(s.id) as total_reviewed
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE u.mentor_id = ?
    `, [mentorId]);

    const recentRequests = await queryAll(`
      SELECT r.*, c.name as category_name
      FROM schema_requests r
      JOIN schema_categories c ON r.category_id = c.id
      WHERE r.mentor_id = ?
      ORDER BY r.created_at DESC
      LIMIT 5
    `, [mentorId]);

    res.json({
      mentor,
      mentees_count: menteesCount,
      pending_reviews_count: pendingSubmissions.length,
      approved_reviews_count: reviewsCount?.approved_reviews_count || 0,
      total_submissions_reviewed: reviewsCount?.total_reviewed || 0,
      avg_mentee_points: avgMenteePoints,
      mentees: formattedMentees,
      pending_submissions: pendingSubmissions,
      recent_requests: recentRequests,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Mentee Detailed Dossier (Assigned Mentees Only)
router.get('/mentee/:id', authenticate, requireRole(['mentor', 'hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const student = await queryOne(`
      SELECT 
        u.*, 
        d.name as department_name, 
        m.name as mentor_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users m ON u.mentor_id = m.id
      WHERE u.id = ? AND u.role = 'student'
    `, [id]);

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    // Role check: Mentor can only view assigned mentee (HOD can view any)
    if (req.user!.role === 'mentor' && student.mentor_id !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized: Student is not assigned to your mentorship roster' });
      return;
    }

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
    `, [id]);

    const categories = await queryAll(`
      SELECT 
        c.id,
        c.name,
        c.max_cap_points,
        c.icon,
        c.color,
        COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.points_awarded ELSE 0 END), 0) as earned_points
      FROM schema_categories c
      LEFT JOIN submissions s ON s.category_id = c.id AND s.student_id = ?
      GROUP BY c.id
    `, [id]);

    let totalCapped = 0;
    const categoryBreakdown = categories.map((c) => {
      const earned = Number(c.earned_points);
      const capped = Math.min(earned, c.max_cap_points);
      totalCapped += capped;
      return {
        ...c,
        earned_points: earned,
        capped_points: capped,
      };
    });

    res.json({
      student,
      total_points: totalCapped,
      category_breakdown: categoryBreakdown,
      submissions,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
