import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

let dbInstance: DatabaseSync | null = null;

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'activity_portal.sqlite');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure data & uploads directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function getDb(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  // Open persistent SQLite database on disk
  const db = new DatabaseSync(DB_PATH);

  // Configure high-concurrency WAL (Write-Ahead Logging) mode and connection settings
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA cache_size = -20000;'); // 20MB cache

  // Initialize schema tables
  initSchema(db);

  dbInstance = db;
  return db;
}

/**
 * Backward compatibility stub - WAL mode writes directly to disk on every transaction
 */
export function saveDb(): void {
  // No-op in persistent WAL mode - all writes flush directly to WAL on disk
}

function initSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('hod', 'mentor', 'student')),
      department_id TEXT NOT NULL,
      mentor_id TEXT,
      cgpa REAL,
      semester INTEGER,
      roll_no TEXT,
      avatar TEXT,
      phone TEXT,
      bio TEXT,
      designation TEXT,
      office_location TEXT,
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (mentor_id) REFERENCES users(id)
    );
  `);

  // Safely ensure new columns exist if table was previously created
  try { db.exec('ALTER TABLE users ADD COLUMN phone TEXT;'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN bio TEXT;'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN designation TEXT;'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN office_location TEXT;'); } catch {}
  try { db.exec('ALTER TABLE submissions ADD COLUMN ai_audit_results TEXT;'); } catch {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      max_cap_points INTEGER NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_schema (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      activity_name TEXT NOT NULL,
      base_points INTEGER NOT NULL,
      criteria TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      FOREIGN KEY (category_id) REFERENCES schema_categories(id)
    );

    CREATE TABLE IF NOT EXISTS schema_requests (
      id TEXT PRIMARY KEY,
      mentor_id TEXT NOT NULL,
      activity_name TEXT NOT NULL,
      category_id TEXT NOT NULL,
      requested_points INTEGER NOT NULL,
      approved_points INTEGER,
      reason TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
      hod_remarks TEXT,
      reviewed_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (mentor_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES schema_categories(id)
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      schema_id TEXT NOT NULL,
      schema_version_snapshot INTEGER NOT NULL,
      activity_title TEXT NOT NULL,
      category_id TEXT NOT NULL,
      description TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
      points_awarded INTEGER NOT NULL DEFAULT 0,
      mentor_feedback TEXT,
      ai_audit_results TEXT,
      completion_date TEXT NOT NULL,
      submitted_at TEXT NOT NULL,
      reviewed_at TEXT,
      reviewed_by TEXT,
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (schema_id) REFERENCES activity_schema(id),
      FOREIGN KEY (category_id) REFERENCES schema_categories(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category_id TEXT NOT NULL,
      description TEXT NOT NULL,
      potential_points INTEGER NOT NULL,
      event_date TEXT NOT NULL,
      venue TEXT NOT NULL,
      registration_link TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES schema_categories(id)
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_marks (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      semester INTEGER NOT NULL,
      subject_code TEXT,
      subject_name TEXT NOT NULL,
      credits INTEGER NOT NULL DEFAULT 4,
      theory_marks REAL NOT NULL DEFAULT 0,
      theory_max REAL NOT NULL DEFAULT 100,
      task_marks REAL NOT NULL DEFAULT 0,
      task_max REAL NOT NULL DEFAULT 25,
      has_lab INTEGER NOT NULL DEFAULT 0,
      lab_marks REAL NOT NULL DEFAULT 0,
      lab_max REAL NOT NULL DEFAULT 50,
      grade TEXT,
      grade_points REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      FOREIGN KEY (student_id) REFERENCES users(id)
    );

    -- Create performance indexes for high-frequency queries
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_mentor ON users(mentor_id);
    CREATE INDEX IF NOT EXISTS idx_users_dept ON users(department_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
    CREATE INDEX IF NOT EXISTS idx_submissions_category ON submissions(category_id);
    CREATE INDEX IF NOT EXISTS idx_student_marks_student ON student_marks(student_id);
    CREATE INDEX IF NOT EXISTS idx_logs_created ON activity_logs(created_at);
  `);
}

function sanitizeParams(params: any[] = []): any[] {
  return (params || []).map((p) => (p === undefined ? null : p));
}

// Typed Query Helpers
export async function queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = getDb();
  const stmt = db.prepare(sql);
  const rows = stmt.all(...sanitizeParams(params));
  return rows as unknown as T[];
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const db = getDb();
  const stmt = db.prepare(sql);
  const row = stmt.get(...sanitizeParams(params));
  return (row as unknown as T) || null;
}

export async function executeRun(sql: string, params: any[] = []): Promise<void> {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.run(...sanitizeParams(params));
}

export async function executeExec(sql: string): Promise<void> {
  const db = getDb();
  db.exec(sql);
}

/**
 * Executes a callback inside an atomic transaction (BEGIN IMMEDIATE / COMMIT / ROLLBACK)
 */
export async function runTransaction<T>(callback: (db: DatabaseSync) => Promise<T> | T): Promise<T> {
  const db = getDb();
  db.exec('BEGIN IMMEDIATE;');
  try {
    const result = await callback(db);
    db.exec('COMMIT;');
    return result;
  } catch (error) {
    try {
      db.exec('ROLLBACK;');
    } catch {}
    throw error;
  }
}
