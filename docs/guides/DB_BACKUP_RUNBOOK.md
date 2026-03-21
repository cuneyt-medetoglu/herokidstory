# Database Backup Runbook (1.2.7)

**Amaç:** Production PostgreSQL (EC2) yedekleme ve gerektiğinde geri yükleme.  
**Script:** `scripts/db-backup.sh`  
**S3:** `s3://BUCKET_ADI/backups/db/` (backups prefix public değil; sadece IAM/uygulama erişir).

---

## 1. İlk kurulum (EC2’de bir kez)

### 1.1 S3’te prefix

Mevcut bucket’ta (örn. `herokidstory`) `backups/db` klasörü oluşturman gerekmez; script ilk yüklemede otomatik oluşturur. İstersen S3 Console → Create folder: `backups`, içinde `db`.

### 1.2 Script’i çalıştırılabilir yap

```bash
cd ~/herokidstory
chmod +x scripts/db-backup.sh
```

### 1.3 Şifre: cron için .pgpass (önerilen)

Cron ortamında `PGPASSWORD` vermek için `.pgpass` kullan:

```bash
echo "localhost:5432:herokidstory:herokidstory:GERCEK_DB_SIFREN" >> ~/.pgpass
chmod 600 ~/.pgpass
```

`GERCEK_DB_SIFREN` yerine production DB şifresini yaz. Satır formatı: `host:port:database:user:password`.

Script `PGPASSWORD` bekliyor; `.pgpass` varsa `pg_dump` onu kullanır. Cron’da env vermek istersen aşağıdaki gibi export ekleyebilirsin (daha az güvenli).

### 1.4 Ortam değişkenleri

Script şunları kullanır (varsayılanlar parantez içinde):

| Değişken | Varsayılan | Açıklama |
|----------|------------|----------|
| `PGPASSWORD` | — | Zorunlu (cron için .pgpass veya export). |
| `PGHOST` | localhost | |
| `PGUSER` | herokidstory | |
| `PGDATABASE` | herokidstory | |
| `AWS_S3_BUCKET` | herokidstory | S3 bucket adı. |
| `AWS_REGION` | eu-central-1 | EC2 IAM role ile zaten set olabilir. |
| `DB_BACKUP_RETENTION_DAYS` | 14 | S3’te kaç günlük yedek tutulacak. |

EC2’de uygulama `.env`’inde zaten `AWS_S3_BUCKET` ve `AWS_REGION` varsa, sadece `PGPASSWORD` (veya .pgpass) yeterli.

---

## 2. Manuel yedek alma

```bash
cd ~/herokidstory
export PGPASSWORD='GERCEK_DB_SIFREN'   # veya .pgpass kullan
./scripts/db-backup.sh
```

Çıktı: `backups/herokidstory-YYYY-MM-DD-HHMM.dump` oluşturulur, S3’e yüklenir, yerel dosya silinir.

---

## 3. Cron ile otomatik yedek (günlük)

```bash
crontab -e
```

Eklenacak satır (her gün 03:00; .pgpass kullanıyorsan PGPASSWORD gerekmez):

```cron
0 3 * * * cd /home/ubuntu/herokidstory && PGPASSWORD='GERCEK_SIFRE' ./scripts/db-backup.sh >> /home/ubuntu/herokidstory/logs/db-backup.log 2>&1
```

Veya .pgpass kullanıyorsan:

```cron
0 3 * * * cd /home/ubuntu/herokidstory && ./scripts/db-backup.sh >> /home/ubuntu/herokidstory/logs/db-backup.log 2>&1
```

Log dizini yoksa: `mkdir -p /home/ubuntu/herokidstory/logs`.

---

## 4. S3’ten yedek listeleme / indirme

```bash
aws s3 ls s3://herokidstory/backups/db/
aws s3 cp s3://herokidstory/backups/db/herokidstory-2026-02-12-0300.dump ./
```

---

## 5. Restore (geri yükleme)

**Dikkat:** Mevcut veritabanının üzerine yazar. Production’da önce test ortamında dene.

1. İndir (yukarıdaki gibi) veya EC2’de zaten varsa kullan.
2. Gerekirse mevcut bağlantıları kes; tek kullanıcı modunda restore daha güvenli:

```bash
sudo -u postgres psql -d herokidstory -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'herokidstory' AND pid <> pg_backend_pid();"
pg_restore -h localhost -U herokidstory -d herokidstory --clean --if-exists -F c herokidstory-2026-02-12-0300.dump
```

`--clean --if-exists`: Var olan objeleri siler sonra yükler. Şema uyumsuzluğu olursa hata alabilirsin; migration ile uyumlu yedek kullan.

---

## 6. Retention

Script varsayılan olarak S3’te **son 14 gün** yedek tutar; daha eski dosyaları siler. Süreyi değiştirmek için:

```bash
DB_BACKUP_RETENTION_DAYS=30 ./scripts/db-backup.sh
```

Cron’da: `0 3 * * * ... DB_BACKUP_RETENTION_DAYS=30 ./scripts/db-backup.sh ...`

---

**İlgili:** `docs/plans/AWS_ORTAM_SIFIRDAN_KURULUM_REHBERI.md`, `docs/implementation/FAZ5_5_IMPLEMENTATION.md` (1.2.7).
