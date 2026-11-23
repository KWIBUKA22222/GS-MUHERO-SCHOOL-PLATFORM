# GS Muhero School: porogaramu y'ababyeyi, abarimu n'ubuyobozi

Porogaramu yuzuye ikora **konti nyazo**, **imyitwarire (conduite) kuri 40**, **SMS ihita ijya ku mubyeyi**, **amanota y'ibizamini** n'**amatangazo**. Nta bindi bikoresho ikeneye uretse **Node.js 22.13 cyangwa irenga** (nta `npm install` isabwa).

## Ibyo ikora

| Uruhare | Ibyo ikora |
|---|---|
| **Ubuyobozi** | Kwandika abanyeshuri (bahabwa kode GSM-0001…), gukora konti z'abarimu n'ababyeyi, guhuza umubyeyi n'abana be, gutangaza amatangazo, guhindura igihembwe, kureba SMS zoherejwe n'ibyakozwe byose (audit). |
| **Umwarimu** | Gukata amanota y'imyitwarire, kwandika amanota y'ibizamini. Ashobora gukuraho ikosa yanditse mu masaha 24. |
| **Umubyeyi** | Abona **abana be gusa**: ikarita y'ishuri, amanota y'imyitwarire kuri 40, amateka y'ibyakaswe, ibizamini n'amatangazo. Ahabwa SMS iyo hari amanota akaswe. |

## Ibyongeweho vuba (ibikorwa by'ubuyobozi n'ababyeyi)

- **Kwinjiza abanyeshuri benshi (Excel/CSV):** *Abanyeshuri* → "Kwinjiza abanyeshuri benshi". Muri Excel: File → Save As → CSV. Imitwe: `name`, `combination` (MEG, HEGL, MCB, PCB), `class`, `parent_phone` (si ngombwa). Uburyo burabanza **kugenzura** (bukerekana amakosa n'abasanzwe bahari) mbere yo kwinjiza; hari **urugero rwa CSV** no **gukuramo urutonde**. Imirongo igera kuri 2000.
- **Ijambobanga ryibagiranye:** ku ipaji yo kwinjira, "Nibagiwe ijambobanga" → kode ya SMS y'imibare 6 (imara iminota 10, igerageza 5). Igisubizo ni kimwe niba konti ibaho cyangwa idahari. **Kode ntibikwa mu rutonde rwa SMS** ubuyobozi bureba. Bisaba SMS nyayo ikora (`SMS_PROVIDER`).
- **Urubuga: amakuru, ibikorwa n'amakuru yo kuvugana:** *Urubuga: amakuru n'ibikorwa* mu buyobozi. Ibyo mushyiramo bigaragara ku rubuga rw'ikigo rubonwa na buri wese (amakuru, ibikorwa bizaza, telefoni, imeri, WhatsApp, aho ikigo giherereye, amasaha yo gusura). **Ntabwo bigaragara iyo nta kintu cyashyizwemo** (amakuru y'ibigereranyo ntagaragara). Ntimukandike amazina y'abana.
- **Gusaba kwiga (admission):** ifishi iboneka kuri `/admission` ku bantu bose (nta konti). Umubyeyi ahabwa **kode (ADM-xxxx)** na SMS. Ubuyobozi bureba ubusabe mu *Ubusabe bwo kwiga* bugahindura status (Bushya, Bavuganye, Bwemejwe, Bwanzwe). Hakusanywa amakuru make gusa (umwaka yavukiyemo, atari itariki yose), n'uruhushya rw'umubyeyi rurasabwa.

## Uko urubuga rukora (inzira y'umuntu)

