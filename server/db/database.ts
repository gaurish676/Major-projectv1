import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database | null = null;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'activity_portal.sqlite');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure data & uploads directory exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn('Failed to load existing database file, creating fresh DB:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Initialize Schema Tables
  initSchema(dbInstance);
  saveDb();

  return dbInstance;
}

export function saveDb() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Failed to save database to disk:', err);
  }
}

function initSchema(db: Database) {
  db.run(`
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
  try { db.run("ALTER TABLE users ADD COLUMN phone TEXT;"); } catch {}
  try { db.run("ALTER TABLE users ADD COLUMN bio TEXT;"); } catch {}
  try { db.run("ALTER TABLE users ADD COLUMN designation TEXT;"); } catch {}
  try { db.run("ALTER TABLE users ADD COLUMN office_location TEXT;"); } catch {}

  db.run(`

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
  `);
}

// Typed Query Helpers
export async function queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  const stmt = db.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return results;
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function executeRun(sql: string, params: any[] = []): Promise<void> {
  const db = await getDb();
  db.run(sql, params);
  saveDb();
}
