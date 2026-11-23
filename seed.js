'use strict';
// Gukoresha:  npm run seed          -> ikora konti ya mbere y'ubuyobozi (ikoresha .env)
//             node seed.js --demo   -> inongeraho abanyeshuri, umwarimu n'umubyeyi b'igeragezwa
require('./env').loadEnv();
const { db, now } = require('./db');
const A = require('./auth');

function ensureAdmin() {
  if (db.prepare("SELECT 1 FROM users WHERE role='admin'").get()) return console.log('Konti y\'ubuyobozi irahari.');
  const email = process.env.ADMIN_EMAIL, pw = process.env.ADMIN_PASSWORD;
  if (!email || !pw || pw.length < 12) throw new Error('Shyiraho ADMIN_EMAIL na ADMIN_PASSWORD (nibura inyuguti 12) muri .env');
  A.createUser({ role: 'admin', name: process.env.ADMIN_NAME || 'Umuyobozi', email, password: pw });
  console.log('Konti y\'ubuyobozi yakozwe:', email);
}
function demo() {
  const add = (code, name, combo, cls, phone = null) => db.prepare('INSERT OR IGNORE INTO students(code,name,combination,class_name,parent_phone,created_at) VALUES(?,?,?,?,?,?)').run(code, name, combo, cls, phone, now());
  add('GSM-0001', 'Uwase Aline', 'MCB', 'S5 MCB', '+250788000001'); add('GSM-0002', 'Mugisha Eric', 'MEG', 'S5 MEG');
  add('GSM-0003', 'Ishimwe Grace', 'PCB', 'S4 PCB'); add('GSM-0004', 'Niyonzima Jean', 'HEGL', 'S6 HEGL');
  const out = [];
  if (!db.prepare("SELECT 1 FROM users WHERE role='teacher'").get()) out.push(['umwarimu', 'umwarimu@example.rw', A.createUser({ role: 'teacher', name: 'Umwarimu w\'Igeragezwa', email: 'umwarimu@example.rw' })]);
  if (!db.prepare("SELECT 1 FROM users WHERE role='parent'").get()) out.push(['umubyeyi', '0788000001', A.createUser({ role: 'parent', name: 'Umubyeyi w\'Igeragezwa', phone: '0788000001', codes: ['GSM-0001'] })]);
  for (const [r, who, c] of out) console.log(`${r}: ${who}  ijambobanga rya mbere: ${c.tempPassword}`);
}
ensureAdmin();
if (process.argv.includes('--demo')) demo();
