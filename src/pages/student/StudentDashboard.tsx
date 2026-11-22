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
  PlusCircle,
  FileCheck2,
  Clock,
  CheckCircle2,
  User as UserIcon,
  Printer,
  AlertTriangle,
  Award,
  Layers,
  Eye,
  FileText,
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

  const { student, recent_submissions } = stats;
  const approvedPoints = stats.total_points || 0;
  const targetPoints = stats.target_points || 200;
  const percentage = Math.min(100, Math.round((approvedPoints / targetPoints) * 100));
  const remainingPoints = Math.max(0, targetPoints - approvedPoints);
  const isCleared = remainingPoints === 0;

  const pendingSubmissions = recent_submissions.filter((s) => s.status === 'pending');
  const pendingPoints = pendingSubmissions.reduce((sum, s) => sum + (s.base_points || 20), 0);

  const currentSem = student.semester || 6;
  const currentSemData = stats.semester_breakdown?.find((s) => s.semester === currentSem);
  const currentSemApproved = currentSemData?.approved_points || 0;
  const currentSemPending = currentSemData?.pending_points || 0;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. Calm, Focused Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#8eb86e]/15 text-[#426b27] border border-[#8eb86e]/30">
              Activity Credit Portal
            </span>
            <span className="text-xs text-slate-500 font-medium">Department of Computer Science & Engineering</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Welcome back, {student.name}!
          </h1>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
            {student.roll_no && (
              <span className="bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 font-mono text-xs font-semibold text-slate-700">
                USN: {student.roll_no}
              </span>
            )}
            <span className="bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 text-xs font-semibold text-slate-700">
              Semester {currentSem}
            </span>
            <span className="bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 text-[#426b27] text-xs font-semibold">
              Faculty Mentor: {student.mentor_name ? `Prof. ${student.mentor_name}` : 'Assigned Mentor'}
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenSubmitModal}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#7eb462] hover:bg-[#6fa454] text-white shadow-xs flex items-center gap-2 transition cursor-pointer"
            title="Upload new activity certificate proof"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>Upload Certificate</span>
          </button>

          <button
            onClick={handleOpenCreditReport}
            disabled={isGeneratingReport}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            title="Download verified student credit transcript as PDF"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>{isGeneratingReport ? 'Generating...' : 'Credit Report (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* 2. Unified Degree Clearance Card */}
      <div className="bg-gradient-to-br from-[#0B1736] via-[#0F1E4A] to-[#0A1128] rounded-2xl p-5 sm:p-6 text-white border border-blue-900/60 shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Degree Clearance Requirement</span>
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                {approvedPoints}
              </span>
              <span className="text-slate-300 text-base font-normal">/ {targetPoints} Points</span>
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {percentage}% Completed
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {isCleared ? (
                <span className="text-emerald-300 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Degree points fully satisfied for graduation clearance.
                </span>
              ) : (
                <span>
                  {remainingPoints} more points required to clear 200 points degree graduation criteria.
                </span>
              )}
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 text-xs">
            <div className="text-center px-2">
              <div className="text-[10px] text-slate-300 font-medium">Approved</div>
              <div className="text-lg font-bold font-mono text-emerald-400">{approvedPoints} pts</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center px-2">
              <div className="text-[10px] text-slate-300 font-medium">In Review</div>
              <div className="text-lg font-bold font-mono text-amber-300">
                {pendingPoints > 0 ? `+${pendingPoints}` : '0'} pts
              </div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center px-2">
              <div className="text-[10px] text-slate-300 font-medium">Sem {currentSem}</div>
              <div className="text-lg font-bold font-mono text-sky-300">{currentSemApproved}/30 pts</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-4">
          <div className="w-full h-3 bg-slate-900/90 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${Math.max(4, percentage)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>0 Points</span>
            <span>100 pts</span>
            <span>150 pts</span>
            <span className="text-emerald-300 font-bold">200 pts (Graduation Goal)</span>
          </div>
        </div>
      </div>

      {/* 3. Recent Activity Certificates Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <span>Recent Activity Submissions</span>
            </h2>
            <p className="text-xs text-slate-500">
              Track your certificate verification status and points awarded by your mentor.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('student-submissions')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            View All Submissions →
          </button>
        </div>

        {recent_submissions.length === 0 ? (
          <div className="py-10 text-center space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No certificates submitted yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload your event certificates, workshop proofs, or NSS participation records to earn degree credit.
            </p>
            <button
              onClick={onOpenSubmitModal}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#7eb462] hover:bg-[#6fa454] text-white transition cursor-pointer"
            >
              Upload Certificate
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Activity Title</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Points</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent_submissions.slice(0, 5).map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 text-xs">{sub.activity_title}</div>
                      {sub.mentor_feedback && (
                        <div className="text-[11px] text-slate-500 italic">
                          Mentor note: "{sub.mentor_feedback}"
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {getCategoryPlainName(sub.category_id, sub.category_name)}
                    </td>

                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {sub.completion_date}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold">
                      {sub.status === 'approved' ? (
                        <span className="text-emerald-700">+{sub.points_awarded || sub.base_points || 20} pts</span>
                      ) : (
                        <span className="text-slate-400">+{sub.base_points || 20} pts</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {sub.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[11px] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Approved</span>
                        </span>
                      ) : sub.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-bold text-[11px] border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Action Required</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold text-[11px] border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>In Review</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setIsViewerOpen(true);
                        }}
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600 font-semibold cursor-pointer"
                        title="View certificate proof"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* Official Student Credit Report Modal (PDF Export) */}
      <StudentCreditReportModal
        isOpen={isCreditReportOpen}
        onClose={() => setIsCreditReportOpen(false)}
        reportData={creditReportData}
      />

      {/* Interactive AI Academic Advisor Modal */}
      <AIAdvisorModal
        isOpen={isAIAdvisorOpen}
        onClose={() => setIsAIAdvisorOpen(false)}
        studentId={student.id}
        studentName={student.name}
      />
    </div>
  );
};
