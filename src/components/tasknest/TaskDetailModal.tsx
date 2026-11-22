import React, { useState } from 'react';
import { ArrowLeft, Trash2, Calendar, Bell, CheckCircle2, Clock, Edit3, AlertTriangle } from 'lucide-react';
import { M3_TOKENS, TaskItem } from '../../theme/tokens';
import { formatRelativeDueDate } from './TaskItemCard';

interface TaskDetailModalProps {
  task: TaskItem;
  onClose: () => void;
  onEdit: (task: TaskItem) => void;
  onToggleComplete: (id: string) => Promise<void>;
  onDelete: (task: TaskItem) => Promise<void>;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  onEdit,
  onToggleComplete,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isCompleted = Boolean(task.is_completed);
  const priorityMeta = M3_TOKENS.colors.priority[task.priority] || M3_TOKENS.colors.priority.MEDIUM;

  const handleToggle = async () => {
    setIsProcessing(true);
    try {
      await onToggleComplete(task.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsProcessing(true);
    try {
      await onDelete(task);
      setShowDeleteConfirm(false);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const formattedCreated = (() => {
    try {
      const d = new Date(task.created_at);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return task.created_at;
    }
  })();

  const reminderLabel = (() => {
    if (!task.reminder_on) return 'Off';
    if (task.reminder_offset === 0) return 'At time of event';
    if (task.reminder_offset === 60) return '1 hour before';
    if (task.reminder_offset === 1440) return '1 day before';
    return `${task.reminder_offset} minutes before`;
  })();

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
        <div
          className="w-full max-w-lg rounded-[20px] bg-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200"
          style={{ backgroundColor: M3_TOKENS.colors.colorSurface }}
        >
          {/* Top Bar with Back + Delete Icon */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="p-2 -ml-2 rounded-full hover:bg-slate-200/60 transition-colors text-slate-700 cursor-pointer active:scale-90"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-[18px] font-bold text-slate-800">Task Details</h2>
            </div>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer active:scale-90"
              aria-label="Delete Task"
              title="Delete Task"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* Screen Content Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Hero Task Title (22sp Bold) */}
            <div>
              <h1
                className={`text-[22px] font-bold leading-snug break-words ${
                  isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
                }`}
              >
                {task.title}
              </h1>
            </div>

            {/* Badge Bar: Category + Priority Pill Badges */}
            <div className="flex items-center gap-2.5">
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: M3_TOKENS.colors.category.bg,
                  color: M3_TOKENS.colors.category.text,
                }}
              >
                {task.category}
              </span>

              <span
                className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: priorityMeta.bg,
                  color: priorityMeta.text,
                }}
              >
                {priorityMeta.label} PRIORITY
              </span>
            </div>

            {/* Metadata Elevated Card */}
            <div
              className="rounded-[16px] p-4 space-y-3"
              style={{
                backgroundColor: M3_TOKENS.colors.colorSurfaceContainer,
                border: `1px solid ${M3_TOKENS.colors.stroke}`,
              }}
            >
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                <Calendar className="w-4 h-4 text-purple-700 shrink-0" />
                <span>
                  Due: <strong className="text-slate-900">{formatRelativeDueDate(task.due_at)}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                <Bell className="w-4 h-4 text-purple-700 shrink-0" />
                <span>
                  Reminder: <strong className="text-slate-900">{reminderLabel}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>
                  Status:{' '}
                  <strong className={isCompleted ? 'text-emerald-700' : 'text-amber-700'}>
                    {isCompleted ? 'Completed' : 'Pending'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Description Section */}
            <div className="pt-2">
              <h4 className="text-[12px] font-bold uppercase tracking-[0.5px] text-slate-500 mb-2">
                Description
              </h4>
              <div className="p-4 rounded-[12px] bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap min-h-[70px]">
                {task.description || (
                  <span className="text-slate-400 italic">No additional notes provided.</span>
                )}
              </div>
            </div>

            {/* Created Timestamp Footer */}
            <div className="pt-2 text-xs text-slate-400 font-medium">
              Created: {formattedCreated}
            </div>
          </div>

          {/* Action Buttons: Mark Completed & Edit Task */}
          <div className="p-4 sm:p-5 border-t border-slate-200/80 shrink-0 bg-white space-y-2.5">
            {/* Primary Action Button (48dp height, 12dp rounded) */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleToggle}
              className="w-full h-[48px] rounded-[12px] text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.99] cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: isCompleted ? '#4A4458' : M3_TOKENS.colors.colorPrimary,
              }}
            >
              {isCompleted ? (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Mark as Pending</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark as Completed</span>
                </>
              )}
            </button>

            {/* Secondary Outlined Action Button */}
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="w-full h-[48px] rounded-[12px] font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 active:scale-[0.99] cursor-pointer text-slate-800"
            >
              <Edit3 className="w-4 h-4 text-purple-700" />
              <span>Edit Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Delete */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-[16px] bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete this task?</h3>
                <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-[10px] text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-[10px] text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer shadow-xs"
              >
                {isProcessing ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
