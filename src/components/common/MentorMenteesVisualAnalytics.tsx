import React, { useState, useMemo } from 'react';
import { apiRequest } from '../../lib/api';
import { Submission, StudentCreditReportData } from '../../types';
import { StudentVisualAnalytics } from './StudentVisualAnalytics';
import { StudentCreditReportModal } from './StudentCreditReportModal';
import {
  ArrowLeft,
  GraduationCap,
  Award,
  TrendingUp,
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Mail,
  Phone,
  MapPin,
  Printer,
  Download,
  ShieldCheck,
  FileText,
  Sparkles,
  ExternalLink,
  ChevronRight,
  X,
  BookOpen,
  Building2,
  Calendar,
} from 'lucide-react';

export interface MentorItem {
  id: string;
  name: string;
  email: string;
  designation?: string;
  phone?: string;
  office_location?: string;
  current_mentees_count?: number;
}

export interface MenteeItem {
  id: string;
  name: string;
  email: string;
  roll_no: string;
  semester: number;
  cgpa: number;
  phone?: string;
  mentor_id: string | null;
  mentor_name: string | null;
  mentor_email: string | null;
  approved_points: number;
  pending_submissions: number;
}

interface MentorMenteesVisualAnalyticsProps {
  mentor: MentorItem;
  mentees: MenteeItem[];
  allSubmissions?: Submission[];
  onBack: () => void;
}

