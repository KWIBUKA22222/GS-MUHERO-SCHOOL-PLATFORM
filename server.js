'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
require('./env').loadEnv();
const { db, now, setting, setSetting, audit, tx } = require('./db');
const A = require('./auth');
const sms = require('./sms');
const { ensureAdmin } = require('./bootstrap');
const { HttpError } = A;

const PORT = Number(process.env.PORT) || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const SECURE = process.env.COOKIE_SECURE === '1';
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
const PUBLIC = path.join(__dirname, 'public');

const CATS = [
  { k: 'late', p: 1 }, { k: 'absent', p: 2 }, { k: 'prep', p: 2 }, { k: 'uniform', p: 1 }, { k: 'dorm', p: 2 },
  { k: 'clean', p: 1 }, { k: 'phone', p: 3 }, { k: 'noise', p: 2 }, { k: 'leave', p: 4 }, { k: 'fight', p: 5 },
];
const COMBOS = ['MEG', 'HEGL', 'MCB', 'PCB'];
const MAX_CONDUCT = 40;
const term = () => setting('current_term', '2026-T3');

// ---------- helpers ----------
const send = (res, code, obj) => {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
};
const readBody = (req, max = 100_000) => new Promise((resolve, reject) => {
  let n = 0; const chunks = [];
  req.on('data', (c) => { n += c.length; if (n > max) { reject(new HttpError(413, 'too_large')); req.destroy(); } else chunks.push(c); });
  req.on('end', () => {
    if (!chunks.length) return resolve({});
    try { const o = JSON.parse(Buffer.concat(chunks).toString('utf8')); resolve(o && typeof o === 'object' ? o : {}); }
    catch { reject(new HttpError(400, 'bad_json')); }
  });
  req.on('error', reject);
});
const cookies = (req) => Object.fromEntries((req.headers.cookie || '').split(';').map((s) => s.trim().split(/=(.*)/s).slice(0, 2)).filter((x) => x[0]));
const ip = (req) => (TRUST_PROXY && req.headers['x-forwarded-for'] ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : req.socket.remoteAddress) || '?';
const str = (v, max = 200) => String(v ?? '').trim().slice(0, max);
const int = (v) => (Number.isInteger(Number(v)) ? Number(v) : NaN);

const attempts = new Map();
function throttle(key) {
  const t = Date.now(), a = attempts.get(key) || { n: 0, t };
  if (t - a.t > 10 * 60 * 1000) { a.n = 0; a.t = t; }
  a.n++; attempts.set(key, a);
  if (a.n > 8) throw new HttpError(429, 'too_many_attempts');
}
setInterval(() => { const t = Date.now(); for (const [k, a] of attempts) if (t - a.t > 600000) attempts.delete(k); db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(t); }, 600000).unref();

const score = (studentId, t = term()) =>
  Math.max(0, MAX_CONDUCT - db.prepare('SELECT COALESCE(SUM(points),0) s FROM conduct WHERE student_id=? AND term=?').get(studentId, t).s);

function childData(st, parentId) {
  const t = term();
  const records = db.prepare(`SELECT c.id,c.category,c.points,c.note,c.created_at,u.name AS by_name,
      NOT EXISTS(SELECT 1 FROM conduct_reads r WHERE r.conduct_id=c.id AND r.parent_id=?) AS unread
    FROM conduct c JOIN users u ON u.id=c.recorded_by WHERE c.student_id=? AND c.term=? ORDER BY c.id DESC LIMIT 50`).all(parentId, st.id, t);
  const results = db.prepare('SELECT term,subject,score,max FROM results WHERE student_id=? ORDER BY term DESC, subject').all(st.id);
  return { id: st.id, code: st.code, name: st.name, combination: st.combination, class_name: st.class_name, term: t, score: score(st.id, t), max: MAX_CONDUCT, records, results };
}
const linked = (parentId, studentId) => !!db.prepare('SELECT 1 FROM parent_student WHERE parent_id=? AND student_id=?').get(parentId, studentId);
const nextCode = () => {
  const n = db.prepare("SELECT COALESCE(MAX(CAST(SUBSTR(code,5) AS INTEGER)),0)+1 n FROM students").get().n;
  return 'GSM-' + String(n).padStart(4, '0');
};

// ---------- routes ----------
const R = [];
const route = (method, pattern, roles, fn, opts = {}) => R.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), roles, fn, max: opts.max });

