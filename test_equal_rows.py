import docx
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import copy

doc = docx.Document('weekly-progress-report_2026.docx')

# Remove unnecessary blank paragraphs before and after table
p_to_remove = []
for p in doc.paragraphs:
    if not p.text.strip():
        p_to_remove.append(p)

for p in p_to_remove:
    p._element.getparent().remove(p._element)

# Format headers
for p in doc.paragraphs:
    if 'Project Title:' in p.text:
        p.text = 'Project Title: Creditz – Institutional Academic & Extra-Curricular Activity Credit Management System with AI-Assisted Verification and GraphRAG'
        p.runs[0].font.name = 'Times New Roman'
        p.runs[0].font.size = Pt(11)
        p.runs[0].font.bold = True
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
    elif 'Name of the Guide:' in p.text:
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(6)
    elif 'Date:' in p.text:
        p.text = 'Date: 28/09/2026'
        p.runs[0].font.name = 'Times New Roman'
        p.runs[0].font.size = Pt(10.5)
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
    elif 'Signature of guide' in p.text:
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(4)

t1 = doc.tables[0]

# Deep copy table 0 to create table 2
t2_element = copy.deepcopy(t1._tbl)

# Insert page break paragraph and table 2 after table 1
t1._tbl.addnext(t2_element)
p_break = doc.add_paragraph()
p_break.paragraph_format.page_break_before = True
t1._tbl.addnext(p_break._element)

t2 = docx.table.Table(t2_element, doc)

# In t1: remove rows 9 to 16
for r_idx in range(16, 8, -1):
    tr = t1.rows[r_idx]._tr
    tr.getparent().remove(tr)

# In t2: remove rows 1 to 8
for r_idx in range(8, 0, -1):
    tr = t2.rows[r_idx]._tr
    tr.getparent().remove(tr)

# Weeks data
weeks_data = [
    {
        "table": t1,
        "start_row": 1,
        "week_str": "Week 1\nfrom: 31/08/2026\nto: 05/09/2026",
        "tasks": (
            "• Literature survey on AICTE/VTU 100/200 activity point guidelines and credit clearance workflows.\n"
            "• Identified problem statement regarding manual certificate verification, rule enforcement bottlenecks, and lack of audit trails.\n"
            "• Formulated system requirements and defined role hierarchy (Student, Faculty Mentor, HOD).\n"
            "• Designed relational SQLite schema for users, activity categories, submissions, and audit logs.\n"
            "• Initialized repo scaffolding using Vite, React 19, TypeScript, and Express backend."
        ),
        "suggestions": (
            "• Study existing institutional credit verification bottlenecks.\n"
            "• Define strict mathematical constraints for semester limits (max 30 pts/sem) and category caps.\n"
            "• Maintain clear separation between authoritative database records and derived layers."
        ),
        "mark": "4.0"
    },
    {
        "table": t1,
        "start_row": 5,
        "week_str": "Week 2\nfrom: 07/09/2026\nto: 12/09/2026",
        "tasks": (
            "• Implemented deterministic points calculator enforcing semester limits (30 pts ceiling) and category caps.\n"
            "• Built responsive frontend dashboards with 1-click persona switching (Student, Mentor, HOD).\n"
            "• Developed student submission portal with file upload support for certificates (PDF/PNG/SVG).\n"
            "• Created Faculty Mentor review console to inspect pending activity submissions.\n"
            "• Implemented milestone tier classification (Bronze, Silver, Gold, Diamond 200 Clearance)."
        ),
        "suggestions": (
            "• Incorporate automated OCR to assist mentors in verifying student credentials.\n"
            "• Implement fraud/tamper detection to flag certificate name and date mismatches.\n"
            "• Add real-time visual progress indicators for student degree clearance."
        ),
        "mark": "4.5"
    },
    {
        "table": t2,
        "start_row": 1,
        "week_str": "Week 3\nfrom: 14/09/2026\nto: 19/09/2026",
        "tasks": (
            "• Integrated Google Gemini 2.5 Flash Vision for automated certificate OCR and metadata parsing.\n"
            "• Built discrepancy detection engine comparing certificate text against student database profiles.\n"
            "• Constructed derived Institutional Knowledge Graph service mapping academic entities & relationships.\n"
            "• Implemented deterministic fallback mechanism for 100% offline availability.\n"
            "• Updated Mentor Review Console with side-by-side certificate proof inspection and AI audit badges."
        ),
        "suggestions": (
            "• Ensure AI recommendations are strictly grounded in institutional graph evidence (GraphRAG).\n"
            "• Eliminate LLM hallucinations regarding university rules or non-existent activities.\n"
            "• Design an official institutional credit transcript report format."
        ),
        "mark": "4.5"
    },
    {
        "table": t2,
        "start_row": 5,
        "week_str": "Week 4\nfrom: 21/09/2026\nto: 26/09/2026",
        "tasks": (
            "• Deployed GraphRAG-powered AI Advisor providing grounded academic clearance roadmaps.\n"
            "• Implemented Student Visual Analytics: Domain Donut Chart, Semester Velocity, and SGPA correlation.\n"
            "• Built official A4 Institutional Credit Transcript PDF extraction engine with verification seal.\n"
            "• Performed end-to-end integration and role workflow testing across Student, Mentor, and HOD.\n"
            "• Finalized Phase I documentation, presentation deck, and working prototype demonstration."
        ),
        "suggestions": (
            "• Simplify UI navigation for non-technical faculty evaluators using plain academic vocabulary.\n"
            "• Prepare Phase I demonstration showcasing certificate OCR, mentor approval, and transcript export.\n"
            "• Ensure comprehensive test cases for semester cap boundary conditions."
        ),
        "mark": "5.0"
    }
]

