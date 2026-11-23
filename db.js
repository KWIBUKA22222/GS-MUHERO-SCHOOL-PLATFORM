'use strict';
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error(`Node.js ${process.versions.node} ni ntoya cyane. Iyi porogaramu ikeneye Node.js 22.13 cyangwa irenga (https://nodejs.org).`);
  process.exit(1);
}
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
require('./env').loadEnv();

const file = process.env.DB_PATH || path.join(__dirname, 'data', 'gsm.sqlite');
fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
const db = new DatabaseSync(file);
db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY,
  role TEXT NOT NULL CHECK(role IN ('admin','teacher','parent')),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  must_change INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions(
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS students(
  id INTEGER PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  combination TEXT NOT NULL CHECK(combination IN ('MEG','HEGL','MCB','PCB')),
  class_name TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS parent_student(
  parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  PRIMARY KEY(parent_id, student_id)
);
CREATE TABLE IF NOT EXISTS conduct(
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  term TEXT NOT NULL,
  category TEXT NOT NULL,
  points INTEGER NOT NULL CHECK(points BETWEEN 1 AND 40),
  note TEXT NOT NULL DEFAULT '',
  recorded_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS conduct_reads(
  parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conduct_id INTEGER NOT NULL REFERENCES conduct(id) ON DELETE CASCADE,
  PRIMARY KEY(parent_id, conduct_id)
);
CREATE TABLE IF NOT EXISTS results(
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  term TEXT NOT NULL,
  subject TEXT NOT NULL,
  score REAL NOT NULL,
  max REAL NOT NULL,
  recorded_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  UNIQUE(student_id, term, subject)
);
CREATE TABLE IF NOT EXISTS announcements(
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience TEXT NOT NULL CHECK(audience IN ('all','parents','teachers')),
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sms_outbox(
  id INTEGER PRIMARY KEY,
  to_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL,
  response TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit(
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS registration_requests(
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  child_name TEXT NOT NULL,
  child_code TEXT NOT NULL DEFAULT '',
  relation TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  created_at TEXT NOT NULL,
  handled_by INTEGER,
  handled_at TEXT
);
CREATE TABLE IF NOT EXISTS password_resets(
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  used INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS site_items(
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL CHECK(kind IN ('news','event')),
  item_date TEXT NOT NULL,
  title_rw TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  body_rw TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admission_requests(
  id INTEGER PRIMARY KEY,
  student_name TEXT NOT NULL, birth_year INTEGER, gender TEXT NOT NULL DEFAULT '',
  combination TEXT NOT NULL DEFAULT '', previous_school TEXT NOT NULL DEFAULT '',
  parent_name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','accepted','declined')),
  created_at TEXT NOT NULL, handled_by INTEGER, handled_at TEXT
);
`);

// Migrations (zikora no ku bubiko busanzweho)
for (const sql of ['ALTER TABLE students ADD COLUMN parent_phone TEXT', 'ALTER TABLE registration_requests ADD COLUMN user_id INTEGER']) {
  try { db.exec(sql); } catch { /* column already exists */ }
}

const now = () => new Date().toISOString();
const setting = (k, d) => (db.prepare('SELECT value FROM settings WHERE key=?').get(k) || { value: d }).value;
const setSetting = (k, v) => db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(k, String(v));
const audit = (userId, action, detail = '') => db.prepare('INSERT INTO audit(user_id,action,detail,created_at) VALUES(?,?,?,?)').run(userId ?? null, action, String(detail).slice(0, 500), now());
const tx = (fn) => { db.exec('BEGIN'); try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; } };

module.exports = { db, now, setting, setSetting, audit, tx };
