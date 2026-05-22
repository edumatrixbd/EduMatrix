"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { swrKeys } from "@/lib/swr/keys"
import { supabaseFetcher } from "@/lib/swr/fetcher"
import { Loader2, ArrowLeft, Maximize2, ShieldCheck, PlayCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CustomVideoPlayer } from "@/components/dashboard/custom-video-player"
import { Logo } from "@/components/shared/logo"
import { useAuth } from "@/hooks/use-auth"

export default function StudyZoneVideoPage() {
  const { user } = useAuth()
  const { videoId } = useParams()
  const router = useRouter()
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log("ROUTE PARAM VIDEO_ID:", videoId)
    console.log("CURRENT USER:", user)
  }, [videoId, user])

  const { data: video, isLoading: metaLoading, error: swrError } = useSWR(
    videoId ? `video_lecture_${videoId}` : null,
    async () => {
      const supabase = createClient()
      console.log("ATTEMPTING FETCH FOR ID:", videoId)
      
      const { data, error } = await supabase
        .from('video_lectures')
        .select('*')
        .eq('id', videoId)
        .single()
      
      if (error) {
        console.error("SUPABASE FETCH ERROR:", error.message, error.details)
        throw error
      }

      console.log("FETCH SUCCESS:", data)
      return data
    }
  )

  useEffect(() => {
    if (swrError) {
      console.error("SWR HOOK ERROR:", swrError)
    }
  }, [swrError])

  const fetchSignedUrl = async () => {
    if (!video) return
    
    if (video.hls_url) {
      setUrl(video.hls_url)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/video/stream?key=${encodeURIComponent(video.video_url)}&videoId=${video.id}`)
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

  useEffect(() => {
    if (video && !url && !loading) {
      fetchSignedUrl()
    }
  }, [video])


  if (metaLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-slate-400 text-xs animate-pulse">Establishing secure connection...</p>
        </div>
      </div>
    )
  }

  if (!video && !metaLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-6 p-4 text-center">
        <div className="w-20 h-20 rounded-full bg-[#FF3B30]/10 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-[#FF3B30]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Content Unavailable</h2>
          <p className="text-slate-400 max-w-xs mx-auto text-sm">
            We couldn't find the requested video. It may have been moved or you might not have permission to view it.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button onClick={() => window.location.reload()} variant="outline" className="border-white/10 hover:bg-white/5">
            Retry Connection
          </Button>
          <Button onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
        <div className="mt-8 pt-8 border-t border-white/5 text-[10px] font-mono text-slate-600">
          ID: {videoId}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-white/5 p-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-white font-bold text-lg line-clamp-1">{video?.title}</h1>
            <p className="text-slate-400 text-xs flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-primary" />
              Secure Study Zone Stream
            </p>
          </div>
        </div>
        <Logo className="h-6" />
      </div>

      {/* Main Player Area */}
      <div className="flex-1 relative flex items-center justify-center bg-black group">
        {!url && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-slate-400 animate-pulse text-sm">Initializing adaptive stream...</p>
          </div>
        )}

        {url && (
          <div className="relative w-full h-full max-w-6xl mx-auto aspect-video shadow-2xl shadow-primary/10">
            <CustomVideoPlayer 
              url={url} 
              title={video?.title}
            />
          </div>
        )}

        {/* Floating Security Badge */}
        <div className="absolute bottom-8 left-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-slate-950/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] uppercase tracking-tighter font-bold text-slate-300">Protected by UniHub SecureZone™</span>
          </div>
        </div>
      </div>

      {/* Bottom info */}
      <div className="bg-slate-900/50 border-t border-white/5 p-6 h-32 hidden md:block">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-slate-500 text-sm">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-600">Video ID</span>
              <span className="font-mono text-xs">{video?.id}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-600">Format</span>
              <span className="font-mono text-xs">{video?.hls_url ? "HLS (Adaptive Bitrate)" : "Direct Secure Link"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-600">Secure Content</span>
              <span className="font-mono text-xs text-primary">UniHub SecureZone™ Active</span>
            </div>
          </div>
          <p className="text-[10px] font-medium max-w-[200px] text-right text-slate-600">
            Unauthorized recording or distribution is strictly prohibited under our privacy policy.
          </p>
        </div>
      </div>
    </div>
  )
}
