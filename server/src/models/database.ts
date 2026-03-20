import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const DB_PATH = process.env.DB_PATH || path.join(dataDir, 'companion.db');

// Create database connection
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Initialize all database tables and indexes.
 */
export function initDatabase(): void {
  logger.info(`Initializing database at ${DB_PATH}`);

  db.exec(`
    -- ============================
    -- Users table
    -- ============================
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      nickname    TEXT NOT NULL,
      age         INTEGER,
      gender      TEXT CHECK(gender IN ('male', 'female', 'other')),
      address     TEXT,
      avatar_url  TEXT,
      family_code TEXT UNIQUE,
      created_at  DATETIME DEFAULT (datetime('now', 'localtime')),
      updated_at  DATETIME DEFAULT (datetime('now', 'localtime'))
    );

    -- ============================
    -- Conversations table
    -- ============================
    CREATE TABLE IF NOT EXISTS conversations (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL,
      title         TEXT,
      summary       TEXT,
      mood          TEXT,
      message_count INTEGER DEFAULT 0,
      started_at    DATETIME DEFAULT (datetime('now', 'localtime')),
      ended_at      DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- ============================
    -- Messages table
    -- ============================
    CREATE TABLE IF NOT EXISTS messages (
      id              TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      user_id         TEXT NOT NULL,
      role            TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content         TEXT NOT NULL,
      created_at      DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- ============================
    -- Reminders table
    -- ============================
    CREATE TABLE IF NOT EXISTS reminders (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      type        TEXT NOT NULL CHECK(type IN ('medicine', 'water', 'checkup', 'custom')),
      title       TEXT NOT NULL,
      description TEXT,
      time        TEXT NOT NULL,
      days        TEXT,
      repeat      BOOLEAN DEFAULT 1,
      enabled     BOOLEAN DEFAULT 1,
      extra_data  TEXT,
      created_at  DATETIME DEFAULT (datetime('now', 'localtime')),
      updated_at  DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- ============================
    -- Reminder logs table
    -- ============================
    CREATE TABLE IF NOT EXISTS reminder_logs (
      id           TEXT PRIMARY KEY,
      reminder_id  TEXT NOT NULL,
      user_id      TEXT NOT NULL,
      triggered_at DATETIME DEFAULT (datetime('now', 'localtime')),
      confirmed    BOOLEAN DEFAULT 0,
      confirmed_at DATETIME,
      FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- ============================
    -- Emergency contacts table
    -- ============================
    CREATE TABLE IF NOT EXISTS emergency_contacts (
      id           TEXT PRIMARY KEY,
      user_id      TEXT NOT NULL,
      name         TEXT NOT NULL,
      relationship TEXT NOT NULL,
      phone        TEXT NOT NULL,
      priority     INTEGER DEFAULT 0,
      created_at   DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- ============================
    -- Emergency events table
    -- ============================
    CREATE TABLE IF NOT EXISTS emergency_events (
      id               TEXT PRIMARY KEY,
      user_id          TEXT NOT NULL,
      trigger_keyword  TEXT NOT NULL,
      user_description TEXT,
      risk_level       TEXT NOT NULL CHECK(risk_level IN ('low', 'medium', 'high', 'critical')),
      action_taken     TEXT,
      context          TEXT,
      resolved         BOOLEAN DEFAULT 0,
      created_at       DATETIME DEFAULT (datetime('now', 'localtime')),
      resolved_at      DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- ============================
    -- User preferences table
    -- ============================
    CREATE TABLE IF NOT EXISTS user_preferences (
      id           TEXT PRIMARY KEY,
      user_id      TEXT NOT NULL UNIQUE,
      voice_speed  REAL DEFAULT 0.9,
      voice_volume REAL DEFAULT 1.0,
      font_size    TEXT DEFAULT 'xlarge',
      interests    TEXT,
      updated_at   DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- ============================
    -- Health profiles table
    -- ============================
    CREATE TABLE IF NOT EXISTS health_profiles (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL UNIQUE,
      conditions  TEXT,
      medications TEXT,
      allergies   TEXT,
      updated_at  DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // ============================
  // Create indexes
  // ============================
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_conversations_user_id
      ON conversations(user_id);

    CREATE INDEX IF NOT EXISTS idx_conversations_started_at
      ON conversations(started_at);

    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
      ON messages(conversation_id);

    CREATE INDEX IF NOT EXISTS idx_messages_user_id
      ON messages(user_id);

    CREATE INDEX IF NOT EXISTS idx_messages_created_at
      ON messages(created_at);

    CREATE INDEX IF NOT EXISTS idx_reminders_user_id
      ON reminders(user_id);

    CREATE INDEX IF NOT EXISTS idx_reminders_enabled
      ON reminders(enabled);

    CREATE INDEX IF NOT EXISTS idx_reminders_time
      ON reminders(time);

    CREATE INDEX IF NOT EXISTS idx_reminder_logs_reminder_id
      ON reminder_logs(reminder_id);

    CREATE INDEX IF NOT EXISTS idx_reminder_logs_user_id
      ON reminder_logs(user_id);

    CREATE INDEX IF NOT EXISTS idx_reminder_logs_triggered_at
      ON reminder_logs(triggered_at);

    CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id
      ON emergency_contacts(user_id);

    CREATE INDEX IF NOT EXISTS idx_emergency_events_user_id
      ON emergency_events(user_id);

    CREATE INDEX IF NOT EXISTS idx_emergency_events_created_at
      ON emergency_events(created_at);

    CREATE INDEX IF NOT EXISTS idx_emergency_events_resolved
      ON emergency_events(resolved);

    CREATE INDEX IF NOT EXISTS idx_users_family_code
      ON users(family_code);
  `);

  logger.info('Database initialized successfully');
}

/**
 * Close the database connection gracefully.
 */
export function closeDatabase(): void {
  try {
    db.close();
    logger.info('Database connection closed');
  } catch (err) {
    logger.error('Error closing database:', err);
  }
}

export default db;
