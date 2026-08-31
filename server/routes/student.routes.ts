import { Router, Response } from 'express';
import { queryAll, queryOne } from '../db/database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { calculateStudentPoints } from '../services/pointsCalculator';
import { generateRandomStudentMarks } from '../services/curriculumSubjects';

const router = Router();

/**
 * Recalculates CGPA from all saved marks and writes it back to users.cgpa.
 * Called after every mark add, update, or delete so the dashboard always
 * shows the live computed value instead of the stale registration default.
 */
async function recalculateAndSaveCGPA(studentId: string): Promise<void> {
  const { executeRun } = await import('../db/database');
  const allMarks = await queryAll(
    `SELECT credits, grade_points FROM student_marks WHERE student_id = ?`,
    [studentId]
  );

  if (allMarks.length === 0) {
    // No marks at all — reset CGPA to 0
    await executeRun(`UPDATE users SET cgpa = 0 WHERE id = ?`, [studentId]);
    return;
  }

  let totalCredits = 0;
  let weightedGP = 0;
  allMarks.forEach((m: any) => {
    const cr = Number(m.credits) || 0;
    const gp = Number(m.grade_points) || 0;
    totalCredits += cr;
    weightedGP += cr * gp;
  });

  const cgpa = totalCredits > 0
    ? Math.round((weightedGP / totalCredits) * 100) / 100
    : 0;

  await executeRun(`UPDATE users SET cgpa = ? WHERE id = ?`, [cgpa, studentId]);
}

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

    // Recalculate CGPA after adding a new mark
    await recalculateAndSaveCGPA(studentId);

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

    // Recalculate and persist CGPA after single mark update
    await recalculateAndSaveCGPA(studentId);

    const updated = await queryOne(`SELECT * FROM student_marks WHERE id = ?`, [markId]);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/student/marks/semester/:semester - Delete all subject marks for a semester
// NOTE: This route MUST be defined BEFORE DELETE /marks/:id
router.delete('/marks/semester/:semester', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const semester = parseInt(req.params.semester, 10);

    if (isNaN(semester)) {
      return res.status(400).json({ error: 'Valid semester number is required' });
    }

    const { executeRun } = await import('../db/database');
    await executeRun(`DELETE FROM student_marks WHERE student_id = ? AND semester = ?`, [studentId, semester]);

    // Recalculate CGPA after semester deletion
    await recalculateAndSaveCGPA(studentId);

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

    // Recalculate CGPA after batch insert
    await recalculateAndSaveCGPA(studentId);

    res.json({ message: 'All subjects saved successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/student/marks/batch-update - Update all subject marks at once
// NOTE: This route MUST be defined BEFORE PUT /marks/:id to prevent Express
// from matching "batch-update" as the :id parameter.
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

    // Recalculate and persist CGPA after batch update
    await recalculateAndSaveCGPA(studentId);

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

    // Recalculate CGPA after deletion
    await recalculateAndSaveCGPA(studentId);

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

// POST /api/student/ai-advisor - GraphRAG AI Academic Advisor
router.post('/ai-advisor', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { query } = req.body;

    const { getGraphRAGRecommendation } = await import('../services/graphRagService');
    const result = await getGraphRAGRecommendation(studentId, query);

    res.json(result);
  } catch (err: any) {
    console.error('GraphRAG AI Advisor error:', err);
    res.status(500).json({ error: err.message || 'Failed to retrieve GraphRAG recommendations' });
  }
});

// GET /api/student/knowledge-graph - Extract full or student knowledge graph visualization structure
router.get('/knowledge-graph', authenticate, requireRole(['student', 'mentor', 'hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { buildKnowledgeGraph, getStudentKnowledgeContext } = await import('../services/knowledgeGraph');
    const kg = await buildKnowledgeGraph();

    const nodesArray = Array.from(kg.nodes.values());
    const studentId = req.query.student_id ? (req.query.student_id as string) : req.user!.id;
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

export default router;
