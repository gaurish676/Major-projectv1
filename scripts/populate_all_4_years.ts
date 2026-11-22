import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getDb } from '../server/db/database';
import { SEMESTER_CURRICULUM } from '../server/services/curriculumSubjects';

export interface MentorGroup {
  id: string;
  name: string;
  email: string;
  designation: string;
  office: string;
  assignedYear: number; // 1, 2, 3, or 4
  assignedSemester: number; // 2, 4, 6, or 8
  quota: number; // 5 or 6
}

// 1. Group the 24 Faculty Mentors strictly by Academic Year (6 mentors per year)
export const mentorYearAssignments: MentorGroup[] = [
  // --- YEAR 1 FACULTY MENTORS (Semester 1 & 2) ---
  { id: 'usr_mentor_savitha', name: 'Dr. Savitha', email: 'savitha@university.edu', designation: 'Associate Professor & 1st Year Coordinator', office: 'Cabin 201, 1st Year Block', assignedYear: 1, assignedSemester: 2, quota: 5 },
  { id: 'usr_mentor_sowmya_ashwath', name: 'Prof. Sowmya Ashwath', email: 'sowmya.ashwath@university.edu', designation: 'Assistant Professor & 1st Year Counselor', office: 'Cabin 202, 1st Year Block', assignedYear: 1, assignedSemester: 2, quota: 5 },
  { id: 'usr_mentor_sowmya_p', name: 'Prof. Sowmya P', email: 'sowmya.p@university.edu', designation: 'Assistant Professor, 1st Year Mentor', office: 'Cabin 203, 1st Year Block', assignedYear: 1, assignedSemester: 2, quota: 5 },
  { id: 'usr_mentor_sowmya_s', name: 'Prof. Sowmya S', email: 'sowmya.s@university.edu', designation: 'Assistant Professor, 1st Year Mentor', office: 'Cabin 204, 1st Year Block', assignedYear: 1, assignedSemester: 2, quota: 5 },
  { id: 'usr_mentor_pradeep_kanchan', name: 'Dr. Pradeep Kanchan', email: 'pradeep.kanchan@university.edu', designation: 'Associate Professor, 1st Year Mentor', office: 'Cabin 205, 1st Year Block', assignedYear: 1, assignedSemester: 2, quota: 6 },
  { id: 'usr_mentor_sunil_aithal', name: 'Dr. Sunil Aithal', email: 'sunil.aithal@university.edu', designation: 'Associate Professor, 1st Year Mentor', office: 'Cabin 206, 1st Year Block', assignedYear: 1, assignedSemester: 2, quota: 6 },

  // --- YEAR 2 FACULTY MENTORS (Semester 3 & 4) ---
  { id: 'usr_mentor_guru', name: 'Dr. Guru Prasad', email: 'guruprasad@university.edu', designation: 'Associate Professor & 2nd Year Head', office: 'Cabin 301, CSE Wing B', assignedYear: 2, assignedSemester: 4, quota: 6 },
  { id: 'usr_mentor_aishwarya', name: 'Prof. Aishwarya', email: 'aishwarya@university.edu', designation: 'Assistant Professor & 2nd Year Mentor', office: 'Cabin 302, CSE Wing B', assignedYear: 2, assignedSemester: 4, quota: 6 },
  { id: 'usr_mentor_pawan', name: 'Prof. Pawan Kumar', email: 'pawan.faculty@university.edu', designation: 'Assistant Professor & 2nd Year Mentor', office: 'Cabin 303, CSE Wing B', assignedYear: 2, assignedSemester: 4, quota: 6 },
  { id: 'usr_mentor_sannidhan', name: 'Dr. Sannidhan M. S.', email: 'sannidhan@university.edu', designation: 'Professor & Senior Mentor, 2nd Year', office: 'Cabin 304, CSE Wing B', assignedYear: 2, assignedSemester: 4, quota: 6 },
  { id: 'usr_coordinator_1', name: 'Prof. Joylin Mendonca', email: 'joylin@university.edu', designation: 'Assistant Professor & Activity Coordinator', office: 'Lab 302, Accreditation Center', assignedYear: 2, assignedSemester: 4, quota: 5 },
  { id: 'usr_mentor_1', name: 'Prof. Ravi Kumar', email: 'ravi@university.edu', designation: 'Assistant Professor, 2nd Year Mentor', office: 'Cabin 305, CSE Wing B', assignedYear: 2, assignedSemester: 4, quota: 5 },

  // --- YEAR 3 FACULTY MENTORS (Semester 5 & 6) ---
  { id: 'usr_mentor_2', name: 'Prof. Anita Desai', email: 'anita@university.edu', designation: 'Assistant Professor & 3rd Year Head', office: 'Cabin 401, CSE Wing C', assignedYear: 3, assignedSemester: 6, quota: 6 },
  { id: 'usr_mentor_radhakrishna', name: 'Prof. Radhakrishna Rao', email: 'radhakrishna@university.edu', designation: 'Assistant Professor, 3rd Year Mentor', office: 'Cabin 402, CSE Wing C', assignedYear: 3, assignedSemester: 6, quota: 6 },
  { id: 'usr_mentor_shashank', name: 'Prof. Shashank Shetty', email: 'shashank.shetty@university.edu', designation: 'Assistant Professor, 3rd Year Mentor', office: 'Cabin 403, CSE Wing C', assignedYear: 3, assignedSemester: 6, quota: 6 },
  { id: 'usr_mentor_chinmayee', name: 'Prof. Chinmayee K.', email: 'chinmayee@university.edu', designation: 'Assistant Professor, 3rd Year Mentor', office: 'Cabin 404, CSE Wing C', assignedYear: 3, assignedSemester: 6, quota: 5 },
  { id: 'usr_mentor_sandeep', name: 'Prof. Sandeep Kumar', email: 'sandeep.kumar@university.edu', designation: 'Assistant Professor, 3rd Year Mentor', office: 'Cabin 405, CSE Wing C', assignedYear: 3, assignedSemester: 6, quota: 5 },
  { id: 'usr_mentor_mamatha', name: 'Prof. Mamatha Balipa', email: 'mamatha.balipa@university.edu', designation: 'Assistant Professor, 3rd Year Mentor', office: 'Cabin 406, CSE Wing C', assignedYear: 3, assignedSemester: 6, quota: 6 },

  // --- YEAR 4 FACULTY MENTORS (Semester 7 & 8) ---
  { id: 'usr_mentor_karthik', name: 'Prof. Karthik Pai', email: 'karthik.pai@university.edu', designation: 'Assistant Professor & Final Year In-charge', office: 'Cabin 501, CSE Wing D', assignedYear: 4, assignedSemester: 8, quota: 6 },
  { id: 'usr_mentor_divya', name: 'Prof. Divya Rani', email: 'divya.rani@university.edu', designation: 'Assistant Professor, 4th Year Mentor', office: 'Cabin 502, CSE Wing D', assignedYear: 4, assignedSemester: 8, quota: 6 },
  { id: 'usr_mentor_puneeth', name: 'Prof. Puneeth R. P.', email: 'puneeth.rp@university.edu', designation: 'Assistant Professor, 4th Year Mentor', office: 'Cabin 503, CSE Wing D', assignedYear: 4, assignedSemester: 8, quota: 6 },
  { id: 'usr_mentor_venugopala', name: 'Prof. Venugopala Rao', email: 'venugopala@university.edu', designation: 'Assistant Professor, 4th Year Mentor', office: 'Cabin 504, CSE Wing D', assignedYear: 4, assignedSemester: 8, quota: 5 },
  { id: 'usr_mentor_deepa', name: 'Prof. Deepa Shenoy', email: 'deepa.shenoy@university.edu', designation: 'Assistant Professor, 4th Year Mentor', office: 'Cabin 505, CSE Wing D', assignedYear: 4, assignedSemester: 8, quota: 5 },
  { id: 'usr_mentor_bhargavi', name: 'Prof. Bhargavi Rao', email: 'bhargavi.rao@university.edu', designation: 'Assistant Professor, 4th Year Mentor', office: 'Cabin 506, CSE Wing D', assignedYear: 4, assignedSemester: 8, quota: 6 },
];

