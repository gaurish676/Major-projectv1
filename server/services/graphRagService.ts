import { GoogleGenAI } from '@google/genai';
import { getStudentKnowledgeContext } from './knowledgeGraph';
import { GraphRAGAdvisorResponse, GraphEvidence } from '../../src/types';

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI();
  }
  return aiClient;
}

/**
 * Executes GraphRAG Pipeline:
 * 1. Graph Retrieval: Query Knowledge Graph for student's exact state & relationships.
 * 2. Deterministic Calculation: Calculate remaining points, semester headroom, category caps.
 * 3. Context Builder: Format retrieved evidence into a structured knowledge payload.
 * 4. Gemini Integration: Request Gemini 2.5 Flash to generate recommendations strictly grounded in the evidence.
 * 5. Fallback: If Gemini API key is missing or call fails, return deterministic GraphRAG advice.
 */
export async function getGraphRAGRecommendation(
  studentId: string,
  userQuery?: string
): Promise<GraphRAGAdvisorResponse> {
  // Step 1 & 2: Graph Retrieval & Deterministic Context Extraction
  const evidence: GraphEvidence = await getStudentKnowledgeContext(studentId);

  const queryText = userQuery && userQuery.trim()
    ? userQuery.trim()
    : 'What specific activities should I complete to reach my 200 activity points target for degree clearance?';

  // Step 3: Context Builder - Construct strict Knowledge Graph payload string
  const contextText = buildGraphContextPrompt(evidence, queryText);

  const ai = getGenAI();

  // If Gemini API Key is available, call Gemini 2.5 Flash with strict grounding instructions
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: contextText }],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text;
      if (responseText) {
        const parsedGemini = JSON.parse(responseText.trim());

        return {
          student_id: studentId,
          query: queryText,
          graph_evidence: evidence,
          advice: {
            summary: parsedGemini.summary || `GraphRAG audit for ${evidence.student_name}: ${evidence.remaining_points} points remaining to reach 200.`,
            target_plan: parsedGemini.target_plan || `Accumulate ${evidence.remaining_points} points across uncapped categories in Semester ${evidence.current_semester}.`,
            category_strategy: Array.isArray(parsedGemini.category_strategy)
              ? parsedGemini.category_strategy
              : buildFallbackCategoryStrategy(evidence),
            recommended_activities: Array.isArray(parsedGemini.recommended_activities) && parsedGemini.recommended_activities.length > 0
              ? parsedGemini.recommended_activities
              : evidence.eligible_activities_list.slice(0, 4),
            semester_guidance: parsedGemini.semester_guidance || `Current Semester ${evidence.current_semester} has ${evidence.semester_headroom} pts available headroom.`,
          },
          is_graph_rag: true,
          generated_at: new Date().toISOString(),
          model_used: 'gemini-2.5-flash (GraphRAG Grounded)',
        };
      }
    } catch (err: any) {
      console.warn('Gemini GraphRAG generation error, falling back to deterministic advice engine:', err.message);
    }
  }

  // Step 5: Fallback Deterministic Engine (Guarantees GraphRAG works even offline/without API key)
  return {
    student_id: studentId,
    query: queryText,
    graph_evidence: evidence,
    advice: buildDeterministicGraphAdvice(evidence, queryText),
    is_graph_rag: true,
    generated_at: new Date().toISOString(),
    model_used: 'institutional-graph-engine',
  };
}

/**
 * Builds the strict Context Builder payload string for Gemini input.
 */
