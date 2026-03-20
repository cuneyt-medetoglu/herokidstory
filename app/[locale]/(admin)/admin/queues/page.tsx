'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Activity,
  RefreshCw,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Pause,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface JobData {
  id: string
  status: 'active' | 'waiting' | 'delayed' | 'completed' | 'failed'
  bookId?: string
  userId?: string
  progress: number
  attemptsMade: number
  createdAt: string | null
  processedAt: string | null
  finishedAt: string | null
  failReason: string | null
}

interface QueueCounts {
  active: number
  waiting: number
  completed: number
  failed: number
  delayed: number
  paused: number
}

interface QueueData {
  counts: QueueCounts
  jobs: JobData[]
  queueName: string
}

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; className: string; badgeClass: string }
> = {
  active: {
    label: 'Aktif',
    icon: Loader2,
    className: 'text-blue-600',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  waiting: {
    label: 'Bekliyor',
    icon: Clock,
    className: 'text-yellow-600',
    badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  delayed: {
    label: 'Gecikmiş',
    icon: Pause,
    className: 'text-orange-600',
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  completed: {
    label: 'Tamamlandı',
    icon: CheckCircle2,
    className: 'text-green-600',
    badgeClass: 'bg-green-100 text-green-700 border-green-200',
  },
  failed: {
    label: 'Başarısız',
    icon: AlertCircle,
    className: 'text-red-600',
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
  },
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return `${secs}s önce`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}dk önce`
  const hours = Math.floor(mins / 60)
  return `${hours}s önce`
}

export default function AdminQueuesPage() {
  const [data, setData] = useState<QueueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { toast } = useToast()

  const fetchQueueData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/queues?status=${activeTab}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Queue fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchQueueData()
  }, [fetchQueueData])

  // Auto-refresh her 5 saniyede bir
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchQueueData, 5000)
    return () => clearInterval(interval)
  }, [fetchQueueData, autoRefresh])

  const handleRetry = async (jobId: string) => {
    try {
      const res = await fetch(`/api/admin/queues?action=retry&jobId=${jobId}`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast({ title: 'Job yeniden kuyruğa eklendi', description: `Job ID: ${jobId}` })
      fetchQueueData()
    } catch (err: any) {
      toast({ title: 'Hata', description: err.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (jobId: string) => {
    try {
      const res = await fetch(`/api/admin/queues?jobId=${jobId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast({ title: 'Job silindi', description: `Job ID: ${jobId}` })
      fetchQueueData()
    } catch (err: any) {
      toast({ title: 'Hata', description: err.message, variant: 'destructive' })
    }
  }

  const counts = data?.counts
  const jobs = data?.jobs ?? []
  const filteredJobs = activeTab === 'all' ? jobs : jobs.filter((j) => j.status === activeTab)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Job Queue Monitor
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            BullMQ · <span className="font-mono text-xs">book-generation</span> kuyruğu
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn('gap-2', autoRefresh && 'border-green-300 text-green-700')}
            onClick={() => setAutoRefresh((v) => !v)}
          >
            <div className={cn('h-2 w-2 rounded-full', autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground')} />
            {autoRefresh ? 'Otomatik (5s)' : 'Duraklattı'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchQueueData} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { key: 'active', label: 'Aktif', count: counts?.active ?? 0, color: 'text-blue-600', bg: 'bg-blue-50' },
          { key: 'waiting', label: 'Bekliyor', count: counts?.waiting ?? 0, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { key: 'delayed', label: 'Gecikmiş', count: counts?.delayed ?? 0, color: 'text-orange-600', bg: 'bg-orange-50' },
          { key: 'completed', label: 'Tamamlandı', count: counts?.completed ?? 0, color: 'text-green-600', bg: 'bg-green-50' },
          { key: 'failed', label: 'Başarısız', count: counts?.failed ?? 0, color: 'text-red-600', bg: 'bg-red-50' },
          { key: 'paused', label: 'Duraklattı', count: counts?.paused ?? 0, color: 'text-gray-600', bg: 'bg-gray-50' },
        ].map((stat) => (
          <Card key={stat.key} className="cursor-pointer hover:ring-1 hover:ring-primary/20" onClick={() => setActiveTab(stat.key === 'paused' ? 'all' : stat.key)}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={cn('text-2xl font-bold', stat.color)}>{stat.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Job Listesi</CardTitle>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-7">
                <TabsTrigger value="all" className="text-xs px-2 h-6">Tümü</TabsTrigger>
                <TabsTrigger value="active" className="text-xs px-2 h-6">Aktif</TabsTrigger>
                <TabsTrigger value="waiting" className="text-xs px-2 h-6">Bekliyor</TabsTrigger>
                <TabsTrigger value="failed" className="text-xs px-2 h-6">Başarısız</TabsTrigger>
                <TabsTrigger value="completed" className="text-xs px-2 h-6">Tamamlandı</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm">Yükleniyor...</span>
            </div>
          )}

          {!loading && filteredJobs.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Bu durumdaki job bulunamadı
            </div>
          )}

          {!loading && filteredJobs.length > 0 && (
            <div className="divide-y overflow-x-auto">
              {filteredJobs.map((job) => {
                const config = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.waiting
                const Icon = config.icon
                return (
                  <div
                    key={job.id}
                    className={cn(
                      'grid w-full min-w-[52rem] items-center gap-x-3 px-6 py-3 hover:bg-muted/30',
                      'grid-cols-[auto_minmax(0,5.5rem)_minmax(0,1fr)_minmax(0,6.5rem)_2.75rem_7rem_auto_auto]'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', config.className, job.status === 'active' && 'animate-spin')} />

                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Job ID</p>
                      <p className="text-xs font-mono truncate">{job.id}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Book ID</p>
                      <p className="text-xs font-mono truncate" title={job.bookId ?? undefined}>
                        {job.bookId ?? '—'}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Oluşturuldu</p>
                      <p className="text-xs tabular-nums">{timeAgo(job.createdAt)}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Deneme</p>
                      <p className="text-xs tabular-nums">{job.attemptsMade}</p>
                    </div>

                    {/* İlerleme sütunu: her satırda aynı genişlik; sadece aktifte dolu */}
                    <div className="w-full min-w-0 max-w-[7rem] justify-self-start">
                      {job.status === 'active' ? (
                        <>
                          <div className="flex justify-between gap-1 text-[10px] text-muted-foreground mb-0.5">
                            <span className="shrink-0">İlerleme</span>
                            <span className="tabular-nums">{job.progress}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="h-[26px]" aria-hidden />
                      )}
                    </div>

                    <Badge variant="outline" className={cn('text-[10px] w-fit justify-self-start', config.badgeClass)}>
                      {config.label}
                    </Badge>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1 shrink-0">
                      {job.status === 'failed' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Yeniden dene"
                          onClick={() => handleRetry(job.id)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {(job.status === 'failed' || job.status === 'completed') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          title="Sil"
                          onClick={() => handleDelete(job.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Failed job error details */}
          {!loading && filteredJobs.some((j) => j.status === 'failed' && j.failReason) && (
            <div className="border-t px-6 py-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Hata Detayları</p>
              {filteredJobs
                .filter((j) => j.status === 'failed' && j.failReason)
                .map((j) => (
                  <div key={j.id} className="mb-2">
                    <p className="text-[11px] font-mono text-muted-foreground">Job {j.id}:</p>
                    <p className="text-xs text-red-600 bg-red-50 rounded p-2 mt-0.5 font-mono break-all">
                      {j.failReason}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
