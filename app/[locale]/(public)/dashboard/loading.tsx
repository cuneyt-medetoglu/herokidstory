import { Loader2 } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <p className="text-sm">Loading…</p>
      </div>
    </div>
  )
}
