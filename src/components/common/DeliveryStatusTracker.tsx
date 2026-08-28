import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, UserCheck, ShieldCheck } from 'lucide-react';
import { Submission } from '../../types';

interface DeliveryStatusTrackerProps {
  submission: Submission;
  compact?: boolean;
}

export const DeliveryStatusTracker: React.FC<DeliveryStatusTrackerProps> = ({
  submission,
  compact = false,
}) => {
  const isApproved = submission.status === 'approved';
  const isRejected = submission.status === 'rejected';
  const isPending = submission.status === 'pending';

  const uploadDate = submission.submitted_at
    ? new Date(submission.submitted_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : 'Recently';

  const reviewDate = submission.reviewed_at
    ? new Date(submission.reviewed_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  const mentorName = submission.reviewer_name || submission.mentor_name || 'Faculty Mentor';
  const points = isApproved ? submission.points_awarded : (submission.base_points || 20);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-[11px]">
        {/* Step 1: Uploaded */}
        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Uploaded</span>
        </span>
        <span className="text-slate-300">→</span>

        {/* Step 2: In Review */}
        <span
          className={`inline-flex items-center gap-1 font-medium ${
            isPending ? 'text-amber-700 font-semibold' : 'text-emerald-700'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isPending ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
            }`}
          />
          <span>{isPending ? 'Reviewing' : 'Reviewed'}</span>
        </span>
        <span className="text-slate-300">→</span>

        {/* Step 3: Result */}
        {isApproved ? (
          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>+{points} pts Added 🎉</span>
          </span>
        ) : isRejected ? (
          <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Action Required</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span>+{points} pts Expected</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <span className="text-indigo-600 font-semibold">📍 Certificate Progress Tracker</span>
          <span className="text-slate-400 font-normal">| Live Status</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          ID: {submission.id.slice(0, 14)}
        </span>
      </div>

      {/* 3-Step Delivery Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 relative">
        {/* Step 1: Uploaded */}
        <div className="bg-white rounded-lg p-2.5 border border-emerald-200 shadow-2xs flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
              <span>Step 1: Uploaded</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">{uploadDate}</p>
            <p className="text-[10px] text-slate-400">Securely in review queue</p>
          </div>
        </div>

        {/* Step 2: Under Review */}
        <div
          className={`rounded-lg p-2.5 border shadow-2xs flex items-start gap-2.5 ${
            isPending
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20'
              : 'bg-white border-emerald-200'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              isPending
                ? 'bg-amber-100 text-amber-700 animate-pulse'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {isPending ? <Clock className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </div>
          <div>
            <div
              className={`text-[11px] font-bold flex items-center gap-1 ${
                isPending ? 'text-amber-900' : 'text-emerald-900'
              }`}
            >
              <span>Step 2: {isPending ? 'Under Review' : 'Reviewed'}</span>
              {isPending && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-200 text-amber-900 font-medium">
                  In Progress
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-700 font-medium">By {mentorName}</p>
            <p className="text-[10px] text-slate-400">
              {reviewDate ? `Completed on ${reviewDate}` : 'Assigned faculty reviewer'}
            </p>
          </div>
        </div>

        {/* Step 3: Degree Credits Outcome */}
        <div
          className={`rounded-lg p-2.5 border shadow-2xs flex items-start gap-2.5 ${
            isApproved
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
              : isRejected
              ? 'bg-rose-50 border-rose-300'
              : 'bg-slate-100/70 border-slate-200 opacity-75'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              isApproved
                ? 'bg-emerald-600 text-white'
                : isRejected
                ? 'bg-rose-600 text-white'
                : 'bg-slate-200 text-slate-400'
            }`}
          >
            {isApproved ? (
              <ShieldCheck className="w-4 h-4" />
            ) : isRejected ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <span className="text-xs font-bold font-mono">3</span>
            )}
          </div>
          <div>
            <div
              className={`text-[11px] font-bold ${
                isApproved
                  ? 'text-emerald-900'
                  : isRejected
                  ? 'text-rose-900'
                  : 'text-slate-600'
              }`}
            >
              {isApproved
                ? 'Step 3: Approved! 🎉'
                : isRejected
                ? 'Step 3: Action Required'
                : 'Step 3: Degree Credits'}
            </div>
            <p
              className={`text-[11px] font-bold font-mono ${
                isApproved
                  ? 'text-emerald-700'
                  : isRejected
                  ? 'text-rose-700'
                  : 'text-slate-500'
              }`}
            >
              {isApproved
                ? `+${points} Credits Added to Degree`
                : isRejected
                ? 'Certificate needs correction'
                : `+${points} Points upon approval`}
            </p>
            {submission.mentor_feedback && (
              <p className="text-[10px] text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded mt-0.5 border border-amber-200">
                "{submission.mentor_feedback}"
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
