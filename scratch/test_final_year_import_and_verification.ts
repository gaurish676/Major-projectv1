import assert from 'assert';
import { queryAll, queryOne } from '../server/db/database';
import { importFinalYearStudents } from '../server/services/importFinalYearStudents';
import { computePointsSync } from '../server/services/pointsCalculator';

async function runTests() {
  console.log('🧪 Starting Final Year Student List & System Verification Tests...\n');

  // Test 1: Run import function and check return values
  console.log('Test 1: Run importFinalYearStudents()');
  const res = await importFinalYearStudents();
  assert.strictEqual(res.success, true, 'Import should succeed');
  assert.strictEqual(res.totalParsed, 313, 'Should parse 313 students from Excel sheet');
  console.log(`  ✓ Successfully processed ${res.totalParsed} students (Allocated across ${res.allocatedMentorsCount} mentors)`);

  // Test 2: Check student records in database
  console.log('\nTest 2: Check student records in SQLite');
  const sem7Students = await queryAll<{ id: string; name: string; email: string; roll_no: string; mentor_id: string }>(`
    SELECT id, name, email, roll_no, mentor_id 
    FROM users 
    WHERE role = 'student' AND semester = 7
    ORDER BY roll_no ASC
  `);
  assert.strictEqual(sem7Students.length, 313, 'Should have exactly 313 semester 7 students');
  console.log(`  ✓ Database contains ${sem7Students.length} Semester 7 (Final Year) students.`);

  // Test 3: Check specific known students from the sheet
  console.log('\nTest 3: Verify first, middle, and last students');
  const firstStudent = sem7Students.find(s => s.roll_no === 'NNM23CS001');
  assert.ok(firstStudent, 'First student NNM23CS001 must exist');
  assert.strictEqual(firstStudent?.name, 'A Akshay');
  assert.strictEqual(firstStudent?.email, 'nnm23cs001@nmamit.in');
  console.log(`  ✓ First student verified: ${firstStudent?.name} (${firstStudent?.roll_no})`);

  const middleStudent = sem7Students.find(s => s.roll_no === 'NNM23CS040');
  assert.ok(middleStudent, 'NNM23CS040 must exist');
  assert.strictEqual(middleStudent?.name, 'Arsh Kasim Sayed');
  console.log(`  ✓ Middle student verified: ${middleStudent?.name} (${middleStudent?.roll_no})`);

  const lastStudent = sem7Students.find(s => s.roll_no === 'NNM24CS523');
  assert.ok(lastStudent, 'NNM24CS523 must exist');
  assert.strictEqual(lastStudent?.name, 'Yashwith L Poojari');
  console.log(`  ✓ Last student verified: ${lastStudent?.name} (${lastStudent?.roll_no})`);

  // Test 4: Check mentor distribution
  console.log('\nTest 4: Verify mentor allocation distribution');
  const mentorCounts = await queryAll<{ mentor_id: string; cnt: number }>(`
    SELECT mentor_id, COUNT(*) as cnt 
    FROM users 
    WHERE role = 'student' AND semester = 7
    GROUP BY mentor_id
  `);
  console.log(`  ✓ Allocated across ${mentorCounts.length} distinct mentors.`);
  for (const m of mentorCounts.slice(0, 3)) {
    console.log(`    - Mentor ${m.mentor_id}: ${m.cnt} final-year mentees`);
  }
  assert.ok(mentorCounts.length >= 20, 'At least 20 mentors should have final-year mentees');

  // Test 5: Verify academic marks exist
  console.log('\nTest 5: Verify marks and academic history');
  const sampleStudent = sem7Students[0];
  const marksCount = await queryOne<{ cnt: number }>(`
    SELECT COUNT(*) as cnt FROM student_marks WHERE student_id = ?
  `, [sampleStudent.id]);
  assert.ok(Number(marksCount?.cnt) > 0, 'Student should have marks records populated');
  console.log(`  ✓ Student ${sampleStudent.roll_no} has ${marksCount?.cnt} academic course records across semesters.`);

  // Test 6: Verify annual limit generalized certificate logic for final year
  console.log('\nTest 6: Verify annual limitation points calculation for Year 4 certificates');
  const testSubmissions = [
    {
      id: 'sub_test_yr4_1',
      student_id: sampleStudent.id,
      schema_id: 'sch_cert_1',
      activity_title: 'NPTEL Cloud Computing Elite',
      category_id: 'cat_cert',
      description: 'First submission in Year 4 (Sem 7)',
      file_url: '/uploads/cert1.pdf',
      file_name: 'cert1.pdf',
      file_size: 1000,
      status: 'approved' as const,
      points_awarded: 30,
      semester: 7, // Year 4
      completion_date: '2026-09-01',
      submitted_at: '2026-09-01',
    },
    {
      id: 'sub_test_yr4_2',
      student_id: sampleStudent.id,
      schema_id: 'sch_cert_1',
      activity_title: 'NPTEL Cloud Computing Elite',
      category_id: 'cat_cert',
      description: 'Second duplicate submission in Year 4 (Sem 8)',
      file_url: '/uploads/cert2.pdf',
      file_name: 'cert2.pdf',
      file_size: 1000,
      status: 'approved' as const,
      points_awarded: 30,
      semester: 8, // Same Year 4!
      completion_date: '2026-11-01',
      submitted_at: '2026-11-01',
    },
    {
      id: 'sub_test_yr3_1',
      student_id: sampleStudent.id,
      schema_id: 'sch_cert_1',
      activity_title: 'NPTEL Cloud Computing Elite',
      category_id: 'cat_cert',
      description: 'Different Academic Year (Sem 5 = Year 3)',
      file_url: '/uploads/cert3.pdf',
      file_name: 'cert3.pdf',
      file_size: 1000,
      status: 'approved' as const,
      points_awarded: 30,
      semester: 5, // Year 3
      completion_date: '2025-10-01',
      submitted_at: '2025-10-01',
    }
  ];

  const categories = await queryAll<any>('SELECT * FROM schema_categories');
  const pointsResult = computePointsSync(sampleStudent.id, 7, categories, testSubmissions);
  
  assert.strictEqual(pointsResult.raw_total_points, 60, 'Total points should be 60 (30 from Yr4 sub1, 0 from duplicate Yr4 sub2, 30 from Yr3 sub3)');
  const yr4 = pointsResult.year_breakdown.find(y => y.year === 4);
  const yr3 = pointsResult.year_breakdown.find(y => y.year === 3);
  assert.strictEqual(yr4?.raw_earned_points, 30, 'Year 4 points capped at 30 due to annual limitation on duplicate certificate');
  assert.strictEqual(yr3?.raw_earned_points, 30, 'Year 3 points has 30');
  console.log(`  ✓ Annual limit correctly enforced in points breakdown: Year 4 raw points = ${yr4?.raw_earned_points} pts (deduped), Year 3 = ${yr3?.raw_earned_points} pts.`);

  console.log('\n🎉 ALL 6 VERIFICATION SUITES PASSED FLAWLESSLY!\n');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
