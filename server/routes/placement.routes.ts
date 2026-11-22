import { Router, Response } from 'express';
import { queryAll, queryOne, executeRun } from '../db/database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { calculateStudentPoints } from '../services/pointsCalculator';
import { PlacementDrive, MenteePlacementEligibility } from '../../src/types';

const router = Router();

// 1. List active campus placement drives
router.get('/drives', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const drives = await queryAll<PlacementDrive>(`
      SELECT * FROM placement_drives WHERE is_active = 1 ORDER BY package_lpa DESC
    `);
    res.json(drives);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Mentee Placement Eligibility Matrix for Mentor / HOD / Dean
router.get('/mentor-eligibility', authenticate, requireRole(['mentor', 'hod', 'dean']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const drives = await queryAll<PlacementDrive>(`
      SELECT * FROM placement_drives WHERE is_active = 1 ORDER BY package_lpa DESC
    `);

    let studentSql = `
      SELECT id, name, roll_no, semester, cgpa, mentor_id,
             tenth_percentage, tenth_board, tenth_year,
             twelfth_percentage, twelfth_board, twelfth_year, diploma_or_pu
      FROM users
      WHERE role = 'student'
    `;
    const params: any[] = [];

    if (user.role === 'mentor') {
      studentSql += ` AND (mentor_id = ? OR mentor_id IS NULL)`;
      params.push(user.id);
    } else if (user.role === 'hod') {
      studentSql += ` AND department_id = ?`;
      params.push(user.department_id);
    }

    studentSql += ` ORDER BY name ASC`;
    const students = await queryAll(studentSql, params);

    const matrix: MenteePlacementEligibility[] = [];

    for (const st of students) {
      const sem = Number(st.semester) || 6;
      const pData = await calculateStudentPoints(st.id, sem);
      const studentPoints = pData.total_effective_points;
      const studentCgpa = Number(st.cgpa) || 8.0;

      // Query student_marks to count active backlogs (is_poor_performance = 1 or grade = 'F')
      const backlogsRow = await queryOne<{ count: number }>(`
        SELECT COUNT(*) as count
        FROM student_marks
        WHERE student_id = ? AND (is_poor_performance = 1 OR grade = 'F')
      `, [st.id]);
      const activeBacklogs = Number(backlogsRow?.count) || 0;

      const studentTenth = st.tenth_percentage != null ? Number(st.tenth_percentage) : null;
      const studentTwelfth = st.twelfth_percentage != null ? Number(st.twelfth_percentage) : null;
      const hasPriorMarks = studentTenth !== null && studentTwelfth !== null;

      const companyStatus = drives.map((drv) => {
        const minTenth = Number(drv.min_tenth_percentage) || 0;
        const minTwelfth = Number(drv.min_twelfth_percentage) || 0;

        const pointsEligible = studentPoints >= drv.min_activity_points;
        const cgpaEligible = studentCgpa >= drv.min_cgpa;
        const maxBacklogsAllowed = Number(drv.max_backlogs) || 0;
        const backlogsEligible = activeBacklogs <= maxBacklogsAllowed;

        const tenthEligible = minTenth === 0 || (studentTenth !== null && studentTenth >= minTenth);
        const twelfthEligible = minTwelfth === 0 || (studentTwelfth !== null && studentTwelfth >= minTwelfth);
        const priorMarksEligible = tenthEligible && twelfthEligible;

        const isEligible = pointsEligible && cgpaEligible && backlogsEligible && priorMarksEligible && hasPriorMarks;

        const missingPoints = Math.max(0, drv.min_activity_points - studentPoints);
        const missingCgpa = Math.max(0, Math.round((drv.min_cgpa - studentCgpa) * 100) / 100);
        const missingTenth = minTenth > 0 && studentTenth !== null ? Math.max(0, Math.round((minTenth - studentTenth) * 10) / 10) : 0;
        const missingTwelfth = minTwelfth > 0 && studentTwelfth !== null ? Math.max(0, Math.round((minTwelfth - studentTwelfth) * 10) / 10) : 0;

        let statusLabel: 'Eligible' | 'Short of Points' | 'Short of CGPA' | 'Short of 10th/12th' | 'Critical Deficit' | 'Backlog Ineligible' | 'Missing 10th/12th Marks' = 'Eligible';
        if (!hasPriorMarks) {
          statusLabel = 'Missing 10th/12th Marks';
        } else if (!backlogsEligible && (!pointsEligible || !cgpaEligible || !priorMarksEligible)) {
          statusLabel = 'Critical Deficit';
        } else if (!backlogsEligible) {
          statusLabel = 'Backlog Ineligible';
        } else if (!pointsEligible && !cgpaEligible) {
          statusLabel = 'Critical Deficit';
        } else if (!priorMarksEligible) {
          statusLabel = 'Short of 10th/12th';
        } else if (!pointsEligible) {
          statusLabel = 'Short of Points';
        } else if (!cgpaEligible) {
          statusLabel = 'Short of CGPA';
        }

        return {
          company_id: drv.id,
          company_name: drv.company_name,
          role_title: drv.role_title,
          package_lpa: drv.package_lpa,
          min_cgpa: drv.min_cgpa,
          min_activity_points: drv.min_activity_points,
          min_tenth_percentage: minTenth,
          min_twelfth_percentage: minTwelfth,
          max_backlogs: maxBacklogsAllowed,
          is_eligible: isEligible,
          cgpa_eligible: cgpaEligible,
          points_eligible: pointsEligible,
          backlogs_eligible: backlogsEligible,
          tenth_eligible: tenthEligible,
          twelfth_eligible: twelfthEligible,
          has_prior_marks: hasPriorMarks,
          active_backlogs: activeBacklogs,
          missing_points: missingPoints,
          missing_cgpa: missingCgpa,
          missing_tenth: missingTenth,
          missing_twelfth: missingTwelfth,
          status_label: statusLabel,
        };
      });

      matrix.push({
        student_id: st.id,
        student_name: st.name,
        student_roll_no: st.roll_no || 'N/A',
        cgpa: studentCgpa,
        approved_points: studentPoints,
        semester: sem,
        tenth_percentage: studentTenth,
        tenth_board: st.tenth_board,
        tenth_year: st.tenth_year,
        twelfth_percentage: studentTwelfth,
        twelfth_board: st.twelfth_board,
        twelfth_year: st.twelfth_year,
        diploma_or_pu: st.diploma_or_pu,
        active_backlogs: activeBacklogs,
        company_status: companyStatus,
      });
    }

    res.json({
      drives,
      mentees_eligibility: matrix,
      total_mentees: students.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2.5 Student Self-Eligibility Check
router.get('/my-eligibility', authenticate, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const st = await queryOne(`
      SELECT id, name, roll_no, semester, cgpa,
             tenth_percentage, tenth_board, tenth_year,
             twelfth_percentage, twelfth_board, twelfth_year, diploma_or_pu
      FROM users
      WHERE id = ?
    `, [studentId]);

    if (!st) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    const drives = await queryAll<PlacementDrive>(`
      SELECT * FROM placement_drives WHERE is_active = 1 ORDER BY package_lpa DESC
    `);

    const sem = Number(st.semester) || 6;
    const pData = await calculateStudentPoints(studentId, sem);
    const studentPoints = pData.total_effective_points;
    const studentCgpa = Number(st.cgpa) || 8.0;

    const backlogsRow = await queryOne<{ count: number }>(`
      SELECT COUNT(*) as count
      FROM student_marks
      WHERE student_id = ? AND (is_poor_performance = 1 OR grade = 'F')
    `, [studentId]);
    const activeBacklogs = Number(backlogsRow?.count) || 0;

    const studentTenth = st.tenth_percentage != null ? Number(st.tenth_percentage) : null;
    const studentTwelfth = st.twelfth_percentage != null ? Number(st.twelfth_percentage) : null;
    const hasPriorMarks = studentTenth !== null && studentTwelfth !== null;

    const drivesStatus = drives.map((drv) => {
      const minTenth = Number(drv.min_tenth_percentage) || 0;
      const minTwelfth = Number(drv.min_twelfth_percentage) || 0;

      const pointsEligible = studentPoints >= drv.min_activity_points;
      const cgpaEligible = studentCgpa >= drv.min_cgpa;
      const maxBacklogsAllowed = Number(drv.max_backlogs) || 0;
      const backlogsEligible = activeBacklogs <= maxBacklogsAllowed;

      const tenthEligible = minTenth === 0 || (studentTenth !== null && studentTenth >= minTenth);
      const twelfthEligible = minTwelfth === 0 || (studentTwelfth !== null && studentTwelfth >= minTwelfth);
      const priorMarksEligible = tenthEligible && twelfthEligible;

      const isEligible = pointsEligible && cgpaEligible && backlogsEligible && priorMarksEligible && hasPriorMarks;

      const missingPoints = Math.max(0, drv.min_activity_points - studentPoints);
      const missingCgpa = Math.max(0, Math.round((drv.min_cgpa - studentCgpa) * 100) / 100);
      const missingTenth = minTenth > 0 && studentTenth !== null ? Math.max(0, Math.round((minTenth - studentTenth) * 10) / 10) : 0;
      const missingTwelfth = minTwelfth > 0 && studentTwelfth !== null ? Math.max(0, Math.round((minTwelfth - studentTwelfth) * 10) / 10) : 0;

      let statusLabel: 'Eligible' | 'Short of Points' | 'Short of CGPA' | 'Short of 10th/12th' | 'Critical Deficit' | 'Backlog Ineligible' | 'Missing 10th/12th Marks' = 'Eligible';
      if (!hasPriorMarks) {
        statusLabel = 'Missing 10th/12th Marks';
      } else if (!backlogsEligible && (!pointsEligible || !cgpaEligible || !priorMarksEligible)) {
        statusLabel = 'Critical Deficit';
      } else if (!backlogsEligible) {
        statusLabel = 'Backlog Ineligible';
      } else if (!pointsEligible && !cgpaEligible) {
        statusLabel = 'Critical Deficit';
      } else if (!priorMarksEligible) {
        statusLabel = 'Short of 10th/12th';
      } else if (!pointsEligible) {
        statusLabel = 'Short of Points';
      } else if (!cgpaEligible) {
        statusLabel = 'Short of CGPA';
      }

      return {
        company_id: drv.id,
        company_name: drv.company_name,
        role_title: drv.role_title,
        package_lpa: drv.package_lpa,
        min_cgpa: drv.min_cgpa,
        min_activity_points: drv.min_activity_points,
        min_tenth_percentage: minTenth,
        min_twelfth_percentage: minTwelfth,
        max_backlogs: maxBacklogsAllowed,
        is_eligible: isEligible,
        cgpa_eligible: cgpaEligible,
        points_eligible: pointsEligible,
        backlogs_eligible: backlogsEligible,
        tenth_eligible: tenthEligible,
        twelfth_eligible: twelfthEligible,
        has_prior_marks: hasPriorMarks,
        active_backlogs: activeBacklogs,
        missing_points: missingPoints,
        missing_cgpa: missingCgpa,
        missing_tenth: missingTenth,
        missing_twelfth: missingTwelfth,
        status_label: statusLabel,
      };
    });

    res.json({
      student: {
        id: st.id,
        name: st.name,
        roll_no: st.roll_no,
        semester: sem,
        cgpa: studentCgpa,
        approved_points: studentPoints,
        active_backlogs: activeBacklogs,
        tenth_percentage: studentTenth,
        tenth_board: st.tenth_board,
        tenth_year: st.tenth_year,
        twelfth_percentage: studentTwelfth,
        twelfth_board: st.twelfth_board,
        twelfth_year: st.twelfth_year,
        diploma_or_pu: st.diploma_or_pu,
        has_prior_marks: hasPriorMarks,
      },
      drives_status: drivesStatus,
      eligible_count: drivesStatus.filter((d) => d.is_eligible).length,
      total_drives: drives.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Send Placement Deficit / Prior Marks Reminder to Mentee
router.post('/remind-mentee', authenticate, requireRole(['mentor', 'hod', 'dean']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { student_id, company_name, missing_points, package_lpa, reminder_type } = req.body;
    if (!student_id) {
      res.status(400).json({ error: 'student_id is required' });
      return;
    }

    const student = await queryOne('SELECT id, name, mentor_id FROM users WHERE id = ?', [student_id]);
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    const notifId = `notif_plc_${Date.now()}`;
    const now = new Date().toISOString();

    let title = `Campus Placement Alert: ${company_name || 'Placement Drive'} Requirement`;
    let message = `Dear ${student.name}, you are currently ${missing_points || 15} activity points short of qualifying for the upcoming ${company_name || 'campus'} placement drive (${package_lpa || 'Tier-1'} LPA). Please submit your pending certificates for mentor verification to secure your eligibility.`;

    if (reminder_type === 'prior_marks') {
      title = `Action Required: Submit 10th & 12th Marks for Placement Drives`;
      message = `Dear ${student.name}, several campus placement drives (including ${company_name || 'Tier-1 Companies'}) require 10th and 12th/Diploma percentage cutoffs. Please go to the Academic Marks section and submit your 10th & 12th marks to verify your placement eligibility.`;
    }

    await executeRun(`
      INSERT INTO notifications (
        id, sender_id, sender_name, sender_role, recipient_id, recipient_role, category,
        title, message, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, 'student', 'meeting', ?, ?, 0, ?)
    `, [
      notifId,
      req.user!.id,
      req.user!.name,
      req.user!.role,
      student.id,
      title,
      message,
      now,
    ]);

    res.json({ success: true, message: `Placement reminder dispatched to ${student.name}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
