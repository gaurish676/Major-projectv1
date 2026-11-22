import crypto from 'crypto';
import { getDb } from './database';

export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  due_at: string;
  category: 'Work' | 'Personal' | 'Study';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  reminder_on: number; // 0 or 1
  reminder_offset: number; // in minutes (0, 10, 30, 60, 1440)
  is_completed: number; // 0 or 1
  is_deleted: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

export function initTaskTable(): void {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      due_at TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('Work', 'Personal', 'Study')),
      priority TEXT NOT NULL CHECK(priority IN ('HIGH', 'MEDIUM', 'LOW')),
      reminder_on INTEGER NOT NULL DEFAULT 0,
      reminder_offset INTEGER NOT NULL DEFAULT 15,
      is_completed INTEGER NOT NULL DEFAULT 0,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON tasks(due_at);
    CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON tasks(is_completed);
    CREATE INDEX IF NOT EXISTS idx_tasks_is_deleted ON tasks(is_deleted);
  `);

  // Seed default tasks from UI.md if table is empty
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE is_deleted = 0');
  const result = countStmt.get() as { count: number };
  if (result.count === 0) {
    const now = new Date();
    // Today at 4:00 PM
    const today4pm = new Date(now);
    today4pm.setHours(16, 0, 0, 0);

    // Tomorrow at 10:00 AM
    const tomorrow10am = new Date(now);
    tomorrow10am.setDate(tomorrow10am.getDate() + 1);
    tomorrow10am.setHours(10, 0, 0, 0);

    // Yesterday completed
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(18, 0, 0, 0);

    const initialTasks: TaskRecord[] = [
      {
        id: crypto.randomUUID(),
        title: 'Finish Embedded Systems Lab Report',
        description: 'Complete the CYW43439 firmware integration test and document power consumption under light sleep.',
        due_at: today4pm.toISOString(),
        category: 'Study',
        priority: 'HIGH',
        reminder_on: 1,
        reminder_offset: 15,
        is_completed: 0,
        is_deleted: 0,
        created_at: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        title: 'Review System Architecture & M3 Design Tokens',
        description: 'Verify Material Design 3 color palette and badge semantics with the frontend development team.',
        due_at: tomorrow10am.toISOString(),
        category: 'Work',
        priority: 'MEDIUM',
        reminder_on: 1,
        reminder_offset: 30,
        is_completed: 0,
        is_deleted: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        title: 'Buy Ergonomic Desk Setup Accessories',
        description: 'Procure USB-C hub, monitor riser, and wireless keyboard for development workstation.',
        due_at: yesterday.toISOString(),
        category: 'Personal',
        priority: 'LOW',
        reminder_on: 0,
        reminder_offset: 0,
        is_completed: 1,
        is_deleted: 0,
        created_at: new Date(now.getTime() - 48 * 3600 * 1000).toISOString(),
        updated_at: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
      },
    ];

    const insertStmt = db.prepare(`
      INSERT INTO tasks (
        id, title, description, due_at, category, priority,
        reminder_on, reminder_offset, is_completed, is_deleted, created_at, updated_at
      ) VALUES (
        @id, @title, @description, @due_at, @category, @priority,
        @reminder_on, @reminder_offset, @is_completed, @is_deleted, @created_at, @updated_at
      )
    `);

    const insertMany = db.transaction((tasks: TaskRecord[]) => {
      for (const t of tasks) insertStmt.run(t);
    });
    insertMany(initialTasks);
  }
}

export function getAllTasks(): TaskRecord[] {
  const db = getDb();
  initTaskTable();
  const stmt = db.prepare(`
    SELECT * FROM tasks 
    WHERE is_deleted = 0 
    ORDER BY is_completed ASC, due_at ASC
  `);
  return stmt.all() as TaskRecord[];
}

export function getTaskById(id: string): TaskRecord | null {
  const db = getDb();
  initTaskTable();
  const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  const row = stmt.get(id);
  return (row as TaskRecord) || null;
}

export function createTask(data: {
  title: string;
  description?: string;
  due_at: string;
  category: 'Work' | 'Personal' | 'Study';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  reminder_on?: boolean | number;
  reminder_offset?: number;
}): TaskRecord {
  const db = getDb();
  initTaskTable();

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const task: TaskRecord = {
    id,
    title: data.title.trim(),
    description: (data.description || '').trim(),
    due_at: data.due_at,
    category: data.category,
    priority: data.priority,
    reminder_on: data.reminder_on ? 1 : 0,
    reminder_offset: data.reminder_offset ?? 15,
    is_completed: 0,
    is_deleted: 0,
    created_at: now,
    updated_at: now,
  };

  const stmt = db.prepare(`
    INSERT INTO tasks (
      id, title, description, due_at, category, priority,
      reminder_on, reminder_offset, is_completed, is_deleted, created_at, updated_at
    ) VALUES (
      @id, @title, @description, @due_at, @category, @priority,
      @reminder_on, @reminder_offset, @is_completed, @is_deleted, @created_at, @updated_at
    )
  `);
  stmt.run(task);
  return task;
}

export function updateTask(
  id: string,
  data: Partial<Omit<TaskRecord, 'id' | 'created_at'>>
): TaskRecord | null {
  const db = getDb();
  initTaskTable();

  const existing = getTaskById(id);
  if (!existing) return null;

  const updated: TaskRecord = {
    ...existing,
    ...data,
    updated_at: new Date().toISOString(),
  };

  const stmt = db.prepare(`
    UPDATE tasks SET
      title = @title,
      description = @description,
      due_at = @due_at,
      category = @category,
      priority = @priority,
      reminder_on = @reminder_on,
      reminder_offset = @reminder_offset,
      is_completed = @is_completed,
      is_deleted = @is_deleted,
      updated_at = @updated_at
    WHERE id = @id
  `);
  stmt.run(updated);
  return updated;
}

export function toggleTaskCompletion(id: string): TaskRecord | null {
  const db = getDb();
  initTaskTable();

  const task = getTaskById(id);
  if (!task) return null;

  const nextCompleted = task.is_completed ? 0 : 1;
  const now = new Date().toISOString();

  const stmt = db.prepare('UPDATE tasks SET is_completed = ?, updated_at = ? WHERE id = ?');
  stmt.run(nextCompleted, now, id);

  return { ...task, is_completed: nextCompleted, updated_at: now };
}

export function softDeleteTask(id: string): boolean {
  const db = getDb();
  initTaskTable();
  const stmt = db.prepare('UPDATE tasks SET is_deleted = 1, updated_at = ? WHERE id = ?');
  const result = stmt.run(new Date().toISOString(), id);
  return result.changes > 0;
}

export function restoreTask(id: string): TaskRecord | null {
  const db = getDb();
  initTaskTable();
  const stmt = db.prepare('UPDATE tasks SET is_deleted = 0, updated_at = ? WHERE id = ?');
  stmt.run(new Date().toISOString(), id);
  return getTaskById(id);
}