route('POST', '/api/login', null, async ({ req, body, res }) => {
  const idf = str(body.identifier, 120).toLowerCase(), pw = str(body.password, 200);
  throttle(ip(req) + '|' + idf);
  const phone = A.normPhone(idf);
  const u = idf.includes('@') ? db.prepare('SELECT * FROM users WHERE email=?').get(idf)
    : phone ? db.prepare('SELECT * FROM users WHERE phone=?').get(phone) : null;
  const ok = A.checkPassword(pw, u ? u.password_hash : A.DUMMY) && u && u.active;
  if (!ok) { audit(u?.id, 'login_fail', ip(req)); throw new HttpError(401, 'bad_credentials'); }
  const token = A.newSession(u.id);
  res.setHeader('Set-Cookie', `sid=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${A.SESSION_MS / 1000}${SECURE ? '; Secure' : ''}`);
  audit(u.id, 'login', ip(req));
  return { ok: true };
});
route('POST', '/api/logout', 'any', async ({ req, res }) => {
  A.endSession(cookies(req).sid);
  res.setHeader('Set-Cookie', `sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${SECURE ? '; Secure' : ''}`);
  return { ok: true };
});
route('GET', '/api/me', 'any', async ({ user }) => ({
  user: { id: user.id, role: user.role, name: user.name, must_change: !!user.must_change },
  pending_link: user.role === 'parent' && !!db.prepare("SELECT 1 FROM registration_requests WHERE user_id=? AND status='pending'").get(user.id),
  term: term(), cats: CATS, combos: COMBOS, max: MAX_CONDUCT,
}));
route('POST', '/api/password', 'any', async ({ user, body, req }) => {
  const cur = str(body.current, 200), nw = str(body.password, 200);
  const row = db.prepare('SELECT password_hash FROM users WHERE id=?').get(user.id);
  if (!A.checkPassword(cur, row.password_hash)) throw new HttpError(403, 'bad_current');
  if (nw.length < 8) throw new HttpError(400, 'password_short');
  db.prepare('UPDATE users SET password_hash=?, must_change=0 WHERE id=?').run(A.hashPassword(nw), user.id);
  const keep = cookies(req).sid;
  A.endAllSessions(user.id);
  audit(user.id, 'password_change');
  return { ok: true, relogin: true, keep: !!keep };
});
route('GET', '/api/announcements', 'any', async ({ user }) => {
  const aud = user.role === 'admin' ? ['all', 'parents', 'teachers'] : user.role === 'parent' ? ['all', 'parents'] : ['all', 'teachers'];
  return db.prepare(`SELECT a.id,a.title,a.body,a.audience,a.created_at,u.name AS by_name FROM announcements a JOIN users u ON u.id=a.created_by
    WHERE a.audience IN (${aud.map(() => '?').join(',')}) ORDER BY a.id DESC LIMIT 30`).all(...aud);
});

// parent
route('GET', '/api/children', ['parent'], async ({ user }) =>
  db.prepare('SELECT s.* FROM students s JOIN parent_student p ON p.student_id=s.id WHERE p.parent_id=? AND s.active=1 ORDER BY s.name').all(user.id).map((s) => childData(s, user.id)));
route('POST', '/api/children/:id/read', ['parent'], async ({ user, params }) => {
  const id = int(params.id);
  if (!linked(user.id, id)) throw new HttpError(404, 'not_found');
  db.prepare('INSERT OR IGNORE INTO conduct_reads(parent_id,conduct_id) SELECT ?, id FROM conduct WHERE student_id=?').run(user.id, id);
  return { ok: true };
});

// teacher + admin
route('GET', '/api/students', ['teacher', 'admin'], async () =>
  db.prepare('SELECT id,code,name,combination,class_name FROM students WHERE active=1 ORDER BY name').all().map((s) => ({ ...s, score: score(s.id) })));
route('POST', '/api/conduct', ['teacher', 'admin'], async ({ user, body }) => {
  const sid = int(body.student_id), cat = str(body.category, 20), pts = int(body.points), note = str(body.note, 160);
  const st = db.prepare('SELECT * FROM students WHERE id=? AND active=1').get(sid);
  if (!st) throw new HttpError(404, 'student_not_found');
  if (!CATS.some((c) => c.k === cat)) throw new HttpError(400, 'bad_category');
  if (!(pts >= 1 && pts <= MAX_CONDUCT)) throw new HttpError(400, 'bad_points');
  const id = Number(db.prepare('INSERT INTO conduct(student_id,term,category,points,note,recorded_by,created_at) VALUES(?,?,?,?,?,?,?)')
    .run(sid, term(), cat, pts, note, user.id, now()).lastInsertRowid);
  audit(user.id, 'conduct_add', `#${id} student#${sid} -${pts} ${cat}`);
  // SMS ya vuba ku babyeyi: nta mazina y'ikosa, gusa kubabwira kwinjira ku konti.
  const first = st.name.split(' ')[0];
  for (const p of db.prepare('SELECT u.phone FROM users u JOIN parent_student ps ON ps.parent_id=u.id WHERE ps.student_id=? AND u.active=1 AND u.phone IS NOT NULL').all(sid))
    sms.send(p.phone, `GS Muhero: hari amanota y'imyitwarire yahindutse kuri ${first}. Injira urebe: ${BASE_URL}`).catch(() => {});
  return { id, score: score(sid) };
});
route('DELETE', '/api/conduct/:id', ['teacher', 'admin'], async ({ user, params }) => {
  const c = db.prepare('SELECT * FROM conduct WHERE id=?').get(int(params.id));
  if (!c) throw new HttpError(404, 'not_found');
  const fresh = Date.now() - Date.parse(c.created_at) < 24 * 3600 * 1000;
  if (user.role !== 'admin' && !(c.recorded_by === user.id && fresh)) throw new HttpError(403, 'forbidden');
  db.prepare('DELETE FROM conduct WHERE id=?').run(c.id);
  audit(user.id, 'conduct_delete', `#${c.id}`);
  return { ok: true };
});
route('GET', '/api/conduct/recent', ['teacher', 'admin'], async () =>
  db.prepare(`SELECT c.id,c.category,c.points,c.note,c.created_at,s.name AS student,s.code,u.name AS by_name FROM conduct c
    JOIN students s ON s.id=c.student_id JOIN users u ON u.id=c.recorded_by WHERE c.term=? ORDER BY c.id DESC LIMIT 30`).all(term()));
