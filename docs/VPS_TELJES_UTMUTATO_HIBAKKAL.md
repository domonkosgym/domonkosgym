# TheCoach.hu - ULTRA-RÉSZLETES VPS Migrációs Útmutató
# Minden Buktatóval, Hibával és Megoldással

## 🎯 Dokumentum Célja

Ez a dokumentáció **TELJESKÖRŰEN** leírja a Lovable platformról való függetlenedés folyamatát, beleértve:
- ✅ Minden lépést részletesen, screenshot-szerű leírásokkal
- ⚠️ Minden felmerülhető problémát és buktatót
- 🔧 Minden probléma megoldását
- 🔑 Minden kulcs pontos helyét és formátumát
- 💡 Tippeket és best practice-eket

**Célközönség:** Junior fejlesztők, akik PowerShell-t és vim-et használnak.

---

# TARTALOMJEGYZÉK

1. [Előkészületek és Környezet](#1-előkészületek-és-környezet)
2. [Kapcsolódás a Szerverhez](#2-kapcsolódás-a-szerverhez)
3. [Szerver Előkészítése](#3-szerver-előkészítése)
4. [Docker Telepítése](#4-docker-telepítése)
5. [Supabase Telepítése](#5-supabase-telepítése)
6. [Kulcsok Generálása - KRITIKUS RÉSZ](#6-kulcsok-generálása---kritikus-rész)
7. [Supabase Konfigurálása](#7-supabase-konfigurálása)
8. [Adatbázis Migrálása](#8-adatbázis-migrálása)
9. [Frontend Telepítése](#9-frontend-telepítése)
10. [Caddy Web Szerver](#10-caddy-web-szerver)
11. [DNS Beállítások](#11-dns-beállítások)
12. [Edge Functions](#12-edge-functions)
13. [Admin Felhasználó Létrehozása](#13-admin-felhasználó-létrehozása)
14. [Tesztelés és Verifikáció](#14-tesztelés-és-verifikáció)
15. [Karbantartás és Backup](#15-karbantartás-és-backup)
16. [HIBAELHÁRÍTÁSI GYŰJTEMÉNY](#16-hibaelhárítási-gyűjtemény)
17. [KULCS-REFERENCIA TÁBLÁZAT](#17-kulcs-referencia-táblázat)
18. [GYORS PARANCS-REFERENCIA](#18-gyors-parancs-referencia)

---

# 1. ELŐKÉSZÜLETEK ÉS KÖRNYEZET

## 1.1 Szükséges Információk Összegyűjtése

Mielőtt bármit csinálnál, gyűjtsd össze ezeket az információkat:

| Információ | Honnan szerzed | Példa érték |
|------------|----------------|-------------|
| VPS IP cím | MHosting admin → VPS kezelés | `92.118.26.81` |
| VPS root jelszó | MHosting regisztrációs email | `Ab12Cd34Ef56` |
| Domain név | Saját domain registrátor | `thecoach.hu` |
| Resend API kulcs | resend.com → API Keys | `re_xxxxxxxxxx` |
| Stripe titkos kulcs | stripe.com → Developers → API keys | `sk_live_xxxxxxxxxx` |
| Stripe publikus kulcs | stripe.com → Developers → API keys | `pk_live_xxxxxxxxxx` |

## 1.2 PowerShell Megnyitása

**Windows 10/11:**
1. Nyomd meg: `Win + X`
2. Válaszd: "Windows PowerShell" vagy "Terminal"

**VAGY:**
1. Nyomd meg: `Win + R`
2. Írd be: `powershell`
3. Nyomj Enter-t

⚠️ **BUKTATÓ:** Ne használj "Windows PowerShell (Admin)"-t, mert az SSH-val problémái lehetnek.
🔧 **MEGOLDÁS:** Használd a normál PowerShell-t, nem az Admin verziót.

## 1.3 SSH Kulcs Beállítása (Opcionális, de ajánlott)

Ha mindig jelszót kell megadnod, ez megkönnyíti:

```powershell
# SSH kulcs generálása
ssh-keygen -t rsa -b 4096

# Kulcs másolása a szerverre
type $env:USERPROFILE\.ssh\id_rsa.pub | ssh root@92.118.26.81 "cat >> ~/.ssh/authorized_keys"
```

⚠️ **BUKTATÓ:** "Permission denied" hibaüzenet
🔧 **MEGOLDÁS:** Ellenőrizd, hogy a szerveren létezik-e a `.ssh` mappa:
```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
```

---

# 2. KAPCSOLÓDÁS A SZERVERHEZ

## 2.1 Első Csatlakozás

```powershell
ssh root@92.118.26.81
```

**Várt kimenet:**
```
The authenticity of host '92.118.26.81 (92.118.26.81)' can't be established.
ECDSA key fingerprint is SHA256:xxxxxxxxxxxxxxxxxxx.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

Írd be: `yes` és nyomj Enter-t.

⚠️ **BUKTATÓ #1:** "Connection refused" hibaüzenet
🔧 **MEGOLDÁS:** 
1. Ellenőrizd az IP címet
2. Ellenőrizd, hogy a VPS fut-e (MHosting admin felület)
3. Próbálj várni 5 percet, ha frissen indított VPS

⚠️ **BUKTATÓ #2:** "Permission denied (publickey,password)" hibaüzenet
🔧 **MEGOLDÁS:**
1. Ellenőrizd a jelszót (figyelj a kis/nagybetűkre!)
2. Az MHosting-tól kapott eredeti jelszót használd
3. Ha nem megy, MHosting támogatásnál kérj jelszó-resetet

⚠️ **BUKTATÓ #3:** "Connection timed out"
🔧 **MEGOLDÁS:**
1. Ellenőrizd az internetedet
2. A VPS tűzfala blokkolhatja - MHosting supportot kérd meg a 22-es port megnyitására
3. Próbáld ping-elni: `ping 92.118.26.81`

## 2.2 Sikeres Bejelentkezés Után

Látnod kell valami ilyesmit:
```
Last login: Sat Jan 25 10:00:00 2025 from your.ip.address
[root@vps ~]#
```

**Fontos parancsok:**
```bash
# Hol vagyok?
pwd
# Kimenet: /root

# Rendszer info
cat /etc/os-release

# Lemezterület ellenőrzése
df -h
```

---

# 3. SZERVER ELŐKÉSZÍTÉSE

## 3.1 Rendszer Frissítése

**AlmaLinux/CentOS/Rocky Linux esetén:**
```bash
sudo dnf update -y
```

**Ubuntu/Debian esetén:**
```bash
sudo apt update && sudo apt upgrade -y
```

⚠️ **BUKTATÓ:** "Cannot find a valid baseurl" hiba (AlmaLinux)
🔧 **MEGOLDÁS:**
```bash
# DNS beállítás ellenőrzése
cat /etc/resolv.conf

# Ha üres, add hozzá:
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
```

⚠️ **BUKTATÓ:** A frissítés sokáig tart (10+ perc)
🔧 **MEGOLDÁS:** Ez normális! Ne szakítsd meg. Új VPS-nél sok frissítés lehet.

## 3.2 Szükséges Eszközök Telepítése

```bash
# AlmaLinux/CentOS
sudo dnf install -y git curl wget vim nano unzip tar

# Ubuntu/Debian
sudo apt install -y git curl wget vim nano unzip tar
```

## 3.3 Tűzfal Beállítása

```bash
# Firewalld telepítése és engedélyezése
sudo dnf install -y firewalld
sudo systemctl enable firewalld
sudo systemctl start firewalld

# Portok megnyitása
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload

# Ellenőrzés
sudo firewall-cmd --list-all
```

**Várt kimenet a list-all után:**
```
public (active)
  target: default
  services: dhcpv6-client http https ssh
  ports: 8000/tcp
  ...
```

⚠️ **BUKTATÓ:** "firewall-cmd: command not found"
🔧 **MEGOLDÁS:**
```bash
# Ubuntu esetén ufw-t használj:
sudo apt install -y ufw
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 8000/tcp
sudo ufw enable
```

## 3.4 Könyvtárstruktúra Létrehozása

```bash
# Frontend könyvtár
sudo mkdir -p /var/www/thecoach.hu

# Supabase könyvtár
sudo mkdir -p /opt/supabase

# Backup könyvtár
sudo mkdir -p /var/backups/thecoach

# Scripts könyvtár
sudo mkdir -p /opt/scripts

# Jogosultságok
sudo chown -R root:root /var/www/thecoach.hu
```

---

# 4. DOCKER TELEPÍTÉSE

## 4.1 Docker Engine Telepítése

```bash
# Hivatalos Docker script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

⚠️ **BUKTATÓ:** "curl: command not found"
🔧 **MEGOLDÁS:**
```bash
sudo dnf install -y curl
# Majd próbáld újra
```

⚠️ **BUKTATÓ:** "Cannot connect to the Docker daemon"
🔧 **MEGOLDÁS:**
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

## 4.2 Docker Compose Telepítése

```bash
# AlmaLinux/CentOS
sudo dnf install -y docker-compose-plugin

# Ubuntu
sudo apt install -y docker-compose-plugin
```

## 4.3 Docker Ellenőrzése

```bash
docker --version
# Várt: Docker version 24.x.x, build xxxxxxx

docker compose version
# Várt: Docker Compose version v2.x.x
```

⚠️ **BUKTATÓ:** "docker: permission denied"
🔧 **MEGOLDÁS:**
```bash
# A felhasználót hozzáadni a docker csoporthoz
sudo usermod -aG docker $USER
# FONTOS: Jelentkezz ki és be újra, vagy:
newgrp docker
```

---

# 5. SUPABASE TELEPÍTÉSE

## 5.1 Repository Klónozása

```bash
cd /opt/supabase

# Klónozás
sudo git clone --depth 1 https://github.com/supabase/supabase

# Belépés a docker könyvtárba
cd supabase/docker

# .env fájl létrehozása
sudo cp .env.example .env
```

⚠️ **BUKTATÓ:** "fatal: destination path 'supabase' already exists"
🔧 **MEGOLDÁS:**
```bash
# Ha már létezik, töröld és klónozd újra:
sudo rm -rf /opt/supabase/supabase
sudo git clone --depth 1 https://github.com/supabase/supabase
```

⚠️ **BUKTATÓ:** "git: command not found"
🔧 **MEGOLDÁS:**
```bash
sudo dnf install -y git
# vagy Ubuntu: sudo apt install -y git
```

## 5.2 Könyvtárstruktúra Ellenőrzése

```bash
ls -la /opt/supabase/supabase/docker/
```

**Látnod kell:**
```
drwxr-xr-x  5 root root  4096 Jan 25 10:00 .
drwxr-xr-x  9 root root  4096 Jan 25 10:00 ..
-rw-r--r--  1 root root  1234 Jan 25 10:00 .env
-rw-r--r--  1 root root  5678 Jan 25 10:00 .env.example
-rw-r--r--  1 root root 12345 Jan 25 10:00 docker-compose.yml
drwxr-xr-x  2 root root  4096 Jan 25 10:00 volumes
...
```

---

# 6. KULCSOK GENERÁLÁSA - KRITIKUS RÉSZ

## ⚠️ EZ A LEGFONTOSABB SZEKCIÓ! ⚠️

A legtöbb probléma a kulcsok helytelen generálásából vagy beállításából ered. Olvasd el NAGYON figyelmesen!

## 6.1 Szükséges Kulcsok Áttekintése

| Kulcs neve | Formátum | Hol használjuk | Hogyan néz ki |
|------------|----------|----------------|---------------|
| `POSTGRES_PASSWORD` | Véletlenszerű string | Supabase .env | `K7xN9mP2qR5vW8yB3cF6hJ4kL1nM0oS7` |
| `JWT_SECRET` | Base64 string (32+ kar) | Supabase .env | `aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV` |
| `ANON_KEY` | JWT token (eyJ...) | Mindenhol | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE4NjE5MjAwMDB9.xxxxx` |
| `SERVICE_ROLE_KEY` | JWT token (eyJ...) | Edge Functions | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MTg2MTkyMDAwMH0.xxxxx` |
| `DASHBOARD_PASSWORD` | Véletlenszerű string | Supabase Studio | `xY9zW8vU7tS6rQ5p` |

## 6.2 POSTGRES_PASSWORD Generálása

```bash
openssl rand -base64 32
```

**Példa kimenet:**
```
K7xN9mP2qR5vW8yB3cF6hJ4kL1nM0oS7gT8uI9oP
```

📝 **ÍRD LE EZT A KULCSOT!** Mentsd el egy biztonságos helyre (pl. jelszókezelő).

## 6.3 JWT_SECRET Generálása

```bash
openssl rand -base64 32
```

**Példa kimenet:**
```
aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uVwX3yZ4aB
```

📝 **ÍRD LE EZT A KULCSOT!** Ez KRITIKUS - minden JWT kulcs ezen alapul!

## 6.4 ANON_KEY és SERVICE_ROLE_KEY Generálása

### Opció A: Online JWT.io használatával (Ajánlott kezdőknek)

1. Nyisd meg a böngészőben: **https://jwt.io**

2. A bal oldalon válaszd ki: **Algorithm: HS256**

3. **ANON_KEY generálásához** a PAYLOAD mezőbe másold be PONTOSAN ezt:

```json
{
  "role": "anon",
  "iss": "supabase",
  "iat": 1704067200,
  "exp": 1861920000
}
```

4. A jobb oldalon, a **"VERIFY SIGNATURE"** részben:
   - A `your-256-bit-secret` helyére írd be a **JWT_SECRET**-et amit az előbb generáltál
   - **NE** pipáld be a "secret base64 encoded" opciót!

5. A bal oldalon az **"Encoded"** mezőben megjelenik az **ANON_KEY**. Másold ki!

6. **SERVICE_ROLE_KEY generálásához** cseréld ki a PAYLOAD-ot erre:

```json
{
  "role": "service_role",
  "iss": "supabase",
  "iat": 1704067200,
  "exp": 1861920000
}
```

7. Ugyanazzal a **JWT_SECRET**-tel generáld le, és másold ki az Encoded mezőből.

### Opció B: Parancssorból (Haladóknak)

```bash
# Telepítsd a jwt-cli-t (ha van npm):
npm install -g jwt-cli

# ANON_KEY
jwt sign '{"role":"anon","iss":"supabase","iat":1704067200,"exp":1861920000}' "A_TE_JWT_SECRETED_IDE" --algorithm HS256

# SERVICE_ROLE_KEY
jwt sign '{"role":"service_role","iss":"supabase","iat":1704067200,"exp":1861920000}' "A_TE_JWT_SECRETED_IDE" --algorithm HS256
```

## 6.5 DASHBOARD_PASSWORD Generálása

```bash
openssl rand -base64 16
```

**Példa kimenet:**
```
xY9zW8vU7tS6rQ5pAb1C
```

## 6.6 Kulcsok Ellenőrzése

### ⚠️ KRITIKUS ELLENŐRZÉSI PONTOK:

1. **Az ANON_KEY és SERVICE_ROLE_KEY is `eyJ`-vel kezdődik?**
   - ✅ Helyes: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - ❌ Hibás: `aGVsbG8gd29ybGQ=` (ez nem JWT!)

2. **Az ANON_KEY és SERVICE_ROLE_KEY KÜLÖNBÖZŐ?**
   - ✅ Helyes: Két különböző token, de mindkettő `eyJ`-vel kezdődik
   - ❌ Hibás: Ugyanaz a két kulcs

3. **A JWT_SECRET azonos mindkét token generálásánál?**
   - ✅ MUSZÁJ ugyanannak lennie!
   - ❌ Ha különböző, a tokenek nem fognak működni!

4. **A PAYLOAD pontosan helyes?**
   - `role` mező: "anon" vagy "service_role"
   - `iss` mező: "supabase" (PONTOSAN így!)
   - `iat` és `exp` számok, nem stringek!

### JWT Token Dekódolása Ellenőrzéshez

```bash
# Másold be az ANON_KEY-t és dekódold:
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE4NjE5MjAwMDB9.xxxxx" | cut -d. -f2 | base64 -d 2>/dev/null; echo
```

**Várt kimenet:**
```json
{"role":"anon","iss":"supabase","iat":1704067200,"exp":1861920000}
```

---

## 6.7 🔴 JWT.IO HIBAELHÁRÍTÁS - "Signature Verification Failed"

Ez az egyik LEGGYAKORIBB probléma! Ha a jwt.io oldalon "signature verification failed" hibát kapsz, itt vannak a lehetséges okok és megoldások:

### ⚠️ BUKTATÓ #1: "secret base64 encoded" checkbox

**Probléma:** A jwt.io oldalon be van pipálva a "secret base64 encoded" checkbox, de a JWT_SECRET-ed NEM base64 kódolt.

**MEGOLDÁS:**

1. Menj a jwt.io oldalra
2. Másold be a JWT tokent (ANON_KEY vagy SERVICE_ROLE_KEY) a bal oldali "Encoded" mezőbe
3. Görgess le a "VERIFY SIGNATURE" szekcióhoz
4. **FONTOS:** Ellenőrizd a "secret base64 encoded" checkboxot:
   
   **Ha az openssl-lel generáltad a JWT_SECRET-et (`openssl rand -base64 32`):**
   - A secret MAGA base64 formátumú, DE a jwt.io-n **NE pipáld be** a "secret base64 encoded" opciót!
   - Egyszerűen másold be a nyers secret-et
   
   **Miért?** Az `openssl rand -base64 32` egy base64-kódolt STRINGET ad vissza, de ezt a stringet használjuk közvetlenül secretként, nem dekódoljuk tovább.

### ⚠️ BUKTATÓ #2: Extra karakterek a secret-ben

**Probléma:** A JWT_SECRET-ben van szóköz, sortörés, vagy idézőjel.

**MEGOLDÁS:**
```bash
# Ellenőrizd a .env fájlban:
cat /opt/supabase/supabase/docker/.env | grep JWT_SECRET

# HELYES formátum:
JWT_SECRET=K7xN9mP2qR5vW8yB3cF6hJ4kL1nM0oS7gT8uI9oP

# HIBÁS formátumok:
JWT_SECRET="K7xN9mP2qR5vW8yB3cF6hJ4kL1nM0oS7gT8uI9oP"   # ❌ Idézőjel!
JWT_SECRET= K7xN9mP2qR5vW8yB3cF6hJ4kL1nM0oS7gT8uI9oP  # ❌ Szóköz az = után!
JWT_SECRET=K7xN9mP2qR5vW8yB3cF6hJ4kL1nM0oS7gT8uI9oP   # ❌ Sortörés a végén!
```

### ⚠️ BUKTATÓ #3: Eltérő secret a token generálásnál

**Probléma:** Más JWT_SECRET-tel generáltad a tokent, mint ami a .env fájlban van.

**MEGOLDÁS:**
1. Írd le a JWT_SECRET-et amit használsz
2. Generáld ÚJRA az ANON_KEY és SERVICE_ROLE_KEY tokeneket EZZEL a secrettel
3. Frissítsd a .env fájlt az új tokenekkel

### 🔧 LÉPÉSRŐL-LÉPÉSRE JWT VERIFIKÁCIÓ JWT.IO-N

1. **Nyisd meg:** https://jwt.io

2. **Bal oldal - Encoded mező:**
   - Másold be az ANON_KEY-t TELJESEN
   - Példa: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE4NjE5MjAwMDB9.abc123xyz`

3. **Jobb oldal - Decoded HEADER:**
   - Ezt látod: `{"alg": "HS256", "typ": "JWT"}`
   - Ha nem HS256, akkor hibás a token!

4. **Jobb oldal - Decoded PAYLOAD:**
   - Ezt látod: `{"role": "anon", "iss": "supabase", "iat": 1704067200, "exp": 1861920000}`
   - Ellenőrizd, hogy a role "anon" vagy "service_role"

5. **Jobb oldal - VERIFY SIGNATURE:**
   - Írd be: `HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), `**A_TE_JWT_SECRET_IDE**`)`
   - A `your-256-bit-secret` szöveget cseréld ki a JWT_SECRET-edre
   - **NE pipáld be** a "secret base64 encoded" opciót!

6. **Eredmény:**
   - ✅ Ha "Signature Verified" zöld pipa jelenik meg → SIKER!
   - ❌ Ha "Invalid Signature" → Ellenőrizd újra a secretet

### 🔧 ALTERNATÍV ELLENŐRZÉS PARANCSSORBÓL

Ha a jwt.io nem működik, használd ezt:

```bash
# Telepítsd a jwt-cli-t
npm install -g jwt-cli

# Ellenőrizd az ANON_KEY-t
jwt decode "A_TE_ANON_KEY_IDE"

# Ellenőrizd a signature-t a secrettel
jwt verify "A_TE_ANON_KEY_IDE" --secret "A_TE_JWT_SECRET_IDE"
```

### 🔧 VÉGSŐ MEGOLDÁS: ÚJ KULCSOK GENERÁLÁSA

Ha semmi nem működik, generálj TELJESEN ÚJ kulcsokat:

```bash
# 1. Új JWT_SECRET
JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
echo "Új JWT_SECRET: $JWT_SECRET"

# 2. Írd le ezt a secretet!

# 3. Menj jwt.io-ra és generálj új ANON_KEY-t és SERVICE_ROLE_KEY-t ezzel a secrettel

# 4. Frissítsd a .env fájlt az összes új kulccsal

# 5. Indítsd újra a Supabase-t
cd /opt/supabase/supabase/docker
docker compose down
docker compose up -d
```

### 📋 JWT HIBÁK GYORS REFERENCIA

| Hibaüzenet | Lehetséges ok | Megoldás |
|------------|---------------|----------|
| "signature verification failed" | Rossz secret a jwt.io-n | Pontosan másold be a JWT_SECRET-et, ne pipáld be a base64 checkboxot |
| "Invalid Signature" | Token és secret nem egyezik | Generálj új tokent a helyes secrettel |
| "Malformed JWT" | A token formátuma hibás | Ellenőrizd, hogy 3 részből áll (pont-tal elválasztva) |
| "JWT expired" | Az exp érték a múltban van | Használj jövőbeli exp értéket: 1861920000 |
| "Invalid claims" | A payload hibás | Ellenőrizd a role, iss mezőket |

---

⚠️ **BUKTATÓ:** "Invalid JWT" hiba a Supabase indításakor
🔧 **MEGOLDÁS:** 
1. A JWT_SECRET PONTOSAN ugyanaz legyen a .env fájlban mint amit a token generálásánál használtál
2. Ne legyen szóköz vagy sortörés a JWT_SECRET-ben
3. Ne legyen idézőjel a JWT_SECRET körül a .env fájlban

⚠️ **BUKTATÓ:** "JWT expired" hiba
🔧 **MEGOLDÁS:**
Az `exp` (expiration) érték legyen a jövőben. `1861920000` = 2029. január 1.

---

# 7. SUPABASE KONFIGURÁLÁSA

## 7.1 A .env Fájl Szerkesztése

```bash
cd /opt/supabase/supabase/docker
sudo vim .env
```

## 7.2 VIM Használata - Részletes Útmutató

**VIM módok:**
- **Normál mód** - Alapértelmezett, parancsokhoz
- **Beszúrás mód** - Szöveg írásához
- **Parancs mód** - Mentés, kilépés, keresés

**Gyakori parancsok:**

| Billentyű | Mit csinál |
|-----------|------------|
| `i` | Beszúrás mód indítása (a kurzor előtt) |
| `a` | Beszúrás mód indítása (a kurzor után) |
| `Esc` | Visszatérés normál módba |
| `:wq` | Mentés és kilépés |
| `:q!` | Kilépés mentés nélkül |
| `:w` | Mentés (maradás a fájlban) |
| `/szöveg` | Keresés |
| `n` | Következő találat |
| `dd` | Sor törlése |
| `u` | Visszavonás |
| `yy` | Sor másolása |
| `p` | Beillesztés |
| `G` | Ugrás a fájl végére |
| `gg` | Ugrás a fájl elejére |

## 7.3 Szerkesztendő Változók

Keresd meg és módosítsd az alábbi sorokat. Használd a `/` parancsot kereséshez!

```bash
# Nyomj: /POSTGRES_PASSWORD
# Majd Enter, és megtalálod a sort
```

### A teljes .env fájl szerkesztése:

```env
############
# Secrets
# EZEKET CSERÉLD KI A SAJÁT GENERÁLT ÉRTÉKEIDRE!
############

POSTGRES_PASSWORD=IDE_A_TE_POSTGRES_JELSZAVAD

JWT_SECRET=IDE_A_TE_JWT_SECRETED

ANON_KEY=IDE_A_TE_ANON_KEYED

SERVICE_ROLE_KEY=IDE_A_TE_SERVICE_ROLE_KEYED

DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=IDE_A_TE_DASHBOARD_JELSZAVAD

############
# Database
############

POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432

############
# API & Auth
############

SITE_URL=https://thecoach.hu
API_EXTERNAL_URL=https://api.thecoach.hu

############
# Kong (API Gateway)
############

KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

############
# Studio
############

STUDIO_PORT=3000
```

## 7.4 Mentés és Ellenőrzés

```bash
# Mentés vim-ben: Esc, majd :wq

# Ellenőrzés - a változók be vannak-e állítva:
grep "POSTGRES_PASSWORD" .env
grep "JWT_SECRET" .env
grep "ANON_KEY" .env
grep "API_EXTERNAL_URL" .env
```

⚠️ **BUKTATÓ:** A vim "E45: 'readonly' option is set" hibát ad
🔧 **MEGOLDÁS:**
```bash
# Használj sudo-t:
sudo vim .env
```

⚠️ **BUKTATÓ:** Véletlen karakterek kerültek a fájlba
🔧 **MEGOLDÁS:**
```bash
# Kilépés mentés nélkül:
:q!
# Újrakezdés:
sudo vim .env
```

## 7.5 Supabase Indítása

```bash
cd /opt/supabase/supabase/docker
sudo docker compose up -d
```

**Várt kimenet:**
```
[+] Running 12/12
 ✔ Network docker_default          Created
 ✔ Container supabase-db           Started
 ✔ Container supabase-vector       Started
 ✔ Container supabase-analytics    Started
 ✔ Container supabase-auth         Started
 ✔ Container supabase-rest         Started
 ✔ Container supabase-storage      Started
 ✔ Container supabase-meta         Started
 ✔ Container supabase-realtime     Started
 ✔ Container supabase-functions    Started
 ✔ Container supabase-kong         Started
 ✔ Container supabase-studio       Started
```

⚠️ **BUKTATÓ:** Egyes konténerek nem indulnak el
🔧 **MEGOLDÁS:**
```bash
# Logok ellenőrzése
sudo docker compose logs

# Specifikus konténer logja
sudo docker compose logs db
sudo docker compose logs auth

# Újraindítás
sudo docker compose down
sudo docker compose up -d
```

⚠️ **BUKTATÓ:** "port is already allocated" hiba
🔧 **MEGOLDÁS:**
```bash
# Melyik folyamat használja a portot?
sudo netstat -tlnp | grep 8000

# Öld meg a folyamatot:
sudo kill -9 [PID]

# Próbáld újra
sudo docker compose up -d
```

## 7.6 Indulás Ellenőrzése

```bash
# Státusz ellenőrzése
sudo docker compose ps
```

**Minden konténernek "Up" státuszban kell lennie!**

```
NAME                      STATUS
supabase-analytics        Up 2 minutes
supabase-auth             Up 2 minutes
supabase-db               Up 2 minutes
supabase-functions        Up 2 minutes
supabase-kong             Up 2 minutes
supabase-meta             Up 2 minutes
supabase-realtime         Up 2 minutes
supabase-rest             Up 2 minutes
supabase-storage          Up 2 minutes
supabase-studio           Up 2 minutes
supabase-vector           Up 2 minutes
```

⚠️ **BUKTATÓ:** Egy konténer "Restarting" vagy "Exit" státuszban van
🔧 **MEGOLDÁS:**
```bash
# A konténer logjainak ellenőrzése
sudo docker compose logs [KONTÉNER_NÉV]

# Gyakori ok: helytelen JWT kulcsok
# Ellenőrizd a .env fájlt!
```

---

# 8. ADATBÁZIS MIGRÁLÁSA

## 8.1 SQL Fájlok Letöltése a Lovable Adminról

1. Nyisd meg böngészőben: `https://[lovable-preview-url]/admin/database-export`
2. Kattints: **"Séma Letöltése"** → `adatbazis_sema_*.sql` fájl letöltődik
3. Kattints: **"Adatok Letöltése"** → `teljes_adatbazis_export_*.sql` fájl letöltődik

## 8.2 SQL Fájlok Feltöltése a Szerverre

**PowerShell-ben (a saját gépeden):**

```powershell
# Navigálás a letöltések mappába
cd C:\Users\[FELHASZNALONEV]\Downloads

# Lista ellenőrzése
dir *.sql

# Séma feltöltése
scp adatbazis_sema_*.sql root@92.118.26.81:/tmp/schema.sql

# Adatok feltöltése
scp teljes_adatbazis_export_*.sql root@92.118.26.81:/tmp/data.sql
```

⚠️ **BUKTATÓ:** "scp: command not found" Windows-on
🔧 **MEGOLDÁS:** PowerShell-ben az SCP beépített, de ha nem működik:
```powershell
# Ellenőrizd, hogy az OpenSSH telepítve van:
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH*'

# Ha nincs, telepítsd:
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

⚠️ **BUKTATÓ:** A fájlnévben speciális karakterek vannak
🔧 **MEGOLDÁS:**
```powershell
# Idézőjelben add meg a fájlnevet:
scp "adatbazis_sema_2025-01-25.sql" root@92.118.26.81:/tmp/schema.sql
```

## 8.3 SQL Fájlok Importálása

**SSH-n keresztül a szerveren:**

```bash
# Csatlakozás
ssh root@92.118.26.81

# Navigálás
cd /opt/supabase/supabase/docker

# 1. SÉMA IMPORTÁLÁSA (ELŐSZÖR!)
cat /tmp/schema.sql | sudo docker compose exec -T db psql -U postgres -d postgres

# 2. ADATOK IMPORTÁLÁSA (UTÁNA!)
cat /tmp/data.sql | sudo docker compose exec -T db psql -U postgres -d postgres
```

⚠️ **BUKTATÓ:** "relation does not exist" hiba
🔧 **MEGOLDÁS:**
1. Ellenőrizd, hogy ELŐSZÖR a sémát importáltad-e
2. Ellenőrizd a séma SQL fájlt - tartalmaznia kell a CREATE TABLE utasításokat

⚠️ **BUKTATÓ:** "permission denied for schema public" hiba
🔧 **MEGOLDÁS:**
```bash
# Jogosultságok beállítása
sudo docker compose exec db psql -U postgres -c "GRANT ALL ON SCHEMA public TO postgres;"
sudo docker compose exec db psql -U postgres -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;"
```

⚠️ **BUKTATÓ:** "duplicate key value violates unique constraint" hiba
🔧 **MEGOLDÁS:**
```bash
# Az adat már létezik. Töröld először:
sudo docker compose exec db psql -U postgres -c "TRUNCATE TABLE [TÁBLANÉV] CASCADE;"
# Majd próbáld újra az importálást
```

## 8.4 Importálás Ellenőrzése

```bash
# Csatlakozás a PostgreSQL-hez
sudo docker compose exec db psql -U postgres -d postgres

# Táblák listázása
\dt

# Adatok számolása
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM faqs;
SELECT COUNT(*) FROM user_roles;

# Kilépés
\q
```

## 8.5 Storage Bucket-ek Létrehozása

```bash
# Csatlakozás PostgreSQL-hez
sudo docker compose exec db psql -U postgres -d postgres
```

```sql
-- Bucket-ek létrehozása
INSERT INTO storage.buckets (id, name, public) 
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('book-files', 'book-files', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('email_attachments', 'email_attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Ellenőrzés
SELECT id, name, public FROM storage.buckets;

-- Kilépés
\q
```

---

# 9. FRONTEND TELEPÍTÉSE

## 9.1 Node.js Telepítése

```bash
# AlmaLinux/CentOS
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Ellenőrzés
node --version
npm --version
```

**Várt verziók:**
- Node.js: v18.x.x vagy újabb
- npm: 9.x.x vagy újabb

⚠️ **BUKTATÓ:** Régi Node.js verzió van telepítve
🔧 **MEGOLDÁS:**
```bash
# Régi verzió eltávolítása
sudo dnf remove nodejs -y

# Új verzió telepítése
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs
```

## 9.2 Forráskód Feltöltése

**A saját gépeden (PowerShell):**

```powershell
# Navigálás a projekt könyvtárba
cd C:\projektek\thecoach

# Projekt tömörítése (node_modules nélkül!)
# Először törölj ki mindent ami nem kell:
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force dist

# Tömörítés
Compress-Archive -Path .\* -DestinationPath thecoach.zip

# Feltöltés
scp thecoach.zip root@92.118.26.81:/var/www/
```

**A szerveren:**

```bash
cd /var/www

# Kicsomagolás
unzip thecoach.zip -d thecoach.hu

# Ellenőrzés
ls -la thecoach.hu/
```

## 9.3 Production Környezeti Változók

```bash
cd /var/www/thecoach.hu
sudo vim .env.production
```

**Tartalom:**

```env
# Supabase kapcsolat - KRITIKUS BEÁLLÍTÁSOK!
VITE_SUPABASE_URL=https://api.thecoach.hu
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (opcionális, ha van fizetés)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxx
```

⚠️ **KRITIKUS:** A `VITE_SUPABASE_PUBLISHABLE_KEY` értéke PONTOSAN az `ANON_KEY` amit generáltál!

⚠️ **BUKTATÓ:** Frontend nem tud csatlakozni a backend-hez
🔧 **MEGOLDÁS:**
1. Ellenőrizd, hogy a VITE_SUPABASE_URL = https://api.thecoach.hu
2. Ellenőrizd, hogy az ANON_KEY megegyezik a Supabase .env-ben lévővel
3. Ellenőrizd a CORS beállításokat a Caddyfile-ban

## 9.4 Dependencies Telepítése és Build

```bash
cd /var/www/thecoach.hu

# Dependencies telepítése
npm install

# Production build
npm run build
```

⚠️ **BUKTATÓ:** "npm ERR! ERESOLVE unable to resolve dependency tree"
🔧 **MEGOLDÁS:**
```bash
npm install --legacy-peer-deps
```

⚠️ **BUKTATÓ:** "JavaScript heap out of memory" hiba
🔧 **MEGOLDÁS:**
```bash
# Memória limit növelése
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

⚠️ **BUKTATÓ:** Build hiba TypeScript-tel
🔧 **MEGOLDÁS:**
```bash
# Ellenőrizd a TypeScript verziókat
npm list typescript

# Ha kell, frissítsd:
npm update typescript --legacy-peer-deps
```

## 9.5 Build Ellenőrzése

```bash
# A dist mappa létrejött?
ls -la dist/

# Tartalmazza az index.html-t?
ls -la dist/index.html

# Assets mappa?
ls -la dist/assets/
```

---

# 10. CADDY WEB SZERVER

## 10.1 Caddy Telepítése

**AlmaLinux/CentOS:**
```bash
sudo dnf install -y 'dnf-command(copr)'
sudo dnf copr enable @caddy/caddy -y
sudo dnf install -y caddy
```

**Ubuntu/Debian:**
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

## 10.2 Caddyfile Konfigurálása

```bash
sudo vim /etc/caddy/Caddyfile
```

**Teljes Caddyfile tartalom:**

```caddyfile
# ===========================================
# TheCoach.hu - Caddy Konfiguráció
# ===========================================

# FRONTEND
thecoach.hu, www.thecoach.hu {
    # Automatikus HTTPS (Let's Encrypt)
    
    # Tömörítés
    encode gzip
    
    # Root könyvtár
    root * /var/www/thecoach.hu/dist
    
    # SPA támogatás
    try_files {path} /index.html
    
    # Fájl kiszolgálás
    file_server
    
    # Cache az assets-hez
    @assets {
        path /assets/*
    }
    header @assets Cache-Control "public, max-age=31536000, immutable"
    
    # Biztonsági fejlécek
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
        Referrer-Policy strict-origin-when-cross-origin
    }
}

# BACKEND API
api.thecoach.hu {
    # CORS preflight
    @cors_preflight method OPTIONS
    handle @cors_preflight {
        header Access-Control-Allow-Origin "https://thecoach.hu"
        header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS"
        header Access-Control-Allow-Headers "Authorization, Content-Type, apikey, x-client-info"
        header Access-Control-Max-Age "86400"
        respond "" 204
    }
    
    # Reverse proxy a Supabase Kong-hoz
    reverse_proxy localhost:8000 {
        header_down Access-Control-Allow-Origin "https://thecoach.hu"
        header_down Access-Control-Allow-Credentials "true"
        header_up Host {upstream_hostport}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

## 10.3 Caddy Indítása

```bash
# Konfiguráció ellenőrzése
sudo caddy validate --config /etc/caddy/Caddyfile

# Engedélyezés és indítás
sudo systemctl enable caddy
sudo systemctl start caddy

# Státusz
sudo systemctl status caddy
```

⚠️ **BUKTATÓ:** "Caddyfile: adapt: parsing caddyfile: ..." szintaktikai hiba
🔧 **MEGOLDÁS:**
```bash
# Ellenőrizd a szintaxist
sudo caddy fmt --overwrite /etc/caddy/Caddyfile

# Próbáld újra validálni
sudo caddy validate --config /etc/caddy/Caddyfile
```

⚠️ **BUKTATÓ:** "bind: permission denied" hiba 80/443 porton
🔧 **MEGOLDÁS:**
```bash
# Jogosultság beállítása
sudo setcap 'cap_net_bind_service=+ep' /usr/bin/caddy
```

---

# 11. DNS BEÁLLÍTÁSOK

## 11.1 Szükséges DNS Rekordok

Menj a domain regisztrátorhoz és állítsd be:

| Típus | Név | Érték | TTL |
|-------|-----|-------|-----|
| A | @ | 92.118.26.81 | 3600 |
| A | www | 92.118.26.81 | 3600 |
| A | api | 92.118.26.81 | 3600 |

## 11.2 MHosting Specifikus Beállítások

Ha a domain is MHosting-nál van:
1. MHosting admin → Domain kezelés → [domain.hu] → DNS kezelés
2. Töröld a meglévő A rekordokat
3. Adj hozzá új A rekordokat a fenti táblázat szerint

## 11.3 DNS Ellenőrzése

```powershell
# PowerShell-ben:
nslookup thecoach.hu
nslookup api.thecoach.hu
```

**Várt eredmény:**
```
Server:  dns.server.address
Address:  x.x.x.x

Name:    thecoach.hu
Address:  92.118.26.81
```

⚠️ **BUKTATÓ:** DNS nem propagálódik
🔧 **MEGOLDÁS:**
1. Várj 15-60 percet (vagy akár 24-48 órát)
2. Ellenőrizd online: https://dnschecker.org
3. Próbálj más DNS szervert: `nslookup thecoach.hu 8.8.8.8`

---

# 12. EDGE FUNCTIONS

## 12.1 Deno Telepítése

```bash
# Deno telepítése
curl -fsSL https://deno.land/install.sh | sh

# PATH hozzáadása
echo 'export DENO_INSTALL="/root/.deno"' >> ~/.bashrc
echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Ellenőrzés
deno --version
```

## 12.2 Edge Functions Másolása

```bash
# Másolás a Supabase volumes-ba
sudo cp -r /var/www/thecoach.hu/supabase/functions/* /opt/supabase/supabase/docker/volumes/functions/

# Jogosultságok
sudo chown -R root:root /opt/supabase/supabase/docker/volumes/functions/
```

## 12.3 Edge Function Secrets Beállítása

```bash
# Navigálás
cd /opt/supabase/supabase/docker

# Functions secrets fájl létrehozása
sudo vim .env.functions
```

**Tartalom:**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=info@thecoach.hu
SITE_URL=https://thecoach.hu
STRIPE_DEPOSIT_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxx
SUPABASE_URL=http://kong:8000
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 12.4 Docker Compose Módosítása

```bash
sudo vim docker-compose.yml
```

Keresd meg a `functions` részt és győződj meg róla, hogy az env_file be van állítva:

```yaml
functions:
  container_name: supabase-functions
  image: supabase/edge-runtime:v1.29.1
  restart: unless-stopped
  env_file:
    - .env.functions
  # ... többi beállítás ...
```

## 12.5 Supabase Újraindítása

```bash
cd /opt/supabase/supabase/docker
sudo docker compose down
sudo docker compose up -d
```

---

# 13. ADMIN FELHASZNÁLÓ LÉTREHOZÁSA

## 13.1 Admin Email és Jelszó Beállítása

A frontend Auth oldalán regisztrálj egy új felhasználót:
1. Nyisd meg: https://thecoach.hu/auth
2. Válaszd a "Regisztráció" fület
3. Add meg az email címet és jelszót
4. Kattints "Regisztráció"

## 13.2 Admin Jogosultság Hozzáadása

```bash
cd /opt/supabase/supabase/docker
sudo docker compose exec db psql -U postgres -d postgres
```

```sql
-- Keresd meg a felhasználó ID-ját
SELECT id, email FROM auth.users;

-- Admin role hozzáadása (cseréld ki az ID-t!)
INSERT INTO user_roles (user_id, role)
VALUES ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Ellenőrzés
SELECT * FROM user_roles;

-- Kilépés
\q
```

⚠️ **BUKTATÓ:** "Invalid login credentials" hiba bejelentkezéskor
🔧 **MEGOLDÁS:**
1. Ellenőrizd, hogy a felhasználó létrejött-e az auth.users táblában
2. Ellenőrizd a jelszót
3. Ellenőrizd, hogy az email cím helyes-e

⚠️ **BUKTATÓ:** Admin felület nem tölt be (403 Forbidden)
🔧 **MEGOLDÁS:**
1. Ellenőrizd, hogy a user_roles táblában van-e admin bejegyzés
2. Ellenőrizd az RLS policy-kat

---

# 14. TESZTELÉS ÉS VERIFIKÁCIÓ

## 14.1 Szolgáltatások Ellenőrzése

```bash
# Caddy
sudo systemctl status caddy

# Docker konténerek
cd /opt/supabase/supabase/docker
sudo docker compose ps
```

## 14.2 API Tesztelése

```bash
# Health check
curl -I https://api.thecoach.hu/rest/v1/

# Tábla lekérdezés (cseréld ki az ANON_KEY-t!)
curl -H "apikey: eyJ..." \
     -H "Authorization: Bearer eyJ..." \
     "https://api.thecoach.hu/rest/v1/products?select=id,title_hu"
```

## 14.3 Teljes Checklist

| # | Teszt | Ellenőrzés | Elvárás |
|---|-------|------------|---------|
| 1 | Frontend betölt | Böngészőben: https://thecoach.hu | Főoldal megjelenik |
| 2 | HTTPS működik | Lakat ikon a böngészőben | Zöld lakat |
| 3 | API válaszol | curl https://api.thecoach.hu/rest/v1/ | JSON válasz |
| 4 | Termékek megjelennek | Főoldal könyvek szekció | Könyvek láthatók |
| 5 | Admin belépés | /auth → Bejelentkezés | Dashboard betölt |
| 6 | Admin műveletek | Termék szerkesztése | Mentés működik |
| 7 | Foglalás | Szolgáltatások → Foglalás | Űrlap működik |
| 8 | Email küldés | Admin → Email kampány | Email kiküldve |

---

# 15. KARBANTARTÁS ÉS BACKUP

## 15.1 Automatikus Backup Script

```bash
sudo vim /opt/scripts/backup.sh
```

```bash
#!/bin/bash
# TheCoach.hu Backup Script

BACKUP_DIR="/var/backups/thecoach"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

# PostgreSQL backup
cd /opt/supabase/supabase/docker
docker compose exec -T db pg_dump -U postgres postgres > $BACKUP_DIR/db_$DATE.sql

# Storage backup
tar -czvf $BACKUP_DIR/storage_$DATE.tar.gz /opt/supabase/supabase/docker/volumes/storage/

# Frontend backup
tar -czvf $BACKUP_DIR/frontend_$DATE.tar.gz /var/www/thecoach.hu/

# Régi backupok törlése
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
```

```bash
# Futtathatóvá tétel
sudo chmod +x /opt/scripts/backup.sh

# Cron job
sudo crontab -e

# Add hozzá:
0 3 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1
```

## 15.2 Manuális Backup

```bash
# Adatbázis
cd /opt/supabase/supabase/docker
sudo docker compose exec -T db pg_dump -U postgres postgres > ~/backup_$(date +%Y%m%d).sql

# Letöltés PowerShell-ből:
scp root@92.118.26.81:~/backup_*.sql C:\Users\[FELHASZNALO]\Downloads\
```

---

# 16. HIBAELHÁRÍTÁSI GYŰJTEMÉNY

## 16.1 Frontend Hibák

### "Failed to fetch" hiba

**Tünetek:** A frontend nem tud adatokat lekérni az API-ból.

**Okok és megoldások:**

| Ok | Megoldás |
|---|----------|
| Rossz VITE_SUPABASE_URL | Ellenőrizd a .env.production fájlt |
| CORS hiba | Ellenőrizd a Caddyfile CORS beállításait |
| API nem elérhető | `curl https://api.thecoach.hu/rest/v1/` |
| Rossz ANON_KEY | Győződj meg róla, hogy megegyezik |

### Üres oldal betöltődik

**Megoldás:**
```bash
# Ellenőrizd, hogy a dist mappa létezik
ls /var/www/thecoach.hu/dist/

# Ha üres, újra kell buildelni
cd /var/www/thecoach.hu
npm run build
```

## 16.2 API/Backend Hibák

### "Invalid JWT" hiba

**Megoldás:**
1. Ellenőrizd, hogy a JWT_SECRET azonos:
   - A Supabase .env fájlban
   - És a JWT token generálásánál használtad
2. Újrageneráld a kulcsokat azonos JWT_SECRET-tel

### "Connection refused" hiba

**Megoldás:**
```bash
# Docker konténerek ellenőrzése
sudo docker compose ps

# Ha valami nem fut
sudo docker compose restart

# Kong logok
sudo docker compose logs kong
```

## 16.3 Adatbázis Hibák

### "relation does not exist" hiba

**Megoldás:**
1. Séma nincs importálva → Importáld a schema.sql-t
2. Rossz adatbázis → Győződj meg, hogy postgres-be importálsz

### "permission denied for table" hiba

**Megoldás:**
```sql
-- PostgreSQL-ben
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

## 16.4 SSL/HTTPS Hibák

### "SSL certificate problem" hiba

**Megoldás:**
```bash
# Caddy újratöltése
sudo systemctl reload caddy

# Logok
sudo journalctl -u caddy -f

# DNS ellenőrzése
nslookup thecoach.hu
nslookup api.thecoach.hu
```

## 16.5 Edge Function Hibák

### "Function not found" hiba

**Megoldás:**
```bash
# Ellenőrizd, hogy a functions mappában vannak a fájlok
ls /opt/supabase/supabase/docker/volumes/functions/

# Docker újraindítása
sudo docker compose restart functions

# Logok
sudo docker compose logs functions
```

### "Missing environment variable" hiba

**Megoldás:**
1. Ellenőrizd a .env.functions fájlt
2. Győződj meg, hogy minden szükséges változó be van állítva
3. Újraindítás: `sudo docker compose restart functions`

---

# 17. KULCS-REFERENCIA TÁBLÁZAT

## 17.1 Hol Találod a Kulcsokat

| Kulcs neve | Helye | Fájl |
|------------|-------|------|
| POSTGRES_PASSWORD | VPS | `/opt/supabase/supabase/docker/.env` |
| JWT_SECRET | VPS | `/opt/supabase/supabase/docker/.env` |
| ANON_KEY | VPS + Frontend | `.env` és `.env.production` |
| SERVICE_ROLE_KEY | VPS | `.env` és `.env.functions` |
| RESEND_API_KEY | VPS | `/opt/supabase/supabase/docker/.env.functions` |
| STRIPE_SECRET_KEY | VPS | `/opt/supabase/supabase/docker/.env.functions` |

## 17.2 Kulcs Formátum Ellenőrzés

| Kulcs | Formátum | Példa kezdet |
|-------|----------|--------------|
| POSTGRES_PASSWORD | Base64 string | `K7xN9mP2...` |
| JWT_SECRET | Base64 string | `aB3cD4eF...` |
| ANON_KEY | JWT token | `eyJhbGci...` |
| SERVICE_ROLE_KEY | JWT token | `eyJhbGci...` |
| RESEND_API_KEY | `re_` prefix | `re_xxxxxxx...` |
| STRIPE_SECRET_KEY | `sk_live_` vagy `sk_test_` | `sk_live_...` |
| STRIPE_PUBLISHABLE_KEY | `pk_live_` vagy `pk_test_` | `pk_live_...` |

## 17.3 Kulcs Megfeleltetés Lovable Cloud ↔ Self-Hosted

| Lovable Cloud név | Self-Hosted megfelelő | Megjegyzés |
|-------------------|----------------------|------------|
| `VITE_SUPABASE_URL` | `https://api.thecoach.hu` | Frontend |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `ANON_KEY` | Frontend |
| `SUPABASE_URL` (Edge Fn) | `http://kong:8000` | Belső |
| `SUPABASE_SERVICE_ROLE_KEY` | `SERVICE_ROLE_KEY` | Edge Fn |
| `SUPABASE_ANON_KEY` | `ANON_KEY` | Edge Fn |

---

# 18. GYORS PARANCS-REFERENCIA

## 18.1 SSH és Kapcsolódás

```powershell
# Csatlakozás
ssh root@92.118.26.81

# Fájl feltöltése
scp fájl.txt root@92.118.26.81:/tmp/

# Mappa letöltése
scp -r root@92.118.26.81:/var/backups/ C:\Users\[USER]\Downloads\
```

## 18.2 Docker és Supabase

```bash
# Státusz
cd /opt/supabase/supabase/docker && sudo docker compose ps

# Újraindítás
sudo docker compose restart

# Teljes újraindítás
sudo docker compose down && sudo docker compose up -d

# Logok
sudo docker compose logs -f
sudo docker compose logs [SERVICE_NAME] -f

# PostgreSQL konzol
sudo docker compose exec db psql -U postgres -d postgres
```

## 18.3 Caddy

```bash
# Konfiguráció ellenőrzés
sudo caddy validate --config /etc/caddy/Caddyfile

# Újratöltés
sudo systemctl reload caddy

# Státusz
sudo systemctl status caddy

# Logok
sudo journalctl -u caddy -f
```

## 18.4 Frontend

```bash
# Build
cd /var/www/thecoach.hu
npm install
npm run build

# Logok ellenőrzése
cat /var/www/thecoach.hu/dist/index.html
```

## 18.5 VIM Parancsok

| Parancs | Funkció |
|---------|---------|
| `i` | Beszúrás mód |
| `Esc` | Normál mód |
| `:wq` | Mentés + kilépés |
| `:q!` | Kilépés mentés nélkül |
| `/szöveg` | Keresés |
| `n` | Következő találat |
| `dd` | Sor törlése |
| `u` | Visszavonás |
| `G` | Fájl vége |
| `gg` | Fájl eleje |

---

# ÖSSZEFOGLALÁS

## Gyors Telepítési Sorrend

1. ☐ SSH csatlakozás a VPS-hez
2. ☐ Rendszer frissítése és eszközök telepítése
3. ☐ Docker telepítése
4. ☐ Supabase klónozása
5. ☐ **KULCSOK GENERÁLÁSA** (kritikus!)
6. ☐ Supabase .env konfigurálása
7. ☐ Supabase indítása
8. ☐ SQL fájlok feltöltése és importálása
9. ☐ Frontend feltöltése
10. ☐ Frontend .env.production beállítása
11. ☐ npm install && npm run build
12. ☐ Caddy telepítése és konfigurálása
13. ☐ DNS beállítása
14. ☐ Edge Functions beállítása
15. ☐ Admin felhasználó létrehozása
16. ☐ Teljes tesztelés

## Segítségkérés

Ha elakadsz:
1. Olvasd el a hibaelhárítási szekciót (#16)
2. Ellenőrizd a logokat
3. Győződj meg a kulcsok helyességéről
4. Ellenőrizd a DNS beállításokat

---

*Utolsó frissítés: 2025. január 25.*
*Verzió: 2.0 - Ultra-részletes kiadás*
