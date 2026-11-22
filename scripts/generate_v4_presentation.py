import os
import subprocess
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ---------------------------------------------------------
# CONSTANTS & MODERN COLOR PALETTE
# ---------------------------------------------------------
BG_DARK = RGBColor(11, 19, 43)          # #0B132B Deep Navy
BG_CARD = RGBColor(22, 33, 62)          # #16213E Indigo Card
BG_CARD_LIGHT = RGBColor(30, 41, 59)    # #1E293B Slate Card
BORDER_CYAN = RGBColor(56, 189, 248)    # #38BDF8
BORDER_INDIGO = RGBColor(129, 140, 248) # #818CF8
TEXT_WHITE = RGBColor(255, 255, 255)
TEXT_MUTED = RGBColor(148, 163, 184)    # #94A3B8
TEXT_BODY = RGBColor(226, 232, 240)     # #E2E8F0 High Legibility
ACCENT_CYAN = RGBColor(56, 189, 248)    # #38BDF8
ACCENT_INDIGO = RGBColor(129, 140, 248) # #818CF8
ACCENT_EMERALD = RGBColor(52, 211, 153) # #34D399
ACCENT_GOLD = RGBColor(251, 191, 36)    # #FBBF24
ACCENT_ROSE = RGBColor(251, 113, 133)   # #FB7185
ACCENT_PURPLE = RGBColor(192, 132, 252) # #C084FC

ASSETS_DIR = "/home/gaurish/Desktop/Major/v4/presentation_assets"
OUTPUT_PPTX = "/home/gaurish/Desktop/Major/v4/Creditz_Major_Project_v4_Presentation.pptx"

