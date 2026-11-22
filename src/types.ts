export type UserRole = 'hod' | 'mentor' | 'student' | 'dean';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department_id: string;
  department_name?: string;
  department_code?: string;
  mentor_id?: string | null;
  mentor_name?: string | null;
  cgpa?: number | null;
  semester?: number | null;
  roll_no?: string | null;
  avatar?: string;
  phone?: string | null;
  bio?: string | null;
  designation?: string | null;
  office_location?: string | null;
  tenth_percentage?: number | null;
  tenth_board?: string | null;
  tenth_year?: number | null;
  twelfth_percentage?: number | null;
  twelfth_board?: string | null;
  twelfth_year?: number | null;
  diploma_or_pu?: 'puc' | 'diploma' | string | null;
  total_points?: number;
  approved_count?: number;
  pending_count?: number;
}

export interface StudentCreditReportData {
  student: User;
  points_summary: {
    total_effective_points: number;
    raw_total_points: number;
    semester_capped_points: number;
    total_excess_points: number;
    semester_limit_per_semester: number;
    target_points: number;
    progress_percentage: number;
    milestone_tier: 'Not Started' | 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
    is_cleared: boolean;
  };
  categories_breakdown: any[];
  semester_breakdown: any[];
  year_breakdown: any[];
  submissions: Submission[];
  academic_summary: {
    total_subjects: number;
    total_credits: number;
    cumulative_sgpa: number;
  };
  verification_id: string;
  institution: {
    name: string;
    accreditation: string;
    department: string;
  };
  generated_at: string;
}


export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface SchemaCategory {
  id: string;
  name: string;
  description: string;
  max_cap_points: number;
  icon: string;
  color: string;
  earned_points?: number;
  rules_count?: number;
}

