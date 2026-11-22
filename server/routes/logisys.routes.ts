import { Router, Response } from 'express';
import { queryAll, queryOne } from '../db/database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { calculateStudentPoints, computePointsSync } from '../services/pointsCalculator';
import { LogisysExportRow } from '../../src/types';

const router = Router();

/**
 * Generate Logisys ERP upload dataset for the department
 */
async function generateLogisysDataset(departmentId: string): Promise<{
  rows: LogisysExportRow[];
  stats: {
    total_students: number;
    cleared_count: number;
    pending_count: number;
    at_risk_count: number;
    college_code: string;
    academic_year: string;
  };
}> {
  const students = await queryAll(`
    SELECT 
      u.id, 
      u.roll_no, 
      u.name, 
      u.semester, 
      u.cgpa,
      d.code as dept_code,
      d.name as dept_name
    FROM users u
    JOIN departments d ON u.department_id = d.id
    WHERE u.role = 'student' AND u.department_id = ?
    ORDER BY u.roll_no ASC
  `, [departmentId]);

  // Batch fetch categories and submissions in 2 queries (eliminates N+1 loop)
  const categories = await queryAll(`
    SELECT id, name, description, max_cap_points, icon, color
    FROM schema_categories
    ORDER BY name ASC
  `);

  const allSubmissions = await queryAll(`
    SELECT s.id, s.student_id, s.category_id, s.status, s.points_awarded, s.semester
    FROM submissions s
  `);

  const studentSubmissionsMap = new Map<string, any[]>();
  for (const sub of allSubmissions) {
    const list = studentSubmissionsMap.get(sub.student_id) || [];
    list.push(sub);
    studentSubmissionsMap.set(sub.student_id, list);
  }

  const rows: LogisysExportRow[] = [];
  let clearedCount = 0;
  let pendingCount = 0;
  let atRiskCount = 0;

  for (let i = 0; i < students.length; i++) {
    const st = students[i];
    const sem = Number(st.semester) || 6;
    const subs = studentSubmissionsMap.get(st.id) || [];
    const pData = computePointsSync(st.id, sem, categories, subs);
    const pts = pData.total_effective_points;
    const isCleared = pts >= 200;
    const isAtRisk = pts < 60 && sem >= 6;

    let grade = 'F';
    if (pts >= 200) grade = 'O';
    else if (pts >= 160) grade = 'A+';
    else if (pts >= 120) grade = 'A';
    else if (pts >= 80) grade = 'B+';
    else if (pts >= 50) grade = 'B';

    let clearanceStatus: 'CLEARED' | 'PENDING' | 'AT_RISK' = 'PENDING';
    if (isCleared) {
      clearanceStatus = 'CLEARED';
      clearedCount++;
    } else if (isAtRisk) {
      clearanceStatus = 'AT_RISK';
      atRiskCount++;
    } else {
      pendingCount++;
    }

    // Determine University Logisys Subject Code based on syllabus batch
    const activitySubjectCode = sem >= 7 ? '21ACT79' : sem >= 5 ? '21ACT59' : '21ACT39';

    rows.push({
      sl_no: i + 1,
      college_code: 'ENG-4NN',
      degree_code: `BE-${st.dept_code || 'CSE'}`,
      batch_year: '2021-2025',
      semester: sem,
      student_usn: st.roll_no || `4NN21CS${String(i + 1).padStart(3, '0')}`,
      student_name: st.name,
      activity_subject_code: activitySubjectCode,
      activity_points_earned: pts,
      max_points: 200,
      grade,
      clearance_status: clearanceStatus,
      logisys_upload_ready: isCleared,
      remarks: isCleared ? 'Clearance Verified for Degree Conformance' : `Deficit: ${200 - pts} points remaining`,
    });
  }

  return {
    rows,
    stats: {
      total_students: students.length,
      cleared_count: clearedCount,
      pending_count: pendingCount,
      at_risk_count: atRiskCount,
      college_code: 'ENG-4NN',
      academic_year: '2024-2026',
    },
  };
}

// 1. Get Logisys Format Preview & Validation Summary (supports /export and /dataset)
router.get(['/export', '/dataset'], authenticate, requireRole(['hod', 'mentor', 'dean']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deptId = req.user!.department_id || 'dept_cse';
    const dataset = await generateLogisysDataset(deptId);
    res.json(dataset);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Direct Logisys CSV File Download (supports /download-csv and /export-csv)
router.get(['/download-csv', '/export-csv'], authenticate, requireRole(['hod', 'mentor', 'dean']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deptId = req.user!.department_id || 'dept_cse';
    const { rows } = await generateLogisysDataset(deptId);

    const headers = [
      'SL_NO',
      'COLLEGE_CODE',
      'DEGREE_CODE',
      'BATCH_YEAR',
      'SEMESTER',
      'STUDENT_USN',
      'STUDENT_NAME',
      'ACTIVITY_SUBJECT_CODE',
      'ACTIVITY_POINTS_EARNED',
      'MAX_POINTS',
      'GRADE',
      'CLEARANCE_STATUS',
      'LOGISYS_UPLOAD_READY',
      'REMARKS',
    ];

    const csvLines = [headers.join(',')];

    for (const r of rows) {
      csvLines.push([
        r.sl_no,
        `"${r.college_code}"`,
        `"${r.degree_code}"`,
        `"${r.batch_year}"`,
        r.semester,
        `"${r.student_usn}"`,
        `"${r.student_name.replace(/"/g, '""')}"`,
        `"${r.activity_subject_code}"`,
        r.activity_points_earned,
        r.max_points,
        `"${r.grade}"`,
        `"${r.clearance_status}"`,
        r.logisys_upload_ready ? 'YES' : 'NO',
        `"${(r.remarks || '').replace(/"/g, '""')}"`,
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="Logisys_Activity_Points_Upload.csv"');
    res.send(csvLines.join('\n'));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Validate Logisys Batch
router.post('/validate', authenticate, requireRole(['hod', 'mentor', 'dean']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deptId = req.user!.department_id || 'dept_cse';
    const { rows, stats } = await generateLogisysDataset(deptId);

    const usnRegex = /^[0-9][A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$/i;
    const issues: Array<{ usn: string; student_name: string; error: string }> = [];

    for (const r of rows) {
      if (!r.student_usn) {
        issues.push({ usn: 'MISSING', student_name: r.student_name, error: 'USN Register number cannot be empty' });
      }
      if (r.activity_points_earned > 200) {
        issues.push({ usn: r.student_usn, student_name: r.student_name, error: 'Points exceed degree limit (200 pts)' });
      }
    }

    res.json({
      valid: issues.length === 0,
      total_records: rows.length,
      ready_for_logisys_sync: stats.cleared_count,
      validation_passed_count: rows.length - issues.length,
      issues,
      server_timestamp: new Date().toISOString(),
      logisys_portal_url: 'https://logisys.vtu.ac.in/portal/marks-entry',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
