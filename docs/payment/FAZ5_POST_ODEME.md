# 💳 Faz 5 — Ödeme Sonrası Akışlar

**Bağlı Roadmap:** [PAYMENT_ROADMAP.md](PAYMENT_ROADMAP.md)  
**Durum:** ⬜ Bekliyor  
**Ön koşul:** [Faz 1](FAZ1_IYZICO.md), [Faz 2](FAZ2_STRIPE.md), [Faz 3](FAZ3_CHECKOUT.md) tamamlanmış olmalı  
**Tahmini süre:** 1-2 gün

---

## 🎯 Bu Fazın Amacı

Ödeme başarıyla tamamlandıktan sonra gereken tüm işlemleri otomatikleştirmek:
- E-posta bildirimleri (sipariş onayı, e-book hazır)
- E-book için: dijital teslimat (PDF erişimi)
- Hardcopy için: kargo süreci başlatma (ileride)
- Ödeme sonrası kitap üretimi tetikleme (eğer gerekiyorsa)

---

## 1. Ödeme Başarılı Tetikleyicisi

Webhook handler'lar (`/api/webhooks/stripe` ve `/api/payment/iyzico/callback`) sipariş durumunu `paid` olarak işaretler. Bu noktada **post-payment işlemleri** tetiklenir.

### 1.1 Post-Payment İşlem Sırası

```
Webhook: order.status → 'paid'
        ↓
1. E-posta gönder: Sipariş Onayı
        ↓
2. E-Book ise: Erişim sağla (zaten DB'de var, status kontrolü yeterli)
        ↓
3. Hardcopy ise: Kargo süreci başlat (şimdilik: admin'e bildirim)
        ↓
4. Admin dashboard: İstatistikleri güncelle (otomatik — DB sorgusu)
```

### 1.2 Post-Payment Handler

```typescript
// lib/payment/post-payment.ts

export async function handlePaymentSuccess(orderId: string) {
  const order = await getOrderById(orderId)
  if (!order) throw new Error(`Order not found: ${orderId}`)

  // 1. E-posta gönder
  await sendOrderConfirmationEmail(order)

  // 2. E-book erişimi (zaten books tablosunda mevcut)
  // Sadece kontrol: order_items'taki book_id'ler completed status'ta mı?
  const ebookItems = order.items.filter(i => i.item_type === 'ebook')
  if (ebookItems.length > 0) {
    await sendEbookReadyEmail(order, ebookItems)
  }

  // 3. Hardcopy için kargo başlat (gelecekte)
  const hardcopyItems = order.items.filter(i => i.item_type === 'hardcopy')
  if (hardcopyItems.length > 0) {
    await notifyAdminHardcopyOrder(order, hardcopyItems)
  }
}
```

Webhook handler'larına ekleme:

```typescript
// app/api/payment/iyzico/callback/route.ts (mevcut koda ekleme)
if (result.success) {
  await updateOrderStatus(...)
  await handlePaymentSuccess(result.conversationId!)  // YENİ
}

// app/api/webhooks/stripe/route.ts (mevcut koda ekleme)
case 'checkout.session.completed': {
  await updateOrderStatus(...)
  await handlePaymentSuccess(orderId!)  // YENİ
}
```

---

## 2. E-Posta Bildirimleri

Proje zaten `app/api/email/send-ebook/route.ts` dosyasına sahip. Bunu genişleteceğiz.

### 2.1 E-Posta Türleri

| Tetikleyici | E-posta | Alıcı |
|-------------|---------|-------|
| Ödeme başarılı | Sipariş Onayı | Kullanıcı |
| E-Book mevcut | Kitabınız Hazır | Kullanıcı |
| Hardcopy sipariş | Yeni Hardcopy Siparişi | Admin |
| Ödeme başarısız | Ödeme Başarısız | Kullanıcı |
| İade onaylandı | İade Bildirimi | Kullanıcı |

### 2.2 Sipariş Onayı E-postası

