"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslations } from "next-intl"
import {
  User,
  Settings,
  ShoppingBag,
  Gift,
  Bell,
  CreditCard,
  Menu,
  X,
  Camera,
  Check,
  AlertTriangle,
  Download,
  Eye,
  Trash2,
  Plus,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ToastProvider } from "@/components/providers/ToastProvider"
import type { UserPreferences } from "@/lib/types/user-preferences"
import { DEFAULT_PREFERENCES } from "@/lib/types/user-preferences"

type Section = "profile" | "account" | "orders" | "free-cover" | "notifications" | "app-settings" | "book-settings" | "billing"

interface OrderItemData {
  id: string
  book_id: string
  item_type: string
  unit_price: number
  quantity: number
  total_price: number
  fulfillment_status: string
  book_title: string | null
  book_cover_url: string | null
}

interface UserOrder {
  id: string
  status: string
  payment_provider: string
  order_currency: string
  total_amount: number
  created_at: string
  paid_at: string | null
  items: OrderItemData[]
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(currency === "TRY" ? "tr-TR" : "en-US", {
      style: "currency",
      currency,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

function shortOrderId(id: string): string {
  return id.slice(0, 8).toUpperCase()
}

const ORDER_STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  paid: "default",
  pending: "secondary",
  processing: "secondary",
  failed: "destructive",
  cancelled: "outline",
  refunded: "outline",
  partially_refunded: "outline",
}

const mockPaymentMethods = [{ id: "1", last4: "1234", expiry: "12/25", brand: "Visa" }]

const mockBillingHistory = [
  {
    id: "1",
    date: "2026-01-05",
    description: "Luna's Magical Adventure - E-book",
    amount: "$19.99",
    status: "paid",
  },
  {
    id: "2",
    date: "2025-12-20",
    description: "Space Explorer Tommy - Print Book",
    amount: "$34.99",
    status: "paid",
  },
]

const VALID_SECTIONS: Section[] = [
  "profile",
  "account",
  "orders",
  "free-cover",
  "notifications",
  "app-settings",
  "book-settings",
  "billing",
]

// ─── App Settings section ──────────────────────────────────────────────────────

function AppSettingsSection() {
  const t = useTranslations("dashboard.settings")
  const { toast } = useToast()

  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/user/preferences")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.success) setPrefs(data.preferences)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      })
      const data = await res.json()
      if (data.success) {
        setPrefs(data.preferences)
        toast({ title: t("toasts.appSettingsSavedTitle"), description: t("toasts.appSettingsSavedDesc") })
      } else {
        throw new Error()
      }
    } catch {
      toast({
        title: t("toasts.appSettingsErrorTitle"),
        description: t("toasts.appSettingsErrorDesc"),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <motion.div
      key="app-settings"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>{t("appSettings.title")}</CardTitle>
          <CardDescription>{t("appSettings.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{t("appSettings.kidMode.notImplementedBadge")}</Badge>
            <span className="text-sm text-muted-foreground">{t("appSettings.kidMode.notImplementedNote")}</span>
          </div>
          <div className="flex items-start justify-between gap-4 p-4 border rounded-lg bg-muted/30">
            <div className="space-y-1 flex-1 min-w-0">
              <Label className="text-base font-semibold">{t("appSettings.kidMode.title")}</Label>
              <p className="text-sm text-muted-foreground">{t("appSettings.kidMode.description")}</p>
            </div>
            <Switch
              checked={prefs.kidMode}
              onCheckedChange={(v) => setPrefs((p) => ({ ...p, kidMode: v }))}
              className="shrink-0"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-primary to-brand-2 text-white hover:opacity-90"
        >
          {saving ? t("appSettings.saving") : t("appSettings.savePreferences")}
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Book settings (placeholder — kitap listesi / düzenleme / silme sonradan) ──

function BookSettingsPlaceholderSection() {
  const t = useTranslations("dashboard.settings")

  return (
    <motion.div
      key="book-settings"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>{t("bookSettings.title")}</CardTitle>
          <CardDescription>{t("bookSettings.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("bookSettings.placeholder")}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

function ProfilePageContent() {
  const t = useTranslations("dashboard.settings")
  const tOrders = useTranslations("orders")
  const searchParams = useSearchParams()
  const sectionParam = searchParams.get("section") as Section | null
  const initialSection: Section =
    sectionParam && VALID_SECTIONS.includes(sectionParam) ? sectionParam : "profile"

  const sidebarItems = [
    { id: "profile" as Section, label: t("nav.profile"), icon: User },
    { id: "account" as Section, label: t("nav.account"), icon: Settings },
    { id: "orders" as Section, label: t("nav.orders"), icon: ShoppingBag },
    { id: "free-cover" as Section, label: t("nav.freeCover"), icon: Gift },
    { id: "notifications" as Section, label: t("nav.notifications"), icon: Bell },
    { id: "app-settings" as Section, label: t("nav.appSettings"), icon: SlidersHorizontal },
    { id: "book-settings" as Section, label: t("nav.bookSettings"), icon: BookOpen },
    { id: "billing" as Section, label: t("nav.billing"), icon: CreditCard },
  ]

  const [activeSection, setActiveSection] = useState<Section>(initialSection)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [name, setName] = useState("John Doe")
  const [bio, setBio] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [orderUpdates, setOrderUpdates] = useState(true)
  const [newFeatures, setNewFeatures] = useState(false)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [orders, setOrders] = useState<UserOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState(false)
  const [ordersLoaded, setOrdersLoaded] = useState(false)
  const { toast } = useToast()

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true)
    setOrdersError(false)
    try {
      const res = await fetch("/api/orders")
      if (!res.ok) throw new Error("fetch failed")
      const data = await res.json()
      setOrders(data.orders ?? [])
      setOrdersLoaded(true)
    } catch {
      setOrdersError(true)
    } finally {
      setOrdersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeSection === "orders" && !ordersLoaded && !ordersLoading) {
      fetchOrders()
    }
  }, [activeSection, ordersLoaded, ordersLoading, fetchOrders])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    toast({
      title: t("toasts.profileSavedTitle"),
      description: t("toasts.profileSavedDesc"),
    })
  }

  const handleSaveNotifications = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    toast({
      title: t("toasts.notificationsSavedTitle"),
      description: t("toasts.notificationsSavedDesc"),
    })
  }

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{t("profile.title")}</CardTitle>
                <CardDescription>{t("profile.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="size-[120px] rounded-full bg-gradient-to-br from-primary to-brand-2 flex items-center justify-center text-white text-4xl font-semibold">
                      {name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <button className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="size-6 text-white" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{name}</h3>
                    <p className="text-muted-foreground text-sm">john@example.com</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("profile.nameLabel")}</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("profile.namePlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t("profile.emailLabel")}</Label>
                    <div className="flex gap-2 items-center">
                      <Input id="email" value="john@example.com" disabled className="flex-1" />
                      <Badge variant="secondary" className="shrink-0">
                        <Check className="size-3 mr-1" />
                        {t("profile.verified")}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">{t("profile.bioLabel")}</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => {
                        if (e.target.value.length <= 200) {
                          setBio(e.target.value)
                        }
                      }}
                      placeholder={t("profile.bioPlaceholder")}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground text-right">{t("profile.bioCharCount", { count: bio.length })}</p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button variant="ghost" onClick={() => setBio("")}>
                    {t("profile.cancel")}
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-primary to-brand-2 text-white hover:opacity-90"
                  >
                    {isSaving ? t("profile.saving") : t("profile.saveChanges")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )

      case "account":
        return (
          <motion.div
            key="account"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>{t("account.title")}</CardTitle>
                <CardDescription>{t("account.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="account-email">{t("account.emailLabel")}</Label>
                    <div className="flex gap-2 items-center">
                      <Input id="account-email" value="john@example.com" disabled className="flex-1" />
                      <Badge variant="secondary" className="shrink-0">
                        <Check className="size-3 mr-1" />
                        {t("profile.verified")}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">{t("account.passwordLabel")}</Label>
                    <div className="flex gap-2 items-center">
                      <Input id="password" type="password" value="••••••••" disabled className="flex-1" />
                      <Button variant="outline" className="shrink-0 bg-transparent">
                        {t("account.changePassword")}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-4">{t("account.connectedAccounts")}</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-red-500 flex items-center justify-center text-white font-semibold">
                          G
                        </div>
                        <div>
                          <p className="font-medium">Google</p>
                          <p className="text-sm text-muted-foreground">{t("account.connected")}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{t("account.connected")}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                          f
                        </div>
                        <div>
                          <p className="font-medium">Facebook</p>
                          <p className="text-sm text-muted-foreground">{t("account.notConnected")}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        {t("account.connect")}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">{t("account.dangerZone")}</CardTitle>
                <CardDescription>{t("account.dangerSubtitle")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} className="w-full sm:w-auto">
                  <Trash2 className="size-4 mr-2" />
                  {t("account.deleteAccount")}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )

      case "orders":
        return (
          <motion.div
            key="orders"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{t("orders.title")}</CardTitle>
                <CardDescription>{t("orders.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">{t("orders.loading")}</p>
                  </div>
                ) : ordersError ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <AlertTriangle className="size-10 text-destructive" />
                    <p className="text-muted-foreground">{t("orders.error")}</p>
                    <Button variant="outline" size="sm" onClick={fetchOrders}>
                      <RefreshCw className="size-4 mr-2" />
                      {t("orders.view")}
                    </Button>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="size-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{t("orders.empty")}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("orders.orderId")}</TableHead>
                        <TableHead>{t("orders.bookTitle")}</TableHead>
                        <TableHead>{t("orders.date")}</TableHead>
                        <TableHead>{t("orders.type")}</TableHead>
                        <TableHead>{t("orders.amount")}</TableHead>
                        <TableHead>{t("orders.status")}</TableHead>
                        <TableHead>{t("orders.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => {
                        const bookNames = order.items
                          .map((i) => i.book_title || t("orders.unknownBook"))
                          .join(", ")
                        const itemTypes = [
                          ...new Set(order.items.map((i) => i.item_type)),
                        ]
                          .map((it) => tOrders(`itemType.${it}`))
                          .join(", ")
                        const hasEbook = order.items.some(
                          (i) => i.item_type === "ebook" || i.item_type === "bundle"
                        )

                        return (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-sm">
                              {shortOrderId(order.id)}
                            </TableCell>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {bookNames}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {new Date(order.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{itemTypes}</TableCell>
                            <TableCell className="font-medium whitespace-nowrap">
                              {formatCurrency(order.total_amount, order.order_currency)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={ORDER_STATUS_VARIANT[order.status] ?? "outline"}>
                                {tOrders(`status.${order.status}`)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {hasEbook && order.status === "paid" && (
                                  <Button variant="outline" size="sm">
                                    <Download className="size-4 mr-1" />
                                    {t("orders.download")}
                                  </Button>
                                )}
                                <Link href={`/orders/${order.id}`}>
                                  <Button variant="outline" size="sm">
                                    <Eye className="size-4 mr-1" />
                                    {t("orders.view")}
                                  </Button>
                                </Link>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )

      case "free-cover":
        return (
          <motion.div
            key="free-cover"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{t("freeCover.title")}</CardTitle>
                <CardDescription>{t("freeCover.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center size-24 rounded-full bg-gradient-to-br from-primary to-brand-2 mb-4">
                    <Gift className="size-12 text-white" />
                  </div>
                  <Badge variant="secondary" className="mb-4">
                    {t("freeCover.used")}
                  </Badge>
                  <h3 className="text-xl font-semibold mb-2">{t("freeCover.usedTitle")}</h3>
                  <p className="text-muted-foreground mb-4">{t("freeCover.usedOn")} Jan 5, 2026</p>
                </div>

                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-base">{t("freeCover.howItWorksTitle")}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>• {t("freeCover.item1")}</p>
                    <p>• {t("freeCover.item2")}</p>
                    <p>• {t("freeCover.item3")}</p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </motion.div>
        )

      case "notifications":
        return (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{t("notifications.title")}</CardTitle>
                <CardDescription>{t("notifications.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <Label htmlFor="email-notifications" className="text-base">
                        {t("notifications.emailLabel")}
                      </Label>
                      <p className="text-sm text-muted-foreground">{t("notifications.emailDesc")}</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <Label htmlFor="order-updates" className="text-base">
                        {t("notifications.orderUpdatesLabel")}
                      </Label>
                      <p className="text-sm text-muted-foreground">{t("notifications.orderUpdatesDesc")}</p>
                    </div>
                    <Switch id="order-updates" checked={orderUpdates} onCheckedChange={setOrderUpdates} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <Label htmlFor="new-features" className="text-base">
                        {t("notifications.newFeaturesLabel")}
                      </Label>
                      <p className="text-sm text-muted-foreground">{t("notifications.newFeaturesDesc")}</p>
                    </div>
                    <Switch id="new-features" checked={newFeatures} onCheckedChange={setNewFeatures} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <Label htmlFor="marketing-emails" className="text-base">
                        {t("notifications.marketingLabel")}
                      </Label>
                      <p className="text-sm text-muted-foreground">{t("notifications.marketingDesc")}</p>
                    </div>
                    <Switch id="marketing-emails" checked={marketingEmails} onCheckedChange={setMarketingEmails} />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={handleSaveNotifications}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-primary to-brand-2 text-white hover:opacity-90"
                  >
                    {isSaving ? t("notifications.saving") : t("notifications.savePreferences")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )

      case "app-settings":
        return <AppSettingsSection />

      case "book-settings":
        return <BookSettingsPlaceholderSection />

      case "billing":
        return (
          <motion.div
            key="billing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>{t("billing.paymentTitle")}</CardTitle>
                <CardDescription>{t("billing.paymentSubtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockPaymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-lg bg-gradient-to-br from-primary to-brand-2 flex items-center justify-center">
                        <CreditCard className="size-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {method.brand} {t("billing.endingIn")} {method.last4}
                        </p>
                        <p className="text-sm text-muted-foreground">{t("billing.expires")} {method.expiry}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full bg-transparent">
                  <Plus className="size-4 mr-2" />
                  {t("billing.addPaymentMethod")}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("billing.historyTitle")}</CardTitle>
                <CardDescription>{t("billing.historySubtitle")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("billing.date")}</TableHead>
                      <TableHead>{t("billing.description")}</TableHead>
                      <TableHead>{t("billing.amount")}</TableHead>
                      <TableHead>{t("billing.status")}</TableHead>
                      <TableHead>{t("billing.invoice")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockBillingHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="font-medium">{item.amount}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Download className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        )
    }
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-background to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-brand-2 bg-clip-text text-transparent">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Mobile Menu Toggle */}
          <div className="lg:hidden">
            <Button variant="outline" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="w-full">
              {mobileMenuOpen ? <X className="size-4 mr-2" /> : <Menu className="size-4 mr-2" />}
              {mobileMenuOpen ? t("closeMenu") : t("openMenu")}
            </Button>
          </div>

          {/* Sidebar */}
          <aside
            className={`
              ${mobileMenuOpen ? "block" : "hidden"} lg:block
              lg:w-64 shrink-0
            `}
          >
            <Card>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveSection(item.id)
                          setMobileMenuOpen(false)
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                          ${
                            activeSection === item.id
                              ? "bg-gradient-to-r from-primary to-brand-2 text-white"
                              : "hover:bg-muted"
                          }
                        `}
                      >
                        <Icon className="size-5 shrink-0" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              {t("deleteDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {t("deleteDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t("deleteDialog.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteDialogOpen(false)
                toast({
                  title: t("toasts.accountDeletedTitle"),
                  description: t("toasts.accountDeletedDesc"),
                  variant: "destructive",
                })
              }}
            >
              {t("deleteDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ToastProvider>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <ProfilePageContent />
    </Suspense>
  )
}
