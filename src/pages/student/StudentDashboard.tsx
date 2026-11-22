import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentDashboardStats, Submission, StudentCreditReportData } from '../../types';
import { apiRequest } from '../../lib/api';
import { PDFViewerModal } from '../../components/common/PDFViewerModal';
import { StudentCreditReportModal } from '../../components/common/StudentCreditReportModal';
import { AIAdvisorModal } from '../../components/common/AIAdvisorModal';
import { DashboardSkeleton } from '../../components/common/SkeletonLoaders';
import { getCategoryPlainName } from '../../lib/categories';
import {
  GraduationCap,
  PlusCircle,
  Printer,
  CheckCircle2,
  Clock,
  Eye,
  Award,
  Sparkles,
  ChevronRight,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface StudentDashboardProps {
  onOpenSubmitModal: () => void;
  onNavigateTab: (tab: string) => void;
}

// Authentic NMAMIT course listing matching Moodle screenshot lms_homepage.png
const MOODLE_COURSES = [
  'Indian Knowledge System',
  'indian knowledege system',
  'CS Department News and Activities',
  'CG-B-2026',
  'Mobile Application Development Lab(B section)',
  'Elective CSE 7th Sem 2026-27',
  'CSE Feedback 2026-2027 Odd Sem',
  'CSE Feedback 2025-2026 Even Sem',
  'NOSQL DATABASE-2026-27',
  'Software Testing (CS3314-1) 2026-27',
  'Financial Management-2026-27',
];

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onOpenSubmitModal,
  onNavigateTab,
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isCreditReportOpen, setIsCreditReportOpen] = useState(false);
  const [creditReportData, setCreditReportData] = useState<StudentCreditReportData | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isAIAdvisorOpen, setIsAIAdvisorOpen] = useState(false);

  const handleOpenCreditReport = async () => {
    try {
      setIsGeneratingReport(true);
      const data = await apiRequest<StudentCreditReportData>('/api/student/credit-report');
      setCreditReportData(data);
      setIsCreditReportOpen(true);
    } catch (err) {
      console.error('Failed to load credit report:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest<StudentDashboardStats>('/api/student/dashboard');
      setStats(data);
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const handleCreated = () => {
      loadDashboard();
    };
    window.addEventListener('submission-created', handleCreated);
    return () => {
      window.removeEventListener('submission-created', handleCreated);
    };
  }, [user]);

  if (isLoading || !stats) {
    return <DashboardSkeleton />;
  }

  const { student, recent_submissions = [] } = stats;
  const approvedPoints = stats.total_points || 0;
  const targetPoints = stats.target_points || 200;
  const percentage = Math.min(100, Math.round((approvedPoints / targetPoints) * 100));
  const remainingPoints = Math.max(0, targetPoints - approvedPoints);
  const isCleared = remainingPoints === 0;

  // Submissions awaiting evaluation
  const pendingSubmissions = recent_submissions.filter((s) => s.status === 'pending');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 antialiased">
      {/* 1. Moodle Clean Greeting (matching lms_homepage.png: "Welcome back, NNM23CS078! 👋") */}
      <div className="pt-1 pb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#ea580c] tracking-tight flex items-center gap-2">
          <span>Welcome back, {student.roll_no || student.name || 'NNM23CS078'}!</span>
          <span>👋</span>
        </h1>
      </div>

      {/* 2. Moodle Card 1: AICTE Activity Points Progress (Replacing Timeline) */}
      <section className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#ea580c] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#ea580c]" />
              <span>AICTE Activity Points & Degree Clearance Progress</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Autonomous Degree Requirement: 200 points across accredited activity domains &bull; Mentor: Prof. {student.mentor_name || 'Joylin Mendonca'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                isCleared
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isCleared ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>
                {isCleared
                  ? 'Degree Clearance Qualified'
                  : `${remainingPoints} Points Needed for Degree Clearance`}
              </span>
            </span>
          </div>
        </div>

        {/* Primary 200-Point Progress Meter with Milestone Badges */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                {approvedPoints}
              </span>
              <span className="text-sm font-bold text-slate-400 font-mono">
                / {targetPoints} Target Points
              </span>
              <span className="text-xs font-bold text-[#5c873f] bg-[#8eb86e]/20 px-2 py-0.5 rounded-full ml-1 font-mono">
                {percentage}% Completed
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Milestone Level:</span>
              <span className="font-bold text-[#436b28] bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{stats.milestone_tier || 'Bronze Tier'}</span>
              </span>
            </div>
          </div>

          {/* Master Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-[#8eb86e] to-[#5c873f] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, percentage)}%` }}
              />
            </div>

            {/* Milestone markers along 200 points */}
            <div className="grid grid-cols-4 text-[10px] text-slate-500 font-medium pt-1">
              <div className="text-left">
                <span className={approvedPoints >= 50 ? 'text-[#5c873f] font-bold' : ''}>
                  50 pts (Bronze)
                </span>
              </div>
              <div className="text-center">
                <span className={approvedPoints >= 100 ? 'text-[#5c873f] font-bold' : ''}>
                  100 pts (Silver)
                </span>
              </div>
              <div className="text-center">
                <span className={approvedPoints >= 150 ? 'text-[#5c873f] font-bold' : ''}>
                  150 pts (Gold)
                </span>
              </div>
              <div className="text-right">
                <span className={approvedPoints >= 200 ? 'text-emerald-700 font-bold' : ''}>
                  200 pts (Diamond & Clearance)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Quick Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Approved Points</span>
            <span className="text-xl font-bold font-mono text-emerald-700 mt-0.5 block">{approvedPoints} pts</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">{percentage}% toward degree</span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Under Evaluation</span>
            <span className="text-xl font-bold font-mono text-amber-600 mt-0.5 block">{pendingSubmissions.length} certificates</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Pending mentor review</span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Verified Proofs</span>
            <span className="text-xl font-bold font-mono text-slate-900 mt-0.5 block">{stats.approved_submissions_count || 0} approved</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Faculty verified</span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Degree Clearance</span>
            <span className={`text-xl font-bold font-mono mt-0.5 block ${isCleared ? 'text-emerald-700' : 'text-[#ea580c]'}`}>
              {isCleared ? 'Cleared' : `${remainingPoints} pts left`}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Official Logisys criteria</span>
          </div>
        </div>

        {/* Category Domain Caps Progress Breakdown */}
        {stats.categories_breakdown && stats.categories_breakdown.length > 0 && (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#5c873f]" />
                <span>Accredited Category Domain Caps & Progress</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('explore-schema')}
                className="text-xs text-[#5c873f] hover:underline font-semibold cursor-pointer"
              >
                View Marking Rules ➔
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {stats.categories_breakdown.map((cat) => {
                const catEarned = cat.capped_points || 0;
                const catMax = cat.max_cap_points || 60;
                const catPct = Math.min(100, Math.round((catEarned / catMax) * 100));
                const isCapReached = catEarned >= catMax;

                return (
                  <div
                    key={cat.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#8eb86e]/60 transition flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-900 truncate" title={cat.name}>
                          {cat.name}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono shrink-0 ${
                            isCapReached
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200/80 text-slate-700'
                          }`}
                        >
                          {isCapReached ? 'Cap Full' : `${catMax - catEarned}p left`}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between text-xs mt-1">
                        <span className="font-mono font-bold text-slate-800">
                          {catEarned} <span className="text-slate-400 font-normal">/ {catMax} pts</span>
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-slate-500">
                          {catPct}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isCapReached ? 'bg-emerald-600' : 'bg-[#8eb86e]'
                        }`}
                        style={{ width: `${catPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending Submissions / Actions Strip (if any) */}
        {pendingSubmissions.length > 0 && (
          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Certificates Awaiting Mentor Evaluation ({pendingSubmissions.length})</span>
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('submission-history')}
                className="text-[11px] font-semibold text-amber-800 hover:underline cursor-pointer"
              >
                View in Ledger ➔
              </button>
            </div>

            <div className="space-y-1.5">
              {pendingSubmissions.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg bg-white border border-amber-200/70 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{item.activity_title}</p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {getCategoryPlainName(item.category_id)} &bull; Submitted {new Date(item.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      Under Review
                    </span>
                    {item.file_url && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubmission(item);
                          setIsViewerOpen(true);
                        }}
                        className="px-2 py-0.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px] transition flex items-center gap-1 cursor-pointer"
                        title="View Certificate Proof"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Proof</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Card Footer Quick Actions */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSubmitModal}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#7eb462] hover:bg-[#6fa454] text-white shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Upload Certificate</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreditReport}
              disabled={isGeneratingReport}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>{isGeneratingReport ? 'Generating...' : 'PDF Transcript'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('submission-history')}
            className="text-xs font-semibold text-[#5c873f] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Full Submissions Ledger</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 3. Moodle Card 2: My courses + AICTE Feature Block */}
      <section
        id="my-courses-section"
        className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4"
      >
        <h2 className="text-lg font-bold text-[#ea580c]">My courses</h2>

        {/* Regular Moodle Course Items matching lms_homepage.png */}
        <div className="space-y-2 text-xs sm:text-sm text-slate-800">
          {MOODLE_COURSES.map((courseName) => (
            <div
              key={courseName}
              onClick={() => onNavigateTab('update-marks')}
              className="py-1.5 flex items-center gap-2.5 hover:text-[#5c873f] transition cursor-pointer group"
              title={`View academic syllabus & marks for ${courseName}`}
            >
              <GraduationCap className="w-4 h-4 text-[#5c873f] shrink-0 group-hover:scale-110 transition" />
              <span className="font-normal group-hover:underline text-slate-700">
                {courseName}
              </span>
            </div>
          ))}

          {/* Integrated AICTE Activity Points Course Card (Our Feature inside Moodle!) */}
          <div className="mt-4 pt-4 border-t border-slate-200/90">
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/70 via-slate-50 to-white border border-[#8eb86e]/40 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#8eb86e]/20 text-[#5c873f] flex items-center justify-center shrink-0 mt-0.5">
                    <GraduationCap className="w-6 h-6 text-[#5c873f]" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        AICTE Activity Points & Degree Clearance Portal (2026-27)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8eb86e]/25 text-[#426b27]">
                        Mandatory Degree Module
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Current Score:{' '}
                      <span className="font-bold text-slate-900 font-mono">
                        {approvedPoints} / {targetPoints} Points
                      </span>{' '}
                      ({percentage}% completed) &bull; Mentor: Prof.{' '}
                      {student.mentor_name || 'Joylin Mendonca'}
                    </p>
                  </div>
                </div>

                {/* Direct Action Triggers */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={onOpenSubmitModal}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#7eb462] hover:bg-[#6fa454] text-white shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                    title="Upload certificate proof"
                  >
                    <PlusCircle className="w-4 h-4 text-white" />
                    <span>Upload Proof</span>
                  </button>

                  <button
                    onClick={handleOpenCreditReport}
                    disabled={isGeneratingReport}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    title="Download official PDF credit report"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isGeneratingReport ? 'Generating...' : 'PDF Report'}</span>
                  </button>

                  <button
                    onClick={() => onNavigateTab('submission-history')}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-[#426b27] border border-emerald-200 transition cursor-pointer"
                    title="View complete submissions ledger"
                  >
                    Ledger ➔
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Moodle "All courses ..." bottom link */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('my-courses-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-xs font-semibold text-[#5c873f] hover:underline cursor-pointer"
          >
            All courses ...
          </button>
        </div>
      </section>

      {/* Proof Preview Modal */}
      {selectedSubmission && (
        <PDFViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          fileUrl={selectedSubmission.file_url}
          studentName={student.name}
          categoryName={getCategoryPlainName(selectedSubmission.category_id)}
          activityTitle={selectedSubmission.activity_title}
          submissionDate={selectedSubmission.submitted_at}
          basePoints={selectedSubmission.base_points}
          pointsAwarded={selectedSubmission.points_awarded}
          status={selectedSubmission.status}
          isAiAudited={selectedSubmission.is_ai_audited}
          aiAuditJson={selectedSubmission.ai_audit_json}
          evidenceType={selectedSubmission.evidence_type}
        />
      )}

      {/* Credit Report Modal */}
      {creditReportData && (
        <StudentCreditReportModal
          isOpen={isCreditReportOpen}
          onClose={() => setIsCreditReportOpen(false)}
          data={creditReportData}
        />
      )}

      {/* AI Advisor Modal */}
      <AIAdvisorModal isOpen={isAIAdvisorOpen} onClose={() => setIsAIAdvisorOpen(false)} />
    </div>
  );
};
