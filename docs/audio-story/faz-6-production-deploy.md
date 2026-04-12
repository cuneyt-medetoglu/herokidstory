# Faz 6 — Production Deploy & Doğrulama

**Durum:** ✅ Tamamlandı (FFmpeg sunucuda, migration, worker)  
**Bağımlılık:** Faz 5 (video üretim kodu hazır)  
**Çıktı:** Sunucuda FFmpeg kurulu, migration uygulandı, yeni kitaplarda video otomatik üretiliyor

---

## Neden gerekli?

Faz 5'te tüm kod yazıldı. Ancak üretim ortamında aşağıdakilerin yapılması gerekiyor:

1. **Sunucuya FFmpeg kurulumu** — video encoding için şart
2. **DB migration** — `video_url` / `video_path` kolonları tabloya eklenmeli
3. **Worker deploy** — yeni pipeline kodu sunucuya gönderilmeli
4. **Test** — yeni kitap oluşturup videoyu doğrulamak

---

## Adımlar

### A) Sunucu (EC2 / VPS)

```bash
# FFmpeg kur
sudo apt update && sudo apt install -y ffmpeg

# Doğrula
ffmpeg -version
ffprobe -version
```

### B) Veritabanı Migration

```sql
-- migrations/035_books_video_url.sql
ALTER TABLE books ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS video_path TEXT;

-- migrations/036_books_audio_story.sql (sesli hikaye durumu)
-- audio_story_status, audio_story_version, audio_story_generated_at
```

**Nasıl çalıştırılır:**

```bash
# Uygulamanız otomatik migration çalıştırıyorsa — deploy yeterli
# Manuel çalıştırmak için:
psql $DATABASE_URL -f migrations/035_books_video_url.sql
```

### C) Worker Deploy

```bash
git pull origin main
npm install
npm run build
# pm2 veya service'i yeniden başlat
pm2 restart all
```

### D) Test

1. Yeni bir kitap oluştur (herhangi bir dil)
2. Oluşturma ekranında "Video oluşturuluyor" adımının göründüğünü doğrula
3. Kitap tamamlandığında dashboard'da "İzle" butonuna bas
4. Video oynar, ses seçilen dilde çıkar
5. İndir butonuna bas — MP4 cihaza iner

---

## Local Geliştirme (Test için)

### Seçenek A — FFmpeg kur

```bash
# Windows
winget install ffmpeg
# ya da
choco install ffmpeg

# macOS
brew install ffmpeg

# Linux
sudo apt install ffmpeg
```

### Seçenek B — Video adımını atla

`.env.local` dosyasına ekle:

```
SKIP_VIDEO_GENERATION=1
```

Bu bayrak açıkken kitap oluşturma video adımını atlar, kitap yine tamamlanır.

---

## Kontrol Listesi

- [ ] EC2'de `ffmpeg -version` çalışıyor
- [ ] Migration 035 uygulandı (`books` tablosunda `video_url` kolonu var)
- [ ] Worker yeni kodu çalıştırıyor (`video_generating` adımı loglarda görünüyor)
- [ ] Yeni kitap oluşturuldu — video S3'e yüklendi (`books.video_url` dolu)
- [ ] Ödeme sonrası sayfada "Video oluşturuluyor" adımı görünüyor
- [ ] VideoPlayer'da İndir butonu çalışıyor
- [ ] İngilizce kitapta İngilizce ses, Türkçe kitapta Türkçe ses geliyor

---

## Olası Sorunlar

| Sorun | Muhtemel Neden | Çözüm |
|-------|----------------|-------|
| Video üretilmiyor | FFmpeg kurulu değil | `sudo apt install ffmpeg` |
| `books.video_url` sütunu yok | Migration çalışmadı | SQL dosyasını manuel çalıştır |
| Ses yanlış dilde | Eski TTS cache'i kullanılıyor | Kitabı yeniden oluştur |
| İzle butonu yok | Kitap eski worker ile oluşturuldu | Yeni kitap oluştur |
| Worker eski kodu çalıştırıyor | Deploy yapılmadı | `pm2 restart all` |
