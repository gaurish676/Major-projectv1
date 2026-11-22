import { Router, Response } from 'express';
import { queryAll, queryOne, executeRun } from '../db/database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { calculateStudentPoints } from '../services/pointsCalculator';
import { generateRandomStudentMarks } from '../services/curriculumSubjects';
import { aiAdvisorLimiter } from '../middleware/rateLimiter';

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
        u.tenth_percentage,
        u.tenth_board,
        u.tenth_year,
        u.twelfth_percentage,
        u.twelfth_board,
        u.twelfth_year,
        u.diploma_or_pu,
        d.name as department_name,
        d.code as department_code,
        m.name as mentor_name,
        m.email as mentor_email
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users m ON u.mentor_id = m.id
      WHERE u.id = ?
    `, [studentId]);

    // Calculate points strictly applying Semester Credit Limits and Category Caps
    const currentSem = student?.semester || 1;
    const pointsData = await calculateStudentPoints(studentId, currentSem);

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
      total_points: pointsData.total_effective_points,
      raw_total_points: pointsData.raw_total_points,
      semester_capped_points: pointsData.semester_capped_points,
      total_excess_points: pointsData.total_excess_points,
      semester_limit_per_semester: pointsData.semester_limit_per_semester,
      target_points: pointsData.target_points,
      progress_percentage: pointsData.progress_percentage,
      milestone_tier: pointsData.milestone_tier,
      cgpa: student.cgpa || 0,
      semester: student.semester || 1,
      approved_submissions_count: subCounts?.approved_count || 0,
      pending_submissions_count: subCounts?.pending_count || 0,
      rejected_submissions_count: subCounts?.rejected_count || 0,
      categories_breakdown: pointsData.categories_breakdown,
      semester_breakdown: pointsData.semester_breakdown,
      year_breakdown: pointsData.year_breakdown,
      recent_submissions: recentSubmissions,
      upcoming_events: upcomingEvents,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/student/credit-report - Complete official credit dossier for PDF generation & visualization
router.get('/credit-report', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let studentId = req.user!.id;
    if ((req.user!.role === 'mentor' || req.user!.role === 'hod' || req.user!.role === 'dean') && req.query.student_id) {
      studentId = req.query.student_id as string;
    }

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
        u.tenth_percentage,
        u.tenth_board,
        u.tenth_year,
        u.twelfth_percentage,
        u.twelfth_board,
        u.twelfth_year,
        u.diploma_or_pu,
        d.name as department_name,
        d.code as department_code,
        m.name as mentor_name,
        m.email as mentor_email
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users m ON u.mentor_id = m.id
      WHERE u.id = ?
    `, [studentId]);

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    // Role security check for mentors
    if (req.user!.role === 'mentor' && student.mentor_id && student.mentor_id !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized to view this mentee report' });
      return;
    }

    const currentSem = student?.semester || 1;
    const pointsData = await calculateStudentPoints(studentId, currentSem);

    // Fetch all submissions for complete transcript
    const allSubmissions = await queryAll(`
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
    `, [studentId]);

    // Subject marks summary
    const marks = await queryAll(`
      SELECT * FROM student_marks WHERE student_id = ? ORDER BY semester ASC
    `, [studentId]);

    let totalCredits = 0;
    let weightedGradePoints = 0;
    marks.forEach((m: any) => {
      const cr = Number(m.credits) || 3;
      totalCredits += cr;
      weightedGradePoints += (Number(m.grade_points) || 0) * cr;
    });
    const cumulativeSGPA = totalCredits > 0 ? Math.round((weightedGradePoints / totalCredits) * 100) / 100 : (student.cgpa || 8.4);

    const verificationId = `CRD-${student.department_code || 'CSE'}-${student.roll_no ? student.roll_no.replace(/[^a-zA-Z0-9]/g, '') : 'STU'}-${Math.abs(student.id.split('').reduce((a: number, b: string) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)).toString(36).toUpperCase()}`;

    res.json({
      student,
      points_summary: {
        total_effective_points: pointsData.total_effective_points,
        raw_total_points: pointsData.raw_total_points,
        semester_capped_points: pointsData.semester_capped_points,
        total_excess_points: pointsData.total_excess_points,
        semester_limit_per_semester: pointsData.semester_limit_per_semester,
        target_points: pointsData.target_points,
        progress_percentage: pointsData.progress_percentage,
        milestone_tier: pointsData.milestone_tier,
        is_cleared: pointsData.total_effective_points >= pointsData.target_points,
      },
      categories_breakdown: pointsData.categories_breakdown,
      semester_breakdown: pointsData.semester_breakdown,
      year_breakdown: pointsData.year_breakdown,
      submissions: allSubmissions,
      academic_summary: {
        total_subjects: marks.length,
        total_credits: totalCredits,
        cumulative_sgpa: cumulativeSGPA,
      },
      verification_id: verificationId,
      institution: {
        name: 'Autonomous Institute of Technology & Sciences',
        accreditation: 'Accredited by NBA & NAAC with A++ Grade | Affiliated to State Technological University',
        department: student.department_name || 'Department of Computer Science & Engineering',
      },
      generated_at: new Date().toISOString(),
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
      mse1_marks = existing.mse1_marks,
      mse1_max = existing.mse1_max,
      mse2_marks = existing.mse2_marks,
      mse2_max = existing.mse2_max,
      mse_marks,
    } = req.body;

    const theory = Number(theory_marks);
    const theoryM = Number(theory_max);
    const task = Number(task_marks);
    const taskM = Number(task_max);
    const isLab = Boolean(has_lab);
    const lab = isLab ? Number(lab_marks) : 0;
    const labM = isLab ? Number(lab_max) : 0;

    const m1M = Number(mse1_max) || Number(existing.mse1_max) || 30;
    const m2M = Number(mse2_max) || Number(existing.mse2_max) || 30;
    const rawM1 = mse1_marks !== undefined ? Number(mse1_marks) : (mse_marks !== undefined ? Number(mse_marks) : (existing.mse1_marks !== null && existing.mse1_marks !== undefined ? Number(existing.mse1_marks) : 0));
    const rawM2 = mse2_marks !== undefined ? Number(mse2_marks) : (existing.mse2_marks !== null && existing.mse2_marks !== undefined ? Number(existing.mse2_marks) : 0);
    const m1 = Math.max(0, Math.min(m1M, isNaN(rawM1) ? 0 : rawM1));
    const m2 = Math.max(0, Math.min(m2M, isNaN(rawM2) ? 0 : rawM2));

    // Check if MSE marks < 12 (out of 30, i.e. < 40%). If poor, set is_poor_performance = 1.
    const hasPoorMse = (m1 < 12) || (m2 > 0 && m2 < 12) || (mse_marks !== undefined && Number(mse_marks) < 12);
    const isPoor = hasPoorMse ? 1 : 0;

    const totalScored = theory + task + lab;
    const totalMax = theoryM + taskM + labM;
    const percentage = totalMax > 0 ? (totalScored / totalMax) * 100 : 0;
    const { grade, grade_points } = calculateGradeAndPoints(percentage);

    const now = new Date().toISOString();
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
        mse1_marks = ?,
        mse1_max = ?,
        mse2_marks = ?,
        mse2_max = ?,
        is_poor_performance = ?,
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
      m1,
      m1M,
      m2,
      m2M,
      isPoor,
      grade,
      grade_points,
      now,
      markId,
      studentId,
    ]);

    // Query student for assigned mentor to create academic alert notification if poor MSE performance
    const student = await queryOne<{ id: string; name: string; roll_no: string; mentor_id: string }>(`
      SELECT id, name, roll_no, mentor_id FROM users WHERE id = ?
    `, [studentId]);

    if (isPoor === 1 && student?.mentor_id) {
      const notifId = `notif_alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const mseMarks = (m1 < 12 && m2 > 0 && m2 < 12) ? Math.min(m1, m2) : (m1 < 12 ? m1 : m2);
      const notifTitle = 'Poor MSE Performance Alert: ' + student.name;
      const notifMessage = 'Mentee ' + student.name + ' (' + (student.roll_no || 'N/A') + ') scored below 40% in ' + subject_name.trim() + ' (MSE: ' + mseMarks + '/30). Please conduct academic counseling.';

      await executeRun(`
        INSERT INTO notifications (
          id, sender_id, sender_name, sender_role, recipient_id, recipient_role, category,
          title, message, is_read, created_at
        ) VALUES (?, ?, ?, 'system', ?, 'mentor', 'academic_alert', ?, ?, 0, ?)
      `, [
        notifId,
        student.id,
        student.name,
        student.mentor_id,
        notifTitle,
        notifMessage,
        now,
      ]);
    }

    const updated = await queryOne(`SELECT * FROM student_marks WHERE id = ?`, [markId]);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/student/marks/semester/:semester - Delete all subject marks for a semester
router.delete('/marks/semester/:semester', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const semester = parseInt(req.params.semester, 10);

    if (isNaN(semester)) {
      return res.status(400).json({ error: 'Valid semester number is required' });
    }

    const { executeRun } = await import('../db/database');
    await executeRun(`DELETE FROM student_marks WHERE student_id = ? AND semester = ?`, [studentId, semester]);

    res.json({ message: `All subjects for semester ${semester} deleted successfully` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/student/marks/batch - Insert multiple subject marks at once
router.post('/marks/batch', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { semester = 6, subjects = [] } = req.body;

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'At least one subject is required' });
    }

    const { executeRun } = await import('../db/database');
    const now = new Date().toISOString();

    for (const sub of subjects) {
      if (!sub.subject_name || !sub.subject_name.trim()) continue;

      const markId = `mark_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const theory = Number(sub.theory_marks) || 0;
      const theoryM = Number(sub.theory_max) || 100;
      const task = Number(sub.task_marks) || 0;
      const taskM = Number(sub.task_max) || 25;
      const isLab = Boolean(sub.has_lab);
      const lab = isLab ? (Number(sub.lab_marks) || 0) : 0;
      const labM = isLab ? (Number(sub.lab_max) || 50) : 0;

      const totalScored = theory + task + lab;
      const totalMax = theoryM + taskM + labM;
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
        Number(semester) || 6,
        (sub.subject_code || '').trim(),
        sub.subject_name.trim(),
        Number(sub.credits) || 4,
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
    }

    res.json({ message: 'All subjects saved successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/student/marks/batch-update - Update all subject marks at once
router.put('/marks/batch-update', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { subjects = [] } = req.body;

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'No subjects provided for update' });
    }

    const { executeRun } = await import('../db/database');
    const now = new Date().toISOString();

    for (const sub of subjects) {
      if (!sub.id || !sub.subject_name) continue;

      const theory = Number(sub.theory_marks) || 0;
      const theoryM = Number(sub.theory_max) || 100;
      const task = Number(sub.task_marks) || 0;
      const taskM = Number(sub.task_max) || 25;
      const isLab = Boolean(sub.has_lab);
      const lab = isLab ? (Number(sub.lab_marks) || 0) : 0;
      const labM = isLab ? (Number(sub.lab_max) || 50) : 0;

      const totalScored = theory + task + lab;
      const totalMax = theoryM + taskM + labM;
      const percentage = totalMax > 0 ? (totalScored / totalMax) * 100 : 0;
      const { grade, grade_points } = calculateGradeAndPoints(percentage);

      await executeRun(`
        UPDATE student_marks SET
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
        (sub.subject_code || '').trim(),
        sub.subject_name.trim(),
        Number(sub.credits) || 4,
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
        sub.id,
        studentId,
      ]);
    }

    res.json({ message: 'All subjects updated successfully' });
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

    const generated = generateRandomStudentMarks(studentId, semester, 3);
    const { executeRun } = await import('../db/database');

    for (const s of generated) {
      await executeRun(`
        INSERT INTO student_marks (
          id, student_id, semester, subject_code, subject_name, credits,
          theory_marks, theory_max, task_marks, task_max, has_lab,
          lab_marks, lab_max, grade, grade_points, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        s.id,
        studentId,
        semester,
        s.subject_code,
        s.subject_name,
        s.credits,
        s.theory_marks,
        s.theory_max,
        s.task_marks,
        s.task_max,
        s.has_lab,
        s.lab_marks,
        s.lab_max,
        s.grade,
        s.grade_points,
        s.created_at,
        s.updated_at,
      ]);
    }

    res.json({ message: `Default subjects and marks preloaded for Semester ${semester}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/student/knowledge-graph - Extract full or student knowledge graph visualization structure
router.get('/knowledge-graph', authenticate, requireRole(['student', 'mentor', 'hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { buildKnowledgeGraph, getStudentKnowledgeContext } = await import('../services/knowledgeGraph');
    const kg = await buildKnowledgeGraph();

    const nodesArray = Array.from(kg.nodes.values());
    let studentId = req.user!.id;
    if (req.query.student_id && (req.user!.role === 'mentor' || req.user!.role === 'hod' || req.user!.role === 'dean')) {
      studentId = req.query.student_id as string;
    }
    const evidence = await getStudentKnowledgeContext(studentId);

    res.json({
      nodes: nodesArray,
      edges: kg.edges,
      evidence,
      built_at: kg.built_at,
    });
  } catch (err: any) {
    console.error('Knowledge Graph endpoint error:', err);
    res.status(500).json({ error: err.message || 'Failed to retrieve Knowledge Graph' });
  }
});

// POST /api/student/ai-advisor - GraphRAG-powered academic & activity credit advisor
router.post('/ai-advisor', aiAdvisorLimiter, authenticate, requireRole(['student', 'mentor', 'hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getStudentKnowledgeContext } = await import('../services/knowledgeGraph');
    const { GoogleGenAI } = await import('@google/genai');

    let studentId = req.user!.id;
    if (req.body.student_id && (req.user!.role === 'mentor' || req.user!.role === 'hod' || req.user!.role === 'dean')) {
      studentId = req.body.student_id;
    }
    const query = (req.body.query || 'What activities should I prioritize this semester to meet degree requirements?').trim();

    const evidence = await getStudentKnowledgeContext(studentId);

    let advicePayload: {
      summary: string;
      target_plan: string;
      category_strategy: string[];
      recommended_activities: Array<{
        id: string;
        title: string;
        category_name: string;
        base_points: number;
        source: 'catalog' | 'event';
        venue_or_criteria?: string;
      }>;
      semester_guidance: string;
    } | null = null;
    let modelUsed = 'graph-rag-heuristic-engine';

    let ai: any = null;
    if (process.env.GEMINI_API_KEY) {
      try {
        ai = new GoogleGenAI();
      } catch {}
    }

    if (ai) {
      try {
        const preferredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        let targetModel = preferredModel;

        const systemInstruction = `You are the Creditz AI Academic & Credit Advisor, an expert university counselor grounded strictly in the student's institutional Knowledge Graph and AICTE credit guidelines.
CRITICAL GROUNDING DIRECTIVES:
1. Ground every recommendation strictly in the verified graph evidence:
   - Student: ${evidence.student_name} (Semester ${evidence.current_semester})
   - Current Points: ${evidence.current_points} / ${evidence.target_points} (${evidence.progress_percentage}% completed, milestone tier: ${evidence.milestone_tier}).
   - Remaining Points to graduate: ${evidence.remaining_points}.
   - Current Semester Headroom: ${evidence.semester_headroom} points remaining before reaching the 30-pts/semester ceiling.
2. NEVER recommend activities in categories that are already CAPPED (headroom = 0).
3. Recommend activities from the provided eligible activities list or events that match uncapped domains.
4. Output must be strictly valid JSON conforming exactly to the requested schema.`;

        const userPrompt = `Student Query: "${query}"

Verified Institutional Graph Context:
${JSON.stringify({
  student_name: evidence.student_name,
  current_points: evidence.current_points,
  target_points: evidence.target_points,
  remaining_points: evidence.remaining_points,
  current_semester: evidence.current_semester,
  semester_headroom: evidence.semester_headroom,
  milestone_tier: evidence.milestone_tier,
  uncapped_categories: evidence.category_headroom.filter((c) => c.headroom > 0).map((c) => ({
    name: c.category_name,
    earned: c.earned,
    cap: c.cap,
    headroom: c.headroom,
  })),
  capped_categories: evidence.category_headroom.filter((c) => c.headroom <= 0).map((c) => c.category_name),
  eligible_activities_sample: evidence.eligible_activities_list.slice(0, 8),
  skills_developed: evidence.skills_developed,
  skills_recommended: evidence.skills_recommended,
}, null, 2)}

Provide structured, grounded advice in the following JSON schema:
{
  "summary": string,
  "target_plan": string,
  "category_strategy": string[],
  "recommended_activities": [
    {
      "id": string,
      "title": string,
      "category_name": string,
      "base_points": number,
      "source": "catalog" | "event",
      "venue_or_criteria": string
    }
  ],
  "semester_guidance": string
}`;

        let response;
        try {
          response = await ai.models.generateContent({
            model: targetModel,
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
            },
          });
        } catch (mErr: any) {
          if (targetModel !== 'gemini-1.5-flash') {
            console.warn(`[aiAdvisor] Fallback from ${targetModel} to gemini-1.5-flash:`, mErr.message);
            targetModel = 'gemini-1.5-flash';
            response = await ai.models.generateContent({
              model: targetModel,
              contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
              config: {
                systemInstruction,
                responseMimeType: 'application/json',
              },
            });
          } else {
            throw mErr;
          }
        }

        const respText = response.text;
        if (respText) {
          advicePayload = JSON.parse(respText.trim());
          modelUsed = targetModel;
        }
      } catch (aiErr: any) {
        console.warn('[aiAdvisor] Gemini invocation note, using deterministic GraphRAG engine:', aiErr.message);
      }
    }

    // Deterministic GraphRAG Engine Fallback (Grounded in Verified Knowledge Context)
    if (!advicePayload) {
      const uncapped = evidence.category_headroom.filter((c) => c.headroom > 0).sort((a, b) => b.headroom - a.headroom);
      const topRecs = evidence.eligible_activities_list.slice(0, 4);

      const strategyList = uncapped.slice(0, 3).map(
        (c) => `Prioritize ${c.category_name}: You have ${c.headroom} points remaining before reaching the ${c.cap}-point ceiling (${c.earned}/${c.cap} earned).`
      );

      const semGuidance = evidence.semester_headroom > 0
        ? `You have ${evidence.semester_headroom} points of headroom remaining in Semester ${evidence.current_semester} before hitting the AICTE 30-point semester cap. Target 1 or 2 high-value activities right now.`
        : `You have reached the 30-point ceiling for Semester ${evidence.current_semester}! Any additional activities submitted now should be allocated to Semester ${evidence.current_semester + 1}.`;

      advicePayload = {
        summary: `You are currently in ${evidence.milestone_tier} tier with ${evidence.current_points} out of ${evidence.target_points} points (${evidence.progress_percentage}% degree clearance). You need ${evidence.remaining_points} more points to satisfy autonomous graduation criteria.`,
        target_plan: `Complete ${topRecs.length} activities across your highest-headroom categories (${uncapped.slice(0, 2).map((c) => c.category_name).join(', ')}) to advance toward the next milestone.`,
        category_strategy: strategyList,
        recommended_activities: topRecs.map((r) => ({
          id: r.id,
          title: r.title,
          category_name: r.category_name,
          base_points: r.base_points,
          source: r.source,
          venue_or_criteria: r.venue_or_criteria || 'Department approved criteria',
        })),
        semester_guidance: semGuidance,
      };
      modelUsed = 'graph-rag-deterministic-engine';
    }

    // Log the advice session
    const logId = `log_${Date.now()}`;
    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'AI_ADVISOR_CONSULTATION', ?, ?)
    `, [
      logId,
      studentId,
      `Student consulted AI Advisor with query: "${query.substring(0, 80)}" (Model: ${modelUsed})`,
      new Date().toISOString(),
    ]);

    const result = {
      student_id: studentId,
      query,
      graph_evidence: evidence,
      advice: advicePayload,
      is_graph_rag: true,
      generated_at: new Date().toISOString(),
      model_used: modelUsed,
    };

    res.json(result);
  } catch (err: any) {
    console.error('AI Advisor error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate AI advice' });
  }
});