def format_cell(cell, text, bold=False, font_size=8, align=WD_ALIGN_PARAGRAPH.LEFT):
    cell.text = ""
    p = cell.paragraphs[0]
    p.alignment = align
    p.paragraph_format.space_before = Pt(1.5)
    p.paragraph_format.space_after = Pt(1.5)
    p.paragraph_format.line_spacing = 1.05
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(font_size)
    run.font.bold = bold
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER

# Header row format
for t in [t1, t2]:
    # header row 0
    t.rows[0]._tr.get_or_add_trPr().append(OxmlElement('w:cantSplit'))
    h0 = t.rows[0]._tr.get_or_add_trPr().find(qn('w:trHeight'))
    if h0 is not None:
        h0.set(qn('w:val'), '450')
        h0.set(qn('w:hRule'), 'atLeast')
    # rows 1..8: set each row height to 600 twips (30 pt) so each student row is equal!
    for r in t.rows[1:]:
        trPr = r._tr.get_or_add_trPr()
        trPr.append(OxmlElement('w:cantSplit'))
        h = trPr.find(qn('w:trHeight'))
        if h is None:
            h = OxmlElement('w:trHeight')
            trPr.append(h)
        h.set(qn('w:val'), '580')
        h.set(qn('w:hRule'), 'atLeast')

for data in weeks_data:
    t = data["table"]
    start_row = data["start_row"]
    
    # Col 0: Week with date
    c0 = t.rows[start_row].cells[0]
    format_cell(c0, data["week_str"], bold=True, font_size=8.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    
    # Col 1: Tasks achieved this week
    c1 = t.rows[start_row].cells[1]
    format_cell(c1, data["tasks"], bold=False, font_size=8, align=WD_ALIGN_PARAGRAPH.LEFT)
    
    # Col 2: Suggestions by guide
    c2 = t.rows[start_row].cells[2]
    format_cell(c2, data["suggestions"], bold=False, font_size=8, align=WD_ALIGN_PARAGRAPH.LEFT)
    
    # Rows 0..3 of each week: Name (Col 3), USN (Col 4), Signature (Col 5), Marks (Col 6)
    for r_offset in range(4):
        curr_row = start_row + r_offset
        # Name (keep blank)
        c_name = t.rows[curr_row].cells[3]
        format_cell(c_name, "", font_size=8.5)
        # USN (keep blank)
        c_usn = t.rows[curr_row].cells[4]
        format_cell(c_usn, "", font_size=8.5)
        # Student Signature (keep blank)
        c_sig = t.rows[curr_row].cells[5]
        format_cell(c_sig, "", font_size=8.5)
        # Marks (5)
        c_marks = t.rows[curr_row].cells[6]
        format_cell(c_marks, data["mark"], bold=True, font_size=9.5, align=WD_ALIGN_PARAGRAPH.CENTER)

doc.save('/tmp/test_equal.docx')
