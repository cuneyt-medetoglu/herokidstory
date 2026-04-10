'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

type DiscountType = 'percent' | 'fixed'

export default function NewPromoCodePage() {
  const router = useRouter()

  const [form, setForm] = useState({
    code:             '',
    description:      '',
    discountType:     'percent' as DiscountType,
    discountValue:    10,
    maxUses:          '' as string | number,
    maxUsesPerUser:   1,
    validFrom:        '',
    validUntil:       '',
    minOrderAmount:   '' as string | number,
    isActive:         true,
  })
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const body = {
        code:           form.code.toUpperCase().trim(),
        description:    form.description || null,
        discountType:   form.discountType,
        discountValue:  Number(form.discountValue),
        maxUses:        form.maxUses !== '' ? Number(form.maxUses) : null,
        maxUsesPerUser: Number(form.maxUsesPerUser),
        validFrom:      form.validFrom || null,
        validUntil:     form.validUntil || null,
        minOrderAmount: form.minOrderAmount !== '' ? Number(form.minOrderAmount) : null,
        isActive:       form.isActive,
      }

      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Bir hata oluştu')
        return
      }

      router.push('/admin/promo-codes')
    } catch {
      setError('Bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/promo-codes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Yeni İndirim Kodu</h1>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 rounded-lg border bg-card p-6">
        {/* Kod */}
        <div className="space-y-1">
          <Label htmlFor="code">Kod *</Label>
          <Input
            id="code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="HEROKID20"
            className="font-mono uppercase"
            required
          />
        </div>

        {/* Açıklama */}
        <div className="space-y-1">
          <Label htmlFor="description">Açıklama</Label>
          <Input
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Lansman kampanyası"
          />
        </div>

        {/* İndirim türü + değer */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>İndirim Türü *</Label>
            <div className="flex gap-4 pt-1">
              {(['percent', 'fixed'] as DiscountType[]).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="discountType"
                    value={type}
                    checked={form.discountType === type}
                    onChange={() => setForm({ ...form, discountType: type })}
                  />
                  {type === 'percent' ? 'Yüzde (%)' : 'Sabit Tutar (₺)'}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="discountValue">
              Değer * {form.discountType === 'percent' ? '(%)' : '(₺)'}
            </Label>
            <Input
              id="discountValue"
              type="number"
              min={0}
              max={form.discountType === 'percent' ? 100 : undefined}
              step="0.01"
              value={form.discountValue}
              onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
              required
            />
          </div>
        </div>

        {/* Kullanım limitleri */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="maxUses">Max Kullanım (boş = sınırsız)</Label>
            <Input
              id="maxUses"
              type="number"
              min={1}
              value={form.maxUses}
              onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
              placeholder="100"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="maxUsesPerUser">Kişi Başı Max</Label>
            <Input
              id="maxUsesPerUser"
              type="number"
              min={1}
              value={form.maxUsesPerUser}
              onChange={(e) => setForm({ ...form, maxUsesPerUser: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* Geçerlilik tarihleri */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="validFrom">Başlangıç Tarihi</Label>
            <Input
              id="validFrom"
              type="datetime-local"
              value={form.validFrom}
              onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="validUntil">Bitiş Tarihi</Label>
            <Input
              id="validUntil"
              type="datetime-local"
              value={form.validUntil}
              onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
            />
          </div>
        </div>

        {/* Minimum sipariş tutarı */}
        <div className="space-y-1">
          <Label htmlFor="minOrderAmount">Min Sipariş Tutarı (₺, boş = kısıtlama yok)</Label>
          <Input
            id="minOrderAmount"
            type="number"
            min={0}
            step="0.01"
            value={form.minOrderAmount}
            onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
            placeholder="0"
          />
        </div>

        {/* Aktif */}
        <div className="flex items-center gap-3">
          <input
            id="isActive"
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="h-4 w-4"
          />
          <Label htmlFor="isActive" className="cursor-pointer">Aktif</Label>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Oluştur
          </Button>
          <Link href="/admin/promo-codes">
            <Button type="button" variant="outline">İptal</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
