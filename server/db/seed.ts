import { getDb, saveDb, queryOne, queryAll } from './database';
import fs from 'fs';
import path from 'path';
import { generateRandomStudentMarks } from '../services/curriculumSubjects';

export async function seedDatabase(force: boolean = false) {
  if (process.env.AUTO_SEED !== 'true' && !force) {
    console.log('Skipping demo seed (AUTO_SEED is not set). Database is in clean state for custom data.');
    return;
  }

  const existingUser = await queryOne('SELECT id FROM users LIMIT 1');
  if (existingUser) {
    console.log('Database already initialized. Running incremental upgrade seeds...');
    await ensureAdvancedSeeds();
    return;
  }

  console.log('Seeding fresh database with CSE Department data...');

  // Create sample certificate mock images/files in uploads
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Create mock certificate previews (SVG format saved as cert files for instant rendering)
  const certFiles = [
    {
      name: 'nptel_cloud_computing_elite.svg',
      title: 'NPTEL Elite Certificate - Cloud Computing',
      student: 'Rahul Verma (1RV21CS101)',
      issuer: 'IIT Kharagpur & NPTEL',
      score: '88% (Elite + Silver)',
      date: 'OCTOBER 2024'
    },
    {
      name: 'smart_india_hackathon_finalist.svg',
      title: 'Smart India Hackathon 2024 Finalist',
      student: 'Rahul Verma (1RV21CS101)',
      issuer: 'Ministry of Education Innovation Cell, Govt of India',
      score: 'Top 5 National Finalist (Problem St. AI-402)',
      date: 'DECEMBER 2024'
    },
    {
      name: 'aws_solutions_architect_pending.svg',
      title: 'AWS Certified Solutions Architect - Associate',
      student: 'Rahul Verma (1RV21CS101)',
      issuer: 'Amazon Web Services Training & Certification',
      score: 'Score: 840 / 1000 - PASS',
      date: 'JANUARY 2025'
    },
    {
      name: 'internship_microsoft_fellow.svg',
      title: 'Summer Research Internship Completion Letter',
      student: 'Rahul Verma (1RV21CS101)',
      issuer: 'Microsoft Research India - Systems Lab',
      score: '10 Weeks Research Fellowship (Grade A)',
      date: 'JULY 2024'
    },
    {
      name: 'priya_iee_paper.svg',
      title: 'IEEE International Conference Paper Presentation',
      student: 'Priya Patel (1RV21CS102)',
      issuer: 'IEEE Computer Society Bangalore Chapter',
      score: 'Best Student Paper Award (Track 2)',
      date: 'NOVEMBER 2024'
    },
    {
      name: 'amit_inter_univ_sports.svg',
      title: 'All India Inter-University Badminton Championship',
      student: 'Amit Kumar (1RV21CS105)',
      issuer: 'Association of Indian Universities (AIU)',
      score: 'Gold Medal - Men Singles CSE Team',
      date: 'AUGUST 2024'
    }
  ];

  for (const cert of certFiles) {
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 560" width="100%" height="100%">
        <defs>
          <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ca8a04"/>
            <stop offset="50%" stop-color="#fef08a"/>
            <stop offset="100%" stop-color="#a16207"/>
          </linearGradient>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#f8fafc"/>
          </linearGradient>
        </defs>
        <rect width="800" height="560" fill="url(#bgGrad)" stroke="#e2e8f0" stroke-width="2"/>
        <rect x="20" y="20" width="760" height="520" fill="none" stroke="url(#goldBorder)" stroke-width="8" rx="8"/>
        <rect x="34" y="34" width="732" height="492" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="6,4" rx="4"/>
        
        <!-- Header seal -->
        <circle cx="400" cy="85" r="32" fill="#0f172a"/>
        <circle cx="400" cy="85" r="28" fill="none" stroke="#eab308" stroke-width="2"/>
        <polygon points="400,72 405,82 416,84 408,92 410,103 400,97 390,103 392,92 384,84 395,82" fill="#facc15"/>
        
        <text x="400" y="145" font-family="Georgia, serif" font-size="24" font-weight="bold" fill="#0f172a" text-anchor="middle" letter-spacing="2">CERTIFICATE OF ACHIEVEMENT</text>
        <text x="400" y="170" font-family="sans-serif" font-size="12" fill="#64748b" text-anchor="middle" letter-spacing="4">OFFICIAL ACADEMIC & ACTIVITY CREDENTIAL</text>
        
        <line x1="280" y1="185" x2="520" y2="185" stroke="#cbd5e1" stroke-width="1"/>
        
        <text x="400" y="225" font-family="sans-serif" font-size="13" fill="#475569" text-anchor="middle">This is to certify that</text>
        <text x="400" y="265" font-family="Georgia, serif" font-size="26" font-weight="bold" fill="#1e293b" text-anchor="middle">${cert.student}</text>
        
        <text x="400" y="300" font-family="sans-serif" font-size="14" fill="#475569" text-anchor="middle">has successfully fulfilled all requirements for</text>
        <text x="400" y="335" font-family="sans-serif" font-size="18" font-weight="600" fill="#0284c7" text-anchor="middle">${cert.title}</text>
        
        <text x="400" y="375" font-family="sans-serif" font-size="14" fill="#334155" text-anchor="middle">Awarded with distinction: <tspan font-weight="bold" fill="#0f172a">${cert.score}</tspan></text>
        <text x="400" y="405" font-family="sans-serif" font-size="13" fill="#64748b" text-anchor="middle">Issued by: ${cert.issuer}</text>
        
        <!-- Footer Signatures -->
        <line x1="120" y1="480" x2="280" y2="480" stroke="#94a3b8" stroke-width="1"/>
        <text x="200" y="498" font-family="sans-serif" font-size="11" font-weight="600" fill="#334155" text-anchor="middle">AUTHORIZED SIGNATORY</text>
        <text x="200" y="514" font-family="sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${cert.date}</text>
        
        <circle cx="400" cy="475" r="24" fill="#f8fafc" stroke="#ca8a04" stroke-width="2"/>
        <text x="400" y="478" font-family="sans-serif" font-size="8" font-weight="bold" fill="#a16207" text-anchor="middle">VERIFIED</text>
        <text x="400" y="488" font-family="sans-serif" font-size="7" fill="#64748b" text-anchor="middle">OFFICIAL</text>
        
        <line x1="520" y1="480" x2="680" y2="480" stroke="#94a3b8" stroke-width="1"/>
        <text x="600" y="498" font-family="sans-serif" font-size="11" font-weight="600" fill="#334155" text-anchor="middle">CONTROLLER OF EXAMS</text>
        <text x="600" y="514" font-family="sans-serif" font-size="10" fill="#64748b" text-anchor="middle">Credential ID: AIU-${Math.floor(100000 + Math.random() * 900000)}</text>
      </svg>
    `;
    fs.writeFileSync(path.join(uploadsDir, cert.name), svgContent.trim());
  }

  const db = await getDb();

  // 1. Departments
  await db.exec(`
    INSERT INTO departments (id, name, code) VALUES
    ('dept_cse', 'Department of Computer Science & Engineering', 'CSE'),
    ('dept_ise', 'Department of Information Science & Engineering', 'ISE'),
    ('dept_ece', 'Department of Electronics & Communication', 'ECE');
  `);

  // 2. Schema Categories (6 official domains with strict caps)
  await db.exec(`
    INSERT INTO schema_categories (id, name, description, max_cap_points, icon, color) VALUES
    ('cat_cert', 'Technical Certifications', 'NPTEL, Coursera, AWS, Cisco, GCP, Microsoft verified courses', 60, 'Award', '#2563eb'),
    ('cat_comp', 'Hackathons & Competitions', 'National / State level coding contests, ideathons, algorithmic competitions', 60, 'Trophy', '#d97706'),
    ('cat_intern', 'Internships & Industrial Projects', 'Corporate tech internships (min 4 weeks) and R&D lab assistantships', 50, 'Briefcase', '#059669'),
    ('cat_work', 'Workshops & Conferences', 'Hands-on technical bootcamps, IEEE / ACM research workshops, seminars', 40, 'Presentation', '#7c3aed'),
    ('cat_vol', 'Community Service & Volunteering', 'NSS camps, blood drives, coding clubs, rural tech outreach initiatives', 40, 'HeartHandshake', '#dc2626'),
    ('cat_sports', 'Sports, Cultural & Extra-Curricular', 'Inter-university sports, annual cultural fest organizing, debate clubs', 40, 'Activity', '#0891b2');
  `);

  // 3. Centralized HOD Schema Rules (Version 1 baseline)
  await db.exec(`
    INSERT INTO activity_schema (id, category_id, activity_name, base_points, criteria, version, is_active, created_at) VALUES
    ('sch_cert_1', 'cat_cert', 'NPTEL / SWAYAM 12-Week Course (Elite/Gold)', 30, 'Verified e-certificate with proctored exam score >= 75%', 1, 1, '2024-01-15T09:00:00Z'),
    ('sch_cert_2', 'cat_cert', 'NPTEL / Coursera 8-Week Course (Standard Pass)', 20, 'Course completion certificate with graded assignments score >= 70%', 1, 1, '2024-01-15T09:00:00Z'),
    ('sch_cert_3', 'cat_cert', 'Global Industry Certification (AWS, GCP, Azure, Cisco)', 25, 'Official digital badge verification link or official PDF certificate', 1, 1, '2024-01-15T09:00:00Z'),
    ('sch_cert_4', 'cat_cert', 'Short MOOC / 4-Week Technical Course', 10, 'Verified course completion certificate', 1, 1, '2024-01-15T09:00:00Z'),
    
    ('sch_comp_1', 'cat_comp', 'National Level Hackathon - Winner / Top 3 (SIH, etc.)', 40, 'Official certificate of merit and repository/project link', 1, 1, '2024-01-15T09:00:00Z'),
    ('sch_comp_2', 'cat_comp', 'National / State Hackathon Finalist / Participation', 20, 'Participation certificate and prototype verification by mentor', 1, 1, '2024-01-15T09:00:00Z'),
    ('sch_comp_3', 'cat_comp', 'Inter-College Competitive Coding Contest (1st/2nd)', 25, 'Official merit certificate from host institute', 1, 1, '2024-01-15T09:00:00Z'),
    ('sch_comp_4', 'cat_comp', 'University Technical Paper Presentation Winner', 20, 'Published paper copy or presentation certificate', 1, 1, '2024-01-15T09:00:00Z'),

    ('sch_intern_1', 'cat_intern', 'Industry Internship >= 8 Weeks (Registered Company)', 30, 'Company offer letter, completion letter & mentor evaluation report', 1, 1, '2024-01-15T09:00:00Z'),
    ('sch_intern_2', 'cat_intern', 'Industry Internship 4 to 6 Weeks', 20, 'Official completion certificate signed by HR/Tech Lead', 1, 1, '2024-01-15T09:00:00Z'),
    ('sch_intern_3', 'cat_intern', 'Department R&D Lab Research Assistantship', 20, 'Project report endorsed by Faculty Principal Investigator', 1, 1, '2024-01-15T09:00:00Z'),

    ('sch_work_1', 'cat_work', '5-Day Technical Workshop / Boot Camp (Hands-on)', 15, 'Minimum 80% attendance certificate and final mini-project submission', 1, 1, '2024-01-15T09:00:00Z'),
    ('sch_work_2', 'cat_work', '2-Day IEEE / ACM Sponsored Conference Workshop', 10, 'Conference registration receipt and participation certificate', 1, 1, '2024-01-15T09:00:00Z'),
    ('sch_work_3', 'cat_work', '1-Day Expert Guest Lecture / Tech Seminar', 5, 'Verified seminar attendance stamp / digital attendance record', 1, 1, '2024-01-15T09:00:00Z'),

    ('sch_vol_1', 'cat_vol', 'NSS / Red Cross 7-Day Residential Rural Camp', 25, 'Camp completion certificate signed by NSS Program Officer', 1, 1, '2024-01-15T09:00:00Z'),
    ('sch_vol_2', 'cat_vol', 'Technical Student Club Lead / Core Office Bearer', 20, 'Appointment letter and annual activity report endorsed by HOD', 1, 1, '2024-01-15T09:00:00Z'),
    ('sch_vol_3', 'cat_vol', 'Blood Donation Camp / Green Campus Drive Volunteer', 10, 'Official donor card or volunteering commendation letter', 1, 1, '2024-01-15T09:00:00Z'),

    ('sch_sports_1', 'cat_sports', 'All India Inter-University Sports Representation', 30, 'Participation/merit certificate issued by AIU / Sports Council', 1, 1, '2024-01-15T09:00:00Z'),
    ('sch_sports_2', 'cat_sports', 'Inter-College Cultural / Sports Fest Winner', 20, 'Winner certificate with event name and category', 1, 1, '2024-01-15T09:00:00Z'),
    ('sch_sports_3', 'cat_sports', 'Annual College Fest Core Committee Organizer', 15, 'Appreciation certificate signed by Principal/HOD', 1, 1, '2024-01-15T09:00:00Z');
  `);

  // 4. Users (1 HOD, 2 Mentors, 8 Students)
  // Demo password for all: 'demo123' (hash placeholder)
  const defaultHash = '$2a$10$wEepR0.77XwG5cKzB0jL9uvr7fJ1pWl0gQxV4iVf6Fz6xGv.UaYcy';

  await db.exec(`
    INSERT INTO users (id, name, email, password_hash, role, department_id, mentor_id, cgpa, semester, roll_no, avatar) VALUES
        ('usr_hod_1', 'Dr. Rajesh Sharma', 'hod@university.edu', '${defaultHash}', 'hod', 'dept_cse', NULL, NULL, NULL, 'EMP-CSE-001', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
    
    ('usr_mentor_1', 'Prof. Ravi Kumar', 'ravi@university.edu', '${defaultHash}', 'mentor', 'dept_cse', NULL, NULL, NULL, 'EMP-CSE-042', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
    ('usr_mentor_2', 'Prof. Anita Desai', 'anita@university.edu', '${defaultHash}', 'mentor', 'dept_cse', NULL, NULL, NULL, 'EMP-CSE-058', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'),

    -- Students assigned to Prof. Ravi Kumar (usr_mentor_1)
    ('usr_std_1', 'Rahul Verma', 'rahul@university.edu', '${defaultHash}', 'student', 'dept_cse', 'usr_mentor_1', 8.25, 6, '1RV21CS101', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'),
    ('usr_std_2', 'Priya Patel', 'priya@university.edu', '${defaultHash}', 'student', 'dept_cse', 'usr_mentor_1', 8.90, 4, '1RV21CS102', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'),
    ('usr_std_3', 'Rohan Gupta', 'rohan@university.edu', '${defaultHash}', 'student', 'dept_cse', 'usr_mentor_1', 7.60, 6, '1RV21CS103', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'),
    ('usr_std_4', 'Neha Singh', 'neha@university.edu', '${defaultHash}', 'student', 'dept_cse', 'usr_mentor_1', 9.10, 8, '1RV21CS104', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'),

    -- Students assigned to Prof. Anita Desai (usr_mentor_2)
    ('usr_std_5', 'Amit Kumar', 'amit@university.edu', '${defaultHash}', 'student', 'dept_cse', 'usr_mentor_2', 9.45, 8, '1RV21CS105', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'),
    ('usr_std_6', 'Sneha Nair', 'sneha@university.edu', '${defaultHash}', 'student', 'dept_cse', 'usr_mentor_2', 8.40, 6, '1RV21CS106', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80'),
    ('usr_std_7', 'Vikram Rao', 'vikram@university.edu', '${defaultHash}', 'student', 'dept_cse', 'usr_mentor_2', 7.85, 4, '1RV21CS107', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80'),
    ('usr_std_8', 'Ananya Joshi', 'ananya@university.edu', '${defaultHash}', 'student', 'dept_cse', 'usr_mentor_2', 8.60, 2, '1RV21CS108', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
  `);

  // 5. Submissions (With specific semesters mapped)
  await db.exec(`
    INSERT INTO submissions (id, student_id, schema_id, schema_version_snapshot, activity_title, category_id, description, file_url, file_name, file_size, status, points_awarded, semester, mentor_feedback, completion_date, submitted_at, reviewed_at, reviewed_by) VALUES
    ('sub_rahul_1', 'usr_std_1', 'sch_cert_1', 1, 'NPTEL Cloud Computing 12-Week Elite Certification', 'cat_cert', 'Completed 12-week NPTEL course with proctored exam score of 88% (Elite + Silver).', '/uploads/nptel_cloud_computing_elite.svg', 'nptel_cloud_computing_elite.svg', 1048576, 'approved', 30, 5, 'Verified credentials with NPTEL registry. Excellent performance.', '2024-10-18', '2024-10-20T10:30:00Z', '2024-10-22T14:15:00Z', 'usr_mentor_1'),
    ('sub_rahul_2', 'usr_std_1', 'sch_comp_2', 1, 'Smart India Hackathon (SIH 2024) National Finalist', 'cat_comp', 'Built an AI-driven triage system for rural primary healthcare centers.', '/uploads/smart_india_hackathon_finalist.svg', 'smart_india_hackathon_finalist.svg', 2097152, 'approved', 20, 5, 'Verified team submission and prototype demonstration. Commendable effort.', '2024-12-14', '2024-12-16T11:00:00Z', '2024-12-17T09:40:00Z', 'usr_mentor_1'),
    ('sub_rahul_3', 'usr_std_1', 'sch_intern_1', 1, 'Microsoft Research Systems Lab Summer Internship', 'cat_intern', '10 weeks research internship on distributed systems and telemetry parsing.', '/uploads/internship_microsoft_fellow.svg', 'internship_microsoft_fellow.svg', 1572864, 'approved', 30, 4, 'Outstanding project report and supervisor evaluation verified.', '2024-07-28', '2024-08-01T15:20:00Z', '2024-08-03T16:00:00Z', 'usr_mentor_1'),
    ('sub_rahul_4', 'usr_std_1', 'sch_vol_1', 1, 'NSS 7-Day Residential Rural Development Camp', 'cat_vol', 'Led village digital literacy and green computing workshop for high school students.', '/uploads/nptel_cloud_computing_elite.svg', 'nss_camp_certificate.svg', 840000, 'approved', 25, 3, 'Verified by NSS Officer. Great community initiative.', '2024-04-10', '2024-04-12T08:30:00Z', '2024-04-15T11:20:00Z', 'usr_mentor_1'),
    ('sub_rahul_5', 'usr_std_1', 'sch_sports_2', 1, 'Inter-College Cultural Tech Fest Hack Winner', 'cat_sports', 'Won 1st prize in State-level Design Sprint Championship.', '/uploads/smart_india_hackathon_finalist.svg', 'fest_winner.svg', 950000, 'approved', 20, 4, 'Valid certificate verified.', '2024-09-22', '2024-09-25T14:10:00Z', '2024-09-27T10:05:00Z', 'usr_mentor_1'),
    
    -- Rahul's Pending Review Submission (Ready for Mentor Ravi to review live in demo!)
    ('sub_rahul_pending_1', 'usr_std_1', 'sch_cert_3', 1, 'AWS Certified Solutions Architect Associate (SAA-C03)', 'cat_cert', 'Cleared AWS Solutions Architect exam with score 840/1000. Credential ID: AWS-84920481', '/uploads/aws_solutions_architect_pending.svg', 'aws_solutions_architect_pending.svg', 1840000, 'pending', 0, 6, NULL, '2025-01-20', '2025-01-22T09:15:00Z', NULL, NULL),

    -- Priya's submissions (70 approved pts)
    ('sub_priya_1', 'usr_std_2', 'sch_comp_4', 1, 'IEEE Best Student Paper Presentation', 'cat_comp', 'Presented paper on Federated Learning in Healthcare at IEEE Bangalore Section.', '/uploads/priya_iee_paper.svg', 'priya_iee_paper.svg', 1240000, 'approved', 20, 3, 'Verified paper acceptance and presentation certificate.', '2024-11-10', '2024-11-12T16:00:00Z', '2024-11-14T10:00:00Z', 'usr_mentor_1'),
    ('sub_priya_2', 'usr_std_2', 'sch_cert_1', 1, 'NPTEL Deep Learning Specialization (Elite)', 'cat_cert', '12-week course completed with 82% score.', '/uploads/nptel_cloud_computing_elite.svg', 'priya_nptel_dl.svg', 980000, 'approved', 30, 3, 'Elite certificate confirmed.', '2024-10-15', '2024-10-18T12:00:00Z', '2024-10-19T15:30:00Z', 'usr_mentor_1'),
    ('sub_priya_3', 'usr_std_2', 'sch_intern_2', 1, '6-Week Full Stack Internship at Infosys Springboard', 'cat_intern', 'Built REST APIs and frontend dashboard for internal employee tracking.', '/uploads/internship_microsoft_fellow.svg', 'infosys_internship.svg', 1100000, 'approved', 20, 2, 'Verified certificate.', '2024-06-30', '2024-07-05T09:00:00Z', '2024-07-08T11:00:00Z', 'usr_mentor_1'),

    -- Amit's submissions (190 approved pts - Diamond near completion!)
    ('sub_amit_1', 'usr_std_5', 'sch_sports_1', 1, 'All India Inter-University Badminton Gold', 'cat_sports', 'Won gold in national university championship singles.', '/uploads/amit_inter_univ_sports.svg', 'amit_sports_gold.svg', 1600000, 'approved', 30, 7, 'Excellent athletic achievement.', '2024-08-15', '2024-08-18T10:00:00Z', '2024-08-20T14:00:00Z', 'usr_mentor_2'),
    ('sub_amit_2', 'usr_std_5', 'sch_comp_1', 1, 'HackTheNorth 2024 Winner (1st Prize)', 'cat_comp', '1st place out of 200 international teams.', '/uploads/smart_india_hackathon_finalist.svg', 'hackthenorth_winner.svg', 2100000, 'approved', 40, 7, 'Outstanding achievement.', '2024-09-18', '2024-09-20T11:00:00Z', '2024-09-22T09:30:00Z', 'usr_mentor_2'),
    ('sub_amit_3', 'usr_std_5', 'sch_intern_1', 1, 'Google Summer of Code (GSoC) 12-Week Contributor', 'cat_intern', 'Contributed core parser modules to Linux Foundation project.', '/uploads/internship_microsoft_fellow.svg', 'gsoc_completion.svg', 1450000, 'approved', 30, 6, 'GSoC completion verified.', '2024-08-30', '2024-09-02T13:00:00Z', '2024-09-04T15:00:00Z', 'usr_mentor_2'),
    ('sub_amit_4', 'usr_std_5', 'sch_cert_1', 1, 'Coursera Deep Learning Specialization by Andrew Ng', 'cat_cert', 'Completed all 5 deeplearning.ai courses with 95% average.', '/uploads/nptel_cloud_computing_elite.svg', 'dl_specialization.svg', 1300000, 'approved', 30, 5, 'Verified specialization badge.', '2024-05-10', '2024-05-12T14:00:00Z', '2024-05-14T11:00:00Z', 'usr_mentor_2'),
    ('sub_amit_5', 'usr_std_5', 'sch_vol_1', 1, 'NSS Rural Literacy & Health Camp Coordinator', 'cat_vol', 'Served as Lead Coordinator for 10-day NSS camp.', '/uploads/nptel_cloud_computing_elite.svg', 'nss_lead.svg', 900000, 'approved', 25, 4, 'Endorsed by Principal.', '2024-03-20', '2024-03-22T10:00:00Z', '2024-03-25T16:00:00Z', 'usr_mentor_2'),
    ('sub_amit_6', 'usr_std_5', 'sch_vol_2', 1, 'ACM Student Chapter Vice Chair 2023-24', 'cat_vol', 'Organized 12 tech talks and national symposium.', '/uploads/smart_india_hackathon_finalist.svg', 'acm_chair.svg', 880000, 'approved', 20, 4, 'Chapter report verified.', '2024-04-28', '2024-05-01T09:00:00Z', '2024-05-03T10:00:00Z', 'usr_mentor_2'),
    ('sub_amit_7', 'usr_std_5', 'sch_work_1', 1, '5-Day Quantum Computing Hands-On Workshop (IISc)', 'cat_work', 'Hands on Qiskit algorithms and quantum circuit implementation.', '/uploads/nptel_cloud_computing_elite.svg', 'quantum_workshop.svg', 780000, 'approved', 15, 5, 'Verified certificate.', '2024-06-15', '2024-06-18T10:00:00Z', '2024-06-20T12:00:00Z', 'usr_mentor_2');
  `);

  // 6. Schema Change Requests (Pipeline between Mentor & HOD)
  await db.exec(`
    INSERT INTO schema_requests (id, mentor_id, activity_name, category_id, requested_points, approved_points, reason, status, hod_remarks, reviewed_at, created_at) VALUES
    ('req_1', 'usr_mentor_1', 'Certified Kubernetes Administrator (CKA) by Linux Foundation', 'cat_cert', 30, NULL, 'CKA is an intensive proctored hands-on exam that students are pursuing for cloud DevOps roles. Currently we only have generic cloud certifications at 25 points.', 'pending', NULL, NULL, '2025-01-20T14:30:00Z'),
    ('req_2', 'usr_mentor_2', 'Kaggle Grandmaster / Master Competition Tier', 'cat_comp', 35, 30, 'Recognizing high-tier competitive data science rankings alongside standard hackathons.', 'approved', 'Approved with adjusted weightage of 30 points aligned with Category Cap.', '2025-01-10T11:00:00Z', '2025-01-08T09:15:00Z');
  `);

  // 7. Upcoming Department Events & Opportunities
  await db.exec(`
    INSERT INTO events (id, title, category_id, description, potential_points, event_date, venue, registration_link, created_by, created_at) VALUES
    ('evt_1', 'Annual CSE HackSprint 2025: GenAI for Good', 'cat_comp', '36-hour inter-college hackathon focusing on Gemini and multi-modal edge AI solutions.', 30, '2025-03-15', 'CSE Innovation Center, Lab 4', 'https://cse.university.edu/hacksprint2025', 'usr_hod_1', '2025-01-10T10:00:00Z'),
    ('evt_2', '5-Day Hands-on Kubernetes & Microservices Bootcamp', 'cat_work', 'Intensive lab sessions on container orchestration, Istio service mesh, and observability.', 15, '2025-02-20', 'Seminar Hall 2 & Cloud Computing Lab', 'https://cse.university.edu/k8s-bootcamp', 'usr_mentor_1', '2025-01-12T11:30:00Z'),
    ('evt_3', 'IEEE Cyber Security & Threat Intelligence Symposium', 'cat_work', 'National conference featuring industry leaders from Cisco, Palo Alto, and CERT-In.', 10, '2025-03-02', 'Main University Auditorium', 'https://ieee.university.edu/cyber-symp', 'usr_mentor_2', '2025-01-14T09:00:00Z'),
    ('evt_4', 'Rural STEM Outreach & Digital Literacy Drive', 'cat_vol', 'Volunteering drive teaching basic computational thinking to rural government school students.', 15, '2025-02-28', 'Ramanagara District Primary Schools', 'https://nss.university.edu/stem-drive', 'usr_mentor_1', '2025-01-15T15:00:00Z');
  `);

  // 8. Activity Audit Logs
  await db.exec(`
    INSERT INTO activity_logs (id, user_id, action, details, created_at) VALUES
    ('log_1', 'usr_hod_1', 'SYSTEM_INIT', 'CSE Department 200 Activity Points Schema Version 1.0 initialized.', '2024-01-15T09:00:00Z'),
    ('log_2', 'usr_mentor_1', 'SUBMISSION_REVIEWED', 'Approved submission sub_rahul_1 (+30 pts awarded to Rahul Verma).', '2024-10-22T14:15:00Z'),
    ('log_3', 'usr_mentor_1', 'SCHEMA_REQUEST_SUBMITTED', 'Submitted Schema Request for Certified Kubernetes Administrator (CKA).', '2025-01-20T14:30:00Z');
  `);

  // 9. Student Semester Marks (Random / Dummy editable subjects & marks across all students for all 8 semesters)
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

  const studentIds = ['usr_std_1', 'usr_std_2', 'usr_std_3', 'usr_std_4', 'usr_std_5', 'usr_std_6', 'usr_std_7', 'usr_std_8'];
  const allSemesters = [1, 2, 3, 4, 5, 6, 7, 8];

  for (const sId of studentIds) {
    const offset = studentOffsets[sId] ?? 0;
    for (const sem of allSemesters) {
      const generatedMarks = generateRandomStudentMarks(sId, sem, offset);
      for (const sm of generatedMarks) {
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
      }
    }
  }

  await ensureAdvancedSeeds();

  saveDb();
  console.log('Database seeded successfully with all roles, schemas, submissions, events, and student marks!');
}

export async function ensureAdvancedSeeds() {
  const db = await getDb();
  const defaultHash = '$2a$10$wEepR0.77XwG5cKzB0jL9uvr7fJ1pWl0gQxV4iVf6Fz6xGv.UaYcy';

  // 1. Ensure Dr. Pawan Kumar (Dean of Academics & Autonomous Affairs) exists
  const existingDean = await queryOne("SELECT id FROM users WHERE email = 'pawan@university.edu' OR id = 'usr_dean_1'");
  if (!existingDean) {
    await db.exec(`
      INSERT OR REPLACE INTO users (
        id, name, email, password_hash, role, department_id, mentor_id,
        cgpa, semester, roll_no, avatar, phone, bio, designation, office_location
      ) VALUES (
        'usr_dean_1', 'Dr. Pawan Kumar', 'pawan@university.edu', '${defaultHash}', 'dean', 'dept_cse', NULL,
        NULL, NULL, 'EMP-DEAN-001', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
        '+91 98450 11223', 'Dean of Academic Affairs, autonomous curriculum coordinator & university evaluation chair.',
        'Dean (Academic Affairs & Autonomous Curriculum)', 'Administrative Block, Chamber 001'
      );
    `);
  }

  // 2. Ensure Prof. Joylin Mendonca (Department Activity & NBA/NAAC Coordinator) exists
  const existingJoylin = await queryOne("SELECT id FROM users WHERE email = 'joylin@university.edu' OR id = 'usr_coordinator_1'");
  if (!existingJoylin) {
    await db.exec(`
      INSERT OR REPLACE INTO users (
        id, name, email, password_hash, role, department_id, mentor_id,
        cgpa, semester, roll_no, avatar, phone, bio, designation, office_location
      ) VALUES (
        'usr_coordinator_1', 'Prof. Joylin Mendonca', 'joylin@university.edu', '${defaultHash}', 'mentor', 'dept_cse', NULL,
        NULL, NULL, 'EMP-CSE-012', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        '+91 98451 44556', 'Senior Assistant Professor, Department Activity Points Head & Master Accreditation Coordinator.',
        'Activity Points & Accreditation Coordinator', 'Faculty Wing C, Room 302'
      );
    `);
  }

  // 3. Ensure Campus Placement Drives criteria exist
  const existingDrives = await queryOne("SELECT COUNT(*) as count FROM placement_drives");
  if (!existingDrives || existingDrives.count === 0) {
    await db.exec(`
      INSERT INTO placement_drives (id, company_name, role_title, min_cgpa, min_activity_points, max_backlogs, min_tenth_percentage, min_twelfth_percentage, package_lpa, drive_date, category, is_active) VALUES
      ('drv_1', 'Google India', 'Software Development Engineer - I', 8.5, 80, 0, 75.0, 75.0, 34.0, '2025-08-15', 'Tier-1 Product', 1),
      ('drv_2', 'Microsoft IDC', 'Software Engineer (Azure Core & Cloud)', 8.0, 75, 0, 70.0, 70.0, 28.5, '2025-08-28', 'Tier-1 Product', 1),
      ('drv_3', 'Amazon AWS', 'Cloud Systems Support Engineer', 7.5, 70, 0, 70.0, 70.0, 22.0, '2025-09-05', 'Tier-1 Cloud', 1),
      ('drv_4', 'Cisco Systems', 'Network Software Engineer', 7.2, 60, 1, 65.0, 65.0, 18.0, '2025-09-20', 'Core Systems', 1),
      ('drv_5', 'TCS Digital', 'Systems Specialist & AI Engineer', 6.5, 50, 1, 60.0, 60.0, 9.0, '2025-10-10', 'Enterprise Tech', 1),
      ('drv_6', 'Infosys Springboard', 'Specialist Programmer (Power Programmer)', 6.5, 50, 1, 60.0, 60.0, 9.5, '2025-10-15', 'Enterprise Tech', 1);
    `);
  }

  // 4. Ensure 1st Year Induction Rules and Hours requirements in activity_schema
  const existingInduction = await queryOne("SELECT id FROM activity_schema WHERE id = 'sch_induct_1'");
  if (!existingInduction) {
    await db.exec(`
      INSERT OR REPLACE INTO activity_schema (id, category_id, activity_name, base_points, criteria, version, is_active, hours_required, points_per_hour, applicable_year, created_at) VALUES
      ('sch_induct_1', 'cat_vol', '1st Year AICTE Student Induction Program (SIP 3-Week)', 25, 'Mandatory for 1st Year. Full attendance in 3-week induction module, creative arts, and social exposure.', 1, 1, 60, 0.42, 'year_1', '2024-01-15T09:00:00Z'),
      ('sch_induct_2', 'cat_work', '1st Year Universal Human Values (UHV) & Ethics Foundation', 20, 'Mandatory 1st Year course. Peer interaction diary and reflective essay on human values.', 1, 1, 40, 0.50, 'year_1', '2024-01-15T09:00:00Z'),
      ('sch_induct_3', 'cat_sports', '1st Year Physical Fitness & Creative Cultural Exploration', 15, 'Participation in 1st year yoga/sports session and creative arts exhibition.', 1, 1, 30, 0.50, 'year_1', '2024-01-15T09:00:00Z');
    `);
  }

  // Update existing schemas with realistic hours required and year mapping
  await db.exec(`
    UPDATE activity_schema SET hours_required = 45, points_per_hour = 0.67, applicable_year = 'years_2_4' WHERE id = 'sch_cert_1';
    UPDATE activity_schema SET hours_required = 30, points_per_hour = 0.67, applicable_year = 'years_2_4' WHERE id = 'sch_cert_2';
    UPDATE activity_schema SET hours_required = 50, points_per_hour = 0.50, applicable_year = 'years_2_4' WHERE id = 'sch_cert_3';
    UPDATE activity_schema SET hours_required = 40, points_per_hour = 1.00, applicable_year = 'years_2_4' WHERE id = 'sch_comp_1';
    UPDATE activity_schema SET hours_required = 30, points_per_hour = 0.67, applicable_year = 'years_2_4' WHERE id = 'sch_comp_2';
    UPDATE activity_schema SET hours_required = 160, points_per_hour = 0.19, applicable_year = 'years_2_4' WHERE id = 'sch_intern_1';
    UPDATE activity_schema SET hours_required = 80, points_per_hour = 0.25, applicable_year = 'years_2_4' WHERE id = 'sch_intern_2';
    UPDATE activity_schema SET hours_required = 40, points_per_hour = 0.38, applicable_year = 'years_2_4' WHERE id = 'sch_work_1';
    UPDATE activity_schema SET hours_required = 60, points_per_hour = 0.42, applicable_year = 'years_2_4' WHERE id = 'sch_vol_1';
    UPDATE activity_schema SET hours_required = 40, points_per_hour = 0.75, applicable_year = 'years_2_4' WHERE id = 'sch_sports_1';
  `);

  // 5. Update submissions with hours_spent, credential_hash, and qr_code_data
  const allSubmissions = await queryAll<{ id: string; student_id: string; activity_title: string; base_points: number }>(`
    SELECT s.id, s.student_id, s.activity_title, COALESCE(sch.base_points, 20) as base_points
    FROM submissions s
    LEFT JOIN activity_schema sch ON s.schema_id = sch.id
  `);

  for (const sub of allSubmissions) {
    const credHash = `CRD-2025-${sub.id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-8)}`;
    const qrData = `https://creditz.university.edu/verify/${credHash}`;
    const hours = Math.round(Number(sub.base_points) * 2.2);

    const checklist = JSON.stringify({
      student_identity_verified: true,
      accredited_issuer_verified: true,
      minimum_hours_satisfied: true,
      original_seal_and_signature: true,
      verified_timestamp: new Date().toISOString()
    });

    await db.exec(`
      UPDATE submissions
      SET 
        hours_spent = COALESCE(NULLIF(hours_spent, 0), ${hours}),
        credential_hash = COALESCE(credential_hash, '${credHash}'),
        qr_code_data = COALESCE(qr_code_data, '${qrData}'),
        verification_status = COALESCE(verification_status, 'verified'),
        verification_checklist = COALESCE(verification_checklist, '${checklist}')
      WHERE id = '${sub.id}';
    `);
  }

  // 6. Update student_marks with realistic MSE-1 and MSE-2 marks
  const allMarks = await queryAll<{ id: string; student_id: string; theory_marks: number; subject_code: string; subject_name: string }>(`
    SELECT id, student_id, theory_marks, subject_code, subject_name FROM student_marks WHERE mse1_marks = 0 OR mse1_marks IS NULL
  `);

  for (const m of allMarks) {
    // Theory is out of 100, proportion into 30
    const baseMse = Math.round((Number(m.theory_marks) / 100) * 30);
    const mse1 = Math.max(5, Math.min(30, baseMse + Math.floor(Math.random() * 5) - 2));
    const mse2 = Math.max(5, Math.min(30, baseMse + Math.floor(Math.random() * 5) - 2));
    
    // Check if poor performance (< 40% of 30 is < 12 marks)
    const isPoor = (mse1 < 12 || mse2 < 12) ? 1 : 0;

    await db.exec(`
      UPDATE student_marks 
      SET mse1_marks = ${mse1}, mse1_max = 30, mse2_marks = ${mse2}, mse2_max = 30, is_poor_performance = ${isPoor}
      WHERE id = '${m.id}';
    `);
  }

  // Explicitly ensure Rohan Gupta (usr_std_3) has poor performance in Automata Theory / Transform Calculus
  await db.exec(`
    UPDATE student_marks 
    SET mse1_marks = 9, mse2_marks = 10, is_poor_performance = 1
    WHERE student_id = 'usr_std_3' AND (subject_code = '21CS54' OR subject_code = '21CS31');
  `);

  // Ensure Vikram Rao (usr_std_7) has poor performance in Microcontrollers
  await db.exec(`
    UPDATE student_marks 
    SET mse1_marks = 8, mse2_marks = 11, is_poor_performance = 1
    WHERE student_id = 'usr_std_7' AND subject_code = '21CS43';
  `);

  // 7. Seed sample counseling log for poor MSE performance
  const existingCounseling = await queryOne("SELECT id FROM counseling_logs LIMIT 1");
  if (!existingCounseling) {
    await db.exec(`
      INSERT INTO counseling_logs (
        id, mentor_id, student_id, subject_code, subject_name,
        mse_marks, mse_max, reason, counseling_notes, action_plan, status,
        student_acknowledged, created_at
      ) VALUES (
        'csl_seed_1', 'usr_mentor_1', 'usr_std_3', '21CS54', 'Automata Theory and Computability',
        9.0, 30.0, 'Low MSE-1 Score (<40%) in Mathematical Computability',
        'Scholar struggled with Non-Deterministic Finite Automata proofs and pumping lemma questions during MSE-1. Needs concept reinforcement.',
        '1. Attend Tuesday 4 PM remedial problem-solving tutorial in Cabin 204. 2. Solve 5 textbook reduction problems by next Monday. 3. Retest planned next Friday.',
        'open', 0, '2025-01-22T10:15:00Z'
      );
    `);
  }

  // 8. Seed Dean / Coordinator notifications if missing
  const deanNotif = await queryOne("SELECT id FROM notifications WHERE sender_id = 'usr_dean_1' LIMIT 1");
  if (!deanNotif) {
    await db.exec(`
      INSERT INTO notifications (id, sender_id, sender_name, sender_role, recipient_id, recipient_role, category, title, message, meeting_time, meeting_venue, is_read, created_at) VALUES
      ('notif_dean_1', 'usr_dean_1', 'Dr. Pawan Kumar', 'dean', NULL, 'mentor', 'meeting', 'Dean Circular: Direct Logisys ERP University Upload Deadline', 'All Department Mentors and HODs: Please ensure all 200 Activity Points clearances and MSE remedial documentation are exported to Logisys format before the upcoming semester grade audit.', 'Monday, 11:00 AM', 'Dean Boardroom (Main Administrative Tower)', 0, '2025-01-22T08:00:00Z'),
      ('notif_coordinator_1', 'usr_coordinator_1', 'Prof. Joylin Mendonca', 'mentor', NULL, 'mentor', 'meeting', 'Activity Points Master Google Sheet Sync Notice', 'Faculty Mentors: The NAAC / NBA Activity Points master ledger has been synchronized. Please review mentee clearances and placement cutoff requirements.', 'Thursday, 2:30 PM', 'CSE Accreditation Center (Lab 302)', 0, '2025-01-22T08:30:00Z');
    `);
  }

  // 9. Ensure all requested faculty mentors (Dr. Savitha, Prof. Sowmya Ashwath, Sowmya P, Sowmya S, Dr. Pradeep Kanchan, Dr. Sunil Aithal, etc.)
  // and rebalance students so that every mentor gets strictly up to 4-5 mentees!
  const facultyMentors = [
    { id: 'usr_mentor_savitha', name: 'Dr. Savitha', email: 'savitha@university.edu', designation: 'Associate Professor, CSE' },
    { id: 'usr_mentor_sowmya_ashwath', name: 'Prof. Sowmya Ashwath', email: 'sowmya.ashwath@university.edu', designation: 'Assistant Professor, CSE' },
    { id: 'usr_mentor_sowmya_p', name: 'Prof. Sowmya P', email: 'sowmya.p@university.edu', designation: 'Assistant Professor, CSE' },
    { id: 'usr_mentor_sowmya_s', name: 'Prof. Sowmya S', email: 'sowmya.s@university.edu', designation: 'Assistant Professor, CSE' },
    { id: 'usr_mentor_pradeep_kanchan', name: 'Dr. Pradeep Kanchan', email: 'pradeep.kanchan@university.edu', designation: 'Associate Professor, CSE' },
    { id: 'usr_mentor_sunil_aithal', name: 'Dr. Sunil Aithal', email: 'sunil.aithal@university.edu', designation: 'Associate Professor, CSE' },
    { id: 'usr_mentor_guru', name: 'Dr. Guru Prasad', email: 'guruprasad@university.edu', designation: 'Associate Professor, CSE' },
    { id: 'usr_mentor_aishwarya', name: 'Prof. Aishwarya', email: 'aishwarya@university.edu', designation: 'Assistant Professor, CSE' },
    { id: 'usr_mentor_pawan', name: 'Prof. Pawan Kumar', email: 'pawan.faculty@university.edu', designation: 'Assistant Professor, CSE' },
    { id: 'usr_mentor_sannidhan', name: 'Dr. Sannidhan M. S.', email: 'sannidhan@university.edu', designation: 'Professor & Mentor, CSE' },
    { id: 'usr_coordinator_1', name: 'Prof. Joylin Mendonca', email: 'joylin@university.edu', designation: 'Assistant Professor & Coordinator, CSE' },
    { id: 'usr_mentor_1', name: 'Prof. Ravi Kumar', email: 'ravi@university.edu', designation: 'Assistant Professor, CSE' },
    { id: 'usr_mentor_2', name: 'Prof. Anita Desai', email: 'anita@university.edu', designation: 'Assistant Professor, CSE' },
    { id: 'usr_mentor_radhakrishna', name: 'Prof. Radhakrishna Rao', email: 'radhakrishna@university.edu', designation: 'Assistant Professor, CSE' },
    { id: 'usr_mentor_shashank', name: 'Prof. Shashank Shetty', email: 'shashank.shetty@university.edu', designation: 'Assistant Professor, CSE' },
    { id: 'usr_mentor_chinmayee', name: 'Prof. Chinmayee K.', email: 'chinmayee@university.edu', designation: 'Assistant Professor, CSE' },
    { id: 'usr_mentor_sandeep', name: 'Prof. Sandeep Kumar', email: 'sandeep.kumar@university.edu', designation: 'Assistant Professor, CSE' },
    { id: 'usr_mentor_mamatha', name: 'Prof. Mamatha Balipa', email: 'mamatha.balipa@university.edu', designation: 'Assistant Professor, CSE' },
    { id: 'usr_mentor_karthik', name: 'Prof. Karthik Pai', email: 'karthik.pai@university.edu', designation: 'Assistant Professor, CSE' },
    { id: 'usr_mentor_divya', name: 'Prof. Divya Rani', email: 'divya.rani@university.edu', designation: 'Assistant Professor, CSE' },
    { id: 'usr_mentor_puneeth', name: 'Prof. Puneeth R. P.', email: 'puneeth.rp@university.edu', designation: 'Assistant Professor, CSE' },
    { id: 'usr_mentor_venugopala', name: 'Prof. Venugopala Rao', email: 'venugopala@university.edu', designation: 'Assistant Professor, CSE' },
    { id: 'usr_mentor_deepa', name: 'Prof. Deepa Shenoy', email: 'deepa.shenoy@university.edu', designation: 'Assistant Professor, CSE' },
    { id: 'usr_mentor_bhargavi', name: 'Prof. Bhargavi Rao', email: 'bhargavi.rao@university.edu', designation: 'Assistant Professor, CSE' },
  ];

  // Remove obsolete generic record if present
  await db.exec("DELETE FROM users WHERE id = 'usr_mentor_sowmya';");

  for (const m of facultyMentors) {
    const existing = await queryOne('SELECT id FROM users WHERE id = ?', [m.id]);
    if (!existing) {
      await db.exec(`
        INSERT OR REPLACE INTO users (
          id, name, email, password_hash, role, department_id, mentor_id,
          cgpa, semester, roll_no, avatar, phone, bio, designation, office_location
        ) VALUES (
          '${m.id}', '${m.name}', '${m.email}', '${defaultHash}', 'mentor', 'dept_cse', NULL,
          NULL, NULL, 'EMP-CSE-${m.id.slice(-6).toUpperCase().replace(/[^A-Z0-9]/g, '')}',
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
          '+91 9845${Math.floor(100000 + Math.random() * 900000)}',
          'Faculty Mentor, Department of Computer Science & Engineering.',
          '${m.designation}', 'Faculty Wing B, Cabin 204'
        );
      `);
    } else {
      await db.exec(`
        UPDATE users SET 
          name = '${m.name}', 
          email = '${m.email}', 
          role = 'mentor',
          designation = '${m.designation}'
        WHERE id = '${m.id}';
      `);
    }
  }

  // Rebalance students across all faculty mentors so each mentor has strictly 4-5 mentees (never > 5)
  const allStudents = await queryAll<{ id: string; roll_no: string; name: string }>(`
    SELECT id, roll_no, name FROM users 
    WHERE role = 'student'
    ORDER BY 
      CASE 
        WHEN id = 'usr_std_gaurish' THEN 1
        WHEN id = 'usr_std_sampath' THEN 2
        WHEN id = 'usr_std_sharan' THEN 3
        WHEN id = 'usr_std_ronak' THEN 4
        ELSE 5
      END,
      roll_no ASC, name ASC
  `);

  if (allStudents.length > 0 && facultyMentors.length > 0) {
    const totalStudents = allStudents.length;
    const numMentors = facultyMentors.length;
    const remainder = totalStudents % numMentors;
    const mentorQuotas = facultyMentors.map((_, idx) => Math.floor(totalStudents / numMentors) + (idx < remainder ? 1 : 0));
    const mentorCounts = new Array(numMentors).fill(0);

    for (const student of allStudents) {
      let targetMentorIdx = 0;
      let minCount = Infinity;
      for (let m = 0; m < numMentors; m++) {
        if (mentorCounts[m] < mentorQuotas[m] && mentorCounts[m] < minCount) {
          minCount = mentorCounts[m];
          targetMentorIdx = m;
        }
      }
      mentorCounts[targetMentorIdx]++;
      const assignedMentor = facultyMentors[targetMentorIdx];
      await db.exec(`UPDATE users SET mentor_id = '${assignedMentor.id}' WHERE id = '${student.id}';`);
    }

    // Align reviewed_by in submissions to student's mentor
    await db.exec(`
      UPDATE submissions
      SET reviewed_by = (SELECT mentor_id FROM users WHERE users.id = submissions.student_id)
      WHERE student_id IN (SELECT id FROM users WHERE mentor_id IS NOT NULL) AND status = 'approved';
    `);
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase(true)
    .then(() => {
      console.log('Seed completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
