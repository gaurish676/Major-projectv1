import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentDashboardStats, Submission } from '../../types';
import { apiRequest } from '../../lib/api';
import { StatusBadge } from '../../components/common/Badge';
import { PDFViewerModal } from '../../components/common/PDFViewerModal';
import { DegreeClearanceMeter } from '../../components/common/DegreeClearanceMeter';
import { DeliveryStatusTracker } from '../../components/common/DeliveryStatusTracker';
import { getCategoryPlainName, getCategoryEmoji, CATEGORIES } from '../../lib/categories';
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
  Camera,
  Sparkles,
  Zap,
  FileSpreadsheet,
  Calendar,
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
      {/* Top Header: Student Welcome & Direct Snap CTA */}
      <div className="bg-[#0B1329] rounded-2xl p-4 sm:p-5 text-white border border-slate-800/80 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-sky-300 border border-blue-500/30">
              Student Clearance Portal
            </span>
            <span className="text-xs text-slate-400">Department of Computer Science & Engineering</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('profile')}
              title="Click to view your student profile"
              className="text-left group cursor-pointer"
            >
              <h1 className="text-xl sm:text-2xl font-bold text-white group-hover:text-sky-300 transition flex items-center gap-2">
                <span>Welcome, {student.name}</span>
                <span className="text-xs font-normal text-sky-300 bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-800/60 group-hover:bg-blue-900 flex items-center gap-1">
                  <UserIcon className="w-3 h-3" />
                  <span>Profile</span>
                  <ChevronRight className="w-3 h-3 opacity-70" />
                </span>
              </h1>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-300">
            {student.roll_no && (
              <span className="bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700 font-mono text-[11px]">
                {student.roll_no}
              </span>
            )}
            <span className="bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
              Semester {student.semester || 6}
            </span>
            {student.mentor_name && (
              <span className="bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/60 text-sky-300 text-[11px]">
                Mentor: {student.mentor_name}
              </span>
            )}
          </div>
        </div>

        {/* Big High-Affordance Button */}
        <button
          onClick={onOpenSubmitModal}
          className="px-5 py-3 rounded-xl text-xs font-extrabold bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition transform active:scale-95 cursor-pointer shrink-0"
        >
          <Camera className="w-4 h-4 text-amber-300" />
          <span>Add Certificate</span>
        </button>
      </div>

      {/* #2 FEATURE: Plain-English "Degree Clearance Meter" */}
      <DegreeClearanceMeter
        stats={stats}
        onOpenSubmitModal={onOpenSubmitModal}
        onNavigateTab={onNavigateTab}
      />

      {/* 3 Overview Metric Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Approved Credits */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Approved Degree Credits
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-emerald-600 font-mono">
              {approvedPoints}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ 200 pts</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Verified by faculty ({approvedSubmissions} approved activities)
          </p>
        </div>

        {/* 2. Pending Credits */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Under Faculty Review
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-amber-600 font-mono">
              {pendingPoints}
            </span>
            <span className="text-xs font-semibold text-slate-400">potential pts</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Awaiting mentor sign-off
          </p>
        </div>

        {/* 3. Total Submissions */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Proofs Uploaded
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
            Cryptographically audited
          </p>
        </div>
      </div>

      {/* Quick Action Cards: Update Marks & Upcoming Events */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          onClick={() => onNavigateTab('student-marks')}
          className="bg-gradient-to-r from-emerald-50 to-teal-50/50 hover:from-emerald-100 hover:to-teal-100/60 border border-emerald-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition group shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-950 group-hover:text-emerald-800 flex items-center gap-1.5">
                <span>Update Subject Marks</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-200/70 text-emerald-900 font-extrabold">New</span>
              </div>
              <p className="text-[11px] text-emerald-700">Enter theory marks, task marks, and lab marks to track your SGPA</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition shrink-0" />
        </div>

        <div
          onClick={() => onNavigateTab('student-events')}
          className="bg-gradient-to-r from-blue-50 to-sky-50/50 hover:from-blue-100 hover:to-sky-100/60 border border-blue-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition group shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-blue-950 group-hover:text-blue-800 flex items-center gap-1.5">
                <span>Explore Upcoming Events</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              </div>
              <p className="text-[11px] text-blue-700">Earn fast +20 to +40 activity points by joining college hackathons & fests</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition shrink-0" />
        </div>
      </div>

      {/* #1 FEATURE: My Submitted Certificates with Delivery-Style Status Tracker */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Where is my Certificate? (Delivery-Style Status)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Live tracking for all submitted activity certificates — know the exact status of your credits.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('submissions')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>View Full Dossier History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recent_submissions.length === 0 ? (
          <div className="py-10 text-center space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Camera className="w-6 h-6" />
            </div>
            <div className="max-w-sm mx-auto">
              <p className="text-sm font-bold text-slate-800">No activity certificates submitted yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Drop your certificate file or snap a photo with your phone to instantly claim degree points!
              </p>
            </div>
            <button
              onClick={onOpenSubmitModal}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer"
            >
              Add Certificate
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recent_submissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-indigo-200 transition p-4 space-y-3"
              >
                {/* Header row of certificate item */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{getCategoryEmoji(sub.category_id)}</span>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {sub.activity_title}
                      </h4>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
                        {getCategoryPlainName(sub.category_id, sub.category_name)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Completed on: <strong className="text-slate-600">{sub.completion_date}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => {
                        setSelectedSubmission(sub);
                        setIsViewerOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Proof</span>
                    </button>
                  </div>
                </div>

                {/* The 3-Step Delivery Tracker for this certificate */}
                <DeliveryStatusTracker submission={sub} />
              </div>
            ))}
          </div>
        )}
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
