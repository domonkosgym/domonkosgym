# TheCoach.hu - VPS Telepítési Útmutató (Caddy + Self-Hosted Supabase)

## Áttekintés

```
┌─────────────────────────────────────────────────────────────────┐
│                         VPS (92.118.26.81)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐     ┌─────────────────────────────────┐   │
│  │     Caddy       │     │     Self-Hosted Supabase        │   │
│  │  (Reverse Proxy)│     │         (Docker)                │   │
│  │                 │     │                                 │   │
│  │  :80/:443       │     │  Kong API: :8000                │   │
│  │                 │     │  PostgreSQL: :5432              │   │
│  │  thecoach.hu ──────▶  │  /var/www/domonkosgym/dist      │   │
│  │                 │     │                                 │   │
│  │  api.thecoach.hu ──▶  │  localhost:8000 (Kong)          │   │
│  │                 │     │                                 │   │
│  └─────────────────┘     └─────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. DNS Beállítások (MHosting)

A következő A rekordokat kell beállítani:

| Típus | Név | Érték | TTL |
|-------|-----|-------|-----|
| A | @ | 92.118.26.81 | 3600 |
| A | www | 92.118.26.81 | 3600 |
| A | api | 92.118.26.81 | 3600 |

---

## 2. Caddy Telepítése

```bash
# Caddy telepítése (Debian/Ubuntu)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

---

## 3. Caddy Konfiguráció

### 3.1 Caddyfile létrehozása

```bash
sudo nano /etc/caddy/Caddyfile
```

**Tartalma:**

```caddyfile
# Frontend - thecoach.hu
thecoach.hu, www.thecoach.hu {
    # Automatikus HTTPS (Let's Encrypt)
    
    # Gzip tömörítés
    encode gzip
    
    # Statikus fájlok kiszolgálása
    root * /var/www/domonkosgym/dist
    
    # SPA routing - minden nem létező útvonal az index.html-re
    try_files {path} /index.html
    
    # Statikus fájlok
    file_server
    
    # Cache headers az assets mappához
    @assets {
        path /assets/*
    }
    header @assets Cache-Control "public, max-age=31536000, immutable"
    
    # Security headers
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
    }
}

# Backend API - api.thecoach.hu
api.thecoach.hu {
    # Automatikus HTTPS (Let's Encrypt)
    
    # CORS headers
    @cors_preflight method OPTIONS
    handle @cors_preflight {
        header Access-Control-Allow-Origin "https://thecoach.hu"
        header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS"
        header Access-Control-Allow-Headers "Authorization, Content-Type, apikey, x-client-info"
        header Access-Control-Max-Age "86400"
        respond "" 204
    }
    
    # Minden kérés továbbítása a Supabase Kong API-hoz
    reverse_proxy localhost:8000 {
        # CORS headers a válaszokhoz
        header_down Access-Control-Allow-Origin "https://thecoach.hu"
        header_down Access-Control-Allow-Credentials "true"
        
        # Proxy headers
        header_up Host {upstream_hostport}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

### 3.2 Caddy újraindítása

```bash
# Konfiguráció ellenőrzése
sudo caddy validate --config /etc/caddy/Caddyfile

# Caddy újraindítása
sudo systemctl restart caddy

# Státusz ellenőrzése
sudo systemctl status caddy
```

---

## 4. Self-Hosted Supabase Telepítése

### 4.1 Docker telepítése

```bash
# Docker telepítése
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose telepítése
sudo apt install docker-compose-plugin
```

### 4.2 Supabase Docker Stack letöltése

```bash
# Könyvtár létrehozása
sudo mkdir -p /opt/supabase
cd /opt/supabase

# Supabase Docker repo klónozása
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# .env fájl másolása
cp .env.example .env
```

### 4.3 .env fájl konfigurálása

```bash
sudo nano /opt/supabase/supabase/docker/.env
```

**Fontos változók:**

```env
############
# Secrets
############

# Generálás: openssl rand -base64 32
POSTGRES_PASSWORD=erős_jelszó_ide
JWT_SECRET=nagyon_hosszú_titkos_kulcs_legalább_32_karakter
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=erős_admin_jelszó

############
# URLs
############

SITE_URL=https://thecoach.hu
API_EXTERNAL_URL=https://api.thecoach.hu

# Kong publikus URL (ezen keresztül éri el a frontend)
KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

############
# Database
############

POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432
```

### 4.4 JWT kulcsok generálása

A JWT kulcsokat a Supabase JWT Generator-ral generálhatod:
https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys

Vagy kézzel:

```bash
# JWT_SECRET generálása
openssl rand -base64 32

# ANON_KEY és SERVICE_ROLE_KEY generálása a jwt.io oldalon
# Payload ANON_KEY-hez:
# {
#   "role": "anon",
#   "iss": "supabase",
#   "iat": 1704067200,
#   "exp": 1861920000
# }

