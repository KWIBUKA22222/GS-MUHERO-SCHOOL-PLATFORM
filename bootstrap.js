'use strict';
// Gukora konti ya mbere y'ubuyobozi ubwayo iyo seriveri itangiye bwa mbere (nta shell isabwa kuri hosting).
require('./env').loadEnv();
const { db } = require('./db');
const A = require('./auth');

function ensureAdmin(log = console) {
  if (db.prepare("SELECT 1 FROM users WHERE role='admin'").get()) return false;
  const email = process.env.ADMIN_EMAIL, pw = process.env.ADMIN_PASSWORD;
  if (!email || !pw) { log.warn("Nta konti y'ubuyobozi iriho. Shyiraho ADMIN_EMAIL na ADMIN_PASSWORD kugira ngo ikorwe."); return false; }
  if (pw.length < 12) { log.warn('ADMIN_PASSWORD igomba kuba nibura inyuguti 12.'); return false; }
  A.createUser({ role: 'admin', name: process.env.ADMIN_NAME || 'Umuyobozi', email, password: pw });
  log.log(`Konti y'ubuyobozi yakozwe: ${email}. Mukureho ADMIN_PASSWORD mu bihindura (environment) nyuma yo kwinjira.`);
  return true;
}
module.exports = { ensureAdmin };
