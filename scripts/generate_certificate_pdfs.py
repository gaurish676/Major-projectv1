import os
import shutil
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas

UPLOADS_DIR = '/home/gaurish/Desktop/Major/v4/Major-project-prototype-v3/uploads'
os.makedirs(UPLOADS_DIR, exist_ok=True)

# 1. Copy real certificates if they exist
real_ethical = '/home/gaurish/Downloads/Certificates/Ethical Hacking Training - Certificate of Completion.pdf'
dest_ethical = os.path.join(UPLOADS_DIR, 'gaurish_ethical_hacking_training.pdf')
if os.path.exists(real_ethical):
    shutil.copyfile(real_ethical, dest_ethical)
    print("Copied real Ethical Hacking certificate to:", dest_ethical)

real_innovex = '/home/gaurish/Downloads/INNOVEXhackathon.pdf'
dest_innovex = os.path.join(UPLOADS_DIR, 'innovex_hackathon_nmamit.pdf')
if os.path.exists(real_innovex):
    shutil.copyfile(real_innovex, dest_innovex)
    print("Copied real INNOVEX Hackathon document to:", dest_innovex)

real_azure = '/home/gaurish/Downloads/Certificates/Achievements - gaurishbangera-4285 _ Microsoft Learn.pdf'
dest_azure = os.path.join(UPLOADS_DIR, 'gaurish_azure_ai_solutions.pdf')
if os.path.exists(real_azure):
    shutil.copyfile(real_azure, dest_azure)
    print("Copied real Azure AI certificate to:", dest_azure)

def draw_cert_base(c, width, height, title, subtitle, recipient, achievement, body, issuer, date_str, cred_id, border_color=colors.HexColor('#0284c7')):
    # Background
    c.setFillColor(colors.HexColor('#FFFFFF'))
    c.rect(0, 0, width, height, fill=True, stroke=False)
    
    # Outer Decorative Border
    c.setStrokeColor(border_color)
    c.setLineWidth(5)
    c.rect(20, 20, width - 40, height - 40, fill=False, stroke=True)
    
    # Inner Gold Border
    c.setStrokeColor(colors.HexColor('#D97706'))
    c.setLineWidth(1.5)
    c.rect(30, 30, width - 60, height - 60, fill=False, stroke=True)
    
    # Header Accent line
    c.setStrokeColor(colors.HexColor('#E2E8F0'))
    c.setLineWidth(1)
    c.line(100, height - 120, width - 100, height - 120)
    
    # Title
    c.setFillColor(colors.HexColor('#0F172A'))
    c.setFont('Helvetica-Bold', 24)
    c.drawCentredString(width / 2.0, height - 75, title)
    
    # Subtitle
    c.setFillColor(colors.HexColor('#64748B'))
    c.setFont('Helvetica-Bold', 11)
    c.drawCentredString(width / 2.0, height - 98, subtitle)
    
    # Pre-recipient text
    c.setFillColor(colors.HexColor('#475569'))
    c.setFont('Helvetica', 13)
    c.drawCentredString(width / 2.0, height - 155, "This is proudly presented to")
    
    # Recipient Name
    c.setFillColor(colors.HexColor('#1E293B'))
    c.setFont('Helvetica-Bold', 22)
    c.drawCentredString(width / 2.0, height - 190, recipient)
    
    # Achievement / Course Title
    c.setFillColor(colors.HexColor('#0369A1'))
    c.setFont('Helvetica-Bold', 16)
    c.drawCentredString(width / 2.0, height - 235, achievement)
    
    # Body text
    c.setFillColor(colors.HexColor('#334155'))
    c.setFont('Helvetica', 12)
    c.drawCentredString(width / 2.0, height - 275, body)
    
    # Issuer & Verification Info
    c.setFillColor(colors.HexColor('#475569'))
    c.setFont('Helvetica', 11)
    c.drawCentredString(width / 2.0, height - 315, f"Issued by: {issuer}")
    
    # Bottom decorative signatures line
    c.setStrokeColor(colors.HexColor('#94A3B8'))
    c.setLineWidth(1)
    # Left signature line
    c.line(80, 85, 260, 85)
    c.setFillColor(colors.HexColor('#334155'))
    c.setFont('Helvetica-Bold', 10)
    c.drawCentredString(170, 70, "PROGRAM DIRECTOR / COORDINATOR")
    c.setFont('Helvetica', 9)
    c.drawCentredString(170, 56, date_str)
    
    # Center Seal
    c.setStrokeColor(colors.HexColor('#D97706'))
    c.setFillColor(colors.HexColor('#FEF3C7'))
    c.circle(width / 2.0, 75, 26, fill=True, stroke=True)
    c.setFillColor(colors.HexColor('#B45309'))
    c.setFont('Helvetica-Bold', 8)
    c.drawCentredString(width / 2.0, 78, "OFFICIAL SEAL")
    c.drawCentredString(width / 2.0, 68, "VERIFIED")
    
    # Right signature line
    c.setStrokeColor(colors.HexColor('#94A3B8'))
    c.setLineWidth(1)
    c.line(width - 260, 85, width - 80, 85)
    c.setFillColor(colors.HexColor('#334155'))
    c.setFont('Helvetica-Bold', 10)
    c.drawCentredString(width - 170, 70, "AUTHORIZED ACADEMIC SIGNATORY")
    c.setFont('Helvetica', 9)
    c.drawCentredString(width - 170, 56, f"Credential ID: {cred_id}")

