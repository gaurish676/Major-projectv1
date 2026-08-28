import { getDb, saveDb, queryOne } from './database';
import fs from 'fs';
import path from 'path';

export async function seedDatabase() {
  const existingUser = await queryOne('SELECT id FROM users LIMIT 1');
  if (existingUser) {
    console.log('Database already seeded. Skipping initial seeding.');
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
        <text x="400" y="92" font-family="sans-serif" font-size="20" font-weight="bold" fill="#facc15" text-anchor="middle">★</text>
        
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

  // 5. Submissions (Rahul has 125 approved points + 1 pending!)
  await db.exec(`
    INSERT INTO submissions (id, student_id, schema_id, schema_version_snapshot, activity_title, category_id, description, file_url, file_name, file_size, status, points_awarded, mentor_feedback, completion_date, submitted_at, reviewed_at, reviewed_by) VALUES
    ('sub_rahul_1', 'usr_std_1', 'sch_cert_1', 1, 'NPTEL Cloud Computing 12-Week Elite Certification', 'cat_cert', 'Completed 12-week NPTEL course with proctored exam score of 88% (Elite + Silver).', '/uploads/nptel_cloud_computing_elite.svg', 'nptel_cloud_computing_elite.svg', 1048576, 'approved', 30, 'Verified credentials with NPTEL registry. Excellent performance.', '2024-10-18', '2024-10-20T10:30:00Z', '2024-10-22T14:15:00Z', 'usr_mentor_1'),
    ('sub_rahul_2', 'usr_std_1', 'sch_comp_2', 1, 'Smart India Hackathon (SIH 2024) National Finalist', 'cat_comp', 'Built an AI-driven triage system for rural primary healthcare centers.', '/uploads/smart_india_hackathon_finalist.svg', 'smart_india_hackathon_finalist.svg', 2097152, 'approved', 20, 'Verified team submission and prototype demonstration. Commendable effort.', '2024-12-14', '2024-12-16T11:00:00Z', '2024-12-17T09:40:00Z', 'usr_mentor_1'),
    ('sub_rahul_3', 'usr_std_1', 'sch_intern_1', 1, 'Microsoft Research Systems Lab Summer Internship', 'cat_intern', '10 weeks research internship on distributed systems and telemetry parsing.', '/uploads/internship_microsoft_fellow.svg', 'internship_microsoft_fellow.svg', 1572864, 'approved', 30, 'Outstanding project report and supervisor evaluation verified.', '2024-07-28', '2024-08-01T15:20:00Z', '2024-08-03T16:00:00Z', 'usr_mentor_1'),
    ('sub_rahul_4', 'usr_std_1', 'sch_vol_1', 1, 'NSS 7-Day Residential Rural Development Camp', 'cat_vol', 'Led village digital literacy and green computing workshop for high school students.', '/uploads/nptel_cloud_computing_elite.svg', 'nss_camp_certificate.svg', 840000, 'approved', 25, 'Verified by NSS Officer. Great community initiative.', '2024-04-10', '2024-04-12T08:30:00Z', '2024-04-15T11:20:00Z', 'usr_mentor_1'),
    ('sub_rahul_5', 'usr_std_1', 'sch_sports_2', 1, 'Inter-College Cultural Tech Fest Hack Winner', 'cat_sports', 'Won 1st prize in State-level Design Sprint Championship.', '/uploads/smart_india_hackathon_finalist.svg', 'fest_winner.svg', 950000, 'approved', 20, 'Valid certificate verified.', '2024-09-22', '2024-09-25T14:10:00Z', '2024-09-27T10:05:00Z', 'usr_mentor_1'),
    
    -- Rahul's Pending Review Submission (Ready for Mentor Ravi to review live in demo!)
    ('sub_rahul_pending_1', 'usr_std_1', 'sch_cert_3', 1, 'AWS Certified Solutions Architect Associate (SAA-C03)', 'cat_cert', 'Cleared AWS Solutions Architect exam with score 840/1000. Credential ID: AWS-84920481', '/uploads/aws_solutions_architect_pending.svg', 'aws_solutions_architect_pending.svg', 1840000, 'pending', 0, NULL, '2025-01-20', '2025-01-22T09:15:00Z', NULL, NULL),

    -- Priya's submissions (70 approved pts)
    ('sub_priya_1', 'usr_std_2', 'sch_comp_4', 1, 'IEEE Best Student Paper Presentation', 'cat_comp', 'Presented paper on Federated Learning in Healthcare at IEEE Bangalore Section.', '/uploads/priya_iee_paper.svg', 'priya_iee_paper.svg', 1240000, 'approved', 20, 'Verified paper acceptance and presentation certificate.', '2024-11-10', '2024-11-12T16:00:00Z', '2024-11-14T10:00:00Z', 'usr_mentor_1'),
    ('sub_priya_2', 'usr_std_2', 'sch_cert_1', 1, 'NPTEL Deep Learning Specialization (Elite)', 'cat_cert', '12-week course completed with 82% score.', '/uploads/nptel_cloud_computing_elite.svg', 'priya_nptel_dl.svg', 980000, 'approved', 30, 'Elite certificate confirmed.', '2024-10-15', '2024-10-18T12:00:00Z', '2024-10-19T15:30:00Z', 'usr_mentor_1'),
    ('sub_priya_3', 'usr_std_2', 'sch_intern_2', 1, '6-Week Full Stack Internship at Infosys Springboard', 'cat_intern', 'Built REST APIs and frontend dashboard for internal employee tracking.', '/uploads/internship_microsoft_fellow.svg', 'infosys_internship.svg', 1100000, 'approved', 20, 'Verified certificate.', '2024-06-30', '2024-07-05T09:00:00Z', '2024-07-08T11:00:00Z', 'usr_mentor_1'),

    -- Amit's submissions (190 approved pts - Diamond near completion!)
    ('sub_amit_1', 'usr_std_5', 'sch_sports_1', 1, 'All India Inter-University Badminton Gold', 'cat_sports', 'Won gold in national university championship singles.', '/uploads/amit_inter_univ_sports.svg', 'amit_sports_gold.svg', 1600000, 'approved', 30, 'Excellent athletic achievement.', '2024-08-15', '2024-08-18T10:00:00Z', '2024-08-20T14:00:00Z', 'usr_mentor_2'),
    ('sub_amit_2', 'usr_std_5', 'sch_comp_1', 1, 'HackTheNorth 2024 Winner (1st Prize)', 'cat_comp', '1st place out of 200 international teams.', '/uploads/smart_india_hackathon_finalist.svg', 'hackthenorth_winner.svg', 2100000, 'approved', 40, 'Outstanding achievement.', '2024-09-18', '2024-09-20T11:00:00Z', '2024-09-22T09:30:00Z', 'usr_mentor_2'),
    ('sub_amit_3', 'usr_std_5', 'sch_intern_1', 1, 'Google Summer of Code (GSoC) 12-Week Contributor', 'cat_intern', 'Contributed core parser modules to Linux Foundation project.', '/uploads/internship_microsoft_fellow.svg', 'gsoc_completion.svg', 1450000, 'approved', 30, 'GSoC completion verified.', '2024-08-30', '2024-09-02T13:00:00Z', '2024-09-04T15:00:00Z', 'usr_mentor_2'),
    ('sub_amit_4', 'usr_std_5', 'sch_cert_1', 1, 'Coursera Deep Learning Specialization by Andrew Ng', 'cat_cert', 'Completed all 5 deeplearning.ai courses with 95% average.', '/uploads/nptel_cloud_computing_elite.svg', 'dl_specialization.svg', 1300000, 'approved', 30, 'Verified specialization badge.', '2024-05-10', '2024-05-12T14:00:00Z', '2024-05-14T11:00:00Z', 'usr_mentor_2'),
    ('sub_amit_5', 'usr_std_5', 'sch_vol_1', 1, 'NSS Rural Literacy & Health Camp Coordinator', 'cat_vol', 'Served as Lead Coordinator for 10-day NSS camp.', '/uploads/nptel_cloud_computing_elite.svg', 'nss_lead.svg', 900000, 'approved', 25, 'Endorsed by Principal.', '2024-03-20', '2024-03-22T10:00:00Z', '2024-03-25T16:00:00Z', 'usr_mentor_2'),
    ('sub_amit_6', 'usr_std_5', 'sch_vol_2', 1, 'ACM Student Chapter Vice Chair 2023-24', 'cat_vol', 'Organized 12 tech talks and national symposium.', '/uploads/smart_india_hackathon_finalist.svg', 'acm_chair.svg', 880000, 'approved', 20, 'Chapter report verified.', '2024-04-28', '2024-05-01T09:00:00Z', '2024-05-03T10:00:00Z', 'usr_mentor_2'),
    ('sub_amit_7', 'usr_std_5', 'sch_work_1', 1, '5-Day Quantum Computing Hands-On Workshop (IISc)', 'cat_work', 'Hands on Qiskit algorithms and quantum circuit implementation.', '/uploads/nptel_cloud_computing_elite.svg', 'quantum_workshop.svg', 780000, 'approved', 15, 'Verified certificate.', '2024-06-15', '2024-06-18T10:00:00Z', '2024-06-20T12:00:00Z', 'usr_mentor_2');
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

  saveDb();
  console.log('Database seeded successfully with all roles, schemas, submissions, and events!');
}
