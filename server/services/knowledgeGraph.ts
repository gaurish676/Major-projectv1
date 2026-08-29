import { queryAll, queryOne } from '../db/database';
import { calculateStudentPoints, SEMESTER_MAX_CREDITS } from './pointsCalculator';
import {
  GraphNode,
  GraphEdge,
  GraphEvidence,
  CategoryHeadroomInfo,
} from '../../src/types';

export interface InstitutionalKnowledgeGraph {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
  built_at: string;
}

/**
 * Builds the complete deterministic Institutional Knowledge Graph derived from the source-of-truth Creditz SQLite DB.
 * The synchronization is idempotent: calling this re-fetches DB entities and populates graph nodes and edges.
 */
export async function buildKnowledgeGraph(): Promise<InstitutionalKnowledgeGraph> {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  // 1. Fetch Department Entities
  const departments = await queryAll('SELECT * FROM departments');
  departments.forEach((dept) => {
    nodes.set(`dept_${dept.id}`, {
      id: `dept_${dept.id}`,
      label: dept.name,
      type: 'Department',
      properties: { id: dept.id, name: dept.name, code: dept.code },
    });
  });

  // 2. Fetch Users (Faculty & Students)
  const users = await queryAll('SELECT * FROM users');
  users.forEach((usr) => {
    if (usr.role === 'mentor' || usr.role === 'hod') {
      const facId = `fac_${usr.id}`;
      nodes.set(facId, {
        id: facId,
        label: usr.name,
        type: 'Faculty',
        properties: {
          id: usr.id,
          name: usr.name,
          email: usr.email,
          role: usr.role,
          department_id: usr.department_id,
        },
      });

      if (usr.department_id && nodes.has(`dept_${usr.department_id}`)) {
        edges.push({
          id: `e_${facId}_dept_${usr.department_id}`,
          source: facId,
          target: `dept_${usr.department_id}`,
          relation: 'BELONGS_TO',
        });
      }
    } else if (usr.role === 'student') {
      const stdId = `std_${usr.id}`;
      nodes.set(stdId, {
        id: stdId,
        label: usr.name,
        type: 'Student',
        properties: {
          id: usr.id,
          name: usr.name,
          roll_no: usr.roll_no,
          semester: usr.semester || 1,
          cgpa: usr.cgpa || 0,
          email: usr.email,
        },
      });

      if (usr.department_id && nodes.has(`dept_${usr.department_id}`)) {
        edges.push({
          id: `e_${stdId}_dept_${usr.department_id}`,
          source: stdId,
          target: `dept_${usr.department_id}`,
          relation: 'BELONGS_TO',
        });
      }

      if (usr.mentor_id && nodes.has(`fac_${usr.mentor_id}`)) {
        edges.push({
          id: `e_${stdId}_fac_${usr.mentor_id}`,
          source: stdId,
          target: `fac_${usr.mentor_id}`,
          relation: 'MENTORED_BY',
        });
      }
    }
  });

  // 3. Fetch Categories
  const categories = await queryAll('SELECT * FROM schema_categories');
  categories.forEach((cat) => {
    nodes.set(`cat_${cat.id}`, {
      id: `cat_${cat.id}`,
      label: cat.name,
      type: 'Category',
      properties: {
        id: cat.id,
        name: cat.name,
        max_cap_points: cat.max_cap_points,
        description: cat.description,
      },
    });
  });

  // 4. Fetch Semesters (1 to 8)
  for (let sem = 1; sem <= 8; sem++) {
    const semId = `sem_${sem}`;
    nodes.set(semId, {
      id: semId,
      label: `Semester ${sem}`,
      type: 'Semester',
      properties: { number: sem, max_credit_limit: SEMESTER_MAX_CREDITS },
    });
  }

  // 5. Fetch Activity Schema (Catalog Rules / Activities)
  const schemaActivities = await queryAll('SELECT * FROM activity_schema WHERE is_active = 1');
  schemaActivities.forEach((act) => {
    const actNodeId = `act_schema_${act.id}`;
    nodes.set(actNodeId, {
      id: actNodeId,
      label: act.activity_name,
      type: 'Activity',
      properties: {
        id: act.id,
        name: act.activity_name,
        base_points: act.base_points,
        criteria: act.criteria,
        category_id: act.category_id,
        is_catalog: true,
      },
    });

    // Rule entity
    const ruleNodeId = `rule_${act.id}`;
    nodes.set(ruleNodeId, {
      id: ruleNodeId,
      label: `Rule for ${act.activity_name}`,
      type: 'Rule',
      properties: {
        id: act.id,
        base_points: act.base_points,
        criteria: act.criteria,
      },
    });

    edges.push({
      id: `e_${actNodeId}_cat_${act.category_id}`,
      source: actNodeId,
      target: `cat_${act.category_id}`,
      relation: 'HAS_CATEGORY',
    });

    edges.push({
      id: `e_${actNodeId}_awards_${act.base_points}`,
      source: actNodeId,
      target: `rule_${act.id}`,
      relation: 'AWARDS',
      properties: { points: act.base_points },
    });

    // Infer skills & organizations for schema activities
    const inferredOrg = inferOrganization(act.activity_name, act.criteria);
    const orgNodeId = `org_${cleanId(inferredOrg)}`;
    if (!nodes.has(orgNodeId)) {
      nodes.set(orgNodeId, {
        id: orgNodeId,
        label: inferredOrg,
        type: 'Organization',
        properties: { name: inferredOrg },
      });
    }
    edges.push({
      id: `e_${actNodeId}_org_${cleanId(inferredOrg)}`,
      source: actNodeId,
      target: orgNodeId,
      relation: 'ISSUED_BY',
    });

    const inferredSkills = inferSkills(act.activity_name, act.category_id);
    inferredSkills.forEach((skillName) => {
      const skillNodeId = `skill_${cleanId(skillName)}`;
      if (!nodes.has(skillNodeId)) {
        nodes.set(skillNodeId, {
          id: skillNodeId,
          label: skillName,
          type: 'Skill',
          properties: { name: skillName },
        });
      }
      edges.push({
        id: `e_${actNodeId}_dev_${cleanId(skillName)}`,
        source: actNodeId,
        target: skillNodeId,
        relation: 'DEVELOPS',
      });
    });
  });

  // 6. Fetch Upcoming Events
  const events = await queryAll('SELECT * FROM events');
  events.forEach((evt) => {
    const evtNodeId = `act_event_${evt.id}`;
    nodes.set(evtNodeId, {
      id: evtNodeId,
      label: evt.title,
      type: 'Activity',
      properties: {
        id: evt.id,
        name: evt.title,
        base_points: evt.potential_points,
        description: evt.description,
        event_date: evt.event_date,
        venue: evt.venue,
        category_id: evt.category_id,
        is_event: true,
      },
    });

    edges.push({
      id: `e_${evtNodeId}_cat_${evt.category_id}`,
      source: evtNodeId,
      target: `cat_${evt.category_id}`,
      relation: 'HAS_CATEGORY',
    });

    const inferredOrg = 'Department of Computer Science & Engineering';
    const orgNodeId = `org_${cleanId(inferredOrg)}`;
    if (!nodes.has(orgNodeId)) {
      nodes.set(orgNodeId, {
        id: orgNodeId,
        label: inferredOrg,
        type: 'Organization',
        properties: { name: inferredOrg },
      });
    }
    edges.push({
      id: `e_${evtNodeId}_org`,
      source: evtNodeId,
      target: orgNodeId,
      relation: 'ISSUED_BY',
    });
  });

  // 7. Fetch Submissions & Certificates
  const submissions = await queryAll('SELECT * FROM submissions');
  submissions.forEach((sub) => {
    const subActNodeId = `act_sub_${sub.id}`;
    nodes.set(subActNodeId, {
      id: subActNodeId,
      label: sub.activity_title,
      type: 'Activity',
      properties: {
        id: sub.id,
        title: sub.activity_title,
        points_awarded: sub.points_awarded,
        status: sub.status,
        semester: sub.semester || 1,
        category_id: sub.category_id,
        completion_date: sub.completion_date,
        is_submission: true,
      },
    });

    const stdId = `std_${sub.student_id}`;
    if (nodes.has(stdId)) {
      edges.push({
        id: `e_${stdId}_${sub.status}_${sub.id}`,
        source: stdId,
        target: subActNodeId,
        relation: sub.status === 'approved' ? 'COMPLETED' : 'SUBMITTED',
        properties: {
          points: sub.points_awarded,
          semester: sub.semester || 1,
          status: sub.status,
        },
      });
    }

    edges.push({
      id: `e_${subActNodeId}_cat_${sub.category_id}`,
      source: subActNodeId,
      target: `cat_${sub.category_id}`,
      relation: 'HAS_CATEGORY',
    });

    const semId = `sem_${sub.semester || 1}`;
    if (nodes.has(semId)) {
      edges.push({
        id: `e_${subActNodeId}_sem_${sub.semester || 1}`,
        source: subActNodeId,
        target: semId,
        relation: 'OCCURRED_IN',
      });
    }

    // Certificate node & relations
    if (sub.file_name) {
      const certNodeId = `cert_${sub.id}`;
      nodes.set(certNodeId, {
        id: certNodeId,
        label: sub.file_name,
        type: 'Certificate',
        properties: {
          id: sub.id,
          file_name: sub.file_name,
          file_url: sub.file_url,
          status: sub.status,
        },
      });

      edges.push({
        id: `e_${certNodeId}_proves_${subActNodeId}`,
        source: certNodeId,
        target: subActNodeId,
        relation: 'PROVES',
      });

      if (nodes.has(stdId)) {
        edges.push({
          id: `e_${certNodeId}_belongs_${stdId}`,
          source: certNodeId,
          target: stdId,
          relation: 'BELONGS_TO',
        });
      }
    }

    // Issuer & Skills
    const inferredOrg = inferOrganization(sub.activity_title, sub.description || '');
    const orgNodeId = `org_${cleanId(inferredOrg)}`;
    if (!nodes.has(orgNodeId)) {
      nodes.set(orgNodeId, {
        id: orgNodeId,
        label: inferredOrg,
        type: 'Organization',
        properties: { name: inferredOrg },
      });
    }
    edges.push({
      id: `e_${subActNodeId}_org`,
      source: subActNodeId,
      target: orgNodeId,
      relation: 'ISSUED_BY',
    });

    const inferredSkills = inferSkills(sub.activity_title, sub.category_id);
    inferredSkills.forEach((skillName) => {
      const skillNodeId = `skill_${cleanId(skillName)}`;
      if (!nodes.has(skillNodeId)) {
        nodes.set(skillNodeId, {
          id: skillNodeId,
          label: skillName,
          type: 'Skill',
          properties: { name: skillName },
        });
      }
      edges.push({
        id: `e_${subActNodeId}_dev_${cleanId(skillName)}`,
        source: subActNodeId,
        target: skillNodeId,
        relation: 'DEVELOPS',
      });
    });
  });

  return {
    nodes,
    edges,
    built_at: new Date().toISOString(),
  };
}