def generate_all_pdfs():
    width, height = landscape(A4)
    
    # 1. NPTEL Elite Cloud Computing
    p1 = os.path.join(UPLOADS_DIR, 'nptel_cloud_computing_elite.pdf')
    c1 = canvas.Canvas(p1, pagesize=landscape(A4))
    draw_cert_base(
        c1, width, height,
        title="NPTEL - SWAYAM ELITE CERTIFICATE",
        subtitle="MINISTRY OF EDUCATION, GOVERNMENT OF INDIA & IIT KHARAGPUR",
        recipient="GAURISH BANGERA (NNM23CS077)",
        achievement="Cloud Computing (12-Week Proctored Elite Certification)",
        body="Successfully completed with an Elite + Silver consolidated score of 88% in proctored national examination.",
        issuer="National Programme on Technology Enhanced Learning (NPTEL & IIT Kharagpur)",
        date_str="OCTOBER 2024",
        cred_id="NPTEL24CS881948S",
        border_color=colors.HexColor('#B45309')
    )
    c1.save()
    print("Generated:", p1)
    
    # 2. Smart India Hackathon Finalist
    p2 = os.path.join(UPLOADS_DIR, 'smart_india_hackathon_finalist.pdf')
    c2 = canvas.Canvas(p2, pagesize=landscape(A4))
    draw_cert_base(
        c2, width, height,
        title="SMART INDIA HACKATHON 2024",
        subtitle="MINISTRY OF EDUCATION INNOVATION CELL & AICTE, GOVT. OF INDIA",
        recipient="GAURISH BANGERA (NNM23CS077) - TEAM LEAD",
        achievement="National Grand Finalist - Problem Statement AI-402",
        body="Developed an AI-driven triage and emergency resource allocation platform for primary health centers.",
        issuer="Ministry of Education's Innovation Cell (MIC), New Delhi",
        date_str="DECEMBER 2024",
        cred_id="SIH2024-FN-09412",
        border_color=colors.HexColor('#4338CA')
    )
    c2.save()
    print("Generated:", p2)
    
    # 3. Microsoft Research Internship
    p3 = os.path.join(UPLOADS_DIR, 'microsoft_research_internship.pdf')
    c3 = canvas.Canvas(p3, pagesize=landscape(A4))
    draw_cert_base(
        c3, width, height,
        title="RESEARCH INTERNSHIP COMPLETION LETTER",
        subtitle="MICROSOFT RESEARCH INDIA - SYSTEMS & TELEMETRY LAB",
        recipient="GAURISH BANGERA (NNM23CS077)",
        achievement="Summer Research Fellow - Distributed Systems & Telemetry",
        body="Completed 8-week intensive research fellowship in high-throughput telemetry pipelines with Grade A rating.",
        issuer="Microsoft Corporation (India) R&D Pvt Ltd, Bangalore",
        date_str="JULY 2024",
        cred_id="MSR-IND-2024-819",
        border_color=colors.HexColor('#0284C7')
    )
    c3.save()
    print("Generated:", p3)
    
    # 4. IEEE Conference Best Paper
    p4 = os.path.join(UPLOADS_DIR, 'ieee_conference_best_paper.pdf')
    c4 = canvas.Canvas(p4, pagesize=landscape(A4))
    draw_cert_base(
        c4, width, height,
        title="IEEE INTERNATIONAL CONFERENCE PRESENTATION",
        subtitle="IEEE COMPUTER SOCIETY BANGALORE CHAPTER",
        recipient="SAMPATH (NNM23CS167) & CO-AUTHORS",
        achievement="Best Student Paper Award - Track 2 (Autonomous Agent Protocols)",
        body="Presented research paper entitled 'Real-time Autonomous Multi-Agent Workflows for Academic Governance'.",
        issuer="IEEE Bangalore Section & NMAMIT Research Cell",
        date_str="NOVEMBER 2024",
        cred_id="IEEE-CONF-2024-672",
        border_color=colors.HexColor('#059669')
    )
    c4.save()
    print("Generated:", p4)
    
    # 5. NSS Rural Development Camp
    p5 = os.path.join(UPLOADS_DIR, 'nss_rural_camp_certificate.pdf')
    c5 = canvas.Canvas(p5, pagesize=landscape(A4))
    draw_cert_base(
        c5, width, height,
        title="NATIONAL SERVICE SCHEME (NSS)",
        subtitle="NMAM INSTITUTE OF TECHNOLOGY (NITTE DEEMED TO BE UNIVERSITY)",
        recipient="SAMPATH (NNM23CS167)",
        achievement="7-Day Residential Rural Development & Social Outreach Camp",
        body="Actively organized digital literacy drives, village sanitization programs, and health awareness sessions.",
        issuer="NSS Unit, NMAMIT Nitte & Govt of Karnataka",
        date_str="APRIL 2024",
        cred_id="NSS-NITTE-2024-044",
        border_color=colors.HexColor('#E11D48')
    )
    c5.save()
    print("Generated:", p5)

    # 6. Inter-University Sports Championship
    p6 = os.path.join(UPLOADS_DIR, 'inter_university_sports_badminton.pdf')
    c6 = canvas.Canvas(p6, pagesize=landscape(A4))
    draw_cert_base(
        c6, width, height,
        title="ALL INDIA INTER-UNIVERSITY SPORTS CHAMPIONSHIP",
        subtitle="ASSOCIATION OF INDIAN UNIVERSITIES (AIU) & SPORTS COUNCIL",
        recipient="RONAK (NNM23CS153)",
        achievement="Gold Medal - Men's Singles Zonal Championship",
        body="Awarded 1st Place representing Nitte University in the South Zone Inter-University Tournament.",
        issuer="Association of Indian Universities (AIU), New Delhi",
        date_str="SEPTEMBER 2024",
        cred_id="AIU-MEDAL-2024-118",
        border_color=colors.HexColor('#CA8A04')
    )
    c6.save()
    print("Generated:", p6)

    # 7. Official AWS Certified Solutions Architect Associate (Correct & Realistic)
    p7 = os.path.join(UPLOADS_DIR, 'gaurish_aws_certified_solutions_architect.pdf')
    c7 = canvas.Canvas(p7, pagesize=landscape(A4))
    draw_cert_base(
        c7, width, height,
        title="AWS CERTIFIED SOLUTIONS ARCHITECT",
        subtitle="AMAZON WEB SERVICES TRAINING AND CERTIFICATION",
        recipient="GAURISH BANGERA (NNM23CS077)",
        achievement="AWS Certified Solutions Architect - Associate (SAA-C03)",
        body="Successfully completed proctored examination demonstrating expertise in designing secure and resilient architectures.",
        issuer="Amazon Web Services, Inc. (AWS Training & Certification)",
        date_str="JANUARY 2025",
        cred_id="AWS-CERT-08942-SAA03",
        border_color=colors.HexColor('#FF9900')
    )
    c7.save()
    print("Generated:", p7)

if __name__ == '__main__':
    generate_all_pdfs()
