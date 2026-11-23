'use strict';
const main = document.getElementById('main');
let currentUser = null;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = s => s ? new Date(s).toLocaleString('rw-RW',{dateStyle:'medium',timeStyle:'short'}) : '';
async function api(url, options={}) {
  const res = await fetch(url,{credentials:'same-origin',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error || 'Habaye ikibazo.');
  return data;
}
function loginView(error='') {
  main.innerHTML = `<section class="panel card"><h2>Injira muri system</h2><p class="muted">Koresha email cyangwa telefoni n’ijambobanga wahawe.</p>${error?`<p class="error">${esc(error)}</p>`:''}
  <form id="loginForm"><div class="field"><label>Email cyangwa telefoni</label><input name="login" required autocomplete="username"></div><div class="field"><label>Ijambobanga</label><input name="password" type="password" required autocomplete="current-password"></div><button type="submit">Injira</button></form>
  <div class="notice">Konti y’ababyeyi ikorwa n’ubuyobozi cyangwa binyuze mu kwiyandikisha kwemezwa n’ubuyobozi.</div></section>`;
  document.getElementById('loginForm').addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{await api('/api/login',{method:'POST',body:JSON.stringify({login:f.get('login'),password:f.get('password')})});await load();}catch(err){loginView('Email/telefoni cyangwa ijambobanga si byo.');}});
}
function layout(content) {
  const parent = currentUser.role === 'parent';
  main.innerHTML = `${parent ? '' : `<div class="welcome"><div><h1>Dashboard</h1><p>Murakaza neza muri GS MUHERO SCHOOL PLATFORM.</p></div><div class="user-chip">${esc(currentUser.name)} · ${esc(currentUser.role)}</div></div>`}
  <div class="toolbar">${parent ? '<span class="portal-brand">PARENT PORTAL</span>' : '<button data-page="dashboard">Dashboard</button>'}${['admin','teacher'].includes(currentUser.role)?'<button class="secondary" data-page="students">Abanyeshuri</button>':''}${!parent?'<button class="secondary" data-page="announcements">Amatangazo</button>':''}<button class="secondary" id="logout">Sohoka</button></div>${content}`;
  main.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>b.dataset.page==='dashboard'?dashboardView():b.dataset.page==='students'?studentsView():announcementsView()));
  document.getElementById('logout').addEventListener('click',async()=>{await api('/api/logout',{method:'POST'});currentUser=null;loginView();});
}
async function dashboardView() {
  const d=await api('/api/dashboard');
  const totals=d.totals||{};
  const max=Math.max(1,...(d.combinations||[]).map(x=>x.total));
  const content=`<div class="grid">
    <div class="card"><div class="stat-label">Abanyeshuri</div><div class="stat-number">${totals.students||0}</div><div class="stat-foot">Abanyeshuri bakora</div></div>
    <div class="card"><div class="stat-label">Abarimu</div><div class="stat-number">${totals.teachers||0}</div><div class="stat-foot">Konti zikora</div></div>
    <div class="card"><div class="stat-label">Ababyeyi</div><div class="stat-number">${totals.parents||0}</div><div class="stat-foot">Konti zikora</div></div>
    <div class="card"><div class="stat-label">Amatangazo</div><div class="stat-number">${(d.announcements||[]).length}</div><div class="stat-foot">Amatangazo aheruka</div></div>
  </div><div class="content-grid"><section class="card"><h3 class="section-title">Abanyeshuri hakurikijwe amashami</h3>${(d.combinations||[]).length?(d.combinations||[]).map(x=>`<div class="bar-row"><b>${esc(x.combination)}</b><div class="track"><div class="bar" style="width:${Math.round(x.total/max*100)}%"></div></div><span>${x.total}</span></div>`).join(''):'<div class="empty">Nta banyeshuri barandikwa.</div>'}</section>
  <section class="card"><h3 class="section-title">Ibikorwa biheruka</h3>${(d.recent||[]).length?(d.recent||[]).map(x=>`<div class="activity"><b>${esc(x.action)}</b><span>${esc(x.actor||'System')} · ${esc(x.detail)}</span><div class="muted">${fmt(x.created_at)}</div></div>`).join(''):'<div class="empty">Nta bikorwa birandikwa.</div>'}</section></div>
  <section class="card" style="margin-top:16px"><h3 class="section-title">Amatangazo aheruka</h3>${(d.announcements||[]).length?(d.announcements||[]).map(x=>`<div class="activity"><b>${esc(x.title)}</b><span>${esc(x.body)}</span><div class="muted">${fmt(x.created_at)}</div></div>`).join(''):'<div class="empty">Nta matangazo arashyirwaho.</div>'}</section>`;
  layout(content);
}
async function studentsView(query='') {
  const data=await api(`/api/students?q=${encodeURIComponent(query)}`);
  const rows=data.students||[];
  const isAdmin=currentUser.role==='admin';
  const content=`<section class="card"><div class="students-heading"><div><h3 class="section-title">Student Management</h3><p class="muted">Andika, shakisha kandi ucunge amakuru y’abanyeshuri.</p></div><span class="student-count">${rows.length} abanyeshuri</span></div>
  ${isAdmin?`<form id="studentForm" class="student-form"><input type="hidden" name="id"><div class="form-row"><div class="field"><label>Amazina yuzuye</label><input name="name" maxlength="100" required placeholder="Amazina y’umunyeshuri"></div><div class="field"><label>Ishami (Combination)</label><select name="combination"><option value="MEG">MEG</option><option value="HEGL">HEGL</option><option value="MCB">MCB</option><option value="PCB">PCB</option></select></div></div><div class="form-row"><div class="field"><label>Icyiciro / Class</label><input name="class_name" maxlength="40" placeholder="Urugero: S5 MCB"></div><div class="field"><label>Telefoni y’umubyeyi</label><input name="parent_phone" placeholder="078... cyangwa +250..."></div></div><div class="student-form-actions"><button type="submit" id="studentSave">Bika umunyeshuri</button><button type="button" class="secondary" id="studentCancel" hidden>Reka guhindura</button><span id="studentMessage" class="muted" role="status"></span></div></form>`:''}
  <div class="student-search"><input id="studentSearch" value="${esc(query)}" placeholder="Shakisha izina, Student ID cyangwa class..."><button id="studentSearchBtn">Shakisha</button><button id="studentClear" class="secondary">Siba search</button></div>
  <div class="table-wrap"><table><thead><tr><th>Student ID</th><th>Amazina</th><th>Ishami</th><th>Icyiciro</th><th>Imimerere</th>${isAdmin?'<th>Ibikorwa</th>':''}</tr></thead><tbody>${rows.map(s=>`<tr><td><b>${esc(s.code)}</b></td><td>${esc(s.name)}</td><td>${esc(s.combination)}</td><td>${esc(s.class_name||'—')}</td><td><span class="student-status ${s.active?'is-active':'is-inactive'}">${s.active?'Active':'Inactive'}</span></td>${isAdmin?`<td class="student-actions"><button class="small-btn" data-edit="${s.id}" ${!s.active?'disabled':''}>Hindura</button><button class="small-btn ${s.active?'danger-btn':'secondary'}" data-toggle="${s.id}" data-active="${s.active?1:0}">${s.active?'Hagarika':'Ongera ukore'}</button></td>`:''}</tr>`).join('')}</tbody></table></div>${rows.length?'':'<div class="empty">Nta munyeshuri uhuye n’ayo makuru wabonye.</div>'}</section>`;
  layout(content);
  const form=document.getElementById('studentForm');
  if(form) form.addEventListener('submit',async e=>{
    e.preventDefault(); const f=new FormData(form); const id=f.get('id');
    const payload={name:f.get('name'),combination:f.get('combination'),class_name:f.get('class_name'),parent_phone:f.get('parent_phone')};
    const save=document.getElementById('studentSave'); save.disabled=true;
    try{
      const result=await api(id?`/api/students/${id}`:'/api/students',{method:id?'PUT':'POST',body:JSON.stringify(payload)});
      document.getElementById('studentMessage').textContent=id?'Amakuru yahinduwe neza.':`Umunyeshuri yanditswe. Student ID: ${result.code}`;
      await studentsView(document.getElementById('studentSearch')?.value||'');
    }catch(err){document.getElementById('studentMessage').textContent=err.message==='student_code_exists_or_invalid'?'Student ID isanzweho cyangwa amakuru si yo.':'Habaye ikibazo mu kubika amakuru.';save.disabled=false;}
  });
  document.getElementById('studentCancel')?.addEventListener('click',()=>studentsView(query));
  const search=()=>studentsView(document.getElementById('studentSearch').value.trim());
  document.getElementById('studentSearchBtn').addEventListener('click',search);
  document.getElementById('studentSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search();}});
  document.getElementById('studentClear').addEventListener('click',()=>studentsView(''));
  main.querySelectorAll('[data-edit]').forEach(btn=>btn.addEventListener('click',()=>{
    const s=rows.find(x=>x.id===Number(btn.dataset.edit)); if(!s||!form)return;
    form.elements.id.value=s.id; form.elements.name.value=s.name; form.elements.combination.value=s.combination;
    form.elements.class_name.value=s.class_name||''; form.elements.parent_phone.value=s.parent_phone||'';
    document.getElementById('studentSave').textContent='Bika impinduka';
    document.getElementById('studentCancel').hidden=false;
    form.scrollIntoView({behavior:'smooth',block:'center'});
  }));
  main.querySelectorAll('[data-toggle]').forEach(btn=>btn.addEventListener('click',async()=>{
    const active=btn.dataset.active==='1';
    if(!confirm(active?'Urashaka guhagarika uyu munyeshuri? Amakuru ye azagumaho.':'Urashaka kongera gutuma uyu munyeshuri akora?'))return;
    try{await api(`/api/students/${btn.dataset.toggle}`,{method:'PATCH',body:JSON.stringify({active:!active})});await studentsView(query);}
    catch(err){alert('Ntibyashobotse guhindura imimerere y’umunyeshuri.');}
  }));
}
async function announcementsView() {
  const d=await api('/api/announcements');
  const content=`<section class="card"><h3 class="section-title">Amatangazo y’ishuri</h3>${currentUser.role==='admin'?`<form id="noticeForm"><div class="field"><label>Umutwe</label><input name="title" required></div><div class="field"><label>Ubutumwa</label><textarea name="body" required></textarea></div><div class="field"><label>Abazabibona</label><select name="audience"><option value="all">Bose</option><option value="parents">Ababyeyi</option><option value="teachers">Abarimu</option></select></div><button type="submit">Tangaza</button></form><hr style="border:0;border-top:1px solid #e6eaf0;margin:20px 0">`:''}${(d.announcements||[]).map(x=>`<div class="activity"><b>${esc(x.title)}</b><span>${esc(x.body)}</span><div class="muted">${esc(x.audience)} · ${fmt(x.created_at)}</div></div>`).join('')||'<div class="empty">Nta matangazo arahari.</div>'}</section>`;
  layout(content);
  const form=document.getElementById('noticeForm');
  if(form)form.addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(form);try{await api('/api/announcements',{method:'POST',body:JSON.stringify(Object.fromEntries(f))});announcementsView();}catch(err){alert('Ntibyashobotse gutangaza.');}});
}
async function parentPortalView() {
  const [kids, notices, sms] = await Promise.all([
    api('/api/parent/children'), api('/api/announcements'), api('/api/parent/sms')
  ]);
  const children = kids.children || [];
  const content = `<div class="welcome"><div><h1>Parent Portal</h1><p>Murakaza neza. Kurikirana imyigire n'imibereho y'abana bawe.</p></div><div class="user-chip">${esc(currentUser.name)} · Umubyeyi</div></div>
  <div class="portal-tabs"><button class="portal-tab active" data-tab="children">My Children</button><button class="portal-tab" data-tab="announcements">Announcements</button><button class="portal-tab" data-tab="sms">SMS Notifications</button></div>
  <section id="parentPanel" class="card"><h3 class="section-title">My Children</h3>${children.length ? `<div class="children-grid">${children.map(c=>`<button class="child-card" data-child="${c.id}"><span class="child-avatar">${esc((c.name||'?').slice(0,1).toUpperCase())}</span><span><b>${esc(c.name)}</b><small>${esc(c.code)} · ${esc(c.class_name)} · ${esc(c.combination)}</small></span><span class="child-open">Reba amakuru →</span></button>`).join('')}</div>` : '<div class="empty">Nta mwana urahuzwa na konti yawe. Saba ubuyobozi kuguhuza n’umwana wawe.</div>'}</section>`;
  layout(content);
  const panel=document.getElementById('parentPanel');
  main.querySelectorAll('[data-child]').forEach(b=>b.addEventListener('click',()=>parentChildView(Number(b.dataset.child))));
  main.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{
    main.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));
    if(b.dataset.tab==='children') panel.innerHTML=`<h3 class="section-title">My Children</h3>${children.length?`<div class="children-grid">${children.map(c=>`<button class="child-card" data-child="${c.id}"><span class="child-avatar">${esc((c.name||'?').slice(0,1).toUpperCase())}</span><span><b>${esc(c.name)}</b><small>${esc(c.code)} · ${esc(c.class_name)} · ${esc(c.combination)}</small></span><span class="child-open">Reba amakuru →</span></button>`).join('')}</div>`:'<div class="empty">Nta mwana urahuzwa na konti yawe.</div>'}`;
    if(b.dataset.tab==='announcements') panel.innerHTML=`<h3 class="section-title">Amatangazo y’ishuri</h3>${(notices.announcements||[]).map(n=>`<article class="portal-notice"><b>${esc(n.title)}</b><p>${esc(n.body)}</p><small>${fmt(n.created_at)}</small></article>`).join('')||'<div class="empty">Nta matangazo arahari.</div>'}`;
    if(b.dataset.tab==='sms') panel.innerHTML=`<h3 class="section-title">SMS Notifications</h3>${(sms.messages||[]).map(m=>`<article class="portal-notice"><b>${esc(m.status)}</b><p>${esc(m.message)}</p><small>${esc(m.to_phone)} · ${fmt(m.created_at)}</small></article>`).join('')||'<div class="empty">Nta butumwa bwa SMS buraboneka.</div>'}<p class="muted">Ubutumwa bugaragara hano ni ububitswe muri system. Koherezwa nyakuri bisaba SMS provider yateguwe.</p>`;
    panel.querySelectorAll('[data-child]').forEach(x=>x.addEventListener('click',()=>parentChildView(Number(x.dataset.child))));
  }));
}
async function parentChildView(id) {
  const d=await api(`/api/parent/child/${id}`), c=d.child, a=d.attendanceSummary||{};
  const pct=a.total?Math.round((a.present||0)/a.total*100):0;
  const panel=document.getElementById('parentPanel');
  panel.innerHTML=`<button class="back-link" id="backChildren">← My Children</button><div class="child-heading"><div class="child-avatar large">${esc((c.name||'?').slice(0,1).toUpperCase())}</div><div><h2>${esc(c.name)}</h2><p>${esc(c.code)} · ${esc(c.class_name)} · ${esc(c.combination)}</p></div></div>
  <h3 class="section-title">Attendance</h3><div class="attendance-summary"><div><b>${pct}%</b><small>Attendance</small></div><div><b>${a.present||0}</b><small>Present</small></div><div><b>${a.absent||0}</b><small>Absent</small></div><div><b>${a.late||0}</b><small>Late</small></div></div>
  <div class="table-wrap"><table><thead><tr><th>Itariki</th><th>Imimerere</th><th>Ibisobanuro</th></tr></thead><tbody>${(d.attendance||[]).map(x=>`<tr><td>${esc(x.attendance_date)}</td><td><span class="status status-${esc(x.status)}">${esc(({present:'Yitabiriye',absent:'Yasibye',late:'Yakererewe',excused:'Yemerewe'})[x.status]||x.status)}</span></td><td>${esc(x.note)}</td></tr>`).join('')}</tbody></table></div>${(d.attendance||[]).length?'':'<div class="empty">Nta makuru ya attendance arashyirwamo.</div>'}
  <h3 class="section-title spaced">Results</h3><div class="table-wrap"><table><thead><tr><th>Igihembwe</th><th>Isomo</th><th>Amanota</th></tr></thead><tbody>${(d.results||[]).map(x=>`<tr><td>${esc(x.term)}</td><td>${esc(x.subject)}</td><td>${esc(x.score)} / ${esc(x.max)}</td></tr>`).join('')}</tbody></table></div>${(d.results||[]).length?'':'<div class="empty">Nta manota arashyirwamo.</div>'}
  <h3 class="section-title spaced">Imyitwarire / Conduct</h3><div class="table-wrap"><table><thead><tr><th>Igihembwe</th><th>Icyiciro</th><th>Amanota / 40</th><th>Ibisobanuro</th></tr></thead><tbody>${(d.conduct||[]).map(x=>`<tr><td>${esc(x.term)}</td><td>${esc(x.category)}</td><td>${esc(x.points)} / 40</td><td>${esc(x.note)}</td></tr>`).join('')}</tbody></table></div>${(d.conduct||[]).length?'':'<div class="empty">Nta manota y’imyitwarire arashyirwamo.</div>'}`;
  document.getElementById('backChildren').addEventListener('click',parentPortalView);
}

async function load(){
  try{const d=await api('/api/me');currentUser=d.user;if(!currentUser)return loginView();if(currentUser.role==='parent') await parentPortalView(); else await dashboardView();}
  catch(e){loginView();}
}
load().catch(()=>loginView());
