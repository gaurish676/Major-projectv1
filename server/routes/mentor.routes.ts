import { Router, Response } from 'express';
import { queryAll, queryOne } from '../db/database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { calculateStudentPoints } from '../services/pointsCalculator';
import { generateRandomStudentMarks } from '../services/curriculumSubjects';

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

    // Assigned mentees
    const mentees = await queryAll(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.roll_no, 
        u.semester, 
        u.cgpa, 
        u.avatar,
        COALESCE(SUM(CASE WHEN s.status = 'pending' THEN 1 ELSE 0 END), 0) as pending_submissions_count
      FROM users u
      LEFT JOIN submissions s ON s.student_id = u.id
      WHERE u.mentor_id = ?
      GROUP BY u.id
      ORDER BY u.name ASC
    `, [mentorId]);

    const formattedMentees = await Promise.all(mentees.map(async (m) => {
      const pointsData = await calculateStudentPoints(m.id, m.semester || 1);
      return {
        ...m,
        approved_points: pointsData.total_effective_points,
        raw_total_points: pointsData.raw_total_points,
        total_excess_points: pointsData.total_excess_points,
        semester_capped_points: pointsData.semester_capped_points,
        pending_submissions_count: Number(m.pending_submissions_count),
        completed_percentage: pointsData.progress_percentage,
        milestone_tier: pointsData.milestone_tier,
      };
    }));

    // Sort by approved points descending
    formattedMentees.sort((a, b) => b.approved_points - a.approved_points);

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

    const pointsData = await calculateStudentPoints(id, student.semester || 1);

    res.json({
      student,
      total_points: pointsData.total_effective_points,
      raw_total_points: pointsData.raw_total_points,
      total_excess_points: pointsData.total_excess_points,
      semester_capped_points: pointsData.semester_capped_points,
      semester_limit_per_semester: pointsData.semester_limit_per_semester,
      category_breakdown: pointsData.categories_breakdown,
      semester_breakdown: pointsData.semester_breakdown,
      year_breakdown: pointsData.year_breakdown,
      submissions,
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

// Ensure default demo marks exist for assigned mentees so mentor can immediately review real data
async function ensureDemoMarksForMentees(mentorId: string) {
  try {
    const mentees = await queryAll<{ id: string; semester: number }>(`
      SELECT id, semester FROM users WHERE role = 'student' AND (mentor_id = ? OR mentor_id IS NULL)
    `, [mentorId]);

    const now = new Date().toISOString();

    for (const mentee of mentees) {
      const existing = await queryOne<{ count: number }>(`
        SELECT COUNT(id) as count FROM student_marks WHERE student_id = ?
      `, [mentee.id]);

      if (!existing || existing.count === 0) {
        // Generate for their current semester and one previous semester (if sem > 1)
        const currentSem = mentee.semester || 6;
        const semestersToSeed = currentSem > 1 ? [currentSem - 1, currentSem] : [1];
        
        for (const sem of semestersToSeed) {
          const generated = generateRandomStudentMarks(mentee.id, sem, Math.floor(Math.random() * 10) - 3);
          for (const sm of generated) {
            await queryOne(`
              INSERT OR REPLACE INTO student_marks 
              (id, student_id, semester, subject_code, subject_name, credits, theory_marks, theory_max, task_marks, task_max, has_lab, lab_marks, lab_max, grade, grade_points, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              sm.id, sm.student_id, sm.semester, sm.subject_code, sm.subject_name, sm.credits,
              sm.theory_marks, sm.theory_max, sm.task_marks, sm.task_max, sm.has_lab, sm.lab_marks, sm.lab_max,
              sm.grade, sm.grade_points, now, now
            ]);
          }
        }
      }
    }
  } catch (e) {
    console.error('Error ensuring demo marks for mentees:', e);
  }
}

