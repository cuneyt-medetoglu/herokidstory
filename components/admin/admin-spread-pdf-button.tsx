'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileStack } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useToast } from '@/hooks/use-toast'

type Props = {
  bookId: string
  disabled?: boolean
}

export function AdminSpreadPdfButton({ bookId, disabled }: Props) {
  const t = useTranslations('admin.books.detail')
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/books/${bookId}/generate-pdf`, { method: 'POST' })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      const blob = await res.blob()
      const cd = res.headers.get('Content-Disposition')
      let filename = `book-${bookId}.pdf`
      const m = cd?.match(/filename="([^"]+)"/)
      if (m?.[1]) filename = m[1]

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: t('downloadPdfAdminSuccessTitle'),
        description: t('downloadPdfAdminSuccessDesc'),
      })
    } catch (e) {
      toast({
        title: t('downloadPdfAdminErrorTitle'),
        description: e instanceof Error ? e.message : t('downloadPdfAdminErrorDesc'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="w-full mt-1 gap-1.5"
      onClick={handleClick}
      disabled={disabled || loading}
    >
      <FileStack className="h-3.5 w-3.5 shrink-0" />
      {loading ? t('downloadPdfAdminLoading') : t('downloadPdfAdminSpread')}
    </Button>
  )
}
