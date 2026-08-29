export interface CurriculumSubjectTemplate {
  code: string;
  name: string;
  credits: number;
  theory: number;
  theoryMax: number;
  task: number;
  taskMax: number;
  hasLab: boolean;
  lab: number;
  labMax: number;
}

export const SEMESTER_CURRICULUM: Record<number, CurriculumSubjectTemplate[]> = {
  1: [
    { code: '21MAT11', name: 'Calculus and Linear Algebra', credits: 4, theory: 78, theoryMax: 100, task: 21, taskMax: 25, hasLab: false, lab: 0, labMax: 0 },
    { code: '21PHY12', name: 'Engineering Physics & Optics', credits: 4, theory: 82, theoryMax: 100, task: 22, taskMax: 25, hasLab: true, lab: 45, labMax: 50 },
    { code: '21ELE13', name: 'Basic Electrical & Electronics', credits: 3, theory: 75, theoryMax: 100, task: 20, taskMax: 25, hasLab: false, lab: 0, labMax: 0 },
    { code: '21CIV14', name: 'Elements of Civil Engineering & Mechanics', credits: 3, theory: 72, theoryMax: 100, task: 19, taskMax: 25, hasLab: false, lab: 0, labMax: 0 },
    { code: '21CSL15', name: 'C Programming & Problem Solving Lab', credits: 2, theory: 0, theoryMax: 0, task: 24, taskMax: 25, hasLab: true, lab: 48, labMax: 50 },
  ],
  2: [
    { code: '21MAT21', name: 'Advanced Calculus & Differential Equations', credits: 4, theory: 80, theoryMax: 100, task: 22, taskMax: 25, hasLab: false, lab: 0, labMax: 0 },
    { code: '21CHE22', name: 'Engineering Chemistry & Materials Science', credits: 4, theory: 76, theoryMax: 100, task: 21, taskMax: 25, hasLab: true, lab: 44, labMax: 50 },
    { code: '21CS23', name: 'Problem Solving Using Python', credits: 3, theory: 88, theoryMax: 100, task: 24, taskMax: 25, hasLab: true, lab: 48, labMax: 50 },
    { code: '21ENG24', name: 'Professional English & Technical Writing', credits: 2, theory: 85, theoryMax: 100, task: 23, taskMax: 25, hasLab: false, lab: 0, labMax: 0 },
    { code: '21EEL25', name: 'Basic Electronics & IoT Workshop', credits: 2, theory: 0, theoryMax: 0, task: 23, taskMax: 25, hasLab: true, lab: 46, labMax: 50 },
  ],
  3: [
    { code: '21CS31', name: 'Transform Calculus & Numerical Methods', credits: 3, theory: 74, theoryMax: 100, task: 20, taskMax: 25, hasLab: false, lab: 0, labMax: 0 },
    { code: '21CS32', name: 'Data Structures and Applications', credits: 4, theory: 86, theoryMax: 100, task: 24, taskMax: 25, hasLab: true, lab: 47, labMax: 50 },
    { code: '21CS33', name: 'Analog and Digital Electronics', credits: 3, theory: 79, theoryMax: 100, task: 21, taskMax: 25, hasLab: true, lab: 42, labMax: 50 },
    { code: '21CS34', name: 'Computer Organization & Architecture', credits: 3, theory: 82, theoryMax: 100, task: 22, taskMax: 25, hasLab: false, lab: 0, labMax: 0 },
    { code: '21CS35', name: 'Object-Oriented Programming with Java', credits: 3, theory: 89, theoryMax: 100, task: 24, taskMax: 25, hasLab: true, lab: 48, labMax: 50 },
    { code: '21CSL36', name: 'Data Structures & OOP Laboratory', credits: 2, theory: 0, theoryMax: 0, task: 25, taskMax: 25, hasLab: true, lab: 49, labMax: 50 },
  ],
  4: [
    { code: '21CS41', name: 'Design and Analysis of Algorithms', credits: 4, theory: 91, theoryMax: 100, task: 24, taskMax: 25, hasLab: true, lab: 48, labMax: 50 },
    { code: '21CS42', name: 'Operating Systems & System Programming', credits: 4, theory: 87, theoryMax: 100, task: 23, taskMax: 25, hasLab: true, lab: 45, labMax: 50 },
    { code: '21CS43', name: 'Microcontrollers & Embedded Systems', credits: 3, theory: 80, theoryMax: 100, task: 21, taskMax: 25, hasLab: true, lab: 44, labMax: 50 },
    { code: '21CS44', name: 'Complex Analysis, Probability & Statistics', credits: 3, theory: 83, theoryMax: 100, task: 22, taskMax: 25, hasLab: false, lab: 0, labMax: 0 },
    { code: '21CS45', name: 'Universal Human Values & Professional Ethics', credits: 1, theory: 90, theoryMax: 100, task: 24, taskMax: 25, hasLab: false, lab: 0, labMax: 0 },
    { code: '21CSL46', name: 'Algorithms & OS Simulation Lab', credits: 2, theory: 0, theoryMax: 0, task: 24, taskMax: 25, hasLab: true, lab: 48, labMax: 50 },
  ],
  5: [
    { code: '21CS51', name: 'Management, Entrepreneurship & Cyber Law', credits: 3, theory: 81, theoryMax: 100, task: 22, taskMax: 25, hasLab: false, lab: 0, labMax: 0 },
    { code: '21CS52', name: 'Computer Networks & Security Protocols', credits: 4, theory: 85, theoryMax: 100, task: 23, taskMax: 25, hasLab: true, lab: 46, labMax: 50 },
    { code: '21CS53', name: 'Database Management Systems & SQL', credits: 4, theory: 89, theoryMax: 100, task: 24, taskMax: 25, hasLab: true, lab: 47, labMax: 50 },
    { code: '21CS54', name: 'Automata Theory and Computability', credits: 3, theory: 78, theoryMax: 100, task: 20, taskMax: 25, hasLab: false, lab: 0, labMax: 0 },
    { code: '21CS55', name: 'Python for Data Analytics & Visualization', credits: 3, theory: 92, theoryMax: 100, task: 25, taskMax: 25, hasLab: true, lab: 48, labMax: 50 },
    { code: '21CSL56', name: 'DBMS and Network Programming Lab', credits: 2, theory: 0, theoryMax: 0, task: 24, taskMax: 25, hasLab: true, lab: 49, labMax: 50 },
  ],
  6: [
    { code: '21CS61', name: 'Software Architecture & Design Patterns', credits: 4, theory: 84, theoryMax: 100, task: 23, taskMax: 25, hasLab: false, lab: 0, labMax: 0 },
    { code: '21CS62', name: 'Full Stack Web Development & Cloud', credits: 4, theory: 88, theoryMax: 100, task: 24, taskMax: 25, hasLab: true, lab: 47, labMax: 50 },
    { code: '21CS63', name: 'Artificial Intelligence & Machine Learning', credits: 4, theory: 86, theoryMax: 100, task: 23, taskMax: 25, hasLab: true, lab: 46, labMax: 50 },
    { code: '21CS64', name: 'Compiler Design & Optimization', credits: 3, theory: 76, theoryMax: 100, task: 20, taskMax: 25, hasLab: false, lab: 0, labMax: 0 },
    { code: '21CS65', name: 'Cloud Computing & Virtualization', credits: 3, theory: 90, theoryMax: 100, task: 24, taskMax: 25, hasLab: false, lab: 0, labMax: 0 },
    { code: '21CSL66', name: 'AI and Full Stack Web Technologies Lab', credits: 2, theory: 0, theoryMax: 0, task: 25, taskMax: 25, hasLab: true, lab: 49, labMax: 50 },
  ],
  7: [
    { code: '21CS71', name: 'Big Data Analytics & Distributed Systems', credits: 4, theory: 85, theoryMax: 100, task: 23, taskMax: 25, hasLab: true, lab: 46, labMax: 50 },
    { code: '21CS72', name: 'Information and Cyber Network Security', credits: 4, theory: 88, theoryMax: 100, task: 24, taskMax: 25, hasLab: true, lab: 45, labMax: 50 },
    { code: '21CS73', name: 'Internet of Things (IoT) & Edge Computing', credits: 3, theory: 82, theoryMax: 100, task: 22, taskMax: 25, hasLab: true, lab: 44, labMax: 50 },
    { code: '21CS74', name: 'Natural Language Processing & LLMs', credits: 3, theory: 91, theoryMax: 100, task: 25, taskMax: 25, hasLab: false, lab: 0, labMax: 0 },
    { code: '21CSP75', name: 'Major Capstone Project Phase - 1 & Seminar', credits: 3, theory: 0, theoryMax: 0, task: 25, taskMax: 25, hasLab: true, lab: 48, labMax: 50 },
  ],
  8: [
    { code: '21CS81', name: 'High Performance Computing (HPC) & GPU Architectures', credits: 3, theory: 86, theoryMax: 100, task: 23, taskMax: 25, hasLab: false, lab: 0, labMax: 0 },
    { code: '21CS82', name: 'Blockchain Technologies & Decentralized Apps', credits: 3, theory: 89, theoryMax: 100, task: 24, taskMax: 25, hasLab: false, lab: 0, labMax: 0 },
    { code: '21CSP83', name: 'Major Capstone Project Phase - 2 & Viva Voce', credits: 8, theory: 0, theoryMax: 0, task: 25, taskMax: 25, hasLab: true, lab: 96, labMax: 100 },
    { code: '21CSI84', name: 'Full Semester Industry Internship', credits: 4, theory: 0, theoryMax: 0, task: 25, taskMax: 25, hasLab: true, lab: 49, labMax: 50 },
  ],
};

