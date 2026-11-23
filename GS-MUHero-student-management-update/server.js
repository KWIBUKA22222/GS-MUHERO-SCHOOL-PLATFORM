'use strict';
require('./env').loadEnv();
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { URL } = require('node:url');
const { db, now, audit } = require('./db');
const A = require('./auth');
const { ensureAdmin } = require('./bootstrap');
const { sendSMS } = require('./sms');

const PORT = Number(process.env.PORT || 3000);
const PUBLIC = path.join(__dirname, 'public');
const COOKIE = 'gsm_session';
const COOKIE_SECURE = process.env.COOKIE_SECURE === '1';
const MAX_BODY = 1024 * 1024;

// Attendance table: added safely for existing SQLite databases too.
db.exec(`CREATE TABLE IF NOT EXISTS attendance(
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  attendance_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('present','absent','late','excused')),
  note TEXT NOT NULL DEFAULT '',
  recorded_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  UNIQUE(student_id, attendance_date)
)`);

function cookieOptions(token, maxAge) {
  return `${COOKIE}=${token || ''}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${COOKIE_SECURE ? '; Secure' : ''}`;
}
function getToken(req) {
  const raw = req.headers.cookie || '';
  const item = raw.split(';').map(x => x.trim()).find(x => x.startsWith(COOKIE + '='));
  return item ? decodeURIComponent(item.slice(COOKIE.length + 1)) : '';
}
function send(res, status, data, headers = {}) {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': typeof data === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}
function fail(res, status, code) { send(res, status, { error: code }); }
async function body(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY) throw Object.assign(new Error('body_too_large'), { status: 413 });
  }
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw Object.assign(new Error('invalid_json'), { status: 400 }); }
}
function requireUser(req, res) {
  const user = A.userFromToken(getToken(req));
  if (!user) { fail(res, 401, 'login_required'); return null; }
  return user;
}
function allow(user, roles) { return roles.includes(user.role); }
function count(sql, ...args) { return Number((db.prepare(sql).get(...args) || {}).n || 0); }
function safeUser(u) {
  return { id: u.id, role: u.role, name: u.name, email: u.email, phone: u.phone, must_change: u.must_change };
}
function dashboard(user) {
  const students = count('SELECT COUNT(*) n FROM students WHERE active=1');
  const teachers = count("SELECT COUNT(*) n FROM users WHERE role='teacher' AND active=1");
  const parents = count("SELECT COUNT(*) n FROM users WHERE role='parent' AND active=1");
  const recent = db.prepare(`SELECT a.action,a.detail,a.created_at,u.name AS actor
    FROM audit a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 8`).all();
  const combinations = db.prepare(`SELECT combination,COUNT(*) AS total FROM students WHERE active=1 GROUP BY combination ORDER BY combination`).all();
  const notices = db.prepare(`SELECT id,title,body,audience,created_at FROM announcements
    WHERE audience='all' OR audience=? ORDER BY id DESC LIMIT 5`).all(user.role === 'parent' ? 'parents' : user.role === 'teacher' ? 'teachers' : 'all');
  return { totals: { students, teachers, parents }, combinations, recent, announcements: notices };
}
function staticFile(req, res, pathname) {
  const route = pathname === '/' ? 'index.html' : pathname.slice(1);
  const target = path.resolve(PUBLIC, route);
  if (!target.startsWith(PUBLIC + path.sep) && target !== path.join(PUBLIC, 'index.html')) return fail(res, 403, 'forbidden');
  fs.stat(target, (err, stat) => {
    if (err || !stat.isFile()) return fail(res, 404, 'not_found');
    const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml' };
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'X-Content-Type-Options':'nosniff' });
    fs.createReadStream(target).pipe(res);
  });
}

