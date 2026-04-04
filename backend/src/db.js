import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create or open the database file
const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

// Initialize database schema
export const initDB = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      source TEXT NOT NULL,
      raw_message TEXT NOT NULL,
      ai_severity TEXT,
      ai_category TEXT,
      ai_suggested_action TEXT,
      ai_confidence_score REAL,
      status TEXT DEFAULT 'pending'
    );
  `);
};

export default db;
