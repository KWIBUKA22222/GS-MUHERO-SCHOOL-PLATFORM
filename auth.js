'use strict';
const crypto = require('node:crypto');
const { db, now, audit, tx } = require('./db');

const hashPassword = (pw) => {
  const salt = crypto.randomBytes(16);
  return salt.toString('hex') + ':' + crypto.scryptSync(pw, salt, 64).toString('hex');
};
const checkPassword = (pw, stored) => {
  const [s, h] = String(stored).split(':');
  if (!s || !h) return false;
  const a = crypto.scryptSync(pw, Buffer.from(s, 'hex'), 64), b = Buffer.from(h, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const DUMMY = hashPassword('dummy-password-for-timing');
const tempPassword = () => {
  const al = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.randomBytes(10), (b) => al[b % al.length]).join('');
};
const normPhone = (p) => {
  if (!p) return null;
  let s = String(p).replace(/[\s\-().]/g, '');
  if (/^0\d{9}$/.test(s)) s = '+25' + s;
  else if (/^250\d{9}$/.test(s)) s = '+' + s;
  return /^\+\d{10,15}$/.test(s) ? s : null;
};
const normEmail = (e) => (e && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(e).trim()) ? String(e).trim().toLowerCase() : null);

function createUser({ role, name, email, phone, password, codes = [], noCodes = false }, actorId = null) {
  name = String(name || '').trim().slice(0, 80);
  if (!name) throw new HttpError(400, 'name_required');
  email = normEmail(email); phone = normPhone(phone);
  if (!email && !phone) throw new HttpError(400, 'contact_required');
  if (role === 'parent' && !phone) throw new HttpError(400, 'parent_phone_required');
  const pw = password || tempPassword();
  if (pw.length < 8) throw new HttpError(400, 'password_short');
  return tx(() => {
    let id;
    try {
      id = Number(db.prepare('INSERT INTO users(role,name,email,phone,password_hash,must_change,created_at) VALUES(?,?,?,?,?,?,?)')
        .run(role, name, email, phone, hashPassword(pw), password ? 0 : 1, now()).lastInsertRowid);
    } catch (e) { if (/UNIQUE/.test(String(e.message))) throw new HttpError(409, 'user_exists'); throw e; }
    if (role === 'parent') {
      if (!codes.length && !noCodes) throw new HttpError(400, 'codes_required');
      for (const c of codes) {
        const st = db.prepare('SELECT id FROM students WHERE code=? AND active=1').get(String(c).trim().toUpperCase());
        if (!st) throw new HttpError(400, 'unknown_student_code:' + c);
        db.prepare('INSERT OR IGNORE INTO parent_student(parent_id,student_id) VALUES(?,?)').run(id, st.id);
      }
    }
    audit(actorId, 'user_create', `${role}#${id}`);
    return { id, tempPassword: password ? null : pw };
  });
}

class HttpError extends Error { constructor(status, code) { super(code); this.status = status; this.code = code; } }

const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const SESSION_MS = 7 * 24 * 3600 * 1000;
function newSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(sha(token), userId, Date.now() + SESSION_MS);
  return token;
}
function userFromToken(token) {
  if (!token) return null;
  const row = db.prepare(`SELECT u.id,u.role,u.name,u.email,u.phone,u.must_change,u.active,s.expires_at
    FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?`).get(sha(token));
  if (!row || row.expires_at < Date.now() || !row.active) return null;
  return row;
}
const endSession = (token) => token && db.prepare('DELETE FROM sessions WHERE token_hash=?').run(sha(token));
const endAllSessions = (userId) => db.prepare('DELETE FROM sessions WHERE user_id=?').run(userId);

module.exports = { hashPassword, checkPassword, DUMMY, tempPassword, normPhone, normEmail, createUser, HttpError, newSession, userFromToken, endSession, endAllSessions, SESSION_MS };
