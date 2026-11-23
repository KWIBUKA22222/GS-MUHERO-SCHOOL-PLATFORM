# Gushyira GS Muhero kuri internet

Iyi nyandiko ikubwira intambwe ku yindi uko wakwakira (host) porogaramu kugira ngo buri wese ayibone kuri internet.
**Uburyo bwa mbere (Render)** ni bwo bworoshye; **uburyo bwa kabiri (seriveri yawe, VPS)** ni ubw'abafite umuntu uzi gucunga seriveri.

> Icyitonderwa: Dockerfile na `render.yaml` **nta byo nabashije kugerageza kuri Render cyangwa Docker** aho nakoreye. Porogaramu ubwayo (ibizamini 78, harimo `/healthz`, konti ya mbere ikorwa ubwayo no gufunga neza seriveri) irageragejwe. Bityo mu ntambwe za mbere, mukurikire ibiboneka kuri ecran, kandi niba hari ikitagenze neza, mumbwire ubutumwa bw'ikosa.

---

## Ibyo ukeneye mbere
1. **Konti ya GitHub** (github.com, ni ubuntu).
2. **Konti ya Render** (render.com). **Ububiko buhoraho (disk) busaba plan yishyurwa**; plan y'ubuntu isiba amakuru yose buri gihe seriveri yongeye gutangira. Reba ibiciro bya none kuri render.com/pricing.
3. **Git** kuri mudasobwa yawe (git-scm.com).
4. (Nyuma) **Domain** nka gsmuhero.rw.

---

## Uburyo 1: Render

### 1. Shyira code kuri GitHub
Mu terminal, muri ikaye ya porogaramu (`gsm-platform`):
```
git init
git add .
git commit -m "GS Muhero platform"
```
Kuri github.com kora repository nshya (**Private**), hanyuma ukurikize amabwiriza ya GitHub ngo wohereze code (`git remote add origin ...` na `git push -u origin main`).
`.gitignore` ibuza kohereza `.env` n'ububiko `data/`, bityo ijambobanga ntiryoherezwa.

### 2. Kora seriveri kuri Render
1. Muri Render: **New → Blueprint**, uhitemo repository yawe. Render isoma `render.yaml` ikazana ibiyigize byose: seriveri, **disk ya 1 GB** (`/data`) n'ibihindurwa (environment variables).
2. Izagusaba kuzuza ibi (ibitagomba kujya muri code):
   | Izina | Agaciro |
   |---|---|
   | `BASE_URL` | Mbere ushyiremo aderesi Render iguha (urugero `https://gs-muhero.onrender.com`). Nyuma izahinduka `https://gsmuhero.rw`. |
   | `ADMIN_EMAIL` | Imeri y'umuyobozi mukuru. |
   | `ADMIN_PASSWORD` | Ijambobanga rirerire (**nibura inyuguti 12**). |
   | `AT_*` | Mubirekere ubusa kugeza mugize SMS nyayo. |
3. Kanda **Apply** utegereze ko ikora. Ntukongere `numInstances` kurenza 1: SQLite yandikwa n'inzira imwe gusa.
4. Fungura aderesi Render iguha, ongeraho `/healthz`: igomba kwerekana `{"ok":true}`. Hanyuma fungura aderesi isanzwe, wumve ko urubuga rw'ikigo rugaragara.

### 3. Injira bwa mbere
- Kanda **Injira** ukoreshe `ADMIN_EMAIL` na `ADMIN_PASSWORD`. Konti y'ubuyobozi ikorwa ubwayo iyo seriveri itangiye bwa mbere ikabona nta muyobozi uriho.
- **Nyuma yo kwinjira, mukureho `ADMIN_PASSWORD`** mu bihindurwa bya Render (ntigikenewe kandi ni ibanga).