function buildGraphContextPrompt(evidence: GraphEvidence, query: string): string {
  const categoryLines = evidence.category_headroom
    .map(
      (ch) =>
        `- ${ch.category_name} (ID: ${ch.category_id}): Earned ${ch.earned} / Cap ${ch.cap} pts [Headroom: ${ch.headroom} pts, Status: ${ch.status}]`
    )
    .join('\n');

  const completedLines = evidence.completed_activities_list.length > 0
    ? evidence.completed_activities_list
        .map((ca) => `- "${ca.title}" (+${ca.points} pts, ${ca.category_name}, Sem ${ca.semester})`)
        .join('\n')
    : '- No approved activities completed yet.';

  const eligibleLines = evidence.eligible_activities_list.length > 0
    ? evidence.eligible_activities_list
        .slice(0, 10)
        .map(
          (ea) =>
            `- [${ea.source.toUpperCase()}] "${ea.title}" (+${ea.base_points} pts in ${ea.category_name}) -> Criteria: ${ea.venue_or_criteria || 'N/A'}`
        )
        .join('\n')
    : '- All available catalog activities in missing categories have been completed.';

  return `You are the Senior Academic Knowledge Graph Advisor for the Creditz Institutional Portal.
Your task is to answer the student's query based ONLY on the deterministic Knowledge Graph Evidence provided below.

=== CRITICAL GROUNDING RULES ===
1. You MUST ONLY use the retrieved evidence provided below.
2. DO NOT invent fake activities, non-existent point values, false eligibility rules, or wrong semester limits.
3. Use exact numbers:
   - Target Points: ${evidence.target_points}
   - Current Effective Points: ${evidence.current_points}
   - Remaining Points Needed: ${evidence.remaining_points} (Calculated as targetPoints ${evidence.target_points} - currentPoints ${evidence.current_points})
   - Current Semester: Semester ${evidence.current_semester}
   - Current Semester Headroom: ${evidence.semester_headroom} pts remaining (out of 30 max limit/semester)
4. Select recommendations ONLY from the Eligible Activities list provided in the graph evidence.

=== RETRIEVED KNOWLEDGE GRAPH EVIDENCE ===
Student Name: "${evidence.student_name}"
Department: "${evidence.department_name}"
Faculty Mentor: "${evidence.mentor_name}"
Current Milestone Tier: "${evidence.milestone_tier}"

NUMERICAL PROGRESS SUMMARY:
- Current Effective Points: ${evidence.current_points} / ${evidence.target_points}
- Remaining Points Needed: ${evidence.remaining_points}
- Approved Activities Completed: ${evidence.completed_activities_count}
- Pending Submissions: ${evidence.pending_activities_count}
- Current Semester: Semester ${evidence.current_semester}
- Available Semester Headroom: ${evidence.semester_headroom} pts

CATEGORY HEADROOM & CAPS:
${categoryLines}

COMPLETED ACTIVITIES & PROOF IN GRAPH:
${completedLines}

ELIGIBLE UNCOMPLETED ACTIVITIES IN GRAPH:
${eligibleLines}

SKILLS DEVELOPED: ${evidence.skills_developed.join(', ') || 'None yet'}
RECOMMENDED SKILLS TO ACQUIRE: ${evidence.skills_recommended.join(', ') || 'Cloud Architecture, Hackathon Leadership'}

STUDENT QUERY:
"${query}"

Return ONLY a valid JSON object matching this schema:
{
  "summary": string (Concise executive summary of current status and remaining ${evidence.remaining_points} points target),
  "target_plan": string (Action plan specifying how to earn ${evidence.remaining_points} points using uncapped categories),
  "category_strategy": string[] (Array of specific category advice based on remaining headroom),
  "recommended_activities": [
    {
      "id": string,
      "title": string,
      "category_name": string,
      "base_points": number,
      "source": "catalog" | "event",
      "venue_or_criteria": string
    }
  ] (Array of 3 to 5 items chosen strictly from the ELIGIBLE UNCOMPLETED ACTIVITIES list above),
  "semester_guidance": string (Guidance on staying within the 30 pts/semester cap)
}`;
}

/**
 * Fallback deterministic advice builder using retrieved Knowledge Graph evidence.
 */
function buildDeterministicGraphAdvice(evidence: GraphEvidence, query: string) {
  const summary = `Knowledge Graph Audit: You have earned ${evidence.current_points} effective points out of ${evidence.target_points} target points (${evidence.progress_percentage}% completed). You need ${evidence.remaining_points} more points for degree clearance.`;
  const targetPlan = `Focus on uncapped categories with available headroom in Semester ${evidence.current_semester}. You have ${evidence.semester_headroom} pts available headroom in your current semester cap.`;

  const categoryStrategy = buildFallbackCategoryStrategy(evidence);
  const recommendedActivities = evidence.eligible_activities_list.slice(0, 4);

  const semesterGuidance = `You are currently in Semester ${evidence.current_semester}. Remember that each semester has a 30-point ceiling limit to prevent last-minute cramming.`;

  return {
    summary,
    target_plan: targetPlan,
    category_strategy: categoryStrategy,
    recommended_activities: recommendedActivities,
    semester_guidance: semesterGuidance,
  };
}

function buildFallbackCategoryStrategy(evidence: GraphEvidence): string[] {
  const strategy: string[] = [];
  evidence.category_headroom.forEach((ch) => {
    if (ch.status === 'CAPPED') {
      strategy.push(`✓ ${ch.category_name}: Fully capped (${ch.earned}/${ch.cap} pts). Move focus to other domains.`);
    } else if (ch.status === 'IN_PROGRESS') {
      strategy.push(`→ ${ch.category_name}: In progress (${ch.earned}/${ch.cap} pts). You can earn up to ${ch.headroom} more points.`);
    } else {
      strategy.push(`⚡ ${ch.category_name}: Not started (0/${ch.cap} pts). High-priority domain to target for ${ch.headroom} pts.`);
    }
  });
  return strategy;
}
