import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentDashboardStats, Submission } from '../../types';
import { apiRequest } from '../../lib/api';
import { StatusBadge } from '../../components/common/Badge';
import { PDFViewerModal } from '../../components/common/PDFViewerModal';
import {
  Eye,
  PlusCircle,
  FileText,
  TrendingUp,
  CheckCircle2,
  Clock,
  Award,
  User as UserIcon,
  ChevronRight,
} from 'lucide-react';

interface StudentDashboardProps {
  onOpenSubmitModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onOpenSubmitModal,
  onNavigateTab,
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

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
  }, [user]);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading student dashboard...</p>
        </div>
      </div>
    );
  }

  const { student, recent_submissions } = stats;
  const approvedPoints = stats.total_points || 0;
  const pendingPoints = recent_submissions
    .filter((s) => s.status === 'pending')
    .reduce((sum, s) => sum + (s.base_points || 20), 0);
  const totalSubmissions = recent_submissions.length;
  const approvedSubmissions = recent_submissions.filter((s) => s.status === 'approved').length;

  return (
    <div className="space-y-4">
      {/* Top Header: Student Greeting & Quick Action */}
      <div className="bg-slate-900 rounded-xl p-4 sm:p-5 text-white border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Student Portal
            </span>
            <span className="text-xs text-slate-400">Department of Computer Science & Engineering</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('profile')}
              title="Click to view & edit your student profile"
              className="text-left group cursor-pointer"
            >
              <h1 className="text-xl sm:text-2xl font-bold text-white group-hover:text-indigo-300 transition flex items-center gap-2">
                <span>Welcome, {student.name}</span>
                <span className="text-xs font-normal text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-700/60 group-hover:bg-indigo-900 flex items-center gap-1">
                  <UserIcon className="w-3 h-3" />
                  <span>View Profile</span>
                  <ChevronRight className="w-3 h-3 opacity-70" />
                </span>
              </h1>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-300">
            {student.roll_no && (
              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono text-[11px]">
                {student.roll_no}
              </span>
            )}
            <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
              Semester {student.semester || 6}
            </span>
          </div>
        </div>

        <button
          onClick={onOpenSubmitModal}
          className="px-4 py-2.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Submit Activity Certificate</span>
        </button>
      </div>

      {/* Credit Gained Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Approved Credits */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Approved Credits Gained
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-emerald-600 font-mono">
              {approvedPoints}
            </span>
            <span className="text-xs font-semibold text-slate-400">credits</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Verified by faculty mentor ({approvedSubmissions} activities approved)
          </p>
        </div>

        {/* 2. Pending Credits */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Verification
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-amber-600 font-mono">
              {pendingPoints}
            </span>
            <span className="text-xs font-semibold text-slate-400">credits</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Under mentor review
          </p>
        </div>

        {/* 3. Total Submissions */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Submissions
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-indigo-600 font-mono">
              {totalSubmissions}
            </span>
            <span className="text-xs font-semibold text-slate-400">certificates</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Submitted activity proofs
          </p>
        </div>
      </div>

      {/* Submitted Activities Table */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>My Submitted Activities</span>
            </h3>
            <p className="text-xs text-slate-500">
              List of all uploaded certificates with review status and credits.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Activity / Event Name</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Credits</th>
                <th className="py-2.5 px-3 text-center">Certificate Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent_submissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    No activity certificates submitted yet. Click "Submit Activity Certificate" above to upload your first proof!
                  </td>
                </tr>
              ) : (
                recent_submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 text-xs">
                        {sub.activity_title}
                      </div>
                      {sub.mentor_feedback && (
                        <div className="text-[10px] text-amber-700 mt-0.5">
                          Feedback: {sub.mentor_feedback}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                      {sub.completion_date}
                    </td>

                    <td className="py-2.5 px-3">
                      <StatusBadge status={sub.status} />
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`font-bold font-mono text-xs ${
                          sub.status === 'approved' ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      >
                        {sub.status === 'approved' ? `+${sub.points_awarded}` : `${sub.base_points || 20}p`}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setIsViewerOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Proof</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof Viewer Modal */}
      <PDFViewerModal
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setSelectedSubmission(null);
        }}
        submission={selectedSubmission}
      />
    </div>
  );
};
