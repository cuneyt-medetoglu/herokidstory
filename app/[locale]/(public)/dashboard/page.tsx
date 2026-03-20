import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getUserBooks } from "@/lib/db/books"
import DashboardClient, { type DashboardBook } from "./DashboardClient"

export default async function LibraryPage({
  params,
}: {
  params: { locale: string }
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/${params.locale}/auth/login`)
  }

  const { data: rawBooks } = await getUserBooks(session.user.id, { excludeExamples: true })

  const initialBooks: DashboardBook[] = (rawBooks || []).map((book) => ({
    id: book.id,
    title: book.title,
    coverImage: book.cover_image_url || "",
    status:
      book.status === "completed"
        ? "completed"
        : book.status === "generating"
        ? "in-progress"
        : "draft",
    createdDate: new Date(book.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    illustrationStyle: book.illustration_style || undefined,
  }))

  return <DashboardClient initialBooks={initialBooks} />
}
