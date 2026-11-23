'use strict';
// Gufata backup y'amakuru:   npm run backup
// Ikora kopi yuzuye kandi itekanye ya gsm.sqlite (ishobora gukorwa seriveri ikora), ikayibika muri "backups/",
// ikagumana 14 za nyuma. Iyo kopi ni yo mubika ahandi (urugero kuri mudasobwa yanyu cyangwa kuri Google Drive).
require('./env').loadEnv();
const fs = require('node:fs');
const path = require('node:path');
const { db } = require('./db');

const dbFile = path.resolve(process.env.DB_PATH || path.join(__dirname, 'data', 'gsm.sqlite'));
const dir = process.env.BACKUP_DIR || path.join(path.dirname(dbFile), 'backups');
fs.mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
const out = path.join(dir, `gsm-${stamp}.sqlite`);
if (fs.existsSync(out)) fs.unlinkSync(out);
db.exec(`VACUUM INTO '${out.replace(/'/g, "''")}'`);
const keep = 14;
const all = fs.readdirSync(dir).filter((f) => /^gsm-.*\.sqlite$/.test(f)).sort();
for (const f of all.slice(0, Math.max(0, all.length - keep))) fs.unlinkSync(path.join(dir, f));
console.log(`Backup yakozwe: ${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB). Backups zibitswe: ${Math.min(all.length, keep)}.`);
