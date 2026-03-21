# EC2 deploy kontrol listesi (pull sonrası — geçici)

**Amaç:** Sunucuda `git pull` sonrası Redis, worker, build, migration ve PM2 adımlarını tek yerden takip etmek.  
**Kaynak:** `docs/implementation/FAZ0_REDIS_PM2.md`, `docs/guides/PRODUCTION_MIGRATION_RUNBOOK.md`, [AWS: EBS volume modify](https://docs.aws.amazon.com/ebs/latest/userguide/requesting-ebs-volume-modifications.html), önceki deploy özeti.

Tamamladıkça `[ ]` → `[x]` yapın.

**Önerilen sıra:** **0.5** → isteğe bağlı **§0** → **§1 Redis** → **§2 build** → **§3 migration** → **§4 PM2** → **§5** duman testi.

**Şu an:** §0.5–§4 tamam (21 Mar 2026). Kalan: **§5 duman testi** (isteğe bağlı: `pm2 startup` bir kez kurulmadıysa reboot sonrası için).

---

## 0.5) AWS EBS kök volume boyutunu artırma (önerilen)

Mevcut örnek: `df -h /` → **~6.8 GiB** toplam, **%80+ dolu** — Next build, `node_modules`, PostgreSQL, log ve Redis ile **7 GiB** kısa kalır. Kök diski **AWS tarafında büyütüp** işletim sisteminde **partition + dosya sistemini** genişletmeniz gerekir (sadece AWS’te sayıyı artırmak yetmez).

### A) AWS Management Console

1. **EC2** → **Instances** → ilgili instance’ı seçin (ör. `ip-172-31-45-145`).
2. **Storage** sekmesi → kök volume’a bağlı **Volume ID**’ye tıklayın (genelde `/dev/sda1` veya `/dev/xvda` / `nvme` eşlemesi).
3. **Actions** → **Modify volume**.
4. **Size** değerini artırın (örnek: **20 GiB** veya **30 GiB**; maliyet: gp3 için GB-başına düşük, proje arşivinde ~30 GB önerisi de geçiyor: `docs/archive/2026-02/aws-plans/SUPABASE_TO_AWS_ANALYSIS.md`).
5. **Modify** onaylayın. Volume durumu **modifying** → **optimizing** / **completed** olana kadar bekleyin (birkaç dakika sürebilir).

İsteğe bağlı güvenlik: **Snapshot** alıp sonra modify (kritik veriyi başka yere taşımıyorsanız genelde hızlı işlem yeterli; yine de önemli prod için snapshot düşünülebilir).

### B) Ubuntu’da partition ve dosya sistemini genişletme (SSH)

Volume AWS’te büyüdükten sonra **aynı instance’a SSH** ile bağlanın. Cihaz adları instance tipine göre **`/dev/xvda`** veya **`/dev/nvme0n1`** olabilir; önce kontrol edin:

```bash
lsblk
df -Th /
```

**1)** Kök partition genelde `…p1` (ör. `nvme0n1p1` veya `xvda1`). `growpart` ile partition’ı diskin yeni sonuna kadar büyütün (disk adını `lsblk` çıktısına göre yazın):

```bash
# Örnek NVMe (çoğu yeni instance):
sudo growpart /dev/nvme0n1 1

# Eski Xen stili ise örnek:
# sudo growpart /dev/xvda 1
```

`growpart` yoksa: `sudo apt install -y cloud-guest-utils`

**2)** Dosya sistemini büyütün — **`df -Th /` çıktısındaki FSTYPE**’e göre **birini** kullanın:

- **ext4** ise:

```bash
# Kök mount hangi partition'daysa onu verin (örnek):
sudo resize2fs /dev/nvme0n1p1
```

- **xfs** ise (genelde mount point üzerinden):

```bash
sudo xfs_growfs -d /
```

**3)** Doğrulama:

```bash
df -h /
```

Beklenti: **Size** ve **Avail** artmış olmalı.

### C) Kontrol listesi (0.5)

- [x] AWS’te kök EBS volume boyutu artırıldı (örn. 20–30 GiB) — **prod: 8 → 30 GiB gp3**
- [x] Volume işlemi tamamlandı (`completed` / optimize bitti)
- [x] `growpart` + `resize2fs` **veya** `xfs_growfs` uygun olanı uygulandı
- [x] `df -h /` yeni kapasiteyi gösteriyor

**Doğrulama özeti (21 Mart 2026, `herokidstory` EC2):** Kök disk **NVMe** (`nvme0n1` 30G). `growpart /dev/nvme0n1 1` → `nvme0n1p1` **~29G**; `resize2fs /dev/nvme0n1p1` (ext4). Sonuç: `df -h /` → **Size ~29G**, **Avail ~23G**, **Use% ~20%**. Tamam.

---

## 0) Disk ve log boyutu (silmeden önce)

Disk genişletildiyse bu bölüm **isteğe bağlı** (yer sıkışıklığı acil değilse atlanabilir veya hızlı kontrol için §0.2–0.3).

### 0.1 Bu “disk dolu” nerede?

Evet: **bu EC2 instance’ın kök dosya sistemi** (`/`). SSH ile bağlandığınızda Ubuntu’nun gösterdiği özet örneği:

- `Usage of /: 83.2% of 6.71GB` → **root volume** (genelde tek partition, ~7 GB küçük bir disk).

Yani temizlik/yer açma **sunucunun kendi diski** üzerinde yapılır; sizin lokal PC diskiniz değil.

### 0.2 Genel doluluk (özet)

Sunucuda (SSH):

```bash
df -h /
df -h
```

### 0.3 Log ve büyük klasörler — ne kadar yer tutuyor? (sadece okuma)