export const MentorMenteesVisualAnalytics: React.FC<MentorMenteesVisualAnalyticsProps> = ({
  mentor,
  mentees,
  allSubmissions = [],
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'cleared' | 'on_track' | 'at_risk'>('all');
  
  // Drill-down Modals for Individual Mentee
  const [selectedStudentForAnalytics, setSelectedStudentForAnalytics] = useState<string | null>(null);
  const [selectedCreditReportData, setSelectedCreditReportData] = useState<StudentCreditReportData | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Filter mentees
  const filteredMentees = useMemo(() => {
    return mentees.filter((m) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.roll_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'cleared') return m.approved_points >= 200;
      if (statusFilter === 'on_track') return m.approved_points >= 100 && m.approved_points < 200;
      if (statusFilter === 'at_risk') return m.approved_points < 100 || m.cgpa < 7.0;

      return true;
    });
  }, [mentees, searchQuery, statusFilter]);

  // Aggregate Metrics & Visual Analytics Calculations
  const totalMentees = mentees.length;
  const totalApprovedPoints = mentees.reduce((acc, curr) => acc + (curr.approved_points || 0), 0);
  const avgPoints = totalMentees > 0 ? Math.round(totalApprovedPoints / totalMentees) : 0;
  const avgCGPA = totalMentees > 0 ? Number((mentees.reduce((acc, curr) => acc + (curr.cgpa || 0), 0) / totalMentees).toFixed(2)) : 0;
  
  // Clearance breakdown
  const clearedCount = mentees.filter((m) => m.approved_points >= 200).length;
  const nearCompletionCount = mentees.filter((m) => m.approved_points >= 150 && m.approved_points < 200).length;
  const inProgressCount = mentees.filter((m) => m.approved_points >= 75 && m.approved_points < 150).length;
  const atRiskCount = mentees.filter((m) => m.approved_points < 75).length;
  const clearanceRate = totalMentees > 0 ? Math.round((clearedCount / totalMentees) * 100) : 0;

  // Academic Standing Breakdown
  const highDistinctionCount = mentees.filter((m) => m.cgpa >= 8.5).length;
  const firstClassCount = mentees.filter((m) => m.cgpa >= 7.0 && m.cgpa < 8.5).length;
  const counselingAlertCount = mentees.filter((m) => m.cgpa < 7.0).length;

  // Semester Breakdown
  const semDistribution = useMemo(() => {
    const sMap: Record<number, number> = {};
    mentees.forEach((m) => {
      const sem = m.semester || 1;
      sMap[sem] = (sMap[sem] || 0) + 1;
    });
    return sMap;
  }, [mentees]);

  // Mentees Submissions & Category Breakdown
  const menteeIds = useMemo(() => new Set(mentees.map((m) => m.id)), [mentees]);
  const menteeSubmissions = useMemo(() => {
    return allSubmissions.filter((s) => menteeIds.has(s.student_id));
  }, [allSubmissions, menteeIds]);

  // Points by category across this mentor's mentees
  const categoryStats = useMemo(() => {
    const cats: Record<string, { name: string; points: number; count: number; color: string; cap: number }> = {
      cat_cert: { name: 'Certifications & MOOCs', points: 0, count: 0, color: 'bg-indigo-500', cap: 50 },
      cat_comp: { name: 'Hackathons & Competitions', points: 0, count: 0, color: 'bg-blue-500', cap: 60 },
      cat_intern: { name: 'Internships & Research', points: 0, count: 0, color: 'bg-emerald-500', cap: 60 },
      cat_vol: { name: 'Community Service (NSS/NGO)', points: 0, count: 0, color: 'bg-rose-500', cap: 40 },
      cat_sports: { name: 'Sports, Culture & Leadership', points: 0, count: 0, color: 'bg-amber-500', cap: 40 },
      cat_work: { name: 'Workshops & Conferences', points: 0, count: 0, color: 'bg-purple-500', cap: 30 },
    };

    menteeSubmissions.forEach((sub) => {
      if (sub.status === 'approved') {
        const catId = sub.category_id || 'cat_cert';
        if (cats[catId]) {
          cats[catId].points += sub.points_awarded || 0;
          cats[catId].count += 1;
        } else {
          cats.cat_cert.points += sub.points_awarded || 0;
          cats.cat_cert.count += 1;
        }
      }
    });

    return Object.entries(cats).map(([id, c]) => ({
      id,
      ...c,
    }));
  }, [menteeSubmissions]);

  // Open Official Student Credit Report Modal for a specific mentee
  const handleOpenCreditReport = async (studentId: string) => {
    try {
      setIsLoadingReport(true);
      const data = await apiRequest<StudentCreditReportData>(`/api/student/credit-report?student_id=${studentId}`);
      setSelectedCreditReportData(data);
    } catch (err: any) {
      console.error('Failed to load credit report for mentee:', err);
      alert(err.message || 'Failed to load credit report');
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Export Mentees CSV
  const handleExportCSV = () => {
    const headers = ['Roll No / USN', 'Name', 'Semester', 'CGPA', 'Approved Activity Points', 'Pending Submissions', 'Email', 'Phone', 'Clearance Status'];
    const rows = mentees.map((m) => {
      const status = m.approved_points >= 200 ? 'Degree Cleared' : m.approved_points >= 150 ? 'Near Completion' : m.approved_points >= 75 ? 'In Progress' : 'At Risk';
      return [
        `"${m.roll_no}"`,
        `"${m.name}"`,
        m.semester,
        m.cgpa,
        m.approved_points,
        m.pending_submissions,
        `"${m.email}"`,
        `"${m.phone || 'N/A'}"`,
        `"${status}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${mentor.name.replace(/\s+/g, '_')}_Mentees_Analytics_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-view-fade">
      {/* 1. Breadcrumb & Back Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
            title="Return to Faculty Mentors Directory"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
            <span>Back to Faculty List</span>
          </button>
          <span className="text-slate-400">/</span>
          <span className="text-slate-500">Faculty Mentors Directory</span>
          <span className="text-slate-400">/</span>
          <span className="font-bold text-indigo-950 font-mono">{mentor.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 font-bold border border-indigo-200 text-xs transition cursor-pointer shadow-2xs"
            title="Download Mentees Roster CSV"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export Mentees CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
            title="Print Mentee Analytics Dossier"
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            <span>Print Cohort Dossier</span>
          </button>
        </div>
      </div>

      {/* 2. Top Mentor Identity & Leadership Card */}
      <div className="bg-gradient-to-r from-[#0B1329] via-[#0F1E4A] to-[#0B1329] rounded-2xl p-4 sm:p-6 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Mentor Details */}
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-md ring-2 ring-indigo-400/30 shrink-0">
              {mentor.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                  {mentor.designation || 'Faculty Mentor'}
                </span>
                <span className="text-[10px] text-slate-400">Department of Computer Science & Engineering</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                {mentor.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-indigo-400" />
                  <span>{mentor.email}</span>
                </span>
                {mentor.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-indigo-400" />
                    <span>{mentor.phone}</span>
                  </span>
                )}
                {mentor.office_location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-indigo-400" />
                    <span>{mentor.office_location}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick Cohort Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mentees</div>
              <div className="text-xl font-bold font-mono text-white mt-0.5">{totalMentees}</div>
              <div className="text-[10px] text-indigo-300">Active Students</div>
            </div>

            <div className="text-center px-2 border-l border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg Points</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{avgPoints}</div>
              <div className="text-[10px] text-slate-400">Target: 200 pts</div>
            </div>

            <div className="text-center px-2 border-l border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg CGPA</div>
              <div className="text-xl font-bold font-mono text-sky-400 mt-0.5">{avgCGPA}</div>
              <div className="text-[10px] text-slate-400">Academic Standing</div>
            </div>

            <div className="text-center px-2 border-l border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Clearance</div>
              <div className="text-xl font-bold font-mono text-purple-300 mt-0.5">{clearanceRate}%</div>
              <div className="text-[10px] text-slate-400">{clearedCount} Cleared</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Data Visualization Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Viz 1: Degree Clearance Progress & Milestone Gauge (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>AICTE 200-Points Milestone Distribution</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Evaluation of {totalMentees} mentees towards mandatory degree clearance requirements
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
              {totalApprovedPoints} Total Points
            </span>
          </div>

          {/* Stacked Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div
                className="bg-emerald-500 transition-all duration-500"
                style={{ width: `${totalMentees > 0 ? (clearedCount / totalMentees) * 100 : 0}%` }}
                title={`Degree Cleared (200 pts): ${clearedCount} students`}
              />
              <div
                className="bg-sky-500 transition-all duration-500"
                style={{ width: `${totalMentees > 0 ? (nearCompletionCount / totalMentees) * 100 : 0}%` }}
                title={`Near Completion (150-199 pts): ${nearCompletionCount} students`}
              />
              <div
                className="bg-amber-400 transition-all duration-500"
                style={{ width: `${totalMentees > 0 ? (inProgressCount / totalMentees) * 100 : 0}%` }}
                title={`In Progress (75-149 pts): ${inProgressCount} students`}
              />
              <div
                className="bg-rose-400 transition-all duration-500"
                style={{ width: `${totalMentees > 0 ? (atRiskCount / totalMentees) * 100 : 0}%` }}
                title={`At Risk (<75 pts): ${atRiskCount} students`}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>0 pts</span>
              <span>100 pts (Midpoint)</span>
              <span>200 pts (Degree Clearance)</span>
            </div>
          </div>

          {/* Color-Coded Milestone Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Cleared (200p)</span>
              </div>
              <div className="text-lg font-bold font-mono text-emerald-950 mt-1">{clearedCount}</div>
              <div className="text-[10px] text-emerald-700">
                {totalMentees > 0 ? Math.round((clearedCount / totalMentees) * 100) : 0}% of cohort
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/80">
              <div className="flex items-center gap-1.5 text-sky-800 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>Near Target (150+)</span>
              </div>
              <div className="text-lg font-bold font-mono text-sky-950 mt-1">{nearCompletionCount}</div>
              <div className="text-[10px] text-sky-700">
                {totalMentees > 0 ? Math.round((nearCompletionCount / totalMentees) * 100) : 0}% of cohort
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
              <div className="flex items-center gap-1.5 text-amber-800 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>In Progress (75+)</span>
              </div>
              <div className="text-lg font-bold font-mono text-amber-950 mt-1">{inProgressCount}</div>
              <div className="text-[10px] text-amber-700">
                {totalMentees > 0 ? Math.round((inProgressCount / totalMentees) * 100) : 0}% of cohort
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/80">
              <div className="flex items-center gap-1.5 text-rose-800 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>At Risk (&lt;75p)</span>
              </div>
              <div className="text-lg font-bold font-mono text-rose-950 mt-1">{atRiskCount}</div>
              <div className="text-[10px] text-rose-700">
                {totalMentees > 0 ? Math.round((atRiskCount / totalMentees) * 100) : 0}% of cohort
              </div>
            </div>
          </div>
        </div>

        {/* Viz 2: Academic Standing & CGPA Matrix (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span>Academic Performance & CGPA Profile</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Academic health correlation to activity point accrual
            </p>
          </div>

          <div className="space-y-3">
            {/* Distinction */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Distinction (CGPA ≥ 8.5)</span>
                </span>
                <span className="font-mono font-bold text-emerald-800">{highDistinctionCount} Students</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${totalMentees > 0 ? (highDistinctionCount / totalMentees) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* First Class */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>First Class (7.0 ≤ CGPA &lt; 8.5)</span>
                </span>
                <span className="font-mono font-bold text-indigo-800">{firstClassCount} Students</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${totalMentees > 0 ? (firstClassCount / totalMentees) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Counseling Alert */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Counseling Alert (CGPA &lt; 7.0)</span>
                </span>
                <span className="font-mono font-bold text-amber-800">{counselingAlertCount} Students</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${totalMentees > 0 ? (counselingAlertCount / totalMentees) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Academic Semester Breakdown Badges */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Semester Cohort Breakdown
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(semDistribution).map(([sem, count]) => (
                <span
                  key={sem}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1"
                >
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Sem {sem}:</span>
                  <strong className="text-slate-900 font-mono">{count}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Viz 3: 6 Activity Categories Distribution (12 Cols) */}
        <div className="lg:col-span-12 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>AICTE Activity Domain Accrual Across Mentees</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Breakdown of points earned by category across all {menteeSubmissions.filter((s) => s.status === 'approved').length} verified student certificates
              </p>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Maximum cap enforcement per institutional regulation
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {categoryStats.map((cat) => {
              const maxTotal = totalMentees * cat.cap;
              const pct = maxTotal > 0 ? Math.min(100, Math.round((cat.points / maxTotal) * 100)) : 0;

              return (
                <div
                  key={cat.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2.5 hover:border-indigo-300 transition"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 truncate" title={cat.name}>
                        {cat.name}
                      </span>
                      <span className="font-mono font-bold text-indigo-900">
                        {cat.points} pts
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
                      <span>{cat.count} verified certificates</span>
                      <span>Cap: {cat.cap} pts/student</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                      <span>{pct}% Cap Utilization</span>
                      <span>Target: {maxTotal} pts max</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Complete Respective Mentees Data Roster */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-4 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Respective Mentees Roster ({filteredMentees.length})</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Individual academic & activity performance profiles under Prof. {mentor.name}
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search mentee name, USN, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-hidden bg-white"
              />
            </div>

            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({mentees.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('cleared')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  statusFilter === 'cleared' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cleared ({clearedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('at_risk')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  statusFilter === 'at_risk' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                At Risk ({atRiskCount})
              </button>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Mentee Student</th>
                <th className="py-2.5 px-3 text-center">Semester</th>
                <th className="py-2.5 px-3 text-center">CGPA</th>
                <th className="py-2.5 px-3">Activity Points Progress</th>
                <th className="py-2.5 px-3 text-center">Submissions</th>
                <th className="py-2.5 px-3 text-center">Clearance Status</th>
                <th className="py-2.5 px-3 text-right">Data Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMentees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No mentees found matching your search filter.
                  </td>
                </tr>
              ) : (
                filteredMentees.map((mentee, idx) => {
                  const pts = mentee.approved_points || 0;
                  const isCleared = pts >= 200;
                  const isNear = pts >= 150 && pts < 200;
                  const isProgress = pts >= 75 && pts < 150;
                  const pct = Math.min(100, Math.round((pts / 200) * 100));

                  return (
                    <tr key={mentee.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {mentee.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{mentee.name}</div>
                            <div className="font-mono text-[10px] text-slate-500">{mentee.roll_no} • {mentee.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          Sem {mentee.semester}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                            mentee.cgpa >= 8.5
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : mentee.cgpa >= 7.0
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {mentee.cgpa}
                        </span>
                      </td>

                      <td className="py-3 px-3 min-w-[150px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono font-bold text-slate-900">{pts} pts</span>
                            <span className="text-slate-400 font-mono text-[10px]">{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isCleared ? 'bg-emerald-500' : isNear ? 'bg-sky-500' : isProgress ? 'bg-amber-400' : 'bg-rose-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="text-[11px] text-slate-600 font-medium">
                          {mentee.pending_submissions > 0 ? (
                            <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold">
                              {mentee.pending_submissions} pending
                            </span>
                          ) : (
                            <span className="text-slate-400">All reviewed</span>
                          )}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isCleared
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isNear
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : isProgress
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isCleared
                            ? 'Degree Cleared'
                            : isNear
                            ? 'Near Completion'
                            : isProgress
                            ? 'In Progress'
                            : 'At Risk'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForAnalytics(mentee.id)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer border border-indigo-200"
                            title="Open full interactive visual analytics dossier for this mentee"
                          >
                            <BarChart3 className="w-3 h-3 text-indigo-600" />
                            <span>Visual Analytics</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenCreditReport(mentee.id)}
                            disabled={isLoadingReport}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title="Generate and view official printable Credit Report PDF"
                          >
                            <FileText className="w-3 h-3 text-sky-300" />
                            <span>Credit Report</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL: Full Interactive Student Visual Analytics Dossier */}
      {selectedStudentForAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <BarChart3 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Mentee Visual Analytics & Performance Dossier
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Faculty Advisor: Prof. {mentor.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentForAnalytics(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Close dossier"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50">
              <StudentVisualAnalytics
                studentId={selectedStudentForAnalytics}
                onBack={() => setSelectedStudentForAnalytics(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: Official Student Credit Report Modal */}
      <StudentCreditReportModal
        isOpen={!!selectedCreditReportData}
        onClose={() => setSelectedCreditReportData(null)}
        reportData={selectedCreditReportData}
      />
    </div>
  );
};