/**
 * Deterministically retrieves graph context and calculates numerical metrics for a given Student.
 */
export async function getStudentKnowledgeContext(studentId: string): Promise<GraphEvidence> {
  const kg = await buildKnowledgeGraph();
  const student = await queryOne('SELECT * FROM users WHERE id = ? AND role = "student"', [studentId]);

  if (!student) {
    throw new Error(`Student with ID ${studentId} not found in Creditz system.`);
  }

  const currentSem = student.semester || 6;
  const pointsResult = await calculateStudentPoints(studentId, currentSem);
  const targetPoints = pointsResult.target_points || 200;
  const currentPoints = pointsResult.total_effective_points;
  const remainingPoints = Math.max(0, targetPoints - currentPoints);

  // Current semester points & headroom
  const currentSemBreakdown = pointsResult.semester_breakdown.find((sb) => sb.semester === currentSem);
  const currentSemEarned = currentSemBreakdown ? currentSemBreakdown.raw_earned_points : 0;
  const semesterHeadroom = Math.max(0, SEMESTER_MAX_CREDITS - currentSemEarned);

  // Category headroom info
  const categoryHeadroom: CategoryHeadroomInfo[] = pointsResult.categories_breakdown.map((cat) => {
    const headroom = Math.max(0, cat.max_cap_points - cat.capped_points);
    let status: 'CAPPED' | 'IN_PROGRESS' | 'NOT_STARTED' = 'NOT_STARTED';
    if (cat.capped_points >= cat.max_cap_points) {
      status = 'CAPPED';
    } else if (cat.earned_points > 0) {
      status = 'IN_PROGRESS';
    }

    return {
      category_id: cat.id,
      category_name: cat.name,
      earned: cat.capped_points,
      cap: cat.max_cap_points,
      headroom,
      status,
    };
  });

  // Completed activities list
  const completedSubmissions = await queryAll(
    `SELECT s.*, c.name as category_name
     FROM submissions s
     JOIN schema_categories c ON s.category_id = c.id
     WHERE s.student_id = ? AND s.status = 'approved'
     ORDER BY s.semester ASC, s.completion_date DESC`,
    [studentId]
  );

  const completedActivitiesList = completedSubmissions.map((s) => ({
    id: s.id,
    title: s.activity_title,
    category_name: s.category_name || 'General',
    points: s.points_awarded,
    semester: s.semester || 1,
    proof: s.file_name,
  }));

  // Pending count
  const pendingCountRes = await queryOne(
    `SELECT COUNT(*) as cnt FROM submissions WHERE student_id = ? AND status = 'pending'`,
    [studentId]
  );
  const pendingActivitiesCount = pendingCountRes?.cnt || 0;

  // Uncapped category IDs where headroom > 0
  const uncappedCatIds = categoryHeadroom
    .filter((ch) => ch.headroom > 0)
    .map((ch) => ch.category_id);

  // Find completed titles to avoid recommending duplicate activities
  const completedTitlesLower = new Set(completedSubmissions.map((cs) => cs.activity_title.toLowerCase()));

  // Eligible activities from Catalog & Events
  const eligibleCatalog = await queryAll(
    `SELECT sch.*, c.name as category_name
     FROM activity_schema sch
     JOIN schema_categories c ON sch.category_id = c.id
     WHERE sch.is_active = 1`
  );

  const eligibleEvents = await queryAll(
    `SELECT e.*, c.name as category_name
     FROM events e
     JOIN schema_categories c ON e.category_id = c.id`
  );

  const eligibleActivitiesList: Array<{
    id: string;
    title: string;
    category_name: string;
    base_points: number;
    source: 'catalog' | 'event';
    venue_or_criteria?: string;
  }> = [];

  // Filter Catalog items matching uncapped categories
  eligibleCatalog.forEach((catAct) => {
    if (uncappedCatIds.includes(catAct.category_id) && !completedTitlesLower.has(catAct.activity_name.toLowerCase())) {
      eligibleActivitiesList.push({
        id: catAct.id,
        title: catAct.activity_name,
        category_name: catAct.category_name,
        base_points: catAct.base_points,
        source: 'catalog',
        venue_or_criteria: catAct.criteria,
      });
    }
  });

  // Filter Event items matching uncapped categories
  eligibleEvents.forEach((evt) => {
    if (uncappedCatIds.includes(evt.category_id) && !completedTitlesLower.has(evt.title.toLowerCase())) {
      eligibleActivitiesList.push({
        id: evt.id,
        title: evt.title,
        category_name: evt.category_name,
        base_points: evt.potential_points,
        source: 'event',
        venue_or_criteria: `${evt.venue} (${evt.event_date})`,
      });
    }
  });

  // Extract skills developed from knowledge graph
  const skillsDevelopedSet = new Set<string>();
  const stdNodeId = `std_${studentId}`;

  kg.edges.forEach((edge) => {
    if (edge.source === stdNodeId && edge.relation === 'COMPLETED') {
      const actNode = kg.nodes.get(edge.target);
      if (actNode) {
        kg.edges.forEach((e2) => {
          if (e2.source === actNode.id && e2.relation === 'DEVELOPS') {
            const skillNode = kg.nodes.get(e2.target);
            if (skillNode) skillsDevelopedSet.add(skillNode.label);
          }
        });
      }
    }
  });

  // Recommend skills from eligible activities
  const skillsRecommendedSet = new Set<string>();
  eligibleActivitiesList.slice(0, 8).forEach((item) => {
    const inferred = inferSkills(item.title, '');
    inferred.forEach((sk) => {
      if (!skillsDevelopedSet.has(sk)) {
        skillsRecommendedSet.add(sk);
      }
    });
  });

  // Mentor & Dept name
  const mentor = student.mentor_id ? await queryOne('SELECT name FROM users WHERE id = ?', [student.mentor_id]) : null;
  const dept = student.department_id ? await queryOne('SELECT name FROM departments WHERE id = ?', [student.department_id]) : null;

  return {
    student_id: studentId,
    student_name: student.name,
    department_name: dept?.name || 'Computer Science & Engineering',
    mentor_name: mentor?.name || 'Faculty Advisor',
    current_points: currentPoints,
    target_points: targetPoints,
    remaining_points: remainingPoints,
    progress_percentage: pointsResult.progress_percentage || 0,
    current_semester: currentSem,
    semester_headroom: semesterHeadroom,
    milestone_tier: pointsResult.milestone_tier,
    category_headroom: categoryHeadroom,
    completed_activities_count: completedActivitiesList.length,
    pending_activities_count: pendingActivitiesCount,
    eligible_activities_count: eligibleActivitiesList.length,
    skills_developed: Array.from(skillsDevelopedSet),
    skills_recommended: Array.from(skillsRecommendedSet),
    completed_activities_list: completedActivitiesList,
    eligible_activities_list: eligibleActivitiesList,
  };
}

