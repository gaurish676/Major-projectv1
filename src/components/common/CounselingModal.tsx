import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { apiRequest } from '../../lib/api';
import {
  AlertTriangle,
  X,
  Send,
  BookOpen,
  User,
  CheckCircle2,
  Calendar,
  FileText,
  Sparkles,
} from 'lucide-react';

interface CounselingModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    name: string;
    roll_no?: string;
  } | null;
  subjectCode?: string;
  subjectName?: string;
  mseMarks?: number;
  mseMax?: number;
  onSuccess?: () => void;
}

export const CounselingModal: React.FC<CounselingModalProps> = ({
  isOpen,
  onClose,
  student,
  subjectCode = '22CS501',
  subjectName = 'Design and Analysis of Algorithms',
  mseMarks = 9,
  mseMax = 30,
  onSuccess,
}) => {
  const [reason, setReason] = useState('Poor Mid-Semester Exam (MSE) Performance (<40%)');
  const [counselingNotes, setCounselingNotes] = useState(
    'Student demonstrated difficulty with core theoretical concepts and algorithmic proofs. Needs structured remedial revision.'
  );
  const [actionPlan, setActionPlan] = useState(
    '1. Attend mandatory faculty remedial tutorial every Saturday at 3:00 PM.\n2. Submit two revised analytical assignments.\n3. Re-assessment test scheduled before final CIE tabulation.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const scorePercentage = mseMax > 0 ? Math.round(((mseMarks || 0) / mseMax) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    if (!counselingNotes.trim() || !actionPlan.trim()) {
      setStatusMessage({ text: 'Please fill in both counseling notes and remedial action plan.', type: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMessage(null);

      await apiRequest('/api/counseling', {
        method: 'POST',
        body: JSON.stringify({
          student_id: student.id,
          subject_code: subjectCode,
          subject_name: subjectName,
          mse_marks: mseMarks,
          mse_max: mseMax,
          reason,
          counseling_notes: counselingNotes,
          action_plan: actionPlan,
        }),
      });

      setStatusMessage({
        text: `Remedial Counseling recorded successfully! Notification dispatched to ${student.name}.`,
        type: 'success',
      });

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to record counseling note', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[90vh]"
          >
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white flex items-center justify-between border-b border-amber-800/40 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  <span>Remedial Academic Counseling</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                    MSE Alert: {mseMarks}/{mseMax} ({scorePercentage}%)
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Formulate corrective action plan & trigger student notification
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
            {/* Student Info Card */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between text-amber-950">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900">
                    {student.name}
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono">
                    USN: {student.roll_no || 'N/A'} • Subject: {subjectCode} ({subjectName})
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-base font-extrabold font-mono text-rose-700 bg-rose-100 px-2.5 py-1 rounded-md border border-rose-200">
                  {mseMarks} / {mseMax}
                </span>
                <span className="block text-[10px] text-rose-700 font-semibold mt-0.5">
                  Critical Deficit
                </span>
              </div>
            </div>

            {statusMessage && (
              <div
                className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Counseling Reason */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Reason for Academic Intervention</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500 bg-slate-50 focus:bg-white text-xs text-slate-900"
                required
              />
            </div>

            {/* Mentor Observations */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Faculty Mentor Observations & Root Cause</label>
              <textarea
                rows={3}
                value={counselingNotes}
                onChange={(e) => setCounselingNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500 bg-slate-50 focus:bg-white text-xs text-slate-900"
                placeholder="Identify areas where the student is struggling..."
                required
              />
            </div>

            {/* Action Plan */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700">
                Action Plan & Remedial Steps Assigned to Mentee
              </label>
              <textarea
                rows={3}
                value={actionPlan}
                onChange={(e) => setActionPlan(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500 bg-slate-50 focus:bg-white text-xs text-slate-900 font-mono text-[11px]"
                placeholder="List clear remedial actions (tutorials, assignments, re-test)..."
                required
              />
              <p className="text-[11px] text-slate-500">
                ⚡ Mentee will receive an immediate in-portal notification with these remedial steps.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Recording...' : 'Send Counseling Plan'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
};