const indianFirstNames = [
  'Aarav', 'Aayush', 'Abhay', 'Abhinav', 'Aditi', 'Aditya', 'Aishwarya', 'Akash', 'Akshara', 'Alok',
  'Aman', 'Amrita', 'Anand', 'Ananya', 'Aniket', 'Aniruddh', 'Anjali', 'Ankita', 'Anmol', 'Anushree',
  'Apoorva', 'Arjun', 'Arnav', 'Ashwin', 'Atharv', 'Avani', 'Ayush', 'Bhavana', 'Bhavish', 'Brijesh',
  'Chaitra', 'Chetan', 'Chinmay', 'Deepak', 'Deepika', 'Devansh', 'Dhanush', 'Dhruv', 'Disha', 'Divya',
  'Ganesh', 'Gautam', 'Gayatri', 'Girish', 'Harini', 'Harish', 'Harshita', 'Hemant', 'Isha', 'Ishaan',
  'Jagadish', 'Jahnavi', 'Jatin', 'Karan', 'Karthik', 'Kavya', 'Keerthan', 'Kiran', 'Komal', 'Kripa',
  'Kunal', 'Lakshmi', 'Lalit', 'Madhav', 'Manish', 'Mayur', 'Meera', 'Mihir', 'Mohan', 'Nandini',
  'Naresh', 'Navya', 'Neel', 'Neha', 'Nikhil', 'Niranjan', 'Nisha', 'Nitin', 'Ojas', 'Pallavi',
  'Pranav', 'Prasad', 'Pratheek', 'Preethi', 'Priya', 'Rahul', 'Rajesh', 'Rakshith', 'Ram', 'Ranjith',
  'Rashmi', 'Ravi', 'Rhea', 'Rishabh', 'Ritesh', 'Riya', 'Rohan', 'Rohit', 'Sachin', 'Sahana',
  'Sameer', 'Sandesh', 'Sangeetha', 'Sanjay', 'Santhosh', 'Sarvesh', 'Shashank', 'Shilpa', 'Shivani', 'Shravan',
  'Shreya', 'Shruti', 'Siddharth', 'Sneha', 'Sohan', 'Sourabh', 'Spandana', 'Srijan', 'Sujay', 'Sumit',
  'Suresh', 'Surya', 'Swathi', 'Tanvi', 'Tarun', 'Tejas', 'Trupti', 'Umesh', 'Varun', 'Venkatesh'
];

