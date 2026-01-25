# TheCoach.hu - Teljes VPS Migrációs Útmutató

## 🎯 Célkitűzés

Ez a dokumentáció lépésről lépésre bemutatja, hogyan telepítsd és működtesd a TheCoach.hu alkalmazást **TELJESEN FÜGGETLENÜL** a Lovable platformtól, saját VPS szerveren (MHosting).

**Mit fogunk elérni:**
- ✅ Frontend: Saját szerveren fut (React/Vite alkalmazás)
- ✅ Backend: Self-hosted Supabase (Docker konténerekben)
- ✅ Adatbázis: Saját PostgreSQL (a Supabase része)
- ✅ Fájltárolás: Saját Storage (a Supabase része)
- ✅ Autentikáció: Saját Auth rendszer (a Supabase része)
- ✅ Edge Functions: Saját Deno runtime
- ✅ SSL/HTTPS: Let's Encrypt tanúsítványok (Caddy automatikusan kezeli)

---

## 📋 Tartalomjegyzék

1. [Előkészületek és Követelmények](#1-előkészületek-és-követelmények)
2. [Szerver Előkészítése](#2-szerver-előkészítése)
3. [Self-Hosted Supabase Telepítése](#3-self-hosted-supabase-telepítése)
4. [Kulcsok és Jelszavak Generálása](#4-kulcsok-és-jelszavak-generálása)
5. [Supabase Konfigurálása](#5-supabase-konfigurálása)
6. [Adatbázis Migrálása](#6-adatbázis-migrálása)
7. [Frontend Telepítése](#7-frontend-telepítése)
8. [Caddy Web Szerver Beállítása](#8-caddy-web-szerver-beállítása)
9. [DNS Beállítások](#9-dns-beállítások)
10. [Edge Functions Telepítése](#10-edge-functions-telepítése)
11. [Secrets és Környezeti Változók](#11-secrets-és-környezeti-változók)
12. [Tesztelés és Ellenőrzés](#12-tesztelés-és-ellenőrzés)
13. [Karbantartás és Backup](#13-karbantartás-és-backup)
14. [Hibaelhárítás](#14-hibaelhárítás)
15. [Gyors Referencia](#15-gyors-referencia)

---

## 1. Előkészületek és Követelmények

### 1.1 Szükséges Eszközök a Saját Gépeden

**Windows esetén:**
- PowerShell (beépített Windows-ban)
- SSH kliens (PowerShell-be beépített)

**Kapcsolódás a szerverhez PowerShell-ből:**
```powershell
# PowerShell megnyitása: Win + X, majd "Windows PowerShell"
ssh root@92.118.26.81
```

**Jelszó megadása után belépsz a szerverre.**

### 1.2 Szükséges Információk

Mielőtt elkezded, gyűjtsd össze ezeket:

| Információ | Honnan szerzed | Példa |
|------------|----------------|-------|
| VPS IP cím | MHosting admin felület | `92.118.26.81` |
| VPS root jelszó | MHosting e-mail | `********` |
| Domain név | Saját domain | `thecoach.hu` |
| Lovable Cloud adatok | Admin Dashboard Export | SQL fájlok |

### 1.3 Szükséges Fiókok és Szolgáltatások

1. **MHosting VPS** - Szerver hosting
2. **Domain regisztrátor** - DNS kezelés (pl. domain.hu, GoDaddy)
3. **Resend** - Email küldéshez (https://resend.com)
4. **Stripe** - Fizetésekhez (https://stripe.com)

### 1.4 Ajánlott VPS Specifikáció

| Tulajdonság | Minimum | Ajánlott |
|-------------|---------|----------|
| RAM | 2 GB | 4 GB |
| CPU | 1 vCPU | 2 vCPU |
| Tárhely | 20 GB SSD | 40 GB SSD |
| OS | AlmaLinux / Ubuntu | AlmaLinux 8+ |

---

## 2. Szerver Előkészítése

### 2.1 Csatlakozás a Szerverhez

```powershell
# PowerShell-ben:
ssh root@92.118.26.81
```

Első csatlakozáskor kérdezi, hogy megbízol-e a szerverben. Írd be: `yes`

### 2.2 Rendszer Frissítése

**AlmaLinux/CentOS esetén:**
```bash
# Rendszer frissítése
sudo dnf update -y

# Alapvető eszközök telepítése
sudo dnf install -y git curl wget vim nano
```

**Ubuntu/Debian esetén:**
```bash
# Rendszer frissítése
sudo apt update && sudo apt upgrade -y

# Alapvető eszközök telepítése
sudo apt install -y git curl wget vim nano
```

### 2.3 Tűzfal Beállítása

```bash
# Firewalld telepítése és engedélyezése
sudo dnf install -y firewalld
sudo systemctl enable firewalld
sudo systemctl start firewalld

# Szükséges portok megnyitása
sudo firewall-cmd --permanent --add-service=http      # 80-as port
sudo firewall-cmd --permanent --add-service=https     # 443-as port
sudo firewall-cmd --permanent --add-port=8000/tcp     # Supabase Kong API
sudo firewall-cmd --permanent --add-port=5432/tcp     # PostgreSQL (opcionális, csak belső)
sudo firewall-cmd --reload

# Ellenőrzés
sudo firewall-cmd --list-all
```

### 2.4 Könyvtárstruktúra Létrehozása

```bash
# Frontend könyvtár
sudo mkdir -p /var/www/thecoach.hu

# Supabase könyvtár
sudo mkdir -p /opt/supabase

# Backup könyvtár
sudo mkdir -p /var/backups/thecoach

# Jogosultságok
sudo chown -R $USER:$USER /var/www/thecoach.hu
```

---

## 3. Self-Hosted Supabase Telepítése

### 3.1 Docker Telepítése

```bash
# Docker telepítése
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose telepítése (plugin verzió)
sudo dnf install -y docker-compose-plugin

# VAGY Ubuntu esetén:
# sudo apt install -y docker-compose-plugin

# Docker indítása és engedélyezése
sudo systemctl enable docker
sudo systemctl start docker

# Ellenőrzés
docker --version
docker compose version
```

### 3.2 Supabase Repository Klónozása

```bash
# Navigálás a könyvtárba
cd /opt/supabase

# Supabase Docker repository klónozása
sudo git clone --depth 1 https://github.com/supabase/supabase

# Belépés a docker könyvtárba
cd supabase/docker

# .env fájl létrehozása a példából
sudo cp .env.example .env
```

### 3.3 Szükséges Könyvtárstruktúra

A Supabase Docker stack a következő szerkezetet hozza létre:

```
/opt/supabase/supabase/docker/
├── .env                    # Fő konfigurációs fájl (ezt szerkesztjük)
├── docker-compose.yml      # Docker Compose konfiguráció
├── volumes/
│   ├── db/                 # PostgreSQL adatok
│   ├── storage/            # Feltöltött fájlok
│   └── functions/          # Edge Functions
└── ...
```

---

## 4. Kulcsok és Jelszavak Generálása

### 4.1 Szükséges Kulcsok Listája

| Kulcs neve | Mire kell | Hogyan generáljuk |
|------------|-----------|-------------------|
| `POSTGRES_PASSWORD` | Adatbázis jelszó | Véletlenszerű |
| `JWT_SECRET` | JWT tokenek aláírása | 32+ karakter véletlenszerű |
| `ANON_KEY` | Publikus API kulcs | JWT token generálás |
| `SERVICE_ROLE_KEY` | Admin API kulcs | JWT token generálás |
| `DASHBOARD_PASSWORD` | Supabase Studio jelszó | Véletlenszerű |

### 4.2 Véletlenszerű Jelszavak Generálása

```bash
# POSTGRES_PASSWORD generálása (jegyezd fel!)
openssl rand -base64 32
# Példa kimenet: K7xN9mP2qR5vW8yB3cF6hJ4kL1nM0oS7

# JWT_SECRET generálása (jegyezd fel!)
openssl rand -base64 32
# Példa kimenet: aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV

# DASHBOARD_PASSWORD generálása (jegyezd fel!)
openssl rand -base64 16
# Példa kimenet: xY9zW8vU7tS6rQ5p
```

**⚠️ FONTOS: Jegyezd fel ezeket a kulcsokat egy biztonságos helyre!**

### 4.3 JWT Kulcsok (ANON_KEY és SERVICE_ROLE_KEY) Generálása

A JWT kulcsokat online generálhatod: https://jwt.io

**ANON_KEY generálása:**

1. Menj a https://jwt.io oldalra
2. Az "Algorithm" legyen: `HS256`
3. A "PAYLOAD" mezőbe másold ezt:

```json
{
  "role": "anon",
  "iss": "supabase",
  "iat": 1704067200,
  "exp": 1861920000
}
```

4. A "VERIFY SIGNATURE" részbe írd be a `JWT_SECRET`-et (amit az előbb generáltál)
5. A bal oldali "Encoded" mezőben megjelenik az `ANON_KEY`

**SERVICE_ROLE_KEY generálása:**

Ugyanez a folyamat, de a PAYLOAD legyen:

```json
{
  "role": "service_role",
  "iss": "supabase",
  "iat": 1704067200,
  "exp": 1861920000
}
```

**Példa kimenet (NE HASZNÁLD EZEKET, GENERÁLJ SAJÁTOT!):**
```
ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE4NjE5MjAwMDB9.xxxxxxxxxxxxx

SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MTg2MTkyMDAwMH0.xxxxxxxxxxxxx
```

---

## 5. Supabase Konfigurálása

### 5.1 A .env Fájl Szerkesztése

```bash
# Navigálás a könyvtárba
cd /opt/supabase/supabase/docker

# .env fájl megnyitása vim-mel
sudo vim .env
```

**Vim használata:**
- `i` - Beszúrás mód (írhatod a szöveget)
- `Esc` - Kilépés a beszúrás módból
- `:wq` - Mentés és kilépés
- `:q!` - Kilépés mentés nélkül
- `/szöveg` - Keresés
- `dd` - Sor törlése
- `u` - Visszavonás

### 5.2 Szükséges Változók a .env Fájlban

Keresd meg és módosítsd az alábbi változókat:

```env
############
# SECRETS - NE OSZD MEG SENKIVEL!
############

# A generált PostgreSQL jelszó
POSTGRES_PASSWORD=K7xN9mP2qR5vW8yB3cF6hJ4kL1nM0oS7

# A generált JWT secret
JWT_SECRET=aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV

# A generált ANON KEY
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# A generált SERVICE ROLE KEY
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Studio bejelentkezési adatok
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=xY9zW8vU7tS6rQ5p

############
# URLs - FONTOS BEÁLLÍTÁSOK
############

# A weboldal URL-je
SITE_URL=https://thecoach.hu

# Az API külső URL-je (ezt fogja a frontend használni)
API_EXTERNAL_URL=https://api.thecoach.hu

# Postgres kapcsolódási adatok (ezek maradhatnak alapértelmezetten)
POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432

############
# API - PORTOK
############

# Kong API Gateway portok
KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

############
# STUDIO
############

# Supabase Studio port (helyi admin felület)
STUDIO_PORT=3000

############
# EMAIL (Resend)
############

# Email küldéshez - később állítjuk be
# SMTP_HOST=smtp.resend.com
# SMTP_PORT=465
# SMTP_USER=resend
# SMTP_PASS=re_xxxxxxxxxxxx
# SMTP_SENDER_NAME=TheCoach.hu
```

### 5.3 Kulcs-Változó Megfeleltetés

| Lovable Cloud név | Self-hosted név | Hol használjuk |
|-------------------|-----------------|----------------|
| `VITE_SUPABASE_URL` | `API_EXTERNAL_URL` | Frontend .env |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `ANON_KEY` | Frontend .env |
| `SUPABASE_SERVICE_ROLE_KEY` | `SERVICE_ROLE_KEY` | Edge Functions |
| `SUPABASE_URL` | `http://localhost:8000` | Edge Functions belső |

### 5.4 Supabase Indítása

```bash
# Navigálás a docker könyvtárba
cd /opt/supabase/supabase/docker

# Docker konténerek indítása (háttérben)
sudo docker compose up -d

# Várj 2-3 percet, amíg minden elindul

# Ellenőrzés - minden konténer "Up" állapotban kell legyen
sudo docker compose ps
```

**Várt kimenet:**
```
NAME                            STATUS
supabase-analytics              Up
supabase-auth                   Up
supabase-db                     Up
supabase-kong                   Up
supabase-meta                   Up
supabase-realtime               Up
supabase-rest                   Up
supabase-storage                Up
supabase-studio                 Up
```

### 5.5 Supabase Studio Elérése

A Supabase Studio (admin felület) elérhető:
- Helyi URL: `http://92.118.26.81:3000`
- Bejelentkezés: `admin` / `[DASHBOARD_PASSWORD]`

**⚠️ Figyelem:** A Studio csak belső használatra van, ne tedd publikussá!

---

## 6. Adatbázis Migrálása

### 6.1 SQL Fájlok Feltöltése a Szerverre

**A saját gépeden (PowerShell):**

```powershell
# Schema fájl feltöltése
scp C:\Users\[FELHASZNALONEV]\Downloads\schema.sql root@92.118.26.81:/tmp/

# Data fájl feltöltése
scp C:\Users\[FELHASZNALONEV]\Downloads\data.sql root@92.118.26.81:/tmp/
```

**Vagy ha egyszerre több fájlt:**
```powershell
scp C:\Users\[FELHASZNALONEV]\Downloads\*.sql root@92.118.26.81:/tmp/
```

### 6.2 SQL Fájlok Importálása

**A szerveren (SSH-n keresztül):**

```bash
# Csatlakozás a szerverhez
ssh root@92.118.26.81

# Navigálás a Supabase Docker könyvtárba
cd /opt/supabase/supabase/docker

# 1. SÉMA IMPORTÁLÁSA (először ezt!)
cat /tmp/schema.sql | sudo docker compose exec -T db psql -U postgres -d postgres

# 2. ADATOK IMPORTÁLÁSA (utána ezt!)
cat /tmp/data.sql | sudo docker compose exec -T db psql -U postgres -d postgres
```

### 6.3 Importálás Ellenőrzése

```bash
# Csatlakozás a PostgreSQL-hez
sudo docker compose exec db psql -U postgres -d postgres

# Táblák listázása
\dt

# Példa lekérdezés
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM faqs;
SELECT COUNT(*) FROM contacts;

# Kilépés
\q
```

### 6.4 Storage Bucket-ek Létrehozása

```bash
# Csatlakozás a PostgreSQL-hez
sudo docker compose exec db psql -U postgres -d postgres
```

Majd futtasd ezeket az SQL parancsokat:

```sql
-- Book covers bucket (publikus - képek)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Book files bucket (privát - letölthető fájlok)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('book-files', 'book-files', false)
ON CONFLICT (id) DO NOTHING;

-- Email attachments bucket (privát)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('email_attachments', 'email_attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Ellenőrzés
SELECT * FROM storage.buckets;

-- Kilépés
\q
```

---

## 7. Frontend Telepítése

### 7.1 Node.js Telepítése

```bash
# Node.js 18+ telepítése (AlmaLinux)
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Ellenőrzés
node --version
npm --version
```

### 7.2 Forráskód Letöltése

**Opció A: Git-ből klónozás (ha van GitHub repo)**
```bash
cd /var/www
sudo git clone https://github.com/[FELHASZNALO]/[REPO].git thecoach.hu
cd thecoach.hu
```

**Opció B: Fájlok feltöltése SCP-vel (ha nincs GitHub)**

A saját gépeden (PowerShell):
```powershell
# Projekt mappa tömörítése
Compress-Archive -Path C:\projektek\thecoach\* -DestinationPath C:\projektek\thecoach.zip

# Feltöltés
scp C:\projektek\thecoach.zip root@92.118.26.81:/var/www/
```

A szerveren:
```bash
cd /var/www
unzip thecoach.zip -d thecoach.hu
cd thecoach.hu
```

### 7.3 Production Környezeti Változók Beállítása

```bash
# Navigálás a projekt könyvtárba
cd /var/www/thecoach.hu

# .env.production fájl létrehozása vim-mel
sudo vim .env.production
```

**A fájl tartalma:**

```env
# Supabase kapcsolat - FONTOS: Használd a SAJÁT generált kulcsaidat!
VITE_SUPABASE_URL=https://api.thecoach.hu
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (ha van fizetés)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx
```

**⚠️ NAGYON FONTOS:**
- `VITE_SUPABASE_URL` = Az `API_EXTERNAL_URL` amit a Supabase .env-ben beállítottál
- `VITE_SUPABASE_PUBLISHABLE_KEY` = Az `ANON_KEY` amit generáltál

### 7.4 Dependencies Telepítése és Build

```bash
# Navigálás a projekt könyvtárba
cd /var/www/thecoach.hu

# Dependencies telepítése
npm install

# Production build készítése
npm run build

# Ellenőrzés - a dist mappa létrejött
ls -la dist/
```

**Várt kimenet:**
```
total 24
drwxr-xr-x 3 root root 4096 Jan 25 10:00 .
drwxr-xr-x 4 root root 4096 Jan 25 09:55 ..
drwxr-xr-x 2 root root 4096 Jan 25 10:00 assets
-rw-r--r-- 1 root root 1234 Jan 25 10:00 index.html
```

---

## 8. Caddy Web Szerver Beállítása

### 8.1 Caddy Telepítése

**AlmaLinux esetén:**
```bash
# Caddy repo hozzáadása
sudo dnf install -y 'dnf-command(copr)'
sudo dnf copr enable @caddy/caddy -y
sudo dnf install -y caddy

# Caddy engedélyezése és indítása
sudo systemctl enable caddy
sudo systemctl start caddy
```

**Ubuntu esetén:**
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### 8.2 Caddyfile Konfigurálása

```bash
# Caddyfile megnyitása vim-mel
sudo vim /etc/caddy/Caddyfile
```

**A teljes Caddyfile tartalma:**

```caddyfile
# ===========================================
# TheCoach.hu - Caddy Web Server Configuration
# ===========================================

# FRONTEND - thecoach.hu és www.thecoach.hu
thecoach.hu, www.thecoach.hu {
    # Automatikus HTTPS (Let's Encrypt)
    
    # Gzip tömörítés a gyorsabb betöltésért
    encode gzip
    
    # Statikus fájlok kiszolgálása
    root * /var/www/thecoach.hu/dist
    
    # SPA (Single Page Application) támogatás
    # Minden nem létező útvonalat az index.html-re irányít
    try_files {path} /index.html
    
    # Statikus fájl kiszolgálás
    file_server
    
    # Cache beállítások az assets mappához (1 év)
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

# BACKEND API - api.thecoach.hu
api.thecoach.hu {
    # Automatikus HTTPS (Let's Encrypt)
    
    # CORS preflight kérések kezelése
    @cors_preflight method OPTIONS
    handle @cors_preflight {
        header Access-Control-Allow-Origin "https://thecoach.hu"
        header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS"
        header Access-Control-Allow-Headers "Authorization, Content-Type, apikey, x-client-info"
        header Access-Control-Max-Age "86400"
        respond "" 204
    }
    
    # Minden kérés továbbítása a Supabase Kong API Gateway-hez
    reverse_proxy localhost:8000 {
        # CORS fejlécek hozzáadása a válaszokhoz
        header_down Access-Control-Allow-Origin "https://thecoach.hu"
        header_down Access-Control-Allow-Credentials "true"
        
        # Proxy fejlécek
        header_up Host {upstream_hostport}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}

# OPCIONÁLIS: Supabase Studio (admin felület) - csak belső használatra!
# NE aktiváld ezt production környezetben a biztonság érdekében!
# Ha mégis kell, használj erős jelszót és VPN-t
#
# studio.thecoach.hu {
#     reverse_proxy localhost:3000
#     basicauth {
#         admin $2a$14$...hashed_password...
#     }
# }
```

### 8.3 Caddy Újraindítása

```bash
# Konfiguráció ellenőrzése (szintaktikai hibák keresése)
sudo caddy validate --config /etc/caddy/Caddyfile

# Caddy újratöltése az új konfigurációval
sudo systemctl reload caddy

# Státusz ellenőrzése
sudo systemctl status caddy

# Logok megtekintése (ha probléma van)
sudo journalctl -u caddy -f
```

---

## 9. DNS Beállítások

### 9.1 Szükséges DNS Rekordok

Menj a domain regisztrátorhoz (pl. domain.hu, GoDaddy) és állítsd be:

| Típus | Név | Érték | TTL |
|-------|-----|-------|-----|
| A | @ | 92.118.26.81 | 3600 |
| A | www | 92.118.26.81 | 3600 |
| A | api | 92.118.26.81 | 3600 |

### 9.2 DNS Beállítás Lépésről Lépésre

1. **Jelentkezz be a domain kezelő felületre**
2. **Keresd meg a "DNS kezelés" vagy "DNS beállítások" menüpontot**
3. **Töröld a meglévő A rekordokat** (ha vannak)
4. **Adj hozzá új A rekordokat:**
   - Név: `@` (vagy üres) → Érték: `92.118.26.81`
   - Név: `www` → Érték: `92.118.26.81`
   - Név: `api` → Érték: `92.118.26.81`
5. **Mentsd el a változtatásokat**
6. **Várj 15-60 percet** a DNS propagációra (lehet, hogy 24-48 óra is)

### 9.3 DNS Ellenőrzése

```bash
# A saját gépeden (PowerShell vagy terminál)
nslookup thecoach.hu
nslookup www.thecoach.hu
nslookup api.thecoach.hu

# Vagy online: https://dnschecker.org
```

**Várt eredmény:** Mindhárom domain a `92.118.26.81` IP-re mutat.

---

## 10. Edge Functions Telepítése

### 10.1 Edge Functions Áttekintés

A projekt a következő Edge Function-öket használja:
- `create-cart-checkout` - Kosár checkout Stripe-pal
- `create-deposit-payment` - Előleg fizetés
- `ensure-admin` - Admin jogosultság ellenőrzés
- `get-schema-info` - Adatbázis séma lekérdezés
- `send-booking-confirmation` - Foglalás megerősítő email
- `send-email-campaign` - Email kampány küldés
- `send-invoice` - Számla küldés
- `send-order-confirmation` - Rendelés megerősítés
- `send-single-email` - Egyedi email küldés
- `unsubscribe` - Leiratkozás kezelése
- `verify-deposit-payment` - Előleg ellenőrzés

### 10.2 Deno Telepítése

```bash
# Deno telepítése
curl -fsSL https://deno.land/install.sh | sh

# PATH beállítása
echo 'export DENO_INSTALL="/root/.deno"' >> ~/.bashrc
echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Ellenőrzés
deno --version
```

### 10.3 Edge Functions Másolása

```bash
# Edge Functions másolása a Supabase volumes könyvtárba
sudo cp -r /var/www/thecoach.hu/supabase/functions/* /opt/supabase/supabase/docker/volumes/functions/

# Jogosultságok beállítása
sudo chown -R root:root /opt/supabase/supabase/docker/volumes/functions/
```

### 10.4 Edge Functions Secrets Beállítása

A self-hosted Supabase-ben az Edge Functions secrets-et környezeti változóként kell beállítani.

```bash
# Navigálás a docker könyvtárba
cd /opt/supabase/supabase/docker

# docker-compose.yml szerkesztése az Edge Functions secrets-hez
sudo vim docker-compose.yml
```

Keresd meg a `functions` service részt és adj hozzá környezeti változókat:

```yaml
functions:
  # ... meglévő konfiguráció ...
  environment:
    # Meglévő változók mellett adj hozzá ezeket:
    - RESEND_API_KEY=re_xxxxxxxxxxxx
    - STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxx
    - FROM_EMAIL=info@thecoach.hu
    - SITE_URL=https://thecoach.hu
```

Vagy használj `.env` fájlt és hivatkozz rá:

```bash
# Edge Functions környezeti változók fájl létrehozása
sudo vim /opt/supabase/supabase/docker/.env.functions
```

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxx
FROM_EMAIL=info@thecoach.hu
SITE_URL=https://thecoach.hu
STRIPE_DEPOSIT_PRICE_ID=price_xxxxxxxxxxxx
```

### 10.5 Supabase Újraindítása

```bash
cd /opt/supabase/supabase/docker
sudo docker compose down
sudo docker compose up -d
```

---

## 11. Secrets és Környezeti Változók

### 11.1 Összes Szükséges Változó Összefoglaló

**Frontend (.env.production):**
| Változó | Érték | Leírás |
|---------|-------|--------|
| `VITE_SUPABASE_URL` | `https://api.thecoach.hu` | API URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJ...` | ANON_KEY |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Stripe publikus kulcs |

**Backend (Supabase .env):**
| Változó | Érték | Leírás |
|---------|-------|--------|
| `POSTGRES_PASSWORD` | véletlenszerű | DB jelszó |
| `JWT_SECRET` | 32+ karakter | Token aláírás |
| `ANON_KEY` | JWT token | Publikus API kulcs |
| `SERVICE_ROLE_KEY` | JWT token | Admin API kulcs |
| `SITE_URL` | `https://thecoach.hu` | Oldal URL |
| `API_EXTERNAL_URL` | `https://api.thecoach.hu` | API URL |

**Edge Functions Secrets:**
| Változó | Érték | Leírás |
|---------|-------|--------|
| `RESEND_API_KEY` | `re_...` | Email küldés |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe titkos kulcs |
| `FROM_EMAIL` | `info@thecoach.hu` | Küldő email |
| `SITE_URL` | `https://thecoach.hu` | Oldal URL |

### 11.2 Kulcs Megfeleltetési Táblázat

Ha a kódban más néven szerepel egy változó:

| Kódban szereplő név | Self-hosted megfelelő | Megjegyzés |
|---------------------|----------------------|------------|
| `import.meta.env.VITE_SUPABASE_URL` | `API_EXTERNAL_URL` | Frontend |
| `Deno.env.get('SUPABASE_URL')` | `http://kong:8000` | Edge Function belső |
| `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` | `SERVICE_ROLE_KEY` | Edge Function |
| `Deno.env.get('SUPABASE_ANON_KEY')` | `ANON_KEY` | Edge Function |

---

## 12. Tesztelés és Ellenőrzés

### 12.1 Szolgáltatások Ellenőrzése

```bash
# Caddy státusz
sudo systemctl status caddy

# Docker konténerek
cd /opt/supabase/supabase/docker
sudo docker compose ps

# Minden konténer "Up" állapotban kell legyen
```

### 12.2 API Ellenőrzése

```bash
# Health check
curl -I https://api.thecoach.hu/rest/v1/

# Tábla lekérdezése (cseréld ki az ANON_KEY-t a sajátodra)
curl -H "apikey: eyJ..." \
     -H "Authorization: Bearer eyJ..." \
     https://api.thecoach.hu/rest/v1/products?select=*
```

### 12.3 Frontend Ellenőrzése

```bash
# Főoldal betöltése
curl -I https://thecoach.hu

# Várt válasz: HTTP/2 200
```

### 12.4 Teljes Tesztelési Checklist

| Teszt | Parancs/Művelet | Elvárt eredmény |
|-------|-----------------|-----------------|
| Frontend betölt | Böngészőben: `https://thecoach.hu` | Főoldal megjelenik |
| API válaszol | `curl https://api.thecoach.hu/rest/v1/` | JSON válasz |
| HTTPS működik | Böngészőben lakat ikon | Zöld lakat |
| Admin belépés | `/admin` → Email + Jelszó | Dashboard betölt |
| Termékek megjelennek | Főoldal Könyvek szekció | Könyvek láthatók |
| FAQ megjelenik | Főoldal alsó rész | Kérdések láthatók |
| Foglalás működik | Szolgáltatások → Foglalás | Űrlap működik |

---

## 13. Karbantartás és Backup

### 13.1 Automatikus Backup Script

```bash
# Backup script létrehozása
sudo vim /opt/scripts/backup.sh
```

**Script tartalma:**

```bash
#!/bin/bash

# Változók
BACKUP_DIR="/var/backups/thecoach"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Könyvtár létrehozása
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
# Script futtathatóvá tétele
sudo chmod +x /opt/scripts/backup.sh

# Cron job hozzáadása (naponta 3:00-kor)
sudo crontab -e
```

Adj hozzá ezt a sort:
```
0 3 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1
```

### 13.2 Manuális Backup

```bash
# Adatbázis backup
cd /opt/supabase/supabase/docker
sudo docker compose exec -T db pg_dump -U postgres postgres > ~/backup_$(date +%Y%m%d).sql

# Backup letöltése a saját gépre (PowerShell)
scp root@92.118.26.81:~/backup_*.sql C:\Users\[FELHASZNALO]\Downloads\
```

### 13.3 Frissítések

**Frontend frissítése:**
```bash
cd /var/www/thecoach.hu
git pull origin main  # Ha git-et használsz
npm install
npm run build
```

**Supabase frissítése:**
```bash
cd /opt/supabase/supabase/docker
git pull
sudo docker compose pull
sudo docker compose up -d
```

**Caddy frissítése:**
```bash
sudo dnf update caddy -y
sudo systemctl restart caddy
```

---

## 14. Hibaelhárítás

### 14.1 Gyakori Hibák és Megoldások

**Hiba: "Failed to fetch" a frontenden**
```bash
# CORS beállítások ellenőrzése
# Győződj meg róla, hogy a Caddyfile-ban a CORS fejlécek helyesek

# API elérhetőség tesztelése
curl -I https://api.thecoach.hu

# Kong logok ellenőrzése
cd /opt/supabase/supabase/docker
sudo docker compose logs kong
```

**Hiba: "Invalid JWT" vagy "JWT expired"**
```bash
# Ellenőrizd, hogy a JWT_SECRET ugyanaz a .env-ben és a generált kulcsokban
# Újragenerálhatod a kulcsokat, de utána a frontendet is frissíteni kell
```

**Hiba: "Connection refused" az API-nál**
```bash
# Docker konténerek ellenőrzése
sudo docker compose ps

# Ha valami nem fut, újraindítás
sudo docker compose restart

# Kong logok
sudo docker compose logs kong -f
```

**Hiba: SSL tanúsítvány nem működik**
```bash
# Caddy SSL tanúsítvány megújítása
sudo systemctl reload caddy

# DNS ellenőrzése
nslookup thecoach.hu
nslookup api.thecoach.hu

# Caddy logok
sudo journalctl -u caddy -f
```

**Hiba: Email nem megy ki**
```bash
# Ellenőrizd a RESEND_API_KEY-t
# Edge Function logok
sudo docker compose logs functions

# Teszt email küldése
# Az admin felületről próbálj küldeni egy teszt emailt
```

### 14.2 Logok Elérése

```bash
# Caddy logok
sudo journalctl -u caddy -f

# Supabase összes log
cd /opt/supabase/supabase/docker
sudo docker compose logs -f

# Specifikus szolgáltatás logja
sudo docker compose logs auth -f     # Autentikáció
sudo docker compose logs rest -f     # REST API
sudo docker compose logs db -f       # PostgreSQL
sudo docker compose logs kong -f     # API Gateway
sudo docker compose logs functions -f # Edge Functions
```

### 14.3 Szolgáltatások Újraindítása

```bash
# Csak egy szolgáltatás újraindítása
sudo docker compose restart auth

# Minden újraindítása
sudo docker compose restart

# Teljes leállítás és újraindítás
sudo docker compose down
sudo docker compose up -d
```

---

## 15. Gyors Referencia

### 15.1 Fontos Fájlok Helye

| Fájl | Hely | Leírás |
|------|------|--------|
| Frontend | `/var/www/thecoach.hu/dist/` | Build kimenet |
| Frontend .env | `/var/www/thecoach.hu/.env.production` | Környezeti változók |
| Supabase .env | `/opt/supabase/supabase/docker/.env` | Backend konfig |
| Caddyfile | `/etc/caddy/Caddyfile` | Web szerver konfig |
| Backup script | `/opt/scripts/backup.sh` | Mentés |
| Backupok | `/var/backups/thecoach/` | Mentett fájlok |

### 15.2 Gyakran Használt Parancsok

```bash
# SSH csatlakozás
ssh root@92.118.26.81

# Supabase státusz
cd /opt/supabase/supabase/docker && sudo docker compose ps

# Supabase újraindítás
cd /opt/supabase/supabase/docker && sudo docker compose restart

# Frontend újraépítés
cd /var/www/thecoach.hu && npm run build

# Caddy újratöltés
sudo systemctl reload caddy

# Logok megtekintése
sudo docker compose logs -f
sudo journalctl -u caddy -f

# PostgreSQL konzol
sudo docker compose exec db psql -U postgres
```

### 15.3 URL-ek

| URL | Leírás |
|-----|--------|
| `https://thecoach.hu` | Frontend (publikus) |
| `https://api.thecoach.hu` | Backend API (publikus) |
| `http://92.118.26.81:3000` | Supabase Studio (csak belső!) |

### 15.4 Portok

| Port | Szolgáltatás |
|------|--------------|
| 80 | HTTP (Caddy) |
| 443 | HTTPS (Caddy) |
| 8000 | Supabase Kong API |
| 3000 | Supabase Studio |
| 5432 | PostgreSQL (belső) |

---

## 📞 Segítség

Ha elakadsz:
1. Ellenőrizd a logokat (14.2 szakasz)
2. Nézd át a hibaelhárítási útmutatót (14.1 szakasz)
3. Győződj meg róla, hogy minden kulcs és jelszó helyes
4. Ellenőrizd a DNS beállításokat

---

*Utolsó frissítés: 2025. január 25.*
*Verzió: 1.0*
