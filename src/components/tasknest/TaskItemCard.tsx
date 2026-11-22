import React, { useState } from 'react';
import { Bell, Calendar, Trash2, Check } from 'lucide-react';
import { M3_TOKENS, TaskItem } from '../../theme/tokens';

interface TaskItemCardProps {
  task: TaskItem;
  onToggle: (id: string) => void;
  onClick: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
}

export function formatRelativeDueDate(dateStr: string): string {
  try {
    const due = new Date(dateStr);
    if (isNaN(due.getTime())) return dateStr;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffDays = Math.round((dueDateOnly.getTime() - today.getTime()) / (1000 * 3600 * 24));

    const timeStr = due.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (diffDays === 0) return `Today - ${timeStr}`;
    if (diffDays === 1) return `Tomorrow - ${timeStr}`;
    if (diffDays === -1) return `Yesterday - ${timeStr}`;

    const monthStr = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${monthStr} - ${timeStr}`;
  } catch {
    return dateStr;
  }
}

export const TaskItemCard: React.FC<TaskItemCardProps> = ({
  task,
  onToggle,
  onClick,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const isCompleted = Boolean(task.is_completed);

  const priorityMeta = M3_TOKENS.colors.priority[task.priority] || M3_TOKENS.colors.priority.MEDIUM;
  const formattedDue = formatRelativeDueDate(task.due_at);
  const hasReminder = Boolean(task.reminder_on);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(task);
    }, 200);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(task.id);
  };

  return (
    <div
      onClick={() => onClick(task)}
      className={`relative w-full rounded-[16px] p-4 transition-all duration-200 cursor-pointer select-none group border shadow-2xs hover:shadow-md ${
        isDeleting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundColor: isCompleted
          ? M3_TOKENS.colors.completed.bg
          : '#FFFFFF',
        borderColor: isCompleted ? '#D0D0D0' : M3_TOKENS.colors.stroke,
        opacity: isCompleted ? 0.65 : 1,
      }}
    >
      <div className="flex items-start gap-3.5">
        {/* Custom M3 Checkbox */}
        <button
          type="button"
          onClick={handleCheckboxClick}
          aria-label={isCompleted ? 'Mark pending' : 'Mark completed'}
          className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all border cursor-pointer active:scale-90"
          style={{
            borderColor: isCompleted ? '#757575' : M3_TOKENS.colors.colorPrimary,
            backgroundColor: isCompleted ? '#757575' : 'transparent',
          }}
        >
          {isCompleted && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
        </button>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3
            className={`text-[16px] font-medium leading-snug break-words transition-all ${
              isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
            }`}
          >
            {task.title}
          </h3>

          {/* Description snippet if any */}
          {task.description && (
            <p className="mt-1 text-xs text-slate-500 line-clamp-1">
              {task.description}
            </p>
          )}

          {/* Badge Row: Category + Priority */}
          <div className="mt-2.5 flex items-center flex-wrap gap-2">
            {/* Category Pill Tag */}
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
              style={{
                backgroundColor: M3_TOKENS.colors.category.bg,
                color: M3_TOKENS.colors.category.text,
              }}
            >
              {task.category}
            </span>

            {/* Priority Badge */}
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: priorityMeta.bg,
                color: priorityMeta.text,
              }}
            >
              {priorityMeta.label}
            </span>
          </div>

          {/* Timestamps & Reminder Footer */}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[12px]">{formattedDue}</span>
            </div>

            <div className="flex items-center gap-2">
              {hasReminder && (
                <div
                  className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: '#EDE7F6',
                    color: M3_TOKENS.colors.colorPrimary,
                  }}
                  title={`Reminder set for ${task.reminder_offset} min before`}
                >
                  <Bell className="w-3 h-3 fill-current" />
                  <span className="hidden sm:inline">Reminder</span>
                </div>
              )}

              {/* Delete Button */}
              <button
                type="button"
                onClick={handleDelete}
                className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-80 group-hover:opacity-100"
                title="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
