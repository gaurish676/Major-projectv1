import React from 'react';
import { motion } from 'motion/react';
import { Award, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';

interface ProgressBarProps {
  currentPoints: number;
  targetPoints?: number;
  showMilestones?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentPoints,
  targetPoints = 200,
  showMilestones = true,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((currentPoints / targetPoints) * 1000) / 10));
  const remaining = Math.max(0, targetPoints - currentPoints);

  const milestones = [
    { points: 50, label: 'Bronze', color: 'text-amber-700', icon: '🥉' },
    { points: 100, label: 'Silver', color: 'text-slate-600', icon: '🥈' },
    { points: 150, label: 'Gold', color: 'text-yellow-600', icon: '🥇' },
    { points: 200, label: 'Diamond', color: 'text-indigo-600', icon: '💎' },
  ];

  return (
    <div className={`w-full space-y-2 ${className}`}>
      {/* Top Header info */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold font-mono text-slate-900 text-base">
            {currentPoints} <span className="text-slate-400 font-normal text-xs">/ {targetPoints} pts</span>
          </span>
          {currentPoints >= targetPoints ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" /> Cleared
            </span>
          ) : (
            <span className="text-[11px] text-slate-500 font-medium">
              ({remaining} pts to clearance)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 font-bold font-mono text-indigo-600 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{percentage}%</span>
        </div>
      </div>

      {/* Main Bar Track */}
      <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <motion.div
          className={`h-full rounded-full transition-all duration-500 ${
            currentPoints >= targetPoints
              ? 'bg-emerald-600'
              : currentPoints >= 150
              ? 'bg-indigo-600'
              : currentPoints >= 100
              ? 'bg-indigo-500'
              : 'bg-indigo-600'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Milestones Checkpoints */}
      {showMilestones && (
        <div className="grid grid-cols-4 gap-1.5 pt-0.5 text-[11px]">
          {milestones.map((m) => {
            const isReached = currentPoints >= m.points;
            return (
              <div
                key={m.points}
                className={`flex items-center justify-between px-2 py-1 rounded border transition-all ${
                  isReached
                    ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1 truncate">
                  <span>{m.icon}</span>
                  <span className="truncate">{m.label}</span>
                </div>
                <span className="font-mono text-[10px] shrink-0 font-medium">{m.points}p</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
