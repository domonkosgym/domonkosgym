# Adatbázis Migráció - Self-Hosted PostgreSQL a VPS-en

Ez a dokumentum lépésről lépésre bemutatja, hogyan migráld az adatbázist a Lovable Cloud (Supabase) környezetből a saját VPS-re telepített self-hosted Supabase-be.

---

## Tartalomjegyzék

1. [Előkészületek](#1-előkészületek)
2. [SQL fájlok exportálása](#2-sql-fájlok-exportálása)
3. [SQL fájlok feltöltése a VPS-re](#3-sql-fájlok-feltöltése-a-vps-re)
4. [Adatbázis importálás](#4-adatbázis-importálás)
5. [Ellenőrzés](#5-ellenőrzés)
6. [Hibaelhárítás](#6-hibaelhárítás)

---

## 1. Előkészületek

### 1.1 Szükséges eszközök

- **PowerShell** - Windows kapcsolódás a VPS-hez
- **vim** - Fájlszerkesztés a szerveren
- **scp** vagy **SFTP kliens** (pl. WinSCP) - Fájlok feltöltése

### 1.2 VPS kapcsolat ellenőrzése

```powershell
# PowerShell-ben kapcsolódás a VPS-hez
ssh root@92.118.26.81

# Ellenőrizd, hogy a Supabase Docker fut-e
cd /opt/supabase/docker
sudo docker compose ps
```

Elvárt kimenet: minden szolgáltatás (db, kong, auth, rest, studio, stb.) "running" állapotban.

---

## 2. SQL fájlok exportálása

### 2.1 Admin felületen keresztül

1. Nyisd meg: `https://[lovable-preview-url]/admin/database-export`
2. Kattints: **Séma letöltése** → `schema.sql` fájl letöltődik
3. Kattints: **Adatok letöltése** → `data.sql` fájl letöltődik

### 2.2 Az exportált fájlok tartalma

**schema.sql** tartalmazza:
- ENUM típusok (app_role, order_status, payment_status, stb.)
- Összes tábla CREATE TABLE utasítása
- RLS (Row Level Security) szabályok
- Indexek és constraint-ek
- Database functions (pl. has_role, get_booking_slots)

**data.sql** tartalmazza:
- Összes tábla INSERT utasításai
- Teljes adattartalom

---

## 3. SQL fájlok feltöltése a VPS-re

### 3.1 PowerShell + SCP használatával

```powershell
# Lépj a letöltések mappába
cd C:\Users\[felhasználónév]\Downloads

# Másold fel a fájlokat a VPS-re
scp schema.sql root@92.118.26.81:/opt/supabase/docker/
scp data.sql root@92.118.26.81:/opt/supabase/docker/
```

### 3.2 WinSCP használatával

1. Nyisd meg a WinSCP-t
2. Kapcsolódj: `root@92.118.26.81`
3. Navigálj: `/opt/supabase/docker/`
4. Húzd át a `schema.sql` és `data.sql` fájlokat

### 3.3 Ellenőrzés a szerveren

```bash
# SSH-val kapcsolódj
ssh root@92.118.26.81

# Ellenőrizd a fájlokat
cd /opt/supabase/docker
ls -la *.sql
```

---

## 4. Adatbázis importálás

### 4.1 Séma importálása

```bash
# Lépj a Supabase Docker mappába
cd /opt/supabase/docker

# Séma importálása
cat schema.sql | sudo docker compose exec -T db psql -U postgres
```

### 4.2 Adatok importálása

```bash
# Adatok importálása
cat data.sql | sudo docker compose exec -T db psql -U postgres
```

### 4.3 Fontos megjegyzések

- Az importálás sorrendje: **ELŐSZÖR séma, UTÁNA adatok!**
- Ha hiba van, először a séma-hibákat javítsd
- Nagyobb adatmennyiség esetén az import akár percekig is tarthat

---

## 5. Ellenőrzés

### 5.1 Táblák ellenőrzése

```bash
# Csatlakozz a PostgreSQL-hez
sudo docker compose exec db psql -U postgres

# Listázd a táblákat
\dt

# Ellenőrizz néhány táblát
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM faqs;
SELECT COUNT(*) FROM orders;

# Kilépés
\q
```

### 5.2 API ellenőrzése

```bash
# Teszteld a REST API-t
curl -H "apikey: [ANON_KEY]" \
     -H "Authorization: Bearer [ANON_KEY]" \
     https://api.thecoach.hu/rest/v1/products?select=id,title_hu&limit=3
```

### 5.3 Frontend ellenőrzése

1. Nyisd meg: `https://thecoach.hu`
2. Ellenőrizd, hogy a termékek megjelennek
3. Ellenőrizd az FAQ szekciót
4. Jelentkezz be az admin felületre

---

## 6. Hibaelhárítás

### 6.1 "relation does not exist" hiba

Ez azt jelenti, hogy a séma importálása nem sikerült vagy hiányos.

```bash
# Ellenőrizd a séma-hibákat
cat schema.sql | sudo docker compose exec -T db psql -U postgres 2>&1 | grep ERROR
```

### 6.2 "duplicate key" hiba

Ha már léteznek adatok a táblákban:

```bash
# Töröld a meglévő adatokat (ÓVATOSAN!)
sudo docker compose exec db psql -U postgres -c "TRUNCATE products CASCADE;"
```

### 6.3 Teljes újrakezdés

Ha teljesen újra szeretnéd kezdeni:

```bash
cd /opt/supabase/docker

# Állítsd le a szolgáltatásokat
sudo docker compose down

# Töröld az adatbázis volume-ot
sudo docker volume rm docker_db-data

# Indítsd újra
sudo docker compose up -d

# Várd meg, amíg elindul (kb. 30 másodperc)
sleep 30

# Importáld újra
cat schema.sql | sudo docker compose exec -T db psql -U postgres
cat data.sql | sudo docker compose exec -T db psql -U postgres
```

### 6.4 RLS policy hibák

Ha RLS hibákat kapsz bejelentkezés után:

```bash
# Ellenőrizd az RLS szabályokat
sudo docker compose exec db psql -U postgres -c "SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';"
```

### 6.5 Admin felhasználó létrehozása

Ha nincs admin felhasználó:

```bash
# Csatlakozz az adatbázishoz
sudo docker compose exec db psql -U postgres

# Hozd létre az admin role-t ha hiányzik
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'admin@thecoach.hu'
ON CONFLICT DO NOTHING;

\q
```

---

## Storage migráció

A Storage bucket-ek és fájlok külön migrációt igényelnek:

### Storage bucket-ek létrehozása

```sql
-- Csatlakozz az adatbázishoz
sudo docker compose exec db psql -U postgres

-- Bucket-ek létrehozása
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('book-covers', 'book-covers', true),
  ('book-files', 'book-files', false),
  ('email_attachments', 'email_attachments', false)
ON CONFLICT (id) DO NOTHING;
```

### Fájlok migrálása

A fájlokat manuálisan kell feltölteni a Supabase Studio-n keresztül, vagy az S3-kompatibilis API-val.

---

## Rendszeres biztonsági mentés

### Automatikus backup script

Hozd létre a backup scriptet:

```bash
sudo vim /opt/supabase/backup.sh
```

Tartalom:

```bash
#!/bin/bash
BACKUP_DIR="/opt/supabase/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Adatbázis dump
docker compose -f /opt/supabase/docker/docker-compose.yml exec -T db pg_dump -U postgres > $BACKUP_DIR/backup_$DATE.sql

# Régi backupok törlése (30 napnál régebbiek)
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete

echo "Backup kész: $BACKUP_DIR/backup_$DATE.sql"
```

### Cron job beállítása

```bash
# Szerkeszd a crontab-ot
sudo crontab -e

# Add hozzá (minden nap éjfélkor):
0 0 * * * /opt/supabase/backup.sh >> /var/log/supabase-backup.log 2>&1
```

---

*Utolsó frissítés: 2025. január*
