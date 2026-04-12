/**
 * @legal-document refund-quality-policy
 * @registry HK-LEGAL-REFUND
 * @semver 1.1.0
 * @last-substantive-update 2026-04-11
 * @sync docs/legal/07_IADE_VE_KALITE_POLITIKASI.md — güncellemelerde her iki yeri eşle.
 * Kullanıcı arayüzünde semver / taslak etiketi gösterilmez.
 */
import type { ReactNode } from "react"
import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"

export const metadata: Metadata = {
  title: "İade ve Kalite Politikası — HeroKidStory",
  description:
    "HeroKidStory iade ve kalite politikası: iade yapılmayan durumlar, kalite garantisi ve başvuru süreci.",
  robots: { index: true },
}

const LAST_UPDATED_TR  = "Nisan 2026"
const LAST_UPDATED_EN  = "April 2026"

export default function RefundPolicyPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const isTr = locale === "tr"

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-background dark:from-slate-900 dark:to-slate-950">
      <div className="container mx-auto max-w-3xl px-4 py-12">

        <header className="mb-10 border-b border-slate-200 pb-8 dark:border-slate-700">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
            {isTr ? "İade ve Kalite Politikası" : "Refund & Quality Policy"}
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            {isTr
              ? `Son güncelleme: ${LAST_UPDATED_TR}`
              : `Last updated: ${LAST_UPDATED_EN}`}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {isTr
              ? "Her HeroKidStory kitabı, yalnızca sizin çocuğunuz için özel üretilmektedir. Bu nedenle iade politikamız kişiselleştirilmiş ve dijital ürünlere özgü standartlara dayanmaktadır."
              : "Every HeroKidStory book is produced exclusively for your child. Our refund policy therefore follows standards specific to personalized and digital products."}
          </p>
        </header>

        {isTr ? <RefundTR /> : <RefundEN />}

      </div>
    </main>
  )
}

/* ========================================================================== */
/* TR                                                                         */
/* ========================================================================== */

