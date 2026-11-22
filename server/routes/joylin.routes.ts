import { Router, Response } from 'express';
import { queryAll } from '../db/database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { calculateStudentPoints, computePointsSync } from '../services/pointsCalculator';
import { JoylinMasterSheetRow } from '../../src/types';

const router = Router();

async function buildJoylinMasterSheet(departmentId: string): Promise<{
  rows: JoylinMasterSheetRow[];
  summary: {
    total_students: number;
    fully_cleared: number;
    in_progress: number;
    action_required: number;
    coordinator_name: string;
    coordinator_email: string;
    department_code: string;
    last_updated: string;
  };
}> {
  // 1. Fetch cohort students
  const students = await queryAll(`
    SELECT 
      u.id, 
      u.roll_no, 
      u.name, 
      u.semester, 
      u.cgpa,
      m.name as mentor_name,
      d.code as dept_code
    FROM users u
    LEFT JOIN users m ON u.mentor_id = m.id
    JOIN departments d ON u.department_id = d.id
    WHERE u.role = 'student' AND u.department_id = ?
    ORDER BY u.roll_no ASC
  `, [departmentId]);

  // 2. Fetch categories and all submissions in 2 batched queries (eliminates N+1 loop bottleneck)
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

  const rows: JoylinMasterSheetRow[] = [];
  let fullyCleared = 0;
  let inProgress = 0;
  let actionRequired = 0;

  for (let i = 0; i < students.length; i++) {
    const st = students[i];
    const sem = Number(st.semester) || 6;
    const subs = studentSubmissionsMap.get(st.id) || [];
    const pData = computePointsSync(st.id, sem, categories, subs);

    // Extract category points
    const catMap: Record<string, number> = {};
    pData.categories_breakdown.forEach((c) => {
      catMap[c.id] = c.capped_points;
    });

    const cappedTotal = pData.total_effective_points;
    const isCleared = cappedTotal >= 200;
    const isAtRisk = cappedTotal < 60 && sem >= 6;

    let clearanceStatus: 'Degree Clearance Eligible' | 'In Progress' | 'Action Required' = 'In Progress';
    if (isCleared) {
      clearanceStatus = 'Degree Clearance Eligible';
      fullyCleared++;
    } else if (isAtRisk) {
      clearanceStatus = 'Action Required';
      actionRequired++;
    } else {
      inProgress++;
    }

    rows.push({
      sl_no: i + 1,
      roll_no: st.roll_no || `4NN21CS${String(i + 1).padStart(3, '0')}`,
      student_name: st.name,
      semester: sem,
      cgpa: Number(st.cgpa) || 8.0,
      mentor_name: st.mentor_name || 'Unassigned',
      cat_cert: catMap['cat_cert'] || 0,
      cat_comp: catMap['cat_comp'] || 0,
      cat_intern: catMap['cat_intern'] || 0,
      cat_work: catMap['cat_work'] || 0,
      cat_vol: catMap['cat_vol'] || 0,
      cat_sports: catMap['cat_sports'] || 0,
      raw_total: pData.raw_total_points,
      capped_total: cappedTotal,
      target_points: 200,
      clearance_status: clearanceStatus,
      logisys_code: sem >= 7 ? '21ACT79' : sem >= 5 ? '21ACT59' : '21ACT39',
    });
  }

  return {
    rows,
    summary: {
      total_students: students.length,
      fully_cleared: fullyCleared,
      in_progress: inProgress,
      action_required: actionRequired,
      coordinator_name: 'Prof. Joylin Mendonca',
      coordinator_email: 'joylin@university.edu',
      department_code: 'CSE',
      last_updated: new Date().toISOString(),
    },
  };
}

// 1. Get Joylin Master Sheet JSON
router.get('/master-sheet', authenticate, requireRole(['hod', 'mentor', 'dean']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deptId = req.user!.department_id || 'dept_cse';
    const sheetData = await buildJoylinMasterSheet(deptId);
    res.json(sheetData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Direct Tab-Separated Values (TSV) for 1-Click Paste into Google Sheets
router.get('/tsv', authenticate, requireRole(['hod', 'mentor', 'dean']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deptId = req.user!.department_id || 'dept_cse';
    const { rows } = await buildJoylinMasterSheet(deptId);

    const headers = [
      'Sl No',
      'USN',
      'Student Name',
      'Semester',
      'CGPA',
      'Faculty Mentor',
      'Technical Certs (Cap 60)',
      'Hackathons (Cap 60)',
      'Internships (Cap 50)',
      'Workshops (Cap 40)',
      'Volunteering (Cap 40)',
      'Sports & Cultural (Cap 40)',
      'Raw Points',
      'Effective Points',
      'Degree Target',
      'Clearance Status',
      'Logisys Course Code',
    ];

    const lines = [headers.join('\t')];
    for (const r of rows) {
      lines.push([
        r.sl_no,
        r.roll_no,
        r.student_name,
        r.semester,
        r.cgpa.toFixed(2),
        r.mentor_name,
        r.cat_cert,
        r.cat_comp,
        r.cat_intern,
        r.cat_work,
        r.cat_vol,
        r.cat_sports,
        r.raw_total,
        r.capped_total,
        r.target_points,
        r.clearance_status,
        r.logisys_code,
      ].join('\t'));
    }

    res.setHeader('Content-Type', 'text/tab-separated-values');
    res.send(lines.join('\n'));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Download CSV for Joylin Ma'am (supports both /download-csv and /export-csv)
router.get(['/download-csv', '/export-csv'], authenticate, requireRole(['hod', 'mentor', 'dean']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deptId = req.user!.department_id || 'dept_cse';
    const { rows } = await buildJoylinMasterSheet(deptId);

    const headers = [
      'Sl No',
      'USN',
      'Student Name',
      'Semester',
      'CGPA',
      'Faculty Mentor',
      'Technical Certs (Cap 60)',
      'Hackathons (Cap 60)',
      'Internships (Cap 50)',
      'Workshops (Cap 40)',
      'Volunteering (Cap 40)',
      'Sports & Cultural (Cap 40)',
      'Raw Points',
      'Effective Points',
      'Degree Target',
      'Clearance Status',
      'Logisys Course Code',
    ];

    const csvLines = [headers.join(',')];
    for (const r of rows) {
      csvLines.push([
        r.sl_no,
        `"${r.roll_no}"`,
        `"${r.student_name.replace(/"/g, '""')}"`,
        r.semester,
        r.cgpa.toFixed(2),
        `"${r.mentor_name.replace(/"/g, '""')}"`,
        r.cat_cert,
        r.cat_comp,
        r.cat_intern,
        r.cat_work,
        r.cat_vol,
        r.cat_sports,
        r.raw_total,
        r.capped_total,
        r.target_points,
        `"${r.clearance_status}"`,
        `"${r.logisys_code}"`,
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="Joylin_Coordinator_Master_Activity_Points_Sheet.csv"');
    res.send(csvLines.join('\n'));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
