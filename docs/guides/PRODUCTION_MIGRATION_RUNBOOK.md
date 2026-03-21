# Production Veritabanı Migration Runbook (5.5.10)

**Amaç:** Yeni bir şema migration’ı (SQL dosyası) eklediğinde, bunu production PostgreSQL’de **güvenli şekilde** çalıştırma akışı.  
**Not:** Bu doküman “local veriyi prod’a taşıma” değil; **şema değişikliklerini** (yeni tablo, kolon, index vb.) prod’da uygulama rehberidir.

---

## 1. Ne zaman bu runbook kullanılır?

- `migrations/` klasörüne **yeni bir .sql dosyası** eklediğinde (örn. `018_xxx.sql`, `019_yyy.sql`)
- Bu migration’ı **production** veritabanında (EC2’deki `herokidstory` DB) çalıştırman gerektiğinde

---

## 2. Ön koşul: Backup

Migration çalıştırmadan **önce mutlaka** yedek al.

```bash
cd ~/herokidstory
./scripts/db-backup.sh
```

Yedekler `s3://BUCKET/backups/db/` altına gider. Detay: `docs/guides/DB_BACKUP_RUNBOOK.md`.

---

## 3. Yeni migration dosyasını production’a alma

**3.1** Yeni migration’ı repoda commit edip EC2’ye çek:

```bash
# EC2'de
cd ~/herokidstory
git pull
```

**3.2** Veya tek dosyayı kopyala (henüz deploy yoksa):

```bash
# Lokal'den
scp -i KEY_PEM migrations/018_xxx.sql ubuntu@EC2_IP:~/herokidstory/migrations/
```

---

## 4. Migration’ı production’da çalıştırma

**4.0 Nerede çalıştırılır?**
- **Sadece sunucuda (EC2).** Lokal PC'de `psql` kurulu değilse migration orada çalıştırılamaz. Uygulama (hem local hem sunucu) aynı PostgreSQL'e bağlanıyorsa (local SSH tüneli ile), migration **bir kez EC2'de** çalıştırıldığında yeterlidir.
- EC2'ye SSH ile bağlan, proje dizinine geç: `cd ~/herokidstory`

**4.1** Bağlantı: Sunucuda PostgreSQL kullanıcısı `herokidstory` (ubuntu değil). `.env` içindeki `DATABASE_URL` ile çalıştır:

```bash
cd ~/herokidstory
psql "$DATABASE_URL" -f migrations/020_ai_requests.sql
# Örnek (Mart 2026): books tarih alanları → TIMESTAMPTZ — migrations/024_books_timestamps_timestamptz.sql
```

Eğer `DATABASE_URL` shell'de yüklü değilse (direkt vermek için):

```bash
psql "postgresql://herokidstory:ŞİFRENİZ@localhost:5432/herokidstory" -f migrations/020_ai_requests.sql
```
(ŞİFRENİZ = .env'deki DATABASE_URL içindeki parola; boşluk/special char varsa tırnak içinde kullan.)

**4.2** Eski yöntem (Runbook’ta geçen): `-h -U -d` ile tek tek parametre:

```bash
psql -h localhost -U herokidstory -d herokidstory -f migrations/020_ai_requests.sql
```
Şifre sorarsa: .env’deki parolayı gir (KidStoryBook_Pg_8kL3mN9pQr2 vb.).

**İlk kurulumda tüm migration’ların sırası** için: `docs/plans/AWS_ORTAM_SIFIRDAN_KURULUM_REHBERI.md` → Bölüm 3.4.

---

## 5. Hata alırsan (rollback)

1. Migration **yarım kaldıysa** veya hata verdi: Uygulama tarafında sorun olabilir; aynı migration’ı tekrar çalıştırmak bazen “already exists” hatası verir.
2. **Geri almak** için: Son backup’tan restore et. Adımlar: `docs/guides/DB_BACKUP_RUNBOOK.md` → “Restore (geri yükleme)”.
3. Restore sonrası uygulama kodunu da **migration öncesi** sürüme çek (veya migration’ı düzelterek tekrar dene).

---

## 6. Özet kontrol listesi

| Adım | Yap |
|------|-----|
| 1 | `./scripts/db-backup.sh` çalıştır |
| 2 | `git pull` veya yeni migration dosyasını EC2’ye kopyala |
| 3 | Sadece **henüz uygulanmamış** migration’ları sırayla `psql -f ...` ile çalıştır |
| 4 | Hata varsa backup’tan restore; dokümante et |

---

**İlgili:** `docs/guides/DB_BACKUP_RUNBOOK.md`, `docs/plans/AWS_ORTAM_SIFIRDAN_KURULUM_REHBERI.md` (3.4 Migration’ları çalıştır).