// 3. Mentor View: Student Marks Semester-Wise
router.get('/student-marks', authenticate, requireRole(['mentor', 'hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const mentorId = req.user!.id;
    const isHod = req.user!.role === 'hod';
    await ensureDemoMarksForMentees(mentorId);

    const studentIdQuery = req.query.student_id as string | undefined;
    const semesterQuery = req.query.semester ? parseInt(req.query.semester as string, 10) : undefined;

    // Fetch assigned mentees
    const mentees = isHod
      ? await queryAll(`
          SELECT u.id, u.name, u.email, u.roll_no, u.semester, u.cgpa, u.avatar, m.name as mentor_name
          FROM users u
          LEFT JOIN users m ON u.mentor_id = m.id
          WHERE u.role = 'student'
          ORDER BY u.name ASC
        `)
      : await queryAll(`
          SELECT u.id, u.name, u.email, u.roll_no, u.semester, u.cgpa, u.avatar
          FROM users u
          WHERE u.mentor_id = ? AND u.role = 'student'
          ORDER BY u.name ASC
        `, [mentorId]);

    if (mentees.length === 0) {
      res.json({
        mentees: [],
        selected_student: null,
        semester_summaries: [],
        overall_cgpa: 0,
        all_marks: [],
      });
      return;
    }

    // Determine target student
    let targetStudentId = studentIdQuery;
    if (!targetStudentId || !mentees.some((m) => m.id === targetStudentId)) {
      targetStudentId = mentees[0].id;
    }

    const selectedStudent = mentees.find((m) => m.id === targetStudentId) || mentees[0];

    // Fetch marks for target student
    let marksSql = `
      SELECT * FROM student_marks
      WHERE student_id = ?
    `;
    const marksParams: any[] = [targetStudentId];

    if (semesterQuery && !isNaN(semesterQuery)) {
      marksSql += ` AND semester = ?`;
      marksParams.push(semesterQuery);
    }

    marksSql += ` ORDER BY semester ASC, subject_code ASC`;

    const rawMarks = await queryAll(marksSql, marksParams);

    // Format each mark
    const formattedMarks = rawMarks.map((m) => {
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
        total_scored: totalScored,
        total_max: totalMax,
        percentage,
        grade,
        grade_points,
      };
    });

    // Group marks semester-wise
    const semesterMap = new Map<number, typeof formattedMarks>();
    for (const mark of formattedMarks) {
      const sem = mark.semester;
      if (!semesterMap.has(sem)) {
        semesterMap.set(sem, []);
      }
      semesterMap.get(sem)!.push(mark);
    }

    // Build semester summaries
    const semesterSummaries = Array.from(semesterMap.entries())
      .map(([sem, subjects]) => {
        let totalCredits = 0;
        let weightedPointsSum = 0;
        let totalScored = 0;
        let totalMax = 0;

        subjects.forEach((s) => {
          totalCredits += Number(s.credits) || 0;
          weightedPointsSum += (Number(s.credits) || 0) * (Number(s.grade_points) || 0);
          totalScored += s.total_scored;
          totalMax += s.total_max;
        });

        const sgpa = totalCredits > 0 ? Math.round((weightedPointsSum / totalCredits) * 100) / 100 : 0;
        const percentage = totalMax > 0 ? Math.round((totalScored / totalMax) * 1000) / 10 : 0;

        return {
          semester: sem,
          total_subjects: subjects.length,
          total_credits: totalCredits,
          total_scored: totalScored,
          total_max: totalMax,
          percentage,
          sgpa,
          subjects,
        };
      })
      .sort((a, b) => a.semester - b.semester);

    // Compute cumulative stats for selected student
    let totalAllCredits = 0;
    let totalAllWeightedPoints = 0;
    semesterSummaries.forEach((s) => {
      totalAllCredits += s.total_credits;
      totalAllWeightedPoints += s.sgpa * s.total_credits;
    });
    const calculatedCgpa = totalAllCredits > 0 ? Math.round((totalAllWeightedPoints / totalAllCredits) * 100) / 100 : Number(selectedStudent.cgpa) || 0;

    // Enhance mentees list with overview of entered data
    const allMenteesMarks = await queryAll(`
      SELECT student_id, semester, COUNT(id) as count, SUM(credits) as credits
      FROM student_marks
      WHERE student_id IN (${mentees.map(() => '?').join(',')})
      GROUP BY student_id, semester
    `, mentees.map((m) => m.id));

    const menteesEnhanced = mentees.map((m) => {
      const studentMarksEntries = allMenteesMarks.filter((entry) => entry.student_id === m.id);
      const semestersRecorded = studentMarksEntries.map((e) => Number(e.semester)).sort((a, b) => a - b);
      const totalRecordedSubjects = studentMarksEntries.reduce((sum, e) => sum + Number(e.count), 0);

      return {
        ...m,
        semesters_recorded: semestersRecorded,
        total_subjects_count: totalRecordedSubjects,
        has_marks_data: totalRecordedSubjects > 0,
      };
    });

    res.json({
      mentees: menteesEnhanced,
      selected_student: selectedStudent,
      semester_summaries: semesterSummaries,
      overall_cgpa: calculatedCgpa,
      all_marks: formattedMarks,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
