import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api';
import { StudentCreditReportData, User } from '../../types';
import { StudentCreditReportModal } from './StudentCreditReportModal';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Award,
  GraduationCap,
  Calendar,
  Layers,
  FileText,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  User as UserIcon,
  ChevronRight,
  Info,
  ArrowUpRight,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';

interface StudentVisualAnalyticsProps {
  studentId?: string; // Optional: if provided, loads this specific student; otherwise loads logged-in student
  onOpenSubmitModal?: () => void;
  showStudentSelector?: boolean;
  onBack?: () => void;
}

export const StudentVisualAnalytics: React.FC<StudentVisualAnalyticsProps> = ({
  studentId,
  onOpenSubmitModal,
  onBack,
}) => {
  const [reportData, setReportData] = useState<StudentCreditReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const url = studentId ? `/api/student/credit-report?student_id=${studentId}` : '/api/student/credit-report';
      const data = await apiRequest<StudentCreditReportData>(url);
      setReportData(data);
    } catch (err: any) {
      console.error('Failed to load visual analytics:', err);
      setError(err.message || 'Failed to load visual analytics report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Generating visual analytics on student performance...</p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800">Unable to load analytics</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">{error || 'No report data found.'}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { student, points_summary, categories_breakdown, semester_breakdown, submissions, academic_summary } = reportData;

  // Donut chart calculations
  const totalEarnedInCategories = categories_breakdown.reduce((sum: number, c: any) => sum + (c.earned_points || 0), 0) || 1;
  const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

  let accumulatedAngle = 0;
  const donutSegments = categories_breakdown.map((cat: any, idx: number) => {
    const value = cat.earned_points || 0;
    const percentage = value / totalEarnedInCategories;
    const strokeDasharray = `${percentage * 282.74} 282.74`; // Circumference of radius 45 is 2 * PI * 45 = 282.74
    const strokeDashoffset = -accumulatedAngle * 282.74;
    accumulatedAngle += percentage;
    return {
      ...cat,
      percentage: Math.round(percentage * 100),
      strokeDasharray,
      strokeDashoffset,
      color: colors[idx % colors.length],
    };
  });

  // Cumulative line calculation
  let runningTotal = 0;
  const cumulativePoints = semester_breakdown.map((sem: any) => {
    runningTotal += sem.capped_points || 0;
    return {
      semester: sem.semester,
      points: runningTotal,
      capped: sem.capped_points || 0,
      excess: sem.excess_points || 0,
    };
  });

  return (
    <div className="space-y-4">
      {/* Top Banner: Student Header + Quick Extract PDF Action */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center font-bold text-xl text-indigo-300 shrink-0 shadow-xs">
            {student.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                Student Analytics Dossier
              </span>
              <span className="text-[11px] text-slate-400 font-mono">{student.roll_no || '1MS21CS098'}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white mt-0.5">
              {student.name}
            </h1>
            <p className="text-xs text-slate-300">
              Department of Computer Science & Engineering | Semester {student.semester || 6} | Mentor: {student.mentor_name || 'Prof. Anita Desai'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer border border-slate-700"
              title="Return to Assigned Mentees Roster"
            >
              <ArrowLeft className="w-4 h-4 text-slate-300" />
              <span>Back to Mentees</span>
            </button>
          )}

          <button
            onClick={() => setIsPDFModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition transform active:scale-95 cursor-pointer"
            title="Download Official Student Credit Report as PDF"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Extract Credit Report (PDF)</span>
          </button>
          
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            title="Refresh Data Visualizations"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Effective Degree Points */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Degree Credits</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {points_summary.total_effective_points}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ 200 pts</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${Math.min(100, points_summary.progress_percentage)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
            <span>Progress: <strong>{points_summary.progress_percentage}%</strong></span>
            <span>{200 - points_summary.total_effective_points} pts rem</span>
          </div>
        </div>

        {/* Metric 2: Semester Cap Adherence */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Capped Excess</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
              +{points_summary.total_excess_points}
            </span>
            <span className="text-xs font-semibold text-slate-400">pts</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Points exceeding the 30 pts/sem limit (safeguarded continuous learning)
          </p>
        </div>

        {/* Metric 3: Academic SGPA Balance */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Academic CGPA</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-blue-600 font-mono">
              {academic_summary.cumulative_sgpa || student.cgpa || 8.4}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ 10.0</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Based on {academic_summary.total_credits || 120} curriculum course credits
          </p>
        </div>

        {/* Metric 4: Verified Submissions */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Proof Dossier</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600 font-mono">
              {submissions.length}
            </span>
            <span className="text-xs font-semibold text-slate-400">certificates</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {submissions.filter((s: any) => s.status === 'approved').length} verified & approved by faculty
          </p>
        </div>
      </div>

      {/* Row 2: Visual Chart Pair (Donut Chart + Semester Progression Bar Graph) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Chart 1: Category Distribution Donut & Progress (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Credit Domain Distribution</h3>
            </div>
            <span className="text-[10px] text-slate-400 uppercase font-bold font-mono">Points by Category</span>
          </div>

          {/* SVG Donut Chart */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="text-slate-100"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                />
                {donutSegments.map((seg: any, i: number) => (
                  <circle
                    key={seg.id || i}
                    cx="50"
                    cy="50"
                    r="45"
                    stroke={seg.color}
                    strokeWidth={selectedCategoryIdx === i ? 12 : 10}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    fill="transparent"
                    className="transition-all duration-300 cursor-pointer hover:opacity-90"
                    onMouseEnter={() => setSelectedCategoryIdx(i)}
                    onMouseLeave={() => setSelectedCategoryIdx(null)}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xl font-black font-mono text-slate-900">
                  {selectedCategoryIdx !== null ? donutSegments[selectedCategoryIdx].earned_points : points_summary.raw_total_points}
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-400">
                  {selectedCategoryIdx !== null ? 'Category Pts' : 'Total Pts'}
                </span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="space-y-1.5 w-full text-xs">
              {donutSegments.map((cat: any, i: number) => (
                <div
                  key={cat.id || i}
                  onMouseEnter={() => setSelectedCategoryIdx(i)}
                  onMouseLeave={() => setSelectedCategoryIdx(null)}
                  className={`flex items-center justify-between p-1.5 rounded-lg transition cursor-pointer ${
                    selectedCategoryIdx === i ? 'bg-indigo-50/70 text-indigo-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="truncate text-xs">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs">
                    <strong className="text-slate-900">{cat.earned_points || 0}</strong>
                    <span className="text-[10px] text-slate-400">/ {cat.max_cap_points}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Category caps prevent over-concentration in single domains (e.g. MOOCs max 50 pts).</span>
          </div>
        </div>

        {/* Chart 2: Semester-by-Semester Progression Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Semester Credit Velocity (Sem 1 – 8)</h3>
                <p className="text-[10px] text-slate-500">Evaluation against 30 Pts / Semester limit</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-indigo-600" />
                <span>Approved</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-amber-400" />
                <span>Excess (Capped)</span>
              </span>
            </div>
          </div>

          {/* Bar Chart Visual */}
          <div className="h-52 w-full pt-4 flex items-end justify-between gap-2 sm:gap-3 px-2 border-b border-slate-200 relative">
            {/* 30-pts Cap Target Line */}
            <div className="absolute left-0 right-0 top-[35%] border-b border-dashed border-red-300 z-0 flex items-center justify-end pr-2">
              <span className="text-[9px] font-mono font-bold text-red-500 bg-red-50 px-1 rounded">
                Cap: 30 Pts
              </span>
            </div>

            {semester_breakdown.map((sem: any) => {
              const capped = sem.capped_points || 0;
              const excess = sem.excess_points || 0;
              const maxScale = 50; // max scale height
              const cappedHeight = Math.min(100, Math.round((capped / maxScale) * 100));
              const excessHeight = Math.min(100, Math.round((excess / maxScale) * 100));

              return (
                <div key={sem.semester} className="flex-1 flex flex-col items-center h-full justify-end group relative z-10">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition absolute -top-12 bg-slate-900 text-white text-[10px] rounded px-2 py-1 pointer-events-none whitespace-nowrap shadow-lg z-20">
                    <div>Sem {sem.semester}: <strong>{capped + excess} pts</strong></div>
                    <div className="text-[9px] text-slate-300">({capped} approved {excess > 0 ? `+ ${excess} excess` : ''})</div>
                  </div>

                  {/* Bar columns */}
                  <div className="w-full max-w-[28px] flex flex-col items-center justify-end h-full">
                    {excess > 0 && (
                      <div
                        className="w-full bg-amber-400 rounded-t-xs transition-all duration-500"
                        style={{ height: `${excessHeight}%` }}
                      />
                    )}
                    <div
                      className={`w-full rounded-t-xs transition-all duration-500 ${
                        capped >= 30 ? 'bg-emerald-600' : capped > 0 ? 'bg-indigo-600' : 'bg-slate-100'
                      }`}
                      style={{ height: `${Math.max(capped > 0 ? 8 : 2, cappedHeight)}%` }}
                    />
                  </div>

                  {/* X-axis Label */}
                  <div className="text-center pt-2">
                    <span className="text-[10px] font-bold text-slate-700 block">S{sem.semester}</span>
                    <span className="text-[9px] font-mono text-slate-400 font-semibold block">{capped}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1">
            <span>Continuous development rule: Activity points must be spread across all active academic semesters.</span>
          </div>
        </div>

      </div>

      {/* Row 3: Cumulative 200-Points Trajectory Curve */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Cumulative 200-Point Degree Trajectory</h3>
              <p className="text-[10px] text-slate-500">Graduation milestones path from Sem 1 to Sem 8</p>
            </div>
          </div>

          {/* Benchmark Badges */}
          <div className="flex items-center gap-2 text-[10px] font-bold">
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">Bronze (50)</span>
            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">Silver (100)</span>
            <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">Gold (150)</span>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800">Diamond (200)</span>
          </div>
        </div>

        {/* Milestone Progress Bar Line */}
        <div className="relative py-4">
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (points_summary.total_effective_points / 200) * 100)}%` }}
            />
          </div>

          {/* Markers */}
          <div className="grid grid-cols-4 pt-2 text-xs font-semibold text-slate-500 text-center">
            <div>
              <span className="block text-[10px] text-slate-400">Semester 2</span>
              <strong className="text-slate-800">50 Pts</strong>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Semester 4</span>
              <strong className="text-slate-800">100 Pts</strong>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Semester 6</span>
              <strong className="text-slate-800">150 Pts</strong>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Semester 8</span>
              <strong className="text-emerald-700 font-extrabold">200 Pts (Clearance)</strong>
            </div>
          </div>
        </div>

        {/* Semester-by-Semester Cumulative Points Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2 px-3">Semester</th>
                <th className="py-2 px-3 text-center">Points Earned This Sem</th>
                <th className="py-2 px-3 text-center">Cap Applied</th>
                <th className="py-2 px-3 text-center">Cumulative Total</th>
                <th className="py-2 px-3 text-right">Milestone Clearance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cumulativePoints.map((cp: any) => (
                <tr key={cp.semester} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-semibold text-slate-800">Semester {cp.semester}</td>
                  <td className="py-2 px-3 text-center font-mono">{cp.capped + cp.excess} pts</td>
                  <td className="py-2 px-3 text-center font-mono text-indigo-600 font-bold">{cp.capped} pts</td>
                  <td className="py-2 px-3 text-center font-mono font-black text-slate-900">{cp.points} / 200</td>
                  <td className="py-2 px-3 text-right">
                    {cp.points >= 200 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Cleared (Diamond)
                      </span>
                    ) : cp.points >= 150 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
                        Gold Tier
                      </span>
                    ) : cp.points >= 100 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                        Silver Tier
                      </span>
                    ) : cp.points >= 50 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        Bronze Tier
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">In Progress</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Export Modal */}
      <StudentCreditReportModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        reportData={reportData}
      />
    </div>
  );
};