route('POST', '/api/results', ['teacher', 'admin'], async ({ user, body }) => {
  const sid = int(body.student_id), t = str(body.term || term(), 20), subj = str(body.subject, 60), sc = Number(body.score), mx = Number(body.max);
  if (!db.prepare('SELECT 1 FROM students WHERE id=?').get(sid)) throw new HttpError(404, 'student_not_found');
  if (!subj || !(mx > 0 && mx <= 1000) || !(sc >= 0 && sc <= mx)) throw new HttpError(400, 'bad_result');
  db.prepare(`INSERT INTO results(student_id,term,subject,score,max,recorded_by,created_at) VALUES(?,?,?,?,?,?,?)
    ON CONFLICT(student_id,term,subject) DO UPDATE SET score=excluded.score,max=excluded.max,recorded_by=excluded.recorded_by,created_at=excluded.created_at`)
    .run(sid, t, subj, sc, mx, user.id, now());
  audit(user.id, 'result_set', `student#${sid} ${t} ${subj}`);
  return { ok: true };
});

// admin
route('POST', '/api/admin/students', ['admin'], async ({ user, body }) => {
  const name = str(body.name, 80), combo = str(body.combination, 10), cls = str(body.class_name, 30), pphone = body.parent_phone ? A.normPhone(body.parent_phone) : null;
  if (!name || !COMBOS.includes(combo)) throw new HttpError(400, 'bad_student');
  if (body.parent_phone && !pphone) throw new HttpError(400, 'bad_phone');
  const code = nextCode();
  const id = Number(db.prepare('INSERT INTO students(code,name,combination,class_name,parent_phone,created_at) VALUES(?,?,?,?,?,?)').run(code, name, combo, cls, pphone, now()).lastInsertRowid);
  audit(user.id, 'student_add', `${code}`);
  return { id, code };
});
route('GET', '/api/admin/users', ['admin'], async () =>
  db.prepare('SELECT id,role,name,email,phone,active,must_change,created_at FROM users ORDER BY role, name').all().map((u) => ({
    ...u, children: u.role === 'parent' ? db.prepare('SELECT s.code,s.name FROM students s JOIN parent_student p ON p.student_id=s.id WHERE p.parent_id=?').all(u.id) : [] })));
route('POST', '/api/admin/users', ['admin'], async ({ user, body }) => {
  const role = str(body.role, 10);
  if (!['teacher', 'parent', 'admin'].includes(role)) throw new HttpError(400, 'bad_role');
  const codes = String(body.codes || '').split(/[\s,;]+/).filter(Boolean);
  return A.createUser({ role, name: body.name, email: body.email, phone: body.phone, codes }, user.id);
});
route('POST', '/api/admin/users/:id/reset', ['admin'], async ({ user, params }) => {
  const id = int(params.id);
  if (!db.prepare('SELECT 1 FROM users WHERE id=?').get(id)) throw new HttpError(404, 'not_found');
  const pw = A.tempPassword();
  db.prepare('UPDATE users SET password_hash=?, must_change=1 WHERE id=?').run(A.hashPassword(pw), id);
  A.endAllSessions(id); audit(user.id, 'password_reset', `user#${id}`);
  return { tempPassword: pw };
});
route('POST', '/api/admin/users/:id/active', ['admin'], async ({ user, params, body }) => {
  const id = int(params.id);
  if (id === user.id) throw new HttpError(400, 'cannot_self');
  db.prepare('UPDATE users SET active=? WHERE id=?').run(body.active ? 1 : 0, id);
  if (!body.active) A.endAllSessions(id);
  audit(user.id, 'user_active', `user#${id}=${body.active ? 1 : 0}`);
  return { ok: true };
});
route('POST', '/api/admin/parents/:id/link', ['admin'], async ({ user, params, body }) => {
  const id = int(params.id), st = db.prepare('SELECT id FROM students WHERE code=?').get(str(body.code, 20).toUpperCase());
  if (!st || !db.prepare("SELECT 1 FROM users WHERE id=? AND role='parent'").get(id)) throw new HttpError(404, 'not_found');
  db.prepare('INSERT OR IGNORE INTO parent_student(parent_id,student_id) VALUES(?,?)').run(id, st.id);
  audit(user.id, 'link', `parent#${id} student#${st.id}`);
  return { ok: true };
});
route('POST', '/api/admin/announcements', ['admin'], async ({ user, body }) => {
  const title = str(body.title, 120), text = str(body.body, 2000), aud = str(body.audience, 10);
  if (!title || !text || !['all', 'parents', 'teachers'].includes(aud)) throw new HttpError(400, 'bad_announcement');
  const id = Number(db.prepare('INSERT INTO announcements(title,body,audience,created_by,created_at) VALUES(?,?,?,?,?)').run(title, text, aud, user.id, now()).lastInsertRowid);
  audit(user.id, 'announce', `#${id}`);
  return { id };
});
route('POST', '/api/admin/term', ['admin'], async ({ user, body }) => {
  const t = str(body.term, 20);
  if (!/^\d{4}-T[1-3]$/.test(t)) throw new HttpError(400, 'bad_term');
  setSetting('current_term', t); audit(user.id, 'term', t);
  return { term: t };
});
route('GET', '/api/admin/sms', ['admin'], async () => db.prepare('SELECT id,to_phone,message,status,created_at FROM sms_outbox ORDER BY id DESC LIMIT 50').all());
route('GET', '/api/admin/audit', ['admin'], async () =>
  db.prepare('SELECT a.id,a.action,a.detail,a.created_at,u.name FROM audit a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 60').all());

