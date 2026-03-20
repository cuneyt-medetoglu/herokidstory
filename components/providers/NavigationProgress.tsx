"use client"

import NextTopLoader from "nextjs-toploader"

/**
 * Client navigasyonlarında üstte ince progress çubuğu (NProgress tarzı).
 */
export function NavigationProgress() {
  return (
    <NextTopLoader
      color="hsl(var(--primary))"
      height={3}
      showSpinner={false}
      shadow="0 0 10px hsl(var(--primary)),0 0 5px hsl(var(--primary))"
    />
  )
}
