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
  Search,
  ChevronDown,
  CheckCircle2,
  Clock,
  ClipboardList,
  Eye,
  Award,
  Sparkles,
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

  // Timeline Filters
  const [timelineFilter, setTimelineFilter] = useState<'7days' | '30days' | 'all'>('7days');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'dates' | 'courses'>('dates');

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

  // Filter pending or actionable items for Moodle Timeline
  const pendingSubmissions = recent_submissions.filter((s) => s.status === 'pending');
  const filteredTimelineItems = pendingSubmissions.filter((item) =>
    item.activity_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 antialiased">
      {/* 1. Moodle Clean Greeting (matching lms_homepage.png: "Welcome back, NNM23CS078! 👋") */}
      <div className="pt-1 pb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#ea580c] tracking-tight flex items-center gap-2">
          <span>Welcome back, {student.roll_no || student.name || 'NNM23CS078'}!</span>
          <span>👋</span>
        </h1>
      </div>

      {/* 2. Moodle Card 1: Timeline (matching lms_homepage.png) */}
      <section className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#ea580c]">Timeline</h2>

        {/* Filter controls matching Moodle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs text-slate-700">
          <div className="flex items-center gap-2.5">
            {/* Days Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsFilterDropdownOpen((prev) => !prev);
                  setIsSortDropdownOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 flex items-center gap-1.5 font-medium transition cursor-pointer"
              >
                <span>
                  {timelineFilter === '7days'
                    ? 'Next 7 days'
                    : timelineFilter === '30days'
                    ? 'Next 30 days'
                    : 'All events'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isFilterDropdownOpen && (
                <div className="absolute left-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 text-xs">
                  <button
                    onClick={() => {
                      setTimelineFilter('7days');
                      setIsFilterDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 transition"
                  >
                    Next 7 days
                  </button>
                  <button
                    onClick={() => {
                      setTimelineFilter('30days');
                      setIsFilterDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 transition"
                  >
                    Next 30 days
                  </button>
                  <button
                    onClick={() => {
                      setTimelineFilter('all');
                      setIsFilterDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 transition"
                  >
                    All events
                  </button>
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsSortDropdownOpen((prev) => !prev);
                  setIsFilterDropdownOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 flex items-center gap-1.5 font-medium transition cursor-pointer"
              >
                <span>{sortBy === 'dates' ? 'Sort by dates' : 'Sort by courses'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isSortDropdownOpen && (
                <div className="absolute left-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 text-xs">
                  <button
                    onClick={() => {
                      setSortBy('dates');
                      setIsSortDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 transition"
                  >
                    Sort by dates
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('courses');
                      setIsSortDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 transition"
                  >
                    Sort by courses
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search by activity type or name */}
          <div className="relative sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by activity type or name"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#8eb86e] focus:ring-1 focus:ring-[#8eb86e] transition"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Timeline Content: Action items or Moodle empty state */}
        <div className="pt-2">
          {filteredTimelineItems.length > 0 ? (
            <div className="space-y-2.5">
              {filteredTimelineItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">{item.activity_title}</p>
                      <p className="text-[11px] text-slate-500">
                        {getCategoryPlainName(item.category_id)} &bull; Submitted{' '}
                        {new Date(item.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Under Review
                    </span>
                    {item.file_url && (
                      <button
                        onClick={() => {
                          setSelectedSubmission(item);
                          setIsViewerOpen(true);
                        }}
                        className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition flex items-center gap-1 cursor-pointer"
                        title="View Certificate Proof"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Proof</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                <ClipboardList className="w-6 h-6 stroke-1" />
              </div>
              <p className="text-sm font-medium text-slate-500">No activities require action</p>
            </div>
          )}
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
              className="py-1.5 flex items-center gap-2.5 hover:text-[#5c873f] transition cursor-pointer group"
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