// Kwiyandikisha kw'ababyeyi: buri wese ashobora kwiyandikisha, konti ikorwa ako kanya.
// Guhuza n'umwana: byikora gusa iyo kode y'umwana na telefoni y'umubyeyi bihura n'iri mu bitabo by'ishuri;
// ahandi ubuyobozi bugomba kubyemeza (nta muntu ubona umwana atemejwe).
route('POST', '/api/register', null, async ({ req, res, body }) => {
  if (str(body.website)) return { ok: true }; // honeypot: ibikoresho bya robo
  throttle('reg|' + ip(req));
  const name = str(body.name, 80), phone = A.normPhone(body.phone), email = A.normEmail(body.email), pw = str(body.password, 200),
    child = str(body.child_name, 80), code = str(body.child_code, 20).toUpperCase(), rel = str(body.relation, 30);
  if (!name || !child) throw new HttpError(400, 'bad_request');
  if (!phone) throw new HttpError(400, 'bad_phone');
  if (pw.length < 8) throw new HttpError(400, 'password_short');
  const u = A.createUser({ role: 'parent', name, phone, email, password: pw, noCodes: true });
  const st = code ? db.prepare('SELECT id, parent_phone FROM students WHERE code=? AND active=1').get(code) : null;
  let linked = false;
  if (st && st.parent_phone && st.parent_phone === phone) {
    db.prepare('INSERT OR IGNORE INTO parent_student(parent_id,student_id) VALUES(?,?)').run(u.id, st.id);
    audit(u.id, 'auto_link', `student#${st.id}`); linked = true;
  } else {
    db.prepare('INSERT INTO registration_requests(name,phone,email,child_name,child_code,relation,created_at,user_id) VALUES(?,?,?,?,?,?,?,?)').run(name, phone, email, child, code, rel, now(), u.id);
    audit(u.id, 'link_request', code || child);
  }
  const token = A.newSession(u.id);
  res.setHeader('Set-Cookie', `sid=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${A.SESSION_MS / 1000}${SECURE ? '; Secure' : ''}`);
  return { ok: true, linked };
});
route('GET', '/api/admin/requests', ['admin'], async () =>
  db.prepare("SELECT * FROM registration_requests ORDER BY (status='pending') DESC, id DESC LIMIT 60").all());
route('POST', '/api/admin/requests/:id/approve', ['admin'], async ({ user, params, body }) => {
  const r = db.prepare("SELECT * FROM registration_requests WHERE id=? AND status='pending'").get(int(params.id));
  if (!r) throw new HttpError(404, 'not_found');
  const code = str(body.code, 20).toUpperCase();
  let out = { linked: true };
  if (r.user_id) {
    const st = db.prepare('SELECT id FROM students WHERE code=? AND active=1').get(code);
    if (!st) throw new HttpError(400, 'bad_code');
    db.prepare('INSERT OR IGNORE INTO parent_student(parent_id,student_id) VALUES(?,?)').run(r.user_id, st.id);
    audit(user.id, 'link_approve', `parent#${r.user_id} student#${st.id}`);
    sms.send(r.phone, `GS Muhero: umwana wawe yemejwe kuri konti yawe. Injira urebe: ${BASE_URL}`).catch(() => {});
  } else {
    out = A.createUser({ role: 'parent', name: r.name, phone: r.phone, email: r.email, codes: [code] }, user.id);
    sms.send(r.phone, `GS Muhero: konti yawe yakozwe. Injira kuri ${BASE_URL} ukoresheje iyi telefoni. Ijambobanga rya mbere: ${out.tempPassword}`).catch(() => {});
  }
  db.prepare("UPDATE registration_requests SET status='approved', handled_by=?, handled_at=? WHERE id=?").run(user.id, now(), r.id);
  return out;
});
route('POST', '/api/admin/requests/:id/reject', ['admin'], async ({ user, params }) => {
  const n = db.prepare("UPDATE registration_requests SET status='rejected', handled_by=?, handled_at=? WHERE id=? AND status='pending'").run(user.id, now(), int(params.id)).changes;
  if (!n) throw new HttpError(404, 'not_found');
  audit(user.id, 'reg_reject', `#${params.id}`);
  return { ok: true };
});

