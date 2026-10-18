# Creditz (Prototype v3)
**Institutional Academic & Co-Curricular Activity Credit Management System**

An intelligent, multi-role credit tracking and accreditation compliance portal designed for higher education institutions (AICTE 100/200 activity points / VTU mandatory credits). Designed with zero unnecessary complexity for non-technical faculty and students, featuring rich individual student visual analytics and official PDF credit transcript extraction.

---

## 🌟 Version 3 Key Enhancements (Panel Feedback Aligned)

### 1. Simplified, Intuitive UI for Non-IT Users
- **Streamlined 4-Pillar Navigation:** Replaced cluttered menus with 4 core intuitive tabs: *Home Overview*, *Visual Analytics*, *My Certificates*, and *Academic Marks*.
- **Reduced Cognitive Load:** Removed redundant action buttons, photo-picker clutter, and nested menus. Direct 1-click access to the most common actions (Upload Proof, View Visuals, Download PDF Report).

### 2. Detailed Data Visualization Suite for Each Student
- **Domain Distribution Donut Chart:** Interactive SVG visualization showing student credit spread across Hackathons, Online Certifications, Sports, Leadership, and Workshops with institutional cap enforcement.
- **Semester Velocity Bar Chart (Sem 1 to 8):** Visual comparison of approved credits and capped excess points per semester against the AICTE 30-pts/semester limit line.
- **Cumulative 200-Point Degree Trajectory:** Visual growth curve with milestone tier indicators (Bronze 50, Silver 100, Gold 150, Diamond 200 Clearance).
- **Curricular vs Co-Curricular Correlation:** Balanced comparison of semester SGPA against activity credits.

### 3. Student Credit Report PDF Extraction
- **Official Institutional Transcript:** Downloadable and printable as an official college degree clearance document.
- **Institutional Branding:** College name, NBA & NAAC accreditation details, Department of CSE header.
- **Verification Ref & QR Seal:** Unique digital verification reference code and security seal for anti-tamper authenticity.
- **Activity Sign-Off Ledger:** Itemized list of all approved activities, dates, points awarded, and faculty reviewer sign-offs.
- **Formal Signatures Block:** Formal signature blocks for Faculty Mentor and Head of Department (HOD).
- **A4 Print Engine:** Clean `@media print` CSS formatted specifically for standard paper and browser "Save as PDF" without clipping.

---

## 🚀 Quick Start Guide

### 1. Navigate to Prototype v3 Directory
```bash
cd /home/gaurish/Desktop/Major/Major-project-prototype-v3
```

### 2. Start Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your web browser.


---

## 👥 Instant 1-Click Demo Accounts

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Student** | Rahul Verma | `rahul@university.edu` | `password123` |
| **Faculty Mentor** | Prof. Anita Desai / Prof. Ravi Kumar | `ravi@university.edu` | `password123` |
| **HOD** | Dr. Rajesh Sharma | `hod@university.edu` | `password123` |

*(You can also use the 1-Click Demo buttons on the Sign In page to switch between personas instantly).*

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Framer Motion (`motion/react`)
- **Backend:** Node.js 22, Express REST API, SQLite (`node:sqlite` WAL mode)
- **AI Engine:** Google Gemini 2.5 Flash via official `@google/genai` SDK
