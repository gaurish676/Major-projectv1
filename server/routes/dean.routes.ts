import { Router, Response } from 'express';
import { queryAll, queryOne, executeRun } from '../db/database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { calculateStudentPoints } from '../services/pointsCalculator';

const router = Router();

// 1. Pawan Sir's Executive Leadership Dashboard Data
router.get('/dashboard', authenticate, requireRole(['dean', 'hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. All Departments Overview
    const departments = await queryAll(`
      SELECT 
        d.id, 
        d.name, 
        d.code,
        COUNT(DISTINCT u.id) as student_count
      FROM departments d
      LEFT JOIN users u ON u.department_id = d.id AND u.role = 'student'
      GROUP BY d.id
      ORDER BY d.code ASC
    `);

    // Department comparative metrics
    const deptMetrics = await Promise.all(departments.map(async (d) => {
      const students = await queryAll(`
        SELECT id, semester FROM users WHERE role = 'student' AND department_id = ?
      `, [d.id]);

      let totalPoints = 0;
      let clearedCount = 0;
      let atRiskCount = 0;

      for (const st of students) {
        const pData = await calculateStudentPoints(st.id, st.semester || 1);
        totalPoints += pData.total_effective_points;
        if (pData.total_effective_points >= 200) clearedCount++;
        else if (pData.total_effective_points < 60 && (st.semester || 1) >= 6) atRiskCount++;
      }

      const pendingReviews = (await queryOne(`
        SELECT COUNT(s.id) as count
        FROM submissions s
        JOIN users u ON s.student_id = u.id
        WHERE u.department_id = ? AND s.status = 'pending'
      `, [d.id]))?.count || 0;

      const studentCount = students.length;
      const avgPoints = studentCount > 0 ? Math.round((totalPoints / studentCount) * 10) / 10 : 0;
      const clearanceRate = studentCount > 0 ? Math.round((clearedCount / studentCount) * 1000) / 10 : 0;

      return {
        department_id: d.id,
        department_name: d.name,
        department_code: d.code,
        student_count: studentCount,
        avg_points: avgPoints,
        cleared_count: clearedCount,
        at_risk_count: atRiskCount,
        clearance_rate: clearanceRate,
        pending_reviews: pendingReviews,
      };
    }));

    // 2. Year-wise student distribution (1st Year Induction vs 2nd, 3rd, 4th Year)
    const allStudents = await queryAll(`
      SELECT id, name, semester, roll_no, cgpa, department_id FROM users WHERE role = 'student'
    `);

    const yearStats: Record<number, { year: number; label: string; count: number; avg_points: number; cleared: number }> = {
      1: { year: 1, label: '1st Year (Induction & UHV Foundation)', count: 0, avg_points: 0, cleared: 0 },
      2: { year: 2, label: '2nd Year (Core Skills & Workshops)', count: 0, avg_points: 0, cleared: 0 },
      3: { year: 3, label: '3rd Year (Internships & Hackathons)', count: 0, avg_points: 0, cleared: 0 },
      4: { year: 4, label: '4th Year (Degree Clearance & Placement)', count: 0, avg_points: 0, cleared: 0 },
    };

    let totalInstitutePoints = 0;
    let totalClearedInstitute = 0;
    let totalAtRiskInstitute = 0;
    let placementReadyCount = 0;

    for (const st of allStudents) {
      const sem = Number(st.semester) || 1;
      const y = Math.min(4, Math.max(1, Math.ceil(sem / 2)));
      const pData = await calculateStudentPoints(st.id, sem);
      const pts = pData.total_effective_points;

      yearStats[y].count++;
      yearStats[y].avg_points += pts;
      if (pts >= 200) {
        yearStats[y].cleared++;
        totalClearedInstitute++;
      } else if (pts < 60 && sem >= 6) {
        totalAtRiskInstitute++;
      }

      totalInstitutePoints += pts;

      // Placement ready = points >= 70 & CGPA >= 7.5
      if (pts >= 70 && Number(st.cgpa) >= 7.5) {
        placementReadyCount++;
      }
    }

    // Normalize year averages
    Object.values(yearStats).forEach((ys) => {
      if (ys.count > 0) {
        ys.avg_points = Math.round((ys.avg_points / ys.count) * 10) / 10;
      }
    });

    const totalStudentsCount = allStudents.length;
    const avgInstitutePoints = totalStudentsCount > 0 ? Math.round((totalInstitutePoints / totalStudentsCount) * 10) / 10 : 0;
    const instituteClearanceRate = totalStudentsCount > 0 ? Math.round((totalClearedInstitute / totalStudentsCount) * 1000) / 10 : 0;

    // 3. Faculty Mentor Compliance & SLA metrics
    const mentors = await queryAll(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.department_id,
        d.code as dept_code,
        COUNT(DISTINCT st.id) as mentees_count,
        COUNT(CASE WHEN s.status = 'pending' THEN 1 END) as pending_queue,
        COUNT(CASE WHEN s.status = 'approved' THEN 1 END) as approved_count
      FROM users u
      JOIN departments d ON u.department_id = d.id
      LEFT JOIN users st ON st.mentor_id = u.id AND st.role = 'student'
      LEFT JOIN submissions s ON s.student_id = st.id
      WHERE u.role = 'mentor'
      GROUP BY u.id
      ORDER BY pending_queue DESC, u.name ASC
    `);

    // 4. Placement Drives Summary
    const drives = await queryAll('SELECT * FROM placement_drives WHERE is_active = 1 ORDER BY package_lpa DESC');

    // 5. Recent Institutional Audit Logs
    const recentLogs = await queryAll(`
      SELECT l.*, u.name as user_name, u.role as user_role
      FROM activity_logs l
      JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 10
    `);

    // 6. Recent Remedial Academic Counseling Logs
    const remedialLogs = await queryAll(`
      SELECT 
        c.*,
        m.name as mentor_name,
        s.name as student_name,
        s.roll_no as student_roll_no,
        s.semester as student_semester
      FROM counseling_logs c
      JOIN users m ON c.mentor_id = m.id
      JOIN users s ON c.student_id = s.id
      ORDER BY c.created_at DESC
      LIMIT 20
    `);

    res.json({
      dean: {
        name: 'Dr. Pawan Kumar',
        title: 'Dean of Academic Affairs & Autonomous Framework',
        institution: 'University Autonomous Academic Council',
      },
      institute_kpis: {
        total_enrolled_scholars: totalStudentsCount,
        avg_points_per_student: avgInstitutePoints,
        total_cleared_degree: totalClearedInstitute,
        overall_clearance_rate: instituteClearanceRate,
        total_at_risk_scholars: totalAtRiskInstitute,
        placement_ready_scholars: placementReadyCount,
        placement_readiness_pct: totalStudentsCount > 0 ? Math.round((placementReadyCount / totalStudentsCount) * 100) : 0,
        active_placement_drives: drives.length,
      },
      department_comparison: deptMetrics,
      year_progression: Object.values(yearStats),
      faculty_mentor_compliance: mentors,
      placement_drives: drives,
      recent_logs: recentLogs,
      remedial_counseling_logs: remedialLogs,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Pawan Sir Executive Circular Broadcast
router.post('/broadcast', authenticate, requireRole(['dean', 'hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, message, target_audience = 'all' } = req.body;
    if (!title || !message) {
      res.status(400).json({ error: 'Title and message are required' });
      return;
    }

    const notifId = `notif_dean_broadcast_${Date.now()}`;
    const now = new Date().toISOString();

    let recipientRole: string | null = null;
    if (target_audience === 'mentors') recipientRole = 'mentor';
    else if (target_audience === 'students') recipientRole = 'student';

    await executeRun(`
      INSERT INTO notifications (
        id, sender_id, sender_name, sender_role, recipient_id, recipient_role, category,
        title, message, is_read, created_at
      ) VALUES (?, ?, ?, 'dean', NULL, ?, 'meeting', ?, ?, 0, ?)
    `, [
      notifId,
      req.user!.id,
      req.user!.name || 'Dr. Pawan Kumar (Dean)',
      recipientRole,
      title.trim(),
      message.trim(),
      now,
    ]);

    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'DEAN_CIRCULAR_BROADCAST', ?, ?)
    `, [
      `log_${Date.now()}`,
      req.user!.id,
      `Dean Dr. Pawan Kumar issued institutional circular: "${title}"`,
      now,
    ]);

    res.json({ success: true, message: 'Executive circular dispatched to all academic entities.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
