"use client"

/**
 * StepRunnerPanel — Admin-only debug panel for Step 6.
 * Allows running each book-generation step in isolation and viewing
 * the exact AI request/response for each step.
 */

import { useState, useCallback, useMemo } from "react"
import { ALLOWED_STORY_MODELS, DEFAULT_STORY_MODEL } from "@/lib/ai/openai-models"
import {
  DEFAULT_PAGE_COUNT,
  PAGE_COUNT_MIN,
  PAGE_COUNT_MAX,
  PAGE_COUNT_DEBUG_FALLBACK,
} from "@/lib/constants/book-config"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  Image as ImageIcon,
  FileText,
  User,
  Layers,
  Mic,
  Copy,
  Check,
  Download,
} from "lucide-react"
import {
  inferReadingAgeBracketFromNumericAge,
  parseReadingAgeBracket,
  type ReadingAgeBracketId,
} from "@/lib/config/reading-age-brackets"

// ============================================================================
// Types
// ============================================================================

type OperationType = "story_generation" | "image_master" | "image_entity" | "image_cover" | "image_page" | "tts"
type StepStatus = "idle" | "running" | "done" | "error"

interface StepState {
  status: StepStatus
  aiLog?: any[]
  error?: string
  durationMs?: number
  resultPreview?: string
}

interface SessionState {
  sessionBookId?: string
  storyData?: any
  masterIllustrations?: Record<string, string>
  entityMasterIllustrations?: Record<string, string>
  coverUrl?: string
  pageImages?: Record<number, string>
  audioUrls?: Record<number, string>
}

interface StepRunnerPanelProps {
  wizardData: any
  characterIds: string[]
}

// ============================================================================
// Step definitions
// ============================================================================

const STEPS: { id: OperationType; label: string; icon: React.ReactNode; prereqs: OperationType[] }[] = [
  { id: "story_generation", label: "Story Generation", icon: <FileText className="h-4 w-4" />, prereqs: [] },
  { id: "image_master", label: "Master Illustrations", icon: <User className="h-4 w-4" />, prereqs: ["story_generation"] },
  { id: "image_entity", label: "Entity Masters", icon: <Layers className="h-4 w-4" />, prereqs: ["story_generation"] },
  { id: "image_cover", label: "Cover Image", icon: <ImageIcon className="h-4 w-4" />, prereqs: ["story_generation", "image_master"] },
  { id: "image_page", label: "Page Images", icon: <ImageIcon className="h-4 w-4" />, prereqs: ["story_generation", "image_master", "image_cover"] },
  { id: "tts", label: "Text-to-Speech", icon: <Mic className="h-4 w-4" />, prereqs: ["story_generation"] },
]

/** Step-runner aiLog entry: OpenAI Images `usage` on `response.body` (edits/generations). */
function extractOpenAiImageUsage(entry: { response?: unknown }): unknown {
  const r = entry?.response as Record<string, unknown> | undefined
  if (!r || typeof r !== "object") return undefined
  const body = r.body as Record<string, unknown> | undefined
  const u = body?.usage
  return u !== undefined && u !== null ? u : undefined
}

// ============================================================================
// Helpers — wizard localStorage shape: step3.language / step3.theme (objects with .id)
// ============================================================================

function getWizardLanguageCode(w: Record<string, unknown> | null | undefined): string {
  const s3 = w?.step3 as Record<string, unknown> | undefined
  const lang = s3?.language ?? w?.language
  if (lang && typeof lang === "object" && lang !== null && "id" in lang) {
    return String((lang as { id: string }).id)
  }
  if (typeof lang === "string") return lang
  return "en"
}

function getWizardThemeKey(w: Record<string, unknown> | null | undefined): string {
  const s3 = w?.step3 as Record<string, unknown> | undefined
  const theme = s3?.theme ?? w?.theme
  if (theme && typeof theme === "object" && theme !== null && "id" in theme) {
    return String((theme as { id: string }).id)
  }
  if (typeof theme === "string") return theme
  return "adventure"
}

