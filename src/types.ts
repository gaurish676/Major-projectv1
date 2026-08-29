export type UserRole = 'hod' | 'mentor' | 'student' | 'developer';

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
  total_points?: number;
  approved_count?: number;
  pending_count?: number;
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
  status: SubmissionStatus;
  points_awarded: number;
  semester?: number;
  base_points?: number;
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