const indianLastNames = [
  'Shetty', 'Nayak', 'Bhat', 'Rao', 'Hegde', 'Shenoy', 'Pai', 'Kamath', 'Mallya', 'Poojary',
  'Kudva', 'Acharya', 'Holla', 'Kulal', 'Karkera', 'Alva', 'Chowta', 'Ballal', 'Rai', 'Prabhu',
  'Kotian', 'Suvarna', 'Amin', 'Mendon', 'Salian', 'Bangera', 'Patil', 'Kulkarni', 'Deshpande', 'Verma'
];

export async function populateAll4Years() {
  console.log('========================================================================');
  console.log('POPULATING 4-YEAR MENTEE ECOSYSTEM: ALL 24 FACULTY MENTORS (5-6 MENTEES)');
  console.log('========================================================================\n');

  const db = getDb();
  const defaultHash = bcrypt.hashSync('password123', 10);

  // Backup existing DB before restructuring
  const backupDir = path.join(process.cwd(), 'data', 'backup');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  fs.copyFileSync(
    path.join(process.cwd(), 'data', 'activity_portal.sqlite'),
    path.join(backupDir, `activity_portal_before_4years_${Date.now()}.sqlite`)
  );
  console.log('✓ Created automatic SQLite safety backup in data/backup/');

  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec('BEGIN TRANSACTION;');

  try {
    // 1. Ensure Mentors are updated with their Year-Specific Designations & Office
    const updateMentorStmt = db.prepare(`
      INSERT OR REPLACE INTO users (
        id, name, email, password_hash, role, department_id, mentor_id,
        cgpa, semester, roll_no, avatar, designation, office_location
      ) VALUES (?, ?, ?, ?, 'mentor', 'dept_cse', NULL, NULL, NULL, ?, ?, ?, ?)
    `);

    for (const m of mentorYearAssignments) {
      updateMentorStmt.run(
        m.id,
        m.name,
        m.email,
        defaultHash,
        `EMP-CSE-${m.id.slice(-4).toUpperCase()}`,
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        m.designation,
        m.office
      );
    }
    console.log(`✓ Synchronized all ${mentorYearAssignments.length} faculty mentors across Years 1 to 4.`);

    // 2. Generate Students for Each Year
    // Target:
    // Year 1: 32 students (Mentors 0..3 get 5, 4..5 get 6)
    // Year 2: 34 students (Mentors 6..9 get 6, 10..11 get 5)
    // Year 3: 34 students (Mentors 12..14 get 6, 15..16 get 5, 17 gets 6)
    // Year 4: 34 students (Mentors 18..20 get 6, 21..22 get 5, 23 gets 6)
    // Total = 134 students

    interface StudentRecord {
      id: string;
      name: string;
      fullName: string;
      email: string;
      usn: string;
      year: number;
      semester: number;
      cgpa: number;
      mentorId: string;
      mentorName: string;
      tenthPct: number | null;
      twelfthPct: number | null;
      twelfthType: 'puc' | 'diploma';
    }

    const allStudents: StudentRecord[] = [];
    let nameIdx = 0;

    // Helper to produce a unique student
    const createStudent = (
      id: string,
      fullName: string,
      email: string,
      usn: string,
      year: number,
      semester: number,
      cgpa: number,
      mentor: MentorGroup,
      tenthPct: number | null,
      twelfthPct: number | null,
      twelfthType: 'puc' | 'diploma' = 'puc'
    ): StudentRecord => ({
      id,
      name: fullName.split(' ')[0].toLowerCase(),
      fullName,
      email,
      usn: usn.toUpperCase(),
      year,
      semester,
      cgpa,
      mentorId: mentor.id,
      mentorName: mentor.name,
      tenthPct,
      twelfthPct,
      twelfthType,
    });

    for (const mentor of mentorYearAssignments) {
      const year = mentor.assignedYear;
      const sem = mentor.assignedSemester;
      const quota = mentor.quota;
      const yearPrefix = year === 1 ? '24' : year === 2 ? '23' : year === 3 ? '22' : '21';

      for (let s = 1; s <= quota; s++) {
        // Core Students mapped specifically to 2nd-Year Mentors
        if (mentor.id === 'usr_mentor_guru' && s === 1) {
          allStudents.push(createStudent('usr_std_gaurish', 'Gaurish', 'gaurish@university.edu', 'NNM23CS077', 2, 4, 8.85, mentor, 92.4, 89.6, 'puc'));
          continue;
        }
        if (mentor.id === 'usr_mentor_aishwarya' && s === 1) {
          allStudents.push(createStudent('usr_std_sampath', 'Sampath', 'sampath@university.edu', 'NNM23CS167', 2, 4, 8.70, mentor, 88.0, 86.5, 'puc'));
          continue;
        }
        if (mentor.id === 'usr_mentor_pawan' && s === 1) {
          allStudents.push(createStudent('usr_std_sharan', 'Sharan', 'sharan@university.edu', 'NNM23CS176', 2, 4, 8.40, mentor, 82.5, 81.0, 'diploma'));
          continue;
        }
        if (mentor.id === 'usr_mentor_sannidhan' && s === 1) {
          allStudents.push(createStudent('usr_std_ronak', 'Ronak', 'ronak@university.edu', 'NNM23CS153', 2, 4, 8.25, mentor, 78.4, 74.5, 'puc'));
          continue;
        }
        if (mentor.id === 'usr_coordinator_1' && s === 1) {
          allStudents.push(createStudent('usr_std_priya', 'Priya Patel', 'priya@university.edu', 'NNM23CS102', 2, 4, 8.90, mentor, 88.0, 85.5, 'puc'));
          continue;
        }

        // Renowned 3rd-Year & 4th-Year Demo Persona placements
        if (mentor.id === 'usr_mentor_2' && s === 1) {
          allStudents.push(createStudent('usr_std_rahul', 'Rahul Verma', 'rahul@university.edu', 'NNM22CS101', 3, 6, 8.35, mentor, 84.5, 82.0, 'puc'));
          continue;
        }
        if (mentor.id === 'usr_mentor_karthik' && s === 1) {
          allStudents.push(createStudent('usr_std_amit', 'Amit Kumar', 'amit@university.edu', 'NNM21CS045', 4, 8, 9.45, mentor, 91.0, 89.0, 'puc'));
          continue;
        }
        if (mentor.id === 'usr_mentor_divya' && s === 1) {
          allStudents.push(createStudent('usr_std_sneha', 'Sneha Nair', 'sneha@university.edu', 'NNM21CS088', 4, 8, 8.65, mentor, 85.0, 83.0, 'puc'));
          continue;
        }
        if (mentor.id === 'usr_mentor_savitha' && s === 1) {
          allStudents.push(createStudent('usr_std_ananya', 'Ananya Joshi', 'ananya@university.edu', 'NNM24CS012', 1, 2, 8.60, mentor, 87.5, null, 'puc'));
          continue;
        }
        if (mentor.id === 'usr_mentor_pradeep_kanchan' && s === 1) {
          allStudents.push(createStudent('usr_std_nnm24cs001', 'Aarav Shetty', 'aarav.nnm24cs001@university.edu', 'NNM24CS001', 1, 2, 8.35, mentor, 72.0, 68.0, 'puc'));
          continue;
        }

        // Generic realistic student
        const fName = indianFirstNames[nameIdx % indianFirstNames.length];
        const lName = indianLastNames[(nameIdx * 3) % indianLastNames.length];
        const fullName = `${fName} ${lName}`;
        const rollNum = (nameIdx % 90) + 10;
        const usn = `NNM${yearPrefix}CS${String(rollNum).padStart(3, '0')}`;
        const email = `${fName.toLowerCase()}.${usn.toLowerCase()}@university.edu`;
        const studentId = `usr_std_${usn.toLowerCase()}`;

        // Base CGPA
        const cgpa = Math.round((7.10 + (Math.sin(nameIdx * 17) * 0.5 + 0.5) * 2.5) * 100) / 100;

        // 10th & 12th marks based on year
        let tenthPct: number | null = null;
        let twelfthPct: number | null = null;
        if (year >= 3) {
          tenthPct = Math.round((64 + (Math.cos(nameIdx * 7) * 0.5 + 0.5) * 30) * 10) / 10;
          twelfthPct = Math.round((60 + (Math.sin(nameIdx * 9) * 0.5 + 0.5) * 32) * 10) / 10;
        } else if (year === 2 && nameIdx % 3 === 0) {
          tenthPct = Math.round((70 + Math.random() * 24) * 10) / 10;
          twelfthPct = Math.round((65 + Math.random() * 28) * 10) / 10;
        }

        allStudents.push(
          createStudent(studentId, fullName, email, usn, year, sem, cgpa, mentor, tenthPct, twelfthPct, (nameIdx % 7 === 0) ? 'diploma' : 'puc')
        );

        nameIdx++;
      }
    }

    console.log(`✓ Assembled cohort of ${allStudents.length} students across all 4 years.`);

    // 3. Clear old students, submissions, marks and re-insert cleanly
    db.exec('DELETE FROM student_marks;');
    db.exec('DELETE FROM submissions;');
    db.exec('DELETE FROM counseling_logs;');
    db.exec("DELETE FROM users WHERE role = 'student';");

    // 4. Insert Students into users
    const studentStmt = db.prepare(`
      INSERT OR REPLACE INTO users (
        id, name, email, password_hash, role, department_id, mentor_id,
        cgpa, semester, roll_no, avatar, phone, bio,
        tenth_percentage, tenth_board, tenth_year,
        twelfth_percentage, twelfth_board, twelfth_year, diploma_or_pu
      ) VALUES (?, ?, ?, ?, 'student', 'dept_cse', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const s of allStudents) {
      studentStmt.run(
        s.id,
        s.fullName,
        s.email,
        defaultHash,
        s.mentorId,
        s.cgpa,
        s.semester,
        s.usn,
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        `+91 9845${Math.floor(100000 + Math.random() * 900000)}`,
        `CSE Scholar (Year ${s.year}, Sem ${s.semester}) assigned to mentor ${s.mentorName}.`,
        s.tenthPct,
        s.tenthPct ? 'CBSE' : null,
        s.tenthPct ? 2024 - s.year * 2 : null,
        s.twelfthPct,
        s.twelfthPct ? (s.twelfthType === 'diploma' ? 'DTE Board' : 'Karnataka State PUC') : null,
        s.twelfthPct ? 2024 - s.year * 2 + 2 : null,
        s.twelfthType
      );
    }
    console.log(`✓ Inserted ${allStudents.length} student records into SQLite.`);

    // 5. Generate Year-Appropriate Submissions for every student
    const subStmt = db.prepare(`
      INSERT OR REPLACE INTO submissions (
        id, student_id, schema_id, schema_version_snapshot, activity_title, category_id,
        description, file_url, file_name, file_size, status, points_awarded, semester,
        mentor_feedback, ai_audit_results, completion_date, submitted_at, reviewed_at,
        reviewed_by, hours_spent, credential_hash, qr_code_data, verification_status,
        verification_checklist, file_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const standardChecklist = JSON.stringify({
      student_identity_verified: true,
      accredited_issuer_verified: true,
      minimum_hours_satisfied: true,
      original_seal_and_signature: true,
      verified_timestamp: new Date().toISOString(),
    });

    const aiAuditClean = JSON.stringify({
      authenticity_status: 'VERIFIED',
      confidence_score: 96,
      model_used: 'gemini-2.5-flash',
      anomalies_detected: [],
      audit_summary: 'Automated multimodal OCR confirms authentic university issuer and matched candidate identity.',
    });

    let subIdCounter = 1;

    for (const std of allStudents) {
      const year = std.year;

      // --- Year 1 Submissions (Induction & UHV) ---
      if (year >= 1) {
        subStmt.run(
          `sub_seed_${subIdCounter++}`,
          std.id,
          'sch_induct_1',
          1,
          '1st Year AICTE Student Induction Program (SIP 3-Week)',
          'cat_vol',
          'Completed 3-week induction module, creative arts, and institutional orientation.',
          '/uploads/nss_rural_camp_certificate.pdf',
          'aicte_induction_sip.pdf',
          125000,
          'approved',
          25,
          1,
          'Full attendance verified by Student Affairs.',
          aiAuditClean,
          '2024-09-15',
          '2024-09-18T10:00:00Z',
          '2024-09-20T14:00:00Z',
          std.mentorId,
          60,
          `CRD-${std.usn}-SIP`,
          `https://creditz.university.edu/verify/CRD-${std.usn}-SIP`,
          'verified',
          standardChecklist,
          crypto.createHash('sha256').update(`sip-${std.id}`).digest('hex')
        );

        subStmt.run(
          `sub_seed_${subIdCounter++}`,
          std.id,
          'sch_sports_2',
          1,
          'Annual College Orientation Yoga & Fitness Sprint',
          'cat_sports',
          'Participated in mandatory freshman wellness sessions and sports meet.',
          '/uploads/inter_university_sports_badminton.pdf',
          'freshman_yoga.pdf',
          110000,
          'approved',
          15,
          2,
          'Endorsed by Physical Education Director.',
          aiAuditClean,
          '2024-11-20',
          '2024-11-22T09:00:00Z',
          '2024-11-23T11:00:00Z',
          std.mentorId,
          30,
          `CRD-${std.usn}-YOGA`,
          `https://creditz.university.edu/verify/CRD-${std.usn}-YOGA`,
          'verified',
          standardChecklist,
          crypto.createHash('sha256').update(`yoga-${std.id}`).digest('hex')
        );
      }

      // --- Year 2 Submissions (MOOCs, Hackathons, Workshops) ---
      if (year >= 2) {
        subStmt.run(
          `sub_seed_${subIdCounter++}`,
          std.id,
          'sch_cert_1',
          1,
          'NPTEL 12-Week Cloud Computing & Distributed Systems',
          'cat_cert',
          'Proctored elite certification completed with high honors score.',
          '/uploads/nptel_cloud_computing_elite.pdf',
          'nptel_cloud.pdf',
          165000,
          'approved',
          30,
          3,
          'Verified with NPTEL online ledger.',
          aiAuditClean,
          '2024-10-15',
          '2024-10-18T10:00:00Z',
          '2024-10-20T11:00:00Z',
          std.mentorId,
          45,
          `CRD-${std.usn}-NPTEL`,
          `https://creditz.university.edu/verify/CRD-${std.usn}-NPTEL`,
          'verified',
          standardChecklist,
          crypto.createHash('sha256').update(`nptel-${std.id}`).digest('hex')
        );

        subStmt.run(
          `sub_seed_${subIdCounter++}`,
          std.id,
          'sch_comp_2',
          1,
          'State-Level Inter-Collegiate Coding Sprint Finalist',
          'cat_comp',
          'Constructed algorithmic microservice solution in 24h hackathon.',
          '/uploads/innovex_hackathon_nmamit.pdf',
          'coding_sprint.pdf',
          180000,
          'approved',
          20,
          4,
          'Confirmed jury ranking and code submission.',
          aiAuditClean,
          '2024-12-05',
          '2024-12-08T11:00:00Z',
          '2024-12-10T16:00:00Z',
          std.mentorId,
          30,
          `CRD-${std.usn}-HACK`,
          `https://creditz.university.edu/verify/CRD-${std.usn}-HACK`,
          'verified',
          standardChecklist,
          crypto.createHash('sha256').update(`hack-${std.id}`).digest('hex')
        );
      }

      // --- Year 3 Submissions (Internships, Research, Leadership) ---
      if (year >= 3) {
        subStmt.run(
          `sub_seed_${subIdCounter++}`,
          std.id,
          'sch_intern_1',
          1,
          'Summer Industrial Research Internship (8-Week)',
          'cat_intern',
          'Developed cloud microservice backends and telemetry consumers.',
          '/uploads/microsoft_research_internship.pdf',
          'internship_letter.pdf',
          210000,
          'approved',
          30,
          5,
          'Supervisor appraisal verified Grade A.',
          aiAuditClean,
          '2024-07-28',
          '2024-08-01T15:20:00Z',
          '2024-08-03T16:00:00Z',
          std.mentorId,
          160,
          `CRD-${std.usn}-INTERN`,
          `https://creditz.university.edu/verify/CRD-${std.usn}-INTERN`,
          'verified',
          standardChecklist,
          crypto.createHash('sha256').update(`intern-${std.id}`).digest('hex')
        );

        subStmt.run(
          `sub_seed_${subIdCounter++}`,
          std.id,
          'sch_cert_3',
          1,
          'AWS Certified Solutions Architect Associate (SAA-C03)',
          'cat_cert',
          'Cleared proctored AWS certification exam with score 840/1000.',
          '/uploads/gaurish_aws_certified_solutions_architect.pdf',
          'aws_cert.pdf',
          195000,
          'approved',
          25,
          6,
          'Credential ID validated on AWS verification registry.',
          aiAuditClean,
          '2025-01-10',
          '2025-01-12T09:00:00Z',
          '2025-01-14T10:00:00Z',
          std.mentorId,
          50,
          `CRD-${std.usn}-AWS`,
          `https://creditz.university.edu/verify/CRD-${std.usn}-AWS`,
          'verified',
          standardChecklist,
          crypto.createHash('sha256').update(`aws-${std.id}`).digest('hex')
        );
      }

      // --- Year 4 Submissions (National Wins, Degree Clearance Portfolio) ---
      if (year === 4) {
        subStmt.run(
          `sub_seed_${subIdCounter++}`,
          std.id,
          'sch_comp_1',
          1,
          'Smart India Hackathon (SIH 2024) National Winner',
          'cat_comp',
          '1st Prize national winner in AI category addressing rural health triage.',
          '/uploads/smart_india_hackathon_finalist.pdf',
          'sih_national_winner.pdf',
          230000,
          'approved',
          40,
          7,
          'Official Ministry innovation cell award confirmed.',
          aiAuditClean,
          '2024-12-14',
          '2024-12-16T11:00:00Z',
          '2024-12-17T09:40:00Z',
          std.mentorId,
          40,
          `CRD-${std.usn}-SIH`,
          `https://creditz.university.edu/verify/CRD-${std.usn}-SIH`,
          'verified',
          standardChecklist,
          crypto.createHash('sha256').update(`sih-${std.id}`).digest('hex')
        );

        subStmt.run(
          `sub_seed_${subIdCounter++}`,
          std.id,
          'sch_vol_1',
          1,
          'NSS 7-Day Residential Rural Community Development Camp Lead',
          'cat_vol',
          'Led student brigade across rural schools for digital literacy.',
          '/uploads/nss_rural_camp_certificate.pdf',
          'nss_lead.pdf',
          140000,
          'approved',
          25,
          7,
          'Program Officer commendation on record.',
          aiAuditClean,
          '2024-04-10',
          '2024-04-12T08:30:00Z',
          '2024-04-15T11:20:00Z',
          std.mentorId,
          60,
          `CRD-${std.usn}-NSS`,
          `https://creditz.university.edu/verify/CRD-${std.usn}-NSS`,
          'verified',
          standardChecklist,
          crypto.createHash('sha256').update(`nss-${std.id}`).digest('hex')
        );

        // Capstone activity for degree clearance (15-20 pts)
        subStmt.run(
          `sub_seed_${subIdCounter++}`,
          std.id,
          'sch_work_1',
          1,
          'IEEE Conference Best Student Technical Paper Award',
          'cat_work',
          'Published best student research paper in distributed consensus.',
          '/uploads/ieee_conference_best_paper.pdf',
          'ieee_paper.pdf',
          175000,
          'approved',
          25,
          8,
          'Presentation and paper publication verified on IEEE Xplore.',
          aiAuditClean,
          '2024-11-10',
          '2024-11-12T16:00:00Z',
          '2024-11-14T10:00:00Z',
          std.mentorId,
          40,
          `CRD-${std.usn}-IEEE`,
          `https://creditz.university.edu/verify/CRD-${std.usn}-IEEE`,
          'verified',
          standardChecklist,
          crypto.createHash('sha256').update(`ieee-${std.id}`).digest('hex')
        );
      }
    }
    console.log(`✓ Generated year-appropriate activity submissions for all ${allStudents.length} students.`);

    // 6. Generate Academic Curriculum Marks up to each student's current semester
    console.log('Generating multi-semester curriculum marks...');
    const marksStmt = db.prepare(`
      INSERT OR REPLACE INTO student_marks (
        id, student_id, semester, subject_code, subject_name,
        credits, theory_marks, theory_max, task_marks, task_max,
        has_lab, lab_marks, lab_max, grade, grade_points,
        mse1_marks, mse1_max, mse2_marks, mse2_max, is_poor_performance,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    let totalMarksCount = 0;

    for (const std of allStudents) {
      for (let sem = 1; sem <= std.semester; sem++) {
        const subjects = SEMESTER_CURRICULUM[sem] || [];
        for (let idx = 0; idx < subjects.length; idx++) {
          const tmpl = subjects[idx];
          const baseTheory = Math.round(Math.min(100, Math.max(45, (std.cgpa / 10) * 100 + (Math.sin((idx + sem) * 5) * 5))));
          const mseBase = Math.round((baseTheory / 100) * 30);
          
          let mse1 = Math.min(30, Math.max(7, mseBase + Math.floor(Math.random() * 3) - 1));
          let mse2 = Math.min(30, Math.max(7, mseBase + Math.floor(Math.random() * 3) - 1));

          // Deliberate sub-40% MSE score on select 3rd-year students for remedial counseling testing
          let isPoor = 0;
          if (std.year === 3 && sem === 5 && tmpl.code === '21CS54') {
            mse1 = 9;
            mse2 = 10;
            isPoor = 1;
          }

          let grade = 'A';
          let gp = 8;
          if (baseTheory >= 90) { grade = 'O'; gp = 10; }
          else if (baseTheory >= 80) { grade = 'A+'; gp = 9; }
          else if (baseTheory >= 70) { grade = 'A'; gp = 8; }
          else if (baseTheory >= 60) { grade = 'B+'; gp = 7; }
          else { grade = 'B'; gp = 6; }

          marksStmt.run(
            `sm_${std.id}_s${sem}_${idx + 1}`,
            std.id,
            sem,
            tmpl.code,
            tmpl.name,
            tmpl.credits,
            baseTheory,
            tmpl.theoryMax,
            tmpl.task,
            tmpl.taskMax,
            tmpl.hasLab ? 1 : 0,
            tmpl.hasLab ? tmpl.lab : 0,
            tmpl.hasLab ? tmpl.labMax : 0,
            grade,
            gp,
            mse1,
            30,
            mse2,
            30,
            isPoor,
            now,
            now
          );
          totalMarksCount++;
        }
      }
    }
    console.log(`✓ Inserted ${totalMarksCount} academic subject marks across all 4 years.`);

    // 7. Write comprehensive CSV matching the multi-year layout
    console.log('Writing updated csv and csv.txt...');
    let csvContent = 'Name,USN,Year,Semester,Mentor\n';
    for (const s of allStudents) {
      csvContent += `${s.name},${s.usn},Year ${s.year},Sem ${s.semester},${s.mentorName}\n`;
    }

    csvContent += '\n\nFaculty Mentors Assigned by Year\n';
    csvContent += 'Year,Mentor Name,Designation,Assigned Mentees Count\n';
    for (const m of mentorYearAssignments) {
      csvContent += `Year ${m.assignedYear},${m.name},${m.designation},${m.quota} Mentees\n`;
    }

    fs.writeFileSync(path.join(process.cwd(), 'csv'), csvContent);
    fs.writeFileSync(path.join(process.cwd(), 'csv.txt'), csvContent);
    console.log('✓ Successfully wrote multi-year cohort to csv and csv.txt.');

    db.exec('COMMIT;');
    console.log('\n========================================================================');
    console.log('MIGRATION COMPLETE: 134 STUDENTS BALANCED ACROSS 24 YEAR-SPECIFIC MENTORS');
    console.log('========================================================================');
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('Migration failed, rolled back changes:', err);
    throw err;
  }
}

if (process.argv[1] && process.argv[1].endsWith('populate_all_4_years.ts')) {
  populateAll4Years()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
