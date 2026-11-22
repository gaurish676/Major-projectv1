import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { getDb } from '../server/db/database';
import { SEMESTER_CURRICULUM } from '../server/services/curriculumSubjects';

// 1. Define Mentors from csv (including requested mentors: Savitha, Sowmya Ashwath, Sowmya P, Sowmya S, Pradeep Kanchan, Sunil Aithal, etc.)
const mentorsList = [
  { id: 'usr_mentor_savitha', name: 'Dr. Savitha', email: 'savitha@university.edu', designation: 'Associate Professor, CSE', raw: 'savitha' },
  { id: 'usr_mentor_sowmya_ashwath', name: 'Prof. Sowmya Ashwath', email: 'sowmya.ashwath@university.edu', designation: 'Assistant Professor, CSE', raw: 'sowmya ashwath' },
  { id: 'usr_mentor_sowmya_p', name: 'Prof. Sowmya P', email: 'sowmya.p@university.edu', designation: 'Assistant Professor, CSE', raw: 'sowmya p' },
  { id: 'usr_mentor_sowmya_s', name: 'Prof. Sowmya S', email: 'sowmya.s@university.edu', designation: 'Assistant Professor, CSE', raw: 'sowmya s' },
  { id: 'usr_mentor_pradeep_kanchan', name: 'Dr. Pradeep Kanchan', email: 'pradeep.kanchan@university.edu', designation: 'Associate Professor, CSE', raw: 'pradeep kanchan' },
  { id: 'usr_mentor_sunil_aithal', name: 'Dr. Sunil Aithal', email: 'sunil.aithal@university.edu', designation: 'Associate Professor, CSE', raw: 'sunil aithal' },
  { id: 'usr_mentor_guru', name: 'Dr. Guru Prasad', email: 'guruprasad@university.edu', designation: 'Associate Professor, CSE', raw: 'guru prasad' },
  { id: 'usr_mentor_aishwarya', name: 'Prof. Aishwarya', email: 'aishwarya@university.edu', designation: 'Assistant Professor, CSE', raw: 'aishwarya' },
  { id: 'usr_mentor_pawan', name: 'Prof. Pawan Kumar', email: 'pawan.faculty@university.edu', designation: 'Assistant Professor, CSE', raw: 'pawan' },
  { id: 'usr_mentor_sannidhan', name: 'Dr. Sannidhan M. S.', email: 'sannidhan@university.edu', designation: 'Professor & Mentor, CSE', raw: 'sannidhan' },
  { id: 'usr_coordinator_1', name: 'Prof. Joylin Mendonca', email: 'joylin@university.edu', designation: 'Assistant Professor & Coordinator, CSE', raw: 'joylin mendonca' },
  { id: 'usr_mentor_1', name: 'Prof. Ravi Kumar', email: 'ravi@university.edu', designation: 'Assistant Professor, CSE', raw: 'ravi kumar' },
  { id: 'usr_mentor_2', name: 'Prof. Anita Desai', email: 'anita@university.edu', designation: 'Assistant Professor, CSE', raw: 'anita desai' },
  { id: 'usr_mentor_radhakrishna', name: 'Prof. Radhakrishna Rao', email: 'radhakrishna@university.edu', designation: 'Assistant Professor, CSE', raw: 'radhakrishna rao' },
  { id: 'usr_mentor_shashank', name: 'Prof. Shashank Shetty', email: 'shashank.shetty@university.edu', designation: 'Assistant Professor, CSE', raw: 'shashank shetty' },
  { id: 'usr_mentor_chinmayee', name: 'Prof. Chinmayee K.', email: 'chinmayee@university.edu', designation: 'Assistant Professor, CSE', raw: 'chinmayee k' },
  { id: 'usr_mentor_sandeep', name: 'Prof. Sandeep Kumar', email: 'sandeep.kumar@university.edu', designation: 'Assistant Professor, CSE', raw: 'sandeep kumar' },
  { id: 'usr_mentor_mamatha', name: 'Prof. Mamatha Balipa', email: 'mamatha.balipa@university.edu', designation: 'Assistant Professor, CSE', raw: 'mamatha balipa' },
  { id: 'usr_mentor_karthik', name: 'Prof. Karthik Pai', email: 'karthik.pai@university.edu', designation: 'Assistant Professor, CSE', raw: 'karthik pai' },
  { id: 'usr_mentor_divya', name: 'Prof. Divya Rani', email: 'divya.rani@university.edu', designation: 'Assistant Professor, CSE', raw: 'divya rani' },
  { id: 'usr_mentor_puneeth', name: 'Prof. Puneeth R. P.', email: 'puneeth.rp@university.edu', designation: 'Assistant Professor, CSE', raw: 'puneeth r p' },
  { id: 'usr_mentor_venugopala', name: 'Prof. Venugopala Rao', email: 'venugopala@university.edu', designation: 'Assistant Professor, CSE', raw: 'venugopala rao' },
  { id: 'usr_mentor_deepa', name: 'Prof. Deepa Shenoy', email: 'deepa.shenoy@university.edu', designation: 'Assistant Professor, CSE', raw: 'deepa shenoy' },
  { id: 'usr_mentor_bhargavi', name: 'Prof. Bhargavi Rao', email: 'bhargavi.rao@university.edu', designation: 'Assistant Professor, CSE', raw: 'bhargavi rao' },
];

