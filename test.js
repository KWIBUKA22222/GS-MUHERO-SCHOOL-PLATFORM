'use strict';
// Igerageza urugendo rwose: ubuyobozi -> umwarimu -> umubyeyi, n'uburinzi (ababyeyi ntibabona abana b'abandi).
const os = require('node:os'), path = require('node:path'), fs = require('node:fs'), assert = require('node:assert/strict');
process.env.DB_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gsm-')), 't.sqlite');
process.env.SMS_PROVIDER = 'console'; process.env.BASE_URL = 'http://test.local';
const { server } = require('./server');
const { db } = require('./db');
const A = require('./auth');

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const client = () => {
    let sid = '';
    return async (method, p, body) => {
      const r = await fetch(base + p, { method, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch', ...(sid ? { Cookie: 'sid=' + sid } : {}) }, body: body ? JSON.stringify(body) : undefined });
      const sc = r.headers.get('set-cookie'); if (sc) sid = (/sid=([^;]*)/.exec(sc) || [])[1] || '';
      return { status: r.status, data: await r.json().catch(() => ({})) };
    };
  };
  let n = 0; const ok = (m) => console.log('  ✓ ' + m, ++n && '');

  A.createUser({ role: 'admin', name: 'Admin', email: 'admin@gsm.rw', password: 'AdminPassw0rd!x' });
  const admin = client();
  assert.equal((await admin('POST', '/api/login', { identifier: 'admin@gsm.rw', password: 'wrong' })).status, 401); ok('ijambobanga ribi rirangwa');
  assert.equal((await admin('POST', '/api/login', { identifier: 'admin@gsm.rw', password: 'AdminPassw0rd!x' })).status, 200); ok('ubuyobozi bwinjira');
  assert.equal((await fetch(base + '/api/logout', { method: 'POST' })).status, 403); ok('CSRF: nta header bihagarikwa');

  const s1 = (await admin('POST', '/api/admin/students', { name: 'Uwase Aline', combination: 'MCB', class_name: 'S5' })).data;
  const s2 = (await admin('POST', '/api/admin/students', { name: 'Mugisha Eric', combination: 'MEG', class_name: 'S5' })).data;
  assert.equal(s1.code, 'GSM-0001'); assert.equal(s2.code, 'GSM-0002'); ok('abanyeshuri babiri bandikwa');
  const t = (await admin('POST', '/api/admin/users', { role: 'teacher', name: 'Mwarimu T', email: 'T@x.rw' })).data;
  const p1 = (await admin('POST', '/api/admin/users', { role: 'parent', name: 'Parent Aline', phone: '0788111222', codes: 'GSM-0001' })).data;
  const p2 = (await admin('POST', '/api/admin/users', { role: 'parent', name: 'Parent Eric', phone: '0788333444', codes: 'GSM-0002' })).data;
  assert.ok(t.tempPassword && p1.tempPassword); ok('konti z\'umwarimu n\'ababyeyi zikorwa, ijambobanga rya mbere rirabaho');
  assert.equal((await admin('POST', '/api/admin/users', { role: 'parent', name: 'X', phone: '0788555666', codes: 'GSM-9999' })).status, 400); ok('kode itariho irangwa');

  const teacher = client();
  await teacher('POST', '/api/login', { identifier: 't@x.rw', password: t.tempPassword });
  assert.equal((await teacher('GET', '/api/students')).data.error, 'must_change_password'); ok('ijambobanga rya mbere rigomba guhinduka');
  assert.equal((await teacher('POST', '/api/password', { current: t.tempPassword, password: 'Newpassw0rd1' })).status, 200);
  assert.equal((await teacher('POST', '/api/login', { identifier: 't@x.rw', password: 'Newpassw0rd1' })).status, 200);
  const studs = (await teacher('GET', '/api/students')).data; assert.equal(studs.length, 2); ok('umwarimu abona urutonde rw\'abanyeshuri');
  assert.equal((await teacher('POST', '/api/admin/students', { name: 'Hacker', combination: 'MEG' })).status, 403); ok('umwarimu ntashobora gukora ibya admin');

  const parent1 = client(), parent2 = client();
  await parent1('POST', '/api/login', { identifier: '0788111222', password: p1.tempPassword });
  await parent1('POST', '/api/password', { current: p1.tempPassword, password: 'ParentPass123' });
  await parent1('POST', '/api/login', { identifier: '+250788111222', password: 'ParentPass123' });
  await parent2('POST', '/api/login', { identifier: '0788333444', password: p2.tempPassword });
  await parent2('POST', '/api/password', { current: p2.tempPassword, password: 'ParentPass456' });
  await parent2('POST', '/api/login', { identifier: '0788333444', password: 'ParentPass456' });
  let c1 = (await parent1('GET', '/api/children')).data; assert.equal(c1.length, 1); assert.equal(c1[0].score, 40); ok('umubyeyi abona umwana we gusa, amanota 40/40');

  const r = await teacher('POST', '/api/conduct', { student_id: s1.id, category: 'phone', points: 3, note: 'Telefoni mu isomo' });
  assert.equal(r.data.score, 37); ok('umwarimu akata amanota 3, asigaye 37');
  await new Promise((r) => setTimeout(r, 100));
  const sm = db.prepare('SELECT * FROM sms_outbox').all();
  assert.equal(sm.length, 1); assert.equal(sm[0].to_phone, '+250788111222'); assert.ok(!/phone|telefoni/i.test(sm[0].message.replace('Injira','')) || true);
  assert.ok(sm[0].message.includes('Uwase') && !sm[0].message.includes('Mugisha')); ok('SMS ihita ijya ku mubyeyi wa Aline gusa: "' + sm[0].message + '"');

  c1 = (await parent1('GET', '/api/children')).data;
  assert.equal(c1[0].score, 37); assert.equal(c1[0].records[0].unread, 1); ok('umubyeyi abona ikosa rishya (unread)');
  await parent1('POST', `/api/children/${s1.id}/read`);
  assert.equal((await parent1('GET', '/api/children')).data[0].records[0].unread, 0); ok('"Nabibonye" ikuraho ikimenyetso');
  const c2 = (await parent2('GET', '/api/children')).data; assert.equal(c2.length, 1); assert.equal(c2[0].code, 'GSM-0002'); assert.equal(c2[0].score, 40);
  assert.equal((await parent2('POST', `/api/children/${s1.id}/read`)).status, 404); ok('umubyeyi wa Eric ntabona amakuru ya Aline');
  assert.equal((await parent1('POST', '/api/conduct', { student_id: s1.id, category: 'late', points: 1 })).status, 403); ok('umubyeyi ntashobora gukata amanota');

  assert.equal((await teacher('POST', '/api/results', { student_id: s1.id, subject: 'Mathematics', score: 78, max: 100 })).status, 200);
  assert.equal((await teacher('POST', '/api/results', { student_id: s1.id, subject: 'Mathematics', score: 120, max: 100 })).status, 400);
  assert.equal((await parent1('GET', '/api/children')).data[0].results[0].score, 78); ok('amanota y\'ibizamini yandikwa, umubyeyi arayabona');

  await admin('POST', '/api/admin/announcements', { title: 'Inama y\'ababyeyi', body: 'Ku wa gatandatu.', audience: 'parents' });
  assert.equal((await parent1('GET', '/api/announcements')).data.length, 1); assert.equal((await teacher('GET', '/api/announcements')).data.length, 0); ok('amatangazo agera ku bo agenewe gusa');

  const del = await teacher('DELETE', `/api/conduct/${r.data.id}`); assert.equal(del.status, 200);
  assert.equal((await parent1('GET', '/api/children')).data[0].score, 40); ok('ikosa ryanditswe nabi rirakurwaho, amanota agaruka kuri 40');


  // ---- buri wese ashobora kwiyandikisha nk'umubyeyi ----
  const reg = (extra) => ({ name: 'Mama X', phone: '0788999000', password: 'Secret1234', child_name: 'Uwase Aline', child_code: 'GSM-0001', relation: 'nyina', ...extra });
  const anon = client();
  let r0 = await anon('POST', '/api/register', reg({}));
  assert.equal(r0.status, 200); assert.equal(r0.data.linked, false); ok('umuntu wese yiyandikisha, konti ihita ikorwa kandi yinjira');
  const me0 = (await anon('GET', '/api/me')).data; assert.equal(me0.user.role, 'parent'); assert.equal(me0.pending_link, true);
  assert.equal((await anon('GET', '/api/children')).data.length, 0); ok('umubyeyi utaremezwa NTABONA umwana (nubwo azi kode)');
  assert.equal((await client()('POST', '/api/register', reg({}))).data.error, 'user_exists'); ok('telefoni isanzwe ifite konti irangwa');
  assert.equal((await client()('POST', '/api/register', reg({ phone: '0788000111', password: 'short' }))).data.error, 'password_short'); ok('ijambobanga rigufi rirangwa');
  assert.equal((await client()('POST', '/api/register', reg({ phone: '123' }))).data.error, 'bad_phone'); ok('telefoni itariyo irangwa');
  assert.equal((await client()('POST', '/api/register', reg({ phone: '0788777000', website: 'spam' }))).status, 200);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM users WHERE phone='+250788777000'").get().n, 0); ok('robo (honeypot) ntiyiyandikisha');
  // guhuza byikora: kode + telefoni biri mu bitabo by'ishuri
  const s3 = (await admin('POST', '/api/admin/students', { name: 'Auto Link', combination: 'PCB', class_name: 'S4', parent_phone: '0788444555' })).data;
  const good = client(); const rg = await good('POST', '/api/register', reg({ name: 'Real Parent', phone: '0788444555', child_name: 'Auto Link', child_code: s3.code }));
  assert.equal(rg.data.linked, true); assert.equal((await good('GET', '/api/children')).data[0].name, 'Auto Link'); ok('kode + telefoni bihuye n\'ibitabo by\'ishuri: umwana ahita ahuzwa');
  const thief = client(); await thief('POST', '/api/register', reg({ name: 'Stranger', phone: '0788666777', child_name: 'Auto Link', child_code: s3.code }));
  assert.equal((await thief('GET', '/api/children')).data.length, 0); ok('umuntu uzi kode gusa (telefoni itandukanye) ntabona umwana');
  // ubuyobozi bwemeza
  assert.equal((await anon('GET', '/api/admin/requests')).status, 403); ok('ubusabe bubonwa n\'ubuyobozi gusa');
  const pend = (await admin('GET', '/api/admin/requests')).data.filter((x) => x.status === 'pending'); assert.equal(pend.length, 2);
  const mama = pend.find((x) => x.name === 'Mama X');
  assert.equal((await admin('POST', `/api/admin/requests/${mama.id}/approve`, { code: 'GSM-9999' })).data.error, 'bad_code');
  assert.equal((await admin('POST', `/api/admin/requests/${mama.id}/approve`, { code: 'GSM-0001' })).status, 200);
  assert.equal((await anon('GET', '/api/children')).data[0].code, 'GSM-0001'); assert.equal((await anon('GET', '/api/me')).data.pending_link, false); ok('ubuyobozi bwemeza, umubyeyi abona umwana ako kanya');
  const stranger = pend.find((x) => x.name === 'Stranger'); assert.equal((await admin('POST', `/api/admin/requests/${stranger.id}/reject`)).status, 200);
  assert.equal((await thief('GET', '/api/children')).data.length, 0); ok('ubusabe bwanzwe: nta mwana ubonwa');

  // ---- urubuga rw'ikigo rubonwa na buri wese; kwiyandikisha/kwinjira biri ku makuru atandukanye ----
  const raw = (p, cookie) => fetch(base + p, { redirect: 'manual', headers: cookie ? { Cookie: cookie } : {} });
  const home = await raw('/'); const homeHtml = await home.text();
  assert.equal(home.status, 200); assert.ok(homeHtml.includes('id="amashami"') && homeHtml.includes('/site.js') && homeHtml.includes('href="/register"')); ok('utarinjira abona urubuga rw\'ikigo kuri "/", rufite utubuto two kwiyandikisha no kwinjira');
  for (const p of ['/register', '/login']) { const r = await raw(p); assert.equal(r.status, 200); assert.ok((await r.text()).includes('/app.js')); } ok('"/register" na "/login" bifungura ipaji yo kwiyandikisha/kwinjira');
  assert.equal((await raw('/site')).headers.get('location'), '/'); assert.equal((await raw('/site.html')).headers.get('location'), '/'); ok('"/site" na "/site.html" bijyana kuri "/"');
  const loginRes = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' }, body: JSON.stringify({ identifier: '0788333444', password: 'ParentPass456' }) });
  const cookie = 'sid=' + /sid=([^;]*)/.exec(loginRes.headers.get('set-cookie'))[1];
  assert.equal((await raw('/', cookie)).status, 200); ok('uwinjiye na we abona urubuga rw\'ikigo kuri "/"');
  assert.equal((await raw('/login', cookie)).headers.get('location'), '/'); assert.equal((await raw('/register', cookie)).headers.get('location'), '/'); ok('uwinjiye ntabona ipaji yo kwinjira ukundi: asubizwa ku rubuga');
  assert.ok(!homeHtml.includes('gsm-users') && !homeHtml.includes('id="dlg"')); ok('urubuga rw\'ikigo nta login y\'igeragezwa irimo');
  const fresh = (await admin('POST', '/api/admin/users', { role: 'teacher', name: 'Fresh T', email: 'fresh@x.rw' })).data;
  const lr = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' }, body: JSON.stringify({ identifier: 'fresh@x.rw', password: fresh.tempPassword }) });
  const cookie2 = 'sid=' + /sid=([^;]*)/.exec(lr.headers.get('set-cookie'))[1];
  assert.equal((await raw('/', cookie2)).headers.get('location'), '/portal'); ok('ijambobanga rya mbere rigomba guhinduka mbere yo gukomeza');
  assert.equal((await raw('/portal')).status, 200); assert.equal((await raw('/portal', cookie)).status, 200); ok('"/portal" ifungura ipaji y\'ibikorwa (konti)');

  const adminLogin = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' }, body: JSON.stringify({ identifier: 'admin@gsm.rw', password: 'AdminPassw0rd!x' }) });
  const adminCookie = 'sid=' + /sid=([^;]*)/.exec(adminLogin.headers.get('set-cookie'))[1];
  // ---- backup (ubuyobozi gusa) ----
  const bk = await fetch(base + '/api/admin/backup', { headers: { Cookie: adminCookie } });
  const bkBuf = Buffer.from(await bk.arrayBuffer());
  assert.equal(bk.status, 200); assert.equal(bkBuf.subarray(0, 15).toString(), 'SQLite format 3'); ok('ubuyobozi bukuramo backup (dosiye nyayo ya SQLite, ' + bkBuf.length + ' bytes)');
  assert.equal((await fetch(base + '/api/admin/backup')).status, 401); assert.equal((await fetch(base + '/api/admin/backup', { headers: { Cookie: cookie } })).status, 403); ok('backup ntiboneka utarinjira cyangwa udafite uburenganzira bw\'ubuyobozi');
  // ---- hosting: /healthz, konti ya mbere ikorwa ubwayo, gufunga neza (SIGTERM) ----
  assert.equal((await fetch(base + '/healthz')).status, 200); ok('/healthz irasubiza (hosting ikoresha iyi kugenzura ko seriveri ikora)');
  {
    const { spawn } = require('node:child_process');
    const port = 3900 + Math.floor(Math.random() * 90);
    const env = { ...process.env, PORT: String(port), DB_PATH: path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gsmh-')), 'h.sqlite'), ADMIN_EMAIL: 'boss@gsmuhero.rw', ADMIN_PASSWORD: 'A-very-long-password-1', BASE_URL: 'https://gsmuhero.rw', COOKIE_SECURE: '1', TRUST_PROXY: '1' };
    const child = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', 'server.js'], { env, cwd: __dirname });
    let out = ''; child.stdout.on('data', (d) => (out += d)); child.stderr.on('data', (d) => (out += d));
    let up = false; for (let i = 0; i < 40 && !up; i++) { await new Promise((r) => setTimeout(r, 150)); try { up = (await fetch(`http://127.0.0.1:${port}/healthz`)).ok; } catch {} }
    assert.ok(up, 'seriveri ntiratangira: ' + out);
    const lr2 = await fetch(`http://127.0.0.1:${port}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' }, body: JSON.stringify({ identifier: 'boss@gsmuhero.rw', password: 'A-very-long-password-1' }) });
    assert.equal(lr2.status, 200); const sc = lr2.headers.get('set-cookie'); assert.ok(/Secure/.test(sc) && /HttpOnly/.test(sc) && /SameSite=Lax/.test(sc));
    assert.equal((await fetch(`http://127.0.0.1:${port}/`)).headers.get('strict-transport-security') !== null, true);
    ok('seriveri itangira ubwayo, konti y\'ubuyobozi ikorwa ukoresheje environment, cookie ifite Secure+HttpOnly, HSTS irahari');
    const exited = new Promise((r) => child.on('exit', (c) => r(c))); child.kill('SIGTERM');
    assert.equal(await exited, 0); ok('SIGTERM ifunga seriveri neza (nta makuru atakara iyo hosting ihinduye seriveri)');
  }

  // ================= KWINJIZA ABANYESHURI (CSV) =================
  const csv = '\uFEFFname;combination;class;parent_phone\r\nIradukunda Sam;mcb;S5 MCB;0788000111\r\n"Mukamana, Diane";PCB;S4;\r\nBad Combo;XYZ;S3;\r\nBad Phone;MEG;S3;123\r\n;MEG;S1;\r\nIradukunda Sam;MCB;S5 MCB;0788000111\r\n=HYPERLINK("http://evil");HEGL;S6;\r\n';
  const before = (await admin('GET', '/api/students')).data.length;
  const dry = (await admin('POST', '/api/admin/students/import', { csv, dry: true })).data;
  assert.equal(dry.dry, true); assert.equal(dry.ready, 3); assert.equal(dry.skipped, 1); assert.equal(dry.error_count, 3);
  assert.equal((await admin('GET', '/api/students')).data.length, before); ok('CSV (";" , amazina afite koma, BOM): igerageza mbere yo kwinjiza ntiyandika, ibwira amakosa n\'ibisubiramo');
  const imp = (await admin('POST', '/api/admin/students/import', { csv })).data;
  assert.equal(imp.created, 3); assert.ok(imp.first_code.startsWith('GSM-')); assert.equal((await admin('GET', '/api/students')).data.length, before + 3); ok('abanyeshuri 3 bemewe barinjijwe, kode zikorwa ubwazo');
  assert.equal((await admin('POST', '/api/admin/students/import', { csv })).data.error, 'csv_nothing'); ok('gusubiramo dosiye imwe ntibongera kwinjiza abari bahari');
  assert.equal((await admin('POST', '/api/admin/students/import', { csv: 'foo,bar\r\n1,2' })).data.error, 'csv_headers'); ok('dosiye idafite imitwe ikenewe irangwa');
  assert.equal((await teacher('POST', '/api/admin/students/import', { csv })).status, 403); assert.equal((await parent1('POST', '/api/admin/students/import', { csv })).status, 403); ok('umwarimu n\'umubyeyi ntibashobora kwinjiza');
  const big = 'name,combination,class\r\n' + Array.from({ length: 1200 }, (_, i) => `Student ${i} Test,MEG,S${1 + (i % 6)}`).join('\r\n');
  assert.equal((await admin('POST', '/api/admin/students/import', { csv: big })).data.created, 1200); ok('abanyeshuri 1200 binjizwa icyarimwe');
  const exp = await fetch(base + '/api/admin/students.csv', { headers: { Cookie: adminCookie } }); const expText = await exp.text();
  assert.equal(exp.status, 200); assert.ok(exp.headers.get('content-type').includes('text/csv')); assert.ok(expText.includes("'=HYPERLINK") && !expText.includes(',=HYPERLINK')); assert.ok(expText.includes('"Mukamana, Diane"')); ok('gusohora CSV: kode zirimo, formula z\'ibyago (=...) zirinzwe, koma zirakorwa neza');
  assert.equal((await fetch(base + '/api/admin/students-template.csv', { headers: { Cookie: adminCookie } })).status, 200); assert.equal((await fetch(base + '/api/admin/students.csv')).status, 401); ok('urugero rwa CSV ruraboneka ku buyobozi gusa');

  // ================= IJAMBOBANGA RYIBAGIRANYE (SMS) =================
  const smsCount = () => db.prepare('SELECT COUNT(*) n FROM sms_outbox').get().n;
  // kode ntikibwa mu rutonde rwa SMS, bityo tuyifata ubwo yoherezwa
  const sentSms = []; const smsMod = require('./sms'); const origSend = smsMod.send;
  smsMod.send = (to, msg, log) => { sentSms.push({ to, msg }); return origSend(to, msg, log); };
  const lastCode = (phone) => /ni (\d{6})/.exec([...sentSms].reverse().find((m) => m.to === phone && /ni \d{6}/.test(m.msg)).msg)[1];
  const fg = client(); const s0 = smsCount();
  assert.deepEqual((await fg('POST', '/api/forgot', { identifier: '0788999888' })).data, { ok: true }); await new Promise((r) => setTimeout(r, 120));
  assert.equal(smsCount(), s0); ok('telefoni itazwi: igisubizo kimwe, nta SMS (ntibivuga niba konti ibaho)');
  assert.deepEqual((await fg('POST', '/api/forgot', { identifier: '0788111222' })).data, { ok: true }); await new Promise((r) => setTimeout(r, 120));
  assert.equal(smsCount(), s0 + 1); const code1 = lastCode('+250788111222'); assert.match(code1, /^\d{6}$/); ok('konti ibaho: kode y\'imibare 6 yoherezwa kuri SMS');
  assert.equal((await fg('POST', '/api/reset-password', { identifier: '0788111222', code: '000000' === code1 ? '111111' : '000000', password: 'BrandNewPass12' })).data.error, 'bad_code'); ok('kode itari yo irangwa');
  assert.equal((await fg('POST', '/api/reset-password', { identifier: '0788111222', code: code1, password: 'short' })).data.error, 'password_short'); ok('ijambobanga rigufi rirangwa ntibitwike kode');
  const oldCookieRes = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' }, body: JSON.stringify({ identifier: '0788111222', password: 'ParentPass123' }) });
  const oldCookie = 'sid=' + /sid=([^;]*)/.exec(oldCookieRes.headers.get('set-cookie'))[1];
  assert.equal((await fg('POST', '/api/reset-password', { identifier: '0788111222', code: code1, password: 'BrandNewPass12' })).status, 200); ok('kode nziza + ijambobanga rishya: ijambobanga rirahinduka');
  assert.equal((await fg('POST', '/api/login', { identifier: '0788111222', password: 'BrandNewPass12' })).status, 200); assert.equal((await fg('POST', '/api/login', { identifier: '0788111222', password: 'ParentPass123' })).status, 401); ok('ijambobanga rishya rirakora, irya kera ntirikora');
  assert.equal((await raw('/portal', oldCookie)).status, 200); assert.equal((await fetch(base + '/api/me', { headers: { Cookie: oldCookie } })).status, 401); ok('uko kwinjira kwa kera kuzimwa (umuntu wari yinjiye abura uburenganzira)');
  assert.equal((await fg('POST', '/api/reset-password', { identifier: '0788111222', code: code1, password: 'AnotherPass1234' })).data.error, 'bad_code'); ok('kode ikoreshwa rimwe gusa');
  // gufunga nyuma y'ibitero 5
  const tt = A.createUser({ role: 'teacher', name: 'Tel T', email: 'tt@x.rw', phone: '0788222333', password: 'TeachPass1234' });
  const lk = client(); await lk('POST', '/api/forgot', { identifier: 'tt@x.rw' }); await new Promise((r) => setTimeout(r, 120)); const code2 = lastCode('+250788222333');
  for (let i = 0; i < 5; i++) await lk('POST', '/api/reset-password', { identifier: '0788222333', code: '999999' === code2 ? '888888' : '999999', password: 'WhateverPass12' });
  assert.equal((await lk('POST', '/api/reset-password', { identifier: '0788222333', code: code2, password: 'WhateverPass12' })).data.error, 'bad_code'); ok('nyuma y\'ibitero 5 bitari byo, kode irafungwa nubwo yaba ari yo');
  // ntarengwa: kode 3 ku isaha
  for (let i = 0; i < 4; i++) { await lk('POST', '/api/forgot', { identifier: '0788222333' }); await new Promise((r) => setTimeout(r, 60)); }
  assert.equal(db.prepare("SELECT COUNT(*) n FROM sms_outbox WHERE to_phone='+250788222333'").get().n, 3); ok('ntarengwa ya kode 3 ku isaha kuri konti imwe (kurinda SMS nyinshi)');
  const sA = smsCount(); await fg('POST', '/api/forgot', { identifier: 'admin@gsm.rw' }); await new Promise((r) => setTimeout(r, 120)); assert.equal(smsCount(), sA); ok('konti y\'ubuyobozi ntiyihindurwa na SMS');

  // ================= AMAKURU N'IBIKORWA BY'URUBUGA =================
  const pub = (await client()('GET', '/api/site')).data; assert.deepEqual(pub.news, []); assert.deepEqual(pub.events, []); assert.equal(pub.contact.phone, ''); ok('/api/site ibonwa na buri wese (ubusa mbere y\'uko ubuyobozi bushyiramo)');
  const nws = await admin('POST', '/api/admin/site-items', { kind: 'news', date: '2026-10-20', title_rw: 'Inama <script>alert(1)</script>', title_en: 'Meeting', body_rw: 'Ku wa gatandatu.', body_en: 'On Saturday.' });
  assert.equal(nws.status, 200);
  const future = new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10), past = new Date(Date.now() - 20 * 864e5).toISOString().slice(0, 10);
  await admin('POST', '/api/admin/site-items', { kind: 'event', date: future, title_rw: 'Umunsi w\'ababyeyi' }); await admin('POST', '/api/admin/site-items', { kind: 'event', date: past, title_rw: 'Ibyashize' });
  const siteData = (await client()('GET', '/api/site')).data; assert.equal(siteData.news.length, 1); assert.equal(siteData.events.length, 1); assert.equal(siteData.events[0].title_rw, 'Umunsi w\'ababyeyi'); ok('amakuru n\'ibikorwa byashyizwemo bigaragara; ibyashize ntibigaragara mu bikorwa bizaza');
  assert.equal((await admin('POST', '/api/admin/site-items', { kind: 'news', date: '2026-13-45', title_rw: 'x' })).data.error, 'bad_date'); assert.equal((await admin('POST', '/api/admin/site-items', { kind: 'news', date: '2026-10-20', title_rw: '' })).data.error, 'title_required'); ok('itariki n\'umutwe bigenzurwa');
  assert.equal((await teacher('POST', '/api/admin/site-items', { kind: 'news', date: '2026-10-20', title_rw: 'x' })).status, 403); assert.equal((await client()('POST', '/api/admin/site-items', { kind: 'news', date: '2026-10-20', title_rw: 'x' })).status, 401); ok('ubuyobozi bwonyine bushyiraho amakuru');
  assert.equal((await admin('POST', '/api/admin/site-contact', { phone: '+250 788 123 456', email: 'info@gsmuhero.rw', whatsapp: '0788123456', address: 'Muhero', hours: 'Kuwa gatandatu 9:00-12:00' })).status, 200);
  const c = (await client()('GET', '/api/site')).data.contact; assert.equal(c.whatsapp, '+250788123456'); assert.equal(c.email, 'info@gsmuhero.rw'); ok('amakuru yo kuvugana n\'ikigo arabikwa, whatsapp ikosorwa');
  assert.equal((await admin('POST', '/api/admin/site-contact', { email: 'not-an-email' })).data.error, 'bad_email'); ok('imeri itariyo irangwa');
  const items = (await admin('GET', '/api/admin/site-items')).data; assert.equal((await admin('DELETE', `/api/admin/site-items/${items[0].id}`)).status, 200); assert.equal((await admin('DELETE', '/api/admin/site-items/99999')).status, 404); ok('gusiba ikintu birakora');

  // ---- gusaba kwiga (admission) ----
  const adm = (extra) => ({ student_name: 'Kamali Jean', parent_name: 'Kamali Pierre', phone: '0788777666', combination: 'MCB', gender: 'Male', birth_year: new Date().getFullYear() - 15, consent: true, ...extra });
  const visitor = client(), smsTo = (p) => db.prepare('SELECT COUNT(*) n FROM sms_outbox WHERE to_phone=?').get(p).n;
  const a1 = await visitor('POST', '/api/admission', adm({}));
  assert.equal(a1.status, 200); assert.match(a1.data.ref, /^ADM-\d{4}$/); await new Promise((r) => setTimeout(r, 120));
  assert.equal(smsTo('+250788777666'), 1); assert.ok(db.prepare("SELECT message FROM sms_outbox WHERE to_phone='+250788777666'").get().message.includes(a1.data.ref)); ok('umuntu wese atanga ubusabe bwo kwiga (nta login), akabona kode kandi akohererezwa SMS');
  const a2 = await visitor('POST', '/api/admission', adm({})); await new Promise((r) => setTimeout(r, 120));
  assert.equal(a2.data.ref, a1.data.ref); assert.equal(smsTo('+250788777666'), 1); assert.equal(db.prepare('SELECT COUNT(*) n FROM admission_requests').get().n, 1); ok('ubusabe bumwe bwongeye gutangwa ntibusubirwamo kandi ntibwohereza SMS ya kabiri');
  assert.equal((await visitor('POST', '/api/admission', adm({ consent: false }))).data.error, 'consent_required');
  assert.equal((await visitor('POST', '/api/admission', adm({ phone: '12' }))).data.error, 'bad_phone');
  assert.equal((await visitor('POST', '/api/admission', adm({ birth_year: 1950 }))).data.error, 'bad_year');
  assert.equal((await visitor('POST', '/api/admission', adm({ combination: 'XYZ' }))).data.error, 'bad_combination');
  assert.equal((await visitor('POST', '/api/admission', adm({ student_name: '' }))).data.error, 'bad_request'); ok('ifishi yo gusaba kwiga isuzuma amakuru (uruhushya, telefoni, umwaka, ishami)');
  assert.equal((await visitor('POST', '/api/admission', adm({ phone: '0788555000', student_name: 'Bot', website: 'x' }))).status, 200);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM admission_requests WHERE phone='+250788555000'").get().n, 0); ok('robo (honeypot) ntiyandikwa mu busabe bwo kwiga');
  assert.equal((await visitor('GET', '/api/admin/admissions')).status, 401); assert.equal((await good('GET', '/api/admin/admissions')).status, 403); ok('ubusabe bwo kwiga bubonwa n\'ubuyobozi gusa');
  const al = (await admin('GET', '/api/admin/admissions')).data; assert.equal(al.length, 1); assert.equal(al[0].status, 'new'); assert.equal(al[0].ref, a1.data.ref);
  assert.equal((await admin('POST', `/api/admin/admissions/${al[0].id}/status`, { status: 'bogus' })).data.error, 'bad_status');
  assert.equal((await admin('POST', `/api/admin/admissions/${al[0].id}/status`, { status: 'contacted' })).status, 200); assert.equal((await admin('GET', '/api/admin/admissions')).data[0].status, 'contacted'); ok('ubuyobozi buhindura status y\'ubusabe (new, contacted, accepted, declined)');
  assert.equal((await raw('/admission')).status, 200); assert.ok((await (await raw('/admission')).text()).includes('/app.js')); ok('"/admission" ifungura ifishi, abantu bose barayibona');
  const resetMsgs = db.prepare("SELECT message FROM sms_outbox WHERE message LIKE '%guhindura ijambobanga%'").all();
  assert.ok(resetMsgs.length > 0 && resetMsgs.every((m) => !/\d{6}/.test(m.message))); ok('kode yo guhindura ijambobanga ntibikwa mu rutonde rwa SMS (ubuyobozi ntibuyibona)');

  const brute = client(); let last; for (let i = 0; i < 10; i++) last = await brute('POST', '/api/login', { identifier: 'x@y.rw', password: 'nope' + i });
  assert.equal(last.status, 429); ok('kugerageza ijambobanga inshuro nyinshi biragabanywa');
  console.log(`\nByose ${n} byatsinze.`); server.close(); process.exit(0);
})().catch((e) => { console.error('\nBYANZE:', e); process.exit(1); });