function RefundTR() {
  return (
    <div className="space-y-8 text-slate-700 dark:text-slate-300">

      <Section title="İade Yapılmayan Durumlar">
        <SubSection title="E-Kitap (Dijital İçerik)">
          <p>
            Ödeme onaylandıktan ve kitabın hesabına eklendikten sonra dijital içerikler iade
            edilemez. Bu kural, <strong>Mesafeli Sözleşmeler Yönetmeliği&apos;nin 15. maddesi</strong>{" "}
            kapsamında geçerlidir ve ödeme öncesinde açıkça onaylatılmaktadır.
          </p>
        </SubSection>

        <SubSection title="Basılı Kitap — Kullanıcı Kaynaklı Durumlar">
          <p>
            Her basılı kitap kişisel fotoğrafların ve tercihlerinin doğrultusunda özel olarak
            üretilmektedir. Aşağıdaki durumlarda iade yapılmaz:
          </p>
          <ul className="mt-2 space-y-1 text-sm list-disc pl-4">
            <li>Beğeni farklılıkları veya fikir değişikliği</li>
            <li>Kullanıcı tarafından girilen bilgi hataları (isim, yaş, özel istek)</li>
            <li>Düşük kaliteli fotoğraf yüklemesinden kaynaklanan görsel sonuçlar</li>
            <li>AI üretiminin stokastik yapısından kaynaklanan küçük stil farklılıkları</li>
          </ul>
        </SubSection>

        <SubSection title="Her İki Ürün İçin">
          <ul className="space-y-1 text-sm list-disc pl-4">
            <li>Fiyat beğenmeme veya başka platformda daha ucuz bulma</li>
            <li>Hediye alındı beğenilmedi</li>
          </ul>
        </SubSection>
      </Section>

      <Section title="Kalite Garantimiz">
        <p>
          Ürün ellerinize ulaştığında aşağıdaki sorunlardan birini yaşarsanız{" "}
          <strong>teslimden itibaren 14 gün içinde</strong> bize bildirin — ücretsiz yeniden
          üretim veya tam iade sağlarız:
        </p>
        <GuaranteeList items={[
          "Baskı hatası (silik, eksik sayfa, yanlış renk bloğu)",
          "Cilt hatası (sayfa düşmesi, kapak ayrılması)",
          "Kargo hasarı",
          "Siparişteki tercihlerinizin yanlış uygulanması",
          "Dijital kitapta erişim veya teknik sorun",
          "Ödeme alındı ama kitap hesapta görünmüyor",
        ]} />
      </Section>

      <Section title="Sipariş İptal Etmek">
        <p>
          Basılı kitap siparişiniz henüz üretime alınmamışsa iptal edebilirsiniz.
          Durum kontrolü için{" "}
          <a href="mailto:info@herokidstory.com" className="text-primary underline underline-offset-2">
            info@herokidstory.com
          </a>{" "}
          adresine sipariş numaranızla yazın.
        </p>
      </Section>

      <Section title="Başvuru Süreci">
        <ol className="space-y-2 text-sm list-decimal pl-4">
          <li>
            Teslimden itibaren <strong>14 gün içinde</strong>{" "}
            <a href="mailto:info@herokidstory.com" className="text-primary underline underline-offset-2">
              info@herokidstory.com
            </a>{" "}
            adresine yazın.
          </li>
          <li>Sipariş numaranızı ve sorunu belgeleyen fotoğrafları ekleyin.</li>
          <li>
            3 iş günü içinde yanıt alırsınız. Çözüm: yeniden üretim (7–30 iş günü) veya iade
            (14 iş günü).
          </li>
        </ol>
      </Section>

      <Section title="Sipariş Öncesi Kontrol Listeniz">
        <ul className="space-y-1 text-sm list-disc pl-4">
          <li>Çocuğunuzun fotoğrafının kalitesi (net, iyi aydınlatılmış, yüze bakıyor)</li>
          <li>İsim yazımları ve girilen diğer bilgiler</li>
          <li>Seçtiğiniz hikaye teması, dil ve sayfa sayısı</li>
        </ul>
        <Note>
          Sizin tarafınızdan sağlanan bilgi veya dosyalardan kaynaklanan sorunlarda sorumluluk
          platformumuz tarafından üstlenilemez.
        </Note>
      </Section>

      <Section title="Yasal Dayanak">
        <InfoTable rows={[
          ["E-kitap iadesi yapılmaz",  "Mesafeli Sözleşmeler Yönetmeliği Md. 15/1-ğ (dijital içerik, teslim başladıktan sonra)"],
          ["Basılı kitap iadesi yapılmaz", "Mesafeli Sözleşmeler Yönetmeliği Md. 15/1-ç (kişiye özel üretim)"],
          ["İlgili kanun",             "6502 Sayılı Tüketicinin Korunması Hakkında Kanun (TKHK) Md. 48"],
        ]} />
      </Section>

      <Section title="İletişim">
        <InfoTable rows={[
          ["E-posta",      "info@herokidstory.com"],
          ["Konu",         "İade Talebi — [Sipariş No]"],
          ["Yanıt Süresi", "3 iş günü"],
        ]} />
        <p className="mt-2 text-xs text-slate-500">
          İade taleplerinde sipariş numaranızı ve sorunu belgeleyen fotoğrafları eklemeyi
          unutmayın.
        </p>
      </Section>

    </div>
  )
}

/* ========================================================================== */
/* EN                                                                         */
/* ========================================================================== */

