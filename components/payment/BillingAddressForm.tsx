"use client"

/**
 * @file Fatura adresi formu.
 *
 * iyzico ödeme formu kart bilgilerini kendi alır;
 * fatura adresi bilgilerini ise uygulamamızın bu formu toplar.
 *
 * Prop olarak `onSubmit` callback alır — iyzico akışını başlatmak için
 * üst bileşen bu callback'te API çağrısını yapar.
 *
 * Localization: checkout.billingAddress namespace.
 */

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useTranslations } from "next-intl"
import { Loader2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BillingAddress } from "@/lib/payment/types"

// ============================================================================
// Zod şeması — iyzico için zorunlu alanlar
// ============================================================================

const billingSchema = z.object({
  name:    z.string().min(2, "Ad Soyad en az 2 karakter olmalıdır"),
  address: z.string().min(5, "Açık adres en az 5 karakter olmalıdır"),
  city:    z.string().min(2, "Şehir en az 2 karakter olmalıdır"),
  country: z.string().min(2, "Ülke zorunludur"),
  zip:     z.string().optional(),
})

export type BillingAddressFormData = z.infer<typeof billingSchema>

// ============================================================================
// Props
// ============================================================================

interface BillingAddressFormProps {
  /** Form gönderildiğinde çağrılır — ebeveyn iyzico akışını başlatır */
  onSubmit: (data: BillingAddress) => void
  /** API çağrısı sürerken true — butonu devre dışı bırakır */
  isLoading?: boolean
  /** Önceden doldurulmuş değerler (kullanıcı geri döndüğünde) */
  defaultValues?: Partial<BillingAddressFormData>
}

// ============================================================================
// Bileşen
// ============================================================================

export function BillingAddressForm({
  onSubmit,
  isLoading = false,
  defaultValues,
}: BillingAddressFormProps) {
  /** checkout.plan ile aynı desen — çok segmentli namespace */
  const t    = useTranslations("checkout.billingAddress")
  const tPay = useTranslations("checkout.iyzicoPayment")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BillingAddressFormData>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      country: "Turkey",   // iyzico = TR, ülke sabit
      ...defaultValues,
    },
  })

  const handleFormSubmit = (data: BillingAddressFormData) => {
    onSubmit({
      name:    data.name,
      address: data.address,
      city:    data.city,
      country: data.country,
      zip:     data.zip || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4" noValidate>
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {t("title")}
        </h3>
      </div>

      {/* Ad Soyad */}
      <div>
        <Label htmlFor="billing-name" className="mb-1.5 block text-sm font-medium">
          {t("nameLabel")} <span className="text-red-500" aria-hidden="true">*</span>
        </Label>
        <Input
          id="billing-name"
          type="text"
          autoComplete="billing name"
          placeholder={t("namePlaceholder")}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "billing-name-error" : undefined}
          {...register("name")}
          className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
        {errors.name && (
          <p id="billing-name-error" role="alert" className="mt-1 text-xs text-red-500">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Açık Adres */}
      <div>
        <Label htmlFor="billing-address" className="mb-1.5 block text-sm font-medium">
          {t("addressLabel")} <span className="text-red-500" aria-hidden="true">*</span>
        </Label>
        <Input
          id="billing-address"
          type="text"
          autoComplete="billing street-address"
          placeholder={t("addressPlaceholder")}
          aria-invalid={!!errors.address}
          aria-describedby={errors.address ? "billing-address-error" : undefined}
          {...register("address")}
          className={errors.address ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
        {errors.address && (
          <p id="billing-address-error" role="alert" className="mt-1 text-xs text-red-500">
            {errors.address.message}
          </p>
        )}
      </div>

      {/* Şehir + Posta Kodu */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="billing-city" className="mb-1.5 block text-sm font-medium">
            {t("cityLabel")} <span className="text-red-500" aria-hidden="true">*</span>
          </Label>
          <Input
            id="billing-city"
            type="text"
            autoComplete="billing address-level2"
            placeholder={t("cityPlaceholder")}
            aria-invalid={!!errors.city}
            aria-describedby={errors.city ? "billing-city-error" : undefined}
            {...register("city")}
            className={errors.city ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.city && (
            <p id="billing-city-error" role="alert" className="mt-1 text-xs text-red-500">
              {errors.city.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="billing-zip" className="mb-1.5 block text-sm font-medium">
            {t("zipLabel")}
          </Label>
          <Input
            id="billing-zip"
            type="text"
            autoComplete="billing postal-code"
            placeholder={t("zipPlaceholder")}
            inputMode="numeric"
            {...register("zip")}
          />
        </div>
      </div>

      {/* Ülke — iyzico = TR, sadece gösterim */}
      <div>
        <Label htmlFor="billing-country" className="mb-1.5 block text-sm font-medium">
          {t("countryLabel")}
        </Label>
        <Input
          id="billing-country"
          type="text"
          readOnly
          tabIndex={-1}
          aria-readonly="true"
          {...register("country")}
          className="cursor-default bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
        />
      </div>

      {/* Gönder Butonu */}
      <Button
        type="submit"
        size="lg"
        disabled={isLoading}
        className="mt-2 w-full bg-gradient-to-r from-primary to-brand-2 py-6 text-base font-semibold text-white shadow-md transition-all hover:scale-[1.01] hover:shadow-lg disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            <span>{tPay("loadingForm")}</span>
          </>
        ) : (
          tPay("startPayment")
        )}
      </Button>
    </form>
  )
}