// Helper utilities for deterministic inferences
function cleanId(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 40);
}

function inferOrganization(title: string, desc: string): string {
  const text = `${title} ${desc}`.toLowerCase();
  if (text.includes('nptel') || text.includes('swayam')) return 'NPTEL / IIT Kharagpur';
  if (text.includes('aws')) return 'Amazon Web Services (AWS)';
  if (text.includes('google') || text.includes('gsoc')) return 'Google Developer Group';
  if (text.includes('microsoft')) return 'Microsoft Research India';
  if (text.includes('sih') || text.includes('smart india')) return 'Ministry of Education Innovation Cell';
  if (text.includes('ieee')) return 'IEEE Bangalore Section';
  if (text.includes('acm')) return 'ACM India Student Chapter';
  if (text.includes('nss') || text.includes('red cross')) return 'National Service Scheme (NSS)';
  if (text.includes('sports') || text.includes('badminton') || text.includes('aiu')) return 'Association of Indian Universities (AIU)';
  return 'University Academic Authority';
}

function inferSkills(title: string, categoryId: string): string[] {
  const text = title.toLowerCase();
  const skills: string[] = [];

  if (text.includes('cloud') || text.includes('aws') || text.includes('kubernetes')) {
    skills.push('Cloud Computing', 'DevOps & Orchestration');
  }
  if (text.includes('ai') || text.includes('hackathon') || text.includes('learning') || text.includes('coding')) {
    skills.push('Artificial Intelligence', 'Competitive Problem Solving');
  }
  if (text.includes('research') || text.includes('paper') || text.includes('ieee') || text.includes('internship')) {
    skills.push('Systems Research', 'Technical Documentation');
  }
  if (text.includes('nss') || text.includes('volunteer') || text.includes('camp') || text.includes('club')) {
    skills.push('Community Leadership', 'Social Outreach');
  }
  if (text.includes('sports') || text.includes('fest') || text.includes('badminton')) {
    skills.push('Team Athletic Performance', 'Event Management');
  }

  if (skills.length === 0) {
    skills.push('Professional Skill Development', 'Applied Technical Practice');
  }

  return skills;
}
