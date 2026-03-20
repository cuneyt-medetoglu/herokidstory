import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-background dark:from-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-10 w-44 rounded-md" />
            <Skeleton className="h-7 w-10 rounded-full" />
          </div>

          {/* Filter bar skeleton */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-9 w-28 rounded-md" />
                <Skeleton className="h-9 w-20 rounded-md" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-28 rounded-md" />
                <Skeleton className="h-10 w-40 rounded-md" />
              </div>
            </div>

            <div className="my-4 h-px bg-border" aria-hidden />

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Skeleton className="h-10 flex-1 rounded-md" />
              <div className="flex gap-2 md:shrink-0">
                <Skeleton className="h-10 w-20 rounded-md" />
                <Skeleton className="h-10 w-44 rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Book card skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="w-full aspect-[3/4] mb-4 rounded-lg" />
                <Skeleton className="h-6 w-3/4 mb-2 rounded-md" />
                <Skeleton className="h-4 w-1/2 mb-1 rounded-md" />
                <Skeleton className="h-4 w-1/3 mb-4 rounded-md" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1 rounded-md" />
                  <Skeleton className="h-9 flex-1 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