# Payload SERVICE_ROLE_KEY-hez:
# {
#   "role": "service_role",
#   "iss": "supabase",
#   "iat": 1704067200,
#   "exp": 1861920000
# }
```

### 4.5 Supabase indítása

```bash
cd /opt/supabase/supabase/docker

# Docker konténerek indítása
sudo docker compose up -d

# Logok megtekintése
sudo docker compose logs -f
```

---

## 5. Frontend Konfiguráció

### 5.1 Frontend .env fájl

A frontend buildelése előtt a következő környezeti változókat kell beállítani:

```bash
# .env.production (a build előtt)
VITE_SUPABASE_URL=https://api.thecoach.hu
VITE_SUPABASE_PUBLISHABLE_KEY=az_anon_key_amit_generáltál
```

### 5.2 Frontend build és deploy

```bash
# Helyi gépen
npm run build

# Feltöltés a szerverre
scp -r dist/* user@92.118.26.81:/var/www/domonkosgym/dist/
```

Vagy a szerveren:

```bash
cd /var/www/domonkosgym
git pull origin main
npm install
npm run build
```

---

## 6. Frontend Supabase Client Módosítása

A self-hosted Supabase-hez a client-et így kell konfigurálni:

```typescript
// src/integrations/supabase/client.ts
// FONTOS: Ez a fájl automatikusan generálódik Lovable Cloud-ban
// Self-hosted környezetben manuálisan kell beállítani!

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})
```

---

## 7. Edge Functions Migráció

A Supabase Edge Functions-ök self-hosted környezetben is működnek:

```bash
# Edge Functions deploy (a supabase/functions mappából)
cd /opt/supabase/supabase/docker

# Deno runtime szükséges
curl -fsSL https://deno.land/install.sh | sh

# Edge functions másolása
cp -r /var/www/domonkosgym/supabase/functions/* ./volumes/functions/
```

---

## 8. Adatbázis Migráció

### 8.1 Adatok exportálása Lovable Cloud-ból

1. Admin felület: `/admin/database-export`
2. Séma letöltése (CREATE TABLE utasítások)
3. Adatok letöltése (INSERT utasítások)

### 8.2 Importálás self-hosted Supabase-be

```bash
# Kapcsolódás a PostgreSQL-hez
docker exec -it supabase-db psql -U postgres -d postgres

# SQL fájlok futtatása
\i /path/to/schema.sql
\i /path/to/data.sql
```

---

## 9. Tesztelés

### 9.1 Caddy ellenőrzése

```bash
# Caddy logok
sudo journalctl -u caddy -f

# HTTPS tanúsítvány ellenőrzése
curl -I https://thecoach.hu
curl -I https://api.thecoach.hu
```

### 9.2 API ellenőrzése

```bash
# Health check
curl https://api.thecoach.hu/rest/v1/

# Tábla lekérdezése (anon key-vel)
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     https://api.thecoach.hu/rest/v1/products?select=*
```

### 9.3 Frontend ellenőrzése

```bash
# Oldal betöltése
curl -I https://thecoach.hu

# SPA routing tesztelése
curl -I https://thecoach.hu/admin
```

---

## 10. Hibaelhárítás

### CORS hibák

Ha CORS hibákat látsz a böngésző konzolban:

1. Ellenőrizd a Caddyfile CORS beállításait
2. Győződj meg róla, hogy az `Access-Control-Allow-Origin` megfelelő

```bash
# CORS teszt
curl -I -X OPTIONS \
     -H "Origin: https://thecoach.hu" \
     -H "Access-Control-Request-Method: POST" \
     https://api.thecoach.hu/rest/v1/
```

### Supabase nem elérhető

```bash
# Docker konténerek állapota
sudo docker compose ps

# Kong logok
sudo docker compose logs kong

# PostgreSQL logok
sudo docker compose logs db
```

### SSL tanúsítvány problémák

```bash
# Caddy SSL tanúsítványok helye
ls -la /var/lib/caddy/.local/share/caddy/certificates/

# Tanúsítvány megújítása
sudo caddy reload --config /etc/caddy/Caddyfile
```

---

## 11. Karbantartás

### Backup

```bash
# Adatbázis backup
docker exec supabase-db pg_dump -U postgres postgres > backup_$(date +%Y%m%d).sql

# Storage backup
tar -czvf storage_backup_$(date +%Y%m%d).tar.gz /opt/supabase/supabase/docker/volumes/storage/
```

### Frissítések

```bash
# Caddy frissítése
sudo apt update && sudo apt upgrade caddy

# Supabase frissítése
cd /opt/supabase/supabase/docker
git pull
sudo docker compose pull
sudo docker compose up -d
```

---

*Utolsó frissítés: 2025. január*