Silmeden önce boyutları görmek için:

```bash
# Sistem logları (syslog, nginx, vb.)
sudo du -sh /var/log/* 2>/dev/null | sort -hr | head -20

# systemd journal (ayrı tutulur; bazen yüzlerce MB)
sudo journalctl --disk-usage

# PM2 log dizini (varsa)
du -sh ~/.pm2/logs 2>/dev/null
ls -la ~/.pm2/logs 2>/dev/null

# Proje içi (Next build, npm, uygulama logları)
cd ~/herokidstory 2>/dev/null || cd /path/to/herokidstory
du -sh .next 2>/dev/null
du -sh node_modules 2>/dev/null
du -sh logs 2>/dev/null
du -ch logs/*.jsonl 2>/dev/null | tail -1

# En büyük 30 dosya (proje kökünde; biraz yavaş olabilir)
find . -maxdepth 4 -type f -size +1M 2>/dev/null | head -30
sudo du -ah /var/log 2>/dev/null | sort -hr | head -15
```

**Not:** `node_modules` ve `.next` genelde çok yer kaplar; bunlar **silmek yerine** gerektiğinde `npm run build` / `npm install` ile yeniden üretilir. Gerçekten yer açacaksanız önce hangi klasörün MB tuttuğunu bu komutlarla netleştirin.

### 0.4 Yer açma (isteğe bağlı — sonra)

- `sudo apt clean` (apt önbelleği)
- Eski journal: `sudo journalctl --vacuum-time=7d` (dikkat: eski log gider)
- Eski arşiv loglar: `/var/log/*.gz` vb. (önce 0.3 ile boyutları görün)

Bu adımları yapmadan önce **0.3 çıktısını** kaydedin; gereksiz silme olmaz.

- [ ] `df -h /` not edildi
- [ ] `/var/log`, `journal`, `~/.pm2/logs`, `~/herokidstory/.next`, `logs/` boyutları kontrol edildi

---

## 1) Redis kurulumu (worker için)

- [x] `sudo apt update && sudo apt install -y redis-server` — **prod:** paket zaten kurulu (`redis-server` 7.0.15, noble)
- [x] `sudo systemctl enable redis-server && sudo systemctl start redis-server` — **active (running)**, dinleme **127.0.0.1:6379**
- [x] `/etc/redis/redis.conf` → `bind 127.0.0.1`, `sudo systemctl restart redis-server` — `protected-mode yes`, `port 6379`
- [x] `redis-cli ping` → `PONG`
- [ ] (İsteğe bağlı) `.env` içine `REDIS_URL=redis://localhost:6379` — kod varsayılanı zaten `localhost:6379`; eklersen açık olur

**Doğrulama (21 Mart 2026):** Servis çıktısında `redis-server 127.0.0.1:6379`; dış ağa açık değil. Tamam.

---

## 2) Bağımlılık ve build

```bash
cd ~/herokidstory
npm install
npm run build
```

- [x] `npm install` tamam — **21 Mar 2026:** +27 paket, audit uyarıları ayrı ele alınabilir
- [x] `npm run build` başarılı — Next 14.2.35, 84 sayfa

---

## 3) Veritabanı migration (yedekten sonra)

**`db-backup` ne?** Hazır script: PostgreSQL dump → **aynı AWS hesabındaki mevcut S3 bucket** içine `backups/db/` altına yükler; ayrı “yedek bucket” şart değil. Otomasyon için **cron** önerilir (`docs/guides/DB_BACKUP_RUNBOOK.md`). Özet: `docs/analysis/DEPLOYMENT_LOCAL_VS_PROD_OPS.md`.

- [x] `chmod +x scripts/db-backup.sh` (bir kez)
- [x] `.pgpass` / `herokidstory`
- [x] `./scripts/db-backup.sh` — S3’e yüklendi
- [x] 023 / 024 — **çalıştırılmadı**; `information_schema` sorgusu ile **zaten uygulanmış** doğrulandı (21 Mar 2026)

*(Shell’de `DATABASE_URL` yoksa `set -a && source .env && set +a` veya runbook’taki gibi bağlantı string’i.)*

---

## 4) PM2 — web + worker

```bash
cd ~/herokidstory
pm2 delete all   # veya sadece eski süreçleri
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup      # çıkan komutu bir kez çalıştır
pm2 status
pm2 logs herokidstory-worker --lines 50
```

- [x] `herokidstory` ve `herokidstory-worker` **online** — **21 Mar 2026:** eski worker `errored` / yanlış mod; `pm2 delete` + `pm2 start ecosystem.config.cjs` + `pm2 save` sonrası ikisi **online**, **↺ 0**
- [x] Worker ayakta (BullMQ süreci çalışıyor) — `pm2 logs` dosyası boş görünebilir; kritik olan **status online** ve iş kuyruğu testi (§5). İstersen canlı log: `pm2 logs herokidstory-worker` (Ctrl+C ile çık)

**Not:** `pm2 list` bazen **mode: cluster** gösterebilir (`ecosystem.config.cjs` içinde `instances: 1` olsa bile); PM2 sürümüne bağlı. Sorun değil, süreç **online** ise.

**Redis özeti (Docker yok):** `sudo systemctl status redis-server`, `redis-cli ping` → `PONG`; süreç `127.0.0.1:6379`.

---

## 5) Duman testi

- [ ] Siteden kitap oluşturma akışı (veya admin queues) ile işin işlendiği doğrulandı

---

## İlgili dokümanlar

- `docs/implementation/FAZ0_REDIS_PM2.md`
- `docs/guides/PRODUCTION_MIGRATION_RUNBOOK.md`