def create_optimal_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    def set_slide_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_DARK
        bg.line.fill.background()
        return bg

    def add_header(slide, title, category="CREDITZ OPTIMAL SUITE"):
        # Top banner category pill
        pill = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.4), Inches(3.2), Inches(0.32)
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
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.74), Inches(11.733), Inches(0.68))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_WHITE

        # Divider line
        line = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.44), Inches(11.733), Inches(0.02)
        )
        line.fill.solid()
        line.fill.fore_color.rgb = RGBColor(51, 65, 85)
        line.line.fill.background()

    def add_card(slide, left, top, width, height, bg_color=BG_CARD, border_color=None):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        if border_color:
            card.line.color.rgb = border_color
            card.line.width = Pt(1.2)
        else:
            card.line.fill.background()
        return card

    def add_feature_point(tf, title, description, badge_color=ACCENT_CYAN, font_size=11, space_after=10):
        p = tf.add_paragraph()
        p.space_after = Pt(space_after)
        
        # Bold Highlighted Title
        r1 = p.add_run()
        r1.text = f"✔  {title}: "
        r1.font.bold = True
        r1.font.size = Pt(font_size + 0.5)
        r1.font.color.rgb = badge_color

        # Clear description
        r2 = p.add_run()
        r2.text = description
        r2.font.size = Pt(font_size)
        r2.font.color.rgb = TEXT_BODY

    # =========================================================
    # SLIDE 1: HERO TITLE & EXECUTIVE SUMMARY
    # =========================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)

    # Left content card
    add_card(s1, Inches(0.8), Inches(0.8), Inches(6.0), Inches(5.9), BG_CARD, ACCENT_INDIGO)

    b1 = s1.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(1.1), Inches(3.2), Inches(0.36)
    )
    b1.fill.solid()
    b1.fill.fore_color.rgb = RGBColor(49, 46, 129)
    b1.line.color.rgb = ACCENT_CYAN
    p = b1.text_frame.paragraphs[0]
    p.text = "MAJOR PROJECT PRODUCTION V4"
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
    p2.text = "AICTE Activity Points & Degree Clearance Portal"
    p2.font.size = Pt(16)
    p2.font.bold = True
    p2.font.color.rgb = ACCENT_CYAN
    p2.space_before = Pt(6)

    p3 = tf.add_paragraph()
    p3.text = (
        "An intelligent institutional platform unifying mandatory 100/200 activity point governance, "
        "AI-assisted certificate fraud detection, remedial MSE academic mentoring, campus placement readiness, "
        "and autonomous Logisys ERP examination exports."
    )
    p3.font.size = Pt(11.5)
    p3.font.color.rgb = TEXT_MUTED
    p3.space_before = Pt(10)

    p4 = tf.add_paragraph()
    p4.text = "⭐ Key Innovations Highlighted in this Deck:"
    p4.font.size = Pt(12)
    p4.font.bold = True
    p4.font.color.rgb = ACCENT_EMERALD
    p4.space_before = Pt(12)

    p5 = tf.add_paragraph()
    p5.text = (
        "1. Anti-Collusion SHA-256 Duplicate Certificate Prevention\n"
        "2. 10th & 12th / Diploma Records & Placement Eligibility Matrix\n"
        "3. Remedial MSE Academic Mentoring (<40% dip detection)\n"
        "4. Logisys University ERP Export (Course 22CSACT01)\n"
        "5. Multimodal AI Certificate Auditing (Gemini 2.5 Flash)"
    )
    p5.font.size = Pt(11)
    p5.font.color.rgb = TEXT_BODY
    p5.space_before = Pt(6)

    # Team Box
    tb_team = s1.shapes.add_textbox(Inches(1.2), Inches(5.4), Inches(5.2), Inches(1.1))
    tf_team = tb_team.text_frame
    tf_team.word_wrap = True
    pt = tf_team.paragraphs[0]
    pt.text = "ENGINEERING TEAM & ADVISORS:"
    pt.font.size = Pt(9.5)
    pt.font.bold = True
    pt.font.color.rgb = ACCENT_GOLD
    pt2 = tf_team.add_paragraph()
    pt2.text = "Gaurish (nnm23cs077) • Sampath (nnm23cs167) • Sharan (nnm23cs176) • Ronak (nnm23cs153)"
    pt2.font.size = Pt(10)
    pt2.font.color.rgb = TEXT_WHITE
    pt3 = tf_team.add_paragraph()
    pt3.text = "Mentors: Prof. Aishwarya, Prof. Joylin Mendonca, Prof. Pawan Kumar, Dr. Sannidhan M. S."
    pt3.font.size = Pt(9.5)
    pt3.font.color.rgb = TEXT_MUTED

    # Right Hero Image
    hero_path = os.path.join(ASSETS_DIR, "creditz_v3_hero.jpg")
    if os.path.exists(hero_path):
        add_card(s1, Inches(7.05), Inches(0.8), Inches(5.48), Inches(5.9), BG_CARD_LIGHT, ACCENT_CYAN)
        s1.shapes.add_picture(hero_path, Inches(7.15), Inches(0.9), width=Inches(5.28), height=Inches(5.7))

    # =========================================================
    # SLIDE 2: THE CORE PROBLEM & WHY EXISTING METHODS FAIL
    # =========================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    add_header(s2, "The Problem: Why Traditional Activity Management Fails", "PROBLEM CONTEXT")

    # 3 Strategic Challenge Cards
    col_w = Inches(3.75)
    col_h = Inches(5.4)

    # Challenge 1
    add_card(s2, Inches(0.8), Inches(1.6), col_w, col_h, BG_CARD, ACCENT_ROSE)
    tb = s2.shapes.add_textbox(Inches(0.95), Inches(1.75), Inches(3.45), Inches(5.1))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "1. AICTE Regulatory Burden"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = ACCENT_ROSE
    add_feature_point(tf, "Mandatory Graduation Rule", "AICTE & VTU mandate 100/200 non-credit activity points across 8 semesters to confer B.E. degrees.", ACCENT_GOLD, 10.5, 8)
    add_feature_point(tf, "Strict Mathematical Caps", "Enforcing 30 pts/semester ceiling and domain limits (Certs: 60, Hackathons: 60, Internships: 50) is impossible manually.", ACCENT_CYAN, 10.5, 8)
    add_feature_point(tf, "Audit Bottlenecks", "Exhausted faculty mentors sift through physical paper folders at the end of Sem 8, causing graduation delays.", ACCENT_ROSE, 10.5, 8)

    # Challenge 2
    add_card(s2, Inches(4.8), Inches(1.6), col_w, col_h, BG_CARD, ACCENT_GOLD)
    tb = s2.shapes.add_textbox(Inches(4.95), Inches(1.75), Inches(3.45), Inches(5.1))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "2. Academic Fraud & Tampering"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = ACCENT_GOLD
    add_feature_point(tf, "Collusion & Certificate Reuse", "Students share identical PDFs or claim the same online course certificate among multiple peers.", ACCENT_ROSE, 10.5, 8)
    add_feature_point(tf, "Document Tampering", "Photoshop edits, forged serial numbers, and mismatched names slip past manual inspection.", ACCENT_GOLD, 10.5, 8)
    add_feature_point(tf, "Zero Recruiter Verification", "Physical certificates lack scannable cryptographic hashes for external HR verification.", ACCENT_CYAN, 10.5, 8)

    # Challenge 3
    add_card(s2, Inches(8.8), Inches(1.6), col_w, col_h, BG_CARD, ACCENT_CYAN)
    tb = s2.shapes.add_textbox(Inches(8.95), Inches(1.75), Inches(3.45), Inches(5.1))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "3. Isolated Institutional Silos"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN
    add_feature_point(tf, "Disconnected Marks & Placements", "Mentors cannot see whether a mentee meets company cutoffs (CGPA + Points + 10th/12th).", ACCENT_CYAN, 10.5, 8)
    add_feature_point(tf, "Unmonitored Internal Dips", "Students failing Mid-Semester Exams (<40%) go unnoticed with no structured remedial counseling.", ACCENT_GOLD, 10.5, 8)
    add_feature_point(tf, "Manual Exam Office Entry", "Exam clerks waste hundreds of hours manually transcribing student points into Logisys University ERP.", ACCENT_ROSE, 10.5, 8)

    # =========================================================
    # SLIDE 3: WHAT WAS ADDED (THE CRITICAL FEATURE DELTA)
    # =========================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_header(s3, "Executive Summary: What Was Added (The Feature Delta)", "FEATURE INNOVATION")

    # Clean 2-Column Comparison: What was missing vs The Production Solution
    card_w2 = Inches(5.7)
    card_h2 = Inches(5.4)

    # Left: What Was Missing / Legacy Baseline
    add_card(s3, Inches(0.8), Inches(1.6), card_w2, card_h2, BG_CARD, ACCENT_ROSE)
    tb = s3.shapes.add_textbox(Inches(0.95), Inches(1.75), Inches(5.4), Inches(5.1))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "❌ What Was Missing in Legacy / Basic Portals"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = ACCENT_ROSE

    add_feature_point(tf, "No Duplicate Check", "Students could submit identical certificate PDFs or reuse serial numbers across batches.", ACCENT_ROSE, 11, 10)
    add_feature_point(tf, "No Prior Academics", "Missing 10th and 12th / Diploma school records; placement criteria could not check board cutoffs.", ACCENT_ROSE, 11, 10)
    add_feature_point(tf, "Blind Mentorship", "Mentors had zero visibility into failing internal exam marks (<40% in MSE-1/MSE-2).", ACCENT_ROSE, 11, 10)
    add_feature_point(tf, "Disconnected Placements", "Extracurricular credits had no relationship to real-world corporate hiring cutoffs.", ACCENT_ROSE, 11, 10)
    add_feature_point(tf, "Subjective Credit Awards", "Arbitrary points awarded without objective duration metrics (~0.5 pts/hr).", ACCENT_ROSE, 11, 10)
    add_feature_point(tf, "Manual ERP Data Entry", "No integration with autonomous examination software (Logisys ERP).", ACCENT_ROSE, 11, 10)

    # Right: What Creditz Production Engineered
    add_card(s3, Inches(6.8), Inches(1.6), Inches(5.733), card_h2, BG_CARD, ACCENT_EMERALD)
    tb = s3.shapes.add_textbox(Inches(6.95), Inches(1.75), Inches(5.4), Inches(5.1))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "✅ Newly Added Production Features in Creditz"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = ACCENT_EMERALD

    add_feature_point(tf, "SHA-256 Anti-Collusion Engine", "Binary file hashing + semantic credential registry blocks duplicate submissions instantly.", ACCENT_EMERALD, 11, 10)
    add_feature_point(tf, "10th & 12th / Diploma Module", "Full Pre-University schooling records integrated directly with placement drive criteria.", ACCENT_EMERALD, 11, 10)
    add_feature_point(tf, "Remedial MSE Academic Counseling", "Automated alert badges for sub-40% marks with logged action plans and mentee alerts.", ACCENT_EMERALD, 11, 10)
    add_feature_point(tf, "Campus Placement Eligibility Matrix", "Real-time qualification tracker for Google, Amazon, Microsoft, Cisco, TCS with 1-click reminders.", ACCENT_EMERALD, 11, 10)
    add_feature_point(tf, "Transparent Points/Hour Model", "Objective formula (~0.5 pts/hr) with preset selectors (20h/40h/80h) and rulebook PDF parser.", ACCENT_EMERALD, 11, 10)
    add_feature_point(tf, "1-Click Logisys ERP & Sheet Export", "Automated export mapping Course 22CSACT01 with letter grades (O, A+, A, B+, B, F).", ACCENT_EMERALD, 11, 10)

    # =========================================================
    # SLIDE 4: FEATURE 1 - DUPLICATE CERTIFICATE & COLLUSION PREVENTION
    # =========================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    add_header(s4, "Feature 1: Anti-Collusion Duplicate Certificate Prevention", "ACADEMIC INTEGRITY")

    # Left: Clear bullet card
    add_card(s4, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.4), BG_CARD, ACCENT_ROSE)
    tb = s4.shapes.add_textbox(Inches(0.95), Inches(1.75), Inches(5.3), Inches(5.1))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Dual-Layer Anti-Fraud Architecture"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = ACCENT_ROSE

    add_feature_point(tf, "Binary Document Hashing (SHA-256)", "Every uploaded file (PDF/Image) is hashed into an exact SHA-256 signature upon upload and indexed in the database.", ACCENT_CYAN, 11, 10)
    add_feature_point(tf, "Self-Duplicate Warning", "If a student attempts to upload the same certificate twice, the UI blocks submission: 'You have already submitted this exact certificate'.", ACCENT_GOLD, 11, 10)
    add_feature_point(tf, "Cross-Student Collusion Alert", "If a student uploads another student's document, an Academic Integrity Alert triggers immediately, citing the original owner's name and USN.", ACCENT_ROSE, 11, 10)
    add_feature_point(tf, "Semantic Credential Registry", "Even if a student alters visual pixels to defeat file hashing, AI extracts the certificate serial ID and blocks duplicate claims.", ACCENT_INDIGO, 11, 10)
    add_feature_point(tf, "Hard Server Enforcement", "The UI locks the submit button, and the backend route returns HTTP 409 Conflict with zero bypass opportunity.", ACCENT_EMERALD, 11, 10)

    # Right: Screenshot of review console
    shot_path = os.path.join(ASSETS_DIR, "screenshot_mentor_review.png")
    if os.path.exists(shot_path):
        add_card(s4, Inches(6.6), Inches(1.6), Inches(5.933), Inches(5.4), BG_CARD_LIGHT, ACCENT_CYAN)
        s4.shapes.add_picture(shot_path, Inches(6.7), Inches(1.7), width=Inches(5.733), height=Inches(5.2))

    # =========================================================
    # SLIDE 5: FEATURE 2 - 10TH & 12TH / DIPLOMA SCHOOLING INTEGRATION
    # =========================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    add_header(s5, "Feature 2: Pre-University (10th & 12th / Diploma) Academic Records", "PRIOR ACADEMICS")

    add_card(s5, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.4), BG_CARD, ACCENT_INDIGO)
    tb = s5.shapes.add_textbox(Inches(0.95), Inches(1.75), Inches(5.3), Inches(5.1))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Pre-University Schooling Console"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = ACCENT_INDIGO

    add_feature_point(tf, "Database Integration", "The `users` schema stores `tenth_percentage`, `tenth_board`, `tenth_year`, `twelfth_percentage`, `twelfth_board`, and `twelfth_year`.", ACCENT_CYAN, 11, 10)
    add_feature_point(tf, "PUC vs Polytechnic Diploma Toggle", "Supports lateral-entry students: students can switch between standard 12th/PUC and 3-Year Polytechnic Technical Diploma (DTE).", ACCENT_GOLD, 11, 10)
    add_feature_point(tf, "Student Self-Service Console", "Located in UpdateMarks.tsx, allowing students to submit board details (CBSE, ICSE, State Boards), passing years, and aggregate marks.", ACCENT_EMERALD, 11, 10)
    add_feature_point(tf, "Placement Cutoff Requirement", "Tier-1 companies (Amazon, Microsoft, TCS) enforce strict 10th & 12th criteria (e.g. 70%+ across all exams) alongside engineering CGPA.", ACCENT_ROSE, 11, 10)
    add_feature_point(tf, "Profile & Audit Visibility", "Displayed on the student ProfilePage and accessible to mentors during recruitment clearance.", ACCENT_INDIGO, 11, 10)

    # Right: Screenshot of 10th & 12th marks update
    shot_path = os.path.join(ASSETS_DIR, "screenshot_10th_12th_marks.png")
    if os.path.exists(shot_path):
        add_card(s5, Inches(6.6), Inches(1.6), Inches(5.933), Inches(5.4), BG_CARD_LIGHT, ACCENT_CYAN)
        s5.shapes.add_picture(shot_path, Inches(6.7), Inches(1.7), width=Inches(5.733), height=Inches(5.2))

    # =========================================================
    # SLIDE 6: FEATURE 3 - CAMPUS PLACEMENT ELIGIBILITY MATRIX
    # =========================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)
    add_header(s6, "Feature 3: Campus Placement Eligibility Matrix (Prof. Pawan Kumar)", "EMPLOYABILITY")

    add_card(s6, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.4), BG_CARD, ACCENT_EMERALD)
    tb = s6.shapes.add_textbox(Inches(0.95), Inches(1.75), Inches(5.3), Inches(5.1))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Extracurriculars Aligned to Employability"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = ACCENT_EMERALD

    add_feature_point(tf, "Tri-Factor Qualification Engine", "Correlates student CGPA, accumulated Activity Points, and 10th/12th percentages against corporate hiring cutoffs.", ACCENT_CYAN, 11, 10)
    add_feature_point(tf, "Live Tier-1 Corporate Drives", "Maps active drives: Google (34 LPA, 8.5 CGPA, 80 pts), Microsoft (28.5 LPA), Amazon (22 LPA), Cisco (18 LPA), TCS/Infosys (9.5 LPA).", ACCENT_GOLD, 11, 10)
    add_feature_point(tf, "Diagnostic Status Badges", "Categorizes students into 'Eligible', 'Short of Points', 'Short of CGPA', 'Short of 10th/12th', or 'Missing 10th/12th Marks'.", ACCENT_ROSE, 11, 10)
    add_feature_point(tf, "1-Click Deficit Reminder Dispatch", "Mentors can click 'Remind Mentee' to dispatch an actionable notification showing exact shortfall metrics before registration closes.", ACCENT_EMERALD, 11, 10)
    add_feature_point(tf, "Actionable Student Guidance", "Transforms point collection from a chore into a direct asset for high-package campus placement.", ACCENT_INDIGO, 11, 10)

    # Right: Screenshot of placement matrix
    shot_path = os.path.join(ASSETS_DIR, "screenshot_placement_matrix.png")
    if os.path.exists(shot_path):
        add_card(s6, Inches(6.6), Inches(1.6), Inches(5.933), Inches(5.4), BG_CARD_LIGHT, ACCENT_CYAN)
        s6.shapes.add_picture(shot_path, Inches(6.7), Inches(1.7), width=Inches(5.733), height=Inches(5.2))

    # =========================================================
    # SLIDE 7: FEATURE 4 - REMEDIAL MSE ACADEMIC MENTORING
    # =========================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    add_header(s7, "Feature 4: Remedial MSE Academic Mentoring & Counseling", "ACADEMIC ADVISORY")

    add_card(s7, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.4), BG_CARD, ACCENT_GOLD)
    tb = s7.shapes.add_textbox(Inches(0.95), Inches(1.75), Inches(5.3), Inches(5.1))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Early Academic Warning & Remediation"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = ACCENT_GOLD

    add_feature_point(tf, "Sub-40% Performance Dip Detection", "Mentors automatically receive visual alert badges when mentees score below 40% (<12/30) in Mid-Semester Exams (MSE-1 / MSE-2).", ACCENT_ROSE, 11, 10)
    add_feature_point(tf, "Structured Remedial Counseling Modal", "Mentors open CounselingModal.tsx to diagnose root causes (subject difficulty, personal issues) and assign tutorial remedial plans.", ACCENT_CYAN, 11, 10)
    add_feature_point(tf, "Automated Notification Dispatch", "Logging the intervention records the action plan in `counseling_logs` and instantly dispatches an in-portal alert to the student.", ACCENT_EMERALD, 11, 10)
    add_feature_point(tf, "Marks Revision Workflow", "Mentors have inline controls to update internal marks once remedial tests or assignments are successfully cleared.", ACCENT_INDIGO, 11, 10)
    add_feature_point(tf, "Holistic Advisory Impact", "Elevates the portal from a standalone point tracker into an integrated, proactive student success platform.", ACCENT_GOLD, 11, 10)

    # Right: Screenshot of MSE student marks
    shot_path = os.path.join(ASSETS_DIR, "screenshot_mentor_mse_marks.png")
    if os.path.exists(shot_path):
        add_card(s7, Inches(6.6), Inches(1.6), Inches(5.933), Inches(5.4), BG_CARD_LIGHT, ACCENT_CYAN)
        s7.shapes.add_picture(shot_path, Inches(6.7), Inches(1.7), width=Inches(5.733), height=Inches(5.2))

    # =========================================================
    # SLIDE 8: FEATURE 5 - JOYLIN MASTER SHEET & LOGISYS ERP EXPORT
    # =========================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8)
    add_header(s8, "Feature 5: Joylin Master Sheet & Logisys University ERP Export", "ENTERPRISE INGESTION")

    add_card(s8, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.4), BG_CARD, ACCENT_CYAN)
    tb = s8.shapes.add_textbox(Inches(0.95), Inches(1.75), Inches(5.3), Inches(5.1))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Examination Office Integration"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN

    add_feature_point(tf, "Joylin Master Sheet (Prof. Joylin)", "Departmental coordinators view cohort-wide standings with mathematical domain cap enforcement across all 4 years.", ACCENT_GOLD, 11, 10)
    add_feature_point(tf, "1-Click Google Sheet CSV Export", "Instant download of clean, spreadsheet-ready CSV datasets (`/api/joylin/export-csv`) formatted for NAAC & NBA committee evaluations.", ACCENT_EMERALD, 11, 10)
    add_feature_point(tf, "Logisys University ERP Export", "Generates examination office datasets ready for direct import into Logisys University Examination Software (`/api/logisys/export-csv`).", ACCENT_CYAN, 11, 10)
    add_feature_point(tf, "Automatic Letter Grade Mapping", "Maps accumulated points to Course Code `22CSACT01` with autonomous grades: O (180+), A+ (150+), A (120+), B+ (90+), B (60+), F (<60).", ACCENT_INDIGO, 11, 10)
    add_feature_point(tf, "Eliminates Manual Re-Entry", "Saves weeks of tedious, error-prone manual data entry by examination office clerks before degree printing.", ACCENT_ROSE, 11, 10)

    # Right: Screenshot of coordinator sheet
    shot_path = os.path.join(ASSETS_DIR, "screenshot_coordinator_logisys.png")
    if os.path.exists(shot_path):
        add_card(s8, Inches(6.6), Inches(1.6), Inches(5.933), Inches(5.4), BG_CARD_LIGHT, ACCENT_INDIGO)
        s8.shapes.add_picture(shot_path, Inches(6.7), Inches(1.7), width=Inches(5.733), height=Inches(5.2))

    # =========================================================
    # SLIDE 9: FEATURE 6 - CERTIFIED DEGREE CLEARANCE TRANSCRIPTS
    # =========================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9)
    add_header(s9, "Feature 6: Certified A4 Degree Clearance Transcripts & QR Seals", "DEGREE CLEARANCE")

    add_card(s9, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.4), BG_CARD, ACCENT_GOLD)
    tb = s9.shapes.add_textbox(Inches(0.95), Inches(1.75), Inches(5.3), Inches(5.1))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Official Browser-Native Extraction"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = ACCENT_GOLD

    add_feature_point(tf, "Zero-Dependency A4 Print Engine", "Built with `@media print` CSS in StudentCreditReportModal.tsx, producing publication-quality transcripts directly in the browser.", ACCENT_CYAN, 11, 10)
    add_feature_point(tf, "Institutional Accreditation Layout", "Includes university emblem, NAAC/NBA compliance header, itemized activity ledger, category breakdowns, and milestone tier badges.", ACCENT_GOLD, 11, 10)
    add_feature_point(tf, "Dynamic Cryptographic QR Seals", "Every transcript features an SVG QR code linking to `/api/verify/:credentialId` for instant smartphone authenticity verification.", ACCENT_EMERALD, 11, 10)
    add_feature_point(tf, "Formal Signature Blocks", "Pre-formatted sign-off blocks for Faculty Mentor, Activity Coordinator, and Head of Department.", ACCENT_INDIGO, 11, 10)
    add_feature_point(tf, "Zero Server PDF Overhead", "Eliminates heavy server-side PDF libraries (Puppeteer/WebKit), executing instantly on any client machine.", ACCENT_ROSE, 11, 10)

    # Right: Screenshot of PDF transcript
    pdf_shot = os.path.join(ASSETS_DIR, "v3_pdf_transcript_modal.png")
    if os.path.exists(pdf_shot):
        add_card(s9, Inches(6.6), Inches(1.6), Inches(5.933), Inches(5.4), BG_CARD_LIGHT, ACCENT_INDIGO)
        s9.shapes.add_picture(pdf_shot, Inches(6.7), Inches(1.7), width=Inches(5.733), height=Inches(5.2))

    # =========================================================
    # SLIDE 10: ARCHITECTURAL SUPERIORITY - WHY IT IS THE MOST OPTIMAL SOLUTION
    # =========================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10)
    add_header(s10, "Architectural Superiority: Why Creditz is the Most Optimal Solution", "OPTIMAL DESIGN")

    # 4 Focused Pillars in a clean 2x2 grid
    card_w = Inches(5.7)
    card_h = Inches(2.55)

    # Pillar 1
    add_card(s10, Inches(0.8), Inches(1.6), card_w, card_h, BG_CARD, ACCENT_EMERALD)
    tb = s10.shapes.add_textbox(Inches(0.95), Inches(1.7), Inches(5.4), Inches(2.35))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "1. Deterministic Governance vs AI Perception"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = ACCENT_EMERALD
    add_feature_point(tf, "Zero Hallucination Risk", "AI (Google Gemini 2.5 Flash) is strictly quarantined to multimodal perception (reading names & dates). Credit mathematics, semester caps (30 pts), and category limits are enforced deterministically in pointsCalculator.ts.", ACCENT_CYAN, 10, 6)

    # Pillar 2
    add_card(s10, Inches(6.8), Inches(1.6), card_w, card_h, BG_CARD, ACCENT_CYAN)
    tb = s10.shapes.add_textbox(Inches(6.95), Inches(1.7), Inches(5.4), Inches(2.35))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "2. Zero-Cost Hardware Footprint & Local Resilience"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN
    add_feature_point(tf, "Microsecond Database & Smart Fallback", "SQLite in WAL mode provides instantaneous ACID transactions without heavy database servers. If cloud AI quotas are exhausted, a smart heuristic engine activates, guaranteeing zero portal downtime.", ACCENT_GOLD, 10, 6)

    # Pillar 3
    add_card(s10, Inches(0.8), Inches(4.35), card_w, card_h, BG_CARD, ACCENT_ROSE)
    tb = s10.shapes.add_textbox(Inches(0.95), Inches(4.45), Inches(5.4), Inches(2.35))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "3. Multi-Tier Cryptographic Integrity"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = ACCENT_ROSE
    add_feature_point(tf, "Defense-in-Depth Anti-Fraud", "Triple protection: SHA-256 binary document hashing blocks file re-use; semantic credential registry blocks certificate ID duplication; dynamic SVG QR codes allow external physical verification on mobile.", ACCENT_ROSE, 10, 6)

    # Pillar 4
    add_card(s10, Inches(6.8), Inches(4.35), card_w, card_h, BG_CARD, ACCENT_GOLD)
    tb = s10.shapes.add_textbox(Inches(6.95), Inches(4.45), Inches(5.4), Inches(2.35))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "4. End-to-End Institutional Synergy"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = ACCENT_GOLD
    add_feature_point(tf, "Unified Academic Lifecycle", "Connects Mid-Semester Exam marks, remedial counseling, 10th/12th school history, activity points, campus placement cutoffs, and Logisys Examination ERP into one cohesive institutional intelligence pipeline.", ACCENT_EMERALD, 10, 6)

    # =========================================================
    # SLIDE 11: PRODUCTION METRICS, TEAM & CONCLUSION
    # =========================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_background(s11)
    add_header(s11, "Production Health, Engineering Benchmarks & Team Credits", "SUMMARY & CREDITS")

    # 4 Metric KPI Cards across top
    stats = [
        ("0 Errors", "TypeScript Strict Compilation", ACCENT_EMERALD),
        ("134 Students", "Seeded Across All 4 Years", ACCENT_CYAN),
        ("24 Mentors", "Strict 5-6 Mentee Allocation", ACCENT_INDIGO),
        ("3,686 Marks", "MSE & CIE Academic Records", ACCENT_GOLD)
    ]

    for idx, (val, label, color) in enumerate(stats):
        x = Inches(0.8 + idx * 2.98)
        add_card(s11, x, Inches(1.6), Inches(2.8), Inches(1.3), BG_CARD, color)
        tb = s11.shapes.add_textbox(x, Inches(1.7), Inches(2.8), Inches(1.1))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = val
        p.font.size = Pt(26)
        p.font.bold = True
        p.font.color.rgb = color
        p.alignment = PP_ALIGN.CENTER
        p2 = tf.add_paragraph()
        p2.text = label
        p2.font.size = Pt(10)
        p2.font.color.rgb = TEXT_MUTED
        p2.alignment = PP_ALIGN.CENTER

    # Bottom Left: Build & Architecture Integrity
    add_card(s11, Inches(0.8), Inches(3.1), Inches(5.7), Inches(3.9), BG_CARD, ACCENT_CYAN)
    tb = s11.shapes.add_textbox(Inches(0.95), Inches(3.2), Inches(5.4), Inches(3.7))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Engineering Health & Speed"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN
    add_feature_point(tf, "Vite Production Pipeline", "Compiles 2,124 modules in ~6.1 seconds with full tree-shaking and gzip chunk optimization.", ACCENT_CYAN, 10, 8)
    add_feature_point(tf, "Standalone Server Bundle", "Bundles backend in 27ms via esbuild into a single 298 KB standalone executable (`dist/server.cjs`).", ACCENT_EMERALD, 10, 8)
    add_feature_point(tf, "Type-Safe Contracts", "Universal TypeScript definitions in `types.ts` guarantee zero schema mismatches between frontend & API.", ACCENT_GOLD, 10, 8)

    # Bottom Right: Project Team & Mentors
    add_card(s11, Inches(6.8), Inches(3.1), Inches(5.733), Inches(3.9), BG_CARD, ACCENT_GOLD)
    tb = s11.shapes.add_textbox(Inches(6.95), Inches(3.2), Inches(5.4), Inches(3.7))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Core Engineering Team & Mentors"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = ACCENT_GOLD
    add_feature_point(tf, "Student Engineering Team", "Gaurish (nnm23cs077) • Sampath (nnm23cs167) • Sharan (nnm23cs176) • Ronak (nnm23cs153)", TEXT_WHITE, 10.5, 8)
    add_feature_point(tf, "Academic Advisory Panel", "Special gratitude to Prof. Aishwarya, Prof. Joylin Mendonca, Prof. Pawan Kumar, and Dr. Sannidhan M. S.", ACCENT_GOLD, 10.5, 8)
    add_feature_point(tf, "Institutional Department", "Department of Computer Science & Engineering. Built and validated for production accreditation.", ACCENT_CYAN, 10.5, 8)

    prs.save(OUTPUT_PPTX)
    print(f"Successfully generated optimal presentation: {OUTPUT_PPTX}")

if __name__ == "__main__":
    create_optimal_presentation()
