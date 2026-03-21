import { cn } from "@/lib/utils"

/** Hero ↔ HowItWorks arası dalga; light modda yarı saydam currentColor yerine opak color-mix (beyaz üzerinde sabit ton — Hero gradient’i ile kompoze olmaz). */
const WAVE_PATH =
  "M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"

const PATH_FILL =
  "fill-[color-mix(in_srgb,hsl(var(--brand-2))_5%,white)] dark:fill-slate-950"

type WaveDividerProps = {
  className?: string
}

export function WaveDivider({ className }: WaveDividerProps) {
  return (
    <svg
      className={cn("w-full", className)}
      viewBox="0 0 1440 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={WAVE_PATH} className={PATH_FILL} />
    </svg>
  )
}