// GET /api/student/prior-academics - Get 10th & 12th/Diploma academic records
router.get('/prior-academics', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const records = await queryOne(`
      SELECT 
        id, name, roll_no, email,
        tenth_percentage, tenth_board, tenth_year,
        twelfth_percentage, twelfth_board, twelfth_year,
        diploma_or_pu
      FROM users
      WHERE id = ?
    `, [studentId]);

    if (!records) {
      res.status(404).json({ error: 'Student record not found' });
      return;
    }

    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/student/prior-academics - Update 10th & 12th/Diploma academic records for placement eligibility
router.put('/prior-academics', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const {
      tenth_percentage,
      tenth_board,
      tenth_year,
      twelfth_percentage,
      twelfth_board,
      twelfth_year,
      diploma_or_pu = 'puc',
    } = req.body;

    const parsedTenth = tenth_percentage !== undefined && tenth_percentage !== null && tenth_percentage !== ''
      ? parseFloat(tenth_percentage)
      : null;
    const parsedTwelfth = twelfth_percentage !== undefined && twelfth_percentage !== null && twelfth_percentage !== ''
      ? parseFloat(twelfth_percentage)
      : null;

    if (parsedTenth !== null && (isNaN(parsedTenth) || parsedTenth < 0 || parsedTenth > 100)) {
      res.status(400).json({ error: '10th percentage must be a valid number between 0 and 100' });
      return;
    }

    if (parsedTwelfth !== null && (isNaN(parsedTwelfth) || parsedTwelfth < 0 || parsedTwelfth > 100)) {
      res.status(400).json({ error: '12th/Diploma percentage must be a valid number between 0 and 100' });
      return;
    }

    await executeRun(`
      UPDATE users SET
        tenth_percentage = ?,
        tenth_board = ?,
        tenth_year = ?,
        twelfth_percentage = ?,
        twelfth_board = ?,
        twelfth_year = ?,
        diploma_or_pu = ?
      WHERE id = ?
    `, [
      parsedTenth,
      tenth_board ? String(tenth_board).trim() : null,
      tenth_year ? parseInt(String(tenth_year), 10) : null,
      parsedTwelfth,
      twelfth_board ? String(twelfth_board).trim() : null,
      twelfth_year ? parseInt(String(twelfth_year), 10) : null,
      diploma_or_pu ? String(diploma_or_pu).toLowerCase() : 'puc',
      studentId,
    ]);

    // Record activity log
    const logId = `log_${Date.now()}`;
    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'UPDATE_PRIOR_ACADEMICS', ?, ?)
    `, [
      logId,
      studentId,
      `Student updated prior academic credentials: 10th (${parsedTenth || 'N/A'}%), 12th/Diploma (${parsedTwelfth || 'N/A'}%)`,
      new Date().toISOString(),
    ]);

    const updated = await queryOne(`
      SELECT 
        id, name, roll_no, email,
        tenth_percentage, tenth_board, tenth_year,
        twelfth_percentage, twelfth_board, twelfth_year,
        diploma_or_pu
      FROM users
      WHERE id = ?
    `, [studentId]);

    res.json({
      success: true,
      message: 'Prior academic credentials (10th & 12th) updated successfully',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
