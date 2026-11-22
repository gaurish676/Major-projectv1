import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Inbox, RotateCcw, CheckCircle2, Sparkles } from 'lucide-react';
import { M3_TOKENS, TaskItem, TaskMetrics } from '../../theme/tokens';
import {
  fetchTasks,
  createTaskApi,
  updateTaskApi,
  toggleTaskApi,
  deleteTaskApi,
  restoreTaskApi,
  computeMetrics,
} from '../../lib/taskApi';
import { ProgressBanner } from './ProgressBanner';
import { FilterChips, FilterType } from './FilterChips';
import { TaskItemCard } from './TaskItemCard';
import { AddEditTaskModal } from './AddEditTaskModal';
import { TaskDetailModal } from './TaskDetailModal';

export const MainDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // 4-Second Undo Toast State
  const [recentlyDeleted, setRecentlyDeleted] = useState<TaskItem | null>(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState<number | null>(null);

  // Load tasks on mount and filter changes
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchTasks('all');
      setTasks(res.tasks);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Dynamic Metrics across all tasks
  const metrics: TaskMetrics = useMemo(() => computeMetrics(tasks), [tasks]);

  // Counts for each filter chip
  const filterCounts = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const todayCount = tasks.filter((t) => {
      const d = new Date(t.due_at);
      return d >= startOfToday && d <= endOfToday;
    }).length;

    const upcomingCount = tasks.filter((t) => {
      const d = new Date(t.due_at);
      return d > endOfToday;
    }).length;

    const completedCount = tasks.filter((t) => Boolean(t.is_completed)).length;

    return {
      all: tasks.length,
      today: todayCount,
      upcoming: upcomingCount,
      completed: completedCount,
    };
  }, [tasks]);

  // Visible filtered list
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (activeFilter === 'today') {
      return tasks.filter((t) => {
        const d = new Date(t.due_at);
        return d >= startOfToday && d <= endOfToday;
      });
    }
    if (activeFilter === 'upcoming') {
      return tasks.filter((t) => {
        const d = new Date(t.due_at);
        return d > endOfToday;
      });
    }
    if (activeFilter === 'completed') {
      return tasks.filter((t) => Boolean(t.is_completed));
    }
    return tasks;
  }, [tasks, activeFilter]);

  // Toggle completion instantly without full page reload
  const handleToggleTask = async (id: string) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_completed: t.is_completed ? 0 : 1 } : t))
    );

    // If modal is viewing this task, update it
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask((prev) => (prev ? { ...prev, is_completed: prev.is_completed ? 0 : 1 } : null));
    }

    try {
      const updated = await toggleTaskApi(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      if (selectedTask && selectedTask.id === id) {
        setSelectedTask(updated);
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
      // Revert on error
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_completed: t.is_completed ? 0 : 1 } : t))
      );
    }
  };

  // Delete task with 4-second Undo toast
  const handleDeleteTask = async (task: TaskItem) => {
    // Optimistic removal from visible list
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    if (selectedTask?.id === task.id) {
      setSelectedTask(null);
    }

    // Set undo banner
    setRecentlyDeleted(task);
    if (undoTimeoutId) clearTimeout(undoTimeoutId);

    const timer = window.setTimeout(async () => {
      setRecentlyDeleted(null);
      await deleteTaskApi(task.id);
    }, 4000);
    setUndoTimeoutId(timer);
  };

  // Undo delete
  const handleUndoDelete = async () => {
    if (!recentlyDeleted) return;
    const taskToRestore = recentlyDeleted;
    if (undoTimeoutId) clearTimeout(undoTimeoutId);
    setRecentlyDeleted(null);

    // Optimistically restore
    setTasks((prev) => [taskToRestore, ...prev]);
    await restoreTaskApi(taskToRestore);
  };

  // Save Task (Create or Update)
  const handleSaveTask = async (formData: Partial<TaskItem>) => {
    if (editingTask) {
      const updated = await updateTaskApi(editingTask.id, formData);
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updated : t)));
      if (selectedTask?.id === editingTask.id) {
        setSelectedTask(updated);
      }
      setEditingTask(null);
    } else {
      const created = await createTaskApi(formData);
      setTasks((prev) => [created, ...prev]);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col antialiased selection:bg-purple-200"
      style={{ backgroundColor: M3_TOKENS.colors.colorSurface }}
    >
      {/* Top Application Bar */}
      <header
        className="sticky top-0 z-30 w-full px-4 sm:px-6 py-3.5 border-b backdrop-blur-md transition-colors"
        style={{
          backgroundColor: 'rgba(254, 247, 255, 0.92)',
          borderColor: M3_TOKENS.colors.stroke,
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs"
              style={{ backgroundColor: M3_TOKENS.colors.colorPrimary }}
            >
              <CheckCircle2 className="w-5 h-5 text-white stroke-[2.4]" />
            </div>
            <div>
              <h1
                className="text-[20px] font-bold tracking-tight leading-none"
                style={{ color: M3_TOKENS.colors.colorPrimary }}
              >
                TaskNest
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">M3 Productivity Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: M3_TOKENS.colors.colorSurfaceContainer,
                color: M3_TOKENS.colors.colorPrimary,
                border: `1px solid ${M3_TOKENS.colors.stroke}`,
              }}
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>v3.0 Production</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-5 pb-24 space-y-5">
        {/* Top Progress Summary Banner */}
        <ProgressBanner metrics={metrics} />

        {/* Horizontal Filter Chips */}
        <div className="pt-1">
          <FilterChips
            activeFilter={activeFilter}
            onSelectFilter={setActiveFilter}
            counts={filterCounts}
          />
        </div>

        {/* Task List */}
        <div className="space-y-3 pt-1">
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-full h-24 rounded-[16px] animate-pulse bg-slate-200/60"
                />
              ))}
            </div>
          ) : filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskItemCard
                key={task.id}
                task={task}
                onToggle={handleToggleTask}
                onClick={(t) => setSelectedTask(t)}
                onDelete={handleDeleteTask}
              />
            ))
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-[16px] border border-dashed border-slate-300 bg-white/50">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: M3_TOKENS.colors.colorSurfaceContainer }}
              >
                <Inbox className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-700">No tasks yet</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-xs leading-relaxed">
                Tap the <strong className="text-purple-700 font-semibold">+ Add Task</strong> button below to create your first task.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* 4-Second Undo Toast Notification */}
      {recentlyDeleted && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md animate-slide-up">
          <div className="flex items-center justify-between px-4 py-3 rounded-[12px] bg-slate-900 text-white shadow-xl border border-slate-800">
            <span className="text-xs font-medium">Task deleted</span>
            <button
              type="button"
              onClick={handleUndoDelete}
              className="flex items-center gap-1.5 px-3 py-1 rounded-[8px] text-xs font-bold text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>UNDO</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB - 56dp x 56dp, 16dp rounded) */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40">
        <button
          type="button"
          onClick={() => {
            setEditingTask(null);
            setIsAddEditOpen(true);
          }}
          className="w-[56px] h-[56px] rounded-[16px] text-white flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          style={{
            backgroundColor: M3_TOKENS.colors.colorPrimary,
            boxShadow: '0 6px 18px rgba(103, 80, 164, 0.35)',
          }}
          aria-label="Add Task"
          title="Add New Task"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* Modals: Add / Edit Form */}
      {isAddEditOpen && (
        <AddEditTaskModal
          initialTask={editingTask}
          onSave={handleSaveTask}
          onClose={() => {
            setIsAddEditOpen(false);
            setEditingTask(null);
          }}
        />
      )}

      {/* Modals: Task Detail View */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={(task) => {
            setSelectedTask(null);
            setEditingTask(task);
            setIsAddEditOpen(true);
          }}
          onToggleComplete={handleToggleTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
};
