# Yerel vs production: Redis ve DB yedek (kısa not)

**Tarih:** 2026-03-21  
**Amaç:** Deploy sırasında karışan iki konuyu tek yerde tutmak (prompt-manager / proje takibi ile çapraz referans).

---

## 1) Redis — yerelde Docker, prod’da systemd

| Ortam | Nasıl çalışıyor |
|-------|------------------|
| **Yerel (geliştirme)** | Çoğu zaman **Docker**: `docker run -d --name redis-herokidstory -p 6379:6379 redis:7-alpine` (veya WSL’de `apt install redis-server`). Uygulama `localhost:6379` veya `REDIS_URL` ile bağlanır. |
| **Production (EC2)** | **`apt install redis-server`** + **systemd** (`redis-server.service`), `bind 127.0.0.1`, port **6379**. Docker **şart değil**; BullMQ worker aynı makinede Redis’e TCP ile bağlanır. |

Kod tarafı: `lib/queue/client.ts` → `REDIS_URL` yoksa `redis://localhost:6379`.

---

## 2) `db-backup` — zaten “cron + S3 bucket” modeli

Sektörde tipik pattern: **pg_dump** (veya mantıksal yedek) → **nesne depolama** (S3) → isteğe bağlı **retention** + düzenli **cron**.

Bu repoda **hazır script** var; ayrı bir bucket açmana gerek yok: mevcut **`AWS_S3_BUCKET`** içinde prefix **`backups/db/`** kullanılır (public değil).

- **Script:** `scripts/db-backup.sh` — `pg_dump` → `aws s3 cp` → yerel dump silinir → S3’te eski dosyalar retention ile temizlenir.
- **Runbook:** `docs/guides/DB_BACKUP_RUNBOOK.md` — `.pgpass` veya `PGPASSWORD`, cron örneği (örn. günlük 03:00), restore.
- **Migration öncesi:** `docs/guides/PRODUCTION_MIGRATION_RUNBOOK.md` — önce yedek, sonra `psql -f migrations/...`.

**Dikkat:** Script varsayılanları `PGUSER` / `PGDATABASE` için **`herokidstory`** kullanır. Eski `kidstorybook` kullanan bir ortamda isen `export PGUSER=...` / `PGDATABASE=...` ile eşleştir veya `.pgpass` satırını güncelle.

---

## 3) İlgili checklist

- `docs/checklists/EC2_DEPLOY_POST_PULL_2026.md` — disk, Redis, build, migration, PM2.
- `docs/implementation/FAZ0_REDIS_PM2.md` — Redis + PM2 worker.

## 4) PM2 worker `errored` iken

Eski süreç yanlış yapılandırma veya Redis yokken kalmış olabilir. Temiz yeniden başlatma: `pm2 delete herokidstory-worker` (ve gerekirse web) → proje kökünde `pm2 start ecosystem.config.cjs` → `pm2 save`. `pm2 list` **online** ve düşük **↺** olmalı.
