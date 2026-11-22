import { TaskItem, TaskMetrics } from '../theme/tokens';

const STORAGE_KEY = 'tasknest_local_tasks_v1';

const DEFAULT_SEED_TASKS: TaskItem[] = [
  {
    id: 'seed-task-1',
    title: 'Finish Embedded Systems Lab Report',
    description: 'Complete the CYW43439 firmware integration test and document power consumption under light sleep.',
    due_at: new Date(new Date().setHours(16, 0, 0, 0)).toISOString(),
    category: 'Study',
    priority: 'HIGH',
    reminder_on: 1,
    reminder_offset: 15,
    is_completed: 0,
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'seed-task-2',
    title: 'Review System Architecture & M3 Design Tokens',
    description: 'Verify Material Design 3 color palette and badge semantics with the frontend development team.',
    due_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    category: 'Work',
    priority: 'MEDIUM',
    reminder_on: 1,
    reminder_offset: 30,
    is_completed: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'seed-task-3',
    title: 'Buy Ergonomic Desk Setup Accessories',
    description: 'Procure USB-C hub, monitor riser, and wireless keyboard for development workstation.',
    due_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    category: 'Personal',
    priority: 'LOW',
    reminder_on: 0,
    reminder_offset: 0,
    is_completed: 1,
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
];

function getLocalTasks(): TaskItem[] {
  if (typeof window === 'undefined') return DEFAULT_SEED_TASKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SEED_TASKS));
      return DEFAULT_SEED_TASKS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SEED_TASKS;
  }
}

function saveLocalTasks(tasks: TaskItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export function computeMetrics(tasks: TaskItem[]): TaskMetrics {
  const total = tasks.length;
  const completed = tasks.filter((t) => Boolean(t.is_completed)).length;
  const pending = total - completed;
  const completion_rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, pending, completed, completion_rate };
}

export async function fetchTasks(filter: string = 'all'): Promise<{ tasks: TaskItem[]; metrics: TaskMetrics }> {
  try {
    const res = await fetch(`/api/tasks?filter=${encodeURIComponent(filter)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.tasks)) {
        // Also sync local cache
        saveLocalTasks(data.tasks);
        return { tasks: data.tasks, metrics: data.metrics };
      }
    }
  } catch (err) {
    console.warn('API unavailable, falling back to local storage:', err);
  }

  // Fallback to local storage
  const all = getLocalTasks();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  let filtered = all;
  if (filter === 'today') {
    filtered = all.filter((t) => {
      const due = new Date(t.due_at);
      return due >= startOfToday && due <= endOfToday;
    });
  } else if (filter === 'upcoming') {
    filtered = all.filter((t) => {
      const due = new Date(t.due_at);
      return due > endOfToday;
    });
  } else if (filter === 'completed') {
    filtered = all.filter((t) => Boolean(t.is_completed));
  }

  return {
    tasks: filtered,
    metrics: computeMetrics(all),
  };
}

export async function createTaskApi(taskData: Partial<TaskItem>): Promise<TaskItem> {
  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.task) {
        const local = getLocalTasks();
        saveLocalTasks([data.task, ...local]);
        return data.task;
      }
    }
  } catch (err) {
    console.warn('API error on createTask, saving locally:', err);
  }

  // Fallback
  const newTask: TaskItem = {
    id: 'local-' + Date.now(),
    title: taskData.title || '',
    description: taskData.description || '',
    due_at: taskData.due_at || new Date().toISOString(),
    category: taskData.category || 'Personal',
    priority: taskData.priority || 'MEDIUM',
    reminder_on: taskData.reminder_on ? 1 : 0,
    reminder_offset: taskData.reminder_offset ?? 15,
    is_completed: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const current = getLocalTasks();
  saveLocalTasks([newTask, ...current]);
  return newTask;
}

export async function updateTaskApi(id: string, updates: Partial<TaskItem>): Promise<TaskItem> {
  try {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.task) {
        const current = getLocalTasks().map((t) => (t.id === id ? data.task : t));
        saveLocalTasks(current);
        return data.task;
      }
    }
  } catch (err) {
    console.warn('API error on updateTask, updating locally:', err);
  }

  // Fallback
  const current = getLocalTasks();
  const existing = current.find((t) => t.id === id);
  const updated: TaskItem = existing
    ? { ...existing, ...updates, updated_at: new Date().toISOString() }
    : ({ id, ...updates } as TaskItem);
  saveLocalTasks(current.map((t) => (t.id === id ? updated : t)));
  return updated;
}

export async function toggleTaskApi(id: string): Promise<TaskItem> {
  try {
    const res = await fetch(`/api/tasks/${id}/toggle`, { method: 'PATCH' });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.task) {
        const current = getLocalTasks().map((t) => (t.id === id ? data.task : t));
        saveLocalTasks(current);
        return data.task;
      }
    }
  } catch (err) {
    console.warn('API error on toggleTask, toggling locally:', err);
  }

  // Fallback
  const current = getLocalTasks();
  const existing = current.find((t) => t.id === id);
  if (!existing) throw new Error('Task not found');
  const updated: TaskItem = {
    ...existing,
    is_completed: existing.is_completed ? 0 : 1,
    updated_at: new Date().toISOString(),
  };
  saveLocalTasks(current.map((t) => (t.id === id ? updated : t)));
  return updated;
}

export async function deleteTaskApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (res.ok) {
      const current = getLocalTasks().filter((t) => t.id !== id);
      saveLocalTasks(current);
      return true;
    }
  } catch (err) {
    console.warn('API error on deleteTask, deleting locally:', err);
  }

  const current = getLocalTasks().filter((t) => t.id !== id);
  saveLocalTasks(current);
  return true;
}

export async function restoreTaskApi(task: TaskItem): Promise<TaskItem> {
  try {
    const res = await fetch(`/api/tasks/${task.id}/restore`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.task) {
        const current = getLocalTasks();
        saveLocalTasks([data.task, ...current]);
        return data.task;
      }
    }
  } catch (err) {
    console.warn('API error on restoreTask, restoring locally:', err);
  }

  const current = getLocalTasks();
  saveLocalTasks([task, ...current]);
  return task;
}
