/**
 * @legal-document mesafeli-satis-sozlesmesi
 * @registry HK-LEGAL-MSS
 * @semver 1.2.0
 * @last-substantive-update 2026-04-11
 * @sync docs/legal/TASLAK_MESAFELI_SATIS_SOZLESMESI.md — güncellemelerde her iki yeri eşle.
 * Kullanıcı arayüzünde semver / taslak etiketi gösterilmez.
 */
import type { ReactNode } from "react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi — HeroKidStory",
  description:
    "HeroKidStory mesafeli satış sözleşmesi. 6502 sayılı TKHK ve Mesafeli Sözleşmeler Yönetmeliği kapsamında hazırlanmıştır.",
  robots: { index: false },
}

const LAST_UPDATED = "11 Nisan 2026"

const SELLER = {
  name:    "Cüneyt Medetoğlu",
  title:   "Şahıs İşletmesi — ticari unvan tescil edilmemiştir",
  address: "Atatürk Mah. Merkez İsimsiz91 Sk. Dema İnş B Blok No: 4/1 İç Kapı No: 3 Merkez / Tunceli",
  phone:   "+90 542 520 92 52",
  email:   "info@herokidstory.com",
  vkn:     "6130979062",
  vd:      "Tunceli Vergi Dairesi",
  web:     "https://herokidstory.com",
}

export default function MesafeliSatisSozlesmesiPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  if (locale !== "tr") {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-background dark:from-slate-900 dark:to-slate-950">
      <div className="container mx-auto max-w-3xl px-4 py-12">

        <header className="mb-10 border-b border-slate-200 pb-8 dark:border-slate-700">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
            Mesafeli Satış Sözleşmesi
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Son güncelleme: {LAST_UPDATED}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            Bu sözleşme, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler
            Yönetmeliği kapsamında hazırlanmıştır.
          </p>
        </header>

        <div className="space-y-8 text-slate-700 dark:text-slate-300">

          {/* Madde 1 */}
          <Section title="MADDE 1 — TARAFLAR">
            <SubSection title="1.1 Satıcı Bilgileri">
              <InfoTable rows={[
                ["Ad Soyad",        SELLER.name],
                ["Ticari Unvan",    SELLER.title],
                ["Adres",           SELLER.address],
                ["Telefon",         SELLER.phone],
                ["E-posta",         SELLER.email],
                ["Vergi Dairesi",   SELLER.vd],
                ["Vergi Kimlik No", SELLER.vkn],
                ["MERSİS No",       "— (Şahıs işletmesi — MERSİS kaydı zorunlu değildir)"],
                ["KEP Adresi",      "— (Şahıs işletmesi — KEP zorunlu değildir)"],
                ["Web Sitesi",      SELLER.web],
              ]} />
            </SubSection>
            <SubSection title="1.2 Alıcı (Tüketici) Bilgileri">
              <p className="text-sm italic text-slate-500">
                Ad soyad, adres ve e-posta bilgileri sipariş formundan otomatik olarak doldurulur.
              </p>
            </SubSection>
          </Section>

          {/* Madde 2 */}
          <Section title="MADDE 2 — SÖZLEŞME KONUSU">
            <p>
              İşbu Mesafeli Satış Sözleşmesi, Alıcı&apos;nın Satıcı&apos;ya ait{" "}
              <a href="https://herokidstory.com" className="text-primary underline underline-offset-2">
                herokidstory.com
              </a>{" "}
              internet sitesi üzerinden sipariş ettiği ürün/hizmetin satışına ilişkin olarak,
              6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği
              hükümleri gereğince tarafların hak ve yükümlülüklerinin belirlenmesi amacıyla düzenlenmiştir.
            </p>
            <p className="mt-2">
              HeroKidStory, yapay zeka (AI) destekli kişiselleştirilmiş çocuk hikaye kitapları
              oluşturma hizmeti sunmaktadır. Platform üzerinden dijital e-kitap (e-book) ve/veya
              basılı kitap satın alınabilir.
            </p>
          </Section>

          {/* Madde 3 */}
          <Section title="MADDE 3 — SÖZLEŞME KONUSU ÜRÜN BİLGİLERİ">
            <InfoTable rows={[
              ["Ürün/Hizmet",            "Sipariş anında otomatik: örn. 'Kişisel E-Kitap — 24 Sayfa'"],
              ["Ürün Türü",              "Dijital E-Kitap / Basılı Kitap / E-Kitap + Basılı Kitap"],
              ["Birim Fiyat (KDV dahil)","Sipariş anında otomatik"],
              ["Kargo Ücreti",           "Dijital: Yok / Basılı: sipariş anında hesaplanır"],
              ["Toplam Fiyat (KDV dahil)","Sipariş anında otomatik"],
              ["Ödeme Yöntemi",          "Kredi Kartı / Banka Kartı — tek çekim (İyzico, 3D Secure)"],
            ]} />
          </Section>

          {/* Madde 4 */}
          <Section title="MADDE 4 — GENEL HÜKÜMLER">
            <ol className="list-decimal space-y-2 pl-4 text-sm">
              <li>Alıcı, sipariş ettiği ürünün temel nitelikleri, satış fiyatı, ödeme şekli ve teslimat bilgilerini okuyup bilgi sahibi olduğunu kabul eder.</li>
              <li>Alıcı, sözleşmeyi elektronik ortamda onaylayarak yasal bilgilendirmeyi eksiksiz aldığını teyit eder.</li>
              <li>Satıcı, ürünü eksiksiz, siparişte belirtilen niteliklere uygun teslim etmekle yükümlüdür.</li>
            </ol>
          </Section>

          {/* Madde 5 */}
          <Section title="MADDE 5 — TESLİMAT KOŞULLARI">
            <SubSection title="5.1 Dijital Ürünler (E-Kitap)">
              <ul className="list-disc space-y-1 pl-4 text-sm">
                <li>Ödemenin onaylanmasının ardından <strong>yaklaşık 15 (onbeş) dakika</strong> içinde otomatik oluşturulur ve kullanıcı hesabına (My Library) eklenir.</li>
                <li>E-kitap, kullanıcı paneli üzerinden çevrimiçi görüntülenebilir ve PDF olarak indirilebilir.</li>
                <li>Dijital ürünlerde kargo veya fiziksel teslimat söz konusu değildir.</li>
              </ul>
            </SubSection>
            <SubSection title="5.2 Basılı Kitaplar (Sadece Türkiye)">
              <ul className="list-disc space-y-1 pl-4 text-sm">
                <li>Ödeme onayından itibaren <strong>3 (üç) iş günü</strong> içinde kargoya teslim edilir.</li>
                <li>Kargoya verildikten sonraki teslimat süresi 1–3 iş günüdür.</li>
                <li>Yoğun dönemlerde üretim süresi uzayabilir; bu durumda Alıcı bilgilendirilir.</li>
                <li>Kargo ücreti sipariş özet sayfasında belirtilmiştir.</li>
              </ul>
            </SubSection>
          </Section>

          {/* Madde 6 */}
          <Section title="MADDE 6 — CAYMA HAKKI">
            <Callout type="warning" title="Dijital Ürünler (E-Kitap) — Cayma Hakkı İSTİSNASI">
              Mesafeli Sözleşmeler Yönetmeliği&apos;nin 15. maddesi 1. fıkrasının (ğ) bendi uyarınca:
              Elektronik ortamda anında ifa edilen dijital içeriklerde, tüketicinin onayıyla ifaya
              başlanması halinde <strong>cayma hakkı kullanılamaz.</strong>
            </Callout>
            <Callout type="warning" title="Basılı Kitaplar — Cayma Hakkı İSTİSNASI" className="mt-3">
              Mesafeli Sözleşmeler Yönetmeliği&apos;nin 15. maddesi 1. fıkrasının (ç) bendi uyarınca:
              Tüketicinin kişisel ihtiyaçları doğrultusunda hazırlanan kişiselleştirilmiş ürünlerde{" "}
              <strong>cayma hakkı kullanılamaz.</strong>
            </Callout>
            <div className="mt-3 text-sm">
              <p className="font-medium text-slate-800 dark:text-slate-200">Cayma Hakkının Kullanılabileceği İstisnai Durumlar:</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>Basılı kitap siparişinde, kitap henüz üretime alınmamışsa iptal mümkündür.</li>
                <li>Ürünün ayıplı (hatalı, eksik, hasarlı) teslim edilmesi halinde Tüketici Hakem Heyeti&apos;ne başvuru hakkınız saklıdır.</li>
              </ul>
              <p className="mt-2 text-slate-500">Başvuru: <a href="mailto:info@herokidstory.com" className="text-primary underline underline-offset-2">info@herokidstory.com</a></p>
            </div>
          </Section>

          {/* Madde 7 */}
          <Section title="MADDE 7 — ÖDEME">
            <ol className="list-decimal space-y-2 pl-4 text-sm">
              <li>Ödeme, İyzico ödeme altyapısı üzerinden kredi/banka kartı ile yapılır. Tüm ödemeler 3D Secure ile gerçekleştirilir.</li>
              <li>Kart bilgileri Satıcı tarafından saklanmaz; ödeme PCI-DSS standartlarında İyzico üzerinde gerçekleştirilir.</li>
              <li>
                Satış fiyatına KDV dahildir. Ürün türüne göre KDV oranları:
                <ul className="mt-1 list-disc pl-4">
                  <li><strong>Dijital E-Kitap:</strong> %20 KDV</li>
                  <li><strong>Basılı Kitap:</strong> %0 KDV (Türk vergi mevzuatı uyarınca kitap KDV&apos;den muaftır)</li>
                </ul>
              </li>
              <li>Taksitli ödeme imkânı sunulmamaktadır. Tüm satışlar tek çekim olarak gerçekleştirilir.</li>
            </ol>
          </Section>

          {/* Madde 8 */}
          <Section title="MADDE 8 — ALICININ BEYAN VE TAAHHÜTLERİ">
            <ol className="list-decimal space-y-2 pl-4 text-sm">
              <li>Alıcı, ürün bilgileri, fiyat ve teslimat hakkında eksiksiz bilgilendirildiğini kabul eder.</li>
              <li>Alıcı, platforma yüklediği fotoğrafların kendisine veya yasal vasisi olduğu çocuğa ait olduğunu, üçüncü kişilerin haklarını ihlal etmediğini beyan eder.</li>
              <li>Alıcı, 18 yaşından büyük olduğunu beyan eder.</li>
            </ol>
          </Section>

          {/* Madde 9 */}
          <Section title="MADDE 9 — SATICININ BEYAN VE TAAHHÜTLERİ">
            <ol className="list-decimal space-y-2 pl-4 text-sm">
              <li>Satıcı, ürünü eksiksiz, siparişte belirtilen niteliklere uygun teslim etmeyi taahhüt eder.</li>
              <li>Satıcı, teslimin imkânsız hale gelmesi durumunda bunu 3 gün içinde Alıcı&apos;ya bildirir ve bedeli 14 gün içinde iade eder.</li>
              <li>Satıcı, teknik hatalar veya hizmet kesintilerinde Alıcı&apos;yı bilgilendirmekle yükümlüdür.</li>
            </ol>
          </Section>

          {/* Madde 10 */}
          <Section title="MADDE 10 — KİŞİSEL VERİLERİN KORUNMASI">
            <ol className="list-decimal space-y-2 pl-4 text-sm">
              <li>Alıcı&apos;nın kişisel verileri, KVKK kapsamında işlenmektedir. Detaylı bilgi için:{" "}
                <a href="/privacy" className="text-primary underline underline-offset-2">Gizlilik Politikası</a>
              </li>
              <li>Çocuğa ait veriler (fotoğraf, ad, yaş) AI içerik üretimi amacıyla OpenAI&apos;ya aktarılır; bu konuda ayrıca açık rıza alınmaktadır.</li>
            </ol>
          </Section>

          {/* Madde 11 */}
          <Section title="MADDE 11 — UYUŞMAZLIKLARIN ÇÖZÜMÜ">
            <ol className="list-decimal space-y-2 pl-4 text-sm">
              <li>Ticaret Bakanlığı&apos;nca ilan edilen değere kadar <strong>Tüketici Hakem Heyetleri</strong>, bu değerin üzerinde <strong>Tüketici Mahkemeleri</strong> yetkilidir.</li>
              <li>Alıcı, ürünü satın aldığı veya ikametgahının bulunduğu yerdeki yetkili kurumlara başvurabilir.</li>
            </ol>
          </Section>

          {/* Madde 12 */}
          <Section title="MADDE 12 — YÜRÜRLÜK">
            <ol className="list-decimal space-y-2 pl-4 text-sm">
              <li>Sözleşme, Alıcı tarafından elektronik ortamda onaylanarak ödemenin gerçekleştirilmesi ile yürürlüğe girer.</li>
              <li>Satıcı, sözleşmenin bir nüshasını Alıcı&apos;nın kayıtlı e-posta adresine gönderir.</li>
            </ol>
          </Section>

          {/* Madde 13 */}
          <Section title="MADDE 13 — MÜCBİR SEBEPLER">
            <p className="text-sm">
              Doğal afet, savaş, terör, değişen mevzuat, grev, enerji kesintisi ve benzeri
              tarafların kontrolünde olmayan hallerde, taraflar yükümlülüklerini kısmen veya tamamen
              yerine getiremeyebilir. Bu durumlar mücbir sebep sayılır ve gecikme/ifa etmemeden
              sorumluluk doğmaz.
            </p>
          </Section>

          {/* Madde 14 */}
          <Section title="MADDE 14 — KALİTE BEYANI VE AI ÜRETİM SINIRLARI">
            <p className="text-sm">
              AI teknolojisiyle üretilen içeriklerde aşağıdaki hususlar kabul görmüştür:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
              <li>Üretilen görsellerdeki renk, ton ve stil; ekran ile baskı arasında küçük farklılıklar gösterebilir.</li>
              <li>Aynı girdilerle iki üretimin özdeş olmaması AI&apos;ın stokastik yapısından kaynaklanır.</li>
              <li>Kullanıcının yanlış/eksik girdiği bilgilerden kaynaklanan içerik sorunları Satıcı&apos;nın sorumluluğu dışındadır.</li>
              <li>Düşük kaliteli fotoğraf yüklenmesinden kaynaklanan görsel sorunlar iade/değişim sebebi sayılmaz.</li>
            </ul>
            <p className="mt-3 text-sm">
              Satıcı aşağıdaki durumlarda <strong>ücretsiz yeniden üretim</strong> veya <strong>tam iade</strong> sağlar:
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
              <li>Siparişle örtüşmeyen ürün teslim edilmesi (sayfa sayısı, dil, ürün türü farkı)</li>
              <li>Basılı kitaplarda üretim/baskı hatası (silik baskı, eksik sayfa, cilt hatası)</li>
              <li>Sistem hatası nedeniyle sipariş tercihlerinin yanlış uygulanması</li>
            </ul>
            <p className="mt-2 text-sm text-slate-500">
              Kalite talepleri teslimden itibaren <strong>14 gün</strong> içinde fotoğraflı belgelemeyle{" "}
              <a href="mailto:info@herokidstory.com" className="text-primary underline underline-offset-2">info@herokidstory.com</a> adresine iletilmelidir.
            </p>
          </Section>

          {/* Madde 15 */}
          <Section title="MADDE 15 — FATURA">
            <ol className="list-decimal space-y-2 pl-4 text-sm">
              <li>Her satış için 213 sayılı VUK gereğince e-Arşiv Fatura düzenlenir.</li>
              <li>Fatura, sipariş onayından sonra en geç <strong>7 (yedi) gün</strong> içinde kayıtlı e-posta adresine iletilir.</li>
              <li>Faturadaki bilgilerin doğruluğundan Alıcı sorumludur.</li>
            </ol>
          </Section>

          {/* İmzalar */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ALICI (Tüketici)</p>
                <p className="mt-1 text-sm italic text-slate-400">Elektronik ortamda onaylanmıştır</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">SATICI</p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Cüneyt Medetoğlu</p>
                <p className="text-xs text-slate-500">Şahıs İşletmesi — herokidstory.com</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}

// ============================================================================
// Yardımcı bileşenler (sayfa içi)
// ============================================================================

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 border-b border-slate-200 pb-2 text-base font-bold text-slate-900 dark:border-slate-700 dark:text-slate-100">
        {title}
      </h2>
      <div className="space-y-2 text-sm leading-relaxed">{children}</div>
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-3">
      <h3 className="mb-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      {children}
    </div>
  )
}

function InfoTable({ rows }: { rows: [string, string][] }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-slate-100 dark:border-slate-800">
            <td className="py-1.5 pr-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{label}</td>
            <td className="py-1.5 text-slate-600 dark:text-slate-400">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Callout({
  type,
  title,
  children,
  className,
}: {
  type: "warning" | "info"
  title: string
  children: ReactNode
  className?: string
}) {
  const colors =
    type === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300"
      : "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300"

  return (
    <div className={`rounded-lg border p-3 text-sm ${colors} ${className ?? ""}`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{children}</p>
    </div>
  )
}
