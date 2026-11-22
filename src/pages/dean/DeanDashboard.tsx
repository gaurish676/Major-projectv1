import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DeanDashboardData, PlacementDrive, CounselingLog } from '../../types';
import { apiRequest } from '../../lib/api';
import { DashboardSkeleton } from '../../components/common/SkeletonLoaders';
import {
  GraduationCap,
  Award,
  Building2,
  Users,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Layers,
  Briefcase,
  Clock,
  Calendar,
  Check,
  BookOpen,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  Sparkles,
  X,
  FileText,
  BadgeAlert,
  ArrowUpRight,
  User as UserIcon,
} from 'lucide-react';

interface DeanDashboardProps {
  onNavigateTab?: (tab: string) => void;
}

export const DeanDashboard: React.FC<DeanDashboardProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [data, setData] = useState<DeanDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CSV Export Loading States
  const [isExportingJoylin, setIsExportingJoylin] = useState(false);
  const [isExportingLogisys, setIsExportingLogisys] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Executive Circular Broadcast State
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastAudience, setBroadcastAudience] = useState<'all' | 'mentors' | 'students'>('all');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiRequest<DeanDashboardData>('/api/dean/dashboard');
      setData(res);
    } catch (err: any) {
      console.error('Failed to load Dean Executive Dashboard:', err);
      setError(err.message || 'Failed to retrieve executive leadership dataset.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // 1-Click Export Handlers
  const handleExportJoylinCsv = async () => {
    try {
      setIsExportingJoylin(true);
      setExportNotice(null);
      const token = localStorage.getItem('token') || localStorage.getItem('activity_portal_token');
      const res = await fetch('/api/joylin/export-csv', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to generate Joylin Master Sheet CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Joylin_Master_Accreditation_Sheet_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setExportNotice('Master Accreditation CSV downloaded successfully!');
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      console.error('Joylin Export error:', err);
      alert(err.message || 'Joylin Export failed');
    } finally {
      setIsExportingJoylin(false);
    }
  };

  const handleExportLogisysCsv = async () => {
    try {
      setIsExportingLogisys(true);
      setExportNotice(null);
      const token = localStorage.getItem('token') || localStorage.getItem('activity_portal_token');
      const res = await fetch('/api/logisys/export-csv', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to generate University Logisys ERP CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `University_Logisys_ERP_Dataset_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setExportNotice('University Logisys ERP CSV downloaded successfully!');
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      console.error('Logisys Export error:', err);
      alert(err.message || 'Logisys Export failed');
    } finally {
      setIsExportingLogisys(false);
    }
  };

  // Broadcast Circular Submit
  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    try {
      setIsBroadcasting(true);
      setBroadcastError(null);
      await apiRequest('/api/dean/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          target_audience: broadcastAudience,
        }),
      });

      setBroadcastSuccess('Institutional circular broadcasted successfully to academic council entities.');
      setBroadcastTitle('');
      setBroadcastMessage('');
      await fetchDashboardData();

      setTimeout(() => {
        setIsBroadcastModalOpen(false);
        setBroadcastSuccess(null);
      }, 1500);
    } catch (err: any) {
      setBroadcastError(err.message || 'Failed to dispatch circular broadcast.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-200 space-y-3">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Unable to Load Executive Leadership Dashboard</h2>
        <p className="text-xs text-slate-500">{error || 'Internal communication error with server.'}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { institute_kpis, department_comparison, year_progression, placement_drives, remedial_counseling_logs, recent_logs, dean } = data;

  return (
    <div className="space-y-6">
      {/* 1. LMS Style Dean Executive Leadership Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#8eb86e]/15 text-[#426b27] border border-[#8eb86e]/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#5c873f]" />
                <span>Executive Leadership Console</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">
                NMAMIT Autonomous Academic Conformance & Accreditation
              </span>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#ea580c] tracking-tight flex items-center gap-2.5">
                  <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-[#8eb86e] shrink-0" />
                  <span>Welcome back, {dean?.name || 'Dr. Pawan Kumar'}! 👋</span>
                </h1>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('profile')}
                    title="Click to view Dean profile"
                    className="text-xs font-semibold text-[#5c873f] bg-[#8eb86e]/10 hover:bg-[#8eb86e]/20 px-2.5 py-1 rounded-lg border border-[#8eb86e]/30 transition flex items-center gap-1 cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Profile</span>
                  </button>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-0.5">
                {dean?.title || 'Dean of Academic Affairs'} • {dean?.institution || 'Autonomous Academic Council'}
              </p>
            </div>

            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Institutional oversight across all engineering branches for AICTE 200 Activity Points conformance, 
              direct University Logisys ERP synchronizations, accreditation master ledgers, and campus placement eligibility.
            </p>
          </div>

          {/* Quick Executive Actions Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-auto">
            {/* Master CSV Export */}
            <button
              onClick={handleExportJoylinCsv}
              disabled={isExportingJoylin}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#7eb462] hover:bg-[#6fa454] text-white shadow-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              title="Download Master Accreditation CSV for Google Sheets / NAAC"
            >
              {isExportingJoylin ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Master CSV</span>
            </button>

            {/* Logisys ERP CSV Export */}
            <button
              onClick={handleExportLogisysCsv}
              disabled={isExportingLogisys}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#ea580c] hover:bg-[#c2410c] text-white shadow-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              title="Download University Logisys ERP Uploadable CSV"
            >
              {isExportingLogisys ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              <span>Logisys ERP CSV</span>
            </button>

            {/* Broadcast Academic Circular */}
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#29aae1] hover:bg-[#1e87b6] text-white shadow-xs flex items-center gap-2 transition cursor-pointer"
              title="Issue an academic directive or circular to faculty & students"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Circular</span>
            </button>

            {/* Refresh Data */}
            <button
              onClick={fetchDashboardData}
              className="p-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-800/80 transition cursor-pointer"
              title="Refresh Analytics Dataset"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Export Notification Toast */}
        {exportNotice && (
          <div className="mt-4 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportNotice}</span>
          </div>
        )}
      </div>

      {/* 2. Top Institutional KPI Cards (5 Cards fulfilling Requirement 1a) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Scholars Enrolled (105+) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Enrolled
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 font-mono">
              {institute_kpis.total_enrolled_scholars}+
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Across CSE, ISE & AIML branches
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-purple-700 font-bold">100% Centralized</span>
            <span className="text-slate-400 font-mono">8 Semesters</span>
          </div>
        </div>

        {/* Card 2: Overall Clearance Rate (%) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Clearance Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-700 font-mono">
              {institute_kpis.overall_clearance_rate}%
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {institute_kpis.total_cleared_degree} scholars degree cleared
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, institute_kpis.overall_clearance_rate)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Average Points per Student */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Avg Points / Scholar
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-blue-700 font-mono">
              {institute_kpis.avg_points_per_student}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              AICTE Degree Target: 200 pts
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-blue-700 font-bold">Progress Rate</span>
            <span className="text-slate-400 font-mono">
              {Math.round((institute_kpis.avg_points_per_student / 200) * 100)}%
            </span>
          </div>
        </div>

        {/* Card 4: Students at Risk */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Scholars at Risk
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-700 font-mono">
              {institute_kpis.total_at_risk_scholars ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Deficit &lt;60 pts in Sem 6+
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-rose-700 font-bold">Needs Remedial</span>
            <span className="text-slate-400">Counseling Active</span>
          </div>
        </div>

        {/* Card 5: Placement Ready Count */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Placement Ready
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-700 font-mono">
              {institute_kpis.placement_ready_scholars}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {institute_kpis.placement_readiness_pct}% eligibility benchmark
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-amber-700 font-bold">Pts ≥ 70 & CGPA ≥ 7.5</span>
            <span className="text-slate-400 font-mono">{institute_kpis.active_placement_drives} Drives</span>
          </div>
        </div>
      </div>

      {/* 3. Department-wise Comparative Table (Requirement 1b) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-700" />
              <span>Department-wise Comparative Conformance</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparative benchmark across CSE, ISE, and ECE/AIML departments for AICTE point milestones and pending faculty verification SLAs.
            </p>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('dean-export')}
              className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
            >
              <span>View Full Coordinator Master Sheet</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-3 text-center">Enrolled Scholars</th>
                <th className="py-3 px-3 text-center">Average Points</th>
                <th className="py-3 px-3 text-center">Degree Cleared (≥200)</th>
                <th className="py-3 px-3 text-center">Clearance Rate</th>
                <th className="py-3 px-3 text-center">Scholars at Risk</th>
                <th className="py-3 px-3 text-center">Pending Reviews Queue</th>
                <th className="py-3 px-4 text-center">Compliance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {department_comparison.map((dept) => {
                const isCompliant = dept.pending_reviews < 15;
                return (
                  <tr key={dept.department_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{dept.department_name}</div>
                      <div className="text-[11px] font-mono text-purple-700 font-bold">{dept.department_code}</div>
                    </td>

                    <td className="py-3.5 px-3 text-center font-black font-mono text-slate-800">
                      {dept.student_count}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span className="font-bold font-mono text-blue-700">{dept.avg_points} pts</span>
                      <span className="text-[10px] text-slate-400 block">/ 200 pts</span>
                    </td>

                    <td className="py-3.5 px-3 text-center font-bold font-mono text-emerald-700">
                      {dept.cleared_count}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5 font-bold font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span>{dept.clearance_rate}%</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {dept.at_risk_count > 0 ? (
                        <span className="font-bold font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          {dept.at_risk_count} at risk
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span className={`font-bold font-mono px-2 py-0.5 rounded-full border ${
                        dept.pending_reviews > 10
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {dept.pending_reviews} pending
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isCompliant
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {isCompliant ? <Check className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                        <span>{isCompliant ? 'SLA Conforming' : 'Action Required'}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Academic Year-wise Progression Breakdown (Requirement 1c) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Academic Year Progression: 1st Year Induction vs 2nd, 3rd, 4th Year Rules</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            1st Year student induction programs (SIP & Universal Human Values) evaluated independently from 2nd, 3rd, and 4th-year degree milestone caps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {year_progression.map((ys) => {
            const isFirstYear = ys.year === 1;
            const target = isFirstYear ? 40 : ys.year === 2 ? 80 : ys.year === 3 ? 150 : 200;
            const pct = Math.min(100, Math.round((ys.avg_points / target) * 100));

            return (
              <div
                key={ys.year}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition ${
                  isFirstYear
                    ? 'bg-purple-50/60 border-purple-200'
                    : ys.year === 4
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Year {ys.year} Cohort
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isFirstYear
                        ? 'bg-purple-100 text-purple-800 border-purple-300'
                        : ys.year === 4
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    }`}>
                      {isFirstYear ? 'Induction SIP' : `Target ${target} pts`}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 mt-2">
                    {ys.label}
                  </h3>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-slate-900 font-mono">{ys.avg_points}</span>
                      <span className="text-xs text-slate-400 font-mono"> / {target} pts</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700">{pct}% Conformance</span>
                  </div>

                  <div className="mt-2 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFirstYear ? 'bg-purple-600' : ys.year === 4 ? 'bg-emerald-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
                  <span>Scholars: <strong className="text-slate-900 font-mono">{ys.count}</strong></span>
                  <span>Cleared: <strong className="text-emerald-700 font-mono">{ys.cleared}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Placement Readiness Overview across Top Tech Companies (Requirement 1d) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span>Campus Placement Eligibility Across Premier Tech Recruiters</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cutoffs, packages, and minimum AICTE activity point thresholds verified for autonomous campus hiring drives.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              {placement_drives.length} Active Drives
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {placement_drives.map((drv) => (
            <div
              key={drv.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">{drv.company_name}</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black font-mono bg-purple-100 text-purple-800 border border-purple-200">
                    ₹{drv.package_lpa} LPA
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1">{drv.role_title}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">Min CGPA</span>
                  <span className="font-bold font-mono text-slate-800">{Number(drv.min_cgpa || 0).toFixed(1)} / 10.0</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">Min Activity Pts</span>
                  <span className="font-bold font-mono text-indigo-700">{drv.min_activity_points} Points</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                <span className="text-slate-500 font-medium">Drive Window: {new Date(drv.drive_date).toLocaleDateString()}</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Active</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Recent Academic Remedial Counseling Logs (Requirement 1e & updates.txt) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BadgeAlert className="w-5 h-5 text-amber-600" />
              <span>Institutional Remedial Academic Counseling Records</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Active counseling interventions initiated by faculty mentors following Mid-Semester Exam (MSE) performance evaluations.
            </p>
          </div>

          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 self-start sm:self-auto">
            {remedial_counseling_logs?.length || 0} Intervention Logs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="py-3 px-4">Scholar Details</th>
                <th className="py-3 px-3">Faculty Mentor</th>
                <th className="py-3 px-3">Course / Exam</th>
                <th className="py-3 px-3 text-center">MSE Score</th>
                <th className="py-3 px-4">Remedial Action Plan</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Date Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!remedial_counseling_logs || remedial_counseling_logs.length === 0) ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No remedial counseling records logged yet.
                  </td>
                </tr>
              ) : (
                remedial_counseling_logs.map((csl) => (
                  <tr key={csl.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{csl.student_name || 'Scholar'}</div>
                      <div className="text-[11px] font-mono text-purple-700 font-semibold">{csl.student_roll_no || 'USN'}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{csl.mentor_name || 'Faculty Mentor'}</div>
                      <div className="text-[10px] text-slate-400">Department Advisor</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{csl.subject_name || 'Assessment'}</div>
                      <div className="text-[11px] font-mono text-blue-700">{csl.subject_code || '21CS41'}</div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`font-black font-mono px-2 py-0.5 rounded text-xs border ${
                        (csl.mse_marks ?? 0) < 12
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}>
                        {csl.mse_marks ?? 0} / {csl.mse_max ?? 30}
                      </span>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-[11px] text-slate-700 line-clamp-2" title={csl.action_plan}>
                        {csl.action_plan}
                      </p>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        csl.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : csl.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {csl.status === 'resolved' ? 'Resolved' : csl.status === 'in_progress' ? 'In Progress' : 'Open Plan'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center text-[11px] text-slate-500 font-mono">
                      {new Date(csl.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Institutional Audit Logs Trail */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-700" />
            <span>Recent Institutional Activity & Broadcast Trail</span>
          </h2>
          <span className="text-[10px] text-slate-400 font-mono">Real-time ledger events</span>
        </div>

        <div className="space-y-2">
          {recent_logs.map((log) => (
            <div
              key={log.id}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-slate-800">{log.action}: </span>
                  <span className="text-slate-600 truncate">{log.details}</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 8. Executive Broadcast Circular Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-in max-h-[90vh] flex flex-col my-auto">
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 px-5 py-4 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Send className="w-4 h-4 text-purple-300" />
                  <span>Issue Executive Academic Council Circular</span>
                </h3>
                <p className="text-xs text-purple-200 mt-0.5">
                  Authority: Dr. Pawan Kumar, Dean of Academic Affairs
                </p>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              {broadcastSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{broadcastSuccess}</span>
                </div>
              )}
              {broadcastError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{broadcastError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Academic Entity
                </label>
                <select
                  value={broadcastAudience}
                  onChange={(e) => setBroadcastAudience(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-hidden cursor-pointer"
                >
                  <option value="all">All Academic Entities (Mentors & Scholars)</option>
                  <option value="mentors">Faculty Mentors & HODs Only</option>
                  <option value="students">Enrolled Scholars Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Circular Subject / Directive Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mandatory Deadline for Semester Activity Point Verification & ERP Sync"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Directive Body / Instructions
                </label>
                <textarea
                  rows={4}
                  placeholder="Detail institutional directives, conformance deadlines, verification standards, or meeting agendas..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  disabled={isBroadcasting}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-md shadow-purple-900/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isBroadcasting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Broadcast Directive</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
