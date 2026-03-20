import { Loader2 } from "lucide-react"

export default function CreateLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-gradient-to-br from-primary/5 via-background to-brand-2/5">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <p className="text-sm">Loading…</p>
      </div>
    </div>
  )
}