function getWizardIllustrationStyleId(w: Record<string, unknown> | null | undefined): string {
  const s4 = w?.step4 as Record<string, unknown> | undefined
  const style = s4?.illustrationStyle ?? w?.illustrationStyle
  if (style && typeof style === "object" && style !== null && "id" in style) {
    return String((style as { id: string }).id)
  }
  if (typeof style === "string") return style
  return "cartoon"
}

/** Hikâye fikri metni — Step 5 `step5.customRequests`; kök `customRequests` yedek (eski taslaklar). */
function getWizardCustomRequests(w: Record<string, unknown> | null | undefined): string | undefined {
  const s5 = w?.step5 as Record<string, unknown> | undefined
  const fromStep5 =
    (typeof s5?.customRequests === "string" ? s5.customRequests.trim() : "") ||
    (typeof s5?.customRequest === "string" ? s5.customRequest.trim() : "")
  if (fromStep5) return fromStep5
  const root = typeof w?.customRequests === "string" ? w.customRequests.trim() : ""
  return root || undefined
}

/** Step 5 sayfa sayısı — yoksa veya geçersizse DEFAULT_PAGE_COUNT. */
function getWizardPageCount(w: Record<string, unknown> | null | undefined): number {
  const s5 = w?.step5 as Record<string, unknown> | undefined
  const raw = s5?.pageCount
  const n = typeof raw === "number" && Number.isFinite(raw) ? raw : parseInt(String(raw ?? ""), 10)
  if (Number.isFinite(n) && n >= PAGE_COUNT_MIN && n <= PAGE_COUNT_MAX) return Math.floor(n)
  return DEFAULT_PAGE_COUNT
}

function getWizardReadingBracket(w: Record<string, unknown> | null | undefined): ReadingAgeBracketId | undefined {
  const s1 = w?.step1 as Record<string, unknown> | undefined
  const fromField = parseReadingAgeBracket(s1?.readingAgeBracket)
  if (fromField) return fromField
  const age = s1?.age
  if (typeof age === "number" && !Number.isNaN(age)) {
    return inferReadingAgeBracketFromNumericAge(age)
  }
  return undefined
}

function JsonViewer({ data, label }: { data: any; label: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const jsonText = useMemo(() => {
    try {
      return JSON.stringify(data ?? null, null, 2)
    } catch {
      return String(data)
    }
  }, [data])

  const copyJson = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      try {
        await navigator.clipboard.writeText(jsonText)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1600)
      } catch {
        /* clipboard API yok / izin yok */
      }
    },
    [jsonText]
  )

  return (
    <div className="border border-zinc-700 rounded text-xs">
      <div className="flex items-stretch min-h-[2rem]">
        <button
          type="button"
          className="flex-1 flex items-center gap-1 px-3 py-1.5 text-left text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-colors rounded-tl"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
          <span className="font-mono text-zinc-400 uppercase tracking-wide text-[10px]">{label}</span>
        </button>
        <button
          type="button"
          onClick={copyJson}
          className="shrink-0 px-2.5 border-l border-zinc-700/80 text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800/40 transition-colors rounded-tr"
          title="JSON’u panoya kopyala"
          aria-label={`${label} JSON kopyala`}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      {open && (
        <pre className="px-3 py-2 overflow-x-auto text-green-300 bg-zinc-900 rounded-b max-h-72 overflow-y-auto whitespace-pre-wrap break-words border-t border-zinc-800">
          {jsonText}
        </pre>
      )}
    </div>
  )
}

const STEP_RUNNER_EXPORT_VERSION = 1 as const

