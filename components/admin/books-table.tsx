'use client'

import Image from 'next/image'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { Link } from '@/i18n/navigation'
import type { AdminBookRow } from '@/lib/db/admin'
import { parseCostUsd } from '@/lib/utils/cost-usd'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ExternalLink,
} from 'lucide-react'

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  generating: 'secondary',
  failed: 'destructive',
  draft: 'outline',
  archived: 'outline',
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
  generating: <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />,
  failed: <AlertCircle className="h-3.5 w-3.5 text-red-500" />,
  draft: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
  archived: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
}

function formatEstimatedUsd(value: number | string | null | undefined): string {
  const n = parseCostUsd(value)
  if (n <= 0) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(n)
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins || 1}d`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}s`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} gün`
  return `${Math.floor(days / 30)} ay`
}

interface BooksTableProps {
  books: AdminBookRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  initialSearch?: string
  initialStatus?: string
}

export function BooksTable({
  books,
  total,
  page,
  totalPages,
  initialSearch = '',
  initialStatus = '',
}: BooksTableProps) {
  const t = useTranslations('admin.books')
  const tPagination = useTranslations('admin.pagination')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(initialSearch)

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v)
        else params.delete(k)
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ search: search || undefined })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-72"
            />
          </div>
          <Button type="submit" size="sm">{t('search')}</Button>
          {(initialSearch || initialStatus) && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearch('')
                router.push(pathname)
              }}
            >
              {t('clear')}
            </Button>
          )}
        </form>

        <Select
          value={initialStatus || '__all__'}
          onValueChange={(v) => updateParams({ status: v === '__all__' ? undefined : v })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('table.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('allStatuses')}</SelectItem>
            <SelectItem value="completed">{t('status.completed')}</SelectItem>
            <SelectItem value="generating">{t('status.generating')}</SelectItem>
            <SelectItem value="failed">{t('status.failed')}</SelectItem>
            <SelectItem value="draft">{t('status.draft')}</SelectItem>
            <SelectItem value="archived">{t('status.archived')}</SelectItem>
          </SelectContent>
        </Select>

        <span className="ml-auto text-xs text-muted-foreground">{t('count', { count: total })}</span>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">{t('table.book')}</th>
              <th className="px-4 py-3 font-medium">{t('table.user')}</th>
              <th className="px-4 py-3 font-medium">{t('table.status')}</th>
              <th className="px-4 py-3 font-medium">{t('table.theme')}</th>
              <th className="px-4 py-3 font-medium">{t('table.language')}</th>
              <th className="px-4 py-3 font-medium text-right">{t('table.estimatedCost')}</th>
              <th className="px-4 py-3 font-medium">{t('table.created')}</th>
              <th className="px-4 py-3 font-medium w-10" />
            </tr>
          </thead>
          <tbody>
            {books.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  <BookOpen className="mx-auto h-8 w-8 mb-2 opacity-30" />
                  {t('table.noBooks')}
                </td>
              </tr>
            )}
            {books.map((book) => (
              <tr key={book.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {book.cover_image_url ? (
                      <Image
                        src={book.cover_image_url}
                        alt={book.title}
                        width={28}
                        height={36}
                        className="h-9 w-7 rounded object-cover shrink-0"
                        sizes="28px"
                      />
                    ) : (
                      <div className="h-9 w-7 rounded bg-muted flex items-center justify-center shrink-0">
                        <BookOpen className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium truncate max-w-[180px]">{book.title}</p>
                      <p className="text-xs text-muted-foreground font-mono">{book.id.slice(0, 8)}…</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="truncate max-w-[160px]">{book.user_name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[160px]">{book.user_email}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {STATUS_ICON[book.status] ?? STATUS_ICON['draft']}
                    <Badge variant={STATUS_VARIANTS[book.status] ?? 'outline'} className="text-xs">
                      {t(`status.${book.status}` as any) || book.status}
                    </Badge>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground capitalize">{book.theme}</td>
                <td className="px-4 py-3 text-muted-foreground uppercase">{book.language}</td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground whitespace-nowrap">
                  {formatEstimatedUsd(book.ai_cost_usd_total)}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {timeAgo(book.created_at)}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/books/${book.id}`}>
                    <Button size="icon" variant="ghost" className="h-7 w-7">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{tPagination('pageOf', { page, total: totalPages })}</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.set('page', String(page - 1))
                router.push(`${pathname}?${params.toString()}`)
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.set('page', String(page + 1))
                router.push(`${pathname}?${params.toString()}`)
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
