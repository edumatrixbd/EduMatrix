"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Hls from "hls.js"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { 
  Loader2, 
  PlayCircle, 
  AlertCircle, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  RotateCcw,
  RotateCw,
  Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

import { CustomVideoPlayer } from "./custom-video-player"
import { Logo } from "@/components/shared/logo"

interface VideoPlayerProps {
  videoId: string
  videoKey: string
  hlsUrl?: string | null
  title: string
  isOpen: boolean
  onClose: () => void
}

export function VideoPlayer({ videoId, videoKey, hlsUrl, title, isOpen, onClose }: VideoPlayerProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Custom Controls State
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)

  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchSignedUrl = async () => {
    if (hlsUrl) {
      setUrl(hlsUrl)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/video/stream?key=${encodeURIComponent(videoKey)}&videoId=${videoId}`)
      const text = await response.text()
      let data: any = {}
      if (text) {
        try { data = JSON.parse(text) } 
        catch (e) { console.error(e) }
      }
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
    if (url && videoRef.current) {
      const video = videoRef.current
      const isHLS = url.includes('.m3u8') || hlsUrl

      if (isHLS) {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          })
          hls.loadSource(url)
          hls.attachMedia(video)
          hlsRef.current = hls

          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad()
                  break
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError()
                  break
                default:
                  setError("Playback failed. Please try again.")
                  hls.destroy()
                  break
              }
            }
          })
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url
        }
      } else {
        video.src = url
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [url])

  // Handlers
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
        setIsPlaying(true)
      } else {
        videoRef.current.pause()
        setIsPlaying(false)
      }
    }
  }, [])

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      const newTime = value[0]
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      videoRef.current.muted = newVolume === 0
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowRight':
          if (videoRef.current) videoRef.current.currentTime += 10
          break
        case 'ArrowLeft':
          if (videoRef.current) videoRef.current.currentTime -= 10
          break
        case 'KeyF':
          toggleFullscreen()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, togglePlay])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl bg-slate-950 border-white/10 text-white p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Secure HLS Stream • Cloudflare R2
          </DialogDescription>
        </DialogHeader>
        
        <div 
          ref={containerRef}
          className="aspect-video w-full bg-black relative flex items-center justify-center mt-4 group"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >
          {!url && !loading && !error && (
            <Button onClick={fetchSignedUrl} className="gap-2 z-10">
              <PlayCircle className="w-5 h-5" />
              Start Streaming
            </Button>
          )}

          {loading && (
            <div className="flex flex-col items-center gap-3 z-10">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm text-slate-400 font-medium">Authorizing secure stream...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 text-center px-6 z-10">
              <div className="w-12 h-12 rounded-full bg-[#FF3B30]/10 flex items-center justify-center text-[#FF3B30]">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-[#FF3B30]">Playback Error</p>
                <p className="text-sm text-slate-400 mt-1">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchSignedUrl} className="mt-2 border-white/10">
                Try Again
              </Button>
            </div>
          )}

          {url && (
            <div className="relative w-full h-full overflow-hidden">
              <CustomVideoPlayer 
                url={url} 
                title={title}
              />
            </div>
          )}
        </div>
        
        <div className="p-4 bg-white/5 text-[10px] text-slate-500 flex items-center justify-center gap-1 uppercase tracking-widest font-bold">
          © 2026 <Logo className="h-4" /> • Protected Content
        </div>
      </DialogContent>
    </Dialog>
  )
}
