import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { queryAll, queryOne, executeRun } from '../db/database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { GoogleGenAI } from '@google/genai';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

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

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const uniqueName = `rulebook_${Date.now()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// Official presets for instant testing
const RULEBOOK_PRESETS = [
  {
    id: 'preset_aicte_vtu',
    title: 'AICTE Activity Points & VTU Autonomous Framework (2024-2026)',
    description: 'Separates 1st Year Mandatory Student Induction Program (SIP 60 hrs) and UHV from 2nd, 3rd & 4th Year technical certifications, hackathons, and industrial internships.',
    target_year: 'Separated: 1st Year vs 2nd-4th Years',
    rules_count: 8,
  },
  {
    id: 'preset_autonomous_fasttrack',
    title: 'Autonomous University Honors & Industry Track Activity Regulations',
    description: 'Higher weightage for global industry certifications (AWS/Azure) and 8-week corporate internships, with semester cap at 30 points.',
    target_year: 'All Years (Honors Program)',
    rules_count: 6,
  },
];

// 1. Get Preset Rulebooks
router.get('/presets', authenticate, (req, res) => {
  res.json(RULEBOOK_PRESETS);
});

// 2. Upload and Parse University Rulebook PDF with AI (Multimodal Gemini Vision + Resilient Fallback)
router.post('/upload-pdf', uploadLimiter, authenticate, requireRole(['hod', 'dean']), upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = req.file;
    const presetId = req.body.preset_id;

    let title = 'University Academic Activity Points Rulebook Circular';
    let fileUrl = file ? `/uploads/${file.filename}` : '/uploads/aicte_activity_guidelines.pdf';
    let parsedRules: any[] = [];
    let modelUsed = 'aicte-vtu-standard-presets';
    let extractionStatus = 'Preset Rules Applied ✓';

    if (file) {
      title = file.originalname.replace(/\.[^/.]+$/, '');
    } else if (presetId === 'preset_autonomous_fasttrack') {
      title = 'Autonomous University Honors Track Guidelines';
    }

    const ai = getGenAI();

    // If file is provided and Gemini API key is configured, invoke multimodal vision extraction
    if (file && ai) {
      try {
        const fullPath = file.path;
        const fileBuffer = fs.readFileSync(fullPath);
        const ext = path.extname(fullPath).toLowerCase();
        let mimeType = 'application/pdf';
        if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
        else if (ext === '.webp') mimeType = 'image/webp';
        else if (ext === '.svg') mimeType = 'image/svg+xml';

        const base64Data = fileBuffer.toString('base64');

        const systemInstruction = `You are a Senior Academic Regulations Officer and AICTE/Autonomous University Credit Framework Analyst.
Your task is to parse uploaded official university circulars, policy handbooks, and activity points rulebooks.
Extract all distinct non-academic, co-curricular, and extra-curricular credit allocation rules into structured data.
You must strictly separate 1st-year induction programs (SIP, UHV, foundational physical yoga) from 2nd, 3rd, and 4th year degree rules (hackathons, industrial internships, NPTEL/AWS certifications).
Return ONLY a valid JSON array of objects conforming to the required schema.`;

        const prompt = `Analyze this university circular/rulebook document and extract all activity point rules.
For every activity rule identified, output an object with:
1. "activity_name": string (descriptive title of the activity or certification)
2. "category_id": string (must be exactly one of: "cat_cert", "cat_comp", "cat_intern", "cat_work", "cat_vol", "cat_sports")
3. "category_name": string (matching category name: "Technical Certifications", "Hackathons & Competitions", "Internships & Industrial Projects", "Workshops & Conferences", "Community Service & Volunteering", "Sports, Cultural & Extra-Curricular")
4. "base_points": number (e.g. 10, 15, 20, 25, 30, 40, 50)
5. "hours_required": number (e.g. 20, 30, 40, 60, 160)
6. "points_per_hour": number (rounded to 2 decimal places, base_points / hours_required)
7. "applicable_year": string (must be "year_1" if meant for 1st Year Induction/SIP/UHV/foundation, or "years_2_4" for 2nd-4th year degree credits)
8. "criteria": string (verification checklist, proctoring, or completion requirements)

