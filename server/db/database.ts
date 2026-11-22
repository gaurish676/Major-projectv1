import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

let dbInstance: Database.Database | null = null;

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

export function getDb(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  // Open persistent SQLite database on disk
  const db = new Database(DB_PATH);

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

function initSchema(db: Database.Database): void {
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
      tenth_percentage REAL,
      tenth_board TEXT,
      tenth_year INTEGER,
      twelfth_percentage REAL,
      twelfth_board TEXT,
      twelfth_year INTEGER,
      diploma_or_pu TEXT DEFAULT 'puc',
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (mentor_id) REFERENCES users(id)
    );
  `);

  // Schema initialized without developer role

  // Safely ensure new columns exist if table was previously created
  try { db.exec('ALTER TABLE users ADD COLUMN phone TEXT;'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN bio TEXT;'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN designation TEXT;'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN office_location TEXT;'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN tenth_percentage REAL;'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN tenth_board TEXT;'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN tenth_year INTEGER;'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN twelfth_percentage REAL;'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN twelfth_board TEXT;'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN twelfth_year INTEGER;'); } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN diploma_or_pu TEXT DEFAULT 'puc';"); } catch {}

  try { db.exec('ALTER TABLE placement_drives ADD COLUMN min_tenth_percentage REAL DEFAULT 0;'); } catch {}
  try { db.exec('ALTER TABLE placement_drives ADD COLUMN min_twelfth_percentage REAL DEFAULT 0;'); } catch {}

  // Update existing placement drives with standard industry 10th and 12th criteria
  try {
    db.exec(`
      UPDATE placement_drives SET min_tenth_percentage = 75, min_twelfth_percentage = 75 WHERE id = 'drv_1' AND (min_tenth_percentage IS NULL OR min_tenth_percentage = 0);
      UPDATE placement_drives SET min_tenth_percentage = 70, min_twelfth_percentage = 70 WHERE id = 'drv_2' AND (min_tenth_percentage IS NULL OR min_tenth_percentage = 0);
      UPDATE placement_drives SET min_tenth_percentage = 70, min_twelfth_percentage = 70 WHERE id = 'drv_3' AND (min_tenth_percentage IS NULL OR min_tenth_percentage = 0);
      UPDATE placement_drives SET min_tenth_percentage = 65, min_twelfth_percentage = 65 WHERE id = 'drv_4' AND (min_tenth_percentage IS NULL OR min_tenth_percentage = 0);
      UPDATE placement_drives SET min_tenth_percentage = 60, min_twelfth_percentage = 60 WHERE id = 'drv_5' AND (min_tenth_percentage IS NULL OR min_tenth_percentage = 0);
      UPDATE placement_drives SET min_tenth_percentage = 60, min_twelfth_percentage = 60 WHERE id = 'drv_6' AND (min_tenth_percentage IS NULL OR min_tenth_percentage = 0);
    `);
  } catch {}

  // Backfill demo students with realistic 10th and 12th marks if null
  try {
    db.exec(`
      UPDATE users SET tenth_percentage = 92.4, tenth_board = 'CBSE', tenth_year = 2020, twelfth_percentage = 89.6, twelfth_board = 'Karnataka State PUC', twelfth_year = 2022, diploma_or_pu = 'puc' WHERE (id = 'usr_std_gaurish' OR id = 'usr_student_1') AND tenth_percentage IS NULL;
      UPDATE users SET tenth_percentage = 88.0, tenth_board = 'ICSE', tenth_year = 2020, twelfth_percentage = 86.5, twelfth_board = 'Karnataka State PUC', twelfth_year = 2022, diploma_or_pu = 'puc' WHERE (id = 'usr_std_sampath' OR id = 'usr_student_2') AND tenth_percentage IS NULL;
      UPDATE users SET tenth_percentage = 82.5, tenth_board = 'State Board', tenth_year = 2019, twelfth_percentage = 81.0, twelfth_board = 'DTE Diploma (CS)', twelfth_year = 2022, diploma_or_pu = 'diploma' WHERE (id = 'usr_std_sharan' OR id = 'usr_student_3') AND tenth_percentage IS NULL;
      UPDATE users SET tenth_percentage = 78.4, tenth_board = 'CBSE', tenth_year = 2020, twelfth_percentage = 74.5, twelfth_board = 'CBSE', twelfth_year = 2022, diploma_or_pu = 'puc' WHERE (id = 'usr_std_ronak' OR id = 'usr_student_4') AND tenth_percentage IS NULL;
      UPDATE users SET tenth_percentage = 88.0, tenth_board = 'ICSE', tenth_year = 2020, twelfth_percentage = 85.5, twelfth_board = 'ISC', twelfth_year = 2022, diploma_or_pu = 'puc' WHERE id = 'usr_student_5' AND tenth_percentage IS NULL;
    `);
  } catch {}

  try { db.exec('ALTER TABLE submissions ADD COLUMN ai_audit_results TEXT;'); } catch {}
  try { db.exec('ALTER TABLE submissions ADD COLUMN semester INTEGER;'); } catch {}
  try { db.exec('ALTER TABLE submissions ADD COLUMN hours_spent INTEGER DEFAULT 0;'); } catch {}
  try { db.exec('ALTER TABLE submissions ADD COLUMN credential_hash TEXT;'); } catch {}
  try { db.exec('ALTER TABLE submissions ADD COLUMN qr_code_data TEXT;'); } catch {}
  try { db.exec("ALTER TABLE submissions ADD COLUMN verification_status TEXT DEFAULT 'verified';"); } catch {}
  try { db.exec('ALTER TABLE submissions ADD COLUMN verification_checklist TEXT;'); } catch {}
  try { db.exec('ALTER TABLE submissions ADD COLUMN file_hash TEXT;'); } catch {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_submissions_file_hash ON submissions(file_hash);'); } catch {}

  // Backfill and synchronize exact binary SHA-256 file_hash for submissions
  try {
    const allSubmissions = db.prepare("SELECT id, file_url, student_id, file_hash FROM submissions").all() as any[];
    if (allSubmissions && allSubmissions.length > 0) {
      const updateStmt = db.prepare("UPDATE submissions SET file_hash = ? WHERE id = ?");
      for (const s of allSubmissions) {
        let hash = '';
        if (s.file_url) {
          let diskPath = s.file_url;
          if (!fs.existsSync(diskPath)) {
            const relPath = path.join(process.cwd(), s.file_url.replace(/^\//, ''));
            if (fs.existsSync(relPath)) {
              diskPath = relPath;
            } else {
              const inUploads = path.join(process.cwd(), 'uploads', path.basename(s.file_url));
              if (fs.existsSync(inUploads)) {
                diskPath = inUploads;
              }
            }
          }

          if (fs.existsSync(diskPath)) {
            try {
              const buf = fs.readFileSync(diskPath);
              hash = crypto.createHash('sha256').update(buf).digest('hex');
            } catch {}
          }
        }
        if (!hash && (!s.file_hash || s.file_hash === '')) {
          hash = crypto.createHash('sha256').update(`${s.file_url || 'file'}-${s.id}`).digest('hex');
        }
        if (hash && s.file_hash !== hash) {
          updateStmt.run(hash, s.id);
        }
      }
    }
  } catch (err) {
    console.warn('Note on file_hash sync:', err);
  }
  try { db.exec('ALTER TABLE activity_schema ADD COLUMN hours_required INTEGER DEFAULT 0;'); } catch {}
  try { db.exec('ALTER TABLE activity_schema ADD COLUMN points_per_hour REAL DEFAULT 0;'); } catch {}
  try { db.exec("ALTER TABLE activity_schema ADD COLUMN applicable_year TEXT DEFAULT 'all';"); } catch {}
  try { db.exec('ALTER TABLE activity_schema ADD COLUMN max_per_year INTEGER DEFAULT 1;'); } catch {}
  try { db.exec('ALTER TABLE student_marks ADD COLUMN mse1_marks REAL DEFAULT 0;'); } catch {}
  try { db.exec('ALTER TABLE student_marks ADD COLUMN mse1_max REAL DEFAULT 30;'); } catch {}
  try { db.exec('ALTER TABLE student_marks ADD COLUMN mse2_marks REAL DEFAULT 0;'); } catch {}
  try { db.exec('ALTER TABLE student_marks ADD COLUMN mse2_max REAL DEFAULT 30;'); } catch {}
  try { db.exec('ALTER TABLE student_marks ADD COLUMN is_poor_performance INTEGER DEFAULT 0;'); } catch {}

  // Safe migration for users table to allow 'dean' in role check
  try {
    const userRoleCheck = db.prepare("SELECT sql FROM sqlite_master WHERE name='users'").get() as any;
    if (userRoleCheck && userRoleCheck.sql && !userRoleCheck.sql.includes("'dean'")) {
      db.exec('PRAGMA foreign_keys = OFF;');
      db.exec(`
        CREATE TABLE users_migrated (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('hod', 'mentor', 'student', 'dean')),
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
        INSERT INTO users_migrated SELECT id, name, email, password_hash, role, department_id, mentor_id, cgpa, semester, roll_no, avatar, phone, bio, designation, office_location FROM users;
        DROP TABLE users;
        ALTER TABLE users_migrated RENAME TO users;
      `);
      db.exec('PRAGMA foreign_keys = ON;');
    }
  } catch (e) {
    console.warn('Note on users role migration:', e);
  }

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
      file_hash TEXT,
      status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
      points_awarded INTEGER NOT NULL DEFAULT 0,
      semester INTEGER,
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

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_role TEXT NOT NULL,
      recipient_id TEXT,
      recipient_role TEXT,
      category TEXT NOT NULL DEFAULT 'meeting',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      meeting_time TEXT,
      meeting_venue TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (sender_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS academic_messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_role TEXT NOT NULL,
      recipient_id TEXT NOT NULL,
      recipient_name TEXT NOT NULL,
      recipient_role TEXT NOT NULL,
      subject TEXT,
      message TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (recipient_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_acad_msg_parties ON academic_messages(sender_id, recipient_id);
    CREATE INDEX IF NOT EXISTS idx_acad_msg_recipient ON academic_messages(recipient_id, is_read);

    CREATE TABLE IF NOT EXISTS counseling_logs (
      id TEXT PRIMARY KEY,
      mentor_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      subject_code TEXT,
      subject_name TEXT,
      mse_marks REAL DEFAULT 0,
      mse_max REAL DEFAULT 30,
      reason TEXT NOT NULL,
      counseling_notes TEXT NOT NULL,
      action_plan TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      student_acknowledged INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (mentor_id) REFERENCES users(id),
      FOREIGN KEY (student_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS placement_drives (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      role_title TEXT NOT NULL,
      min_cgpa REAL NOT NULL,
      min_activity_points INTEGER NOT NULL,
      max_backlogs INTEGER NOT NULL DEFAULT 0,
      min_tenth_percentage REAL DEFAULT 0,
      min_twelfth_percentage REAL DEFAULT 0,
      package_lpa REAL NOT NULL,
      drive_date TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Tier-1 Tech',
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS rulebook_uploads (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      file_url TEXT NOT NULL,
      raw_text TEXT,
      parsed_rules_json TEXT,
      target_academic_year TEXT NOT NULL DEFAULT 'all',
      status TEXT NOT NULL DEFAULT 'processed',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_queue_jobs (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL UNIQUE,
      file_path TEXT NOT NULL,
      student_name TEXT,
      roll_no TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
      error_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Create performance indexes for high-frequency queries
    CREATE INDEX IF NOT EXISTS idx_audit_queue_status ON audit_queue_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_mentor ON users(mentor_id);
    CREATE INDEX IF NOT EXISTS idx_users_dept ON users(department_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_semester ON submissions(semester);
    CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
    CREATE INDEX IF NOT EXISTS idx_submissions_category ON submissions(category_id);
    CREATE INDEX IF NOT EXISTS idx_student_marks_student ON student_marks(student_id);
    CREATE INDEX IF NOT EXISTS idx_counseling_student ON counseling_logs(student_id);
    CREATE INDEX IF NOT EXISTS idx_counseling_mentor ON counseling_logs(mentor_id);
    CREATE INDEX IF NOT EXISTS idx_logs_created ON activity_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(recipient_role);
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
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
export async function runTransaction<T>(callback: (db: Database.Database) => Promise<T> | T): Promise<T> {
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
