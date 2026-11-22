import React from 'react';
import { CheckCircle2, Clock, Zap } from 'lucide-react';
import { M3_TOKENS, TaskMetrics } from '../../theme/tokens';

interface ProgressBannerProps {
  metrics: TaskMetrics;
}

export const ProgressBanner: React.FC<ProgressBannerProps> = ({ metrics }) => {
  return (
    <div
      className="w-full rounded-[16px] p-4 sm:p-5 transition-all shadow-xs"
      style={{
        backgroundColor: M3_TOKENS.colors.colorSurfaceContainer,
        border: `1px solid ${M3_TOKENS.colors.stroke}`,
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: M3_TOKENS.colors.colorPrimary, color: '#fff' }}
          >
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <span className="text-[12px] font-bold uppercase tracking-[0.5px] text-slate-700">
            Task Velocity
          </span>
        </div>

        {/* Completion Rate Badge */}
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full shadow-2xs"
          style={{
            backgroundColor: metrics.completion_rate === 100 ? '#C8E6C9' : '#E7E0EC',
            color: metrics.completion_rate === 100 ? '#00390F' : '#49454F',
          }}
        >
          {metrics.completion_rate}% Completed
        </span>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden mb-3.5">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${metrics.completion_rate}%`,
            backgroundColor: M3_TOKENS.colors.colorPrimary,
          }}
        />
      </div>

      {/* Metric Counters */}
      <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-slate-700 pt-1">
        {/* Pending Counter with alert indicator */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            {metrics.pending > 0 && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                metrics.pending > 0 ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            />
          </span>
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>
            Pending: <strong className="text-slate-900">{metrics.pending}</strong>
          </span>
        </div>

        {/* Done Counter */}
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            Done: <strong className="text-slate-900">{metrics.completed}</strong>
          </span>
        </div>

        {/* Total Ratio */}
        <div className="text-[11px] font-semibold text-slate-500 hidden sm:inline-block">
          {metrics.completed} of {metrics.total} Tasks
        </div>
      </div>
    </div>
  );
};
