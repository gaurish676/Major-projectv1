import React from 'react';

export const ShimmerBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-slate-200/80 rounded-lg animate-pulse ${className}`} />
);

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-fade-in" aria-label="Loading dashboard view...">
      {/* Top Banner Skeleton */}
      <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="w-32 h-5 bg-slate-800 rounded-md animate-pulse" />
            <div className="w-56 h-7 bg-slate-800 rounded-lg animate-pulse" />
            <div className="w-72 h-4 bg-slate-800 rounded-md animate-pulse" />
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-28 h-9 bg-slate-800 rounded-xl animate-pulse" />
            <div className="w-32 h-9 bg-slate-800 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 flex gap-2">
        <div className="flex-1 h-9 bg-slate-100 rounded-lg animate-pulse" />
        <div className="flex-1 h-9 bg-slate-100 rounded-lg animate-pulse" />
        <div className="flex-1 h-9 bg-slate-100 rounded-lg animate-pulse" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-20 h-4 bg-slate-100 rounded animate-pulse" />
              <div className="w-7 h-7 bg-slate-100 rounded-lg animate-pulse" />
            </div>
            <div className="w-24 h-8 bg-slate-200 rounded-lg animate-pulse" />
            <div className="w-36 h-3 bg-slate-100 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-48 h-5 bg-slate-200 rounded-md animate-pulse" />
          <div className="w-24 h-4 bg-slate-100 rounded-md animate-pulse" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="p-3.5 rounded-xl border border-slate-100 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 animate-pulse shrink-0" />
                <div className="space-y-1.5">
                  <div className="w-48 sm:w-64 h-4 bg-slate-200 rounded animate-pulse" />
                  <div className="w-32 h-3 bg-slate-100 rounded animate-pulse" />
                </div>
              </div>
              <div className="w-16 h-6 bg-slate-100 rounded-lg animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden space-y-3 p-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="w-40 h-5 bg-slate-200 rounded animate-pulse" />
        <div className="w-28 h-8 bg-slate-100 rounded-lg animate-pulse" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-11 bg-slate-50 border border-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
};