// ---------- CSV: kwinjiza no gusohora abanyeshuri ----------
function parseCSV(text) {
  text = String(text).replace(/^\uFEFF/, '');
  const first = text.split(/\r?\n/, 1)[0];
  const delim = [',', ';', '\t'].map((d) => [d, first.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = []; let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; } else field += c; }
    else if (c === '"' && field === '') inQ = true;
    else if (c === delim) { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ''));
}
const csvCell = (v) => { let x = String(v ?? ''); if (/^[=+\-@\t\r]/.test(x)) x = "'" + x; return /[",;\n\r]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; };
const HEADERS = {
  name: ['name', 'fullname', 'studentname', 'student', 'izina', 'amazina'],
  combination: ['combination', 'combo', 'ishami', 'comb'],
  class: ['class', 'classname', 'ishuri', 'klasi', 'level', 'year'],
  phone: ['parentphone', 'phone', 'parent', 'telefoni', 'tel', 'parenttelephone'],
};
function analyseStudentCSV(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) throw new HttpError(400, 'csv_empty');
  if (rows.length > 2001) throw new HttpError(400, 'csv_too_long');
  const norm = (h) => h.toLowerCase().replace(/[^a-z]/g, '');
  const idx = {};
  rows[0].forEach((h, i) => { for (const [k, names] of Object.entries(HEADERS)) if (idx[k] === undefined && names.includes(norm(h))) idx[k] = i; });
  if (idx.name === undefined || idx.combination === undefined) throw new HttpError(400, 'csv_headers');
  const have = new Set(db.prepare("SELECT LOWER(name)||'|'||LOWER(class_name)||'|'||combination AS k FROM students").all().map((r) => r.k));
  const ok = [], errors = []; let skipped = 0;
  rows.slice(1).forEach((r, n) => {
    const line = n + 2, get = (k) => (idx[k] === undefined ? '' : String(r[idx[k]] ?? '').trim());
    const name = get('name').slice(0, 80), combo = get('combination').toUpperCase(), cls = get('class').slice(0, 30), raw = get('phone'), phone = raw ? A.normPhone(raw) : null;
    if (!name) return errors.push({ line, msg: 'name' });
    if (!COMBOS.includes(combo)) return errors.push({ line, msg: 'combination', value: combo.slice(0, 20) });
    if (raw && !phone) return errors.push({ line, msg: 'phone', value: raw.slice(0, 20) });
    const key = name.toLowerCase() + '|' + cls.toLowerCase() + '|' + combo;
    if (have.has(key)) { skipped++; return; }
    have.add(key); ok.push({ name, combination: combo, class_name: cls, parent_phone: phone });
  });
  return { ok, errors, skipped, total: rows.length - 1 };
}
route('POST', '/api/admin/students/import', ['admin'], async ({ user, body }) => {
  const a = analyseStudentCSV(String(body.csv || ''));
  if (body.dry) return { dry: true, ready: a.ok.length, skipped: a.skipped, errors: a.errors.slice(0, 30), error_count: a.errors.length, total: a.total, sample: a.ok.slice(0, 5).map((r) => ({ name: r.name, combination: r.combination, class_name: r.class_name, has_phone: !!r.parent_phone })) };
  if (!a.ok.length) throw new HttpError(400, 'csv_nothing');
  const codes = tx(() => a.ok.map((r) => {
    const code = nextCode();
    db.prepare('INSERT INTO students(code,name,combination,class_name,parent_phone,created_at) VALUES(?,?,?,?,?,?)').run(code, r.name, r.combination, r.class_name, r.parent_phone, now());
    return code;
  }));
  audit(user.id, 'students_import', `${codes.length} (${codes[0]}..${codes[codes.length - 1]})`);
  return { created: codes.length, skipped: a.skipped, errors: a.errors.slice(0, 30), error_count: a.errors.length, first_code: codes[0], last_code: codes[codes.length - 1] };
}, { max: 600_000 });
route('GET', '/api/admin/students.csv', ['admin'], async () => {
  const rows = db.prepare('SELECT code,name,combination,class_name FROM students WHERE active=1 ORDER BY code').all();
  const body = '\uFEFFcode,name,combination,class\r\n' + rows.map((r) => [r.code, r.name, r.combination, r.class_name].map(csvCell).join(',')).join('\r\n') + '\r\n';
  return { __raw: { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="abanyeshuri.csv"' }, body } };
});
route('GET', '/api/admin/students-template.csv', ['admin'], async () => ({ __raw: { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="abanyeshuri-urugero.csv"' },
  body: '\uFEFFname,combination,class,parent_phone\r\nUwase Aline,MCB,S5 MCB,0788123456\r\nMugisha Eric,MEG,S4 MEG,\r\n' } }));

// ---------- ijambobanga ryibagiranye (kode ya SMS) ----------
const resetHash = (uid, code) => crypto.createHash('sha256').update(`${uid}:${code}`).digest('hex');
function userForReset(idf) {
  idf = String(idf || '').trim().toLowerCase();
  const phone = A.normPhone(idf);
  const u = idf.includes('@') ? db.prepare('SELECT * FROM users WHERE email=?').get(A.normEmail(idf) || '') : phone ? db.prepare('SELECT * FROM users WHERE phone=?').get(phone) : null;
  return u && u.active && ['parent', 'teacher'].includes(u.role) && u.phone ? u : null; // ubuyobozi bukoresha undi muyobozi
}
route('POST', '/api/forgot', null, async ({ req, body }) => {
  throttle('forgot|' + ip(req));
  const u = userForReset(body.identifier);
  if (u) {
    const recent = db.prepare('SELECT COUNT(*) n FROM password_resets WHERE user_id=? AND created_at > ?').get(u.id, Date.now() - 3600_000).n;
    if (recent < 3) {
      const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
      db.prepare('UPDATE password_resets SET used=1 WHERE user_id=?').run(u.id);
      db.prepare('INSERT INTO password_resets(user_id,code_hash,expires_at,created_at) VALUES(?,?,?,?)').run(u.id, resetHash(u.id, code), Date.now() + 10 * 60_000, Date.now());
      audit(u.id, 'reset_code_sent');
      sms.send(u.phone, `GS Muhero: kode yo guhindura ijambobanga ni ${code}. Imara iminota 10. Niba atari wowe wayisabye, ntukayitange.`, 'GS Muhero: kode yo guhindura ijambobanga (ntibikwa hano)').catch(() => {});
    }
  }
  return { ok: true }; // igisubizo kimwe buri gihe: ntibivuga niba konti ibaho
});
route('POST', '/api/reset-password', null, async ({ req, body }) => {
  const idf = String(body.identifier || '').trim().toLowerCase(), code = str(body.code, 12), pw = str(body.password, 200);
  throttle('reset|' + ip(req) + '|' + idf);
  if (pw.length < 8) throw new HttpError(400, 'password_short');
  const u = userForReset(idf);
  const row = u && db.prepare('SELECT * FROM password_resets WHERE user_id=? AND used=0 AND expires_at > ? ORDER BY id DESC LIMIT 1').get(u.id, Date.now());
  if (!row || row.attempts >= 5) throw new HttpError(400, 'bad_code');
  const a = Buffer.from(row.code_hash, 'hex'), b = Buffer.from(resetHash(u.id, code), 'hex');
  if (!(a.length === b.length && crypto.timingSafeEqual(a, b))) {
    db.prepare('UPDATE password_resets SET attempts=attempts+1 WHERE id=?').run(row.id);
    throw new HttpError(400, 'bad_code');
  }
  db.prepare('UPDATE users SET password_hash=?, must_change=0 WHERE id=?').run(A.hashPassword(pw), u.id);
  db.prepare('UPDATE password_resets SET used=1 WHERE user_id=?').run(u.id);
  A.endAllSessions(u.id); audit(u.id, 'password_reset_by_code');
  return { ok: true };
});

// ---------- amakuru n'ibikorwa by'urubuga (ubuyobozi bwishyiramo) ----------
const CONTACT_KEYS = ['phone', 'email', 'whatsapp', 'address', 'hours'];
const validDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d)) && new Date(d + 'T00:00:00Z').toISOString().slice(0, 10) === d;
route('GET', '/api/site', null, async () => ({
  news: db.prepare("SELECT id,item_date,title_rw,title_en,body_rw,body_en FROM site_items WHERE kind='news' ORDER BY item_date DESC, id DESC LIMIT 6").all(),
  events: db.prepare("SELECT id,item_date,title_rw,title_en,body_rw,body_en FROM site_items WHERE kind='event' AND item_date >= date('now','-1 day') ORDER BY item_date ASC, id ASC LIMIT 8").all(),
  contact: Object.fromEntries(CONTACT_KEYS.map((k) => [k, setting('contact_' + k, '')])),
}));
route('GET', '/api/admin/site-items', ['admin'], async () =>
  db.prepare('SELECT id,kind,item_date,title_rw,title_en,body_rw,body_en FROM site_items ORDER BY kind, item_date DESC, id DESC LIMIT 200').all());
route('POST', '/api/admin/site-items', ['admin'], async ({ user, body }) => {
  const kind = str(body.kind, 10), d = str(body.date, 10), trw = str(body.title_rw, 120), ten = str(body.title_en, 120), brw = str(body.body_rw, 1000), ben = str(body.body_en, 1000);
  if (!['news', 'event'].includes(kind)) throw new HttpError(400, 'bad_item');
  if (!validDate(d)) throw new HttpError(400, 'bad_date');
  if (!trw) throw new HttpError(400, 'title_required');
  const id = Number(db.prepare('INSERT INTO site_items(kind,item_date,title_rw,title_en,body_rw,body_en,created_by,created_at) VALUES(?,?,?,?,?,?,?,?)').run(kind, d, trw, ten, brw, ben, user.id, now()).lastInsertRowid);
  audit(user.id, 'site_item_add', `${kind}#${id}`);
  return { id };
});
route('DELETE', '/api/admin/site-items/:id', ['admin'], async ({ user, params }) => {
  const n = db.prepare('DELETE FROM site_items WHERE id=?').run(int(params.id)).changes;
  if (!n) throw new HttpError(404, 'not_found');
  audit(user.id, 'site_item_delete', `#${params.id}`);
  return { ok: true };
});
route('POST', '/api/admin/site-contact', ['admin'], async ({ user, body }) => {
  const phone = str(body.phone, 40), email = body.email ? A.normEmail(body.email) : '', wa = body.whatsapp ? A.normPhone(body.whatsapp) : '', addr = str(body.address, 160), hours = str(body.hours, 160);
  if (phone && !/^[0-9+()\s-]{6,40}$/.test(phone)) throw new HttpError(400, 'bad_phone');
  if (body.email && !email) throw new HttpError(400, 'bad_email');
  if (body.whatsapp && !wa) throw new HttpError(400, 'bad_phone');
  setSetting('contact_phone', phone); setSetting('contact_email', email || ''); setSetting('contact_whatsapp', wa || ''); setSetting('contact_address', addr); setSetting('contact_hours', hours);
  audit(user.id, 'site_contact');
  return { ok: true };
});

// ---------- gusaba kwiga (admission): ifishi ya buri wese, ubuyobozi bureba ubusabe ----------
route('POST', '/api/admission', null, async ({ req, body }) => {
  if (str(body.website)) return { ok: true }; // honeypot
  throttle('adm|' + ip(req));
  const student = str(body.student_name, 80), parent = str(body.parent_name, 80), phone = A.normPhone(body.phone), email = body.email ? A.normEmail(body.email) : null;
  const combo = str(body.combination, 10), prev = str(body.previous_school, 100), gender = str(body.gender, 10), msg = str(body.message, 500);
  if (!student || !parent) throw new HttpError(400, 'bad_request');
  if (!phone) throw new HttpError(400, 'bad_phone');
  if (body.email && !email) throw new HttpError(400, 'bad_email');
  if (combo && !COMBOS.includes(combo)) throw new HttpError(400, 'bad_combination');
  if (!['', 'Male', 'Female'].includes(gender)) throw new HttpError(400, 'bad_request');
  const year = body.birth_year === undefined || body.birth_year === '' ? null : int(body.birth_year), thisYear = new Date().getFullYear();
  if (year !== null && !(year >= thisYear - 30 && year <= thisYear - 8)) throw new HttpError(400, 'bad_year');
  if (!body.consent) throw new HttpError(400, 'consent_required');
  const dup = db.prepare("SELECT id FROM admission_requests WHERE phone=? AND lower(student_name)=lower(?) AND created_at > ?").get(phone, student, new Date(Date.now() - 30 * 86400_000).toISOString());
  if (dup) return { ok: true, ref: 'ADM-' + String(dup.id).padStart(4, '0') }; // nta SMS ya kabiri
  const id = Number(db.prepare('INSERT INTO admission_requests(student_name,birth_year,gender,combination,previous_school,parent_name,phone,email,message,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)')
    .run(student, year, gender, combo, prev, parent, phone, email, msg, now()).lastInsertRowid);
  const ref = 'ADM-' + String(id).padStart(4, '0');
  audit(null, 'admission_new', ref);
  sms.send(phone, `GS Muhero: twakiriye ubusabe bwo kwiga bwa ${student.split(' ')[0]}. Kode: ${ref}. Ubuyobozi buzabavugisha.`).catch(() => {});
  return { ok: true, ref };
});
route('GET', '/api/admin/admissions', ['admin'], async () =>
  db.prepare("SELECT * FROM admission_requests ORDER BY (status='new') DESC, id DESC LIMIT 200").all().map((r) => ({ ...r, ref: 'ADM-' + String(r.id).padStart(4, '0') })));
route('POST', '/api/admin/admissions/:id/status', ['admin'], async ({ user, params, body }) => {
  const st = str(body.status, 12);
  if (!['new', 'contacted', 'accepted', 'declined'].includes(st)) throw new HttpError(400, 'bad_status');
  const n = db.prepare('UPDATE admission_requests SET status=?, handled_by=?, handled_at=? WHERE id=?').run(st, user.id, now(), int(params.id)).changes;
  if (!n) throw new HttpError(404, 'not_found');
  audit(user.id, 'admission_status', `#${params.id}=${st}`);
  return { ok: true };
});

// ---------- static ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
function serveStatic(req, res, pathname) {
  let rel = pathname === '/' ? '/index.html' : pathname;
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
}
const SEC = {
  'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'DENY',
  ...(SECURE ? { 'Strict-Transport-Security': 'max-age=31536000' } : {}),
};

const server = http.createServer(async (req, res) => {
  for (const [k, v] of Object.entries(SEC)) res.setHeader(k, v);
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname === '/healthz') { db.prepare('SELECT 1').get(); return send(res, 200, { ok: true }); }
    if (!url.pathname.startsWith('/api/')) {
      if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'method');
      const p = decodeURIComponent(url.pathname);
      const go = (loc) => { res.writeHead(302, { Location: loc, 'Cache-Control': 'no-store' }); res.end(); };
      if (p === '/admission') { res.setHeader('Cache-Control', 'no-store'); return serveStatic(req, res, '/index.html'); }
      if (['/', '/portal', '/register', '/login', '/site', '/site.html'].includes(p)) {
        const user = A.userFromToken(cookies(req).sid);
        res.setHeader('Cache-Control', 'no-store');
        if (p === '/site' || p === '/site.html') return go('/');
        // "/" ni urubuga rw'ikigo, rubonwa na buri wese (utinjiye cyangwa uwinjiye).
        if (p === '/') return user && user.must_change ? go('/portal') : serveStatic(req, res, '/site.html');
        // "/register" na "/login": uwamaze kwinjira asubizwa ku rubuga.
        if (p === '/register' || p === '/login') return user ? go(user.must_change ? '/portal' : '/') : serveStatic(req, res, '/index.html');
        return serveStatic(req, res, '/index.html'); // /portal
      }
      return serveStatic(req, res, p);
    }
    if (req.method !== 'GET' && req.headers['x-requested-with'] !== 'fetch') throw new HttpError(403, 'csrf');
    // Backup: ubuyobozi bukuramo kopi y'ububiko bwose (dosiye ya SQLite)
    if (req.method === 'GET' && url.pathname === '/api/admin/backup') {
      const u = A.userFromToken(cookies(req).sid);
      if (!u) throw new HttpError(401, 'login_required');
      if (u.role !== 'admin' || u.must_change) throw new HttpError(403, 'forbidden');
      const tmp = path.join(os.tmpdir(), `gsm-backup-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.sqlite`);
      db.exec(`VACUUM INTO '${tmp.replace(/'/g, "''")}'`);
      audit(u.id, 'backup_download');
      res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="gsm-backup-${new Date().toISOString().slice(0, 10)}.sqlite"`, 'Cache-Control': 'no-store' });
      const stream = fs.createReadStream(tmp); const clean = () => fs.unlink(tmp, () => {});
      stream.on('close', clean); res.on('close', clean); stream.pipe(res);
      return;
    }
    for (const r of R) {
      if (r.method !== req.method) continue;
      const m = r.re.exec(url.pathname);
      if (!m) continue;
      let user = null;
      if (r.roles) {
        user = A.userFromToken(cookies(req).sid);
        if (!user) throw new HttpError(401, 'login_required');
        if (r.roles !== 'any' && !r.roles.includes(user.role)) throw new HttpError(403, 'forbidden');
        if (user.must_change && !['/api/password', '/api/logout', '/api/me'].includes(url.pathname)) throw new HttpError(403, 'must_change_password');
      }
      const body = req.method === 'GET' || req.method === 'DELETE' ? {} : await readBody(req, r.max);
      const out = await r.fn({ req, res, user, params: m.groups || {}, body, url });
      if (out && out.__raw) { res.writeHead(200, { 'Cache-Control': 'no-store', ...out.__raw.headers }); return res.end(out.__raw.body); }
      return send(res, 200, out);
    }
    throw new HttpError(404, 'not_found');
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.code });
    console.error(e); send(res, 500, { error: 'server_error' });
  }
});

if (require.main === module) {
  ensureAdmin();
  server.listen(PORT, () => console.log(`GS Muhero platform: ${BASE_URL} (port ${PORT}), SMS=${process.env.SMS_PROVIDER || 'console'}`));
  // Gufunga neza iyo hosting itangiye seriveri nshya (ntihabeho gutakaza amakuru)
  process.on('SIGTERM', () => {
    server.close(() => { try { db.close(); } catch {} process.exit(0); });
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
module.exports = { server };
