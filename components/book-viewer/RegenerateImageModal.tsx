"use client"

import { useState } from "react"
import { X, RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface RegenerateImageModalProps {
  bookId: string
  pageNumber: number
  pageText: string
  onClose: () => void
  onSuccess: (newImageUrl: string) => void
}

export function RegenerateImageModal({
  bookId,
  pageNumber,
  pageText,
  onClose,
  onSuccess,
}: RegenerateImageModalProps) {
  const { toast } = useToast()
  const [userPrompt, setUserPrompt] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

      const response = await fetch("/api/ai/regenerate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId,
          pageNumber,
          userPrompt: userPrompt.trim() || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || result.error || "Regenerate failed")
      }

      if (!result.success || !result.data?.editedImageUrl) {
        throw new Error(result.message || "Invalid response")
      }

      const remaining = result.data.quotaRemaining
      toast({
        title: "Success!",
        description: `Page image regenerated. ${remaining == null ? 'Unlimited' : `${remaining} change(s)`} remaining.`,
      })

      onSuccess(result.data.editedImageUrl)
      onClose()
    } catch (error) {
      console.error("[RegenerateImageModal] Error:", error)
      toast({
        title: "Regenerate Failed",
        description: error instanceof Error ? error.message : "Failed to regenerate image",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Regenerate Image - Page {pageNumber}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Create a new image for this page. Story text stays the same; the scene can change.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isSubmitting}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Page text (read-only) */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Story text for this page</Label>
            <div className="rounded-md border border-border bg-muted/50 p-3 text-sm text-foreground max-h-24 overflow-y-auto">
              {pageText || "—"}
            </div>
          </div>

          {/* Optional user prompt */}
          <div className="space-y-2">
            <Label htmlFor="regenerate-prompt">
              How should the new scene look? <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="regenerate-prompt"
              placeholder="e.g. Same characters but in a sunny park instead of the forest"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to regenerate with the same story text. Characters and style will stay consistent.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 justify-end pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate Image
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