```typescript
// lib/email/templates/order-confirmation.ts

export function getOrderConfirmationTemplate(order: Order) {
  return {
    subject: `Sipariş Onaylandı — HeroKidStory #${order.id.slice(0,8)}`,
    html: `
      <h1>Siparişiniz Onaylandı! 🎉</h1>
      <p>Merhaba ${order.user.name},</p>
      <p>Siparişiniz başarıyla alındı.</p>
      
      <h2>Sipariş Detayları</h2>
      <p>Sipariş No: ${order.id.slice(0,8)}</p>
      <p>Toplam: ${order.currency === 'TRY' ? '₺' : '$'}${order.totalAmount}</p>
      
      <h2>Ürünler</h2>
      ${order.items.map(item => `
        <div>
          <strong>${item.bookTitle}</strong>
          — ${item.itemType === 'ebook' ? 'E-Book' : 'Basılı Kitap'}
        </div>
      `).join('')}
      
      ${order.items.some(i => i.itemType === 'ebook') ? `
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">
            Kitaplığınıza git →
          </a>
        </p>
      ` : ''}
      
      <p>Teşekkürler!</p>
      <p>HeroKidStory Ekibi</p>
    `,
  }
}
```

### 2.3 E-Posta Gönderim Servisi

Proje mevcut durumda nasıl e-posta gönderiyor? `app/api/email/send-ebook/route.ts`'e bakılmalı. Büyük ihtimalle bir SMTP veya Resend/SendGrid entegrasyonu mevcuttur.

**Karar gerekli:** Hangi e-posta servisi kullanılıyor/kullanılacak?
- [ ] Resend (önerilir — Next.js dostu, kolay)
- [ ] SendGrid
- [ ] Nodemailer + SMTP

---

## 3. E-Book Dijital Teslimat

E-book satın alındıktan sonra:
- Kullanıcı `/dashboard` veya `/orders/[id]` sayfasında kitabı görebilir
- "Kitabı Oku" butonu → `/books/[id]` veya viewer sayfası
- PDF indirme: `GET /api/orders/[id]/download` → S3 pre-signed URL döner

### 3.1 PDF İndirme API

```typescript
// app/api/orders/[id]/download/route.ts

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireUser()
  const order = await getOrderById(params.id, user.id)
  
  if (!order || order.status !== 'paid') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Her e-book item için PDF URL döndür
  const downloads = await Promise.all(
    order.items
      .filter(i => i.itemType === 'ebook')
      .map(async (item) => {
        const book = await getBookById(item.bookId)
        return {
          bookTitle: item.bookTitle,
          downloadUrl: book.pdfUrl,  // veya S3 pre-signed URL
        }
      })
  )

  return NextResponse.json({ downloads })
}
```

---

## 4. Ödeme Başarısız — Kullanıcıya Bildirim

Ödeme başarısız olduğunda:
1. Sipariş `failed` olarak işaretle
2. Kullanıcıya e-posta gönder (isteğe bağlı, spam olmasın diye dikkatli)
3. Kullanıcı `/payment/failure` sayfasında "Tekrar Dene" butonuna tıklayabilir

---

## 5. Hardcopy — Kargo Süreci (Gelecekte)

Şimdilik sadece TR'de hardcopy satışı mevcut. Kargo süreci:

1. Sipariş `paid` → Admin panelde "Yeni Hardcopy Siparişi" görünür
2. Admin → baskı firmasına sipariş ver (manuel süreç — şimdilik)
3. Admin → `order_items.fulfillment_status` → `printed` → `shipped` olarak günceller
4. Admin → `order_items.tracking_number` ekler
5. Kullanıcıya otomatik e-posta: "Siparişiniz kargoya verildi — Takip No: xxx"

**Gelecekte entegre edilebilecek servisler:**
- Yurt içi: PTT Kargo API, Yurtiçi Kargo API
- Yurt dışı: Gelato.com API (Phase 4.4.7'de planlandı)

---

## 6. Yapılacaklar Kontrol Listesi

### E-Posta
- [ ] E-posta servisini belirle (Resend önerilir)
- [ ] `lib/email/templates/order-confirmation.ts` oluştur
- [ ] `lib/email/templates/ebook-ready.ts` oluştur
- [ ] `lib/email/templates/payment-failed.ts` oluştur
- [ ] `lib/email/send.ts` — e-posta gönderim fonksiyonu
- [ ] `.env`'e e-posta servis API key'i ekle

### Post-Payment Handler
- [ ] `lib/payment/post-payment.ts` oluştur
- [ ] iyzico callback'ine post-payment çağrısı ekle
- [ ] Stripe webhook'una post-payment çağrısı ekle

### Dijital Teslimat
- [ ] `app/api/orders/[id]/download/route.ts` oluştur
- [ ] Kullanıcı sipariş detay sayfasına "PDF İndir" butonu ekle

---

## ⏭️ Sonraki Faz

→ [FAZ6_TEST_VE_CANLIYA_ALIS.md](FAZ6_TEST_VE_CANLIYA_ALIS.md) — Test ve canlıya alış
