
# GS MUHERO SCHOOL PLATFORM

Porogaramu ya GS Muhero School igenewe ababyeyi, abarimu n'ubuyobozi bw'ishuri.

Iyi platform icunga:
- Konti z'ababyeyi, abarimu n'ubuyobozi.
- Abanyeshuri n'amashami bigamo.
- Amanota y'imyitwarire (Conduite) kuri 40.
- Amanota y'ibizamini.
- Ubutumwa bwa SMS bwo kumenyesha ababyeyi.
- Amatangazo y'ishuri.
- Kwiyandikisha kw'ababyeyi.
- Gucunga ubusabe bwo kwiga (Admission).
- Gucunga amakuru y'ishuri n'ibikorwa byaryo.

## 1. USER ROLES

### Administrator
- Kwandika no gucunga abanyeshuri.
- Gukora konti z'abarimu n'ababyeyi.
- Guhuza ababyeyi n'abana babo.
- Gutangaza amatangazo.
- Gucunga igihembwe.
- Kureba ubutumwa bwa SMS.
- Gukurikirana ibikorwa byose bya system.

### Teacher
- Kwandika amanota y'imyitwarire.
- Kwandika amanota y'ibizamini.
- Gukosora ikosa yakoze mu gihe cy'amasaha 24.

### Parent
- Kureba abana yahujwe na bo gusa.
- Kureba amanota y'imyitwarire kuri 40.
- Kureba amanota y'ibizamini.
- Kureba amateka y'imyitwarire.
- Kubona amatangazo y'ishuri.
- Kwakira ubutumwa bwa SMS.

## 2. SYSTEM FEATURES

### Student Management
- Kwandika abanyeshuri.
- Guhabwa student ID nka GSM-0001.
- Gucunga amashami n'ibyiciro.
- Kwinjiza abanyeshuri benshi ukoresheje CSV.
- Gukuramo urutonde rw'abanyeshuri.

### Parent Management
- Kwiyandikisha kw'ababyeyi.
- Gukora konti.
- Guhuza umubyeyi n'umwana.
- Kugenzura ubusabe bwo guhuza konti.

### SMS Notifications
- Kumenyesha ababyeyi iyo hari amanota mashya.
- Kumenyesha ababyeyi ibindi bikorwa by'ingenzi.
- Gukoresha Africa's Talking mu kohereza SMS nyazo.

### Admission
- Ifishi yo gusaba kwiga.
- Guhabwa kode ya admission.
- Gukurikirana ubusabe.
- Kwemeza cyangwa kwanga ubusabe.

## 3. PROJECT STRUCTURE

```text
gsm-platform/
│
├── public/
│   ├── app.js
│   ├── index.html
│   ├── site.html
│   ├── site.js
│   ├── site.css
│   └── style.css
│
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── HOSTING.md
├── README.md
├── auth.js
├── backup.js
├── bootstrap.js
├── db.js
├── env.js
├── package.json
├── render.yaml
├── seed.js
├── server.js
├── sms.js
└── test.js
```

## 4. REQUIREMENTS

Ibikenewe kugira ngo ukore iyi project:

- Node.js 22.13 cyangwa irenga.
- npm.
- Web browser.
- Internet connection.
- SMS provider (iyo ushaka kohereza SMS nyazo).

## 5. INSTALLATION

Clone project:

```bash
git clone https://github.com/KWIBUKA22222/GS-MUHERO-SCHOOL-PLATFORM.git
```

Injira muri project:

```bash
cd GS-MUHERO-SCHOOL-PLATFORM
```

Kora environment file:

```bash
cp .env.example .env
```

Kuri Windows CMD, ushobora gukoresha:

```cmd
copy .env.example .env
```

Hindura `.env` ushyiremo amakuru yawe bwite.

Tegura database na administrator:

```bash
npm run seed
```

Tangira server:

```bash
npm start
```

Fungura browser:

```text
http://localhost:3000
```

Gukora tests:

```bash
npm test
```

Gukora demo data (si ngombwa):

```bash
node seed.js --demo
```

## 6. ENVIRONMENT VARIABLES

Reba `.env.example` kugira ngo umenye variables zose zikenewe.

Zimwe mu z'ingenzi:

```env
ADMIN_EMAIL=
ADMIN_PASSWORD=
BASE_URL=
COOKIE_SECURE=1
TRUST_PROXY=1
DB_PATH=
SMS_PROVIDER=console
```

Ntushyire amakuru y'ibanga muri GitHub.

## 7. HOSTING

Iyi project ishobora gushyirwa kuri hosting nka:

- Render
- Railway
- Fly.io
- VPS

Reba dosiye ya `HOSTING.md` kugira ngo ubone amabwiriza arambuye.

**Icyitonderwa:** Koresha hosting itanga persistent storage kugira ngo amakuru abitswe muri SQLite atazimira.

Koresha HTTPS kandi ukore database backups buri gihe.

## 8. SECURITY AND DATA PRIVACY

- Passwords zibikwa zifite encryption hashing hakoreshejwe scrypt.
- Ababyeyi babona abana bahujwe na konti zabo gusa.
- Ibikorwa by'ingenzi bikurikiranwa muri audit logs.
- Amakuru bwite y'abanyeshuri agomba kurindwa.
- Ntushyire `.env` cyangwa amakuru y'ibanga kuri GitHub.

## 9. FUTURE IMPROVEMENTS

- Kunoza dashboard.
- Kongeramo reports.
- Kunoza SMS notifications.
- Kongeramo analytics.
- Kunoza uburyo bwo gucunga abanyeshuri.
- Kongeramo amakuru y'ishuri n'ibikorwa byaryo.

## 10. PROJECT INFORMATION

**Project Name:** GS MUHERO SCHOOL PLATFORM

**Institution:** GS MUHERO SCHOOL

**Technology:** Node.js, JavaScript, HTML, CSS, SQLite

**Purpose:** School Management and Parent Communication Platform

---

© 2026 GS MUHERO SCHOOL. All Rights Reserved.