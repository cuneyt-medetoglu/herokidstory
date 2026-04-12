import type { PageTimeline } from "@/lib/read-along/types"
import type { AssSubtitleEvent } from "./types"

/**
 * Converts a PageTimeline into ASS subtitle events.
 * Each chunk becomes one subtitle line, shown for its duration.
 */
export function timelineToAssEvents(timeline: PageTimeline): AssSubtitleEvent[] {
  return timeline.chunks.map((chunk) => ({
    startMs: chunk.startMs,
    endMs: chunk.endMs,
    text: chunk.displayText,
  }))
}

function msToAssTime(ms: number): string {
  const totalSeconds = ms / 1000
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${h}:${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`
}

/**
 * Generates a full ASS subtitle file.
 *
 * Style: semi-transparent rounded dark box behind white text,
 * centered at the bottom with comfortable margins.
 * Uses BorderStyle=4 (opaque box) for the modern "pill" subtitle look.
 */
export function generateAssContent(
  events: AssSubtitleEvent[],
  width: number = 720,
  height: number = 1280,
): string {
  const fontSize = Math.round(width * 0.050)
  const marginBottom = Math.round(height * 0.05)
  const marginSide = Math.round(width * 0.06)

  // PrimaryColour: white, OutlineColour: semi-transparent dark (box background)
  // BackColour: same dark tint for shadow
  // BorderStyle=4 = opaque box behind text
  const header = [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    "WrapStyle: 0",
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Default,Arial,${fontSize},&H00FFFFFF,&H000000FF,&HAA000000,&HAA000000,-1,0,0,0,100,100,1.0,0,4,3,0,2,${marginSide},${marginSide},${marginBottom},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ]

  const dialogues = events.map((ev) => {
    const start = msToAssTime(ev.startMs)
    const end = msToAssTime(ev.endMs)
    const escapedText = ev.text.replace(/\n/g, "\\N")
    return `Dialogue: 0,${start},${end},Default,,0,0,0,,{\\fad(300,300)}${escapedText}`
  })

  return [...header, ...dialogues, ""].join("\n")
}

/**
 * Generates ASS subtitle content from a PageTimeline (convenience wrapper).
 */
export function generateAssFromTimeline(
  timeline: PageTimeline,
  width?: number,
  height?: number,
): string {
  const events = timelineToAssEvents(timeline)
  return generateAssContent(events, width, height)
}
