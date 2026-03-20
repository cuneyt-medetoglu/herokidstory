'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { useBookGenerationStatus, getStepLabel } from '@/hooks/useBookGenerationStatus'
import { Button } from '@/components/ui/button'
import { BookOpen, CheckCircle2, AlertCircle, ArrowLeft, X, Loader2, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageProps {
  params: { bookId: string; locale: string }
}

const STEPS = [
  { key: 'story_generating', label: { tr: 'Hikaye yazılıyor', en: 'Writing story' }, threshold: 15 },
  { key: 'master_generating', label: { tr: 'Karakter illüstrasyonu', en: 'Character illustration' }, threshold: 30 },
  { key: 'cover_generating', label: { tr: 'Kapak tasarımı', en: 'Cover design' }, threshold: 50 },
  { key: 'pages_generating', label: { tr: 'Sayfa görselleri', en: 'Page illustrations' }, threshold: 90 },
  { key: 'tts_generating', label: { tr: 'Sesli anlatım', en: 'Narration audio' }, threshold: 100 },
]

function StepItem({
  label,
  threshold,
  progress,
  currentStep,
  stepKey,
}: {
  label: string
  threshold: number
  progress: number
  currentStep: string
  stepKey: string
}) {
  const isCompleted = progress >= threshold
  const isCurrent = currentStep === stepKey
  const isPending = !isCompleted && !isCurrent

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500',
          isCompleted
            ? 'border-green-500 bg-green-500 text-white'
            : isCurrent
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-muted-foreground/30 bg-background text-muted-foreground/50'
        )}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : isCurrent ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-current" />
        )}
      </div>
      <span
        className={cn(
          'text-sm transition-colors',
          isCompleted
            ? 'text-foreground font-medium'
            : isCurrent
            ? 'text-foreground font-semibold'
            : 'text-muted-foreground'
        )}
      >
        {label}
      </span>
    </div>
  )
}

export default function GeneratingPage({ params }: PageProps) {
  const { bookId } = params
  const locale = useLocale()
  const router = useRouter()
  const { title, progress, step, isDone, isError, isLoading, lastGenerationError } =
    useBookGenerationStatus(bookId)
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    setDisplayProgress(0)
  }, [bookId])

  // Progress geçişlerini görsel olarak yumuşat (backend verisi değişmez)
  useEffect(() => {
    const target = isDone ? 100 : progress
    const timer = setInterval(() => {
      setDisplayProgress((prev) => {
        if (target <= prev) return prev
        const delta = target - prev
        const stepSize = Math.max(1, Math.ceil(delta / 8))
        const next = Math.min(target, prev + stepSize)
        return next
      })
    }, 60)
    return () => clearInterval(timer)
  }, [progress, isDone])

  // Kitap tamamlanınca otomatik book-viewer'a yönlendir (3 saniye bekle)
  useEffect(() => {
    if (isDone && !isError) {
      const timer = setTimeout(() => {
        router.push(`/books/${bookId}/view`)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isDone, isError, bookId, router])

  const isLang = (tr: string, en: string) => (locale === 'tr' ? tr : en)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border bg-card shadow-lg p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div
                className={cn(
                  'flex h-16 w-16 items-center justify-center rounded-2xl',
                  isError
                    ? 'bg-red-100 text-red-500'
                    : isDone
                    ? 'bg-green-100 text-green-600'
                    : 'bg-primary/10 text-primary'
                )}
              >
                {isError ? (
                  <AlertCircle className="h-8 w-8" />
                ) : isDone ? (
                  <CheckCircle2 className="h-8 w-8" />
                ) : (
                  <BookOpen className="h-8 w-8" />
                )}
              </div>
            </div>

            <h1 className="text-xl font-bold tracking-tight">
              {isError
                ? isLang('Bir hata oluştu', 'An error occurred')
                : isDone
                ? isLang('Kitabınız hazır!', 'Your book is ready!')
                : isLang('Kitabınız oluşturuluyor', 'Creating your book')}
            </h1>

            {title && (
              <p className="text-sm text-muted-foreground font-medium">
                &ldquo;{title}&rdquo;
              </p>
            )}

            {!isDone && !isError && (
              <p className="text-xs text-muted-foreground">
                {isLang(
                  'Bu sayfayı güvenle kapatabilirsiniz. Kitap arka planda oluşturulmaya devam eder ve bitince kütüphanenizde görünür.',
                  'You can safely close this page. Your book will continue generating in the background and appear in your library when done.'
                )}
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {!isError && !isLoading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{getStepLabel(step, locale)}</span>
                <span className="font-mono font-medium text-foreground">{displayProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    isDone ? 'bg-green-500' : 'bg-primary'
                  )}
                  style={{ width: `${displayProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Steps */}
          {!isError && (
            <div className="space-y-3">
              {STEPS.map((s) => (
                <StepItem
                  key={s.key}
                  label={locale === 'tr' ? s.label.tr : s.label.en}
                  threshold={s.threshold}
                  progress={displayProgress}
                  currentStep={step}
                  stepKey={s.key}
                />
              ))}
            </div>
          )}

          {/* Done: kitaba git */}
          {isDone && !isError && (
            <div className="space-y-3 pt-2">
              <Button
                className="w-full"
                onClick={() => router.push(`/books/${bookId}/view`)}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                {isLang('Kitabı Görüntüle', 'View Book')}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/dashboard')}
              >
                {isLang('Kütüphaneye Dön', 'Go to Library')}
              </Button>
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="space-y-3">
              <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700 space-y-2">
                <p>
                  {isLang(
                    'Kitap oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin veya destek ile iletişime geçin.',
                    'Something went wrong while creating your book. Please try again or contact support.'
                  )}
                </p>
                {lastGenerationError && (
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded bg-red-100/80 p-2 text-xs text-red-900 font-mono">
                    {lastGenerationError}
                  </pre>
                )}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/create/step1')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {isLang('Tekrar Dene', 'Try Again')}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => router.push('/dashboard')}
              >
                {isLang('Kütüphaneye Dön', 'Go to Library')}
              </Button>
            </div>
          )}

          {/* Active: kapat/dashboard butonları */}
          {!isDone && !isError && (
            <div className="space-y-2 pt-2 border-t">
              <Button
                variant="ghost"
                className="w-full text-muted-foreground text-sm h-9"
                onClick={() => router.push('/dashboard')}
              >
                <X className="h-3.5 w-3.5 mr-2" />
                {isLang('Kapat — arka planda devam eder', 'Close — continues in background')}
              </Button>
            </div>
          )}

          {/* E-posta bilgisi */}
          {!isDone && !isError && (
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                {isLang(
                  'Kitabınız tamamlandığında kütüphanenizde hazır olacak.',
                  'Your book will be ready in your library when completed.'
                )}
              </p>
            </div>
          )}
        </div>

        {/* Dönen kitap animation (sadece oluşturma sırasında) */}
        {!isDone && !isError && (
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground animate-pulse">
              {step === 'story_generating'
            ? isLang('Yapay zeka benzersiz hikayenizi yazıyor...', 'AI is writing your unique story...')
            : isLang('Her sayfa özenle illüstre ediliyor...', 'Every page is being carefully illustrated...')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