// 2. Define Core Students from csv
const coreStudents = [
  { name: 'gaurish', usn: 'nnm23cs077', fullName: 'Gaurish' },
  { name: 'sampath', usn: 'nnm23cs167', fullName: 'Sampath' },
  { name: 'sharan', usn: 'nnm23cs176', fullName: 'Sharan' },
  { name: 'ronak', usn: 'nnm23cs153', fullName: 'Ronak' },
];

// 3. Generate 101 additional realistic Indian student names with USNs
const firstNames = [
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

const lastNames = [
  'Shetty', 'Nayak', 'Bhat', 'Rao', 'Hegde', 'Shenoy', 'Pai', 'Kamath', 'Mallya', 'Poojary',
  'Kudva', 'Acharya', 'Holla', 'Kulal', 'Karkera', 'Alva', 'Chowta', 'Ballal', 'Rai', 'Prabhu',
  'Kotian', 'Suvarna', 'Amin', 'Mendon', 'Salian', 'Bangera', 'Patil', 'Kulkarni', 'Deshpande', 'Verma'
];

export async function populateCsvAndDatabase() {
  console.log('--- Step 1: Generating 105+ Student Records ---');

  const allStudents: Array<{
    id: string;
    name: string;
    usn: string;
    fullName: string;
    email: string;
    semester: number;
    cgpa: number;
    mentorId: string;
  }> = [];

  // Explicitly balance mentor assignments across all 24 mentors so each has 4-5 mentees (never > 5)
  // With 105 students and 24 mentors:
  // Mentors 0..8 get 5 students (9 * 5 = 45)
  // Mentors 9..23 get 4 students (15 * 4 = 60)
  // Total = 105 students
  const mentorMenteeQuota: number[] = mentorsList.map((_, idx) => (idx < 9 ? 5 : 4));
  const mentorMenteeCounts: number[] = new Array(mentorsList.length).fill(0);

  // Add the 4 core students first (assigned to Dr. Savitha, Prof. Sowmya Ashwath, Prof. Sowmya P, Prof. Sowmya S)
  coreStudents.forEach((cs, idx) => {
    const mentorIdx = idx % mentorsList.length;
    mentorMenteeCounts[mentorIdx]++;
    allStudents.push({
      id: `usr_std_${cs.name}`,
      name: cs.name,
      usn: cs.usn,
      fullName: cs.fullName,
      email: `${cs.name}@university.edu`,
      semester: 4,
      cgpa: cs.name === 'gaurish' ? 8.85 : cs.name === 'sampath' ? 8.70 : cs.name === 'sharan' ? 8.40 : 8.25,
      mentorId: mentorsList[mentorIdx].id,
    });
  });

  // Used USN numbers set
  const usedNumbers = new Set<number>([77, 167, 176, 153]);
  let currentNum = 1;

  for (let i = 0; i < 101; i++) {
    while (usedNumbers.has(currentNum)) {
      currentNum++;
    }
    usedNumbers.add(currentNum);

    const fName = firstNames[i % firstNames.length];
    const lName = lastNames[i % lastNames.length];
    const fullName = `${fName} ${lName}`;
    const cleanUsn = `nnm23cs${String(currentNum).padStart(3, '0')}`;

    // Select mentor with lowest count that has not reached quota (enforcing strictly 4-5 mentees per mentor)
    let bestMentorIdx = 0;
    let minCount = Infinity;
    for (let m = 0; m < mentorsList.length; m++) {
      if (mentorMenteeCounts[m] < mentorMenteeQuota[m] && mentorMenteeCounts[m] < minCount) {
        minCount = mentorMenteeCounts[m];
        bestMentorIdx = m;
      }
    }
    mentorMenteeCounts[bestMentorIdx]++;
    const mentor = mentorsList[bestMentorIdx];

    // CGPA between 7.10 and 9.60
    const cgpa = Math.round((7.10 + (Math.sin(i * 13) * 0.5 + 0.5) * 2.5) * 100) / 100;

    allStudents.push({
      id: `usr_std_${cleanUsn}`,
      name: fName.toLowerCase(),
      usn: cleanUsn,
      fullName: fullName,
      email: `${fName.toLowerCase()}.${cleanUsn}@university.edu`,
      semester: 4,
      cgpa: Math.min(9.8, Math.max(6.8, cgpa)),
      mentorId: mentor.id,
    });

    currentNum++;
  }

  console.log(`Generated total ${allStudents.length} students (Minimum 100 satisfied).`);

  // --- Step 2: Write csv and csv.txt ---
  console.log('\n--- Step 2: Writing csv and csv.txt ---');
  let csvContent = 'Name,USN\n';
  allStudents.forEach((std) => {
    csvContent += `${std.name},${std.usn}\n`;
  });
  csvContent += '\n\nname of mentor \n';
  mentorsList.forEach((m) => {
    csvContent += `${m.raw} \n`;
  });
  csvContent += '\n';

  fs.writeFileSync(path.join(process.cwd(), 'csv'), csvContent);
  fs.writeFileSync(path.join(process.cwd(), 'csv.txt'), csvContent);
  console.log('Successfully written both csv and csv.txt');

  // --- Step 3: Populate Database ---
  console.log('\n--- Step 3: Populating SQLite Database ---');
  const db = getDb();
  const defaultHash = bcrypt.hashSync('password123', 10);

  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec('BEGIN TRANSACTION;');

  try {
    // 1. Departments
    db.exec(`
      INSERT OR REPLACE INTO departments (id, name, code) VALUES
      ('dept_cse', 'Department of Computer Science & Engineering', 'CSE'),
      ('dept_ise', 'Department of Information Science & Engineering', 'ISE'),
      ('dept_aiml', 'Department of Artificial Intelligence & Machine Learning', 'AIML');
    `);

    // 2. Schema Categories (schema: id, name, description, max_cap_points, icon, color)
    db.exec(`
      INSERT OR REPLACE INTO schema_categories (id, name, description, max_cap_points, icon, color) VALUES
      ('cat_cert', 'Online Certifications & MOOCs', 'NPTEL, Coursera, AWS, Google Cloud, Cisco certifications (min 4-12 weeks duration)', 50, 'Award', 'blue'),
      ('cat_comp', 'Hackathons & Technical Competitions', 'SIH, College Hackathons, Coding Contests, Project Olympiads, Robotics challenges', 60, 'Code2', 'indigo'),
      ('cat_intern', 'Industry Internships & Research Fellowships', 'Summer/Winter corporate or academic research internships (min 4-8 weeks)', 60, 'Briefcase', 'emerald'),
      ('cat_sports', 'Sports, Cultural & Student Leadership', 'Inter-University, State, National level sports, Cultural fests, Technical Club leads', 40, 'Trophy', 'amber'),
      ('cat_vol', 'Community Service & Social Outreach', 'NSS, Red Cross, Village adoption, Blood donation camps, Environmental conservation', 40, 'HeartHandshake', 'rose'),
      ('cat_work', 'Technical Workshops & Conferences', 'Hands-on technical bootcamps, Paper publications, IEEE/ACM conference presentations', 30, 'BookOpen', 'purple');
    `);

    // 3. Activity Schema Rules
    db.exec(`
      INSERT OR REPLACE INTO activity_schema (id, category_id, activity_name, base_points, criteria, version, is_active, hours_required, points_per_hour, applicable_year, created_at) VALUES
      ('sch_cert_1', 'cat_cert', '12-Week NPTEL / SWAYAM Elite Certification', 30, 'Elite / Elite+Gold / Silver score certificate issued by IIT/IISc', 1, 1, 45, 0.67, 'years_2_4', '2025-01-10T00:00:00Z'),
      ('sch_cert_2', 'cat_cert', '8-Week Technical Certification (Coursera / edX)', 20, 'Verified course completion certificate with proctored assessment', 1, 1, 30, 0.67, 'years_2_4', '2025-01-10T00:00:00Z'),
      ('sch_cert_3', 'cat_cert', 'Industry Cloud Credential (AWS / Azure / GCP)', 25, 'Official industry credential badge and passing scorecard', 1, 1, 50, 0.50, 'years_2_4', '2025-01-10T00:00:00Z'),
      ('sch_comp_1', 'cat_comp', 'National Level Hackathon Winner / Runner-up (e.g. SIH)', 40, 'Prize certificate with problem statement and jury endorsement', 1, 1, 40, 1.00, 'years_2_4', '2025-01-10T00:00:00Z'),
      ('sch_comp_2', 'cat_comp', 'Inter-College Hackathon Finalist / Top 5', 20, 'Finalist certificate with working prototype demonstration', 1, 1, 30, 0.67, 'years_2_4', '2025-01-10T00:00:00Z'),
      ('sch_intern_1', 'cat_intern', 'Corporate / Research Internship (8+ Weeks)', 30, 'Formal completion letter, supervisor evaluation, and project report', 1, 1, 160, 0.19, 'years_2_4', '2025-01-10T00:00:00Z'),
      ('sch_intern_2', 'cat_intern', 'Startup / Virtual Internship (4-6 Weeks)', 20, 'Completion certificate with verified repository/deliverable links', 1, 1, 80, 0.25, 'years_2_4', '2025-01-10T00:00:00Z'),
      ('sch_sports_1', 'cat_sports', 'All India Inter-University Sports Representation', 30, 'Merit / participation certificate from Association of Indian Universities (AIU)', 1, 1, 40, 0.75, 'years_2_4', '2025-01-10T00:00:00Z'),
      ('sch_sports_2', 'cat_sports', 'Inter-College Cultural / Tech Fest Winner', 20, 'Winner certificate with event title and university seal', 1, 1, 30, 0.67, 'years_2_4', '2025-01-10T00:00:00Z'),
      ('sch_vol_1', 'cat_vol', 'NSS 7-Day Residential Rural Development Camp', 25, 'Camp participation certificate signed by NSS Program Officer', 1, 1, 60, 0.42, 'years_2_4', '2025-01-10T00:00:00Z'),
      ('sch_vol_2', 'cat_vol', 'Blood Donation Camp / Green Campus Drive Volunteer', 10, 'Official donor card or volunteering commendation letter', 1, 1, 20, 0.50, 'years_2_4', '2025-01-10T00:00:00Z'),
      ('sch_work_1', 'cat_work', 'IEEE / Springer Conference Paper Presentation', 25, 'Acceptance letter, presentation certificate, and IEEE Xplore link', 1, 1, 40, 0.63, 'years_2_4', '2025-01-10T00:00:00Z'),
      ('sch_induct_1', 'cat_vol', '1st Year AICTE Student Induction Program (SIP 3-Week)', 25, 'Full attendance in 3-week induction module and creative arts', 1, 1, 60, 0.42, 'year_1', '2025-01-10T00:00:00Z');
    `);

    // 4. Users: HOD & Dean
    db.exec(`
      INSERT OR REPLACE INTO users (id, name, email, password_hash, role, department_id, mentor_id, cgpa, semester, roll_no, avatar, designation, office_location) VALUES
      ('usr_hod_1', 'Dr. Sannidhan M. S.', 'hod@university.edu', '${defaultHash}', 'hod', 'dept_cse', NULL, NULL, NULL, 'EMP-CSE-001', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'Professor & Head of Department', 'Cabin 101, Main CSE Block'),
      ('usr_dean_1', 'Dr. Pawan Kumar', 'dean@university.edu', '${defaultHash}', 'dean', 'dept_cse', NULL, NULL, NULL, 'EMP-DEAN-001', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'Dean of Student Affairs & Academic Accreditation', 'Dean Office, Administrative Tower');
    `);

    // 5. Users: The 5 Mentors from CSV
    for (const m of mentorsList) {
      db.prepare(`
        INSERT OR REPLACE INTO users (id, name, email, password_hash, role, department_id, mentor_id, cgpa, semester, roll_no, avatar, designation, office_location)
        VALUES (?, ?, ?, ?, 'mentor', 'dept_cse', NULL, NULL, NULL, ?, ?, ?, ?)
      `).run(
        m.id,
        m.name,
        m.email,
        defaultHash,
        `EMP-CSE-${m.id.slice(-4).toUpperCase()}`,
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        m.designation,
        'Faculty Wing B, Cabin 204'
      );
    }

    // 6. Users: The 105 Students
    const studentStmt = db.prepare(`
      INSERT OR REPLACE INTO users (id, name, email, password_hash, role, department_id, mentor_id, cgpa, semester, roll_no, avatar, phone, bio)
      VALUES (?, ?, ?, ?, 'student', 'dept_cse', ?, ?, ?, ?, ?, ?, ?)
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
        s.usn.toUpperCase(),
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        `+91 9845${Math.floor(100000 + Math.random() * 900000)}`,
        `CSE Scholar (Semester ${s.semester}) passionate about full-stack systems and cloud development.`
      );
    }

    // 7. Generate Mock Certificates in uploads/
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const sampleCerts = [
      { file: 'nptel_cloud_computing_elite.svg', title: 'NPTEL Elite Certificate - Cloud Computing', issuer: 'IIT Kharagpur & NPTEL' },
      { file: 'smart_india_hackathon_finalist.svg', title: 'Smart India Hackathon 2024 Finalist', issuer: 'Ministry of Education Innovation Cell, Govt of India' },
      { file: 'internship_microsoft_fellow.svg', title: 'Summer Research Internship Completion Letter', issuer: 'Microsoft Research India - Systems Lab' },
      { file: 'priya_iee_paper.svg', title: 'IEEE International Conference Paper Presentation', issuer: 'IEEE Computer Society Bangalore Chapter' },
      { file: 'amit_inter_univ_sports.svg', title: 'All India Inter-University Championship', issuer: 'Association of Indian Universities (AIU)' },
      { file: 'aws_solutions_architect_pending.svg', title: 'AWS Certified Solutions Architect Associate', issuer: 'Amazon Web Services Training & Certification' },
    ];

    for (const c of sampleCerts) {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 560" width="100%" height="100%">
          <rect width="800" height="560" fill="#ffffff" stroke="#0284c7" stroke-width="4" rx="8"/>
          <rect x="20" y="20" width="760" height="520" fill="none" stroke="#eab308" stroke-width="2" rx="6"/>
          <text x="400" y="100" font-family="Georgia, serif" font-size="24" font-weight="bold" fill="#0f172a" text-anchor="middle">CERTIFICATE OF RECOGNITION</text>
          <text x="400" y="130" font-family="sans-serif" font-size="12" fill="#64748b" text-anchor="middle" letter-spacing="3">ACCREDITED ACTIVITY CREDENTIAL</text>
          <line x1="280" y1="150" x2="520" y2="150" stroke="#cbd5e1" stroke-width="1"/>
          <text x="400" y="220" font-family="sans-serif" font-size="14" fill="#475569" text-anchor="middle">This is proudly awarded for successful completion of</text>
          <text x="400" y="260" font-family="sans-serif" font-size="20" font-weight="bold" fill="#0284c7" text-anchor="middle">${c.title}</text>
          <text x="400" y="320" font-family="sans-serif" font-size="14" fill="#334155" text-anchor="middle">Issued by: <tspan font-weight="600">${c.issuer}</tspan></text>
          <text x="400" y="470" font-family="monospace" font-size="10" fill="#94a3b8" text-anchor="middle">OFFICIALLY VERIFIED ON NMAMIT CREDIT PLATFORM</text>
        </svg>
      `;
      fs.writeFileSync(path.join(uploadsDir, c.file), svg.trim());
    }

    // 8. Sample Submissions for Key Students
    const subStmt = db.prepare(`
      INSERT OR REPLACE INTO submissions (
        id, student_id, schema_id, schema_version_snapshot, activity_title, category_id,
        description, file_url, file_name, file_size, status, points_awarded,
        semester, mentor_feedback, ai_audit_results, completion_date, submitted_at, reviewed_at,
        reviewed_by, hours_spent, credential_hash, qr_code_data, verification_status, verification_checklist
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const standardChecklist = JSON.stringify({
      student_identity_verified: true,
      accredited_issuer_verified: true,
      minimum_hours_satisfied: true,
      original_seal_and_signature: true,
      verified_timestamp: new Date().toISOString()
    });

    const aiAuditClean = JSON.stringify({
      confidence_score: 98,
      name_match: true,
      issuer_match: true,
      flagged: false,
      extracted: {
        student_name: 'Verified',
        activity: 'Verified Certificate',
        organization: 'Verified Issuer'
      }
    });

    // Submissions for Gaurish (assigned to Dr. Savitha)
    subStmt.run(
      'sub_gaurish_1', 'usr_std_gaurish', 'sch_cert_1', 1,
      'NPTEL Cloud Computing 12-Week Elite Certification', 'cat_cert',
      'Completed 12-week NPTEL course with proctored score 88% (Elite + Silver).',
      '/uploads/nptel_cloud_computing_elite.pdf', 'nptel_cloud_computing_elite.pdf', 154000,
      'approved', 30, 3, 'Verified credentials with NPTEL registry. Excellent score.',
      aiAuditClean, '2024-10-18', '2024-10-20T10:30:00Z', '2024-10-22T14:15:00Z', 'usr_mentor_savitha',
      60, 'CRD-2025-GAURISH1', 'https://creditz.university.edu/verify/CRD-2025-GAURISH1', 'verified', standardChecklist
    );

    subStmt.run(
      'sub_gaurish_2', 'usr_std_gaurish', 'sch_comp_1', 1,
      'Smart India Hackathon (SIH 2024) National Finalist', 'cat_comp',
      'Built an AI-driven triage system for rural primary healthcare centers.',
      '/uploads/smart_india_hackathon_finalist.pdf', 'smart_india_hackathon_finalist.pdf', 184000,
      'approved', 40, 4, 'Verified team submission and prototype demonstration.',
      aiAuditClean, '2024-12-14', '2024-12-16T11:00:00Z', '2024-12-17T09:40:00Z', 'usr_mentor_savitha',
      50, 'CRD-2025-GAURISH2', 'https://creditz.university.edu/verify/CRD-2025-GAURISH2', 'verified', standardChecklist
    );

    subStmt.run(
      'sub_gaurish_3', 'usr_std_gaurish', 'sch_intern_1', 1,
      'Microsoft Research Systems Lab Summer Internship', 'cat_intern',
      '8 weeks research fellowship on distributed systems and telemetry parsing.',
      '/uploads/microsoft_research_internship.pdf', 'microsoft_research_internship.pdf', 196000,
      'approved', 30, 3, 'Outstanding project report and supervisor evaluation verified.',
      aiAuditClean, '2024-07-28', '2024-08-01T15:20:00Z', '2024-08-03T16:00:00Z', 'usr_mentor_savitha',
      160, 'CRD-2025-GAURISH3', 'https://creditz.university.edu/verify/CRD-2025-GAURISH3', 'verified', standardChecklist
    );

    // Replaced generic AWS with Gaurish genuine Ethical Hacking training certificate from Nitte Institute of Technology
    subStmt.run(
      'sub_gaurish_pending', 'usr_std_gaurish', 'sch_cert_2', 1,
      '8-Week Online Training on Ethical Hacking & Information Security', 'cat_cert',
      'Successfully completed 8-week proctored training covering Network Security, OWASP Top 10 VAPT, and Security Audit Reporting. Certificate No: 29ttj8xobsk (Nitte Institute Of Technology, Karkala).',
      '/uploads/gaurish_ethical_hacking_training.pdf', 'gaurish_ethical_hacking_training.pdf', 157274,
      'pending', 0, 4, null,
      JSON.stringify({
        confidence_score: 99,
        name_match: true,
        issuer_match: true,
        flagged: false,
        extracted: {
          student_name: 'Gaurish Bangera',
          institution: 'Nitte Institute Of Technology, Karkala',
          course: 'Ethical Hacking',
          certificate_no: '29ttj8xobsk',
          issue_date: '2025-02-08'
        }
      }), '2025-02-08', '2025-02-10T09:15:00Z', null, null,
      50, 'CRD-2025-GAURISH-HACK', 'https://trainings.internshala.com/verify_certificate?cert=29ttj8xobsk', 'pending', standardChecklist
    );

    // Submissions for Sampath (assigned to Prof. Sowmya Ashwath)
    subStmt.run(
      'sub_sampath_1', 'usr_std_sampath', 'sch_work_1', 1,
      'IEEE International Conference Paper Presentation', 'cat_work',
      'Presented research paper on Real-time Multi-Agent Scheduling at IEEE Bangalore.',
      '/uploads/ieee_conference_best_paper.pdf', 'ieee_conference_best_paper.pdf', 162000,
      'approved', 25, 4, 'Authentic IEEE paper acceptance confirmed.',
      aiAuditClean, '2024-11-12', '2024-11-15T10:00:00Z', '2024-11-16T12:00:00Z', 'usr_mentor_sowmya_ashwath',
      40, 'CRD-2025-SAMPATH1', 'https://creditz.university.edu/verify/CRD-2025-SAMPATH1', 'verified', standardChecklist
    );

    subStmt.run(
      'sub_sampath_2', 'usr_std_sampath', 'sch_vol_1', 1,
      'NSS 7-Day Residential Rural Development Camp', 'cat_vol',
      'Conducted village digital literacy and green computing workshops.',
      '/uploads/nss_rural_camp_certificate.pdf', 'nss_rural_camp_certificate.pdf', 145000,
      'approved', 25, 3, 'Signed by NSS coordinator.',
      aiAuditClean, '2024-04-10', '2024-04-12T08:30:00Z', '2024-04-15T11:20:00Z', 'usr_mentor_sowmya_ashwath',
      60, 'CRD-2025-SAMPATH2', 'https://creditz.university.edu/verify/CRD-2025-SAMPATH2', 'verified', standardChecklist
    );

    // Submissions for Sharan (assigned to Prof. Sowmya P)
    subStmt.run(
      'sub_sharan_1', 'usr_std_sharan', 'sch_comp_2', 1,
      'INNOVEX 24-Hour National-Level Hackathon', 'cat_comp',
      'Developed sustainable water distribution monitoring dashboard with IoT at NMAMIT INNOVEX Hackathon.',
      '/uploads/innovex_hackathon_nmamit.pdf', 'innovex_hackathon_nmamit.pdf', 18400000,
      'approved', 20, 3, 'Verified prototype and regional standings.',
      aiAuditClean, '2024-08-20', '2024-08-22T09:00:00Z', '2024-08-24T14:00:00Z', 'usr_mentor_sowmya_p',
      35, 'CRD-2025-SHARAN1', 'https://creditz.university.edu/verify/CRD-2025-SHARAN1', 'verified', standardChecklist
    );

    subStmt.run(
      'sub_sharan_2', 'usr_std_sharan', 'sch_cert_2', 1,
      'Microsoft Azure AI Solutions Professional Credential', 'cat_cert',
      'Completed Azure AI engineering curriculum and knowledge assessments.',
      '/uploads/gaurish_azure_ai_solutions.pdf', 'gaurish_azure_ai_solutions.pdf', 245000,
      'approved', 20, 4, 'Verified online credential certificate.',
      aiAuditClean, '2024-11-05', '2024-11-08T11:00:00Z', '2024-11-10T16:00:00Z', 'usr_mentor_sowmya_p',
      40, 'CRD-2025-SHARAN2', 'https://creditz.university.edu/verify/CRD-2025-SHARAN2', 'verified', standardChecklist
    );

    // Submissions for Ronak (assigned to Prof. Sowmya S)
    subStmt.run(
      'sub_ronak_1', 'usr_std_ronak', 'sch_comp_1', 1,
      'National Cyber Security Hackathon Finalist', 'cat_comp',
      'Designed intrusion detection pipeline using packet sequence embeddings.',
      '/uploads/smart_india_hackathon_finalist.pdf', 'smart_india_hackathon_finalist.pdf', 184000,
      'approved', 25, 4, 'Commendable technical submission.',
      aiAuditClean, '2024-10-15', '2024-10-18T10:00:00Z', '2024-10-20T11:00:00Z', 'usr_mentor_sowmya_s',
      45, 'CRD-2025-RONAK1', 'https://creditz.university.edu/verify/CRD-2025-RONAK1', 'verified', standardChecklist
    );

    subStmt.run(
      'sub_ronak_2', 'usr_std_ronak', 'sch_sports_2', 1,
      'Inter-College Badminton Championship Gold Medal', 'cat_sports',
      'Won 1st place in university zonal singles championship.',
      '/uploads/inter_university_sports_badminton.pdf', 'inter_university_sports_badminton.pdf', 150000,
      'approved', 20, 3, 'Validated with Sports Department records.',
      aiAuditClean, '2024-09-12', '2024-09-14T09:30:00Z', '2024-09-15T15:00:00Z', 'usr_mentor_sowmya_s',
      30, 'CRD-2025-RONAK2', 'https://creditz.university.edu/verify/CRD-2025-RONAK2', 'verified', standardChecklist
    );

    // Also add pending review submissions for mentors review queues (including Dr. Savitha, Prof. Sowmya Ashwath, Sowmya P, Sowmya S, Dr. Pradeep Kanchan, Dr. Sunil Aithal)
    const samplePending = [
      { id: 'sub_pend_1', student: allStudents[4], title: 'AWS Certified Solutions Architect Associate (SAA-C03)', mentor: mentorsList[0], file: 'gaurish_aws_certified_solutions_architect.pdf' },
      { id: 'sub_pend_2', student: allStudents[5], title: 'National Level Hackathon 2nd Place', mentor: mentorsList[1], file: 'smart_india_hackathon_finalist.pdf' },
      { id: 'sub_pend_3', student: allStudents[6], title: 'NPTEL Cloud Computing Course', mentor: mentorsList[2], file: 'nptel_cloud_computing_elite.pdf' },
      { id: 'sub_pend_4', student: allStudents[7], title: 'State Level Technical Paper Presentation', mentor: mentorsList[3], file: 'ieee_conference_best_paper.pdf' },
      { id: 'sub_pend_5', student: allStudents[8], title: 'Rotaract Club Youth Leadership Summit', mentor: mentorsList[4], file: 'nss_rural_camp_certificate.pdf' },
      { id: 'sub_pend_6', student: allStudents[9], title: 'Google Summer of Code Open Source Contribution', mentor: mentorsList[5], file: 'microsoft_research_internship.pdf' },
    ];

    samplePending.forEach((p, idx) => {
      subStmt.run(
        p.id, p.student.id, 'sch_cert_2', 1,
        p.title, 'cat_cert',
        'Official verified certificate uploaded for mentor evaluation.',
        `/uploads/${p.file}`, p.file, 160000,
        'pending', 0, 4, null,
        aiAuditClean, '2025-01-18', '2025-01-20T10:00:00Z', null, null,
        35, `CRD-2025-PENDING${idx + 1}`, `https://creditz.university.edu/verify/CRD-2025-PENDING${idx + 1}`,
        'pending', standardChecklist
      );
    });

    // 9. Generate Student Marks for Curriculum (Semesters 1 to 4)
    console.log('Generating curriculum marks for all students...');
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

    for (const std of allStudents) {
      for (let sem = 1; sem <= std.semester; sem++) {
        const subjects = SEMESTER_CURRICULUM[sem] || [];
        for (let idx = 0; idx < subjects.length; idx++) {
          const tmpl = subjects[idx];
          const baseTheory = Math.round(Math.min(100, Math.max(45, (std.cgpa / 10) * 100 + (Math.sin((idx + sem) * 5) * 6))));
          const mseBase = Math.round((baseTheory / 100) * 30);
          
          let mse1 = Math.min(30, Math.max(7, mseBase + Math.floor(Math.random() * 3) - 1));
          let mse2 = Math.min(30, Math.max(7, mseBase + Math.floor(Math.random() * 3) - 1));

          // Deliberately set 2 students with poor performance for testing counseling workflow
          let isPoor = 0;
          if ((std.usn === 'nnm23cs005' || std.usn === 'nnm23cs018') && tmpl.code === '21CS41') {
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
        }
      }
    }

    // 10. Placement Drives
    db.exec(`
      INSERT OR REPLACE INTO placement_drives (id, company_name, role_title, min_cgpa, min_activity_points, max_backlogs, package_lpa, drive_date, category, is_active) VALUES
      ('drv_1', 'Google India', 'Software Development Engineer - I', 8.5, 80, 0, 34.0, '2025-08-15', 'Tier-1 Product', 1),
      ('drv_2', 'Microsoft IDC', 'Software Engineer (Azure Core & Cloud)', 8.0, 75, 0, 28.5, '2025-08-28', 'Tier-1 Product', 1),
      ('drv_3', 'Amazon AWS', 'Cloud Systems Support Engineer', 7.5, 70, 0, 22.0, '2025-09-05', 'Tier-1 Cloud', 1),
      ('drv_4', 'Cisco Systems', 'Network Software Engineer', 7.2, 60, 1, 18.0, '2025-09-20', 'Core Systems', 1),
      ('drv_5', 'TCS Digital', 'Systems Specialist & AI Engineer', 6.5, 50, 1, 9.0, '2025-10-10', 'Enterprise Tech', 1),
      ('drv_6', 'Infosys Springboard', 'Specialist Programmer (Power Programmer)', 6.5, 50, 1, 9.5, '2025-10-15', 'Enterprise Tech', 1);
    `);

    // 11. Campus Events
    db.exec(`
      INSERT OR REPLACE INTO events (id, title, category_id, description, potential_points, event_date, venue, registration_link, created_by, created_at) VALUES
      ('evt_1', 'NMAMIT National Hackathon (HackNitte 2025)', 'cat_comp', '48-hour national level software hackathon focused on AI and Sustainable Systems.', 25, '2025-03-20T09:00:00Z', 'Campus Innovation Center, Lab 301', 'https://hacknitte.nmamit.in', 'usr_hod_1', '2025-01-10T00:00:00Z'),
      ('evt_2', 'AWS GenAI Cloud Architecture Masterclass', 'cat_work', 'Hands-on serverless workshop with AWS Bedrock and CloudFormation.', 15, '2025-02-15T10:00:00Z', 'Seminar Hall 2, CSE Block', 'https://aws-workshop.nmamit.in', 'usr_mentor_savitha', '2025-01-10T00:00:00Z'),
      ('evt_3', 'Annual Blood Donation & Thalassemia Screening Drive', 'cat_vol', 'Community health outreach organized with Red Cross Society.', 10, '2025-02-25T08:30:00Z', 'College Health Center Auditorium', 'https://redcross.nmamit.in', 'usr_hod_1', '2025-01-10T00:00:00Z'),
      ('evt_4', 'Inter-Department Badminton & Table Tennis Tournament', 'cat_sports', 'Annual sports council tournament for engineering departments.', 15, '2025-03-05T09:00:00Z', 'Indoor Sports Complex', 'https://sports.nmamit.in', 'usr_mentor_pradeep_kanchan', '2025-01-10T00:00:00Z');
    `);

    // 12. Counseling Log for poor MSE performance
    db.exec(`
      INSERT OR REPLACE INTO counseling_logs (
        id, mentor_id, student_id, subject_code, subject_name,
        mse_marks, mse_max, reason, counseling_notes, action_plan, status,
        student_acknowledged, created_at
      ) VALUES (
        'csl_seed_1', 
        (SELECT COALESCE(mentor_id, 'usr_mentor_pradeep_kanchan') FROM users WHERE id = 'usr_std_nnm23cs005'), 
        'usr_std_nnm23cs005', '21CS41', 'Design and Analysis of Algorithms',
        9.0, 30.0, 'Low MSE-1 Score (<40%) in Dynamic Programming & Graph Reductions',
        'Scholar struggled with recurrence relations and Dijkstra proofs. Recommended remedial tutorials.',
        '1. Attend Tuesday 4 PM remedial tutorial in Cabin 204. 2. Solve 5 greedy algorithm problems by next Monday. 3. Retest planned next Friday.',
        'open', 0, '2025-01-22T10:15:00Z'
      );
    `);

    // 13. Notifications
    db.exec(`
      INSERT OR REPLACE INTO notifications (id, sender_id, sender_name, sender_role, recipient_id, recipient_role, category, title, message, meeting_time, meeting_venue, is_read, created_at) VALUES
      ('notif_1', 'usr_hod_1', 'Dr. Sannidhan M. S.', 'hod', NULL, 'mentor', 'meeting', 'Department Faculty Meeting: 200 Activity Clearance Audit', 'All faculty mentors are requested to review pending mentee submissions and ensure NAAC documentation is up to date.', 'Tomorrow, 10:30 AM', 'HOD Conference Room (Cabin 101)', 0, '2025-01-22T09:00:00Z'),
      ('notif_2', 'usr_mentor_savitha', 'Dr. Savitha', 'mentor', 'usr_std_gaurish', 'student', 'meeting', 'Ethical Hacking & Certification Review', 'Gaurish, please visit Cabin 204 with your Nitte Institute certificate for physical credential verification.', 'Thursday, 3:00 PM', 'Faculty Wing B, Cabin 204', 0, '2025-01-22T11:00:00Z'),
      ('notif_3', 'usr_dean_1', 'Dr. Pawan Kumar', 'dean', NULL, 'mentor', 'meeting', 'Dean Circular: Logisys University ERP Data Sync', 'All Department Mentors and HODs: Please ensure all 200 Activity Points clearances are exported to Logisys format.', 'Monday, 11:00 AM', 'Dean Boardroom', 0, '2025-01-22T08:00:00Z');
    `);

    db.exec('COMMIT;');
    console.log('Database transaction committed successfully.');
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('Database population failed, rolled back:', err);
    throw err;
  } finally {
    db.exec('PRAGMA foreign_keys = ON;');
  }

  // Row count verification
  const tables = ['departments', 'schema_categories', 'activity_schema', 'users', 'submissions', 'student_marks', 'placement_drives', 'events', 'counseling_logs', 'notifications'];
  console.log('\n--- Final Database Verification ---');
  for (const t of tables) {
    const row = db.prepare(`SELECT count(*) as count FROM ${t}`).get() as { count: number };
    console.log(`Table ${t.padEnd(20)}: ${row.count} rows`);
  }
}

if (process.argv[1] && process.argv[1].endsWith('populate_csv_and_db.ts')) {
  populateCsvAndDatabase()
    .then(() => {
      console.log('\nAll done! CSV and database populated.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
