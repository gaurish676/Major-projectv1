import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MentorDashboardStats, Submission } from '../../types';
import { apiRequest } from '../../lib/api';
import { PDFViewerModal } from '../../components/common/PDFViewerModal';
import { getCategoryPlainName } from '../../lib/categories';
import { DashboardSkeleton } from '../../components/common/SkeletonLoaders';
import {
  Users,
  FileCheck2,
  TrendingUp,
  Clock,
  CheckCircle2,
  Eye,
  Search,
  ChevronRight,
  ChevronDown,
  GraduationCap,
  ClipboardList,
  AlertTriangle,
  Briefcase,
  Layers,
} from 'lucide-react';

interface MentorDashboardProps {
  onOpenSchemaRequestModal: () => void;
  onNavigateTab: (tab: string) => void;
}

// Authentic NMAMIT faculty courses
const MENTOR_COURSES = [
  'Advanced Data Structures (CS3102) - 5th Sem',
  'Cloud Computing Lab (CS3114) - 7th Sem',
  'Mini Project Review Committee 2026-27',
  'Department Examination Coordination (Logisys ERP)',
];

export const MentorDashboard: React.FC<MentorDashboardProps> = ({
  onOpenSchemaRequestModal,
  onNavigateTab,
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<MentorDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [searchMenteeQuery, setSearchMenteeQuery] = useState('');
  const [searchQueueQuery, setSearchQueueQuery] = useState('');

  // Timeline Filters
  const [timelineFilter, setTimelineFilter] = useState<'7days' | '30days' | 'all'>('7days');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest<MentorDashboardStats>('/api/mentor/dashboard');
      setStats(data);
    } catch (err) {
      console.error('Failed to load mentor dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const handleReview = async (
    action: 'approve' | 'reject',
    feedback?: string,
    customPoints?: number,
    checklist?: any
  ) => {
    if (!selectedSubmission) return;
    await apiRequest(`/api/submissions/${selectedSubmission.id}/review`, {
      method: 'POST',
      body: JSON.stringify({
        action,
        mentor_feedback: feedback,
        custom_points: customPoints,
        verification_checklist: checklist,
      }),
    });
    await loadDashboard();
  };

  if (isLoading || !stats) {
    return <DashboardSkeleton />;
  }

  const { mentor, mentees = [], pending_submissions = [] } = stats;

  const filteredMentees = mentees.filter((m) => {
    if (!searchMenteeQuery.trim()) return true;
    const q = searchMenteeQuery.toLowerCase().trim();
    return (
      m.name.toLowerCase().includes(q) ||
      (m.roll_no && m.roll_no.toLowerCase().includes(q))
    );
  });

  const filteredQueue = pending_submissions.filter((item) => {
    if (!searchQueueQuery.trim()) return true;
    const q = searchQueueQuery.toLowerCase().trim();
    return (
      item.activity_title.toLowerCase().includes(q) ||
      (item.student_name && item.student_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 antialiased">
      {/* 1. Moodle Greeting Header */}
      <div className="pt-1 pb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#ea580c] tracking-tight flex items-center gap-2">
          <span>Welcome back, Prof. {mentor.name}!</span>
          <span>👋</span>
        </h1>
      </div>

      {/* 2. Moodle Card 1: Timeline (Pending Certificate Review Queue) */}
      <section className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#ea580c]">
            Timeline{' '}
            <span className="text-xs font-normal text-slate-500">
              (Pending Certificate Verifications)
            </span>
          </h2>
          {stats.pending_reviews_count > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              {stats.pending_reviews_count} Awaiting
            </span>
          )}
        </div>

        {/* Filter controls matching Moodle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs text-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 flex items-center gap-1.5 font-medium transition cursor-pointer"
              >
                <span>
                  {timelineFilter === '7days'
                    ? 'Next 7 days'
                    : timelineFilter === '30days'
                    ? 'Next 30 days'
                    : 'All items'}
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
                    All items
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="relative sm:w-72">
            <input
              type="text"
              value={searchQueueQuery}
              onChange={(e) => setSearchQueueQuery(e.target.value)}
              placeholder="Search mentee or activity title"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#8eb86e] focus:ring-1 focus:ring-[#8eb86e] transition"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Timeline Content */}
        <div className="pt-2">
          {filteredQueue.length > 0 ? (
            <div className="space-y-2.5">
              {filteredQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.student_name}</span>
                        {item.student_roll_no && (
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded">
                            {item.student_roll_no}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 font-medium text-xs mt-0.5">
                        {item.activity_title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {getCategoryPlainName(item.category_id)} &bull; Submitted{' '}
                        {new Date(item.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => {
                        setSelectedSubmission(item);
                        setIsViewerOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#7eb462] hover:bg-[#6fa454] text-white font-bold text-xs shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Proof</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 stroke-1" />
              </div>
              <p className="text-sm font-medium text-slate-700">All reviews caught up!</p>
              <p className="text-xs text-slate-400">
                No certificate verification tasks require your action right now.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 3. Moodle Card 2: My courses & Faculty Batches */}
      <section className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#ea580c]">My courses & Mentorship Batches</h2>

        <div className="space-y-2 text-xs sm:text-sm text-slate-800">
          {MENTOR_COURSES.map((courseName) => (
            <div
              key={courseName}
              onClick={() => onNavigateTab('mentee-list')}
              className="py-1.5 flex items-center gap-2.5 hover:text-[#5c873f] transition cursor-pointer group"
            >
              <GraduationCap className="w-4 h-4 text-[#5c873f] shrink-0 group-hover:scale-110 transition" />
              <span className="font-normal group-hover:underline text-slate-700">
                {courseName}
              </span>
            </div>
          ))}

          {/* Integrated AICTE Mentorship Portal Module inside My courses */}
          <div className="mt-4 pt-4 border-t border-slate-200/90">
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/70 via-slate-50 to-white border border-[#8eb86e]/40 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#8eb86e]/20 text-[#5c873f] flex items-center justify-center shrink-0 mt-0.5">
                    <Users className="w-6 h-6 text-[#5c873f]" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        AICTE Activity Points Mentorship Cohort (2026-27)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8eb86e]/25 text-[#426b27]">
                        Active Cohort
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Cohort Size:{' '}
                      <span className="font-bold text-slate-900 font-mono">
                        {stats.mentees_count} Assigned Mentees
                      </span>{' '}
                      &bull; Avg Points:{' '}
                      <span className="font-bold text-slate-900 font-mono">
                        {stats.avg_mentee_points} / 200
                      </span>{' '}
                      &bull; Pending Review:{' '}
                      <span className="font-bold text-amber-700 font-mono">
                        {stats.pending_reviews_count}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => onNavigateTab('review-submissions')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#7eb462] hover:bg-[#6fa454] text-white shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>Review Queue</span>
                  </button>

                  <button
                    onClick={() => onNavigateTab('mentee-list')}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition cursor-pointer"
                  >
                    Mentee Roster
                  </button>

                  <button
                    onClick={() => onNavigateTab('mentor-student-marks')}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition cursor-pointer"
                  >
                    MSE Counseling
                  </button>

                  <button
                    onClick={() => onNavigateTab('mentor-placement')}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-[#426b27] border border-emerald-200 transition cursor-pointer"
                  >
                    Placement ➔
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => onNavigateTab('mentee-list')}
            className="text-xs font-semibold text-[#5c873f] hover:underline cursor-pointer"
          >
            All courses & batches ...
          </button>
        </div>
      </section>

      {/* 4. Moodle Card 3: Assigned Mentees Roster */}
      <section className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#ea580c]">Assigned Mentees</h2>
            <p className="text-xs text-slate-500">
              Overview of all {stats.mentees_count} students in your advisory cohort.
            </p>
          </div>

          <div className="relative sm:w-64">
            <input
              type="text"
              value={searchMenteeQuery}
              onChange={(e) => setSearchMenteeQuery(e.target.value)}
              placeholder="Filter mentees..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#8eb86e] focus:ring-1 focus:ring-[#8eb86e] transition"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">USN</th>
                <th className="py-2.5 px-3">Semester</th>
                <th className="py-2.5 px-3">CGPA</th>
                <th className="py-2.5 px-3">Activity Points</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMentees.slice(0, 10).map((m) => {
                const points = m.total_points || 0;
                const pct = Math.min(100, Math.round((points / 200) * 100));
                return (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{m.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{m.roll_no || '-'}</td>
                    <td className="py-2.5 px-3">Sem {m.semester || 7}</td>
                    <td className="py-2.5 px-3 font-mono">{m.cgpa ? m.cgpa.toFixed(2) : '-'}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-slate-900">{points}/200</span>
                        <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="bg-[#8eb86e] h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onNavigateTab('mentee-list')}
                        className="text-xs text-[#5c873f] font-semibold hover:underline cursor-pointer"
                      >
                        Inspect ➔
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Proof Review Modal */}
      {selectedSubmission && (
        <PDFViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          fileUrl={selectedSubmission.file_url}
          studentName={selectedSubmission.student_name || 'Student'}
          categoryName={getCategoryPlainName(selectedSubmission.category_id)}
          activityTitle={selectedSubmission.activity_title}
          submissionDate={selectedSubmission.submitted_at}
          basePoints={selectedSubmission.base_points}
          pointsAwarded={selectedSubmission.points_awarded}
          status={selectedSubmission.status}
          isAiAudited={selectedSubmission.is_ai_audited}
          aiAuditJson={selectedSubmission.ai_audit_json}
          evidenceType={selectedSubmission.evidence_type}
          isMentorReview={true}
          onReview={handleReview}
        />
      )}
    </div>
  );
};
