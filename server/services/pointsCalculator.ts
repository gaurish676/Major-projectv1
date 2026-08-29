import { queryAll, queryOne } from '../db/database';

export const SEMESTER_MAX_CREDITS = 30; // Max allowed activity credits/points per semester

export interface SemesterBreakdown {
  semester: number;
  year: number;
  raw_earned_points: number;
  capped_points: number;
  max_limit: number;
  excess_points: number;
  is_capped: boolean;
  submissions_count: number;
  approved_count: number;
  pending_count: number;
}

export interface YearBreakdown {
  year: number;
  year_label: string;
  semesters: number[];
  raw_earned_points: number;
  capped_points: number;
  max_limit: number;
  excess_points: number;
  is_capped: boolean;
}

export interface CategoryBreakdown {
  id: string;
  name: string;
  description?: string;
  max_cap_points: number;
  earned_points: number;
  capped_points: number;
  excess_points: number;
  icon: string;
  color: string;
  submissions_count: number;
}

export interface StudentPointsResult {
  student_id: string;
  raw_total_points: number;
  semester_capped_points: number;
  total_effective_points: number;
  target_points: number;
  progress_percentage: number;
  milestone_tier: 'Not Started' | 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  semester_limit_per_semester: number;
  total_excess_points: number;
  semester_breakdown: SemesterBreakdown[];
  year_breakdown: YearBreakdown[];
  categories_breakdown: CategoryBreakdown[];
}

/**
 * Calculates complete points for a student, strictly enforcing the per-semester credit cap.
 * Even if a student earns many certificates in a single semester or academic year,
 * they cannot get more credits than the semester limit (default 30 pts/semester).
 */
