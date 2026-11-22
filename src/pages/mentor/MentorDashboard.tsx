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
  GraduationCap,
} from 'lucide-react';

interface MentorDashboardProps {
  onOpenSchemaRequestModal: () => void;
  onNavigateTab: (tab: string) => void;
}

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

  const { mentor, mentees, pending_submissions } = stats;

  const filteredMentees = mentees.filter((m) => {
    if (!searchMenteeQuery.trim()) return true;
    const q = searchMenteeQuery.toLowerCase().trim();
    return (
      m.name.toLowerCase().includes(q) ||
      (m.roll_no && m.roll_no.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. Calm, Focused Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#8eb86e]/15 text-[#426b27] border border-[#8eb86e]/30">
              Faculty Mentorship Hub
            </span>
            <span className="text-xs text-slate-500 font-medium">Department of Computer Science & Engineering</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Welcome, Prof. {mentor.name}!
          </h1>

          <p className="text-xs text-slate-600">
            Track student activity points and review submitted certificate proofs for graduation clearance.
          </p>
        </div>

        {/* 3 Quick KPI Stat Badges */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Assigned</div>
            <div className="text-lg font-bold font-mono text-slate-900">{stats.mentees_count} Students</div>
          </div>

          <div className={`px-3.5 py-2 rounded-xl text-center border ${
            stats.pending_reviews_count > 0
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="text-[10px] font-bold uppercase tracking-wider">
              {stats.pending_reviews_count > 0 ? 'Pending Review' : 'Status'}
            </div>
            <div className="text-lg font-bold font-mono">
              {stats.pending_reviews_count > 0 ? `${stats.pending_reviews_count} Awaiting` : 'All Reviewed'}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Avg Points</div>
            <div className="text-lg font-bold font-mono text-indigo-600">{stats.avg_mentee_points} / 200</div>
          </div>
        </div>
      </div>

      {/* 2. Priority Action: Pending Verification Queue */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-purple-600" />
              <span>Pending Certificate Verification Queue</span>
              {stats.pending_reviews_count > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 font-mono">
                  {stats.pending_reviews_count} Awaiting
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Review proofs submitted by your assigned mentees to award activity credit.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('mentor-reviews')}
            className="text-xs font-semibold text-purple-700 hover:text-purple-900 cursor-pointer"
          >
            Full Queue View →
          </button>
        </div>

        {pending_submissions.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="font-bold text-sm text-slate-800">All caught up!</p>
            <p className="text-xs text-slate-500">
              No pending certificate proofs awaiting your review.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Activity & Category</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Points</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pending_submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-purple-50/20 transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 text-xs">{sub.student_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{sub.student_roll_no} • Sem {sub.student_semester || 6}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 text-xs">{sub.activity_title}</div>
                      <div className="text-[11px] text-slate-500">
                        {getCategoryPlainName(sub.category_id, sub.category_name)}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {sub.completion_date}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <span className="font-bold font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-xs">
                        +{sub.base_points || 20} pts
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setIsViewerOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-2xs transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review Proof</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Assigned Mentees Progress Roster */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-700" />
              <span>Assigned Mentees ({filteredMentees.length} Students)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Overview of 200 activity points progress per mentee.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search mentee name or USN..."
                value={searchMenteeQuery}
                onChange={(e) => setSearchMenteeQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 bg-slate-50 focus:bg-white transition"
              />
            </div>

            <button
              onClick={() => onNavigateTab('mentor-mentees')}
              className="text-xs font-semibold text-purple-700 hover:text-purple-900 shrink-0 cursor-pointer"
            >
              Detailed Roster →
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">USN</th>
                <th className="py-2.5 px-2 text-center">Sem</th>
                <th className="py-2.5 px-3">Progress towards 200 Pts</th>
                <th className="py-2.5 px-3 text-right">Approved Pts</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMentees.slice(0, 8).map((m) => {
                const approvedPts = m.approved_points || 0;
                const pct = Math.min(100, Math.round((approvedPts / 200) * 100));
                const isCleared = approvedPts >= 200;

                return (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {m.name}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {m.roll_no || 'N/A'}
                    </td>

                    <td className="py-2.5 px-2 text-center text-slate-600">
                      {m.semester || 6}
                    </td>

                    <td className="py-2.5 px-3 w-48">
                      <div className="space-y-1">
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCleared ? 'bg-emerald-500' : approvedPts >= 100 ? 'bg-indigo-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.max(4, pct)}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{pct}% completed</div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {approvedPts} <span className="text-[10px] font-normal text-slate-400">/ 200</span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {isCleared ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Cleared
                        </span>
                      ) : approvedPts >= 100 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          On Track
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Action Needed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF / Evidence Review Modal */}
      <PDFViewerModal
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setSelectedSubmission(null);
        }}
        submission={selectedSubmission}
        submissionsList={pending_submissions}
        canReview={true}
        onReview={handleReview}
      />
    </div>
  );
};
