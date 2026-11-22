import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { getDb, saveDb, queryAll, queryOne } from '../db/database';
import { generateRandomStudentMarks } from './curriculumSubjects';

export interface FinalYearImportResult {
  success: boolean;
  totalParsed: number;
  createdCount: number;
  updatedCount: number;
  allocatedMentorsCount: number;
  message: string;
}

export function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/(?:^|\s|-|\.)\S/g, (match) => match.toUpperCase())
    .replace(/\b(Cse|Nnm|Ai|Ml|Ise|Iot|Vtu)\b/gi, (match) => match.toUpperCase())
    .trim();
}

export async function importFinalYearStudents(
  customFilePath?: string
): Promise<FinalYearImportResult> {
  const excelPath = customFilePath || path.join(process.cwd(), 'Student List 2026-27 - final year.xls');
  if (!fs.existsSync(excelPath)) {
    throw new Error(`Excel file not found at ${excelPath}`);
  }

  const db = await getDb();
  const defaultPasswordHash = '$2b$10$HRqQx9t3Yrsm4f.OCzIANOCjXu4MHE0VgzqQlXtw0M3/0Seq33ReC'; // password123

  // 1. Read Excel workbook
  const buffer = fs.readFileSync(excelPath);
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

  if (!matrix || matrix.length === 0) {
    throw new Error('Spreadsheet contains no data.');
  }

  // 2. Discover header row and column mappings
  let headerIdx = -1;
  const colMap = { usn: -1, name: -1, email: -1, sem: -1 };

  for (let r = 0; r < Math.min(15, matrix.length); r++) {
    const row = (matrix[r] || []).map((c) => String(c || '').trim().toLowerCase());
    const usnCol = row.findIndex((c) => c.includes('usn') || c.includes('roll') || c.includes('reg'));
    const nameCol = row.findIndex((c) => c.includes('name') || c.includes('student'));
    const emailCol = row.findIndex((c) => c.includes('mail') || c.includes('email'));
    if (usnCol !== -1 && nameCol !== -1) {
      headerIdx = r;
      colMap.usn = usnCol;
      colMap.name = nameCol;
      colMap.email = emailCol;
      colMap.sem = row.findIndex((c) => c.includes('sem'));
      break;
    }
  }

  if (headerIdx === -1 || colMap.usn === -1 || colMap.name === -1) {
    throw new Error('Could not identify student columns in Excel sheet. Required: USN, NAME.');
  }

  // 3. Extract all valid students
  const rawStudents: Array<{ usn: string; name: string; email: string; semester: number }> = [];
  for (let r = headerIdx + 1; r < matrix.length; r++) {
    const row = matrix[r] || [];
    const usnRaw = String(row[colMap.usn] || '').trim().toUpperCase();
    const nameRaw = String(row[colMap.name] || '').trim();
    if (!usnRaw || !nameRaw) continue;

    // Filter out invalid rows (e.g. repeated header or non-USN text)
    if (!usnRaw.startsWith('NNM') && !usnRaw.startsWith('1')) continue;

    const emailRaw =
      colMap.email !== -1 && row[colMap.email]
        ? String(row[colMap.email]).trim().toLowerCase()
        : `${usnRaw.toLowerCase()}@nmamit.in`;

    rawStudents.push({
      usn: usnRaw,
      name: toTitleCase(nameRaw),
      email: emailRaw,
      semester: 7, // VII Semester - Final Year 2026-27
    });
  }

  if (rawStudents.length === 0) {
    throw new Error('No student records found in Excel sheet.');
  }

  // 4. Retrieve available CSE faculty mentors for balanced distribution
  const mentors = await queryAll<{ id: string; name: string }>(`
    SELECT id, name FROM users 
    WHERE role = 'mentor' AND department_id = 'dept_cse' 
    ORDER BY id ASC
  `);

  if (mentors.length === 0) {
    throw new Error('No CSE mentors found in database for student allocation.');
  }

  let createdCount = 0;
  let updatedCount = 0;
  const now = new Date().toISOString();

  // 5. Upsert students into database
  for (let i = 0; i < rawStudents.length; i++) {
    const s = rawStudents[i];
    const assignedMentor = mentors[i % mentors.length];

    // Realistic CGPA ranging between 7.40 and 9.55
    const cgpaBase = 7.4 + ((i * 19) % 21) / 10;
    const cgpa = Math.round(cgpaBase * 100) / 100;
    const phone = `+91 9845${String(100000 + ((i * 3571) % 900000))}`;
    const tenthPercent = Math.round((82 + ((i * 7) % 16)) * 10) / 10;
    const twelfthPercent = Math.round((80 + ((i * 11) % 18)) * 10) / 10;

    // Standardized user ID
    const studentId = `usr_std_${s.usn.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // Check if student exists by roll_no or email or id
    const existing = await queryOne<{ id: string }>(
      "SELECT id FROM users WHERE (roll_no = ? OR email = ? OR id = ?) AND role = 'student'",
      [s.usn, s.email, studentId]
    );

    if (existing) {
      await db.exec(`
        UPDATE users 
        SET 
          name = '${s.name.replace(/'/g, "''")}',
          email = '${s.email}',
          semester = 7,
          department_id = 'dept_cse',
          cgpa = ${cgpa},
          mentor_id = COALESCE(mentor_id, '${assignedMentor.id}'),
          phone = COALESCE(phone, '${phone}'),
          tenth_percentage = COALESCE(tenth_percentage, ${tenthPercent}),
          twelfth_percentage = COALESCE(twelfth_percentage, ${twelfthPercent})
        WHERE id = '${existing.id}';
      `);
      updatedCount++;
    } else {
      await db.exec(`
        INSERT INTO users (
          id, name, email, password_hash, role, department_id, mentor_id,
          cgpa, semester, roll_no, avatar, phone, bio,
          tenth_percentage, tenth_board, tenth_year,
          twelfth_percentage, twelfth_board, twelfth_year, diploma_or_pu
        ) VALUES (
          '${studentId}',
          '${s.name.replace(/'/g, "''")}',
          '${s.email}',
          '${defaultPasswordHash}',
          'student',
          'dept_cse',
          '${assignedMentor.id}',
          ${cgpa},
          7,
          '${s.usn}',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          '${phone}',
          'B.Tech Computer Science & Engineering (Class of 2027), Semester 7 Final Year.',
          ${tenthPercent}, 'CBSE', 2021,
          ${twelfthPercent}, 'Department of Pre-University Education Karnataka', 2023, 'puc'
        );
      `);
      createdCount++;
    }

    // 6. Ensure student marks for semesters 1 through 6 exist for placement eligibility & academic analysis
    const existingMarks = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM student_marks WHERE student_id = ?',
      [existing ? existing.id : studentId]
    );

    const actualId = existing ? existing.id : studentId;
    if (!existingMarks || existingMarks.count === 0) {
      const offset = (i % 7) - 3;
      for (let sem = 1; sem <= 6; sem++) {
        const marks = generateRandomStudentMarks(actualId, sem, offset);
        for (const sm of marks) {
          await db.exec(`
            INSERT OR IGNORE INTO student_marks (
              id, student_id, semester, subject_code, subject_name, credits,
              theory_marks, theory_max, task_marks, task_max, has_lab,
              lab_marks, lab_max, grade, grade_points, created_at, updated_at,
              mse1_marks, mse1_max, mse2_marks, mse2_max
            ) VALUES (
              '${sm.id}', '${sm.student_id}', ${sm.semester}, '${sm.subject_code}',
              '${sm.subject_name.replace(/'/g, "''")}', ${sm.credits},
              ${sm.theory_marks}, ${sm.theory_max}, ${sm.task_marks}, ${sm.task_max},
              ${sm.has_lab}, ${sm.lab_marks}, ${sm.lab_max},
              '${sm.grade}', ${sm.grade_points}, '${sm.created_at}', '${sm.updated_at}',
              ${Math.round(sm.theory_marks * 0.28)}, 30, ${Math.round(sm.theory_marks * 0.29)}, 30
            );
          `);
        }
      }
    }
  }

  // 7. Seed sample final-year submissions for the first 12 students to give rich dashboard activity
  const sampleSchemas = await queryAll<{ id: string; category_id: string; activity_name: string; base_points: number }>(`
    SELECT id, category_id, activity_name, base_points FROM activity_schema LIMIT 6
  `);

  if (sampleSchemas.length > 0) {
    const sampleStudents = rawStudents.slice(0, 15);
    for (let idx = 0; idx < sampleStudents.length; idx++) {
      const s = sampleStudents[idx];
      const studentId = `usr_std_${s.usn.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const schema = sampleSchemas[idx % sampleSchemas.length];
      const isApproved = idx % 2 === 0;

      const subId = `sub_finalyr_${s.usn.toLowerCase()}_${idx}`;
      const existingSub = await queryOne('SELECT id FROM submissions WHERE id = ?', [subId]);
      if (!existingSub) {
        const assignedMentor = mentors[idx % mentors.length];
        await db.exec(`
          INSERT INTO submissions (
            id, student_id, schema_id, schema_version_snapshot, activity_title,
            category_id, description, file_url, file_name, file_size,
            status, points_awarded, semester, completion_date, submitted_at,
            reviewed_at, reviewed_by, mentor_feedback, verification_status
          ) VALUES (
            '${subId}',
            '${studentId}',
            '${schema.id}',
            1,
            '${schema.activity_name.replace(/'/g, "''")}',
            '${schema.category_id}',
            'Final year verified submission for ${s.name} in academic year 2026-27.',
            '/uploads/sample_cert_${idx + 1}.pdf',
            'Final_Year_Certificate_${s.usn}.pdf',
            245100,
            '${isApproved ? 'approved' : 'pending'}',
            ${isApproved ? schema.base_points : 0},
            7,
            '2026-09-15',
            '${now}',
            ${isApproved ? `'${now}'` : 'NULL'},
            ${isApproved ? `'${assignedMentor.id}'` : 'NULL'},
            ${isApproved ? "'Verified and approved in compliance with academic annual limit.'" : 'NULL'},
            'verified'
          );
        `);
      }
    }
  }

  // 8. Record audit log
  await db.exec(`
    INSERT INTO activity_logs (id, user_id, action, details, created_at)
    VALUES (
      'log_${Date.now()}',
      'usr_hod_1',
      'FINAL_YEAR_EXCEL_IMPORTED',
      'Imported ${rawStudents.length} final-year students from ${path.basename(excelPath)} (${createdCount} created, ${updatedCount} updated, allocated across ${mentors.length} mentors)',
      '${now}'
    );
  `);

  saveDb();

  return {
    success: true,
    totalParsed: rawStudents.length,
    createdCount,
    updatedCount,
    allocatedMentorsCount: mentors.length,
    message: `Successfully processed ${rawStudents.length} students from ${path.basename(excelPath)}. Created: ${createdCount}, Updated: ${updatedCount}.`,
  };
}

// Allow direct execution from CLI: `tsx server/services/importFinalYearStudents.ts`
if (process.argv[1] && process.argv[1].endsWith('importFinalYearStudents.ts')) {
  importFinalYearStudents()
    .then((result) => {
      console.log('✅ Import Completed:');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Import Failed:', err);
      process.exit(1);
    });
}
