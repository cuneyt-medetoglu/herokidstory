import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { auth } from '@/auth'
import { getAdminUserById } from '@/lib/db/admin'
import { getTranslations } from 'next-intl/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserEditForm } from '@/components/admin/user-edit-form'
import {
  ArrowLeft,
  Users,
  Calendar,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react'

const STATUS_ICON: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />,
  generating: <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin shrink-0" />,
  failed: <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />,
  draft: <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />,
  archived: <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />,
}

function formatDate(date: Date | null, locale: string) {
  if (!date) return '—'
  return new Date(date).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function timeAgo(date: Date, t: (key: string, values?: Record<string, number>) => string): string {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return t('today')
  if (days < 30) return t('daysAgo', { n: days })
  return t('monthsAgo', { n: Math.floor(days / 30) })
}

interface PageProps {
  params: { locale: string; id: string }
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { locale, id } = params
  const [user, session] = await Promise.all([getAdminUserById(id), auth()])

  if (!user) notFound()

  const t = await getTranslations({ locale, namespace: 'admin.users.detail' })
  const tRole = await getTranslations({ locale, namespace: 'admin.users' })
  const tTime = await getTranslations({ locale, namespace: 'admin.timeAgo' })

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/admin/users">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            {t('back')}
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-brand-2 text-sm font-bold text-white">
              {(user.name ?? user.email).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{user.name ?? '—'}</h2>
                {user.role === 'admin' && (
                  <Badge className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
                    <ShieldCheck className="h-3 w-3" />
                    {tRole('roleAdmin')}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-1">{user.id}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> {t('registeredAt')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-medium">{formatDate(user.created_at, locale)}</p>
            <p className="text-xs text-muted-foreground">{timeAgo(user.created_at, (k, v) => tTime(k, v as Record<string, number>))}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> {t('totalBooks')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold">{user.book_count}</p>
            <p className="text-xs text-muted-foreground">{t('completedCount', { count: user.completed_book_count })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> {t('freeCover')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-medium">
              {user.free_cover_used ? t('freeCoverUsed') : t('freeCoverNotUsed')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {t('recentBooks')} ({user.recentBooks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.recentBooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noBooks')}</p>
          ) : (
            <div className="space-y-2">
              {user.recentBooks.map((book) => (
                <div key={book.id} className="flex items-center gap-3">
                  {book.cover_image_url ? (
                    <Image
                      src={book.cover_image_url}
                      alt={book.title}
                      width={24}
                      height={32}
                      className="h-8 w-6 rounded object-cover shrink-0"
                      sizes="24px"
                    />
                  ) : (
                    <div className="h-8 w-6 rounded bg-muted flex items-center justify-center shrink-0">
                      <BookOpen className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{book.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{book.theme}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {STATUS_ICON[book.status] ?? STATUS_ICON['draft']}
                    <p className="text-xs text-muted-foreground">{timeAgo(book.created_at, (k, v) => tTime(k, v as Record<string, number>))}</p>
                    <Link href={`/admin/books/${book.id}`}>
                      <Button size="icon" variant="ghost" className="h-6 w-6">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {t('adminEdit')}
            <Badge variant="outline" className="text-xs">{t('adminOnly')}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UserEditForm user={user} currentAdminId={session?.user?.id ?? ''} />
        </CardContent>
      </Card>
    </div>
  )
}
