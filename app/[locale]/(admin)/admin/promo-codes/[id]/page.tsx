'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { PromoCode } from '@/lib/db/promo-codes'

interface UsageRow {
  id: string
  user_email: string
  user_name: string | null
  discount_amount: number
  used_at: string
}

export default function PromoCodeDetailPage({
  params,
}: {
  params: { id: string; locale: string }
}) {
  const router = useRouter()
  const [promo, setPromo]       = useState<PromoCode | null>(null)
  const [usages, setUsages]     = useState<UsageRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res  = await fetch(`/api/admin/promo-codes/${params.id}`)
      if (!res.ok) { setError('Bulunamadı'); return }
      const data = await res.json() as { promoCode: PromoCode; usages: UsageRow[] }
      setPromo(data.promoCode)
      setUsages(data.usages)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => { void fetchData() }, [fetchData])

  const handleSave = async () => {
    if (!promo) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/promo-codes/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discountType:   promo.discount_type,
          discountValue:  promo.discount_value,
          maxUses:        promo.max_uses,
          maxUsesPerUser: promo.max_uses_per_user,
          validFrom:      promo.valid_from,
          validUntil:     promo.valid_until,
          minOrderAmount: promo.min_order_amount,
          isActive:       promo.is_active,
          description:    promo.description,
        }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        setError(d.error ?? 'Hata')
        return
      }
      void router.push('/admin/promo-codes')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bu kodu silmek istediğinizden emin misiniz?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/promo-codes/${params.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        setError(d.error ?? 'Silinemedi')
        return
      }
      router.push('/admin/promo-codes')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!promo) {
    return <p className="text-muted-foreground">Kod bulunamadı.</p>
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/promo-codes">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-2xl font-bold font-mono">{promo.code}</h1>
          <Badge variant={promo.is_active ? 'default' : 'outline'}>
            {promo.is_active ? 'Aktif' : 'Pasif'}
          </Badge>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => void handleDelete()}
          disabled={deleting || usages.length > 0}
          title={usages.length > 0 ? 'Kullanım geçmişi olan kodlar silinemez' : ''}
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>İndirim Türü</Label>
            <div className="flex gap-4 pt-1">
              {(['percent', 'fixed'] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="discountType"
                    value={type}
                    checked={promo.discount_type === type}
                    onChange={() => setPromo({ ...promo, discount_type: type })}
                  />
                  {type === 'percent' ? 'Yüzde (%)' : 'Sabit (₺)'}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Değer</Label>
            <Input
              type="number"
              min={0}
              value={promo.discount_value}
              onChange={(e) => setPromo({ ...promo, discount_value: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Max Kullanım (boş = sınırsız)</Label>
            <Input
              type="number"
              min={1}
              value={promo.max_uses ?? ''}
              onChange={(e) => setPromo({ ...promo, max_uses: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
          <div className="space-y-1">
            <Label>Kişi Başı Max</Label>
            <Input
              type="number"
              min={1}
              value={promo.max_uses_per_user ?? ''}
              onChange={(e) => setPromo({ ...promo, max_uses_per_user: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Başlangıç Tarihi</Label>
            <Input
              type="datetime-local"
              value={promo.valid_from ? new Date(promo.valid_from).toISOString().slice(0, 16) : ''}
              onChange={(e) => setPromo({ ...promo, valid_from: e.target.value ? new Date(e.target.value) : null })}
            />
          </div>
          <div className="space-y-1">
            <Label>Bitiş Tarihi</Label>
            <Input
              type="datetime-local"
              value={promo.valid_until ? new Date(promo.valid_until).toISOString().slice(0, 16) : ''}
              onChange={(e) => setPromo({ ...promo, valid_until: e.target.value ? new Date(e.target.value) : null })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label>Açıklama</Label>
          <Input
            value={promo.description ?? ''}
            onChange={(e) => setPromo({ ...promo, description: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            id="isActiveEdit"
            type="checkbox"
            checked={promo.is_active}
            onChange={(e) => setPromo({ ...promo, is_active: e.target.checked })}
            className="h-4 w-4"
          />
          <Label htmlFor="isActiveEdit" className="cursor-pointer">Aktif</Label>
        </div>

        <p className="text-sm text-muted-foreground">
          Kullanım: <strong>{promo.used_count}</strong>
          {promo.max_uses !== null && ` / ${promo.max_uses}`}
        </p>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={() => void handleSave()} disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Kaydet
        </Button>
      </div>

      {/* Kullanım geçmişi */}
      {usages.length > 0 && (
        <div className="rounded-lg border bg-card p-6 space-y-3">
          <h2 className="font-semibold">Kullanım Geçmişi ({usages.length})</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 text-left">Kullanıcı</th>
                <th className="py-2 text-left">İndirim</th>
                <th className="py-2 text-left">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {usages.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="py-2">
                    <div>{u.user_name ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">{u.user_email}</div>
                  </td>
                  <td className="py-2 text-green-600">-₺{u.discount_amount}</td>
                  <td className="py-2 text-xs">
                    {new Date(u.used_at).toLocaleDateString('tr-TR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