export interface SchemaRule {
  id: string;
  category_id: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  activity_name: string;
  base_points: number;
  criteria: string;
  version: number;
  is_active: number | boolean;
  hours_required?: number;
  points_per_hour?: number;
  applicable_year?: 'year_1' | 'years_2_4' | 'all' | string;
  max_per_year?: number;
  created_at: string;
  updated_at?: string;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface SchemaRequest {
  id: string;
  mentor_id: string;
  mentor_name?: string;
  mentor_email?: string;
  activity_name: string;
  category_id: string;
  category_name?: string;
  requested_points: number;
  approved_points?: number | null;
  reason: string;
  status: RequestStatus;
  hod_remarks?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

export interface DuplicateInfo {
  type: 'self' | 'collusion' | 'credential_id';
  original_submission_id?: string;
  activity_title?: string;
  submitted_at?: string;
  status?: string;
  student_name?: string;
  student_roll_no?: string;
  certificate_id?: string;
  message: string;
}

export interface AIAuditResult {
  student_name?: string;
  certificate_title?: string;
  issuing_organization?: string;
  issue_date?: string;
  certificate_id?: string | null;
  category_id?: string;
  category_name?: string;
  recommended_points?: number;
  confidence_score?: number;
  authenticity_status?: 'VERIFIED' | 'SUSPICIOUS' | 'INCONCLUSIVE';
  authenticity_notes?: string;
  audit_summary?: string;
  anomalies_detected?: string[];
  duplicate_credential_info?: DuplicateInfo;
  audited_at?: string;
  model_used?: string;
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface Submission {
  id: string;
  student_id: string;
  student_name?: string;
  student_roll_no?: string;
  student_semester?: number;
  student_cgpa?: number;
  mentor_id?: string;
  mentor_name?: string;
  schema_id: string;
  schema_activity_name?: string;
  schema_version_snapshot: number;
  activity_title: string;
  category_id: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  description: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_hash?: string;
  status: SubmissionStatus;
  points_awarded: number;
  semester?: number;
  base_points?: number;
  hours_spent?: number;
  credential_hash?: string;
  qr_code_data?: string;
  verification_status?: 'verified' | 'suspicious' | 'pending';
  verification_checklist?: string | Record<string, boolean>;
  mentor_feedback?: string | null;
  ai_audit_results?: string | AIAuditResult | null;
  completion_date: string;
  submitted_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  reviewer_name?: string | null;
}

export interface DepartmentEvent {
  id: string;
  title: string;
  category_id: string;
  category_name?: string;
  description: string;
  potential_points: number;
  event_date: string;
  venue: string;
  registration_link?: string;
  created_by: string;
  created_at: string;
}

export interface SubjectMark {
  id: string;
  student_id: string;
  semester: number;
  subject_code?: string;
  subject_name: string;
  credits: number;
  theory_marks: number;
  theory_max: number;
  task_marks: number;
  task_max: number;
  mse1_marks?: number;
  mse1_max?: number;
  mse2_marks?: number;
  mse2_max?: number;
  is_poor_performance?: number | boolean;
  has_lab: boolean | number;
  lab_marks: number;
  lab_max: number;
  total_scored: number;
  total_max: number;
  percentage: number;
  grade: string;
  grade_points: number;
  created_at?: string;
  updated_at?: string;
}

export interface MarksSummary {
  total_subjects: number;
  total_credits: number;
  total_scored: number;
  total_max: number;
  overall_percentage: number;
  sgpa: number;
}

export interface MarksResponse {
  marks: SubjectMark[];
  summary: MarksSummary;
}

export interface SemesterBreakdown {
  semester: number;
  earned_raw_points: number;
  effective_points: number;
  max_credit_limit: number;
  excess_points: number;
  is_capped: boolean;
  submissions_count: number;
  percentage_of_limit: number;
}

export interface YearBreakdown {
  year: number;
  semesters: number[];
  earned_raw_points: number;
  effective_points: number;
  max_credit_limit: number;
  excess_points: number;
  submissions_count: number;
}

export interface StudentDashboardStats {
  student: User;
  total_points: number;
  raw_total_points?: number;
  semester_capped_points?: number;
  total_excess_points?: number;
  semester_limit_per_semester?: number;
  target_points: number;
  progress_percentage: number;
  milestone_tier: 'Not Started' | 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  cgpa: number;
  semester: number;
  approved_submissions_count: number;
  pending_submissions_count: number;
  rejected_submissions_count: number;
  categories_breakdown: Array<{
    id: string;
    name: string;
    max_cap_points: number;
    earned_points: number;
    capped_points: number;
    icon: string;
    color: string;
    submissions_count: number;
  }>;
  semester_breakdown?: SemesterBreakdown[];
  year_breakdown?: YearBreakdown[];
  recent_submissions: Submission[];
  upcoming_events: DepartmentEvent[];
}

export interface MentorDashboardStats {
  mentor: User;
  mentees_count: number;
  pending_reviews_count: number;
  approved_reviews_count: number;
  total_submissions_reviewed: number;
  avg_mentee_points: number;
  mentees: Array<User & { approved_points: number; pending_points: number; completed_percentage: number }>;
  pending_submissions: Submission[];
  recent_requests: SchemaRequest[];
}

export interface HODDashboardStats {
  hod: User;
  total_students: number;
  total_mentors: number;
  avg_department_points: number;
  target_completion_rate: number;
  pending_schema_requests_count: number;
  total_pending_verifications: number;
  category_distribution: Array<{
    category_id: string;
    category_name: string;
    total_points_awarded: number;
    submissions_count: number;
    color: string;
  }>;
  milestone_distribution: {
    diamond: number; // 200 pts
    gold: number;    // 150-199 pts
    silver: number;  // 100-149 pts
    bronze: number;  // 50-99 pts
    started: number; // 1-49 pts
    none: number;    // 0 pts
  };
  mentors_performance: Array<{
    mentor_id: string;
    mentor_name: string;
    mentee_count: number;
    avg_mentee_points: number;
    pending_reviews: number;
    approved_reviews: number;
  }>;
  pending_schema_requests: SchemaRequest[];
}

export interface StudentMark {
  id: string;
  student_id: string;
  student_name?: string;
  student_roll_no?: string;
  semester: number;
  subject_code: string;
  subject_name: string;
  credits: number;
  theory_marks: number;
  theory_max: number;
  task_marks: number;
  task_max: number;
  mse1_marks?: number;
  mse1_max?: number;
  mse2_marks?: number;
  mse2_max?: number;
  is_poor_performance?: number | boolean;
  has_lab: boolean | number;
  lab_marks: number;
  lab_max: number;
  total_scored: number;
  total_max: number;
  percentage: number;
  grade: string;
  grade_points: number;
  created_at?: string;
  updated_at?: string;
}

export interface SemesterMarksSummary {
  semester: number;
  total_subjects: number;
  total_credits: number;
  total_scored: number;
  total_max: number;
  percentage: number;
  sgpa: number;
  subjects: StudentMark[];
}

export interface MentorStudentMarksData {
  mentees: Array<User & {
    semesters_recorded: number[];
    total_subjects_count: number;
    has_marks_data: boolean;
  }>;
  selected_student: User | null;
  semester_summaries: SemesterMarksSummary[];
  overall_cgpa: number;
  all_marks: StudentMark[];
}

// Knowledge Graph Entities & Edges
export type GraphEntityType = 
  | 'Student'
  | 'Faculty'
  | 'Department'
  | 'Activity'
  | 'Certificate'
  | 'Organization'
  | 'Category'
  | 'Skill'
  | 'Semester'
  | 'Rule';

export type GraphRelationType =
  | 'BELONGS_TO'
  | 'MENTORED_BY'
  | 'COMPLETED'
  | 'SUBMITTED'
  | 'HAS_CATEGORY'
  | 'ISSUED_BY'
  | 'DEVELOPS'
  | 'OCCURRED_IN'
  | 'AWARDS'
  | 'PROVES'
  | 'REQUIRES'
  | 'RELATED_TO';

export interface GraphNode {
  id: string;
  label: string;
  type: GraphEntityType;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: GraphRelationType;
  properties?: Record<string, any>;
}

export interface CategoryHeadroomInfo {
  category_id: string;
  category_name: string;
  earned: number;
  cap: number;
  headroom: number;
  status: 'CAPPED' | 'IN_PROGRESS' | 'NOT_STARTED';
}

export interface GraphEvidence {
  student_id: string;
  student_name: string;
  department_name?: string;
  mentor_name?: string;
  current_points: number;
  target_points: number;
  remaining_points: number;
  progress_percentage: number;
  current_semester: number;
  semester_headroom: number;
  milestone_tier: string;
  category_headroom: CategoryHeadroomInfo[];
  completed_activities_count: number;
  pending_activities_count: number;
  eligible_activities_count: number;
  skills_developed: string[];
  skills_recommended: string[];
  completed_activities_list: Array<{
    id: string;
    title: string;
    category_name: string;
    points: number;
    semester: number;
    proof?: string;
  }>;
  eligible_activities_list: Array<{
    id: string;
    title: string;
    category_name: string;
    base_points: number;
    source: 'catalog' | 'event';
    venue_or_criteria?: string;
  }>;
}

export interface GraphRAGAdvisorResponse {
  student_id: string;
  query: string;
  graph_evidence: GraphEvidence;
  advice: {
    summary: string;
    target_plan: string;
    category_strategy: string[];
    recommended_activities: Array<{
      id: string;
      title: string;
      category_name: string;
      base_points: number;
      source: 'catalog' | 'event';
      venue_or_criteria?: string;
    }>;
    semester_guidance: string;
  };
  is_graph_rag: boolean;
  generated_at: string;
  model_used: string;
}

export interface PlacementDrive {
  id: string;
  company_name: string;
  role_title: string;
  min_cgpa: number;
  min_activity_points: number;
  max_backlogs: number;
  min_tenth_percentage?: number;
  min_twelfth_percentage?: number;
  package_lpa: number;
  drive_date: string;
  category: string;
  is_active: number;
}

export interface MenteePlacementEligibility {
  student_id: string;
  student_name: string;
  student_roll_no: string;
  cgpa: number;
  approved_points: number;
  semester: number;
  tenth_percentage?: number | null;
  tenth_board?: string | null;
  tenth_year?: number | null;
  twelfth_percentage?: number | null;
  twelfth_board?: string | null;
  twelfth_year?: number | null;
  diploma_or_pu?: string | null;
  active_backlogs?: number;
  company_status: Array<{
    company_id: string;
    company_name: string;
    role_title: string;
    package_lpa: number;
    min_cgpa?: number;
    min_activity_points?: number;
    min_tenth_percentage?: number;
    min_twelfth_percentage?: number;
    max_backlogs?: number;
    is_eligible: boolean;
    cgpa_eligible: boolean;
    points_eligible: boolean;
    backlogs_eligible?: boolean;
    tenth_eligible?: boolean;
    twelfth_eligible?: boolean;
    has_prior_marks?: boolean;
    active_backlogs?: number;
    missing_points: number;
    missing_cgpa: number;
    missing_tenth?: number;
    missing_twelfth?: number;
    status_label: 'Eligible' | 'Short of Points' | 'Short of CGPA' | 'Short of 10th/12th' | 'Critical Deficit' | 'Backlog Ineligible' | 'Missing 10th/12th Marks';
  }>;
}

export interface CounselingLog {
  id: string;
  mentor_id: string;
  mentor_name?: string;
  student_id: string;
  student_name?: string;
  student_roll_no?: string;
  subject_code?: string;
  subject_name?: string;
  mse_marks?: number;
  mse_max?: number;
  reason: string;
  counseling_notes: string;
  action_plan: string;
  status: 'open' | 'in_progress' | 'resolved';
  student_acknowledged: number;
  created_at: string;
}

export interface LogisysExportRow {
  sl_no: number;
  college_code: string;
  degree_code: string;
  batch_year: string;
  semester: number;
  student_usn: string;
  student_name: string;
  activity_subject_code: string;
  activity_points_earned: number;
  max_points: number;
  grade: string;
  clearance_status: 'CLEARED' | 'PENDING' | 'AT_RISK';
  logisys_upload_ready: boolean;
  remarks?: string;
}

export interface JoylinMasterSheetRow {
  sl_no: number;
  roll_no: string;
  student_name: string;
  semester: number;
  cgpa: number;
  mentor_name: string;
  cat_cert: number;
  cat_comp: number;
  cat_intern: number;
  cat_work: number;
  cat_vol: number;
  cat_sports: number;
  raw_total: number;
  capped_total: number;
  target_points: number;
  clearance_status: 'Degree Clearance Eligible' | 'In Progress' | 'Action Required';
  logisys_code: string;
}

export interface DeanDepartmentMetric {
  department_id: string;
  department_name: string;
  department_code: string;
  student_count: number;
  avg_points: number;
  cleared_count: number;
  at_risk_count: number;
  clearance_rate: number;
  pending_reviews: number;
}

export interface DeanYearStat {
  year: number;
  label: string;
  count: number;
  avg_points: number;
  cleared: number;
}

export interface DeanMentorCompliance {
  id: string;
  name: string;
  email: string;
  department_id: string;
  dept_code: string;
  mentees_count: number;
  pending_queue: number;
  approved_count: number;
}

export interface DeanDashboardData {
  dean: {
    name: string;
    title: string;
    institution: string;
  };
  institute_kpis: {
    total_enrolled_scholars: number;
    avg_points_per_student: number;
    total_cleared_degree: number;
    overall_clearance_rate: number;
    total_at_risk_scholars?: number;
    placement_ready_scholars: number;
    placement_readiness_pct: number;
    active_placement_drives: number;
  };
  department_comparison: DeanDepartmentMetric[];
  year_progression: DeanYearStat[];
  faculty_mentor_compliance: DeanMentorCompliance[];
  placement_drives: PlacementDrive[];
  recent_logs: Array<{
    id: string;
    user_id: string;
    user_name?: string;
    user_role?: string;
    action: string;
    details: string;
    created_at: string;
  }>;
  remedial_counseling_logs?: CounselingLog[];
}