async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const p = url.pathname;
  if (req.method === 'GET' && p === '/healthz') return send(res, 200, { ok: true });
  if (req.method === 'GET' && p.startsWith('/api/')) {
    if (p === '/api/me') {
      const u = A.userFromToken(getToken(req));
      return send(res, 200, { user: u ? safeUser(u) : null });
    }
  }

  if (req.method === 'POST' && p === '/api/login') {
    const b = await body(req);
    const login = String(b.login || '').trim();
    const phoneLogin = A.normPhone(login) || login;
    const user = db.prepare(`SELECT * FROM users WHERE lower(email)=lower(?) OR phone=? LIMIT 1`).get(login, phoneLogin);
    if (!user || !user.active || !A.checkPassword(String(b.password || ''), user.password_hash)) return fail(res, 401, 'invalid_credentials');
    const token = A.newSession(user.id);
    audit(user.id, 'login', 'Yinjiye muri system');
    return send(res, 200, { user: safeUser(user) }, { 'Set-Cookie': cookieOptions(token, Math.floor(A.SESSION_MS / 1000)) });
  }
  if (req.method === 'POST' && p === '/api/logout') {
    A.endSession(getToken(req));
    return send(res, 200, { ok: true }, { 'Set-Cookie': cookieOptions('', 0) });
  }
  if (req.method === 'POST' && p === '/api/register-parent') {
    const b = await body(req);
    const name = String(b.name || '').trim();
    const phone = A.normPhone(b.phone);
    const email = A.normEmail(b.email);
    if (!name || !phone || !String(b.password || '') || String(b.password).length < 8) return fail(res, 400, 'invalid_registration');
    try {
      const result = A.createUser({ role:'parent', name, phone, email, password:String(b.password), noCodes:true });
      db.prepare('INSERT INTO registration_requests(name,phone,email,child_name,child_code,relation,user_id,status,created_at) VALUES(?,?,?,?,?,?,?,?,?)')
        .run(name, phone, email, String(b.child_name || 'Ntabwo yatanzwe'), String(b.child_code || '').toUpperCase(), String(b.relation || ''), result.id, 'pending', now());
      return send(res, 201, { ok:true, message:'Konti yakozwe. Ubuyobozi bugomba kwemeza ihuzwa n umwana.' });
    } catch (e) { return fail(res, e.status || 400, e.code || 'registration_failed'); }
  }

  if (p.startsWith('/api/')) {
    const user = requireUser(req, res);
    if (!user) return;
    if (req.method === 'GET' && p === '/api/dashboard') return send(res, 200, dashboard(user));

    if (req.method === 'GET' && p === '/api/students') {
      if (!allow(user, ['admin','teacher'])) return fail(res, 403, 'forbidden');
      const q = String(url.searchParams.get('q') || '').slice(0, 80);
      const rows = db.prepare(`SELECT id,code,name,combination,class_name,active,created_at FROM students
        WHERE (?='' OR code LIKE ? OR name LIKE ? OR class_name LIKE ?)
        ORDER BY id DESC LIMIT 300`).all(q, `%${q}%`, `%${q}%`, `%${q}%`);
      return send(res, 200, { students: rows });
    }
    if (req.method === 'POST' && p === '/api/students') {
      if (!allow(user, ['admin'])) return fail(res, 403, 'forbidden');
      const b = await body(req);
      const name = String(b.name || '').trim().slice(0,100);
      const combination = String(b.combination || '').toUpperCase();
      const className = String(b.class_name || '').trim().slice(0,40);
      if (!name || !['MEG','HEGL','MCB','PCB'].includes(combination)) return fail(res, 400, 'invalid_student');
      const code = String(b.code || `GSM-${String(count('SELECT COUNT(*) n FROM students') + 1).padStart(4,'0')}`).toUpperCase();
      try {
        const result = db.prepare('INSERT INTO students(code,name,combination,class_name,parent_phone,created_at) VALUES(?,?,?,?,?,?)')
          .run(code, name, combination, className, A.normPhone(b.parent_phone), now());
        audit(user.id, 'student_create', `${code} ${name}`);
        return send(res, 201, { id:Number(result.lastInsertRowid), code });
      } catch (e) { return fail(res, 409, 'student_code_exists_or_invalid'); }
    }
    if (req.method === 'PUT' && /^\/api\/students\/\d+$/.test(p)) {
      if (!allow(user, ['admin'])) return fail(res, 403, 'forbidden');
      const id = Number(p.split('/').pop()), b = await body(req);
      const name = String(b.name || '').trim().slice(0,100);
      const combination = String(b.combination || '').toUpperCase();
      const className = String(b.class_name || '').trim().slice(0,40);
      if (!name || !['MEG','HEGL','MCB','PCB'].includes(combination)) return fail(res, 400, 'invalid_student');
      const result = db.prepare('UPDATE students SET name=?,combination=?,class_name=?,parent_phone=? WHERE id=?')
        .run(name, combination, className, A.normPhone(b.parent_phone), id);
      if (!result.changes) return fail(res, 404, 'student_not_found');
      audit(user.id, 'student_update', `student#${id} ${name}`);
      return send(res, 200, { ok:true });
    }
    if (req.method === 'PATCH' && /^\/api\/students\/\d+$/.test(p)) {
      if (!allow(user, ['admin'])) return fail(res, 403, 'forbidden');
      const id = Number(p.split('/').pop()), b = await body(req);
      const active = b.active === false ? 0 : 1;
      const result = db.prepare('UPDATE students SET active=? WHERE id=?').run(active, id);
      if (!result.changes) return fail(res, 404, 'student_not_found');
      audit(user.id, 'student_status', `student#${id} active=${active}`);
      return send(res, 200, { ok:true, active:!!active });
    }
    if (req.method === 'GET' && p === '/api/announcements') {
      const rows = user.role === 'admin'
        ? db.prepare('SELECT id,title,body,audience,created_at FROM announcements ORDER BY id DESC LIMIT 50').all()
        : db.prepare("SELECT id,title,body,audience,created_at FROM announcements WHERE audience IN ('all',?) ORDER BY id DESC LIMIT 50").all(user.role === 'parent' ? 'parents' : 'teachers');
      return send(res, 200, { announcements: rows });
    }
    if (req.method === 'POST' && p === '/api/announcements') {
      if (!allow(user, ['admin'])) return fail(res, 403, 'forbidden');
      const b = await body(req), title = String(b.title || '').trim().slice(0,120), text = String(b.body || '').trim().slice(0,3000);
      const audience = ['all','parents','teachers'].includes(b.audience) ? b.audience : 'all';
      if (!title || !text) return fail(res, 400, 'announcement_required');
      const result = db.prepare('INSERT INTO announcements(title,body,audience,created_by,created_at) VALUES(?,?,?,?,?)').run(title,text,audience,user.id,now());
      audit(user.id, 'announcement_create', title);
      return send(res, 201, { id:Number(result.lastInsertRowid) });
    }
    if (req.method === 'GET' && p === '/api/parent/children') {
      if (user.role !== 'parent') return fail(res, 403, 'forbidden');
      const rows = db.prepare(`SELECT s.id,s.code,s.name,s.combination,s.class_name FROM students s
        JOIN parent_student ps ON ps.student_id=s.id WHERE ps.parent_id=? AND s.active=1`).all(user.id);
      return send(res, 200, { children: rows });
    }
    if (req.method === 'GET' && /^\/api\/parent\/child\/\d+$/.test(p)) {
      if (user.role !== 'parent') return fail(res, 403, 'forbidden');
      const studentId = Number(p.split('/').pop());
      const child = db.prepare(`SELECT s.id,s.code,s.name,s.combination,s.class_name
        FROM students s JOIN parent_student ps ON ps.student_id=s.id
        WHERE ps.parent_id=? AND ps.student_id=? AND s.active=1`).get(user.id, studentId);
      if (!child) return fail(res, 404, 'child_not_found');
      const results = db.prepare('SELECT term,subject,score,max,created_at FROM results WHERE student_id=? ORDER BY id DESC LIMIT 100').all(studentId);
      const conduct = db.prepare('SELECT term,category,points,note,created_at FROM conduct WHERE student_id=? ORDER BY id DESC LIMIT 100').all(studentId);
      const attendance = db.prepare('SELECT attendance_date,status,note FROM attendance WHERE student_id=? ORDER BY attendance_date DESC LIMIT 90').all(studentId);
      const attendanceSummary = db.prepare(`SELECT COUNT(*) total,
        SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) present,
        SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) absent,
        SUM(CASE WHEN status='late' THEN 1 ELSE 0 END) late,
        SUM(CASE WHEN status='excused' THEN 1 ELSE 0 END) excused
        FROM attendance WHERE student_id=?`).get(studentId);
      return send(res, 200, { child, results, conduct, attendance, attendanceSummary });
    }
    if (req.method === 'GET' && p === '/api/parent/sms') {
      if (user.role !== 'parent') return fail(res, 403, 'forbidden');
      const phones = [user.phone].filter(Boolean);
      const children = db.prepare('SELECT s.parent_phone FROM students s JOIN parent_student ps ON ps.student_id=s.id WHERE ps.parent_id=?').all(user.id);
      for (const c of children) if (c.parent_phone && !phones.includes(c.parent_phone)) phones.push(c.parent_phone);
      if (!phones.length) return send(res, 200, { messages: [] });
      const placeholders = phones.map(() => '?').join(',');
      const messages = db.prepare(`SELECT to_phone,message,status,response,created_at FROM sms_outbox WHERE to_phone IN (${placeholders}) ORDER BY id DESC LIMIT 50`).all(...phones);
      return send(res, 200, { messages });
    }
    if (req.method === 'POST' && p === '/api/attendance') {
      if (!allow(user, ['admin','teacher'])) return fail(res, 403, 'forbidden');
      const b = await body(req);
      const studentId = Number(b.student_id);
      const date = String(b.attendance_date || '').slice(0,10);
      const status = String(b.status || '');
      if (!Number.isInteger(studentId) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !['present','absent','late','excused'].includes(status)) return fail(res, 400, 'invalid_attendance');
      const student = db.prepare('SELECT id FROM students WHERE id=?').get(studentId);
      if (!student) return fail(res, 404, 'student_not_found');
      db.prepare(`INSERT INTO attendance(student_id,attendance_date,status,note,recorded_by,created_at)
        VALUES(?,?,?,?,?,?) ON CONFLICT(student_id,attendance_date) DO UPDATE SET status=excluded.status,note=excluded.note,recorded_by=excluded.recorded_by,created_at=excluded.created_at`)
        .run(studentId,date,status,String(b.note || '').slice(0,300),user.id,now());
      audit(user.id,'attendance_record',`student#${studentId} ${date} ${status}`);
      return send(res,200,{ok:true});
    }
    if (req.method === 'GET' && p === '/api/admin/summary') {
      if (user.role !== 'admin') return fail(res, 403, 'forbidden');
      return send(res, 200, {
        pendingRegistrations: count("SELECT COUNT(*) n FROM registration_requests WHERE status='pending'"),
        newAdmissions: count("SELECT COUNT(*) n FROM admission_requests WHERE status='new'"),
        smsQueued: count("SELECT COUNT(*) n FROM sms_outbox WHERE status IN ('queued_demo','sent')"),
        auditCount: count('SELECT COUNT(*) n FROM audit')
      });
    }
    if (req.method === 'POST' && p === '/api/admin/sms') {
      if (user.role !== 'admin') return fail(res, 403, 'forbidden');
      const b = await body(req);
      try { const result = await sendSMS(b.phone, b.message); audit(user.id, 'sms_send', String(b.phone)); return send(res, 200, result); }
      catch (e) { return fail(res, 400, 'sms_failed'); }
    }
    return fail(res, 404, 'api_not_found');
  }
  if (req.method === 'GET' || req.method === 'HEAD') return staticFile(req, res, p);
  return fail(res, 405, 'method_not_allowed');
}

ensureAdmin();
const server = http.createServer((req, res) => {
  Promise.resolve(handler(req, res)).catch((err) => {
    console.error(err);
    if (!res.headersSent) fail(res, err.status || 500, err.message === 'invalid_json' ? 'invalid_json' : 'server_error');
    else res.destroy();
  });
});
server.listen(PORT, '0.0.0.0', () => console.log(`GS MUHERO SCHOOL PLATFORM iri kuri http://localhost:${PORT}`));
function shutdown() {
  server.close(() => { try { db.close(); } finally { process.exit(0); } });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
