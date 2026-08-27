import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, GitPullRequest, AlertCircle, Sparkles, CheckCircle } from 'lucide-react';
import { SchemaCategory, SchemaRequest } from '../../types';
import { apiRequest } from '../../lib/api';

interface SchemaRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newRequest: SchemaRequest) => void;
}

export const SchemaRequestModal: React.FC<SchemaRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [categories, setCategories] = useState<SchemaCategory[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [activityName, setActivityName] = useState('');
  const [requestedPoints, setRequestedPoints] = useState<number>(20);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const loadCategories = async () => {
      try {
        const data = await apiRequest<SchemaCategory[]>('/api/schema/categories');
        setCategories(data);
        if (data.length > 0) setCategoryId(data[0].id);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!activityName.trim() || !reason.trim() || !categoryId) {
      setErrorMessage('Please fill in all mandatory fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await apiRequest<SchemaRequest>('/api/schema/requests', {
        method: 'POST',
        body: JSON.stringify({
          activity_name: activityName.trim(),
          category_id: categoryId,
          requested_points: Number(requestedPoints),
          reason: reason.trim(),
        }),
      });

      onSuccess(created);
      onClose();
      setActivityName('');
      setReason('');
      setRequestedPoints(20);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit schema request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-400">
                <GitPullRequest className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm sm:text-base">
                  Request Schema Rule / Weightage
                </h3>
                <p className="text-[11px] text-slate-400">
                  Propose new activity type or point weightage adjustment to HOD
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            {errorMessage && (
              <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Category Domain <span className="text-rose-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-purple-500 bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Max Cap: {c.max_cap_points} pts)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Proposed Activity Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                placeholder="e.g. Certified Kubernetes Administrator (CKA)"
                required
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-purple-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Proposed Point Weightage (pts) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="5"
                max="60"
                step="5"
                value={requestedPoints}
                onChange={(e) => setRequestedPoints(Number(e.target.value))}
                required
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-purple-500 outline-hidden font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Academic Justification / Rationale <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                required
                placeholder="Explain the industry relevance or skill value to justify this rule..."
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-purple-500 outline-hidden"
              />
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-3.5 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded shadow-2xs flex items-center gap-1 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Submit Proposal</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