function RefundEN() {
  return (
    <div className="space-y-8 text-slate-700 dark:text-slate-300">

      <Section title="When Refunds Are NOT Available">
        <SubSection title="E-Books (Digital Downloads)">
          <p>
            Once payment is confirmed and the book is added to your account, digital content
            cannot be refunded. This is consistent with applicable consumer protection regulations
            (Turkish Consumer Protection Law Art. 48,{" "}
            <strong>EU Consumer Rights Directive Art. 16(m)</strong>) and is confirmed by you
            at checkout.
          </p>
        </SubSection>

        <SubSection title="Printed Books — User-Caused Issues">
          <p>
            Each printed book is individually produced based on your personal photos and
            preferences. The following are not grounds for a refund:
          </p>
          <ul className="mt-2 space-y-1 text-sm list-disc pl-4">
            <li>Change of mind or subjective dissatisfaction</li>
            <li>Errors in information entered by the user (name, age, custom requests)</li>
            <li>Print quality issues resulting from low-resolution or poorly lit uploaded photos</li>
            <li>Minor color or style variations inherent to AI generation and print production processes</li>
            <li>Differences between screen display and printed output (color calibration)</li>
          </ul>
        </SubSection>

        <SubSection title="For Both Products">
          <ul className="space-y-1 text-sm list-disc pl-4">
            <li>Price dissatisfaction or finding a cheaper alternative elsewhere</li>
            <li>Gift was given but recipient did not like it</li>
          </ul>
        </SubSection>
      </Section>

      <Section title="Our Quality Guarantee">
        <p>
          If your order has any of the following issues, contact us{" "}
          <strong>within 14 days of receipt</strong> — we will provide a free reprint or full
          refund:
        </p>
        <GuaranteeList items={[
          "Printing defects (faded print, missing pages, incorrect color blocks)",
          "Binding defects (loose pages, cover separation)",
          "Shipping damage",
          "Your order preferences were incorrectly applied",
          "Digital book access or technical issues",
          "Payment received but book not appearing in account",
        ]} />
      </Section>

      <Section title="Order Cancellation">
        <p>
          If your printed book order has not yet entered production, you can cancel it.
          Contact{" "}
          <a href="mailto:info@herokidstory.com" className="text-primary underline underline-offset-2">
            info@herokidstory.com
          </a>{" "}
          with your order number to check the status.
        </p>
      </Section>

      <Section title="How to Submit a Claim">
        <ol className="space-y-2 text-sm list-decimal pl-4">
          <li>
            Email{" "}
            <a href="mailto:info@herokidstory.com" className="text-primary underline underline-offset-2">
              info@herokidstory.com
            </a>{" "}
            <strong>within 14 days of receipt</strong>.
          </li>
          <li>Include your order number and photos documenting the issue.</li>
          <li>
            We respond within 3 business days. Resolution: free reprint (7–30 business days) or
            refund (14 business days).
          </li>
        </ol>
      </Section>

      <Section title="Before You Order — Your Checklist">
        <ul className="space-y-1 text-sm list-disc pl-4">
          <li>Your child&apos;s photo quality (sharp, well-lit, facing the camera)</li>
          <li>Name spellings and other entered information</li>
          <li>Selected story theme, language, and page count</li>
        </ul>
        <Note>
          We cannot be held responsible for issues arising from information or files provided
          by you.
        </Note>
      </Section>

      <Section title="Legal Basis">
        <InfoTable rows={[
          ["E-book non-refundable",    "EU Consumer Rights Directive Art. 16(m) (digital content, once delivery started) / Turkish MSY Md. 15/1-ğ"],
          ["Printed book non-refundable", "EU Consumer Rights Directive Art. 16(c) (custom-made goods) / Turkish MSY Md. 15/1-ç"],
          ["Related law",              "Turkish Consumer Protection Law (TKHK) Art. 48"],
        ]} />
      </Section>

      <Section title="Contact">
        <InfoTable rows={[
          ["Email",         "info@herokidstory.com"],
          ["Subject",       "Refund Request — [Order Number]"],
          ["Response time", "3 business days"],
        ]} />
        <p className="mt-2 text-xs text-slate-500">
          Please include your order number and photos documenting the issue with your claim.
        </p>
      </Section>

    </div>
  )
}

/* ========================================================================== */
/* Shared UI                                                                  */
/* ========================================================================== */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 border-b border-slate-200 pb-2 text-base font-bold text-slate-900 dark:border-slate-700 dark:text-slate-100">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed">{children}</div>
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
    <table className="mt-2 w-full text-sm">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-slate-100 dark:border-slate-800">
            <td className="whitespace-nowrap py-1.5 pr-4 font-medium text-slate-700 dark:text-slate-300">
              {label}
            </td>
            <td className="py-1.5 text-slate-600 dark:text-slate-400">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
      {children}
    </p>
  )
}

function GuaranteeList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-1 text-sm list-none pl-0">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0 text-green-600 dark:text-green-400">✅</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

