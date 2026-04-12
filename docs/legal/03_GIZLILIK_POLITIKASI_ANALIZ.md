# Gizlilik Politikası — Analiz ve Hazırlık Rehberi

**Öncelik:** 🔴 FAZ 1 — En Yüksek (Çocuk verisi + ödeme verisi işliyorsun)  
**Kapsam:** 🌍 Global — Hem TR hem yurt dışı kullanıcıları kapsıyor  
**Yasal Dayanak:** 6698 sayılı KVKK, AB GDPR (2016/679), COPPA (ABD, çocuk kullanıcılar)  
**Sayfa URL:** `/privacy`  
**Footer'da Linki:** Zaten mevcut  
**Dil:** TR + EN (her iki versiyon zorunlu — global satış yapılıyor)

> **NOT:** E-book tüm dünyaya satıldığı için Gizlilik Politikası hem KVKK hem GDPR hem COPPA uyumlu olmalı. Tek bir belge, her üçünü kapsayacak şekilde hazırlanabilir (layered approach).

---

## 1. Neden Bu Kadar Kritik?

HeroKidStory, **özel nitelikli veriler** işleyen bir platformdur:

### Yüksek Risk Faktörleri

| Risk | Açıklama | Yasal Sonuç |
|------|---------|-------------|
| **Çocuk fotoğrafı** | Biyometrik veri içerebilir | KVKK Madde 6 — Açık rıza zorunlu |
| **Çocuğun adı/yaşı/cinsiyeti** | Kişisel veri (küçük ait) | Ebeveyn rızası gerekli |
| **AI'ya gönderilen fotoğraf** | OpenAI/3. taraf işlemesi | Aktarım rızası gerekli |
| **Ödeme verisi** | Kredi kartı bilgileri (İyzico'ya gönderilen) | PCI-DSS, açıklama zorunlu |
| **Konum/IP verisi** | Para birimi tespiti için kullanılıyor | Kullanım amacı açıklanmalı |
| **Kullanıcı davranışı** | Analytics (varsa) | Çerez onayı ile bağlantılı |

---

## 2. Gizlilik Politikasında ZORUNLU Olan Bölümler

### KVKK Madde 10 — Aydınlatma Yükümlülüğü

KVKK'ya göre veri işlemeye başlamadan önce ilgili kişiye şunlar bildirilmeli:

- [ ] Veri sorumlusunun kimliği ve iletişim bilgileri
- [ ] İşlenen kişisel verilerin kategorileri
- [ ] Kişisel verilerin işlenme amacı
- [ ] Kişisel verilerin kiminle paylaşıldığı (yurt içi / yurt dışı)
- [ ] Kişisel verilerin toplanma yöntemi ve hukuki sebebi
- [ ] Veri sahibinin hakları (KVKK Madde 11)

### GDPR Madde 13/14 — AB Kullanıcıları İçin

AB kullanıcıları için ek olarak:
- [ ] Veri saklama süresi
- [ ] Otomatik karar verme / profil oluşturma bilgisi
- [ ] Şikayet hakkı (Veri Koruma Otoritesi)
- [ ] Rızanın geri çekilme hakkı

---

## 3. HeroKidStory'de İşlenen Veriler — Tam Liste

### 3.1 Kullanıcı (Ebeveyn) Verileri

| Veri | Toplama Noktası | Amaç | Hukuki Dayanak |
|------|----------------|-------|----------------|
| E-posta adresi | Kayıt | Hesap yönetimi, bildirimler | Sözleşme ifası |
| Şifre (hash) | Kayıt | Kimlik doğrulama | Sözleşme ifası |
| Ad/Soyad | Profil / Ödeme | Hesap + fatura | Sözleşme ifası |
| Fatura adresi | Ödeme | Yasal zorunluluk | Kanuni yükümlülük |
| IP adresi | Otomatik | Para birimi tespiti, güvenlik | Meşru menfaat |
| Cihaz/tarayıcı bilgisi | Otomatik | Güvenlik, teknik işlev | Meşru menfaat |
| OAuth token (Google/FB) | Login | Giriş | Açık rıza |

### 3.2 Çocuğa Ait Veriler (En Yüksek Hassasiyet)

| Veri | Toplama Noktası | Amaç | Hukuki Dayanak |
|------|----------------|-------|----------------|
| **Çocuk fotoğrafı** | Karakter oluşturma | AI ile görsel üretim | **Açık rıza (ebeveyni)** |
| Çocuğun adı | Karakter formu | Hikayede kullanım | Açık rıza |
| Çocuğun yaşı | Karakter formu | Yaş grubu belirleme | Açık rıza |
| Çocuğun cinsiyeti | Karakter formu | Karakter özellikleri | Açık rıza |
| Fiziksel özellikler (saç/göz rengi) | Karakter formu | AI prompt oluşturma | Açık rıza |

> ⚠️ **KRİTİK:** Çocuk fotoğrafı KVKK kapsamında "özel nitelikli kişisel veri" (biyometrik) sayılabilir. Bu verinin işlenmesi için **açık ve ayrı bir rıza** alınması gerekir. Genel "Kullanım Koşullarını Kabul Ediyorum" checkbox'ı YETMEZ.

### 3.3 Üçüncü Taraflara Aktarılan Veriler

| 3. Taraf | Aktarılan Veri | Amaç | Ülke | GDPR/KVKK Notu |
|---------|----------------|-------|------|----------------|
| **OpenAI** | Çocuk fotoğrafı, prompt | AI görsel/metin üretimi | ABD | Yurt dışı aktarım rızası |
| **İyzico** | Ödeme bilgileri, ad/soyad | Ödeme işleme | TR | KVKK uyumlu |
| **Firebase/NextAuth** | E-posta, session | Kimlik doğrulama | ABD | Yurt dışı aktarım rızası |
| **Vercel** | IP, request logları | Hosting/CDN | ABD | Yurt dışı aktarım rızası |
| **Resend** (e-posta) | E-posta adresi | Bildirimler | ABD/EU | Yurt dışı aktarım rızası |
| **Analytics** (varsa) | Davranış verisi | İstatistik | Değişken | Çerez onayı |

> ⚠️ **OpenAI aktarımı:** Çocuk fotoğrafının OpenAI'ya gönderildiği kullanıcıya açıkça bildirilmeli ve özellikle onaylatılmalıdır. Bu bilgi gizlilik politikasında net yazılmalı.

---

## 4. Çocuk Verisi İçin Özel Gereksinimler

### KVKK'da Küçüklerin Verileri
- Küçüklerin verileri "özel nitelikli" kategoride değerlendirilir
- Ebeveynin açık rızası zorunlu
- Rıza metni sade ve anlaşılır olmalı

### GDPR'da Çocuk Verisi
- 16 yaş altı: Ebeveyn onayı zorunlu (bazı üye devletlerde 13)
- COPPA (ABD): 13 yaş altı çocukların verileri için özel prosedürler
- HeroKidStory 2–10 yaş hedef kitlesi → **Tüm kullanıcılar COPPA ve GDPR kapsamında**

### Uygulamada Ne Yapılmalı?

```
Karakter Oluşturma Adımında:
─────────────────────────────────────────────────────────
⚠️ ÇOCUK VERİSİ BİLDİRİMİ
─────────────────────────────────────────────────────────
Yükleyeceğiniz fotoğraf ve çocuğunuza ait bilgiler 
AI destekli görsel oluşturma amacıyla OpenAI servisine 
iletilecektir. Bu veriler hikaye kitabı üretiminden sonra 
[X gün] içinde sistemlerimizden silinecektir.

[Gizlilik Politikamızı Oku →]

☑ Bu konuda bilgilendirildim ve onay veriyorum   ← ZORUNLU
─────────────────────────────────────────────────────────
```

---

## 5. Politikanın Yapısı / Taslak İçerik Planı

```
1. GİRİŞ
   - HeroKidStory nedir, kim işletiyor
   - Bu politikanın kapsamı
   - Son güncelleme tarihi

2. TOPLANAN VERİLER
   - Hesap ve profil verileri
   - Çocuğa ait veriler (ayrı ve belirgin bölüm)
   - Teknik veriler (IP, cihaz)
   - Ödeme verileri
   - İletişim verileri

3. VERİLERİN KULLANIM AMAÇLARI
   - Her veri türü için ayrı ayrı

4. VERİLERİN PAYLAŞIMI
   - Üçüncü taraf listesi (şeffaf)
   - Yurt dışı aktarım açıklaması

5. VERİ SAKLAMA SÜRELERİ
   - Hesap verisi: Aktif sürece; hesap silinince **anında** silinir (taslak v1.2)
   - Çocuk referans fotoğrafı: Üretim bitince silinir (kalıcı saklama yok)
   - Sipariş verisi: Yasal yükümlülük (10 yıl fatura)
   - Log verileri: Örn. 90 gün (taslakta tanımlı)

6. ÇOCUKLARIN GİZLİLİĞİ (Ayrı Bölüm)
   - 13/16 yaş altı politikası
   - Ebeveyn rızası süreci
   - Ebeveyn silme/güncelleme hakkı

7. VERİ SAHİBİNİN HAKLARI
   KVKK Madde 11:
   - Kişisel verilerinin işlenip işlenmediğini öğrenme
   - İşlenmişse buna ilişkin bilgi talep etme
   - İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme
   - Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme
   - Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme
   - Silinmesini veya yok edilmesini isteme
   - İtiraz hakkı
   - Zararın giderilmesini talep etme

8. GÜVENLİK ÖNLEMLERİ
   - Teknik tedbirler (şifreleme, erişim kontrolü)
   - İdari tedbirler

9. ÇEREZLER
   - Çerez politikasına atıf [→ /cookies]

10. DEĞIŞIKLIKLER
    - Politika değişikliği bildirim yöntemi

11. İLETİŞİM
    - KVKK başvuru adresi (e-posta veya posta)
    - Yanıt süresi (30 gün)
```

---

## 6. Veri Saklama Süreleri (Öneri)

| Veri | Saklama Süresi | Dayanak |
|------|---------------|---------|
| Hesap bilgileri | Hesap aktif sürece; hesap silindiğinde **anında** silinir (`TASLAK_GIZLILIK_POLITIKASI.md` v1.2) | Sözleşme ifası |
| Çocuk fotoğrafı (referans) | Üretim tamamlanınca silinir (kalıcı saklama yok) | Veri minimizasyonu |
| Üretilen kitap görselleri | Kullanıcı silene kadar | Sözleşme ifası |
| Sipariş/fatura kaydı | 10 yıl | VUK zorunluluğu |
| Log / IP kayıtları | 90 gün | Güvenlik / meşru menfaat |
| E-posta iletişimleri | 3 yıl | Meşru menfaat |

---

## 7. Teknik Gereksinimler (Implementation)

### Rıza Kaydı
```
users tablosuna eklenecek:
- kvkk_consent_at: timestamp
- kvkk_consent_version: string
- child_data_consent_at: timestamp (her karakter eklenişinde)
- marketing_consent: boolean
```

### Veri Silme Akışı (KVKK Madde 7)
- "Hesabımı Sil" → Tüm kişisel verilerin silinmesi (yasal saklama zorunluluğu olanlar hariç)
- Silme tamamlandığında e-posta bildirimi
- Mevcut `settings/page.tsx`'te hesap silme zaten var → KVKK uyumlu silme mantığı eklenmeli

### Sayfa Gereksinimleri
- URL: `/privacy`
- Her güncellemede `son güncelleme tarihi` değişmeli
- Hem TR hem EN versiyonu
- Print-friendly CSS (kullanıcılar bazen yazdırıyor)

---

## 8. KVKK'ya Kayıt Zorunluluğu

Kişisel veri işleyen veri sorumlularının VERBİS'e (Veri Sorumluları Sicili) kaydolması gerekmektedir.

| Durum | VERBİS Zorunluluğu |
|-------|-------------------|
| Yıllık çalışan sayısı 50'den az VE yıllık mali bilanço 25 milyon TL'den az | ❌ İstisna var (Yönetmelik değişikliği) |
| Veri tabanı yurt dışına aktarılıyorsa | ✅ VERBİS kayıt zorunlu |
| Özel nitelikli veri işleniyorsa | ✅ VERBİS kayıt zorunlu |

> HeroKidStory OpenAI'ya veri aktardığı ve özel nitelikli veri (çocuk biometrik) işlediği için **VERBİS kaydı zorunlu olabilir.** Avukattan teyit al.

---

## 9. Sonraki Adımlar

- [ ] Şirket/operatör bilgilerini belirle
- [ ] KVKK uzmanı veya veri koruma avukatı ile politikayı hazırla
- [ ] VERBİS kayıt zorunluluğunu avukata sor
- [ ] `users` tablosuna consent alanları ekle
- [ ] Karakter oluşturma adımına çocuk verisi bildirim onayı ekle
- [ ] Hesap silme akışını KVKK uyumlu hale getir
- [ ] `/privacy` sayfasını oluştur

---

> **Uyarı:** Çocuk verisi işleme ve yurt dışı aktarım konularında Türkiye'de ciddi idari yaptırımlar mevcuttur. Bu belge analiz amaçlıdır; kesinlikle profesyonel hukuki danışmanlık alınmalıdır.
