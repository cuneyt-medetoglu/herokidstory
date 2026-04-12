'use client'

import { Link, usePathname } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ShoppingCart,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Tag,
  Volume2,
  SlidersHorizontal,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const NAV_ITEMS: { key: string; href: string; icon: React.ElementType; available: boolean }[] = [
  { key: 'dashboard', href: '/admin', icon: LayoutDashboard, available: true },
  { key: 'bookManagement', href: '/admin/books', icon: BookOpen, available: true },
  { key: 'jobQueue', href: '/admin/queues', icon: Activity, available: true },
  { key: 'orders', href: '/admin/orders', icon: ShoppingCart, available: true },
  { key: 'users', href: '/admin/users', icon: Users, available: true },
  { key: 'promoCodes', href: '/admin/promo-codes', icon: Tag, available: true },
  { key: 'ttsDefaults', href: '/admin/tts-settings', icon: Volume2, available: true },
  { key: 'readerDefaults', href: '/admin/reader-defaults', icon: SlidersHorizontal, available: true },
  { key: 'system', href: '/admin/settings', icon: Settings, available: false },
]

export function AdminSidebar() {
  const t = useTranslations('admin')
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className={cn('flex h-14 items-center border-b px-4', collapsed && 'justify-center px-0')}>
        {collapsed ? (
          <span className="text-lg font-bold text-primary">H</span>
        ) : (
          <span className="text-sm font-semibold tracking-tight">{t('brand')}</span>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          const label = t(`sidebar.${item.key}`)

          return (
            <div key={item.href}>
              {item.available ? (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? label : undefined}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </Link>
              ) : (
                <div
                  className={cn(
                    'flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm font-medium opacity-40',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? `${label} (${t('sidebar.comingSoon')})` : undefined}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <span className="flex flex-1 items-center justify-between">
                      {label}
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground/60">
                        {t('sidebar.comingSoon')}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="border-t p-2">
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? t('sidebar.backToDashboard') : undefined}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{t('sidebar.backToDashboard')}</span>}
        </Link>
      </div>

      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  )
}
