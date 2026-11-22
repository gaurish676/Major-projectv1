import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentDashboardStats } from '../../types';
import {
  X,
  Award,
  CheckCircle2,
  Clock,
  PlusCircle,
  Printer,
  ChevronRight,
  ShieldCheck,
  User,
  ExternalLink,
} from 'lucide-react';

interface RightBlockDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stats: StudentDashboardStats | null;
  onOpenSubmitModal: () => void;
  onOpenCreditReport: () => void;
  onNavigateTab: (tab: string) => void;
}

export const RightBlockDrawer: React.FC<RightBlockDrawerProps> = ({
  isOpen,
  onClose,
  stats,
  onOpenSubmitModal,
  onOpenCreditReport,
  onNavigateTab,
}) => {
  const { user } = useAuth();

  if (!isOpen) return null;

  const approvedPoints = stats?.total_points || 30;
  const targetPoints = stats?.target_points || 200;
  const percentage = Math.min(100, Math.round((approvedPoints / targetPoints) * 100));
  const remainingPoints = Math.max(0, targetPoints - approvedPoints);
  const isCleared = remainingPoints === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-2xs transition-opacity lg:hidden"
        onClick={onClose}
      />

      {/* Slide-over Drawer on Right Side (matching Moodle Block Drawer) */}
      <aside className="fixed top-14 sm:top-16 right-0 bottom-0 z-50 w-80 sm:w-88 bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#8eb86e]/20 text-[#5c873f] flex items-center justify-center font-bold text-xs">
              <Award className="w-4 h-4 text-[#5c873f]" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Block Drawer
              </h3>
              <p className="text-[11px] text-slate-500">Activity Points & Mentorship</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content Blocks */}
        <div className="p-4 space-y-5 flex-1 text-slate-800 text-xs">
          {/* Block 1: Degree Clearance Requirement */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#8eb86e]" />
                Degree Clearance
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8eb86e]/20 text-[#426b27]">
                {percentage}% Done
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  {approvedPoints}
                </span>
                <span className="text-slate-500 font-normal">/ {targetPoints} Points</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {isCleared ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Degree points satisfied!
                  </span>
                ) : (
                  <span>{remainingPoints} more points needed for graduation clearance.</span>
                )}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#8eb86e] h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase">Approved</span>
                <span className="font-bold text-slate-800 font-mono">{approvedPoints} pts</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase">Under Review</span>
                <span className="font-bold text-amber-600 font-mono">
                  {stats?.pending_points || 0} pts
                </span>
              </div>
            </div>
          </div>

          {/* Block 2: Assigned Faculty Mentor */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2">
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">
              Faculty Mentor
            </span>
            <div className="flex items-center gap-2.5 pt-1">
              <div className="w-9 h-9 rounded-full bg-[#8eb86e]/15 text-[#5c873f] flex items-center justify-center font-bold text-xs shrink-0">
                <User className="w-4 h-4 text-[#5c873f]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-xs truncate">
                  {stats?.student?.mentor_name
                    ? `Prof. ${stats.student.mentor_name}`
                    : 'Prof. Joylin Mendonca'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  Dept. of Computer Science & Eng.
                </p>
              </div>
            </div>
          </div>

          {/* Block 3: Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                onOpenSubmitModal();
                onClose();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-[#7eb462] hover:bg-[#6fa454] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Upload Certificate Proof</span>
            </button>

            <button
              onClick={() => {
                onOpenCreditReport();
                onClose();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Download Credit Transcript (PDF)</span>
            </button>

            <button
              onClick={() => {
                onNavigateTab('submission-history');
                onClose();
              }}
              className="w-full py-2 px-3 text-center text-xs text-[#5c873f] font-semibold hover:underline block pt-1 cursor-pointer"
            >
              View Full Submissions Ledger ➔
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 text-center text-[10px] text-slate-400">
          AICTE 100/200 Activity Point Mandate &bull; NMAMIT
        </div>
      </aside>
    </>
  );
};
