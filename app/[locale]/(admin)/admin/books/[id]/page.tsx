import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { getAdminBookById } from '@/lib/db/admin'
import { getAIRequestsByBook } from '@/lib/db/ai-requests'
import { parseCostUsd } from '@/lib/utils/cost-usd'
import { getTranslations } from 'next-intl/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AdminBookEditForm } from '@/components/admin/book-edit-form'
import {
  ArrowLeft,
  BookOpen,
  User,
  Calendar,
  Globe,
  Palette,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  DollarSign,
} from 'lucide-react'

const STATUS_ICON: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  generating: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
  failed: <AlertCircle className="h-4 w-4 text-red-500" />,
  draft: <Clock className="h-4 w-4 text-muted-foreground" />,
  archived: <Clock className="h-4 w-4 text-muted-foreground" />,
}

const STATUS_COLOR: Record<string, string> = {
  completed: 'text-green-600',
  generating: 'text-blue-600',
  failed: 'text-red-600',
  draft: '',
  archived: '',
}

function formatUsd(value: number) {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value)
}

/** Admin kitap zamanları: sunucu TZ’den bağımsız, Türkiye saati */
function formatDate(date: Date | null, locale: string) {
  if (!date) return '—'
  return new Date(date).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    timeZone: 'Europe/Istanbul',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDurationLabel(ms: number, locale: string): string {
  const sec = Math.floor(ms / 1000)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  const h = Math.floor(m / 60)
  const min = m % 60
  if (locale === 'tr') {
    return h > 0 ? `${h} sa ${min} dk ${s} sn` : `${m} dk ${s} sn`
  }
  return h > 0 ? `${h}h ${min}m ${s}s` : `${m}m ${s}s`
}

/** Önce kitap satırı (completed_at − created_at); tutarsızsa AI istek zaman aralığı */
function formatGenerationDuration(
  createdAt: Date | null,
  completedAt: Date | null,
  locale: string,
  aiFirstAt: Date | null | undefined,
  aiLastAt: Date | null | undefined
):
  | { kind: 'book'; label: string }
  | { kind: 'ai'; label: string }
  | { kind: 'invalid' }
  | null {
  const bookStart = createdAt ? new Date(createdAt).getTime() : NaN
  const bookEnd = completedAt ? new Date(completedAt).getTime() : NaN
  if (
    Number.isFinite(bookStart) &&
    Number.isFinite(bookEnd) &&
    bookEnd >= bookStart
  ) {
    return { kind: 'book', label: formatDurationLabel(bookEnd - bookStart, locale) }
  }

  const aiStart = aiFirstAt ? new Date(aiFirstAt).getTime() : NaN
  const aiEnd = aiLastAt ? new Date(aiLastAt).getTime() : NaN
  if (Number.isFinite(aiStart) && Number.isFinite(aiEnd) && aiEnd >= aiStart) {
    return { kind: 'ai', label: formatDurationLabel(aiEnd - aiStart, locale) }
  }

  if (!createdAt || !completedAt) return null
  return { kind: 'invalid' }
}

interface PageProps {
  params: { locale: string; id: string }
}

export default async function AdminBookDetailPage({ params }: PageProps) {
  const { locale, id } = params
  const [book, aiBook] = await Promise.all([getAdminBookById(id), getAIRequestsByBook(id)])
  if (!book) notFound()

  const { rows: aiRows, totalCostUsd } = aiBook
  const breakdownMap = new Map<string, { usd: number; count: number }>()
  for (const r of aiRows) {
    const add = parseCostUsd(r.costUsd)
    const cur = breakdownMap.get(r.operationType) ?? { usd: 0, count: 0 }
    cur.usd += add
    cur.count += 1
    breakdownMap.set(r.operationType, cur)
  }
  const breakdownSorted = [...breakdownMap.entries()].sort((a, b) => b[1].usd - a[1].usd)

  const aiFirstAt = aiRows[0]?.createdAt ?? null
  const aiLastAt = aiRows.length ? aiRows[aiRows.length - 1]!.createdAt : null

  const t = await getTranslations({ locale, namespace: 'admin.books.detail' })
  const genDuration = formatGenerationDuration(
    book.created_at,
    book.completed_at,
    locale,
    aiFirstAt,
    aiLastAt
  )
  const tStatus = await getTranslations({ locale, namespace: 'admin.books.status' })
  const statusLabel = tStatus(book.status as any)
  const statusIcon = STATUS_ICON[book.status] ?? STATUS_ICON['draft']
  const statusColor = STATUS_COLOR[book.status] ?? ''
  const pages: any[] = book.story_data?.pages ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/admin/books">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            {t('back')}
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold">{book.title}</h2>
            <div className="flex items-center gap-1.5">
              {statusIcon}
              <span className={`text-sm font-medium ${statusColor}`}>{statusLabel}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{book.id}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> {t('user')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-medium">{book.user_name ?? '—'}</p>
            <p className="text-xs text-muted-foreground truncate">{book.user_email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> {t('createdAt')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-medium">{formatDate(book.created_at, locale)}</p>
            {book.completed_at && (
              <p className="text-xs text-muted-foreground">
                {t('completedAt')}: {formatDate(book.completed_at, locale)}
              </p>
            )}
            {book.status === 'completed' && genDuration && (
              <p
                className={`text-xs mt-1 ${
                  genDuration.kind === 'invalid' ? 'text-amber-700' : 'text-muted-foreground'
                }`}
              >
                {genDuration.kind === 'book' && t('generationDuration', { duration: genDuration.label })}
                {genDuration.kind === 'ai' &&
                  t('generationDurationFromAiLogs', { duration: genDuration.label })}
                {genDuration.kind === 'invalid' && t('generationDurationInvalid')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" /> {t('languageAge')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-medium uppercase">{book.language}</p>
            <p className="text-xs text-muted-foreground">{book.age_group ?? '—'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5" /> {t('themeStyle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-medium capitalize">{book.theme}</p>
            <p className="text-xs text-muted-foreground capitalize">{book.illustration_style}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" />
            {t('aiCostTitle')}
          </CardTitle>
          <p className="text-xs text-muted-foreground font-normal leading-relaxed">{t('aiCostSubtitle')}</p>
          <p className="text-xs text-muted-foreground font-normal leading-relaxed mt-2 border-l-2 border-muted pl-3">
            {t('aiCostScope')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('aiCostNoRequests')}</p>
          ) : (
            <>
              <div>
                <p className="text-xs text-muted-foreground">{t('aiCostTotal')}</p>
                <p className="text-2xl font-semibold tabular-nums">{formatUsd(totalCostUsd)}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('aiCostTotalCalls', { count: aiRows.length })}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">{t('aiCostBreakdown')}</p>
                <div className="rounded-md border bg-muted/20 overflow-hidden text-sm">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-0 px-3 py-2 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
                    <span>{t('aiCostColOperation')}</span>
                    <span className="text-right tabular-nums">{t('aiCostColCalls')}</span>
                    <span className="text-right tabular-nums min-w-[5.5rem]">{t('aiCostColAmount')}</span>
                  </div>
                  {breakdownSorted.map(([op, { usd, count }]) => (
                    <div
                      key={op}
                      className="grid grid-cols-[1fr_auto_auto] gap-x-3 items-center px-3 py-2 border-b last:border-0"
                    >
                      <span>{t(`operationType.${op}` as never)}</span>
                      <span className="text-right tabular-nums text-muted-foreground">{count}</span>
                      <span className="text-right font-mono tabular-nums text-muted-foreground">{formatUsd(usd)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t('aiCostPartialNote')}</p>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" /> {t('cover')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {book.cover_image_url ? (
              <Image
                src={book.cover_image_url}
                alt={book.title}
                width={180}
                height={240}
                className="w-full max-w-[180px] mx-auto rounded-lg shadow object-cover"
                sizes="180px"
              />
            ) : (
              <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
                {t('noCover')}
              </div>
            )}
            <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>{t('pageCount')}</span>
                <span className="font-medium text-foreground">{book.total_pages}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('viewCount')}</span>
                <span className="font-medium text-foreground">{book.view_count ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('editQuota')}</span>
                <span className="font-medium text-foreground">
                  {book.edit_quota_used ?? 0} / {book.edit_quota_limit ?? '∞'}
                </span>
              </div>
              {book.pdf_url && (
                <a
                  href={book.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline pt-1"
                >
                  <FileText className="h-3.5 w-3.5" /> {t('downloadPdf')}
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('pageContents')} ({t('pageCountLabel', { count: pages.length })})</CardTitle>
          </CardHeader>
          <CardContent>
            {pages.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noPageData')}</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {pages.map((p: any, i: number) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {i + 1}
                    </span>
                    <p className="text-muted-foreground leading-relaxed line-clamp-3">
                      {p.text ?? p.content ?? JSON.stringify(p).slice(0, 120)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {t('adminEdit')}
            <Badge variant="outline" className="text-xs">{t('adminOnly')}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminBookEditForm book={book} />
        </CardContent>
      </Card>
    </div>
  )
}
