import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Calendar, Clock, Bell, AlertCircle } from 'lucide-react';
import { M3_TOKENS, TaskCategory, TaskItem, TaskPriority } from '../../theme/tokens';

interface AddEditTaskModalProps {
  initialTask?: TaskItem | null;
  onSave: (taskData: Partial<TaskItem>) => Promise<void>;
  onClose: () => void;
}

const REMINDER_OFFSETS = [
  { value: 0, label: 'At time of event' },
  { value: 10, label: '10 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];

export const AddEditTaskModal: React.FC<AddEditTaskModalProps> = ({
  initialTask,
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(initialTask);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');

  // Extract initial Date and Time
  const initialDateObj = initialTask ? new Date(initialTask.due_at) : new Date();
  const defaultDateStr = !isNaN(initialDateObj.getTime())
    ? initialDateObj.toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const defaultTimeStr = !isNaN(initialDateObj.getTime())
    ? initialDateObj.toTimeString().slice(0, 5)
    : '16:00';

  const [dateStr, setDateStr] = useState(defaultDateStr);
  const [timeStr, setTimeStr] = useState(defaultTimeStr);

  const [category, setCategory] = useState<TaskCategory>(initialTask?.category || 'Work');
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority || 'MEDIUM');
  const [reminderOn, setReminderOn] = useState<boolean>(Boolean(initialTask?.reminder_on));
  const [reminderOffset, setReminderOffset] = useState<number>(initialTask?.reminder_offset ?? 15);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autofocus title on mount
  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is mandatory');
      titleInputRef.current?.focus();
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Combine Date & Time into ISO string
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = timeStr.split(':').map(Number);
      const combinedDate = new Date(year, month - 1, day, hours, minutes, 0);

      await onSave({
        title: title.trim(),
        description: description.trim(),
        due_at: combinedDate.toISOString(),
        category,
        priority,
        reminder_on: reminderOn ? 1 : 0,
        reminder_offset: reminderOn ? reminderOffset : 0,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save task';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Human friendly date format for button display
  const formattedDisplayDate = (() => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  })();

  // Human friendly time format for button display
  const formattedDisplayTime = (() => {
    try {
      const [h, m] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(h, m, 0);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return timeStr;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div
        className="w-full max-w-lg rounded-[20px] bg-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200"
        style={{ backgroundColor: M3_TOKENS.colors.colorSurface }}
      >
        {/* Top App Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-slate-200/60 transition-colors text-slate-700 cursor-pointer active:scale-90"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-[20px] font-bold text-slate-900">
            {isEditing ? 'Edit Task' : 'New Task'}
          </h2>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TITLE Input */}
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-[0.5px] text-slate-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter task title..."
              className="w-full h-[48px] px-3.5 rounded-[12px] border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6750A4] focus:border-transparent text-sm font-medium transition-all"
            />
          </div>

          {/* DESCRIPTION Input */}
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-[0.5px] text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes or subtasks..."
              className="w-full p-3.5 rounded-[12px] border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6750A4] focus:border-transparent text-sm font-normal resize-y min-h-[80px] max-h-[160px] transition-all"
            />
          </div>

          {/* DATE & TIME (Side-by-side compound buttons) */}
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-[0.5px] text-slate-700 mb-1.5">
              Date & Time
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Date Input Button Container */}
              <div className="relative">
                <label className="flex items-center gap-2.5 h-[48px] px-3.5 rounded-[12px] border border-slate-300 bg-white text-slate-800 text-xs sm:text-sm font-medium cursor-pointer hover:border-slate-400 transition-colors">
                  <Calendar className="w-4 h-4 text-purple-700 shrink-0" />
                  <span className="truncate">{formattedDisplayDate}</span>
                  <input
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
              </div>

              {/* Time Input Button Container */}
              <div className="relative">
                <label className="flex items-center gap-2.5 h-[48px] px-3.5 rounded-[12px] border border-slate-300 bg-white text-slate-800 text-xs sm:text-sm font-medium cursor-pointer hover:border-slate-400 transition-colors">
                  <Clock className="w-4 h-4 text-purple-700 shrink-0" />
                  <span className="truncate">{formattedDisplayTime}</span>
                  <input
                    type="time"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* CATEGORY (Work / Personal / Study) */}
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-[0.5px] text-slate-700 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full h-[48px] px-3.5 rounded-[12px] border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6750A4] cursor-pointer"
            >
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Study">Study</option>
            </select>
          </div>

          {/* SEGMENTED PRIORITY (HIGH, MEDIUM, LOW) */}
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-[0.5px] text-slate-700 mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 rounded-[14px] bg-slate-100 border border-slate-200">
              {(['HIGH', 'MEDIUM', 'LOW'] as TaskPriority[]).map((p) => {
                const isActive = priority === p;
                const token = M3_TOKENS.colors.priority[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className="h-[40px] rounded-[10px] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center active:scale-95"
                    style={{
                      backgroundColor: isActive ? token.bg : 'transparent',
                      color: isActive ? token.text : '#49454F',
                      border: isActive ? `1.5px solid ${token.border}` : '1.5px solid transparent',
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* REMINDER CONTAINER (tied to switchReminder) */}
          <div className="pt-2 border-t border-slate-200/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-700" />
                <span className="text-sm font-medium text-slate-800">
                  Remind Me Before Due Date
                </span>
              </div>

              {/* M3 Style Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={reminderOn}
                onClick={() => setReminderOn(!reminderOn)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  reminderOn ? 'bg-[#6750A4]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    reminderOn ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Collapsible Reminder Offset Selector (Hidden when switch is OFF) */}
            {reminderOn && (
              <div className="mt-3 p-3.5 rounded-[12px] bg-[#F3EDF7] border border-[#CAC4D0]/60 space-y-1.5 animate-fade-in">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  Alert Offset
                </label>
                <select
                  value={reminderOffset}
                  onChange={(e) => setReminderOffset(Number(e.target.value))}
                  className="w-full h-[40px] px-3 rounded-[8px] bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6750A4] cursor-pointer"
                >
                  {REMINDER_OFFSETS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </form>

        {/* Pinned Bottom Primary Action Button */}
        <div className="p-4 sm:p-5 border-t border-slate-200/80 shrink-0 bg-white">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="w-full h-[48px] rounded-[12px] text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.99] cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: M3_TOKENS.colors.colorPrimary,
            }}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{isEditing ? 'Save Changes' : 'Save Task'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
