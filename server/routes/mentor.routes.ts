import { Router, Response } from 'express';
import { queryAll, queryOne, executeRun } from '../db/database';
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

// 4. Mentor / HOD Marks Update Route with Auto Academic Alert Notification
const handleMentorUpdateMarks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      mark_id,
      id,
      student_id,
      semester,
      subject_code,
      subject_name,
      credits,
      theory_marks,
      theory_max,
      task_marks,
      task_max,
      has_lab,
      lab_marks,
      lab_max,
      mse1_marks,
      mse1_max,
      mse2_marks,
      mse2_max,
      mse_marks,
    } = req.body;

    const targetMarkId = mark_id || id;
    let existingMark: any = null;

    if (targetMarkId) {
      existingMark = await queryOne('SELECT * FROM student_marks WHERE id = ?', [targetMarkId]);
    }

    if (!existingMark && student_id && subject_code) {
      existingMark = await queryOne('SELECT * FROM student_marks WHERE student_id = ? AND subject_code = ?', [student_id, subject_code]);
    }

    const targetStudentId = student_id || existingMark?.student_id;
    if (!targetStudentId) {
      res.status(400).json({ error: 'student_id or a valid mark_id is required' });
      return;
    }

    const student = await queryOne<{ id: string; name: string; roll_no: string; mentor_id: string }>(
      'SELECT id, name, roll_no, mentor_id FROM users WHERE id = ?',
      [targetStudentId]
    );

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    if (req.user!.role === 'mentor' && student.mentor_id && student.mentor_id !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized: Student is not assigned to your mentorship roster' });
      return;
    }

    const m1 = mse1_marks !== undefined ? Number(mse1_marks) : (mse_marks !== undefined ? Number(mse_marks) : (existingMark?.mse1_marks !== undefined && existingMark?.mse1_marks !== null ? Number(existingMark.mse1_marks) : 0));
    const m2 = mse2_marks !== undefined ? Number(mse2_marks) : (existingMark?.mse2_marks !== undefined && existingMark?.mse2_marks !== null ? Number(existingMark.mse2_marks) : 0);
    const m1M = Number(mse1_max) || Number(existingMark?.mse1_max) || 30;
    const m2M = Number(mse2_max) || Number(existingMark?.mse2_max) || 30;

    // Check if MSE marks < 12 (out of 30, i.e. < 40%). If poor, set is_poor_performance = 1.
    const hasPoorMse = (m1 < 12) || (m2 > 0 && m2 < 12) || (mse_marks !== undefined && Number(mse_marks) < 12);
    const isPoor = hasPoorMse ? 1 : 0;

    const subName = (subject_name || existingMark?.subject_name || 'Academic Course').trim();
    const subCode = (subject_code || existingMark?.subject_code || 'SUB001').trim();
    const sem = semester ? Number(semester) : (existingMark?.semester || 6);
    const cred = credits ? Number(credits) : (existingMark?.credits || 4);

    const theory = theory_marks !== undefined ? Number(theory_marks) : (existingMark?.theory_marks ? Number(existingMark.theory_marks) : 0);
    const theoryM = theory_max !== undefined ? Number(theory_max) : (existingMark?.theory_max ? Number(existingMark.theory_max) : 100);
    const task = task_marks !== undefined ? Number(task_marks) : (existingMark?.task_marks ? Number(existingMark.task_marks) : 0);
    const taskM = task_max !== undefined ? Number(task_max) : (existingMark?.task_max ? Number(existingMark.task_max) : 25);
    const isLab = has_lab !== undefined ? Boolean(has_lab) : Boolean(existingMark?.has_lab);
    const lab = isLab ? (lab_marks !== undefined ? Number(lab_marks) : (existingMark?.lab_marks ? Number(existingMark.lab_marks) : 0)) : 0;
    const labM = isLab ? (lab_max !== undefined ? Number(lab_max) : (existingMark?.lab_max ? Number(existingMark.lab_max) : 50)) : 0;

    const totalScored = theory + task + lab;
    const totalMax = theoryM + taskM + labM;
    const percentage = totalMax > 0 ? (totalScored / totalMax) * 100 : 0;
    const { grade, grade_points } = calculateGradeAndPoints(percentage);

    const now = new Date().toISOString();
    let finalMarkId = existingMark?.id;

    if (existingMark) {
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
        WHERE id = ?
      `, [
        sem, subCode, subName, cred, theory, theoryM, task, taskM,
        isLab ? 1 : 0, lab, labM, m1, m1M, m2, m2M, isPoor, grade, grade_points, now, existingMark.id
      ]);
    } else {
      finalMarkId = `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await executeRun(`
        INSERT INTO student_marks (
          id, student_id, semester, subject_code, subject_name, credits,
          theory_marks, theory_max, task_marks, task_max, has_lab, lab_marks, lab_max,
          mse1_marks, mse1_max, mse2_marks, mse2_max, is_poor_performance,
          grade, grade_points, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        finalMarkId, targetStudentId, sem, subCode, subName, cred,
        theory, theoryM, task, taskM, isLab ? 1 : 0, lab, labM,
        m1, m1M, m2, m2M, isPoor, grade, grade_points, now, now
      ]);
    }

    // Automatically create an academic alert notification in notifications table for the student's assigned mentor:
    if (isPoor === 1 && student.mentor_id) {
      const mseMarks = (m1 < 12 && m2 > 0 && m2 < 12) ? Math.min(m1, m2) : (m1 < 12 ? m1 : m2);
      const notifId = `notif_alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const notifTitle = 'Poor MSE Performance Alert: ' + student.name;
      const notifMessage = 'Mentee ' + student.name + ' (' + (student.roll_no || 'N/A') + ') scored below 40% in ' + subName + ' (MSE: ' + mseMarks + '/30). Please conduct academic counseling.';

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

    const updated = await queryOne('SELECT * FROM student_marks WHERE id = ?', [finalMarkId]);
    res.json({
      success: true,
      mark: updated,
      is_poor_performance: Boolean(isPoor),
      mentor_alert_triggered: Boolean(isPoor && student.mentor_id),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

router.post('/update-marks', authenticate, requireRole(['mentor', 'hod']), handleMentorUpdateMarks);
router.put('/update-marks', authenticate, requireRole(['mentor', 'hod']), handleMentorUpdateMarks);

export default router;
