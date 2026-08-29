import { getDb, saveDb, queryAll, queryOne } from '../server/db/database';
import { generateRandomStudentMarks } from '../server/services/curriculumSubjects';

async function run() {
  const db = getDb();

  // Get all students
  const students = await queryAll<{ id: string; name: string; semester: number; roll_no: string }>(`
    SELECT id, name, semester, roll_no FROM users WHERE role = 'student'
  `);

  console.log(`Found ${students.length} students. Checking and generating marks...`);

  // Clear existing student marks and populate for all semesters (1 to 8) for every student
  await db.exec(`DELETE FROM student_marks;`);

  const allSemesters = [1, 2, 3, 4, 5, 6, 7, 8];
  const studentOffsets: Record<string, number> = {
    usr_std_1: 4,  // Rahul Verma
    usr_std_2: 8,  // Priya Patel
    usr_std_3: -2, // Rohan Gupta
    usr_std_4: 9,  // Neha Singh
    usr_std_5: 11, // Amit Kumar
    usr_std_6: 5,  // Sneha Nair
    usr_std_7: -1, // Vikram Rao
    usr_std_8: 6,  // Ananya Joshi
  };

  let totalInserted = 0;

  for (const student of students) {
    const baseOffset = studentOffsets[student.id] ?? (Math.floor(Math.random() * 8) - 2);

    for (const sem of allSemesters) {
      const marks = generateRandomStudentMarks(student.id, sem, baseOffset);
      for (const sm of marks) {
        await db.exec(`
          INSERT INTO student_marks (
            id, student_id, semester, subject_code, subject_name, credits,
            theory_marks, theory_max, task_marks, task_max, has_lab,
            lab_marks, lab_max, grade, grade_points, created_at, updated_at
          ) VALUES (
            '${sm.id}', '${sm.student_id}', ${sm.semester}, '${sm.subject_code}', '${sm.subject_name.replace(/'/g, "''")}', ${sm.credits},
            ${sm.theory_marks}, ${sm.theory_max}, ${sm.task_marks}, ${sm.task_max}, ${sm.has_lab},
            ${sm.lab_marks}, ${sm.lab_max}, '${sm.grade}', ${sm.grade_points}, '${sm.created_at}', '${sm.updated_at}'
          );
        `);
        totalInserted++;
      }
    }
  }

  saveDb();
  console.log(`Successfully populated ${totalInserted} dummy subject mark entries across ${students.length} students!`);
}

run().catch(console.error);
