# Creditz (Prototype v2)
**Institutional Academic & Co-Curricular Activity Credit Management System**

An intelligent, multi-role credit tracking portal designed for higher education institutions (e.g., AICTE 100/200 activity points / VTU mandatory credits). Built for students and faculty of all academic branches (CSE, ECE, Mechanical, Civil, Biotechnology, etc.) with zero unnecessary complexity.

---

## 🌟 Key Features (Aligned with Presentation)

### 1. Student Portal
- **200-Point Degree Clearance Progress:** Real-time visual progress ring tracking graduation readiness.
- **Semester Credit Ceilings (30 Pts / Sem):** Visual 8-semester tracker enforcing continuous development rules.
- **Easy Certificate Submission:** Drag-and-drop proof upload (PDF/PNG/JPG) with immediate delivery tracking.
- **AI Auto-Fill & Fraud Check (Gemini Vision 2.5 Flash):** Automatically extracts certificate title, issuer, and completion date, and verifies against the student profile.
- **Campus Clubs & Fast-Track Events:** Browse active college chapters (IEEE, NSS, Coding Club, Sports) and upcoming credit events.
- **Academic Marks & SGPA Tracker:** Track semester-wise internal exam scores and SGPA.

### 2. Faculty Mentor Portal
- **Assigned Mentee Roster:** Live list of student mentees with clearance status (*Cleared*, *Near Completion*, *On Track*, *At Risk*).
- **Side-by-Side Certificate Verification Queue:** Inspect uploaded certificate documents alongside AI anomaly audit scores.
- **1-Click Review:** Approve credits or reject with constructive feedback.
- **Mentee Academic Marks Review:** Review semester-wise academic grades for holistic mentoring.
- **Request New Activity Rule:** Submit special activity requests to the HOD.

### 3. Head of Department (HOD) Console
- **Department-Wide Analytics:** Total enrolled students, average points, category distribution, and completion rates.
- **Category Domain Cap Manager:** Enforce university policy ceilings (e.g., max 50 pts in Online Courses, max 60 pts in Hackathons).
- **Mentor Request Approvals:** Review and approve custom activity proposals submitted by faculty.
- **Student-Mentor Allocation:** Manage faculty advisory load and export CSV compliance rosters for university accreditation.

---

## 🚀 Quick Start Guide

### 1. Navigate to Prototype Directory
```bash
cd /home/gaurish/Desktop/Major/Major-project-prototype-v2
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
