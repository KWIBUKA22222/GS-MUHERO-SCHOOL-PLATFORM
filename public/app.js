'use strict';
(function () {
  const L0 = (() => { try { return localStorage.getItem('gsm-lang'); } catch { return null; } })();
  let L = L0 === 'en' ? 'en' : 'rw', ME = null, META = null, tab = 'conduct', poll = null, lastSig = '';
  const T = {
    rw: {
      noacc: 'Nta konti mufite? Musabe konti', regTab: 'Iyandikishe', reqT: 'Gusaba konti y\'umubyeyi', reqP: 'Ubuyobozi buzagenzura amakuru yanyu, hanyuma bubone konti mukoreshe. Mwandike telefoni mukoresha.', yourName: 'Amazina yanyu', childName: 'Amazina y\'umwana', childCode: 'Kode y\'umwana (niba muyizi)', relation: 'Uko mumufitanye isano (se, nyina, undi)', send: 'Ohereza ubusabe', sent: 'Ubusabe bwoherejwe. Ubuyobozi buzabavugisha cyangwa bubone konti kuri telefoni yanyu.', back: 'Subira ku kwinjira', requests: 'Ubusabe bwa konti', approve: 'Emeza', reject: 'Wange', pickStu: 'Hitamo umunyeshuri', pending: 'Butegereje', approved: 'Bwemejwe', rejected: 'Bwanzwe', noreq: 'Nta busabe.',
      backupT: 'Gufata backup', backupP: 'Ikuramo dosiye y\'amakuru yose (irimo amakuru y\'abana n\'amajambobanga yahinduwe). Ibike ahantu hizewe, kandi ntukayohereze abandi.', backupBtn: 'Kuramo backup', siteLink: 'Rubuga rw\'ikigo', regTitle: 'Iyandikishe nk\'umubyeyi', regIntro: 'Buri mubyeyi ashobora kwiyandikisha. Mukore konti, mubone amanota n\'imyitwarire by\'umwana wanyu.', pwChoose: 'Ijambobanga mwihitiramo (nibura inyuguti 8)', codeHelp: 'Iyo kode n\'iyi telefoni bihuye n\'iri mu bitabo by\'ishuri, umwana ahita ahuzwa na konti yanyu. Bitabaye ibyo, ubuyobozi buzabyemeza.', createAcc: 'Kora konti', haveAcc: 'Mfite konti', pendingT: 'Konti yanyu yakozwe. Dutegereje ko ishuri ryemeza umwana wanyu. Muzamenyeshwa kuri SMS, kandi hano hazagaragara ako kanya.', parentPhoneF: 'Telefoni y\'umubyeyi (iri mu bitabo by\'ishuri, si ngombwa)', parentPhoneHelp: 'Ituma umubyeyi wiyandikishije akoresheje iyi telefoni na kode y\'umwana ahita ahuzwa.',
      forgot: 'Nibagiwe ijambobanga', forgotP: 'Andika telefoni yawe. Tuzakohereza kode ya SMS yo guhindura ijambobanga.', sendCode: 'Ohereza kode', codeSent: 'Niba iyi konti ibaho, kode yoherejwe kuri SMS. Imara iminota 10.', haveCode: 'Mfite kode', codeF: 'Kode ya SMS (imibare 6)', newPwF: 'Ijambobanga rishya (nibura inyuguti 8)', resetBtn: 'Hindura ijambobanga', resetOk: 'Ijambobanga ryahindutse. Mwinjire n\'irishya.', badResetCode: 'Kode itari yo cyangwa yararangiye. Musabe indi.',
      importT: 'Kwinjiza abanyeshuri benshi (Excel/CSV)', importHelp: 'Muri Excel: File → Save As → CSV. Imitwe: name, combination (MEG, HEGL, MCB cyangwa PCB), class, parent_phone (telefoni si ngombwa). Abasanzwe bahari basibwa.', template: 'Urugero rwa CSV', exportCsv: 'Kuramo urutonde (CSV)', csvFile: 'Hitamo dosiye ya CSV', ready: 'bemewe', skipped: 'basanzwe bahari', errorsN: 'bafite amakosa', line: 'umurongo', doImport: 'Injiza abanyeshuri', createdN: 'Abanyeshuri binjijwe',
      csvErr: { name: 'izina rirakenewe', combination: 'ishami ritazwi', phone: 'telefoni itariyo' },
      siteT: 'Urubuga: amakuru n\'ibikorwa', news: 'Amakuru', event: 'Igikorwa', date: 'Itariki', kind: 'Ubwoko', titleRw: 'Umutwe (Kinyarwanda)', titleEn: 'Title (English, si ngombwa)', bodyRw: 'Ibisobanuro (Kinyarwanda)', bodyEn: 'Details (English, si ngombwa)', addItem: 'Ongeramo', contactT: 'Amakuru yo kuvugana n\'ikigo', cPhone: 'Telefoni', cEmail: 'Imeri', cWhatsapp: 'WhatsApp', cAddress: 'Aho ikigo giherereye', cHours: 'Amasaha yo gusura', savedOk: 'Byabitswe.', siteHelp: 'Ibi bigaragara ku rubuga rw\'ikigo rubonwa na buri wese. Ntimukandike amazina y\'abana n\'amakuru y\'ibanga.',
      admissionsT: 'Ubusabe bwo kwiga', st_new: 'Bushya', st_contacted: 'Bavuganye', st_accepted: 'Bwemejwe', st_declined: 'Bwanzwe', noAdm: 'Nta busabe bwo kwiga.',
      admPubT: 'Gusaba umwanya mu ishuri', admPubP: 'Uzuza ifishi; ubuyobozi buzabavugisha. Ntimugomba kugira konti.', studentF: 'Amazina y\'umunyeshuri', birthYear: 'Umwaka yavukiyemo', genderF: 'Igitsina', male: 'Gabo', female: 'Gore', prevSchool: 'Ishuri yavuyemo', parentF: 'Amazina y\'umubyeyi / umurera', comboPref: 'Ishami ashaka', msgF: 'Ubutumwa (si ngombwa)', consentTxt: 'Nemeye ko amakuru ntanga akoreshwa mu gusuzuma ubusabe bw\'uyu munyeshuri gusa.', chooseOpt: '-- Hitamo --', admSent: 'Ubusabe bwoherejwe. Kode yanyu ni', admSent2: 'Ubuyobozi buzabavugisha kuri telefoni mwatanze.',
      brand: 'GS Muhero School', login: 'Injira', logout: 'Sohoka', ident: 'Imeri cyangwa telefoni', pw: 'Ijambobanga', hello: 'Muraho',
      first: 'Mugomba guhindura ijambobanga rya mbere', cur: 'Ijambobanga rya none', new: 'Ijambobanga rishya (nibura inyuguti 8)', conf: 'Subiramo ijambobanga rishya',
      change: 'Hindura ijambobanga', changed: 'Ijambobanga ryahindutse. Mwinjire ukundi.', mismatch: 'Amajambobanga ntahura.',
      score: 'Amanota y\'imyitwarire', of: 'kuri 40', term: 'Igihembwe', card: 'Ikarita y\'ishuri · Internat', latest: 'Ibyakaswe bya nyuma:', none: 'Nta manota yakaswe. Komereza aho!',
      newrec: 'Amanota mashya yakaswe', seen: 'Nabibonye', hist: 'Amanota yakaswe', by: 'Byanditswe na', results: 'Amanota y\'ibizamini', subject: 'Isomo', ann: 'Amatangazo', noann: 'Nta matangazo.', nokids: 'Nta mwana uhujwe n\'iyi konti. Mubaze ubuyobozi.',
      s1: 'Excellent', conduct: 'Imyitwarire', resultsT: 'Ibizamini', students: 'Abanyeshuri', users: 'Abakoresha', annT: 'Amatangazo', settings: 'Igihembwe na SMS',
      student: 'Umunyeshuri', cat: 'Impamvu', points: 'Amanota akurwaho', note: 'Ibisobanuro (si ngombwa)', deduct: 'Kata amanota', saved: 'Byanditswe.', recent: 'Aherutse gukurwaho', del: 'Kuraho',
      score_: 'Amanota', max: 'Ntarengwa', save: 'Bika', name: 'Amazina', combo: 'Ishami', cls: 'Ishuri', code: 'Kode', add: 'Ongeramo', role: 'Uruhare', phone: 'Telefoni', email: 'Imeri', codes: 'Kode z\'abana (zitandukanywe na akayiko)',
      parent: 'Umubyeyi', teacher: 'Umwarimu', admin: 'Ubuyobozi', created: 'Konti yakozwe. Ijambobanga rya mbere (rigaragara rimwe gusa, mubihe nyirayo):', reset: 'Ijambobanga rishya', disable: 'Hagarika', enable: 'Ongera', active: 'Ikora',
      titleF: 'Umutwe', body: 'Ubutumwa', aud: 'Uwo bugenewe', all: 'Bose', parents: 'Ababyeyi', teachers: 'Abarimu', publish: 'Tangaza', setTerm: 'Hindura igihembwe (urugero 2026-T3)', smsLog: 'SMS zoherejwe', audit: 'Ibyakozwe (audit)',
      st: { logged: 'yanditswe (igerageza)', sent: 'yoherejwe', failed: 'ntiyagiye', queued: 'itegereje' },
      err: { bad_credentials: 'Imeri/telefoni cyangwa ijambobanga si byo.', too_many_attempts: 'Mwagerageje kenshi. Mutegereze iminota 10.', password_short: 'Ijambobanga rigomba kugira nibura inyuguti 8.', bad_current: 'Ijambobanga rya none si ryo.', user_exists: 'Iyi meri cyangwa telefoni isanzwe ikoreshwa.', contact_required: 'Shyiramo imeri cyangwa telefoni.', parent_phone_required: 'Umubyeyi agomba kugira telefoni.', codes_required: 'Shyiramo nibura kode imwe y\'umwana.', name_required: 'Shyiramo amazina.', bad_student: 'Amazina n\'ishami birakenewe.', default: 'Hari ikitagenze neza. Mugerageze nanone.', csv_empty: 'Dosiye ni ubusa cyangwa ifite imitwe gusa.', csv_too_long: 'Dosiye ifite imirongo irenga 2000. Muyigabanye.', csv_headers: 'Imitwe ya CSV ntihuye: igomba kuba irimo "name" na "combination".', csv_nothing: 'Nta munyeshuri mushya wo kwinjiza.', bad_date: 'Itariki ntiyanditse neza.', title_required: 'Umutwe urakenewe.', bad_item: 'Ubwoko ntibwemewe.', bad_email: 'Imeri ntiyanditse neza.', consent_required: 'Mugomba kwemera ko amakuru akoreshwa.', bad_year: 'Umwaka wavukiyemo ntumeze neza.', bad_combination: 'Ishami ntiribaho.', bad_status: 'Status ntiyemewe.', too_large: 'Dosiye ni nini cyane.', bad_code: 'Kode y\'umunyeshuri ntibaho.', bad_phone: 'Telefoni ntiyanditse neza (urugero 0788123456).', already_registered: 'Iyi telefoni isanzwe ifite konti. Mukoreshe \'Injira\'.', already_requested: 'Ubusabe bwanyu bwaramaze koherezwa. Mutegereze ubuyobozi.', bad_request: 'Mwuzuze amazina yanyu n\'ay\'umwana.' },
    },
    en: {
      noacc: 'No account? Request one', regTab: 'Register', reqT: 'Request a parent account', reqP: 'The school will check your details and then set up your account. Enter the phone number you use.', yourName: 'Your name', childName: 'Child\'s name', childCode: 'Child\'s code (if you know it)', relation: 'Relationship (father, mother, other)', send: 'Send request', sent: 'Request sent. The school will contact you or set up your account on your phone.', back: 'Back to log in', requests: 'Account requests', approve: 'Approve', reject: 'Reject', pickStu: 'Choose student', pending: 'Pending', approved: 'Approved', rejected: 'Rejected', noreq: 'No requests.',
      backupT: 'Backup', backupP: 'Downloads a file with all data (including children\'s data and password hashes). Keep it somewhere safe and never share it.', backupBtn: 'Download backup', siteLink: 'School website', regTitle: 'Register as a parent', regIntro: 'Every parent can register. Create an account to see your child\'s marks and conduct.', pwChoose: 'Choose a password (at least 8 characters)', codeHelp: 'If this code and your phone match the school records, your child is linked to your account straight away. Otherwise the school office will confirm.', createAcc: 'Create account', haveAcc: 'I already have an account', pendingT: 'Your account is created. We are waiting for the school to confirm your child. You will get an SMS, and it will appear here at once.', parentPhoneF: 'Parent phone on school records (optional)', parentPhoneHelp: 'Lets a parent who registers with this phone and the child\'s code be linked automatically.',
      forgot: 'Forgot password', forgotP: 'Enter your phone number. We will send you an SMS code to reset your password.', sendCode: 'Send code', codeSent: 'If this account exists, a code was sent by SMS. It is valid for 10 minutes.', haveCode: 'I have a code', codeF: 'SMS code (6 digits)', newPwF: 'New password (at least 8 characters)', resetBtn: 'Reset password', resetOk: 'Password changed. Please log in with the new one.', badResetCode: 'Wrong or expired code. Please request a new one.',
      importT: 'Import many students (Excel/CSV)', importHelp: 'In Excel: File → Save As → CSV. Headers: name, combination (MEG, HEGL, MCB or PCB), class, parent_phone (phone is optional). Students who already exist are skipped.', template: 'CSV example', exportCsv: 'Download list (CSV)', csvFile: 'Choose a CSV file', ready: 'ready', skipped: 'already exist', errorsN: 'with errors', line: 'line', doImport: 'Import students', createdN: 'Students imported',
      csvErr: { name: 'name is required', combination: 'unknown combination', phone: 'invalid phone' },
      siteT: 'Website: news and events', news: 'News', event: 'Event', date: 'Date', kind: 'Type', titleRw: 'Title (Kinyarwanda)', titleEn: 'Title (English, optional)', bodyRw: 'Details (Kinyarwanda)', bodyEn: 'Details (English, optional)', addItem: 'Add', contactT: 'School contact details', cPhone: 'Phone', cEmail: 'Email', cWhatsapp: 'WhatsApp', cAddress: 'Location', cHours: 'Visiting hours', savedOk: 'Saved.', siteHelp: 'These appear on the public school website. Do not write students\' names or private information.',
      admissionsT: 'Admission requests', st_new: 'New', st_contacted: 'Contacted', st_accepted: 'Accepted', st_declined: 'Declined', noAdm: 'No admission requests.',
      admPubT: 'Apply for a place at the school', admPubP: 'Fill in the form and the school will contact you. You do not need an account.', studentF: 'Student\'s full name', birthYear: 'Year of birth', genderF: 'Gender', male: 'Male', female: 'Female', prevSchool: 'Previous school', parentF: 'Parent / guardian name', comboPref: 'Preferred combination', msgF: 'Message (optional)', consentTxt: 'I agree that the information I give is used only to consider this student\'s application.', chooseOpt: '-- Choose --', admSent: 'Request sent. Your reference is', admSent2: 'The school will contact you on the phone number you gave.',
      brand: 'GS Muhero School', login: 'Log in', logout: 'Log out', ident: 'Email or phone', pw: 'Password', hello: 'Hello',
      first: 'You must change your first password', cur: 'Current password', new: 'New password (at least 8 characters)', conf: 'Repeat new password',
      change: 'Change password', changed: 'Password changed. Please log in again.', mismatch: 'Passwords do not match.',
      score: 'Conduct marks', of: 'out of 40', term: 'Term', card: 'School card · Boarding', latest: 'Latest deduction:', none: 'No marks deducted. Keep it up!',
      newrec: 'New marks deducted', seen: 'I have seen it', hist: 'Deductions', by: 'Recorded by', results: 'Exam results', subject: 'Subject', ann: 'Announcements', noann: 'No announcements.', nokids: 'No child is linked to this account. Please ask the school office.',
      s1: 'Excellent', conduct: 'Conduct', resultsT: 'Exam results', students: 'Students', users: 'Users', annT: 'Announcements', settings: 'Term and SMS',
      student: 'Student', cat: 'Reason', points: 'Marks to deduct', note: 'Details (optional)', deduct: 'Deduct marks', saved: 'Recorded.', recent: 'Recent deductions', del: 'Remove',
      score_: 'Score', max: 'Out of', save: 'Save', name: 'Name', combo: 'Combination', cls: 'Class', code: 'Code', add: 'Add', role: 'Role', phone: 'Phone', email: 'Email', codes: 'Student codes (separated by spaces)',
      parent: 'Parent', teacher: 'Teacher', admin: 'Administration', created: 'Account created. First password (shown once, hand it to the owner):', reset: 'New password', disable: 'Disable', enable: 'Enable', active: 'Active',
      titleF: 'Title', body: 'Message', aud: 'Audience', all: 'Everyone', parents: 'Parents', teachers: 'Teachers', publish: 'Publish', setTerm: 'Change term (e.g. 2026-T3)', smsLog: 'SMS sent', audit: 'Activity (audit)',
      st: { logged: 'logged (test mode)', sent: 'sent', failed: 'failed', queued: 'queued' },
      err: { bad_credentials: 'Wrong email/phone or password.', too_many_attempts: 'Too many attempts. Please wait 10 minutes.', password_short: 'The password needs at least 8 characters.', bad_current: 'Current password is wrong.', user_exists: 'This email or phone is already in use.', contact_required: 'Enter an email or phone.', parent_phone_required: 'A parent needs a phone number.', codes_required: 'Enter at least one student code.', name_required: 'Enter a name.', bad_student: 'Name and combination are required.', default: 'Something went wrong. Please try again.', csv_empty: 'The file is empty or has only headers.', csv_too_long: 'The file has more than 2000 rows. Please split it.', csv_headers: 'CSV headers do not match: they must include "name" and "combination".', csv_nothing: 'There is no new student to import.', bad_date: 'The date is not valid.', title_required: 'A title is required.', bad_item: 'This type is not allowed.', bad_email: 'The email is not valid.', consent_required: 'You must agree to the use of the information.', bad_year: 'The year of birth is not valid.', bad_combination: 'This combination does not exist.', bad_status: 'This status is not allowed.', too_large: 'The file is too large.', bad_code: 'This student code does not exist.', bad_phone: 'Phone number is not valid (e.g. 0788123456).', already_registered: 'This phone already has an account. Please log in.', already_requested: 'Your request was already sent. Please wait for the school.', bad_request: 'Please fill in your name and your child\'s name.' },
    },
  };
  const CAT = {
    rw: { late: 'Gutinda', absent: 'Gusiba isomo cyangwa kwiga', prep: 'Gusiba prep (kwiga nijoro)', uniform: 'Imyambarire itujuje', dorm: 'Kurenga amategeko y\'icyumba cyo kuraramo', clean: 'Isuku nke', phone: 'Gukoresha telefoni', noise: 'Urusaku n\'imyitwarire mibi', leave: 'Kuva mu kigo nta ruhushya', fight: 'Kurwana' },
    en: { late: 'Lateness', absent: 'Skipping class or study', prep: 'Missing evening prep', uniform: 'Uniform violation', dorm: 'Dormitory rule breach', clean: 'Poor cleanliness', phone: 'Phone use', noise: 'Disruptive behaviour', leave: 'Leaving campus without permission', fight: 'Fighting' },
  };
  const t = (k) => T[L][k] ?? k;
  const errMsg = (e) => T[L].err[e && e.error] || T[L].err.default;

  async function api(method, url, body) {
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' }, body: body ? JSON.stringify(body) : undefined });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw { status: r.status, error: data.error };
    return data;
  }
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k.startsWith('aria-') && typeof v === 'boolean') { e.setAttribute(k, String(v)); continue; }
      if (v === false || v == null) continue;
      if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (k === 'value') e.value = v; else e.setAttribute(k, v === true ? '' : v);
    }
    for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
    return e;
  }
  const fmtD = (iso) => { try { return new Date(iso).toLocaleDateString(L === 'rw' ? 'rw' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return iso; } };
  const fmtDT = (iso) => { try { return new Date(iso).toLocaleString(L === 'rw' ? 'rw' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return iso; } };
  const logo = () => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'logo'); s.setAttribute('aria-hidden', 'true'); const u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#logo'); s.append(u); return s; };
  const field = (label, input) => h('label', null, h('span', null, label), input);
  const opt = (v, text) => h('option', { value: v }, text);
  function setLang(l) { L = l; try { localStorage.setItem('gsm-lang', l); } catch {} document.documentElement.lang = l === 'rw' ? 'rw' : 'en'; lastSig = ''; render(); }

  function shell(...main) {
    const app = document.getElementById('app'); app.replaceChildren();
    const head = h('header', null, logo(), h('b', null, t('brand')),
      ME && h('span', null, `${t('hello')}, ${ME.name.split(' ')[0]} · ${t(ME.role)}`),
      h('a', { class: 'btn o sm', href: '/', style: 'text-decoration:none' }, t('siteLink')),
      h('button', { class: 'btn o sm', onclick: () => setLang(L === 'rw' ? 'en' : 'rw') }, L === 'rw' ? 'EN' : 'RW'),
      ME && h('button', { class: 'btn o sm', onclick: async () => { await api('POST', '/api/logout').catch(() => {}); location.href = '/'; } }, t('logout')));
    app.append(head, h('main', null, ...main));
  }

  // ---------- login & password ----------
  const authTabs = (active) => h('div', { class: 'tabs', role: 'tablist' },
    h('button', { role: 'tab', 'aria-selected': active === 'reg', onclick: () => registerView() }, t('regTab')),
    h('button', { role: 'tab', 'aria-selected': active === 'login', onclick: () => loginView() }, t('login')));
  function loginView(msg) {
    const err = h('p', { class: 'err', role: 'alert' }, ''), ok = msg && h('p', { class: 'ok' }, msg);
    const id = h('input', { autocomplete: 'username', required: true }), pw = h('input', { type: 'password', autocomplete: 'current-password', required: true });
    const form = h('form', { class: 'form', onsubmit: async (e) => {
      e.preventDefault(); err.textContent = '';
      try { await api('POST', '/api/login', { identifier: id.value, password: pw.value }); await boot(true); } catch (x) { err.textContent = errMsg(x); }
    } }, field(t('ident'), id), field(t('pw'), pw), err, h('button', { class: 'btn', type: 'submit' }, t('login')));
    shell(h('div', { class: 'card login' }, authTabs('login'), h('h2', { style: 'margin-top:8px' }, t('login')), ok, form, h('p', { style: 'margin:16px 0 0' }, h('a', { href: '#', onclick: (e) => { e.preventDefault(); forgotView(); } }, t('forgot')))));
  }
  function registerView() {
    const nm = h('input', { required: true, maxlength: 80, autocomplete: 'name' }), ph = h('input', { required: true, inputmode: 'tel', autocomplete: 'username', placeholder: '0788123456' }), em = h('input', { type: 'email', autocomplete: 'email' }),
      p1 = h('input', { type: 'password', required: true, autocomplete: 'new-password' }), p2 = h('input', { type: 'password', required: true, autocomplete: 'new-password' }),
      cn = h('input', { required: true, maxlength: 80 }), cc = h('input', { maxlength: 20, placeholder: 'GSM-0001' }), rl = h('input', { maxlength: 30 }), trap = h('input', { name: 'website', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true', style: 'position:absolute;left:-9999px' });
    const err = h('p', { class: 'err', role: 'alert' }, '');
    const form = h('form', { class: 'form', onsubmit: async (e) => {
      e.preventDefault(); err.textContent = '';
      if (p1.value !== p2.value) { err.textContent = t('mismatch'); return; }
      try { await api('POST', '/api/register', { name: nm.value, phone: ph.value, email: em.value, password: p1.value, child_name: cn.value, child_code: cc.value, relation: rl.value, website: trap.value }); await boot(true); }
      catch (x) { err.textContent = errMsg(x); }
    } }, field(t('yourName'), nm), field(t('phone'), ph), field(t('email') + ' (' + (L === 'rw' ? 'si ngombwa' : 'optional') + ')', em),
      field(t('pwChoose'), p1), field(t('conf'), p2), field(t('childName'), cn), field(t('childCode'), cc), h('p', { class: 'm', style: 'margin:-6px 0 0' }, t('codeHelp')), field(t('relation'), rl), trap, err,
      h('button', { class: 'btn', type: 'submit' }, t('createAcc')));
    shell(h('div', { class: 'card login' }, authTabs('reg'), h('h2', { style: 'margin-top:8px' }, t('regTitle')), h('p', { class: 'm' }, t('regIntro')), form));
  }
  // ---------- ijambobanga ryibagiranye ----------
  function forgotView() {
    const id = h('input', { required: true, inputmode: 'tel', autocomplete: 'username', placeholder: '0788123456' }), err = h('p', { class: 'err', role: 'alert' }, '');
    shell(h('div', { class: 'card login' }, h('h2', null, t('forgot')), h('p', { class: 'm' }, t('forgotP')), h('form', { class: 'form', onsubmit: async (e) => {
      e.preventDefault(); err.textContent = '';
      try { await api('POST', '/api/forgot', { identifier: id.value }); resetView(id.value, t('codeSent')); } catch (x) { err.textContent = errMsg(x); }
    } }, field(t('phone'), id), err, h('button', { class: 'btn', type: 'submit' }, t('sendCode'))),
      h('p', { style: 'margin:14px 0 0' }, h('a', { href: '#', onclick: (e) => { e.preventDefault(); resetView('', ''); } }, t('haveCode')), ' · ', h('a', { href: '#', onclick: (e) => { e.preventDefault(); loginView(); } }, t('login')))));
  }
  function resetView(identifier, msg) {
    const id = h('input', { required: true, inputmode: 'tel', value: identifier || '', autocomplete: 'username' }), code = h('input', { required: true, inputmode: 'numeric', maxlength: 6, autocomplete: 'one-time-code', placeholder: '123456' }),
      p1 = h('input', { type: 'password', required: true, autocomplete: 'new-password' }), p2 = h('input', { type: 'password', required: true, autocomplete: 'new-password' }), err = h('p', { class: 'err', role: 'alert' }, '');
    shell(h('div', { class: 'card login' }, h('h2', null, t('forgot')), msg && h('p', { class: 'ok', role: 'status' }, msg), h('form', { class: 'form', onsubmit: async (e) => {
      e.preventDefault(); err.textContent = '';
      if (p1.value !== p2.value) { err.textContent = t('mismatch'); return; }
      try { await api('POST', '/api/reset-password', { identifier: id.value, code: code.value, password: p1.value }); loginView(t('resetOk')); }
      catch (x) { err.textContent = x.error === 'bad_code' ? t('badResetCode') : errMsg(x); }
    } }, field(t('phone'), id), field(t('codeF'), code), field(t('newPwF'), p1), field(t('conf'), p2), err, h('button', { class: 'btn', type: 'submit' }, t('resetBtn'))),
      h('p', { style: 'margin:14px 0 0' }, h('a', { href: '#', onclick: (e) => { e.preventDefault(); forgotView(); } }, t('sendCode')), ' · ', h('a', { href: '#', onclick: (e) => { e.preventDefault(); loginView(); } }, t('login')))));
  }

  // ---------- gusaba kwiga (rubonwa na buri wese, nta login) ----------
  function admissionView() {
    const yr = new Date().getFullYear(), sn = h('input', { required: true, maxlength: 80 }), by = h('select', null, opt('', t('chooseOpt')), Array.from({ length: 23 }, (_, i) => opt(yr - 8 - i, yr - 8 - i))),
      gd = h('select', null, opt('', t('chooseOpt')), opt('Male', t('male')), opt('Female', t('female'))), cb = h('select', null, opt('', t('chooseOpt')), ['MEG', 'HEGL', 'MCB', 'PCB'].map((c) => opt(c, c))),
      pv = h('input', { maxlength: 100 }), pn = h('input', { required: true, maxlength: 80, autocomplete: 'name' }), ph = h('input', { required: true, inputmode: 'tel', autocomplete: 'tel', placeholder: '0788123456' }), em = h('input', { type: 'email', autocomplete: 'email' }),
      ms = h('textarea', { rows: 3, maxlength: 500 }), cs = h('input', { type: 'checkbox', required: true, style: 'width:auto' }), trap = h('input', { name: 'website', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true', style: 'position:absolute;left:-9999px' }),
      err = h('p', { class: 'err', role: 'alert' }, ''), box = h('div', { class: 'card login', style: 'max-width:620px' });
    const form = h('form', { class: 'form', onsubmit: async (e) => {
      e.preventDefault(); err.textContent = '';
      try { const r = await api('POST', '/api/admission', { student_name: sn.value, birth_year: by.value, gender: gd.value, combination: cb.value, previous_school: pv.value, parent_name: pn.value, phone: ph.value, email: em.value, message: ms.value, consent: cs.checked, website: trap.value });
        box.replaceChildren(h('h2', null, t('admPubT')), h('p', { class: 'ok', role: 'status' }, `${t('admSent')} `, h('b', null, r.ref), '.'), h('p', null, t('admSent2')), h('a', { class: 'btn o', href: '/', style: 'text-decoration:none;display:inline-block' }, t('siteLink'))); }
      catch (x) { err.textContent = errMsg(x); }
    } }, h('div', { class: 'grid2' }, field(t('studentF'), sn), field(t('birthYear'), by)), h('div', { class: 'grid2' }, field(t('genderF'), gd), field(t('comboPref'), cb)), field(t('prevSchool'), pv),
      h('div', { class: 'grid2' }, field(t('parentF'), pn), field(t('phone'), ph)), field(t('email') + ' (' + (L === 'rw' ? 'si ngombwa' : 'optional') + ')', em), field(t('msgF'), ms),
      h('label', { style: 'display:flex;gap:10px;align-items:flex-start;font-weight:400' }, cs, h('span', null, t('consentTxt'))), trap, err, h('button', { class: 'btn', type: 'submit' }, t('send')));
    box.append(h('h2', null, t('admPubT')), h('p', { class: 'm' }, t('admPubP')), form);
    shell(box);
  }

  function passwordView() {
    const cur = h('input', { type: 'password', autocomplete: 'current-password', required: true }), n1 = h('input', { type: 'password', autocomplete: 'new-password', required: true }), n2 = h('input', { type: 'password', autocomplete: 'new-password', required: true });
    const err = h('p', { class: 'err', role: 'alert' }, '');
    shell(h('div', { class: 'card login' }, h('h2', null, t('first')), h('form', { class: 'form', onsubmit: async (e) => {
      e.preventDefault(); err.textContent = '';
      if (n1.value !== n2.value) { err.textContent = t('mismatch'); return; }
      try { await api('POST', '/api/password', { current: cur.value, password: n1.value }); ME = null; loginView(t('changed')); } catch (x) { err.textContent = errMsg(x); }
    } }, field(t('cur'), cur), field(t('new'), n1), field(t('conf'), n2), err, h('button', { class: 'btn', type: 'submit' }, t('change')))));
  }

  // ---------- parent ----------
  const status = (sc) => (sc >= 30 ? 'g' : sc >= 24 ? 'y' : 'r');
  function childCard(c, refresh) {
    const un = c.records.filter((r) => r.unread), last = c.records[0];
    const box = h('section', { class: 'card' },
      h('div', { class: 'idc' },
        h('div', { class: 'idh' }, logo(), h('div', null, h('b', null, t('brand')), h('span', null, t('card')))),
        h('div', { class: 'idb' }, h('div', { class: 'idp', 'aria-hidden': 'true' }, c.name.charAt(0)), h('div', null, h('h3', null, c.name), h('span', null, `${c.code} · ${c.combination}${c.class_name ? ' · ' + c.class_name : ''}`)),
          h('div', { class: 'ids ' + status(c.score) }, h('b', null, c.score), h('small', null, '/' + c.max))),
        last ? h('div', { class: 'idl' + (un.length ? ' new' : '') }, `⚠ ${t('latest')} −${last.points} ${CAT[L][last.category] || last.category} · ${fmtD(last.created_at)}`) : h('div', { class: 'idl ok' }, '✓ ' + t('none'))));
    if (un.length) box.append(h('div', { class: 'banner', role: 'alert' }, `⚠ ${t('newrec')}: ` + un.map((r) => `−${r.points} ${CAT[L][r.category] || r.category}`).join(', ') + ' ',
      h('button', { class: 'btn sm', onclick: async () => { await api('POST', `/api/children/${c.id}/read`); lastSig = ''; refresh(); } }, t('seen'))));
    box.append(h('h3', { style: 'margin-top:16px;font-size:18px' }, `${t('hist')} · ${c.term}`));
    box.append(c.records.length ? h('ul', { class: 'hist' }, c.records.map((r) => h('li', null, h('span', { class: 'pts' }, '−' + r.points),
      h('div', null, h('b', null, CAT[L][r.category] || r.category), r.unread && h('span', { class: 'nw' }, '●'), h('br'), h('span', { class: 'm' }, `${fmtDT(r.created_at)} · ${t('by')} ${r.by_name}${r.note ? ' · ' + r.note : ''}`))))) : h('p', { class: 'm' }, t('none')));
    if (c.results.length) box.append(h('h3', { style: 'margin-top:16px;font-size:18px' }, t('results')),
      h('table', null, h('tr', null, h('th', null, t('term')), h('th', null, t('subject')), h('th', null, t('score_'))), c.results.map((r) => h('tr', null, h('td', null, r.term), h('td', null, r.subject), h('td', null, `${r.score}/${r.max}`)))));
    return box;
  }
  async function parentView() {
    const holder = h('div', null);
    const load = async () => {
      const [kids, anns, me] = await Promise.all([api('GET', '/api/children'), api('GET', '/api/announcements'), api('GET', '/api/me')]);
      const sig = JSON.stringify([kids, anns, me.pending_link, L]); if (sig === lastSig) return; lastSig = sig;
      holder.replaceChildren(...(kids.length ? kids.map((c) => childCard(c, load)) : [h('p', { class: me.pending_link ? 'card banner' : 'card' }, me.pending_link ? t('pendingT') : t('nokids'))]),
        h('section', { class: 'card' }, h('h3', null, t('ann')), anns.length ? anns.map((a) => h('div', { style: 'margin-top:12px' }, h('b', null, a.title), h('div', { class: 'm' }, fmtD(a.created_at)), h('div', null, a.body))) : h('p', { class: 'm' }, t('noann'))));
    };
    shell(holder); await load();
    clearInterval(poll); poll = setInterval(() => load().catch(() => {}), 8000);
  }

  // ---------- teacher / admin ----------
  async function conductPanel() {
    const [studs, recent] = await Promise.all([api('GET', '/api/students'), api('GET', '/api/conduct/recent')]);
    const stu = h('select', null, studs.map((s) => opt(s.id, `${s.name} (${s.code}) · ${s.score}/40`)));
    const cat = h('select', null, META.cats.map((c) => opt(c.k, `${CAT[L][c.k]} (−${c.p})`)));
    const pts = h('input', { type: 'number', min: 1, max: 40, value: META.cats[0].p });
    cat.onchange = () => { pts.value = META.cats.find((c) => c.k === cat.value).p; };
    const note = h('input', { maxlength: 160 }), msg = h('p', { class: 'ok', role: 'status' }, ''), err = h('p', { class: 'err', role: 'alert' }, '');
    const form = h('form', { class: 'form', onsubmit: async (e) => {
      e.preventDefault(); msg.textContent = err.textContent = '';
      try { await api('POST', '/api/conduct', { student_id: stu.value, category: cat.value, points: pts.value, note: note.value }); await drawTab(); } catch (x) { err.textContent = errMsg(x); }
    } }, h('div', { class: 'grid2' }, field(t('student'), stu), field(t('cat'), cat)), h('div', { class: 'grid2' }, field(t('points'), pts), field(t('note'), note)), err, h('button', { class: 'btn', type: 'submit' }, t('deduct')));
    return h('div', null, h('div', { class: 'card' }, h('h3', null, `${t('conduct')} · ${META.term}`), form),
      h('div', { class: 'card' }, h('h3', null, t('recent')), h('ul', { class: 'hist' }, recent.map((r) => h('li', null, h('span', { class: 'pts' }, '−' + r.points),
        h('div', null, h('b', null, `${r.student} (${r.code})`, ' · ', CAT[L][r.category] || r.category), h('br'), h('span', { class: 'm' }, `${fmtDT(r.created_at)} · ${r.by_name}${r.note ? ' · ' + r.note : ''}`)),
        h('button', { class: 'btn bad sm', style: 'margin-left:auto', onclick: async () => { await api('DELETE', `/api/conduct/${r.id}`).catch(() => {}); drawTab(); } }, t('del')))))));
  }
  async function resultsPanel() {
    const studs = await api('GET', '/api/students');
    const stu = h('select', null, studs.map((s) => opt(s.id, `${s.name} (${s.code})`))), tm = h('input', { value: META.term }), sub = h('input', { required: true }),
      sc = h('input', { type: 'number', step: '0.5', min: 0, required: true }), mx = h('input', { type: 'number', min: 1, value: 100, required: true }), msg = h('p', { class: 'ok', role: 'status' }, ''), err = h('p', { class: 'err', role: 'alert' }, '');
    return h('div', { class: 'card' }, h('h3', null, t('resultsT')), h('form', { class: 'form', onsubmit: async (e) => {
      e.preventDefault(); msg.textContent = err.textContent = '';
      try { await api('POST', '/api/results', { student_id: stu.value, term: tm.value, subject: sub.value, score: sc.value, max: mx.value }); msg.textContent = t('saved'); sub.value = sc.value = ''; } catch (x) { err.textContent = errMsg(x); }
    } }, h('div', { class: 'grid2' }, field(t('student'), stu), field(t('term'), tm)), h('div', { class: 'grid2' }, field(t('subject'), sub), h('div', { class: 'grid2' }, field(t('score_'), sc), field(t('max'), mx))), err, msg, h('button', { class: 'btn', type: 'submit' }, t('save'))));
  }
  async function studentsPanel() {
    const studs = await api('GET', '/api/students');
    const nm = h('input', { required: true }), cb = h('select', null, META.combos.map((c) => opt(c, c))), cl = h('input', { maxlength: 30 }), pp = h('input', { inputmode: 'tel', placeholder: '0788123456' }), err = h('p', { class: 'err', role: 'alert' }, '');
    return h('div', null, h('div', { class: 'card' }, h('h3', null, t('students')), h('form', { class: 'form', onsubmit: async (e) => {
      e.preventDefault(); err.textContent = '';
      try { await api('POST', '/api/admin/students', { name: nm.value, combination: cb.value, class_name: cl.value, parent_phone: pp.value }); drawTab(); } catch (x) { err.textContent = errMsg(x); }
    } }, h('div', { class: 'grid2' }, field(t('name'), nm), field(t('combo'), cb)), field(t('cls'), cl), field(t('parentPhoneF'), pp), h('p', { class: 'm', style: 'margin:-6px 0 0' }, t('parentPhoneHelp')), err, h('button', { class: 'btn', type: 'submit' }, t('add')))),
      importCard(),
      h('div', { class: 'card' }, h('table', null, h('tr', null, h('th', null, t('code')), h('th', null, t('name')), h('th', null, t('combo')), h('th', null, t('cls')), h('th', null, '/40')),
        studs.map((s) => h('tr', null, h('td', null, s.code), h('td', null, s.name), h('td', null, s.combination), h('td', null, s.class_name), h('td', null, s.score))))));
  }
  async function usersPanel() {
    const users = await api('GET', '/api/admin/users');
    const role = h('select', null, ['parent', 'teacher', 'admin'].map((r) => opt(r, t(r)))), nm = h('input', { required: true }), ph = h('input', { inputmode: 'tel' }), em = h('input', { type: 'email' }), codes = h('input'),
      err = h('p', { class: 'err', role: 'alert' }, ''), secret = h('div', { class: 'secret', hidden: true, role: 'status' });
    const reveal = (pw) => { secret.hidden = false; secret.replaceChildren(t('created'), h('br'), h('b', null, pw)); };
    return h('div', null, h('div', { class: 'card' }, h('h3', null, t('users')), h('form', { class: 'form', onsubmit: async (e) => {
      e.preventDefault(); err.textContent = ''; secret.hidden = true;
      try { const r = await api('POST', '/api/admin/users', { role: role.value, name: nm.value, phone: ph.value, email: em.value, codes: codes.value }); nm.value = ph.value = em.value = codes.value = ''; reveal(r.tempPassword); const rows = await usersTable(); document.getElementById('utable').replaceChildren(rows); } catch (x) { err.textContent = errMsg(x); }
    } }, h('div', { class: 'grid2' }, field(t('role'), role), field(t('name'), nm)), h('div', { class: 'grid2' }, field(t('phone'), ph), field(t('email'), em)), field(t('codes'), codes), err, h('button', { class: 'btn', type: 'submit' }, t('add'))), secret),
      h('div', { class: 'card', id: 'utable' }, await usersTable(users, reveal)));
  }
  async function usersTable(users, reveal) {
    users = users || await api('GET', '/api/admin/users');
    return h('table', null, h('tr', null, h('th', null, t('name')), h('th', null, t('role')), h('th', null, t('phone') + ' / ' + t('email')), h('th', null, '')),
      users.map((u) => h('tr', null, h('td', null, u.name, u.children.length ? h('div', { class: 'm' }, u.children.map((c) => c.code).join(', ')) : null), h('td', null, t(u.role)), h('td', null, u.phone || '', u.phone && u.email ? ' · ' : '', u.email || ''),
        h('td', null, h('button', { class: 'btn o sm', onclick: async () => { const r = await api('POST', `/api/admin/users/${u.id}/reset`); (reveal || ((p) => alert(p)))(r.tempPassword); } }, t('reset')), ' ',
          h('button', { class: 'btn o sm', onclick: async () => { await api('POST', `/api/admin/users/${u.id}/active`, { active: !u.active }).catch(() => {}); drawTab(); } }, u.active ? t('disable') : t('enable'))))));
  }
  async function annPanel() {
    const [list] = await Promise.all([api('GET', '/api/announcements')]);
    const ti = h('input', { required: true, maxlength: 120 }), bo = h('textarea', { rows: 4, required: true, maxlength: 2000 }), au = h('select', null, [['all', t('all')], ['parents', t('parents')], ['teachers', t('teachers')]].map(([v, x]) => opt(v, x))), err = h('p', { class: 'err', role: 'alert' }, '');
    return h('div', null, h('div', { class: 'card' }, h('h3', null, t('annT')), h('form', { class: 'form', onsubmit: async (e) => {
      e.preventDefault(); err.textContent = '';
      try { await api('POST', '/api/admin/announcements', { title: ti.value, body: bo.value, audience: au.value }); drawTab(); } catch (x) { err.textContent = errMsg(x); }
    } }, field(t('titleF'), ti), field(t('body'), bo), field(t('aud'), au), err, h('button', { class: 'btn', type: 'submit' }, t('publish')))),
      h('div', { class: 'card' }, list.map((a) => h('div', { style: 'margin-bottom:12px' }, h('b', null, a.title), h('span', { class: 'm' }, ` · ${t(a.audience)} · ${fmtD(a.created_at)}`), h('div', null, a.body)))));
  }
  async function settingsPanel() {
    const [sm, au] = await Promise.all([api('GET', '/api/admin/sms'), api('GET', '/api/admin/audit')]);
    const tm = h('input', { value: META.term }), err = h('p', { class: 'err', role: 'alert' }, '');
    return h('div', null, h('div', { class: 'card' }, h('form', { class: 'form', onsubmit: async (e) => {
      e.preventDefault(); err.textContent = '';
      try { const r = await api('POST', '/api/admin/term', { term: tm.value }); META.term = r.term; drawTab(); } catch (x) { err.textContent = errMsg(x); }
    } }, field(t('setTerm'), tm), err, h('button', { class: 'btn', type: 'submit' }, t('save')))),
      h('div', { class: 'card' }, h('h3', null, t('backupT')), h('p', { class: 'm' }, t('backupP')), h('a', { class: 'btn', href: '/api/admin/backup', download: true, style: 'text-decoration:none;display:inline-block' }, t('backupBtn'))),
      h('div', { class: 'card' }, h('h3', null, t('smsLog')), h('table', null, sm.map((s) => h('tr', null, h('td', null, fmtDT(s.created_at)), h('td', null, s.to_phone), h('td', null, T[L].st[s.status] || s.status))))),
      h('div', { class: 'card' }, h('h3', null, t('audit')), h('table', null, au.map((a) => h('tr', null, h('td', null, fmtDT(a.created_at)), h('td', null, a.name || '—'), h('td', null, a.action), h('td', { class: 'm' }, a.detail))))));
  }
  async function requestsPanel() {
    const [reqs, studs] = await Promise.all([api('GET', '/api/admin/requests'), api('GET', '/api/students')]);
    const secret = h('div', { class: 'secret', hidden: !SECRET, role: 'status' }); if (SECRET) secret.append(t('created'), h('br'), h('b', null, SECRET));
    const rows = reqs.map((r) => {
      const pick = h('select', null, opt('', t('pickStu')), studs.map((s) => opt(s.code, `${s.name} (${s.code})`)));
      const guess = studs.find((s) => s.code === r.child_code) || studs.find((s) => s.name.toLowerCase() === r.child_name.toLowerCase()); if (guess) pick.value = guess.code;
      const act = r.status === 'pending' ? h('div', { style: 'display:grid;gap:6px;min-width:190px' }, pick,
        h('div', null, h('button', { class: 'btn sm', onclick: async () => { if (!pick.value) return; try { const o = await api('POST', `/api/admin/requests/${r.id}/approve`, { code: pick.value }); SECRET = o.tempPassword; drawTab(); } catch (x) { alert(errMsg(x)); } } }, t('approve')), ' ',
          h('button', { class: 'btn bad sm', onclick: async () => { await api('POST', `/api/admin/requests/${r.id}/reject`).catch(() => {}); drawTab(); } }, t('reject')))) : h('span', { class: 'm' }, t(r.status));
      return h('tr', null, h('td', null, h('b', null, r.name), h('div', { class: 'm' }, `${r.phone}${r.email ? ' · ' + r.email : ''}`, h('br'), fmtDT(r.created_at))), h('td', null, r.child_name, h('div', { class: 'm' }, `${r.child_code || ''}${r.relation ? ' · ' + r.relation : ''}`)), h('td', null, act));
    });
    return h('div', { class: 'card' }, h('h3', null, t('requests')), secret, reqs.length ? h('table', null, rows) : h('p', { class: 'm' }, t('noreq')));
  }
  // ---------- kwinjiza abanyeshuri (CSV) ----------
  function importCard() {
    const file = h('input', { type: 'file', accept: '.csv,text/csv,text/plain' }), out = h('div', null), err = h('p', { class: 'err', role: 'alert' }, ''); let csv = '';
    const go = h('button', { class: 'btn', type: 'button', hidden: true }, t('doImport'));
    const errs = (r) => r.error_count ? h('ul', { class: 'm' }, r.errors.map((x) => h('li', null, `${t('line')} ${x.line}: ${T[L].csvErr[x.msg] || x.msg}${x.value ? ' (' + x.value + ')' : ''}`)), r.error_count > r.errors.length ? h('li', null, '…') : null) : null;
    if (IMPORT_MSG) { out.append(h('p', { class: 'ok', role: 'status' }, `${t('createdN')}: ${IMPORT_MSG.created} (${IMPORT_MSG.first_code} – ${IMPORT_MSG.last_code})`, IMPORT_MSG.skipped ? ` · ${t('skipped')}: ${IMPORT_MSG.skipped}` : ''), errs(IMPORT_MSG)); IMPORT_MSG = null; }
    file.onchange = async () => {
      err.textContent = ''; out.replaceChildren(); go.hidden = true; csv = ''; const f = file.files[0]; if (!f) return;
      if (f.size > 580000) { err.textContent = T[L].err.csv_too_long; return; }
      csv = await f.text();
      try { const r = await api('POST', '/api/admin/students/import', { csv, dry: true }); out.replaceChildren(h('p', null, `${r.total} · ${t('ready')}: `, h('b', null, r.ready), ` · ${t('skipped')}: ${r.skipped} · ${t('errorsN')}: ${r.error_count}`), errs(r)); go.hidden = !r.ready; }
      catch (x) { err.textContent = errMsg(x); }
    };
    go.onclick = async () => { go.disabled = true; try { IMPORT_MSG = await api('POST', '/api/admin/students/import', { csv }); drawTab(); } catch (x) { err.textContent = errMsg(x); go.disabled = false; } };
    return h('div', { class: 'card' }, h('h3', null, t('importT')), h('p', { class: 'm' }, t('importHelp')),
      h('p', null, h('a', { href: '/api/admin/students-template.csv', download: '' }, t('template')), ' · ', h('a', { href: '/api/admin/students.csv', download: '' }, t('exportCsv'))),
      field(t('csvFile'), file), err, out, go);
  }
  // ---------- urubuga: amakuru, ibikorwa, kuvugana ----------
  async function sitePanel() {
    const [items, site] = await Promise.all([api('GET', '/api/admin/site-items'), api('GET', '/api/site')]);
    const kind = h('select', null, opt('news', t('news')), opt('event', t('event'))), d = h('input', { type: 'date', required: true, value: new Date().toISOString().slice(0, 10) }), trw = h('input', { required: true, maxlength: 120 }), ten = h('input', { maxlength: 120 }),
      brw = h('textarea', { rows: 3, maxlength: 1000 }), ben = h('textarea', { rows: 3, maxlength: 1000 }), err = h('p', { class: 'err', role: 'alert' }, '');
    const c = site.contact, cf = { phone: h('input', { value: c.phone || '', inputmode: 'tel' }), email: h('input', { type: 'email', value: c.email || '' }), whatsapp: h('input', { value: c.whatsapp || '', inputmode: 'tel' }), address: h('input', { value: c.address || '', maxlength: 160 }), hours: h('input', { value: c.hours || '', maxlength: 160 }) };
    const cerr = h('p', { class: 'err', role: 'alert' }, ''), cok = h('p', { class: 'ok', role: 'status' }, '');
    return h('div', null, h('div', { class: 'card' }, h('h3', null, t('siteT')), h('p', { class: 'm' }, t('siteHelp')), h('form', { class: 'form', onsubmit: async (e) => {
      e.preventDefault(); err.textContent = '';
      try { await api('POST', '/api/admin/site-items', { kind: kind.value, date: d.value, title_rw: trw.value, title_en: ten.value, body_rw: brw.value, body_en: ben.value }); drawTab(); } catch (x) { err.textContent = errMsg(x); }
    } }, h('div', { class: 'grid2' }, field(t('kind'), kind), field(t('date'), d)), field(t('titleRw'), trw), field(t('titleEn'), ten), field(t('bodyRw'), brw), field(t('bodyEn'), ben), err, h('button', { class: 'btn', type: 'submit' }, t('addItem')))),
      h('div', { class: 'card' }, items.length ? h('table', null, items.map((x) => h('tr', null, h('td', null, t(x.kind)), h('td', null, x.item_date), h('td', null, h('b', null, x.title_rw)), h('td', null, h('button', { class: 'btn bad sm', onclick: async () => { await api('DELETE', `/api/admin/site-items/${x.id}`).catch(() => {}); drawTab(); } }, t('del')))))) : h('p', { class: 'm' }, '—')),
      h('div', { class: 'card' }, h('h3', null, t('contactT')), h('form', { class: 'form', onsubmit: async (e) => {
        e.preventDefault(); cerr.textContent = cok.textContent = '';
        try { await api('POST', '/api/admin/site-contact', Object.fromEntries(Object.entries(cf).map(([k, v]) => [k, v.value]))); cok.textContent = t('savedOk'); } catch (x) { cerr.textContent = errMsg(x); }
      } }, h('div', { class: 'grid2' }, field(t('cPhone'), cf.phone), field(t('cWhatsapp'), cf.whatsapp)), field(t('cEmail'), cf.email), field(t('cAddress'), cf.address), field(t('cHours'), cf.hours), cerr, cok, h('button', { class: 'btn', type: 'submit' }, t('save')))));
  }
  // ---------- ubusabe bwo kwiga ----------
  async function admissionsPanel() {
    const list = await api('GET', '/api/admin/admissions');
    return h('div', { class: 'card' }, h('h3', null, t('admissionsT')), list.length ? h('table', null, list.map((r) => {
      const st = h('select', { 'aria-label': 'status' }, ['new', 'contacted', 'accepted', 'declined'].map((k) => opt(k, t('st_' + k)))); st.value = r.status;
      st.onchange = async () => { await api('POST', `/api/admin/admissions/${r.id}/status`, { status: st.value }).catch(() => {}); drawTab(); };
      return h('tr', null, h('td', null, h('b', null, r.ref), h('div', { class: 'm' }, fmtDT(r.created_at))),
        h('td', null, h('b', null, r.student_name), h('div', { class: 'm' }, [r.birth_year, r.gender && t(r.gender.toLowerCase()), r.combination, r.previous_school].filter(Boolean).join(' · '))),
        h('td', null, r.parent_name, h('div', { class: 'm' }, `${r.phone}${r.email ? ' · ' + r.email : ''}`), r.message ? h('div', { class: 'm' }, r.message) : null), h('td', null, st));
    })) : h('p', { class: 'm' }, t('noAdm')));
  }
  const PANELS = { conduct: conductPanel, results: resultsPanel, students: studentsPanel, users: usersPanel, ann: annPanel, settings: settingsPanel, requests: requestsPanel, site: sitePanel, admissions: admissionsPanel };
  const TABS = { teacher: [['conduct', 'conduct'], ['results', 'resultsT']], admin: [['conduct', 'conduct'], ['results', 'resultsT'], ['requests', 'requests'], ['admissions', 'admissionsT'], ['students', 'students'], ['users', 'users'], ['ann', 'annT'], ['site', 'siteT'], ['settings', 'settings']] };
  let content, SECRET = null, IMPORT_MSG = null;
  async function drawTab() { try { content.replaceChildren(await PANELS[tab]()); } catch (x) { content.replaceChildren(h('p', { class: 'err' }, errMsg(x))); } }
  async function staffView() {
    clearInterval(poll);
    content = h('div', null);
    const tabs = h('div', { class: 'tabs', role: 'tablist' }, TABS[ME.role].map(([k, label]) => h('button', { role: 'tab', 'aria-selected': k === tab, onclick: (e) => { tab = k; SECRET = null; [...tabs.children].forEach((b) => b.setAttribute('aria-selected', b === e.currentTarget)); drawTab(); } }, t(label))));
    shell(tabs, content); await drawTab();
  }

  // ---------- boot ----------
  const wantsLogin = () => location.pathname === '/login' || location.hash === '#login';
  async function render() { if (location.pathname === '/admission') return admissionView(); ME ? route() : (wantsLogin() ? loginView() : registerView()); }
  function route() { if (ME.must_change) return passwordView(); return ME.role === 'parent' ? parentView() : staffView(); }
  async function boot(fromAuth) {
    const isAdm = location.pathname === '/admission';
    try { const m = await api('GET', '/api/me'); META = m; ME = m.user;
      if (isAdm) { admissionView(); return; }
      if (fromAuth && !ME.must_change) { location.href = '/'; return; } if (!TABS[ME.role] || !TABS[ME.role].some((x) => x[0] === tab)) tab = 'conduct'; lastSig = ''; route(); }
    catch { ME = null; isAdm ? admissionView() : (wantsLogin() ? loginView() : registerView()); }
  }
  document.documentElement.lang = L === 'rw' ? 'rw' : 'en';
  boot();
})();