/** Tek dosyada: meta + tamamlanan adımlar (aiLog ayrı bölümler) + oturum özeti — manuel kopyaya gerek kalmaz. */
function buildStepRunnerExportPayload(args: {
  stepStates: Record<OperationType, StepState>
  session: SessionState
  wizardData: Record<string, unknown> | null | undefined
  pageCount: number
  storyModel: string
  targetPageNumber: number | null
}): {
  meta: Record<string, unknown>
  stepsCompleted: Record<string, unknown>
  sessionSnapshot: Record<string, unknown>
} | null {
  const { stepStates, session, wizardData, pageCount, storyModel, targetPageNumber } = args

  const completed = STEPS.filter((s) => stepStates[s.id]?.status === "done")
  const hasAnythingToExport =
    completed.length > 0 || Boolean(session.sessionBookId || session.storyData)
  if (!hasAnythingToExport) {
    return null
  }

  const stepsCompleted: Record<string, unknown> = {}
  const stepOrder: string[] = []
  for (const s of completed) {
    const st = stepStates[s.id]
    stepOrder.push(s.id)
    stepsCompleted[s.id] = {
      label: s.label,
      operationType: s.id,
      status: st.status,
      durationMs: st.durationMs ?? null,
      resultPreview: st.resultPreview ?? null,
      /** Her öğe: { step, request, response } — UI’daki sıra ile aynı */
      aiLog: Array.isArray(st.aiLog) ? st.aiLog : [],
    }
  }

  return {
    meta: {
      exportVersion: STEP_RUNNER_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      purpose:
        "Step Runner debug bundle: completed steps only (per-step aiLog). Share with AI or archive. URLs only in sessionSnapshot — no image binaries.",
      sessionBookId: session.sessionBookId ?? null,
      wizardContext: {
        themeKey: getWizardThemeKey(wizardData),
        illustrationStyle: getWizardIllustrationStyleId(wizardData),
        language: getWizardLanguageCode(wizardData),
        readingAgeBracket: getWizardReadingBracket(wizardData) ?? null,
        customRequests: getWizardCustomRequests(wizardData) ?? null,
        pageCount,
        storyModel,
        targetPageNumber,
      },
      stepsExported: stepOrder,
      readme:
        "stepsCompleted.<operationType>.aiLog[i] matches UI log order. Each entry.step is the pipeline sub-step name.",
    },
    stepsCompleted,
    sessionSnapshot: {
      sessionBookId: session.sessionBookId ?? null,
      storyTitle: session.storyData?.title ?? null,
      storyData: session.storyData ?? null,
      masterIllustrations: session.masterIllustrations ?? {},
      entityMasterIllustrations: session.entityMasterIllustrations ?? {},
      coverUrl: session.coverUrl ?? null,
      pageImages: session.pageImages ?? {},
      audioUrls: session.audioUrls ?? {},
    },
  }
}

