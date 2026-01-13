# TheCoach.hu - Független Működtetési Útmutató

Ez a dokumentáció lépésről-lépésre bemutatja, hogyan működtetheted a TheCoach.hu alkalmazást saját szerveren, a Lovable platformtól függetlenül.

---

## Tartalomjegyzék

1. [Áttekintés](#1-áttekintés)
2. [Előkészületek](#2-előkészületek)
3. [Forráskód exportálása](#3-forráskód-exportálása)
4. [Adatbázis migrálása](#4-adatbázis-migrálása)
5. [Backend beállítása](#5-backend-beállítása)
6. [Frontend deployment](#6-frontend-deployment)
7. [Domain és SSL beállítások](#7-domain-és-ssl-beállítások)
8. [Tesztelés és élesítés](#8-tesztelés-és-élesítés)
9. [Karbantartás](#9-karbantartás)

---

## 1. Áttekintés

### Az alkalmazás architektúrája

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Supabase       │────▶│   PostgreSQL    │
│   (React/Vite)  │     │   (vagy saját)   │     │   Adatbázis     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                      │
         │                      │
         ▼                      ▼
┌─────────────────┐     ┌──────────────────┐
│   CDN/Hosting   │     │   Edge Functions │
│   (Vercel/etc)  │     │   (Email, Stripe)│
└─────────────────┘     └──────────────────┘
```

### Szükséges komponensek

| Komponens | Lovable verzió | Független verzió |
|-----------|----------------|------------------|
| Frontend | Lovable Preview | Vercel / Netlify / VPS |
| Adatbázis | Lovable Cloud (Supabase) | Supabase / Saját PostgreSQL |
| Auth | Supabase Auth | Supabase Auth / saját megoldás |
| Storage | Supabase Storage | Supabase Storage / S3 / saját |
| Edge Functions | Lovable Cloud | Supabase Edge Functions / Node.js |
| Email | Resend | Resend / saját SMTP |
| Fizetés | Stripe | Stripe |

---

## 2. Előkészületek

### 2.1 Szükséges eszközök telepítése

```bash
# Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Git
sudo apt-get install git

# PostgreSQL client (opcionális)
sudo apt-get install postgresql-client
```

### 2.2 Szükséges fiókok

1. **GitHub** - forráskód tárolás
2. **Supabase** (ajánlott) VAGY saját PostgreSQL szerver
3. **Vercel/Netlify** (ajánlott) VAGY VPS hosting
4. **Resend** - email küldés (API kulcs szükséges)
5. **Stripe** - fizetések kezelése

### 2.3 Környezeti változók listája

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...

# Stripe (frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Backend secrets (Edge Functions)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_live_...
RESEND_API_KEY=re_...
FROM_EMAIL=info@thecoach.hu
SITE_URL=https://thecoach.hu
```

---

## 3. Forráskód exportálása

### 3.1 GitHub-ról klónozás

```bash
# Repository klónozása
git clone https://github.com/YOUR_USERNAME/YOUR_PROJECT.git
cd YOUR_PROJECT

# Dependencies telepítése
npm install
```

### 3.2 Lokális tesztelés

```bash
# Fejlesztői szerver indítása
npm run dev

# Build készítése
npm run build

# Build előnézet
npm run preview
```

### 3.3 Build kimenet

A `dist/` mappa tartalma:
- `index.html` - főoldal
- `assets/` - JS, CSS, képek
- Statikus fájlok

---

## 4. Adatbázis migrálása

### 4.1 Adatok exportálása (Admin felületről)

1. Jelentkezz be: `https://thecoach.hu/admin`
2. Navigálj: **Adatbázis Export** menüpont
3. Válaszd ki az összes táblát
4. Kattints: **Adatok letöltése**
5. Mentsd el az `.sql` fájlt

### 4.2 Séma exportálása

A migrációs fájlok itt találhatók:
```
supabase/migrations/
├── 20240101_initial_schema.sql
├── 20240102_add_products.sql
└── ...
```

### 4.3 Új Supabase projekt létrehozása

1. Menj: https://supabase.com
2. Hozz létre új projektet
3. Másold ki a projekt URL-t és kulcsokat

### 4.4 Séma importálása

Supabase SQL Editor-ban futtasd:

```sql
-- 1. ENUM típusok
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.order_status AS ENUM ('NEW', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED');
CREATE TYPE public.payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE public.product_type AS ENUM ('DIGITAL', 'PHYSICAL');
CREATE TYPE public.shipping_method AS ENUM ('HOME', 'BOX', 'NONE');

-- 2. Táblák létrehozása
-- (Lásd az exportált séma fájlt)

-- 3. RLS szabályok
-- (Lásd az exportált séma fájlt)
```

### 4.5 Adatok importálása

```sql
-- Futtasd az exportált adatok SQL fájlt
-- (A trigger-eket ideiglenesen letiltja az import gyorsításához)
```

### 4.6 Storage bucket-ek létrehozása

```sql
-- Book covers (publikus)
INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true);

-- Book files (privát)
INSERT INTO storage.buckets (id, name, public) VALUES ('book-files', 'book-files', false);

-- Email attachments (privát)
INSERT INTO storage.buckets (id, name, public) VALUES ('email_attachments', 'email_attachments', false);
```

---

## 5. Backend beállítása

### 5.1 Edge Functions telepítése

Az Edge Functions a `supabase/functions/` mappában találhatók:

```
supabase/functions/
├── create-cart-checkout/
├── send-email-campaign/
├── send-booking-confirmation/
├── send-order-confirmation/
├── verify-deposit-payment/
└── ...
```

### 5.2 Supabase CLI telepítése

```bash
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref YOUR_PROJECT_REF
```

### 5.3 Functions deploy

```bash
# Összes function deploy
supabase functions deploy

# Egyedi function deploy
supabase functions deploy send-email-campaign
```

### 5.4 Secrets beállítása

```bash
# Supabase Dashboard -> Settings -> Edge Functions -> Secrets
# VAGY CLI-vel:

supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set FROM_EMAIL=info@thecoach.hu
supabase secrets set SITE_URL=https://thecoach.hu
```

---

## 6. Frontend deployment

### 6.1 Vercel (ajánlott)

```bash
# Vercel CLI telepítése
npm install -g vercel

# Deploy
vercel

# Production deploy
vercel --prod
```

**Vercel Dashboard beállítások:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables: add all VITE_* variables

### 6.2 Netlify

```bash
# Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### 6.3 Saját VPS (Apache/Nginx)

**Nginx konfiguráció:**

```nginx
server {
    listen 80;
    server_name thecoach.hu www.thecoach.hu;
    
    root /var/www/thecoach.hu/dist;
    index index.html;
    
    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
}
```

**Apache .htaccess:**

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 7. Domain és SSL beállítások

### 7.1 DNS beállítások

A domain registrátornál (pl. domain.hu, GoDaddy):

| Típus | Név | Érték | TTL |
|-------|-----|-------|-----|
| A | @ | [Szerver IP] | 3600 |
| CNAME | www | thecoach.hu | 3600 |

Vercel esetén:
| Típus | Név | Érték |
|-------|-----|-------|
| CNAME | @ | cname.vercel-dns.com |
| CNAME | www | cname.vercel-dns.com |

### 7.2 SSL tanúsítvány

**Let's Encrypt (ingyenes):**

```bash
# Certbot telepítése
sudo apt install certbot python3-certbot-nginx

# Tanúsítvány beszerzése
sudo certbot --nginx -d thecoach.hu -d www.thecoach.hu

# Automatikus megújítás tesztelése
sudo certbot renew --dry-run
```

**Vercel/Netlify:** Automatikusan biztosít SSL-t.

---

## 8. Tesztelés és élesítés

### 8.1 Ellenőrzőlista

- [ ] Frontend betölt HTTPS-en
- [ ] Bejelentkezés működik
- [ ] Admin felület elérhető
- [ ] Termékek megjelennek
- [ ] Kosár és checkout működik
- [ ] Stripe fizetés működik (teszt módban)
- [ ] Email küldés működik
- [ ] Időpontfoglalás működik
- [ ] Digitális letöltés működik

### 8.2 Teszt rendelés

1. Adj kosárba egy terméket
2. Menj a checkout-ra
3. Használj teszt bankkártya adatokat:
   - Kártya: `4242 4242 4242 4242`
   - Lejárat: bármilyen jövőbeli dátum
   - CVC: bármilyen 3 számjegy

### 8.3 Admin teszt

1. Jelentkezz be admin felhasználóval
2. Ellenőrizd a rendelések listáját
3. Küldj teszt email kampányt

---

## 9. Karbantartás

### 9.1 Backup stratégia

```bash
# Napi adatbázis backup
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d).sql

# Storage backup (Supabase CLI)
supabase storage download book-covers -o ./backups/book-covers/
supabase storage download book-files -o ./backups/book-files/
```

### 9.2 Monitoring

- **Uptime:** UptimeRobot, Pingdom
- **Error tracking:** Sentry
- **Analytics:** Google Analytics, Plausible

### 9.3 Frissítések

```bash
# Forráskód frissítése
git pull origin main
npm install
npm run build

# Vercel: automatikus deploy git push után
# VPS: manuális upload szükséges
```

---

## Gyakori hibák és megoldások

### "Failed to fetch" hibák

- Ellenőrizd a CORS beállításokat
- Ellenőrizd a Supabase URL-t és kulcsot
- Nézd meg a böngésző konzolt

### Email nem érkezik

- Ellenőrizd a RESEND_API_KEY-t
- Ellenőrizd a FROM_EMAIL domain verifikációt
- Nézd meg az Edge Function logokat

### Stripe fizetés sikertelen

- Ellenőrizd a STRIPE_SECRET_KEY-t
- Győződj meg róla, hogy éles kulcsokat használsz production-ben
- Ellenőrizd a webhook beállításokat

---

## Támogatás

- **Supabase dokumentáció:** https://supabase.com/docs
- **Vercel dokumentáció:** https://vercel.com/docs
- **Stripe dokumentáció:** https://stripe.com/docs

---

*Utolsó frissítés: 2025. január*