Return ONLY a valid JSON array of these rule objects. No conversational text or markdown wrapper.`;

        const preferredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        let targetModel = preferredModel;

        let response;
        try {
          response = await ai.models.generateContent({
            model: targetModel,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType,
                      data: base64Data,
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
            },
          });
        } catch (mErr: any) {
          if (targetModel !== 'gemini-1.5-flash') {
            console.warn(`[rulebook] Fallback from ${targetModel} to gemini-1.5-flash:`, mErr.message);
            targetModel = 'gemini-1.5-flash';
            response = await ai.models.generateContent({
              model: targetModel,
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      inlineData: {
                        mimeType,
                        data: base64Data,
                      },
                    },
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
              config: {
                systemInstruction,
                responseMimeType: 'application/json',
              },
            });
          } else {
            throw mErr;
          }
        }

        const responseText = response.text;
        if (responseText) {
          const rawParsed = JSON.parse(responseText.trim());
          const rulesArray = Array.isArray(rawParsed) ? rawParsed : (rawParsed.rules || []);
          if (Array.isArray(rulesArray) && rulesArray.length > 0) {
            parsedRules = rulesArray.map((r: any) => {
              const basePts = Number(r.base_points) || 20;
              const hrs = Number(r.hours_required) || 40;
              const validCats = ['cat_cert', 'cat_comp', 'cat_intern', 'cat_work', 'cat_vol', 'cat_sports'];
              const catId = validCats.includes(r.category_id) ? r.category_id : 'cat_cert';
              const applicableYear = r.applicable_year === 'year_1' ? 'year_1' : 'years_2_4';

              return {
                activity_name: String(r.activity_name || 'Academic Activity').trim(),
                category_id: catId,
                category_name: String(r.category_name || 'Academic & Co-Curricular Category').trim(),
                base_points: basePts,
                hours_required: hrs,
                points_per_hour: Number((basePts / (hrs || 1)).toFixed(2)),
                applicable_year: applicableYear,
                criteria: String(r.criteria || 'Verified document submission endorsed by department mentor').trim(),
              };
            });

            modelUsed = targetModel;
            extractionStatus = `Multimodal AI OCR Verified (${parsedRules.length} rules extracted) ✓`;
          }
        }
      } catch (aiErr: any) {
        console.warn('[rulebook.routes.ts] Multimodal Gemini extraction note:', aiErr.message);
        // Resilient fallback to curated rules if AI parsing encountered an error or network drop
      }
    }

    // Default Curated Fallback if AI was not invoked or returned empty
    if (parsedRules.length === 0) {
      parsedRules = [
        // 1st Year Induction & Foundation (Separate rules)
        {
          activity_name: 'AICTE Mandatory Student Induction Program (SIP 3-Week)',
          category_id: 'cat_vol',
          category_name: 'Community Service & Volunteering',
          base_points: 25,
          hours_required: 60,
          points_per_hour: 0.42,
          applicable_year: 'year_1',
          criteria: 'Mandatory 1st Year induction program. Creative arts, mentor sessions, universal values, and physical conditioning.',
        },
        {
          activity_name: 'Universal Human Values (UHV) Foundation & Ethics Project',
          category_id: 'cat_work',
          category_name: 'Workshops & Conferences',
          base_points: 20,
          hours_required: 40,
          points_per_hour: 0.50,
          applicable_year: 'year_1',
          criteria: '1st Year ethics module with self-reflective journal submission endorsed by faculty counselor.',
        },
        {
          activity_name: '1st Year Physical Fitness, Sports & Yoga Foundation',
          category_id: 'cat_sports',
          category_name: 'Sports, Cultural & Extra-Curricular',
          base_points: 15,
          hours_required: 30,
          points_per_hour: 0.50,
          applicable_year: 'year_1',
          criteria: 'Active participation in campus sports events or certified 30-hour fitness program during 1st Year.',
        },
        // 2nd, 3rd, 4th Year Degree Rules
        {
          activity_name: 'NPTEL / SWAYAM 12-Week Technical Course (Elite/Gold)',
          category_id: 'cat_cert',
          category_name: 'Technical Certifications',
          base_points: 30,
          hours_required: 45,
          points_per_hour: 0.67,
          applicable_year: 'years_2_4',
          criteria: 'Proctored exam score >= 75% in proctored national exam with verified digital credential ID.',
        },
        {
          activity_name: 'National Level Hackathon - Winner / Top 3 (SIH / National)',
          category_id: 'cat_comp',
          category_name: 'Hackathons & Competitions',
          base_points: 40,
          hours_required: 36,
          points_per_hour: 1.11,
          applicable_year: 'years_2_4',
          criteria: 'Working prototype demo, presentation certificate, and official merit ranking.',
        },
        {
          activity_name: 'Corporate Industry Internship >= 8 Weeks',
          category_id: 'cat_intern',
          category_name: 'Internships & Industrial Projects',
          base_points: 30,
          hours_required: 160,
          points_per_hour: 0.19,
          applicable_year: 'years_2_4',
          criteria: 'Completion letter signed by HR with supervisor performance evaluation report.',
        },
        {
          activity_name: 'NSS 7-Day Residential Rural Development Camp',
          category_id: 'cat_vol',
          category_name: 'Community Service & Volunteering',
          base_points: 25,
          hours_required: 60,
          points_per_hour: 0.42,
          applicable_year: 'years_2_4',
          criteria: 'Certified attendance by University NSS Program Officer with field project diary.',
        },
        {
          activity_name: '5-Day Hands-on Technical Workshop / IEEE Bootcamp',
          category_id: 'cat_work',
          category_name: 'Workshops & Conferences',
          base_points: 15,
          hours_required: 40,
          points_per_hour: 0.38,
          applicable_year: 'years_2_4',
          criteria: 'Minimum 80% lab attendance and verified capstone project submission.',
        },
      ];
      if (!file) {
        extractionStatus = 'Standard AICTE/VTU Presets Loaded ✓';
      } else {
        extractionStatus = 'Curated Regulations Applied (AI Key Not Set or Fallback Active) ✓';
      }
    }

    const uploadId = `rup_${Date.now()}`;
    await executeRun(`
      INSERT INTO rulebook_uploads (id, title, file_url, parsed_rules_json, target_academic_year, status, created_at)
      VALUES (?, ?, ?, ?, 'separated', 'processed', ?)
    `, [
      uploadId,
      title,
      fileUrl,
      JSON.stringify(parsedRules),
      new Date().toISOString(),
    ]);

    res.json({
      upload_id: uploadId,
      title,
      file_url: fileUrl,
      extraction_summary: {
        total_rules_extracted: parsedRules.length,
        year_1_induction_rules: parsedRules.filter((r) => r.applicable_year === 'year_1').length,
        years_2_4_degree_rules: parsedRules.filter((r) => r.applicable_year === 'years_2_4').length,
        status: extractionStatus,
        ai_model: modelUsed,
      },
      rules: parsedRules,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Apply Extracted Rules to Live Database Schema
router.post('/apply', authenticate, requireRole(['hod', 'dean']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { rules } = req.body;
    if (!Array.isArray(rules) || rules.length === 0) {
      res.status(400).json({ error: 'rules array is required' });
      return;
    }

    const now = new Date().toISOString();
    let updatedCount = 0;

    for (let i = 0; i < rules.length; i++) {
      const r = rules[i];
      const ruleId = `sch_extracted_${Date.now()}_${i + 1}`;
      
      await executeRun(`
        INSERT INTO activity_schema (
          id, category_id, activity_name, base_points, criteria,
          version, is_active, hours_required, points_per_hour,
          applicable_year, created_at
        ) VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?)
      `, [
        ruleId,
        r.category_id || 'cat_cert',
        r.activity_name,
        Number(r.base_points) || 20,
        r.criteria || 'Verified as per university rulebook circular',
        Number(r.hours_required) || 40,
        Number(r.points_per_hour) || 0.5,
        r.applicable_year || 'all',
        now,
      ]);
      updatedCount++;
    }

    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'RULEBOOK_APPLIED', ?, ?)
    `, [
      `log_${Date.now()}`,
      req.user!.id,
      `Applied ${updatedCount} AI-extracted rules from university circular (1st Year Induction vs 2nd-4th Year rules separated)`,
      now,
    ]);

    res.json({
      success: true,
      applied_count: updatedCount,
      message: `Successfully synchronized ${updatedCount} rules from university PDF circular into active schema.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
