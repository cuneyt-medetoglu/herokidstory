import { Loader2 } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function BookDetailLoading() {
  const t = await getTranslations("common")

  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <p className="text-sm">{t("loading")}</p>
      </div>
    </div>
  )
}