export async function calculateStudentPoints(studentId: string, currentSemester: number = 1): Promise<StudentPointsResult> {
  const targetPoints = 200;
  const semesterLimit = SEMESTER_MAX_CREDITS;

  // 1. Fetch categories
  const categories = await queryAll(`
    SELECT id, name, description, max_cap_points, icon, color
    FROM schema_categories
    ORDER BY name ASC
  `);

  // 2. Fetch all student submissions
  const submissions = await queryAll(`
    SELECT 
      s.id,
      s.student_id,
      s.category_id,
      s.status,
      s.points_awarded,
      COALESCE(s.semester, ?) as semester
    FROM submissions s
    WHERE s.student_id = ?
  `, [currentSemester, studentId]);

  // 3. Semester-wise points aggregation (Semesters 1 to 8)
  const semMap: Record<number, { raw: number; count: number; approvedCount: number; pendingCount: number }> = {};
  for (let s = 1; s <= 8; s++) {
    semMap[s] = { raw: 0, count: 0, approvedCount: 0, pendingCount: 0 };
  }

  // 4. Category-wise points aggregation
  const catMap: Record<string, { raw: number; count: number }> = {};
  categories.forEach((c) => {
    catMap[c.id] = { raw: 0, count: 0 };
  });

  let rawTotalPoints = 0;

  submissions.forEach((sub) => {
    const sem = Math.max(1, Math.min(8, Number(sub.semester) || currentSemester));
    const pts = Number(sub.points_awarded) || 0;
    const catId = sub.category_id;

    if (!semMap[sem]) {
      semMap[sem] = { raw: 0, count: 0, approvedCount: 0, pendingCount: 0 };
    }
    semMap[sem].count += 1;
    if (sub.status === 'approved') {
      semMap[sem].approvedCount += 1;
      semMap[sem].raw += pts;
      rawTotalPoints += pts;

      if (catMap[catId]) {
        catMap[catId].raw += pts;
      }
    } else if (sub.status === 'pending') {
      semMap[sem].pendingCount += 1;
    }

    if (catMap[catId]) {
      catMap[catId].count += 1;
    }
  });

  // Calculate semester breakdown & total semester-capped points
  let semesterCappedSum = 0;
  let totalExcessPoints = 0;
  const semesterBreakdown: SemesterBreakdown[] = [];

  for (let s = 1; s <= 8; s++) {
    const semData = semMap[s] || { raw: 0, count: 0, approvedCount: 0, pendingCount: 0 };
    const raw = semData.raw;
    const capped = Math.min(raw, semesterLimit);
    const excess = Math.max(0, raw - semesterLimit);
    const isCapped = raw > semesterLimit;

    semesterCappedSum += capped;
    totalExcessPoints += excess;

    const year = Math.ceil(s / 2);

    semesterBreakdown.push({
      semester: s,
      year,
      raw_earned_points: raw,
      capped_points: capped,
      max_limit: semesterLimit,
      excess_points: excess,
      is_capped: isCapped,
      submissions_count: semData.count,
      approved_count: semData.approvedCount,
      pending_count: semData.pendingCount,
    });
  }

  // Calculate academic year breakdown (Years 1 to 4)
  const yearBreakdown: YearBreakdown[] = [];
  for (let y = 1; y <= 4; y++) {
    const s1 = y * 2 - 1;
    const s2 = y * 2;
    const sem1 = semesterBreakdown.find((sb) => sb.semester === s1);
    const sem2 = semesterBreakdown.find((sb) => sb.semester === s2);

    const raw = (sem1?.raw_earned_points || 0) + (sem2?.raw_earned_points || 0);
    const capped = (sem1?.capped_points || 0) + (sem2?.capped_points || 0);
    const maxLimit = semesterLimit * 2; // e.g. 60 pts per year
    const excess = (sem1?.excess_points || 0) + (sem2?.excess_points || 0);

    yearBreakdown.push({
      year: y,
      year_label: `Year ${y} (Sem ${s1} & ${s2})`,
      semesters: [s1, s2],
      raw_earned_points: raw,
      capped_points: capped,
      max_limit: maxLimit,
      excess_points: excess,
      is_capped: (sem1?.is_capped || false) || (sem2?.is_capped || false),
    });
  }

  // Calculate categories breakdown
  const categoriesBreakdown: CategoryBreakdown[] = categories.map((cat) => {
    const catData = catMap[cat.id] || { raw: 0, count: 0 };
    const earned = catData.raw;
    const maxCap = Number(cat.max_cap_points);
    const capped = Math.min(earned, maxCap);
    const excess = Math.max(0, earned - maxCap);

    return {
      id: cat.id,
      name: cat.name,
      description: cat.description,
      max_cap_points: maxCap,
      earned_points: earned,
      capped_points: capped,
      excess_points: excess,
      icon: cat.icon,
      color: cat.color,
      submissions_count: catData.count,
    };
  });

  const totalEffectivePoints = Math.min(targetPoints, semesterCappedSum);
  const progressPercentage = Math.min(100, Math.round((totalEffectivePoints / targetPoints) * 1000) / 10);

  let milestoneTier: 'Not Started' | 'Bronze' | 'Silver' | 'Gold' | 'Diamond' = 'Not Started';
  if (totalEffectivePoints >= 200) milestoneTier = 'Diamond';
  else if (totalEffectivePoints >= 150) milestoneTier = 'Gold';
  else if (totalEffectivePoints >= 100) milestoneTier = 'Silver';
  else if (totalEffectivePoints >= 50) milestoneTier = 'Bronze';

  return {
    student_id: studentId,
    raw_total_points: rawTotalPoints,
    semester_capped_points: semesterCappedSum,
    total_effective_points: totalEffectivePoints,
    target_points: targetPoints,
    progress_percentage: progressPercentage,
    milestone_tier: milestoneTier,
    semester_limit_per_semester: semesterLimit,
    total_excess_points: totalExcessPoints,
    semester_breakdown: semesterBreakdown,
    year_breakdown: yearBreakdown,
    categories_breakdown: categoriesBreakdown,
  };
}
