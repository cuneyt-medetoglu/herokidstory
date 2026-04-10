'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Tag, CheckCircle, XCircle, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { PromoCode } from '@/lib/db/promo-codes'

function formatDate(d: Date | string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function statusBadge(promo: PromoCode) {
  const now = new Date()
  if (!promo.is_active) return <Badge variant="outline">Pasif</Badge>
  if (promo.valid_until && new Date(promo.valid_until) < now)
    return <Badge variant="destructive">Süresi Doldu</Badge>
  if (promo.max_uses !== null && promo.used_count >= promo.max_uses)
    return <Badge variant="secondary">Limit Doldu</Badge>
  return <Badge className="bg-green-500 text-white">Aktif</Badge>
}

export default function PromoCodesPage() {
  const [rows, setRows]       = useState<PromoCode[]>([])
  const [total, setTotal]     = useState(0)
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50', offset: '0' })
      if (q) params.set('search', q)
      const res  = await fetch(`/api/admin/promo-codes?${params}`)
      const data = await res.json() as { rows: PromoCode[]; total: number }
      setRows(data.rows ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData('')
  }, [fetchData])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    void fetchData(search)
  }, [search, fetchData])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">İndirim Kodları</h1>
          <p className="text-sm text-muted-foreground">
            Toplam {total} kod
          </p>
        </div>
        <Link href="/admin/promo-codes/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Yeni Kod
          </Button>
        </Link>
      </div>

      {/* Arama */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
        <Input
          placeholder="Kod veya açıklama ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="outline" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {/* Tablo */}
      <div className="rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="px-4 py-3 text-left font-medium">Kod</th>
              <th className="px-4 py-3 text-left font-medium">İndirim</th>
              <th className="px-4 py-3 text-left font-medium">Kullanım</th>
              <th className="px-4 py-3 text-left font-medium">Geçerlilik</th>
              <th className="px-4 py-3 text-left font-medium">Durum</th>
              <th className="px-4 py-3 text-left font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Yükleniyor...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  <Tag className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p>Henüz indirim kodu yok</p>
                </td>
              </tr>
            ) : (
              rows.map((promo) => (
                <tr key={promo.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-mono font-semibold text-primary">{promo.code}</div>
                    {promo.description && (
                      <div className="text-xs text-muted-foreground mt-0.5">{promo.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {promo.discount_type === 'percent'
                      ? `%${promo.discount_value}`
                      : `₺${promo.discount_value}`}
                  </td>
                  <td className="px-4 py-3">
                    {promo.used_count}
                    {promo.max_uses !== null && ` / ${promo.max_uses}`}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div>{promo.valid_from ? formatDate(promo.valid_from) : '—'}</div>
                    <div className="text-muted-foreground">
                      {promo.valid_until ? `→ ${formatDate(promo.valid_until)}` : 'Süresiz'}
                    </div>
                  </td>
                  <td className="px-4 py-3">{statusBadge(promo)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/promo-codes/${promo.id}`}>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
