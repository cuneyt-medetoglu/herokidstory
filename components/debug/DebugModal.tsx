"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check } from "lucide-react"
import JsonView from '@uiw/react-json-view'

interface DebugModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  request: any
  response: any
  status: "success" | "error"
  imageUrl?: string // Optional: for cover/page image preview
}

export function DebugModal({
  open,
  onOpenChange,
  title,
  request,
  response,
  status,
  imageUrl,
}: DebugModalProps) {
  const [copiedRequest, setCopiedRequest] = useState(false)
  const [copiedResponse, setCopiedResponse] = useState(false)

  const copyToClipboard = async (data: any, type: "request" | "response") => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      if (type === "request") {
        setCopiedRequest(true)
        setTimeout(() => setCopiedRequest(false), 2000)
      } else {
        setCopiedResponse(true)
        setTimeout(() => setCopiedResponse(false), 2000)
      }
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title}
            <span
              className={`text-sm px-2 py-0.5 rounded ${
                status === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {status === "success" ? "Başarılı" : "Hata"}
            </span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="request" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="request">Request</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
          </TabsList>

          <TabsContent value="request" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(request, "request")}
                >
                  {copiedRequest ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Kopyalandı
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Request'i Kopyala
                    </>
                  )}
                </Button>
              </div>
              <div className="border rounded-lg p-4 bg-slate-50">
                <JsonView
                  value={request}
                  collapsed={1}
                  displayDataTypes={false}
                  style={{
                    backgroundColor: 'transparent',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="response" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(response, "response")}
                >
                  {copiedResponse ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Kopyalandı
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Response'u Kopyala
                    </>
                  )}
                </Button>
              </div>

              {imageUrl && (
                <div className="border rounded-lg p-4 bg-white">
                  <h3 className="text-sm font-semibold mb-2">Görsel Önizleme</h3>
                  <div className="relative w-48 h-64 bg-slate-100 rounded overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt="Preview"
                      fill
                      sizes="192px"
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                  >
                    Tam boyutta aç →
                  </a>
                </div>
              )}

              <div className="border rounded-lg p-4 bg-slate-50">
                <JsonView
                  value={response}
                  collapsed={1}
                  displayDataTypes={false}
                  style={{
                    backgroundColor: 'transparent',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
