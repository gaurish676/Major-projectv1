import { getDb } from './database';
import fs from 'fs';
import path from 'path';

export async function clearAllData(): Promise<void> {
  const db = getDb();
  console.log('Clearing all application data from SQLite database...');

  // Disable foreign keys to truncate in any order
  db.exec('PRAGMA foreign_keys = OFF;');

  const tables = [
    'submissions',
    'student_marks',
    'counseling_logs',
    'activity_logs',
    'schema_requests',
    'notifications',
    'events',
    'placement_drives',
    'rulebook_uploads',
    'users',
    'activity_schema',
    'schema_categories',
    'departments'
  ];

  db.exec('BEGIN TRANSACTION;');
  try {
    for (const table of tables) {
      db.exec(`DELETE FROM ${table};`);
      // Reset sqlite_sequence if exists
      try {
        db.exec(`DELETE FROM sqlite_sequence WHERE name = '${table}';`);
      } catch {}
    }
    db.exec('COMMIT;');
    console.log('All database tables cleared successfully.');
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('Failed to clear database tables:', err);
    throw err;
  } finally {
    db.exec('PRAGMA foreign_keys = ON;');
  }

  // Vacuum to shrink database file and defragment
  try {
    db.exec('VACUUM;');
  } catch (err) {
    console.warn('Vacuum warning:', err);
  }

  // Safely clear only temporary/mock uploads while preserving real student certificates & static fixtures
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    let deletedCount = 0;
    for (const file of files) {
      const fullPath = path.join(uploadsDir, file);
      if (fs.statSync(fullPath).isFile()) {
        const isTemporaryUpload = file.startsWith('cert_') || file.startsWith('tmp_') || file.startsWith('temp_') || file.startsWith('mock_');
        // Only delete ephemeral/mock uploads generated during test runs, preserving real student certificates
        if (isTemporaryUpload) {
          fs.unlinkSync(fullPath);
          deletedCount++;
        }
      }
    }
    console.log(`Cleaned ${deletedCount} ephemeral mock upload files from uploads/ (preserved real student certificates & static fixtures)`);
  }

  // Output row counts to verify 0 rows in all tables
  console.log('\n--- Verification: Row Counts After Clearing ---');
  for (const table of tables) {
    const row = db.prepare(`SELECT count(*) as count FROM ${table}`).get() as { count: number };
    console.log(`Table ${table.padEnd(20)}: ${row.count} rows`);
  }
}

if (process.argv[1] && process.argv[1].endsWith('clear.ts')) {
  clearAllData()
    .then(() => {
      console.log('\nProject data cleared cleanly! Ready for new dataset.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Clear failed:', err);
      process.exit(1);
    });
}