function downloadJsonFile(filename: string, data: unknown) {
  const text = JSON.stringify(data, null, 2)
  const blob = new Blob([text], { type: "application/json;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function ImageGrid({ urls, label }: { urls: string[]; label: string }) {
  if (!urls.length) return null
  return (
    <div className="mt-2">
      <p className="text-[10px] text-zinc-400 mb-1 uppercase tracking-wide">{label}</p>
      <div className="flex flex-wrap gap-2">
        {urls.map((url, i) => (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`${label} ${i + 1}`} className="h-20 w-14 object-cover rounded border border-zinc-600 hover:border-zinc-400 transition-colors" />
          </a>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Component
// ============================================================================

export function StepRunnerPanel({ wizardData, characterIds }: StepRunnerPanelProps) {
  const [session, setSession] = useState<SessionState>({})
  const [stepStates, setStepStates] = useState<Record<OperationType, StepState>>(
    Object.fromEntries(STEPS.map((s) => [s.id, { status: "idle" }])) as Record<OperationType, StepState>
  )
  const [storyModel, setStoryModel] = useState(DEFAULT_STORY_MODEL)
  const [pageCount, setPageCount] = useState(() => getWizardPageCount(wizardData as Record<string, unknown>))
  const [targetPageNumber, setTargetPageNumber] = useState<number | null>(null)
  const [expandedLogStep, setExpandedLogStep] = useState<OperationType | null>(null)

  const updateStep = useCallback((id: OperationType, patch: Partial<StepState>) => {
    setStepStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }, [])

  const canRun = useCallback(
    (step: typeof STEPS[0]) => {
      if (stepStates[step.id].status === "running") return false
      for (const req of step.prereqs) {
        if (stepStates[req].status !== "done") return false
      }
      return true
    },
    [stepStates]
  )

  const resetSession = useCallback(() => {
    setSession({})
    setStepStates(Object.fromEntries(STEPS.map((s) => [s.id, { status: "idle" }])) as Record<OperationType, StepState>)
    setExpandedLogStep(null)
  }, [])

  const runStep = useCallback(
    async (operationType: OperationType) => {
      updateStep(operationType, { status: "running", error: undefined })

      const body: any = {
        operationType,
        characterIds,
        themeKey: getWizardThemeKey(wizardData),
        illustrationStyle: getWizardIllustrationStyleId(wizardData),
        language: getWizardLanguageCode(wizardData),
        readingAgeBracket: getWizardReadingBracket(wizardData as Record<string, unknown>),
        customRequests: getWizardCustomRequests(wizardData as Record<string, unknown>),
        pageCount,
        storyModel,
        sessionBookId: session.sessionBookId,
        state: {
          storyData: session.storyData,
          masterIllustrations: session.masterIllustrations,
          entityMasterIllustrations: session.entityMasterIllustrations,
          coverUrl: session.coverUrl,
          pageImages: session.pageImages,
        },
      }

      if (operationType === "image_page" && targetPageNumber != null) {
        body.targetPageNumber = targetPageNumber
      }

      try {
        const res = await fetch("/api/admin/debug/step-runner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })

        const data = await res.json()

        if (!res.ok || !data.success) {
          updateStep(operationType, {
            status: "error",
            error: data.error || `HTTP ${res.status}`,
            durationMs: data.durationMs,
          })
          return
        }

        // Merge statePatch into session
        setSession((prev) => ({
          ...prev,
          sessionBookId: data.sessionBookId || prev.sessionBookId,
          ...(data.statePatch || {}),
          // merge nested maps
          masterIllustrations: { ...(prev.masterIllustrations || {}), ...(data.statePatch?.masterIllustrations || {}) },
          entityMasterIllustrations: { ...(prev.entityMasterIllustrations || {}), ...(data.statePatch?.entityMasterIllustrations || {}) },
          pageImages: { ...(prev.pageImages || {}), ...(data.statePatch?.pageImages || {}) },
          audioUrls: { ...(prev.audioUrls || {}), ...(data.statePatch?.audioUrls || {}) },
        }))

        // Result preview
        let resultPreview = ""
        if (operationType === "story_generation" && data.statePatch?.storyData) {
          const sd = data.statePatch.storyData
          resultPreview = `"${sd.title}" — ${sd.pages?.length} pages`
        } else if (operationType === "image_master") {
          const count = Object.keys(data.statePatch?.masterIllustrations || {}).length
          resultPreview = `${count} master(s) generated`
        } else if (operationType === "image_entity") {
          const count = Object.keys(data.statePatch?.entityMasterIllustrations || {}).length
          resultPreview = count ? `${count} entity master(s) generated` : "No entities in story"
        } else if (operationType === "image_cover") {
          resultPreview = data.statePatch?.coverUrl ? "Cover generated" : "No cover URL"
        } else if (operationType === "image_page") {
          const count = Object.keys(data.statePatch?.pageImages || {}).length
          resultPreview = `${count} page image(s) generated`
        } else if (operationType === "tts") {
          const s = data.summary || {}
          resultPreview = `${s.success || 0}/${s.total || 0} pages done`
        }

        updateStep(operationType, {
          status: "done",
          aiLog: data.aiLog || [],
          durationMs: data.durationMs,
          resultPreview,
        })
        setExpandedLogStep(operationType)
      } catch (err: any) {
        updateStep(operationType, { status: "error", error: err?.message || "Network error" })
      }
    },
    [characterIds, wizardData, pageCount, storyModel, session, targetPageNumber, updateStep]
  )

  const masterUrls = Object.values(session.masterIllustrations || {})
  const entityUrls = Object.values(session.entityMasterIllustrations || {})
  const pageUrls = Object.values(session.pageImages || {})

  const exportPayload = useMemo(
    () =>
      buildStepRunnerExportPayload({
        stepStates,
        session,
        wizardData: wizardData as Record<string, unknown>,
        pageCount,
        storyModel,
        targetPageNumber,
      }),
    [stepStates, session, wizardData, pageCount, storyModel, targetPageNumber]
  )

  const downloadDebugBundle = useCallback(() => {
    if (!exportPayload) return
    const shortId = (session.sessionBookId || "no-book").replace(/-/g, "").slice(0, 8)
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    downloadJsonFile(`step-runner-export_${shortId}_${stamp}.json`, exportPayload)
  }, [exportPayload, session.sessionBookId])

  return (
    <div className="rounded-lg border border-purple-500/40 bg-purple-950/20 dark:bg-purple-900/10 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-purple-300">Debug Step-Runner</p>
          <p className="text-[11px] text-purple-400/70">Admin only — runs real pipeline steps in isolation</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={!exportPayload}
            onClick={downloadDebugBundle}
            title="Tamamlanan adımların aiLog + oturum özeti tek JSON — AI veya arşiv için"
            className="text-purple-200 border-purple-500/50 hover:bg-purple-900/40 gap-1 disabled:opacity-40"
          >
            <Download className="h-3 w-3" />
            İndir (JSON)
          </Button>
          <Button variant="ghost" size="sm" onClick={resetSession} className="text-purple-400 hover:text-purple-200 gap-1">
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>
      </div>

      {/* Session info */}
      {session.sessionBookId && (
        <div className="text-[11px] text-zinc-400 bg-zinc-900/50 rounded px-2 py-1 font-mono">
          Session book: <span className="text-zinc-200">{session.sessionBookId}</span>
          {session.storyData?.title && (
            <> · <span className="text-emerald-400">"{session.storyData.title}"</span></>
          )}
        </div>
      )}

      {/* Settings */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] text-purple-300/70 mb-1">Story model</label>
          <select
            value={storyModel}
            onChange={(e) => setStoryModel(e.target.value as typeof ALLOWED_STORY_MODELS[number])}
            className="w-full text-xs rounded border border-purple-500/30 bg-zinc-900 text-zinc-200 px-2 py-1 focus:outline-none focus:border-purple-400"
          >
            {ALLOWED_STORY_MODELS.map((m) => (
              <option key={m} value={m}>
                {m}{m === DEFAULT_STORY_MODEL ? " (default)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-purple-300/70 mb-1">Page count</label>
          <input
            type="number"
            value={pageCount}
            onChange={(e) => setPageCount(Math.max(1, parseInt(e.target.value) || PAGE_COUNT_DEBUG_FALLBACK))}
            min={1}
            max={PAGE_COUNT_MAX}
            className="w-full text-xs rounded border border-purple-500/30 bg-zinc-900 text-zinc-200 px-2 py-1 focus:outline-none focus:border-purple-400"
          />
        </div>
      </div>

      {/* Target page (for image_page) */}
      <div className="text-[11px] text-purple-300/70">
        <label className="block mb-1">Target page (for image_page — blank = all pages)</label>
        <input
          type="number"
          value={targetPageNumber ?? ""}
          onChange={(e) => setTargetPageNumber(e.target.value === "" ? null : parseInt(e.target.value))}
          min={1}
          placeholder="All pages"
          className="w-28 text-xs rounded border border-purple-500/30 bg-zinc-900 text-zinc-200 px-2 py-1 focus:outline-none focus:border-purple-400"
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {STEPS.map((step) => {
          const state = stepStates[step.id]
          const able = canRun(step)
          const isExpanded = expandedLogStep === step.id

          return (
            <div
              key={step.id}
              className={`rounded border transition-colors ${
                state.status === "done"
                  ? "border-emerald-500/40 bg-emerald-950/20"
                  : state.status === "error"
                  ? "border-red-500/40 bg-red-950/20"
                  : state.status === "running"
                  ? "border-blue-500/40 bg-blue-950/20"
                  : "border-zinc-700 bg-zinc-900/30"
              }`}
            >
              {/* Step header row */}
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="text-zinc-400">{step.icon}</span>
                <span className="text-sm text-zinc-200 flex-1 font-medium">{step.label}</span>
                <span className="text-[10px] font-mono text-zinc-500">{step.id}</span>

                {/* Status badge */}
                {state.status === "done" && <Badge className="bg-emerald-700/60 text-emerald-200 text-[10px] py-0 px-1.5 h-4">✓ done</Badge>}
                {state.status === "error" && <Badge className="bg-red-700/60 text-red-200 text-[10px] py-0 px-1.5 h-4">✗ error</Badge>}
                {state.status === "running" && <Badge className="bg-blue-700/60 text-blue-200 text-[10px] py-0 px-1.5 h-4">running…</Badge>}
                {state.durationMs != null && state.status === "done" && (
                  <span className="text-[10px] text-zinc-500">{(state.durationMs / 1000).toFixed(1)}s</span>
                )}

                {/* Run button */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!able}
                  onClick={() => runStep(step.id)}
                  className="h-6 px-2 text-xs border-purple-500/50 text-purple-300 hover:bg-purple-900/40 disabled:opacity-30"
                >
                  {state.status === "running" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : state.status === "done" ? (
                    <><RotateCcw className="h-3 w-3 mr-1" />Re-run</>
                  ) : (
                    <><Play className="h-3 w-3 mr-1" />Run</>
                  )}
                </Button>

                {/* Toggle log */}
                {state.aiLog?.length ? (
                  <button
                    onClick={() => setExpandedLogStep(isExpanded ? null : step.id)}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </button>
                ) : null}
              </div>

              {/* Result preview */}
              {state.resultPreview && (
                <p className="px-3 pb-1 text-[11px] text-emerald-400">{state.resultPreview}</p>
              )}
              {state.error && (
                <p className="px-3 pb-1 text-[11px] text-red-400 flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> {state.error}
                </p>
              )}

              {/* Prerequisites hint */}
              {!able && state.status === "idle" && step.prereqs.length > 0 && (
                <p className="px-3 pb-1 text-[10px] text-zinc-500">
                  Requires: {step.prereqs.join(" → ")}
                </p>
              )}

              {/* Expanded AI log */}
              {isExpanded && state.aiLog?.length ? (
                <div className="px-3 pb-3 space-y-2">
                  {/* Images for visual steps */}
                  {step.id === "image_master" && masterUrls.length > 0 && (
                    <ImageGrid urls={masterUrls} label="Master Illustrations" />
                  )}
                  {step.id === "image_entity" && entityUrls.length > 0 && (
                    <ImageGrid urls={entityUrls} label="Entity Masters" />
                  )}
                  {step.id === "image_cover" && session.coverUrl && (
                    <ImageGrid urls={[session.coverUrl]} label="Cover Image" />
                  )}
                  {step.id === "image_page" && pageUrls.length > 0 && (
                    <ImageGrid urls={pageUrls} label="Page Images" />
                  )}

                  {/* Per-log-entry JSON */}
                  {state.aiLog.map((entry: any, i: number) => {
                    const openAiUsage = extractOpenAiImageUsage(entry)
                    return (
                      <div key={i} className="space-y-1">
                        <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wide">
                          [{i + 1}] {entry.step}
                        </p>
                        {openAiUsage !== undefined && (
                          <p className="text-[11px] text-emerald-500/90 font-mono break-all" title="M3: usage from OpenAI Images response">
                            OpenAI usage: {JSON.stringify(openAiUsage)}
                          </p>
                        )}
                        <JsonViewer data={entry.request} label="request" />
                        <JsonViewer data={entry.response} label="response" />
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Story preview (after story_generation) */}
      {session.storyData?.pages?.length > 0 && (
        <div className="rounded border border-zinc-700 bg-zinc-900/50 p-2">
          <p className="text-[11px] text-zinc-400 font-mono uppercase tracking-wide mb-2">Story Preview</p>
          <p className="text-xs text-zinc-200 font-semibold mb-1">{session.storyData.title}</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {session.storyData.pages.map((p: any) => (
              <div key={p.pageNumber} className="text-[11px] text-zinc-400">
                <span className="text-zinc-500 font-mono">p{p.pageNumber}:</span> {(p.text || "").slice(0, 100)}
                {(p.text || "").length > 100 ? "…" : ""}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step state JSON (full session) */}
      <JsonViewer data={session} label="Full session state" />
    </div>
  )
}