export function getSubjectsForSemester(sem: number): CurriculumSubjectTemplate[] {
  return SEMESTER_CURRICULUM[sem] || SEMESTER_CURRICULUM[6];
}

export function generateRandomStudentMarks(
  studentId: string,
  sem: number,
  basePerformanceOffset: number = 0 // between -15 to +10 to give student personal variance
) {
  const templates = getSubjectsForSemester(sem);
  const now = new Date().toISOString();

  return templates.map((tmpl, idx) => {
    // Apply realistic random jitter per subject
    const jitter = Math.floor(Math.random() * 9) - 4; // -4 to +4
    const totalOffset = basePerformanceOffset + jitter;

    let theory = tmpl.theory;
    if (tmpl.theoryMax > 0) {
      theory = Math.min(tmpl.theoryMax, Math.max(35, tmpl.theory + totalOffset));
    }

    let task = tmpl.task;
    if (tmpl.taskMax > 0) {
      task = Math.min(tmpl.taskMax, Math.max(14, tmpl.task + Math.round(totalOffset * 0.15)));
    }

    let lab = tmpl.lab;
    if (tmpl.hasLab && tmpl.labMax > 0) {
      lab = Math.min(tmpl.labMax, Math.max(25, tmpl.lab + Math.round(totalOffset * 0.3)));
    }

    const totalScored = theory + task + (tmpl.hasLab ? lab : 0);
    const totalMax = tmpl.theoryMax + tmpl.taskMax + (tmpl.hasLab ? tmpl.labMax : 0);
    const percentage = totalMax > 0 ? Math.round((totalScored / totalMax) * 1000) / 10 : 0;
    
    let grade = 'B+';
    let grade_points = 7;
    if (percentage >= 90) { grade = 'O'; grade_points = 10; }
    else if (percentage >= 80) { grade = 'A+'; grade_points = 9; }
    else if (percentage >= 70) { grade = 'A'; grade_points = 8; }
    else if (percentage >= 60) { grade = 'B+'; grade_points = 7; }
    else if (percentage >= 50) { grade = 'B'; grade_points = 6; }
    else if (percentage >= 40) { grade = 'C'; grade_points = 5; }
    else { grade = 'F'; grade_points = 0; }

    return {
      id: `sm_${studentId}_s${sem}_${idx + 1}_${Math.random().toString(36).substring(2, 6)}`,
      student_id: studentId,
      semester: sem,
      subject_code: tmpl.code,
      subject_name: tmpl.name,
      credits: tmpl.credits,
      theory_marks: theory,
      theory_max: tmpl.theoryMax,
      task_marks: task,
      task_max: tmpl.taskMax,
      has_lab: tmpl.hasLab ? 1 : 0,
      lab_marks: tmpl.hasLab ? lab : 0,
      lab_max: tmpl.hasLab ? tmpl.labMax : 0,
      grade,
      grade_points,
      created_at: now,
      updated_at: now,
    };
  });
}