1. **`/`** ni ipaji ya mbere: **"Iyandikishe nk'umubyeyi"** n'akabuto ka **"Injira"**.
2. Umuntu amaze **kwiyandikisha cyangwa kwinjira**, ahita ajyanwa kuri **`/site`**: **urubuga rw'ikigo** (amashami, serivisi, abarimu, amakuru, ibikorwa), rufite izina rye n'akabuto ka **"Konti yanjye"** hejuru. Umubyeyi ufite amanota mashya yakaswe abona ikimenyetso ⚠ kuri ako kabuto.
3. **`/portal`** ni ipaji y'ibikorwa bye (konti): umubyeyi abona ikarita y'umwana n'imyitwarire, umwarimu akata amanota, ubuyobozi bugacunga byose. Buri paji ifite akabuto ko kujya ku yindi.
4. Utarinjira **ntabona urubuga rw'ikigo**: ajyanwa kuri `/`. Uwinjiye iyo asubiye kuri `/` ajyanwa kuri `/site`. Ufite ijambobanga rya mbere ajyanwa kuri `/portal` guhindura ijambobanga mbere.
4b. Urubuga rufite igice cya **Inyubako** gifite amashusho y'amacumbi, laboratwari ya mudasobwa, ibibuga bya siporo, ivuriro, aho barira, laboratwari y'ubumenyi n'inama n'ubujyanama (muri `site.js`, urutonde `BUILD`; nibabona amafoto nyayo bazayasimbuza).
5. Dosiye z'urubuga rw'ikigo ni **`public/site.html`**, **`public/site.js`** na **`public/site.css`** (ni zo wahindura amakuru y'abarimu, amakuru n'amatariki; ishusho y'ikigo iri muri `site.html`).

Icyitonderwa: kubera ko urubuga rw'ikigo ruboneka **nyuma yo kwinjira gusa**, abantu batiyandikishije ntibabona amakuru y'ikigo. Niba mushaka ko amakuru rusange (amashami, serivisi, aho ikigo giherereye) aboneka na buri wese, mbwire nzayafungura nta kwinjira.

## Kwiyandikisha kw'ababyeyi (buri wese arabishobora)

Ipaji ya mbere umuntu abona ni **"Iyandikishe nk'umubyeyi"**. Umubyeyi wese yuzuza amazina, telefoni, ijambobanga yihitiramo n'amazina y'umwana (na kode ye niba ayizi), **konti igahita ikorwa** akinjira ako kanya. Abafite konti bakanda **"Injira"**.

**Uko umwana ahuzwa na konti (kugira ngo amakuru y'abana arindwe):**
- **Guhuza byikora:** iyo ubuyobozi bwanditse **telefoni y'umubyeyi** ku munyeshuri (mu gice cy'Abanyeshuri), kandi umubyeyi yiyandikishije akoresheje **iyo telefoni na kode y'umwana**, umwana ahita ahuzwa.
- **Ubundi buryo:** ubusabe bujya mu gice cya **Ubusabe bwa konti** (ubuyobozi), bukagenzura ko ari umubyeyi nyakuri (guhamagara cyangwa kureba mu bitabo by'ishuri), bugahitamo umunyeshuri, bukemeza. Umubyeyi abimenyeshwa kuri SMS, kandi ipaji ye ihita ihinduka.
- **Umubyeyi utaremezwa ntabona umwana n'umwe**, nubwo yaba azi kode.

**Imbibi zo kumenya:** telefoni umuntu yanditse **ntisuzumwa** (nta kode ya SMS yo kuyemeza ubu). Bityo guhuza byikora birinda abatazi kode n'iyo telefoni gusa; umuntu uzi byombi yabikoresha. Kugira ngo biruhuke, ishuri rishobora kongeramo **kode ya SMS yo kwemeza telefoni** (bisaba SMS ikora). Kugeza icyo gihe, mukore imibare ya kode idakurikirana, kandi ntimuzishyire ahagaragara.

Konti z'**abarimu n'ubuyobozi** zikorwa n'ubuyobozi mu gice cya **Abakoresha** (bakinjira bakanze "Injira").

## Konti ya mbere (niba mubona login gusa)

Mbere yo gukora ubusabe cyangwa konti iyo ari yo yose, hakenewe **konti y'ubuyobozi**. Ikorwa na `npm run seed` ikoresheje `ADMIN_EMAIL` na `ADMIN_PASSWORD` biri muri `.env`. Mwinjire n'iyo imeri n'ijambobanga, hanyuma mukore izindi konti. Niba mwahinduye `.env` nyuma ya `seed`, gusiba ikaye `data/` hanyuma `npm run seed` nanone byakora konti nshya (bisiba amakuru yose).

## Gutangira (kuri mudasobwa)

```bash
cp .env.example .env        # hanyuma uhindure ADMIN_EMAIL na ADMIN_PASSWORD (nibura inyuguti 12)
npm run seed                # ikora konti y'ubuyobozi
npm start                   # ifungura http://localhost:3000
npm test                    # igerageza ibyo byose (ibizamini 78)
node seed.js --demo         # (si ngombwa) abanyeshuri n'abakoresha b'igeragezwa
```

Konti z'abarimu n'ababyeyi zikorerwa mu gice cya **Abakoresha**. Ijambobanga rya mbere rigaragara **rimwe gusa**, ukaritanga nyiraryo, kandi agomba kuryihindura akinjira bwa mbere.

## Gushyira kuri internet

**Reba `HOSTING.md`** ifite intambwe ku yindi (Render cyangwa seriveri yawe, domain, SMS, backup n'urutonde rwo kugenzura). Ibikurikira ni incamake.


1. Hitamo aho kwakirwa (hosting) hatanga **ububiko buhoraho** (persistent disk) kuko amakuru abikwa muri `data/gsm.sqlite`: Render, Railway, Fly.io, cyangwa seriveri (VPS). **Ntukoreshe aho dosiye zisibwa buri gihe** (urugero ahatanga ububiko bw'igihe gito gusa).
2. Shyiraho ibi muri environment: `BASE_URL`, `COOKIE_SECURE=1`, `TRUST_PROXY=1` (iyo uri inyuma ya proxy), `DB_PATH` (ku bubiko buhoraho), `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
3. Koresha **HTTPS** ubudahwema. Ibyinshi mu byakirwa bibitanga ku buntu.
4. Fata **backup** y'ububiko `data/` buri munsi (cyane cyane `gsm.sqlite`).

## Aderesi yihariye (gsmuhero.rw)

1. Iyandikishe izina rya domain (`.rw` ricungwa na RICTA, ribonwa binyuze mu bacuruzi bemewe). Babaze ibisabwa ishuri.
2. Ku hosting wahisemo, ongeramo domain yawe (ubusanzwe ni "Custom domain").
3. Ku mucuruzi wa domain, shyiraho **DNS record** (CNAME cyangwa A) ibyakirwa bibaha.
4. Utegereze ko HTTPS itangwa (ubusanzwe iminota mike kugeza ku masaha).
5. Hanyuma uhindure `BASE_URL=https://gsmuhero.rw` muri `.env`, kugira ngo SMS zibe zifite ihuza ry'ukuri.

## SMS

Muri `.env`: `SMS_PROVIDER=console` ni igerageza (SMS zandikwa gusa, ntizijya). Kugira ngo zijye nyabyo:
- Hitamo umuyoboro wa SMS ukorera mu Rwanda. Muri iyi porogaramu hari ikorana na **Africa's Talking** (`SMS_PROVIDER=africastalking`, hamwe na `AT_USERNAME`, `AT_API_KEY`, `AT_SENDER_ID`).
- **Reba inyandiko z'uwo muyoboro** (aderesi n'imirima bishobora guhinduka), kandi ugerageze mbere ukoresheje konti y'igerageza (`AT_USERNAME=sandbox`).
- Ubutumwa **ntibujyamo ikosa ryakozwe** nta n'amazina y'impamvu: bubwira umubyeyi gusa ko hari ikintu cyahindutse akinjira kureba. Bityo SMS yatakara cyangwa ikagera ku muntu utari we nta byo isohora.
- Buri SMS ibikwa mu **Igihembwe na SMS** kugira ngo ubuyobozi bubone ibyoherejwe n'ibitagiye.

## Ibanga ry'amakuru (ni abana)

- Ijambobanga ribikwa rihinduwe (scrypt), nta na rimwe rigaragara. Ibikorwa byose by'ingenzi bibikwa muri audit.
- Umubyeyi abona **abana yahujwe nabo gusa**; ibyo bigenzurwa buri gihe kuri seriveri, atari mu interface gusa.
- Amakuru ni make: amazina, ishami, amanota n'imyitwarire. **Ntukabike ibindi** (indangamuntu, amakuru y'ubuzima) nta mpamvu.
- Mbere yo gutangira, ishuri rigomba **kumenyesha ababyeyi** amakuru abikwa n'uko akoreshwa, kandi rikagena uwemerewe kuyabona. Jya uvugana n'inzobere mu mategeko y'u Rwanda ku bijyanye no kurinda amakuru bwite.

## Ibisigaye gukorwa mbere yo gutangira nyirizina

- Gushyira urubuga rusanzwe (gs-muhero-school.html) kuri domain imwe, no gusimbuza igice cya "conduite y'igeragezwa" ihuza na `/login` y'iyi porogaramu.
- Kwandika abanyeshuri nyabo n'ababyeyi babo (ubuyobozi bubikorera mu gice cy'Abanyeshuri n'Abakoresha).
- Kugerageza SMS nyayo n'umuyoboro wahisemo, no kugenzura ko telefoni z'ababyeyi zanditse neza (0788… cyangwa +250788…).
- Backup, gukurikirana (monitoring) no kugira umuntu ushinzwe kuyicunga.
