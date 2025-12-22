# Független Működtetés - Teljes Útmutató

Ez a dokumentáció lépésről-lépésre bemutatja, hogyan működtetheted az alkalmazást saját szerveren, saját domain alatt, függetlenül a Lovable platformtól.

## Tartalomjegyzék

1. [Előkészületek](#1-előkészületek)
2. [Kód exportálása](#2-kód-exportálása)
3. [Adatbázis migrálása](#3-adatbázis-migrálása)
4. [Szerver beállítása (MHosting)](#4-szerver-beállítása-mhosting)
5. [Domain beállítások](#5-domain-beállítások)
6. [Több domain átirányítása](#6-több-domain-átirányítása)
7. [SSL tanúsítvány](#7-ssl-tanúsítvány)
8. [Karbantartás és frissítések](#8-karbantartás-és-frissítések)

---

## 1. Előkészületek

### Szükséges eszközök

- **Node.js** (v18 vagy újabb)
- **Git** (verziókezeléshez)
- **PostgreSQL** adatbázis
- **Webszerver** (Apache vagy Nginx)
- **SSL tanúsítvány** (Let's Encrypt ingyenes)

### Szükséges hozzáférések

- MHosting fiók cPanel hozzáféréssel
- Domain regisztrátor hozzáférés (DNS kezeléshez)
- SSH hozzáférés a szerverhez (opcionális, de ajánlott)

---

## 2. Kód exportálása

### 2.1 GitHub-ról letöltés

Ha a projekt GitHub-on van:

```bash
git clone https://github.com/felhasznalo/projekt-nev.git
cd projekt-nev
npm install
```

### 2.2 Lovable-ből közvetlen letöltés

1. Nyisd meg a projektet Lovable-ben
2. Menj a **Settings** → **GitHub** fülre
3. Kapcsold össze a GitHub fiókoddal
4. Klónozd a repositoryt a gépedre

### 2.3 Build készítése

```bash
npm run build
```

Ez létrehozza a `dist` mappát, ami tartalmazza a production-ready fájlokat.

---

## 3. Adatbázis migrálása

### 3.1 Adatok exportálása

1. Menj az admin felületre: `/admin/database-export`
2. Válaszd ki az exportálandó táblákat
3. Kattints az "Adatok letöltése" gombra
4. Mentsd el az `.sql` fájlt

### 3.2 Séma exportálása

A séma a migrációs fájlokból áll össze:
- `supabase/migrations/` mappa tartalmazza az összes migrációt

### 3.3 Új PostgreSQL adatbázis létrehozása

MHosting-on:

1. Jelentkezz be a cPanel-be
2. Menj a **PostgreSQL Databases** részhez
3. Hozz létre új adatbázist
4. Hozz létre új felhasználót
5. Add hozzá a felhasználót az adatbázishoz

### 3.4 Adatok importálása

```bash
psql -h localhost -U felhasznalo -d adatbazis_nev -f sema.sql
psql -h localhost -U felhasznalo -d adatbazis_nev -f adatok.sql
```

Vagy phpPgAdmin-on keresztül (cPanel-ben).

---

## 4. Szerver beállítása (MHosting)

### 4.1 Fájlok feltöltése

1. Jelentkezz be a cPanel-be
2. Nyisd meg a **File Manager**-t
3. Navigálj a `public_html` mappába
4. Töltsd fel a `dist` mappa tartalmát

### 4.2 .htaccess beállítása (Apache)

Hozd létre/szerkeszd a `.htaccess` fájlt:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Handle React Router
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
  
  # Redirect multiple domains to primary
  RewriteCond %{HTTP_HOST} ^masik-domain\.hu$ [OR]
  RewriteCond %{HTTP_HOST} ^www\.masik-domain\.hu$
  RewriteRule ^(.*)$ https://fo-domain.hu/$1 [R=301,L]
</IfModule>

# Gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### 4.3 Környezeti változók

Hozz létre egy `.env` fájlt a szerveren:

```env
VITE_SUPABASE_URL=https://sajat-supabase-url.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sajat_kulcs
```

**Fontos:** Ha önálló backend-et használsz, cseréld le a Supabase URL-eket a saját API végpontjaidra.

---

## 5. Domain beállítások

### 5.1 DNS rekordok beállítása

Menj a domain regisztrátorhoz (vagy MHosting DNS kezeléshez):

| Típus | Név | Érték | TTL |
|-------|-----|-------|-----|
| A | @ | [szerver IP címe] | 3600 |
| A | www | [szerver IP címe] | 3600 |
| CNAME | www | fo-domain.hu | 3600 |

### 5.2 MHosting-on domain hozzáadása

1. cPanel → **Addon Domains** vagy **Domains**
2. Add meg a domain nevet
3. Állítsd be a Document Root-ot: `public_html`

---

## 6. Több domain átirányítása

### 6.1 Adminisztrációs nyilvántartás

Használd az admin felület **Domének** menüpontját a domainek nyilvántartásához.

### 6.2 DNS beállítások minden domainhez

Minden átirányítandó domainnél:

1. Állítsd be az A rekordot a fő szerver IP-jére
2. Vagy használj CNAME-et a fő domainre

### 6.3 Szerver oldali átirányítás

A `.htaccess` fájlban (fent már szerepel a minta).

Nginx esetén:

```nginx
server {
    listen 80;
    server_name masik-domain.hu www.masik-domain.hu;
    return 301 https://fo-domain.hu$request_uri;
}

server {
    listen 443 ssl;
    server_name masik-domain.hu www.masik-domain.hu;
    ssl_certificate /path/to/cert;
    ssl_certificate_key /path/to/key;
    return 301 https://fo-domain.hu$request_uri;
}
```

---

## 7. SSL tanúsítvány

### 7.1 Let's Encrypt (ingyenes)

MHosting cPanel-en:

1. Menj az **SSL/TLS Status** részhez
2. Válaszd ki a domaint
3. Kattints az **Issue** gombra
4. Automatikusan megújul 90 naponta

### 7.2 Manuális telepítés (ha szükséges)

```bash
certbot --apache -d fo-domain.hu -d www.fo-domain.hu
```

---

## 8. Karbantartás és frissítések

### 8.1 Frissítések telepítése

1. Töltsd le a legújabb kódot
2. Futtasd: `npm run build`
3. Töltsd fel az új `dist` mappa tartalmát

### 8.2 Adatbázis backup

Rendszeres backup készítése:

```bash
pg_dump -U felhasznalo -d adatbazis_nev > backup_$(date +%Y%m%d).sql
```

### 8.3 Monitoring

- Ellenőrizd a szerver logokat
- Állíts be uptime monitoring-ot (pl. UptimeRobot)

---

## Gyakori hibák és megoldások

### Fehér oldal / 404 hiba

- Ellenőrizd a `.htaccess` fájlt
- Győződj meg róla, hogy az `index.html` létezik

### Adatbázis kapcsolódási hiba

- Ellenőrizd a környezeti változókat
- Győződj meg a PostgreSQL futásáról

### CORS hibák

- Állítsd be a megfelelő CORS header-eket a backend-en

---

## Támogatás

Ha elakadtál, használd az alábbi forrásokat:
- MHosting dokumentáció
- Lovable Community Discord
- Stack Overflow

---

*Utolsó frissítés: 2024. december*