### 4. Gutegura amakuru nyayo (mu gice cy'ubuyobozi)
> Mbere yo kwandika umunyeshuri umwe umwe, koresha **Kwinjiza abanyeshuri benshi (CSV)** mu gice cy'*Abanyeshuri*.
> Hanyuma mu **Urubuga: amakuru n'ibikorwa** shyiramo telefoni, imeri, WhatsApp n'aho ikigo giherereye, n'amakuru ya mbere.
1. **Abanyeshuri:** mwandike buri wese, mushyire na **telefoni y'umubyeyi** iri mu bitabo by'ishuri (ituma umubyeyi ahuzwa n'umwana ako kanya).
2. **Abarimu:** mu **Abakoresha**, mukore konti z'abarimu, mubahe ijambobanga rya mbere.
3. **Ababyeyi:** bariyandikisha ubwabo ku rubuga (buto "Iyandikishe"); ubuyobozi bwemeza abatahuje telefoni mu **Ubusabe bwa konti**.
4. **Reba ko byose bikora:** iyandikishe nk'umubyeyi kuri telefoni yawe, ukate amanota nk'umwarimu, urebe ko bigaragara.

### 5. Domain (gsmuhero.rw)
1. Iyandikishe domain (`.rw` ricungwa na RICTA, ribonwa mu bacuruzi bemewe; babaze ibisabwa ishuri).
2. Kuri Render: seriveri yawe → **Settings → Custom Domains** → ongeramo `gsmuhero.rw` na `www.gsmuhero.rw`.
3. Render izakwereka **DNS records** (CNAME cyangwa A) ugomba gushyira ku mucuruzi wa domain; ubishyireho.
4. Tegereza ko HTTPS itangwa (iminota mike kugeza ku masaha).
5. Muri Render, uhindure `BASE_URL` ibe `https://gsmuhero.rw` (SMS zikoresha iyi aderesi).

### 6. SMS nyayo
Mu bihindurwa bya Render: `SMS_PROVIDER=africastalking`, hanyuma `AT_USERNAME`, `AT_API_KEY`, `AT_SENDER_ID`. **Mugerageze mbere ukoresheje konti y'igerageza** (`AT_USERNAME=sandbox`), kandi mugenzure inyandiko z'uwo muyoboro. Mu gihe `SMS_PROVIDER=console`, SMS ntizijya: zandikwa gusa mu gice cya **Igihembwe na SMS**.

### 7. Backup
- Render ifata **snapshot ya disk buri masaha 24** (reba muri Render: seriveri → Disks). 
- Mubigire inyongera: muri Render **Shell** mukore `npm run backup` (ikora kopi itekanye muri `/data/backups/`, igagumana 14 za nyuma), mugakuramo imwe rimwe mu cyumweru mukayibika ahandi (kuri mudasobwa cyangwa Google Drive).
- **Mugerageze gusubiza backup mbere y'uko byihutirwa**: gusimbuza `gsm.sqlite` n'iyo kopi.

---

## Uburyo 2: Seriveri yawe (VPS) hamwe na Docker na Caddy
Bikenera VPS ya Ubuntu (urugero DigitalOcean, Hetzner cyangwa iy'umucuruzi wo mu gihugu), domain yerekeza kuri iyo seriveri (A record), na Docker.

```
git clone <repository-yawe> gsm && cd gsm
docker build -t gsm .
docker run -d --name gsm --restart unless-stopped \
  -p 127.0.0.1:3000:3000 -v gsm-data:/data \
  -e BASE_URL=https://gsmuhero.rw -e COOKIE_SECURE=1 -e TRUST_PROXY=1 \
  -e ADMIN_EMAIL=imeri@gsmuhero.rw -e ADMIN_PASSWORD='ijambobanga-rirerire-rya-mbere' \
  gsm
```
Caddy itanga HTTPS ubwayo. `/etc/caddy/Caddyfile`:
```
gsmuhero.rw, www.gsmuhero.rw {
    reverse_proxy 127.0.0.1:3000
}
```
Backup: `docker exec gsm npm run backup` (yandikwa muri volume `gsm-data`); mukore `cron` ya buri munsi, mukopere dosiye hanze ya seriveri.
Nyuma yo kwinjira bwa mbere, mukureho `ADMIN_PASSWORD`: `docker rm -f gsm` hanyuma `docker run` nanone mutayishyizeho (amakuru aguma muri volume).

---

## Urutonde rwo kugenzura mbere yo gutangaza
- [ ] Nshobora kwinjira nk'umuyobozi, kandi `ADMIN_PASSWORD` yavuye mu bihindurwa.
- [ ] Aderesi ikoresha **https://**, kandi `COOKIE_SECURE=1`.
- [ ] Abanyeshuri nyabo bamaze kwandikwa, n'amakuru y'ibigereranyo ku rubuga (`public/site.html` na `site.js`) yasimbuwe n'ukuri.
- [ ] Nagerageje kwiyandikisha nk'umubyeyi, no kwinjira nk'umwarimu, kuri telefoni nyayo.
- [ ] SMS yageragejwe n'umuyoboro nyawo (cyangwa mbwira ababyeyi ko zitaraboneka).
- [ ] Backup yafashwe kandi nagerageje kuyisubiza.
- [ ] Ababyeyi bamenyeshejwe amakuru abikwa n'uko akoreshwa (ni abana). Nabajije inzobere mu mategeko y'u Rwanda ku kurinda amakuru bwite.
- [ ] Hari umuntu ushinzwe kuyicunga (kureba backup, gukemura ibibazo by'ababyeyi, kuvugurura).
