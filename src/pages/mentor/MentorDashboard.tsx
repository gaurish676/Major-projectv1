import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MentorDashboardStats, Submission } from '../../types';
import { apiRequest } from '../../lib/api';
import { PDFViewerModal } from '../../components/common/PDFViewerModal';
import {
  Users,
  FileCheck2,
  TrendingUp,
  Clock,
  CheckCircle2,
  Eye,
  User as UserIcon,
  ChevronRight,
  FileSpreadsheet,
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

  const handleReview = async (action: 'approve' | 'reject', feedback?: string) => {
    if (!selectedSubmission) return;
    await apiRequest(`/api/submissions/${selectedSubmission.id}/review`, {
      method: 'POST',
      body: JSON.stringify({
        action,
        mentor_feedback: feedback,
      }),
    });
    await loadDashboard();
  };

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading mentor dashboard...</p>
        </div>
      </div>
    );
  }

  const { mentor, mentees, pending_submissions } = stats;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-slate-900 rounded-xl p-4 sm:p-5 text-white border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Faculty Mentor Portal
            </span>
            <span className="text-xs text-slate-400">CSE Department</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('profile')}
              title="Click to view & edit your faculty mentor profile"
              className="text-left group cursor-pointer"
            >
              <h1 className="text-xl sm:text-2xl font-bold text-white group-hover:text-purple-300 transition flex items-center gap-2">
                <span>Welcome, {mentor.name}</span>
                <span className="text-xs font-normal text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-700/60 group-hover:bg-purple-900 flex items-center gap-1">
                  <UserIcon className="w-3 h-3" />
                  <span>View Profile</span>
                  <ChevronRight className="w-3 h-3 opacity-70" />
                </span>
              </h1>
            </button>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Review certificate proofs submitted by your assigned students.
          </p>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Assigned Students
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {stats.mentees_count}
          </div>
          <p className="text-[11px] text-slate-500">Students under your mentorship</p>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Reviews
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono">
            {stats.pending_reviews_count}
          </div>
          <p className="text-[11px] text-slate-500">Certificates awaiting review</p>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Approved
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            {stats.approved_reviews_count}
          </div>
          <p className="text-[11px] text-slate-500">Certificates successfully approved</p>
        </div>
      </div>

      {/* Quick Action: Student Marks Review */}
      <div
        onClick={() => onNavigateTab('mentor-marks')}
        className="bg-gradient-to-r from-emerald-50 to-teal-50/50 hover:from-emerald-100 hover:to-teal-100/60 border border-emerald-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition group shadow-2xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-950 group-hover:text-emerald-800 flex items-center gap-1.5">
              <span>Review Student Marks (Semester-Wise)</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-200/70 text-emerald-900 font-extrabold">New</span>
            </div>
            <p className="text-[11px] text-emerald-700">
              Inspect theory exam, task/CIE, and lab marks submitted by your mentees across Sem 1 to Sem 8 with SGPA & CGPA tracking.
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition shrink-0" />
      </div>

      {/* Pending Evaluations Queue */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-purple-600" />
              <span>Pending Certificate Verification</span>
              {stats.pending_reviews_count > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 font-mono">
                  {stats.pending_reviews_count} Pending
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Inspect student certificate uploads and approve or reject.
            </p>
          </div>
        </div>

        {pending_submissions.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-lg border border-slate-100 space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
            <p className="font-semibold text-xs text-slate-700">
              All student submissions have been reviewed!
            </p>
            <p className="text-[11px] text-slate-400">
              New submissions from your assigned students will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Event / Activity</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Points</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pending_submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-purple-50/30 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 text-xs">
                        {sub.student_name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {sub.student_roll_no}
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 text-xs">
                        {sub.activity_title}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                      {sub.completion_date}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <span className="font-bold font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 text-xs">
                        +{sub.base_points || 20} pts
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setIsViewerOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assigned Students Roster */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Assigned Students (200-Pt Progress)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Students assigned under your guidance.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {mentees.map((m) => {
            const pct = m.completed_percentage;
            return (
              <div
                key={m.id}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-300 transition space-y-2.5 bg-slate-50/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">
                      {m.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {m.roll_no} • Sem {m.semester || 6}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-purple-700 font-mono">
                    {m.approved_points}/200p
                  </span>
                </div>

                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
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
        canReview={true}
        onReview={handleReview}
      />
    </div>
  );
};
