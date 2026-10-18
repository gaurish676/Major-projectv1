import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ---------------------------------------------------------
# CONSTANTS & COLOR PALETTE
# ---------------------------------------------------------
BG_DARK = RGBColor(11, 19, 43)        # #0B132B
BG_CARD = RGBColor(22, 33, 62)        # #16213E
BG_CARD_LIGHT = RGBColor(30, 41, 59)  # #1E293B
BORDER_COLOR = RGBColor(56, 189, 248) # #38BDF8 (Cyan)
TEXT_WHITE = RGBColor(255, 255, 255)
TEXT_MUTED = RGBColor(148, 163, 184) # #94A3B8
ACCENT_CYAN = RGBColor(56, 189, 248)  # #38BDF8
ACCENT_INDIGO = RGBColor(129, 140, 248) # #818CF8
ACCENT_EMERALD = RGBColor(52, 211, 153) # #34D399
ACCENT_GOLD = RGBColor(251, 191, 36)   # #FBBF24
ACCENT_ROSE = RGBColor(251, 113, 133)  # #FB7185

ASSETS_DIR = "/home/gaurish/Desktop/Major/Major-project-prototype-v3/presentation_assets"
OUTPUT_PPTX = "/home/gaurish/Desktop/Major/Major-project-prototype-v3/Creditz_Prototype_v3_Presentation.pptx"

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_slide_layout = prs.slide_layouts[6]

    def set_slide_background(slide):
        bg = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5)
        )
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_DARK
        bg.line.fill.background()
        return bg

    def add_header(slide, title, category="CREDITZ PROTOTYPE V3"):
        # Top banner pill
        pill = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.4), Inches(2.8), Inches(0.32)
        )
        pill.fill.solid()
        pill.fill.fore_color.rgb = RGBColor(30, 58, 138)
        pill.line.color.rgb = ACCENT_CYAN
        pill.line.width = Pt(1)
        tf = pill.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = f"●  {category.upper()}"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN
        p.alignment = PP_ALIGN.CENTER

        # Slide Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(11.7), Inches(0.7))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_WHITE

        # Divider line
        line = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.48), Inches(11.733), Inches(0.02)
        )
        line.fill.solid()
        line.fill.fore_color.rgb = RGBColor(30, 41, 59)
        line.line.fill.background()

    def add_card(slide, left, top, width, height, bg_color=BG_CARD, border_color=None):
        card = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height
        )
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        if border_color:
            card.line.color.rgb = border_color
            card.line.width = Pt(1.2)
        else:
            card.line.fill.background()
        return card

    # =========================================================
    # SLIDE 1: HERO TITLE SLIDE
    # =========================================================
    s1 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s1)

    # Left content box
    add_card(s1, Inches(0.8), Inches(0.8), Inches(6.0), Inches(5.9), BG_CARD, ACCENT_INDIGO)

    # Title Badge
    b1 = s1.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(1.1), Inches(2.6), Inches(0.36)
    )
    b1.fill.solid()
    b1.fill.fore_color.rgb = RGBColor(49, 46, 129)
    b1.line.color.rgb = ACCENT_CYAN
    p = b1.text_frame.paragraphs[0]
    p.text = "MAJOR PROJECT PROTOTYPE V3"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN
    p.alignment = PP_ALIGN.CENTER

    tb = s1.shapes.add_textbox(Inches(1.2), Inches(1.55), Inches(5.2), Inches(3.2))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "CREDITZ"
    p.font.size = Pt(44)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE

    p2 = tf.add_paragraph()
    p2.text = "AICTE 200 Activity Points & Degree Clearance System"
    p2.font.size = Pt(16)
    p2.font.bold = True
    p2.font.color.rgb = ACCENT_CYAN
    p2.space_before = Pt(8)

    p3 = tf.add_paragraph()
    p3.text = (
        "An intelligent institutional platform streamlining co-curricular credit tracking, "
        "multimodal AI certificate verification, deterministic policy ceilings, and official "
        "NAAC/NBA accreditation clearance transcripts."
    )
    p3.font.size = Pt(12)
    p3.font.color.rgb = TEXT_MUTED
    p3.space_before = Pt(12)

    p4 = tf.add_paragraph()
    p4.text = "✨ Version 3.0 Refactor Highlights:"
    p4.font.size = Pt(12)
    p4.font.bold = True
    p4.font.color.rgb = ACCENT_EMERALD
    p4.space_before = Pt(14)

    p5 = tf.add_paragraph()
    p5.text = (
        "• 1-Click Institutional PDF Credit Report (A4 Certified)\n"
        "• Faculty Mentor Visual Analytics (Category Donut & Velocity)\n"
        "• Bell Icon Real-time Meeting & Advisory Notice Space\n"
        "• Minimalized, Non-IT Friendly Academic Vocabulary"
    )
    p5.font.size = Pt(11)
    p5.font.color.rgb = TEXT_WHITE
    p5.space_before = Pt(4)

    # Team Info Box at bottom of left card
    tb_team = s1.shapes.add_textbox(Inches(1.2), Inches(5.1), Inches(5.2), Inches(1.4))
    tf_team = tb_team.text_frame
    tf_team.word_wrap = True
    pt1 = tf_team.paragraphs[0]
    pt1.text = "DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING"
    pt1.font.size = Pt(10)
    pt1.font.bold = True
    pt1.font.color.rgb = ACCENT_GOLD

    pt2 = tf_team.add_paragraph()
    pt2.text = "Autonomous Institute of Technology & Sciences | Evaluated for Major Project v3"
    pt2.font.size = Pt(10)
    pt2.font.color.rgb = TEXT_MUTED
    pt2.space_before = Pt(2)

    # Right Image: Hero Visual
    hero_path = os.path.join(ASSETS_DIR, "creditz_v3_hero.jpg")
    if os.path.exists(hero_path):
        add_card(s1, Inches(7.05), Inches(0.8), Inches(5.48), Inches(5.9), BG_CARD_LIGHT, ACCENT_CYAN)
        s1.shapes.add_picture(hero_path, Inches(7.15), Inches(0.9), width=Inches(5.28), height=Inches(5.7))

    # =========================================================
    # SLIDE 2: EVALUATION PANEL FEEDBACK & V3 RESOLUTION
    # =========================================================
    s2 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s2)
    add_header(s2, "Addressing Evaluation Panel Feedback: The Evolution to v3")

    # 4 Comparison Cards
    feedbacks = [
        {
            "num": "01",
            "title": "Panel Feedback: Technical Jargon",
            "issue": "Panel noted v2 had developer-centric terminology (Merkle root, cryptographic audit, schema hash) confusing non-IT academic panelists.",
            "v3_solution": "V3 Resolution: Institutional Vocabulary",
            "v3_desc": "Completely converted to standard academic terms: 'Official PDF Transcript', 'Submissions', 'Digitally Verified ✓', and 'Point Rules & Categories'.",
            "color": ACCENT_CYAN
        },
        {
            "num": "02",
            "title": "Panel Feedback: Dashboard Clutter",
            "issue": "Student dashboard had 8 mini-cards, duplicated upcoming events, and nested scroll traps making the page hard to navigate.",
            "v3_solution": "V3 Resolution: Minimalized Current Focus",
            "v3_desc": "Unified 80% of screen to Current Semester focus card with clean expandable toggle, natural window scrolling, and unified Clubs/Events portal.",
            "color": ACCENT_EMERALD
        },
        {
            "num": "03",
            "title": "Panel Feedback: Misplaced Visual Analytics",
            "issue": "Complex velocity charts and donuts on student views caused confusion rather than providing clear clearance steps.",
            "v3_solution": "V3 Resolution: Mentor-Exclusive Visuals",
            "v3_desc": "Removed visual charts from students and isolated them into a dedicated Faculty Mentor Analytics Desk (Donut, Velocity vs 30-pt cap, Trajectory).",
            "color": ACCENT_INDIGO
        },
        {
            "num": "04",
            "title": "Panel Feedback: Accreditation & Communication",
            "issue": "No printable physical document for NAAC/NBA inspections and no channel for quick mentor-student meeting updates.",
            "v3_solution": "V3 Resolution: PDF Transcript + Bell Space",
            "v3_desc": "Engineered 1-click A4 Printable Transcript with QR verification hash and real-time Meeting Notice space in navbar Bell Icon.",
            "color": ACCENT_GOLD
        }
    ]

    card_w = Inches(2.78)
    card_h = Inches(5.3)
    start_x = Inches(0.8)
    spacing = Inches(0.2)

    for i, item in enumerate(feedbacks):
        cx = start_x + i * (card_w + spacing)
        card = add_card(s2, cx, Inches(1.7), card_w, card_h, BG_CARD, item["color"])
        
        tb = s2.shapes.add_textbox(cx + Inches(0.15), Inches(1.85), card_w - Inches(0.3), card_h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = f"ITEM {item['num']}"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = item["color"]

        p_t = tf.add_paragraph()
        p_t.text = item["title"]
        p_t.font.size = Pt(13)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(4)

        p_iss = tf.add_paragraph()
        p_iss.text = f"⚠️ Challenge:\n{item['issue']}"
        p_iss.font.size = Pt(10.5)
        p_iss.font.color.rgb = TEXT_MUTED
        p_iss.space_before = Pt(8)

        p_div = tf.add_paragraph()
        p_div.text = "─────────────────"
        p_div.font.size = Pt(8)
        p_div.font.color.rgb = RGBColor(51, 65, 85)
        p_div.space_before = Pt(10)

        p_sol = tf.add_paragraph()
        p_sol.text = f"✓ {item['v3_solution']}"
        p_sol.font.size = Pt(12)
        p_sol.font.bold = True
        p_sol.font.color.rgb = ACCENT_EMERALD
        p_sol.space_before = Pt(6)

        p_sol_desc = tf.add_paragraph()
        p_sol_desc.text = item["v3_desc"]
        p_sol_desc.font.size = Pt(10.5)
        p_sol_desc.font.color.rgb = TEXT_WHITE
        p_sol_desc.space_before = Pt(4)

    # =========================================================
    # SLIDE 3: PROJECT OBJECTIVES & VERSION 3 SCOPE
    # =========================================================
    s3 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s3)
    add_header(s3, "Project Objectives & Institutional Scope (Creditz v3)")

    objectives = [
        {
            "tag": "ROLE-BASED GOVERNANCE",
            "title": "1. Multi-Role Institutional Architecture",
            "desc": "Provide dedicated, tailored portals for Students, Faculty Mentors, and Head of Department (HOD) with strict Role-Based Access Control (RBAC) ensuring appropriate data privacy and workflow separation.",
            "color": ACCENT_CYAN
        },
        {
            "tag": "MULTIMODAL AI OCR",
            "title": "2. Intelligent Certificate Verification & Discrepancy Checks",
            "desc": "Automate certificate verification using Google Gemini 1.5 Flash Vision OCR to extract recipient name, issuing agency, course, and date, computing an Authenticity Score (0-100%) against student records.",
            "color": ACCENT_INDIGO
        },
        {
            "tag": "POLICY ENGINE",
            "title": "3. Deterministic Credit Ceiling & Domain Caps",
            "desc": "Enforce AICTE continuous development rules mathematically: strict 30 points/semester ceiling (excess recorded as capped) and category maximums (e.g. MOOCs max 50 pts) to eliminate single-category credit farming.",
            "color": ACCENT_EMERALD
        },
        {
            "tag": "FACULTY ADVISORY",
            "title": "4. Faculty Mentoring Desk & Targeted Visual Analytics",
            "desc": "Empower faculty mentors with side-by-side certificate inspection, 1-click approvals, and exclusive visual analytics (category balance donut, velocity threshold chart, 200-pt degree trajectory curve).",
            "color": ACCENT_GOLD
        },
        {
            "tag": "ACCREDITATION & COMM",
            "title": "5. Official PDF Accreditation Transcript & Real-Time Sync",
            "desc": "Deliver 1-click exportable A4 degree clearance transcripts with tamper-evident QR verification hashes and formal sign-offs for NAAC/NBA accreditation, plus real-time meeting notifications in the navbar bell icon.",
            "color": ACCENT_ROSE
        }
    ]

    for i, obj in enumerate(objectives):
        top_pos = Inches(1.68) + i * Inches(1.08)
        card = add_card(s3, Inches(0.8), top_pos, Inches(11.733), Inches(0.96), BG_CARD, obj["color"])

        tb = s3.shapes.add_textbox(Inches(1.0), top_pos + Inches(0.08), Inches(11.333), Inches(0.8))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = f"[{obj['tag']}]   {obj['title']}"
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = obj["color"]

        p_desc = tf.add_paragraph()
        p_desc.text = obj["desc"]
        p_desc.font.size = Pt(10.5)
        p_desc.font.color.rgb = TEXT_MUTED
        p_desc.space_before = Pt(3)

    # =========================================================
    # SLIDE 4: SYSTEM ARCHITECTURE (3-TIER DESIGN)
    # =========================================================
    s4 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s4)
    add_header(s4, "System Architecture: 3-Tier Layered Design")

    # Left: Text description card
    add_card(s4, Inches(0.8), Inches(1.7), Inches(5.3), Inches(5.3), BG_CARD, ACCENT_CYAN)
    tb = s4.shapes.add_textbox(Inches(1.0), Inches(1.85), Inches(4.9), Inches(5.0))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "ARCHITECTURE SPECIFICATIONS"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN

    spec_items = [
        ("Presentation Layer", "React 19 Single Page App with TypeScript, Tailwind CSS v4, Lucide icons, and window-level vertical scrolling with responsive desktop/mobile navigation drawers."),
        ("Application Backend", "Node.js Express REST API coordinating JWT authentication, Multer binary multipart uploads, real-time notification endpoints, and CORS security."),
        ("Deterministic Rules Engine", "Independent mathematical module strictly enforcing the 30 pts/semester continuous development ceiling and category-specific maximum caps."),
        ("AI Multimodal Vision Engine", "Google Gemini 1.5 Flash Vision via official SDK analyzing certificate buffers with smart deterministic heuristic fallback."),
        ("Persistence Layer", "Relational SQLite database with Write-Ahead Logging (WAL) mode ensuring ACID transactional integrity and zero setup friction.")
    ]

    for title, desc in spec_items:
        p_t = tf.add_paragraph()
        p_t.text = f"• {title}:"
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(8)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_before = Pt(2)

    # Right: Architecture diagram
    arch_path = os.path.join(ASSETS_DIR, "architecture_diagram.jpg")
    if os.path.exists(arch_path):
        add_card(s4, Inches(6.3), Inches(1.7), Inches(6.233), Inches(5.3), BG_CARD_LIGHT, ACCENT_INDIGO)
        s4.shapes.add_picture(arch_path, Inches(6.4), Inches(1.8), width=Inches(6.033), height=Inches(5.1))

    # =========================================================
    # SLIDE 5: DATABASE SCHEMA & ER MODEL
    # =========================================================
    s5 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s5)
    add_header(s5, "Relational Database Schema & Entity-Relationship Model")

    # Left: Text description card
    add_card(s5, Inches(0.8), Inches(1.7), Inches(5.3), Inches(5.3), BG_CARD, ACCENT_INDIGO)
    tb = s5.shapes.add_textbox(Inches(1.0), Inches(1.85), Inches(4.9), Inches(5.0))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "CORE RELATIONAL ENTITIES"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_INDIGO

    db_items = [
        ("Users Entity", "Central identity management storing Student, Mentor, and HOD records with department FK, assigned mentor FK, USN roll number, CGPA, and semester."),
        ("Submissions Entity", "Tracks student certificate uploads, claimed category, file URL, status ('pending', 'approved', 'rejected'), awarded points, semester, and AI audit JSON."),
        ("Activity Schema & Categories", "Institutional catalog of recognized activities, default points, verification criteria, and category domain maximum caps (e.g. max 60 pts technical certs)."),
        ("Notifications Entity", "Stores real-time institutional notices, sender/recipient IDs, meeting times, venues, and read status for seamless HOD-Mentor-Student communication."),
        ("Student Marks Entity", "Stores semester-wise CIE internal exam scores, lab marks, and SGPA calculations for holistic mentor academic guidance.")
    ]

    for title, desc in db_items:
        p_t = tf.add_paragraph()
        p_t.text = f"• {title}:"
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(8)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_before = Pt(2)

    # Right: ER diagram
    er_path = os.path.join(ASSETS_DIR, "database_er_diagram.jpg")
    if os.path.exists(er_path):
        add_card(s5, Inches(6.3), Inches(1.7), Inches(6.233), Inches(5.3), BG_CARD_LIGHT, ACCENT_CYAN)
        s5.shapes.add_picture(er_path, Inches(6.4), Inches(1.8), width=Inches(6.033), height=Inches(5.1))

    # =========================================================
    # SLIDE 6: END-TO-END OPERATIONAL LIFECYCLE
    # =========================================================
    s6 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s6)
    add_header(s6, "End-to-End Operational Lifecycle & Verification Flow")

    # Lifecycle Diagram Image
    life_path = os.path.join(ASSETS_DIR, "platform_lifecycle.jpg")
    if os.path.exists(life_path):
        add_card(s6, Inches(0.8), Inches(1.7), Inches(11.733), Inches(5.3), BG_CARD_LIGHT, ACCENT_CYAN)
        s6.shapes.add_picture(life_path, Inches(0.9), Inches(1.8), width=Inches(11.533), height=Inches(5.1))

    # =========================================================
    # SLIDE 7: MULTIMODAL AI VISION & DETERMINISTIC POLICY ENGINE
    # =========================================================
    s7 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s7)
    add_header(s7, "Multimodal AI Vision Inspection & Deterministic Rules Engine")

    # Left: Text card
    add_card(s7, Inches(0.8), Inches(1.7), Inches(5.3), Inches(5.3), BG_CARD, ACCENT_EMERALD)
    tb = s7.shapes.add_textbox(Inches(1.0), Inches(1.85), Inches(4.9), Inches(5.0))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "VERIFICATION MECHANICS"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_EMERALD

    ai_items = [
        ("Multimodal OCR Scanning", "Google Gemini 1.5 Flash Vision reads binary document buffers (PDF, PNG, JPG), extracting student name, course title, issuing body, and completion date."),
        ("Cross-Verification Discrepancy Check", "Compares extracted text against database profile to flag mismatched recipient names, invalid completion dates, or suspicious template patterns."),
        ("Authenticity Confidence Score", "Computes an automated authenticity metric (0-100%) and generates plain-English audit flags for mentor evaluation."),
        ("Deterministic Semester Ceiling", "Strictly caps counted activity credits to 30 points per semester. Excess credits are safely recorded as capped to mandate steady learning."),
        ("Offline Heuristic Fallback", "Internal smart vision heuristic ensures 100% platform uptime even when internet connection or external API tokens are unavailable.")
    ]

    for title, desc in ai_items:
        p_t = tf.add_paragraph()
        p_t.text = f"✓ {title}:"
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(8)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_before = Pt(2)

    # Right: AI Vision graphic
    ai_img_path = os.path.join(ASSETS_DIR, "ai_vision_ocr.jpg")
    if os.path.exists(ai_img_path):
        add_card(s7, Inches(6.3), Inches(1.7), Inches(6.233), Inches(5.3), BG_CARD_LIGHT, ACCENT_CYAN)
        s7.shapes.add_picture(ai_img_path, Inches(6.4), Inches(1.8), width=Inches(6.033), height=Inches(5.1))

    # =========================================================
    # SLIDE 8: ACADEMIC LITERATURE SURVEY SUMMARY
    # =========================================================
    s8 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s8)
    add_header(s8, "Academic Literature Survey Summary (Clean Baseline)")

    lit_papers = [
        {
            "cite": "Mishra et al. (2026, IEEE Transactions)",
            "title": "AI-Enhanced Blockchain-Based Certificate Verification",
            "finding": "Hybrid CNN-BiLSTM architecture achieving 98.3% accuracy in visual and semantic certificate forgery detection.",
            "relevance": "Direct theoretical foundation for Creditz's multimodal OCR pipeline and cross-field discrepancy checking."
        },
        {
            "cite": "Nguyen et al. (2025, IEEE Access)",
            "title": "Knowledge Graph Framework for Degree Pathway Recommendations",
            "finding": "Semantic representation of course prerequisites, curriculum milestones, and institutional constraint enforcement.",
            "relevance": "Informed Creditz's domain category cap structure and semester credit velocity tracking."
        },
        {
            "cite": "Chen et al. (2018, IEEE Transactions on Software Engineering)",
            "title": "DRLGENCERT: Automated Testing of Certificate Verification",
            "finding": "Reinforcement learning for certificate feature extraction, boundary case exploration, and discrepancy detection.",
            "relevance": "Guided the automated validation rules for issuing body matching and date range checks."
        },
        {
            "cite": "Zhang et al. (2024, IEEE Transactions on Learning Technologies)",
            "title": "Temporal Point Process Model for Academic Progression",
            "finding": "Models learning motivation cycles and temporal credit accumulation patterns across undergraduate programs.",
            "relevance": "Empirical justification for enforcing the AICTE 30-point continuous development semester ceiling."
        },
        {
            "cite": "Edge et al. (2024, Microsoft Research)",
            "title": "From Local to Global: Graph RAG Summarization",
            "finding": "Demonstrated that grounded contextual graphs eliminate LLM hallucinations during document verification.",
            "relevance": "Reinforces Creditz's deterministic schema grounding over raw generative AI outputs."
        }
    ]

    for i, paper in enumerate(lit_papers):
        top_pos = Inches(1.68) + i * Inches(1.08)
        card = add_card(s8, Inches(0.8), top_pos, Inches(11.733), Inches(0.96), BG_CARD, ACCENT_INDIGO)

        tb = s8.shapes.add_textbox(Inches(1.0), top_pos + Inches(0.06), Inches(11.333), Inches(0.84))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = f"{paper['cite']}  —  {paper['title']}"
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN

        p_f = tf.add_paragraph()
        p_f.text = f"Key Finding: {paper['finding']}  |  Creditz Alignment: {paper['relevance']}"
        p_f.font.size = Pt(10)
        p_f.font.color.rgb = TEXT_MUTED
        p_f.space_before = Pt(3)

    # =========================================================
    # SLIDE 9: ROLE 1 - STUDENT DASHBOARD & CLEARANCE PORTAL
    # =========================================================
    s9 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s9)
    add_header(s9, "Role 1: Student Degree Clearance Portal (Version 3 Minimalized UI)")

    # Left: Text details
    add_card(s9, Inches(0.8), Inches(1.7), Inches(4.8), Inches(5.3), BG_CARD, ACCENT_EMERALD)
    tb = s9.shapes.add_textbox(Inches(1.0), Inches(1.85), Inches(4.4), Inches(5.0))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "STUDENT CAPABILITIES (V3)"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_EMERALD

    std_feats = [
        ("200-Point Clearance Meter", "Live visual gauge tracking total approved credits toward graduation with milestone tiers (Bronze 50, Silver 100, Gold 150, Diamond 200)."),
        ("1-Click Official PDF Transcript", "Prominent button opening the official A4 degree transcript modal with verification hash for instant print and download."),
        ("Current Semester Focus Card", "Minimalized card displaying current semester progress vs the 30 pts/sem limit, with expandable 8-semester historical drawer."),
        ("Plain-English Status Badges", "Replaced developer jargon with clear labels: 'Digitally Verified & Recorded', 'Under Faculty Review', 'Approved Degree Credits'."),
        ("Interactive Meeting Space", "Direct bell-icon popover to request advisory meetings with faculty mentor and view scheduled sessions.")
    ]

    for title, desc in std_feats:
        p_t = tf.add_paragraph()
        p_t.text = f"• {title}:"
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(7)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_before = Pt(2)

    # Right: Screenshot
    std_shot = os.path.join(ASSETS_DIR, "v3_student_dashboard.png")
    if os.path.exists(std_shot):
        add_card(s9, Inches(5.8), Inches(1.7), Inches(6.733), Inches(5.3), BG_CARD_LIGHT, ACCENT_CYAN)
        s9.shapes.add_picture(std_shot, Inches(5.9), Inches(1.8), width=Inches(6.533), height=Inches(5.1))

    # =========================================================
    # SLIDE 10: OFFICIAL INSTITUTIONAL PDF CREDIT REPORT
    # =========================================================
    s10 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s10)
    add_header(s10, "Institutional Innovation: 1-Click Official PDF Credit Report")

    # Left: Text details
    add_card(s10, Inches(0.8), Inches(1.7), Inches(4.8), Inches(5.3), BG_CARD, ACCENT_CYAN)
    tb = s10.shapes.add_textbox(Inches(1.0), Inches(1.85), Inches(4.4), Inches(5.0))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "ACCREDITATION REPORT SPECS"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN

    pdf_feats = [
        ("NBA & NAAC Institutional Letterhead", "Formally formatted with institution title, accreditation status (A++ Grade), state university affiliation, and CSE department seal."),
        ("Unique Verification Hash & QR Code", "Generates a unique tamper-evident verification reference string (CRD-CSE-1RV21CS101-PCW9QU) for instant physical document validation."),
        ("Continuous Learning Ceiling Breakdown", "Differentiates Total Approved Points (125 pts) from Effective Degree Points (85 pts) and Capped Excess (+40 pts) per AICTE rules."),
        ("Category Domain Compliance Table", "Verifies compliance against institutional caps across Community Service, Hackathons, Internships, and Technical Certifications."),
        ("Official Sign-off Section", "Dual formal authorization blocks with designations for Faculty Mentor and Head of Department for graduation audit portfolios.")
    ]

    for title, desc in pdf_feats:
        p_t = tf.add_paragraph()
        p_t.text = f"✓ {title}:"
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(7)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_before = Pt(2)

    # Right: Screenshot
    pdf_shot = os.path.join(ASSETS_DIR, "v3_pdf_transcript_modal.png")
    if os.path.exists(pdf_shot):
        add_card(s10, Inches(5.8), Inches(1.7), Inches(6.733), Inches(5.3), BG_CARD_LIGHT, ACCENT_INDIGO)
        s10.shapes.add_picture(pdf_shot, Inches(5.9), Inches(1.8), width=Inches(6.533), height=Inches(5.1))

    # =========================================================
    # SLIDE 11: ROLE 2 - FACULTY MENTOR CONSOLE & REVIEW QUEUE
    # =========================================================
    s11 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s11)
    add_header(s11, "Role 2: Faculty Mentor Advisory & Verification Console")

    # Left: Text details
    add_card(s11, Inches(0.8), Inches(1.7), Inches(4.8), Inches(5.3), BG_CARD, ACCENT_INDIGO)
    tb = s11.shapes.add_textbox(Inches(1.0), Inches(1.85), Inches(4.4), Inches(5.0))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "MENTOR CONSOLE CAPABILITIES"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_INDIGO

    mentor_feats = [
        ("Action-Oriented Dashboard", "Replaced crowded 10-student card grid with 2 clean shortcut cards (Assigned Mentees & Mentee Academic Marks) and prominent Pending Review alerts."),
        ("Pending Certificate Queue", "Instant visibility into unreviewed student submissions (e.g. AWS Cloud Certification) requiring faculty signature and points allocation."),
        ("Side-by-Side Proof Viewer", "Inspects uploaded certificate image/PDF alongside AI multimodal OCR extraction fields and authenticity confidence metrics."),
        ("1-Click Verification Decisions", "Approve, reject, or request revisions with structured faculty feedback recorded in student timeline."),
        ("Holistic Mentee Monitoring", "Track academic semester marks (CIE, labs, SGPA) alongside co-curricular points to ensure balanced student development.")
    ]

    for title, desc in mentor_feats:
        p_t = tf.add_paragraph()
        p_t.text = f"• {title}:"
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(7)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_before = Pt(2)

    # Right: Screenshot
    mentor_shot = os.path.join(ASSETS_DIR, "v3_mentor_dashboard.png")
    if os.path.exists(mentor_shot):
        add_card(s11, Inches(5.8), Inches(1.7), Inches(6.733), Inches(5.3), BG_CARD_LIGHT, ACCENT_EMERALD)
        s11.shapes.add_picture(mentor_shot, Inches(5.9), Inches(1.8), width=Inches(6.533), height=Inches(5.1))

    # =========================================================
    # SLIDE 12: FACULTY MENTOR VISUAL ANALYTICS (EXCLUSIVE TO MENTOR)
    # =========================================================
    s12 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s12)
    add_header(s12, "Faculty Mentor Visual Analytics (Targeted Mentorship Intelligence)")

    # Left: Text details
    add_card(s12, Inches(0.8), Inches(1.7), Inches(4.8), Inches(5.3), BG_CARD, ACCENT_GOLD)
    tb = s12.shapes.add_textbox(Inches(1.0), Inches(1.85), Inches(4.4), Inches(5.0))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "ANALYTICS DESK HIGHLIGHTS"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_GOLD

    vis_feats = [
        ("Isolated to Faculty Mentors", "Visual charts intentionally removed from student views to avoid confusion, and consolidated into an in-depth Faculty Advisory workspace."),
        ("Category Domain Donut Chart", "Visualizes mentee points breakdown across all 6 activity domains, immediately exposing category cap saturation or domain deficits."),
        ("Semester Credit Velocity Chart", "Bar chart plotting semester-wise credits against the red dashed 30-point ceiling line, highlighting approved credits vs capped excess."),
        ("200-Point Degree Trajectory Curve", "Milestone progress gauge (Bronze 50, Silver 100, Gold 150, Diamond 200) with detailed semester audit log table."),
        ("Proactive Academic Intervention", "Enables mentors to identify students falling behind in activity credits before graduation year deadlines.")
    ]

    for title, desc in vis_feats:
        p_t = tf.add_paragraph()
        p_t.text = f"✓ {title}:"
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(7)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_before = Pt(2)

    # Right: Screenshot
    vis_shot = os.path.join(ASSETS_DIR, "v3_mentor_visual_analytics.png")
    if os.path.exists(vis_shot):
        add_card(s12, Inches(5.8), Inches(1.7), Inches(6.733), Inches(5.3), BG_CARD_LIGHT, ACCENT_CYAN)
        s12.shapes.add_picture(vis_shot, Inches(5.9), Inches(1.8), width=Inches(6.533), height=Inches(5.1))

    # =========================================================
    # SLIDE 13: REAL-TIME MEETING & NOTICE SPACE (BELL ICON)
    # =========================================================
    s13 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s13)
    add_header(s13, "Real-Time Meeting & Advisory Notice Space (Navbar Bell Icon)")

    # Left: Text details
    add_card(s13, Inches(0.8), Inches(1.7), Inches(4.8), Inches(5.3), BG_CARD, ACCENT_ROSE)
    tb = s13.shapes.add_textbox(Inches(1.0), Inches(1.85), Inches(4.4), Inches(5.0))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "COMMUNICATION HIGHLIGHTS"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_ROSE

    bell_feats = [
        ("Zero-Clutter Navbar Integration", "Clean message space housed entirely within the navbar bell icon popover without cluttering dashboards or sidebar navigation."),
        ("HOD to Mentors Communication", "Head of Department can broadcast urgent circulars, accreditation deadlines, and scheduled faculty review meetings."),
        ("Mentor to Mentees Advisories", "Mentors schedule physical certificate verification meetings, specify room/venue (e.g. Faculty Wing B, Room 204), and set meeting times."),
        ("Student Meeting Requests", "Students can initiate meeting requests with their assigned faculty mentor directly from the popover with a 1-click form."),
        ("Real-Time Synchronization", "Dynamic unread badge counter (pulsing red alert) and real-time polling updates keep all parties aligned without page reloads.")
    ]

    for title, desc in bell_feats:
        p_t = tf.add_paragraph()
        p_t.text = f"• {title}:"
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(7)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_before = Pt(2)

    # Right: Screenshot
    bell_shot = os.path.join(ASSETS_DIR, "v3_bell_notifications.png")
    if os.path.exists(bell_shot):
        add_card(s13, Inches(5.8), Inches(1.7), Inches(6.733), Inches(5.3), BG_CARD_LIGHT, ACCENT_GOLD)
        s13.shapes.add_picture(bell_shot, Inches(5.9), Inches(1.8), width=Inches(6.533), height=Inches(5.1))

    # =========================================================
    # SLIDE 14: ROLE 3 - HOD GOVERNANCE & DEPARTMENT CLEARANCE
    # =========================================================
    s14 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s14)
    add_header(s14, "Role 3: Head of Department (HOD) Governance & Oversight")

    # Left: Text details
    add_card(s14, Inches(0.8), Inches(1.7), Inches(4.8), Inches(5.3), BG_CARD, ACCENT_CYAN)
    tb = s14.shapes.add_textbox(Inches(1.0), Inches(1.85), Inches(4.4), Inches(5.0))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "HOD GOVERNANCE HIGHLIGHTS"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN

    hod_feats = [
        ("Department Clearance Analytics", "Live department-level overview tracking total enrolled students (8), faculty mentors (2), average points (31.9/200), and graduation clearance rate."),
        ("Faculty Mentors Summary", "Real-time visibility into mentor workloads, mentee-to-faculty allocations, and pending review counts to prevent evaluation bottlenecks."),
        ("Category Point Distribution", "Aggregated analysis of points earned across Technical Certifications, Hackathons, Internships, Volunteering, and Sports domains."),
        ("De-jargonized Rule Management", "Simplified 'Point Rules & Categories' management console allowing HOD to adjust category maximum caps dynamically."),
        ("1-Click Accreditation Export", "Instant CSV and consolidated transcript exports for AICTE, NAAC, and NBA statutory compliance committee visits.")
    ]

    for title, desc in hod_feats:
        p_t = tf.add_paragraph()
        p_t.text = f"• {title}:"
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(7)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_before = Pt(2)

    # Right: Screenshot
    hod_shot = os.path.join(ASSETS_DIR, "v3_hod_dashboard.png")
    if os.path.exists(hod_shot):
        add_card(s14, Inches(5.8), Inches(1.7), Inches(6.733), Inches(5.3), BG_CARD_LIGHT, ACCENT_INDIGO)
        s14.shapes.add_picture(hod_shot, Inches(5.9), Inches(1.8), width=Inches(6.533), height=Inches(5.1))

    # =========================================================
    # SLIDE 15: TECHNOLOGY STACK & V3 ENGINEERING HIGHLIGHTS
    # =========================================================
    s15 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s15)
    add_header(s15, "Technology Stack & Version 3 Engineering Architecture")

    tech_cards = [
        {
            "tier": "FRONTEND PRESENTATION",
            "title": "React 19 & Tailwind CSS v4",
            "stack": "React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide Icons, Framer Motion",
            "desc": "Responsive SPA with zero scroll traps; dynamic role-tailored dashboards, accessible modal dialogs, and native CSS print stylesheets for official PDF generation.",
            "color": ACCENT_CYAN
        },
        {
            "tier": "APPLICATION RUNTIME",
            "title": "Node.js 20/22 & Express REST API",
            "stack": "Node.js (ESM), Express 4.21, TypeScript (tsx), JWT Authentication, Multer",
            "desc": "High-throughput API server handling authenticated endpoints, binary file uploads, deterministic rule calculations, and real-time meeting notification polling.",
            "color": ACCENT_EMERALD
        },
        {
            "tier": "ARTIFICIAL INTELLIGENCE",
            "title": "Multimodal Vision OCR Engine",
            "stack": "Google Gemini 1.5 Flash Vision (@google/genai SDK) + Smart Local Fallback",
            "desc": "High-speed multimodal document understanding model extracting candidate name, issuing body, and dates, paired with an offline heuristic fallback for 100% reliability.",
            "color": ACCENT_INDIGO
        },
        {
            "tier": "PERSISTENCE & RELIABILITY",
            "title": "SQLite WAL Mode (Write-Ahead Logging)",
            "stack": "better-sqlite3 v12.11 with WAL Mode & Immediate Transactions",
            "desc": "ACID-compliant relational database with concurrent reader/writer support, sub-millisecond query latency, and zero-configuration single-file portability.",
            "color": ACCENT_GOLD
        }
    ]

    card_w = Inches(5.7)
    card_h = Inches(2.5)
    
    positions = [
        (Inches(0.8), Inches(1.7)),
        (Inches(6.8), Inches(1.7)),
        (Inches(0.8), Inches(4.45)),
        (Inches(6.8), Inches(4.45))
    ]

    for i, t in enumerate(tech_cards):
        x, y = positions[i]
        add_card(s15, x, y, card_w, card_h, BG_CARD, t["color"])

        tb = s15.shapes.add_textbox(x + Inches(0.2), y + Inches(0.15), card_w - Inches(0.4), card_h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = f"[{t['tier']}]"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = t["color"]

        p_t = tf.add_paragraph()
        p_t.text = t["title"]
        p_t.font.size = Pt(14)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(3)

        p_s = tf.add_paragraph()
        p_s.text = f"Stack: {t['stack']}"
        p_s.font.size = Pt(10)
        p_s.font.bold = True
        p_s.font.color.rgb = ACCENT_CYAN
        p_s.space_before = Pt(4)

        p_d = tf.add_paragraph()
        p_d.text = t["desc"]
        p_d.font.size = Pt(10)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_before = Pt(3)

    # =========================================================
    # SLIDE 16: CONCLUSION & ROADMAP
    # =========================================================
    s16 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s16)
    add_header(s16, "Conclusion & Future Roadmap")

    # Left: V3 Achievements Card
    add_card(s16, Inches(0.8), Inches(1.7), Inches(5.7), Inches(5.3), BG_CARD, ACCENT_EMERALD)
    tb_ach = s16.shapes.add_textbox(Inches(1.0), Inches(1.85), Inches(5.3), Inches(5.0))
    tf_ach = tb_ach.text_frame
    tf_ach.word_wrap = True

    p = tf_ach.paragraphs[0]
    p.text = "KEY ACHIEVEMENTS IN PROTOTYPE V3"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_EMERALD

    achievements = [
        ("Full Alignment with Panel Feedback", "Successfully purged cognitive clutter and replaced intimidating IT jargon with clear, non-IT friendly institutional language."),
        ("1-Click Official PDF Clearance Transcript", "Engineered A4 printable accredited transcript with tamper-evident QR verification hash and faculty/HOD sign-off blocks."),
        ("Faculty-Exclusive Visual Analytics", "Equipped mentors with multi-dimensional data analytics (category donut, velocity against 30-pt cap, degree trajectory) while simplifying student views."),
        ("Real-time Meeting & Notice Space", "Added real-time notification popover to navbar bell icon enabling seamless HOD ➔ Mentor ➔ Student meeting coordination."),
        ("Deterministic AICTE Compliance", "Mathematically guarantees continuous development via 30 pts/semester cap and category ceilings with Google Gemini 1.5 Flash Vision OCR.")
    ]

    for title, desc in achievements:
        p_t = tf_ach.add_paragraph()
        p_t.text = f"✓ {title}:"
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(7)

        p_d = tf_ach.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_before = Pt(2)

    # Right: Future Scope Card
    add_card(s16, Inches(6.8), Inches(1.7), Inches(5.7), Inches(5.3), BG_CARD, ACCENT_INDIGO)
    tb_fut = s16.shapes.add_textbox(Inches(7.0), Inches(1.85), Inches(5.3), Inches(5.0))
    tf_fut = tb_fut.text_frame
    tf_fut.word_wrap = True

    p = tf_fut.paragraphs[0]
    p.text = "FUTURE ROADMAP & PRODUCTION EXPANSION"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_INDIGO

    roadmap = [
        ("National DigiLocker API Integration", "Direct integration with India's DigiLocker / NAD system for automated zero-upload certificate verification directly from issuers."),
        ("Blockchain Credential Anchoring", "Anchor finalized degree clearance hashes on Hyperledger or Ethereum testnet for tamper-proof post-graduation verification by employers."),
        ("Native Mobile PWA with Push Alerts", "Progressive Web App (PWA) with native mobile push notifications for real-time meeting reminders and event registrations."),
        ("Inter-College Activity Point Portability", "Standardized activity credit interchange format allowing seamless credit transfer for lateral entry and university transfer students.")
    ]

    for title, desc in roadmap:
        p_t = tf_fut.add_paragraph()
        p_t.text = f"🚀 {title}:"
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(9)

        p_d = tf_fut.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_before = Pt(3)

    # =========================================================
    # SLIDE 17: THANK YOU & Q&A
    # =========================================================
    s17 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s17)

    # Centered Card
    add_card(s17, Inches(2.2), Inches(1.2), Inches(8.933), Inches(5.1), BG_CARD, ACCENT_CYAN)

    tb_end = s17.shapes.add_textbox(Inches(2.5), Inches(1.6), Inches(8.333), Inches(4.3))
    tf_end = tb_end.text_frame
    tf_end.word_wrap = True

    p = tf_end.paragraphs[0]
    p.text = "Thank You!"
    p.font.size = Pt(46)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p.alignment = PP_ALIGN.CENTER

    p2 = tf_end.add_paragraph()
    p2.text = "CREDITZ (Prototype v3)"
    p2.font.size = Pt(22)
    p2.font.bold = True
    p2.font.color.rgb = ACCENT_CYAN
    p2.space_before = Pt(10)
    p2.alignment = PP_ALIGN.CENTER

    p3 = tf_end.add_paragraph()
    p3.text = "An Intelligent Activity Credit Management & Degree Clearance System"
    p3.font.size = Pt(14)
    p3.font.color.rgb = TEXT_MUTED
    p3.space_before = Pt(6)
    p3.alignment = PP_ALIGN.CENTER

    p4 = tf_end.add_paragraph()
    p4.text = "✨ Open for Evaluation Panel Feedback, Demonstration & Discussion ✨"
    p4.font.size = Pt(15)
    p4.font.bold = True
    p4.font.color.rgb = ACCENT_GOLD
    p4.space_before = Pt(24)
    p4.alignment = PP_ALIGN.CENTER

    p5 = tf_end.add_paragraph()
    p5.text = (
        "Department of Computer Science & Engineering\n"
        "Autonomous Institute of Technology & Sciences"
    )
    p5.font.size = Pt(12)
    p5.font.color.rgb = TEXT_MUTED
    p5.space_before = Pt(18)
    p5.alignment = PP_ALIGN.CENTER

    # Save presentation
    prs.save(OUTPUT_PPTX)
    print(f"Presentation saved successfully to {OUTPUT_PPTX} with {len(prs.slides)} slides!")

if __name__ == "__main__":
    create_presentation()
