import React from 'react';
import { Target, Sparkles, Award, ArrowRight, Zap, CheckCircle2, ChevronRight, Calendar } from 'lucide-react';
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

  // Real upcoming events from server or curated fast-track items
  const upcomingEvents = stats.upcoming_events || [];

  return (
    <div className="bg-gradient-to-br from-[#0B1736] via-[#0F1E4A] to-[#0A1128] rounded-2xl p-5 text-white border border-blue-900/60 shadow-xl relative overflow-hidden">
      {/* Decorative subtle background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Big Friendly Degree Clearance Stats */}
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-sky-200 border border-blue-400/30">
            <Target className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-emerald-300 font-bold text-sm">{percentage}% Completed</span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-2">
              <span>You have</span>
              <span className="text-emerald-400 font-mono text-3xl sm:text-4xl">
                {totalEarned}
              </span>
              <span className="text-slate-300 text-lg font-normal">out of {targetPoints} Points</span>
            </h2>

            {isCleared ? (
              <p className="text-sm font-semibold text-emerald-300 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Degree Cleared! You have achieved the full 200 Activity Points required for graduation. 🎉</span>
              </p>
            ) : (
              <p className="text-sm font-semibold text-slate-200 mt-1 flex items-center gap-1.5">
                <span className="text-amber-400">🎯</span>
                <span>
                  You only need <strong className="text-amber-300 font-mono text-base">{remainingPoints} more points</strong> to complete your degree graduation clearance!
                </span>
              </p>
            )}
          </div>

          {/* Smooth High-Contrast Progress Bar */}
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

        {/* Right Column: "Fastest way to get points & Upcoming Events" */}
        {!isCleared && (
          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-4 border border-blue-500/20 space-y-2.5 lg:w-96 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Fastest Ways to Earn Points:</span>
              </div>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('student-events')}
                  className="text-[10px] text-sky-300 hover:text-sky-200 font-semibold underline underline-offset-2 flex items-center gap-0.5 cursor-pointer"
                >
                  <Calendar className="w-3 h-3" />
                  <span>View All Events</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {/* Show top live upcoming departmental events & fast-track opportunities */}
              {upcomingEvents.length > 0 ? (
                upcomingEvents.slice(0, 3).map((evt) => (
                  <button
                    key={evt.id}
                    onClick={() => {
                      if (onNavigateTab) onNavigateTab('student-events');
                      else onOpenSubmitModal();
                    }}
                    className="w-full text-left p-2 rounded-lg bg-slate-950/70 hover:bg-blue-950/80 border border-slate-800 hover:border-blue-500/40 transition flex items-center justify-between gap-2 group cursor-pointer"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-sky-200 font-medium border border-blue-500/30 shrink-0">
                          {evt.category_name ? evt.category_name.slice(0, 14) : '📅 Live Event'}
                        </span>
                        <span className="text-xs font-semibold text-white group-hover:text-sky-200 transition truncate">
                          {evt.title}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>{new Date(evt.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        <span>•</span>
                        <span className="truncate">{evt.venue}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                        +{evt.potential_points} pts
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition" />
                    </div>
                  </button>
                ))
              ) : (
                <>
                  <button
                    onClick={onOpenSubmitModal}
                    className="w-full text-left p-2 rounded-lg bg-slate-950/70 hover:bg-blue-950/80 border border-slate-800 hover:border-blue-500/40 transition flex items-center justify-between gap-2 group cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-sky-200 font-medium border border-blue-500/30">
                          🎓 Fast Track
                        </span>
                        <span className="text-xs font-semibold text-white group-hover:text-sky-200 transition">
                          Complete an NPTEL / Online Course
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                        +30 pts
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition" />
                    </div>
                  </button>
                  <button
                    onClick={() => onNavigateTab && onNavigateTab('student-events')}
                    className="w-full text-left p-2 rounded-lg bg-slate-950/70 hover:bg-blue-950/80 border border-slate-800 hover:border-blue-500/40 transition flex items-center justify-between gap-2 group cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-sky-200 font-medium border border-blue-500/30">
                          🏆 Hackathon
                        </span>
                        <span className="text-xs font-semibold text-white group-hover:text-sky-200 transition">
                          Join HackSprint 2025 (GenAI)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                        +30 pts
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition" />
                    </div>
                  </button>
                </>
              )}
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-300">
              <span>Have a certificate ready?</span>
              <button
                onClick={onOpenSubmitModal}
                className="text-xs font-bold text-amber-300 hover:text-amber-200 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
              >
                <span>Add Certificate</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
