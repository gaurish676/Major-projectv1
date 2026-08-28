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

// Helper for Grade calculation
function calculateGradeAndPoints(percentage: number): { grade: string; grade_points: number } {
  if (percentage >= 90) return { grade: 'O', grade_points: 10 };
  if (percentage >= 80) return { grade: 'A+', grade_points: 9 };
  if (percentage >= 70) return { grade: 'A', grade_points: 8 };
  if (percentage >= 60) return { grade: 'B+', grade_points: 7 };
  if (percentage >= 50) return { grade: 'B', grade_points: 6 };
  if (percentage >= 40) return { grade: 'C', grade_points: 5 };
  return { grade: 'F', grade_points: 0 };
}

// GET /api/student/marks - Get all marks for student (optionally filtered by semester)
router.get('/marks', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const semester = req.query.semester ? parseInt(req.query.semester as string, 10) : null;

    let sql = `SELECT * FROM student_marks WHERE student_id = ?`;
    const params: any[] = [studentId];

    if (semester && !isNaN(semester)) {
      sql += ` AND semester = ?`;
      params.push(semester);
    }

    sql += ` ORDER BY semester ASC, created_at ASC`;

    const rawMarks = await queryAll(sql, params);

    // Compute derived totals
    const marks = rawMarks.map((m) => {
      const theory = Number(m.theory_marks) || 0;
      const theoryMax = Number(m.theory_max) || 100;
      const task = Number(m.task_marks) || 0;
      const taskMax = Number(m.task_max) || 25;
      const hasLab = Boolean(m.has_lab);
      const lab = hasLab ? (Number(m.lab_marks) || 0) : 0;
      const labMax = hasLab ? (Number(m.lab_max) || 50) : 0;

      const totalScored = theory + task + lab;
      const totalMax = theoryMax + taskMax + labMax;
      const percentage = totalMax > 0 ? Math.round((totalScored / totalMax) * 1000) / 10 : 0;
      const { grade, grade_points } = calculateGradeAndPoints(percentage);

      return {
        ...m,
        theory_marks: theory,
        theory_max: theoryMax,
        task_marks: task,
        task_max: taskMax,
        has_lab: hasLab,
        lab_marks: lab,
        lab_max: labMax,
        total_scored: Math.round(totalScored * 10) / 10,
        total_max: Math.round(totalMax * 10) / 10,
        percentage,
        grade: m.grade || grade,
        grade_points: m.grade_points !== null && m.grade_points !== undefined ? Number(m.grade_points) : grade_points,
      };
    });

    // Summary calculations
    let totalCredits = 0;
    let weightedGradePoints = 0;
    let totalScoredAll = 0;
    let totalMaxAll = 0;

    marks.forEach((m) => {
      const credits = Number(m.credits) || 3;
      totalCredits += credits;
      weightedGradePoints += (m.grade_points || 0) * credits;
      totalScoredAll += m.total_scored;
      totalMaxAll += m.total_max;
    });

    const sgpa = totalCredits > 0 ? Math.round((weightedGradePoints / totalCredits) * 100) / 100 : 0;
    const overallPercentage = totalMaxAll > 0 ? Math.round((totalScoredAll / totalMaxAll) * 1000) / 10 : 0;

    res.json({
      marks,
      summary: {
        total_subjects: marks.length,
        total_credits: totalCredits,
        total_scored: Math.round(totalScoredAll * 10) / 10,
        total_max: Math.round(totalMaxAll * 10) / 10,
        overall_percentage: overallPercentage,
        sgpa,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/student/marks - Add a new subject mark
router.post('/marks', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const {
      semester = 6,
      subject_code = '',
      subject_name,
      credits = 4,
      theory_marks = 0,
      theory_max = 100,
      task_marks = 0,
      task_max = 25,
      has_lab = false,
      lab_marks = 0,
      lab_max = 50,
    } = req.body;

    if (!subject_name || !subject_name.trim()) {
      return res.status(400).json({ error: 'Subject name is required' });
    }

    const markId = `mark_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const theory = Number(theory_marks) || 0;
    const theoryM = Number(theory_max) || 100;
    const task = Number(task_marks) || 0;
    const taskM = Number(task_max) || 25;
    const isLab = Boolean(has_lab);
    const lab = isLab ? (Number(lab_marks) || 0) : 0;
    const labM = isLab ? (Number(lab_max) || 50) : 0;

    const totalScored = theory + task + lab;
    const totalMax = theoryM + taskM + labM;
    const percentage = totalMax > 0 ? (totalScored / totalMax) * 100 : 0;
    const { grade, grade_points } = calculateGradeAndPoints(percentage);

    const { executeRun } = await import('../db/database');
    await executeRun(`
      INSERT INTO student_marks (
        id, student_id, semester, subject_code, subject_name, credits,
        theory_marks, theory_max, task_marks, task_max, has_lab,
        lab_marks, lab_max, grade, grade_points, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      markId,
      studentId,
      Number(semester) || 6,
      subject_code.trim(),
      subject_name.trim(),
      Number(credits) || 4,
      theory,
      theoryM,
      task,
      taskM,
      isLab ? 1 : 0,
      lab,
      labM,
      grade,
      grade_points,
      now,
      now,
    ]);

    const created = await queryOne(`SELECT * FROM student_marks WHERE id = ?`, [markId]);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/student/marks/:id - Update subject mark
router.put('/marks/:id', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const markId = req.params.id;

    const existing = await queryOne(`SELECT * FROM student_marks WHERE id = ? AND student_id = ?`, [markId, studentId]);
    if (!existing) {
      return res.status(404).json({ error: 'Subject mark record not found' });
    }

    const {
      semester = existing.semester,
      subject_code = existing.subject_code,
      subject_name = existing.subject_name,
      credits = existing.credits,
      theory_marks = existing.theory_marks,
      theory_max = existing.theory_max,
      task_marks = existing.task_marks,
      task_max = existing.task_max,
      has_lab = existing.has_lab,
      lab_marks = existing.lab_marks,
      lab_max = existing.lab_max,
    } = req.body;

    const theory = Number(theory_marks);
    const theoryM = Number(theory_max);
    const task = Number(task_marks);
    const taskM = Number(task_max);
    const isLab = Boolean(has_lab);
    const lab = isLab ? Number(lab_marks) : 0;
    const labM = isLab ? Number(lab_max) : 0;

    const totalScored = theory + task + lab;
    const totalMax = theoryM + taskM + labM;
    const percentage = totalMax > 0 ? (totalScored / totalMax) * 100 : 0;
    const { grade, grade_points } = calculateGradeAndPoints(percentage);

    const now = new Date().toISOString();
    const { executeRun } = await import('../db/database');
    await executeRun(`
      UPDATE student_marks SET
        semester = ?,
        subject_code = ?,
        subject_name = ?,
        credits = ?,
        theory_marks = ?,
        theory_max = ?,
        task_marks = ?,
        task_max = ?,
        has_lab = ?,
        lab_marks = ?,
        lab_max = ?,
        grade = ?,
        grade_points = ?,
        updated_at = ?
      WHERE id = ? AND student_id = ?
    `, [
      Number(semester),
      subject_code.trim(),
      subject_name.trim(),
      Number(credits),
      theory,
      theoryM,
      task,
      taskM,
      isLab ? 1 : 0,
      lab,
      labM,
      grade,
      grade_points,
      now,
      markId,
      studentId,
    ]);

    const updated = await queryOne(`SELECT * FROM student_marks WHERE id = ?`, [markId]);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/student/marks/:id - Delete subject mark
router.delete('/marks/:id', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const markId = req.params.id;

    const existing = await queryOne(`SELECT * FROM student_marks WHERE id = ? AND student_id = ?`, [markId, studentId]);
    if (!existing) {
      return res.status(404).json({ error: 'Subject mark record not found' });
    }

    const { executeRun } = await import('../db/database');
    await executeRun(`DELETE FROM student_marks WHERE id = ? AND student_id = ?`, [markId, studentId]);

    res.json({ message: 'Subject mark record deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/student/marks/seed-defaults - Pre-fill standard curriculum subjects for convenience
router.post('/marks/seed-defaults', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const semester = Number(req.body.semester) || 6;

    const defaultSubjectsBySem: Record<number, Array<{ code: string; name: string; credits: number; theory: number; theoryMax: number; task: number; taskMax: number; hasLab: boolean; lab: number; labMax: number }>> = {
      6: [
        { code: '21CS61', name: 'Software Engineering & Agile Methodologies', credits: 4, theory: 78, theoryMax: 100, task: 22, taskMax: 25, hasLab: false, lab: 0, labMax: 0 },
        { code: '21CS62', name: 'Cloud Computing & Distributed Systems', credits: 4, theory: 84, theoryMax: 100, task: 23, taskMax: 25, hasLab: true, lab: 44, labMax: 50 },
        { code: '21CS63', name: 'Machine Learning & Pattern Recognition', credits: 4, theory: 81, theoryMax: 100, task: 21, taskMax: 25, hasLab: true, lab: 46, labMax: 50 },
        { code: '21CS64', name: 'Compiler Design & Automata', credits: 3, theory: 74, theoryMax: 100, task: 20, taskMax: 25, hasLab: false, lab: 0, labMax: 0 },
        { code: '21CSL66', name: 'Machine Learning & Cloud Lab', credits: 2, theory: 0, theoryMax: 0, task: 24, taskMax: 25, hasLab: true, lab: 48, labMax: 50 },
      ],
      5: [
        { code: '21CS51', name: 'Database Management Systems', credits: 4, theory: 82, theoryMax: 100, task: 22, taskMax: 25, hasLab: true, lab: 45, labMax: 50 },
        { code: '21CS52', name: 'Computer Networks', credits: 4, theory: 76, theoryMax: 100, task: 21, taskMax: 25, hasLab: true, lab: 43, labMax: 50 },
        { code: '21CS53', name: 'Theory of Computation', credits: 3, theory: 79, theoryMax: 100, task: 20, taskMax: 25, hasLab: false, lab: 0, labMax: 0 },
        { code: '21CS54', name: 'Web Technologies & Frameworks', credits: 3, theory: 88, theoryMax: 100, task: 24, taskMax: 25, hasLab: true, lab: 47, labMax: 50 },
      ],
    };

    const subjectsToSeed = defaultSubjectsBySem[semester] || defaultSubjectsBySem[6];
    const { executeRun } = await import('../db/database');
    const now = new Date().toISOString();

    for (const s of subjectsToSeed) {
      const markId = `mark_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const totalScored = s.theory + s.task + (s.hasLab ? s.lab : 0);
      const totalMax = s.theoryMax + s.taskMax + (s.hasLab ? s.labMax : 0);
      const percentage = totalMax > 0 ? (totalScored / totalMax) * 100 : 0;
      const { grade, grade_points } = calculateGradeAndPoints(percentage);

      await executeRun(`
        INSERT INTO student_marks (
          id, student_id, semester, subject_code, subject_name, credits,
          theory_marks, theory_max, task_marks, task_max, has_lab,
          lab_marks, lab_max, grade, grade_points, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        markId,
        studentId,
        semester,
        s.code,
        s.name,
        s.credits,
        s.theory,
        s.theoryMax,
        s.task,
        s.taskMax,
        s.hasLab ? 1 : 0,
        s.hasLab ? s.lab : 0,
        s.hasLab ? s.labMax : 0,
        grade,
        grade_points,
        now,
        now,
      ]);
    }

    res.json({ message: 'Default subjects preloaded successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
