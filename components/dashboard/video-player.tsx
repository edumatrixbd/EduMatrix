"use client"

import { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { Loader2, PlayCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  videoId: string
  videoKey: string
  title: string
  isOpen: boolean
  onClose: () => void
}

export function VideoPlayer({ videoId, videoKey, title, isOpen, onClose }: VideoPlayerProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSignedUrl = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/video/stream?key=${encodeURIComponent(videoKey)}&videoId=${videoId}`)
      const data = await response.json()
      if (data.url) {
        setUrl(data.url)
      } else {
        setError(data.error || "Failed to load video")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl bg-slate-950 border-white/10 text-white p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Secure stream from Cloudflare R2
          </DialogDescription>
        </DialogHeader>
        
        <div className="aspect-video w-full bg-black relative flex items-center justify-center mt-4">
          {!url && !loading && !error && (
            <Button onClick={fetchSignedUrl} className="gap-2">
              <PlayCircle className="w-5 h-5" />
              Load Video
            </Button>
          )}

          {loading && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm text-slate-400 font-medium">Generating secure link...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-rose-500">Video Error</p>
                <p className="text-sm text-slate-400 mt-1">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchSignedUrl} className="mt-2 border-white/10">
                Try Again
              </Button>
            </div>
          )}

          {url && (
            <video 
              src={url} 
              controls 
              autoPlay 
              className="w-full h-full"
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>
        
        <div className="p-4 bg-white/5 text-[10px] text-slate-500 text-center uppercase tracking-widest font-bold">
          © 2026 EduMatrix • Protected Content
        </div>
      </DialogContent>
    </Dialog>
  )
}
