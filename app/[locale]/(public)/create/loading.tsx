import { Loader2 } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function CreateLoading() {
  const t = await getTranslations("common")

  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-gradient-to-br from-primary/5 via-background to-brand-2/5">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <p className="text-sm">{t("loading")}</p>
      </div>
    </div>
  )
}
