import React from 'react';
import { Target, CheckCircle2, Award, PlusCircle } from 'lucide-react';
import { StudentDashboardStats } from '../../types';

interface DegreeClearanceMeterProps {
  stats: StudentDashboardStats;
  onOpenSubmitModal: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const DegreeClearanceMeter: React.FC<DegreeClearanceMeterProps> = ({
  stats,
  onOpenSubmitModal,
  onNavigateTab,
}) => {
  const totalEarned = stats.total_points || 0;
  const targetPoints = stats.target_points || 200;
  const remainingPoints = Math.max(0, targetPoints - totalEarned);
  const percentage = Math.min(100, Math.round((totalEarned / targetPoints) * 100));
  const isCleared = remainingPoints === 0;

  return (
    <div className="bg-gradient-to-br from-[#0B1736] via-[#0F1E4A] to-[#0A1128] rounded-2xl p-5 sm:p-6 text-white border border-blue-900/60 shadow-xl relative overflow-hidden">
      {/* Decorative subtle background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-sky-200 border border-blue-400/30">
            <Target className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-emerald-300 font-bold">{percentage}% Completed</span>
          </div>

          <div className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span>AICTE Mandatory Degree Requirement</span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-2 flex-wrap">
              <span>You have</span>
              <span className="text-emerald-400 font-mono text-3xl sm:text-4xl">
                {totalEarned}
              </span>
              <span className="text-slate-300 text-lg font-normal">out of {targetPoints} Points</span>
            </h2>

            {isCleared ? (
              <p className="text-sm font-semibold text-emerald-300 mt-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Degree Cleared! You have achieved the full 200 Activity Points required for graduation.</span>
              </p>
            ) : (
              <p className="text-sm font-semibold text-slate-200 mt-1.5 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  You need <strong className="text-amber-300 font-mono text-base">{remainingPoints} more points</strong> to complete your degree graduation clearance.
                </span>
              </p>
            )}
          </div>

          <div className="pt-2 sm:pt-0">
            <button
              onClick={onOpenSubmitModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Claim More Points</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="w-full h-3.5 bg-slate-900/90 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400 transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${Math.max(4, percentage)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
            <span>0 Points</span>
            <span>100 pts (Silver)</span>
            <span>150 pts (Gold)</span>
            <span className="text-emerald-300 font-bold">200 pts (Graduation Target)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
