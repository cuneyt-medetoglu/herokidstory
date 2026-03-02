"use client"

import { useState, useRef, useEffect } from "react"
import { X, Paintbrush, Eraser, RotateCcw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas"

interface ImageEditModalProps {
  bookId: string
  pageNumber: number
  currentImageUrl: string
  onClose: () => void
  onSuccess: (editedImageUrl: string) => void
}

export function ImageEditModal({
  bookId,
  pageNumber,
  currentImageUrl,
  onClose,
  onSuccess,
}: ImageEditModalProps) {
  const { toast } = useToast()
  const canvasRef = useRef<ReactSketchCanvasRef>(null)
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush')
  const [brushSize, setBrushSize] = useState(30)
  const [editPrompt, setEditPrompt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null)

  useEffect(() => {
    canvasRef.current?.eraseMode(tool === 'eraser')
  }, [tool])

  const handleClearCanvas = () => {
    canvasRef.current?.clearCanvas()
  }

  const handleUndo = () => {
    canvasRef.current?.undo()
  }

  const handleSubmit = async () => {
    if (!editPrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please describe what you want to fix or change",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Export mask from canvas at original image size (1024x1536)
      // First export at current size
      const maskImageBase = await canvasRef.current?.exportImage('png')
      
      if (!maskImageBase) {
        throw new Error('Failed to export mask from canvas')
      }

      // Create a new canvas with original image dimensions (1024x1536)
      const targetWidth = 1024
      const targetHeight = 1536
      
      const resizedCanvas = document.createElement('canvas')
      resizedCanvas.width = targetWidth
      resizedCanvas.height = targetHeight
      const ctx = resizedCanvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }

      // Load the mask image and draw it onto the resized canvas
      // Use window.Image to avoid conflict with next/image import
      const maskImg = new window.Image()
      maskImg.src = maskImageBase
      
      await new Promise((resolve, reject) => {
        maskImg.onload = () => {
          ctx.drawImage(maskImg, 0, 0, targetWidth, targetHeight)
          resolve(null)
        }
        maskImg.onerror = reject
      })

      // Invert mask logic for OpenAI API:
      // - Painted areas (alpha > 0) → TRANSPARENT (alpha = 0) = EDIT THIS AREA
      // - Unpainted areas (alpha = 0) → OPAQUE WHITE (alpha = 255) = KEEP THIS AREA
      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3]
        if (alpha > 0) {
          // User painted here → make TRANSPARENT = edit this area
          data[i] = 0
          data[i + 1] = 0
          data[i + 2] = 0
          data[i + 3] = 0 // TRANSPARENT!
        } else {
          // User didn't paint → make OPAQUE WHITE = preserve this area
          data[i] = 255
          data[i + 1] = 255
          data[i + 2] = 255
          data[i + 3] = 255 // OPAQUE!
        }
      }
      ctx.putImageData(imageData, 0, 0)

      // Export as PNG base64
      const maskImage = resizedCanvas.toDataURL('image/png')
      
      if (!maskImage) {
        throw new Error('Failed to export mask from canvas')
      }

      setMaskDataUrl(maskImage)

      // Call edit API
      const response = await fetch('/api/ai/edit-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId,
          pageNumber,
          maskImageBase64: maskImage,
          editPrompt: editPrompt.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Failed to edit image')
      }

      const remaining = result.data.quotaRemaining
      toast({
        title: "Success!",
        description: `Image edited successfully. ${remaining == null ? 'Unlimited' : `${remaining} edit(s)`} remaining.`,
      })

      onSuccess(result.data.editedImageUrl)
      onClose()
    } catch (error) {
      console.error('[Image Edit Modal] Error:', error)
      toast({
        title: "Edit Failed",
        description: error instanceof Error ? error.message : "Failed to edit image",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Edit Image - Page {pageNumber}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Paint the EXACT areas you want to edit (red brush), then describe the changes
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isSubmitting}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Canvas Area */}
          <div className="space-y-3">
            <Label>Paint the Areas You Want to Edit (Red = Edit Zone)</Label>
            <div className="relative border-2 border-dashed border-border rounded-lg overflow-hidden bg-muted">
              <div className="relative w-full" style={{ aspectRatio: '1024/1536', maxWidth: '100%', maxHeight: '600px', margin: '0 auto' }}>
                {/* Background Image - maintains original aspect ratio */}
                <img
                  src={currentImageUrl}
                  alt={`Page ${pageNumber} - Original`}
                  className="absolute inset-0 w-full h-full object-contain"
                />
                {/* Canvas Overlay - for drawing mask */}
                <ReactSketchCanvas
                  ref={canvasRef}
                  width="100%"
                  height="100%"
                  strokeWidth={brushSize}
                  strokeColor="rgba(255, 50, 50, 0.6)"
                  canvasColor="transparent"
                  exportWithBackgroundImage={false}
                  style={{
                    border: 'none',
                    cursor: tool === 'brush' ? 'crosshair' : 'pointer',
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tools */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 border rounded-lg p-1">
              <Button
                variant={tool === 'brush' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTool('brush')}
                disabled={isSubmitting}
              >
                <Paintbrush className="h-4 w-4 mr-1" />
                Brush
              </Button>
              <Button
                variant={tool === 'eraser' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTool('eraser')}
                disabled={isSubmitting}
              >
                <Eraser className="h-4 w-4 mr-1" />
                Eraser
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="brush-size" className="text-sm whitespace-nowrap">
                Brush Size:
              </Label>
              <input
                id="brush-size"
                type="range"
                min="10"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                disabled={isSubmitting}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">{brushSize}px</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={isSubmitting}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Undo
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCanvas}
              disabled={isSubmitting}
            >
              Clear All
            </Button>
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="edit-prompt">
              What do you want to fix or change? <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="edit-prompt"
              placeholder="Example: Separate their hands so they're not holding hands"
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be specific. AI will edit ONLY the red-painted areas and keep the rest unchanged.
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
              disabled={isSubmitting || !editPrompt.trim()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Editing...
                </>
              ) : (
                <>Edit Image</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
