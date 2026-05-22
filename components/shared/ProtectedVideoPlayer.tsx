"use client"

import { useEffect, useRef, useState } from "react"
import Hls from "hls.js"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Settings,
  ShieldCheck,
  Loader2,
  Lock
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface ProtectedVideoPlayerProps {
  url: string
  title?: string
  poster?: string
}

export default function ProtectedVideoPlayer({ url, title, poster }: ProtectedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [ipAddress, setIpAddress] = useState<string>("")
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchUserData()
    initHls()

    document.addEventListener('contextmenu', handleContextMenu)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    }
  }, [url])

  const fetchUserData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setUserData({ ...user, ...profile })
    }

    try {
      const res = await fetch('https://api.ipify.org?format=json')
      const text = await res.text()
      if (text) {
        const data = JSON.parse(text)
        setIpAddress(data.ip)
      } else {
        setIpAddress("Forensic ID Active")
      }
    } catch (e) {
      setIpAddress("Forensic ID Active")
    }
  }

  const initHls = () => {
    const video = videoRef.current
    if (!video) return

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      })
      hls.loadSource(url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false)
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false)
      })
    }
  }

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
  }

  const togglePlay = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play()
      setIsPlaying(true)
    } else {
      videoRef.current?.pause()
      setIsPlaying(false)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
      setDuration(videoRef.current.duration)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (videoRef.current) videoRef.current.volume = val
    setIsMuted(val === 0)
  }

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullScreen(true)
    } else {
      document.exitFullscreen()
      setIsFullScreen(false)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }

  const WatermarkOverlay = () => {
    if (!userData) return null
    const text = `${userData.full_name || userData.name || "User"} • ${userData.email || "No email"} • ${ipAddress}`

    return (
      <div className="absolute top-1/2 left-1/2 pointer-events-none z-40" aria-hidden="true">
        <p
          className="text-white text-base font-medium tracking-wider select-none"
          style={{
            opacity: 0.12,
            transform: "translate(-50%, -50%) rotate(-18deg)",
            whiteSpace: "nowrap",
            textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
          }}
        >
          {text}
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative w-full aspect-video bg-black rounded-[2.5rem] overflow-hidden group shadow-2xl border border-white/5",
        isFullScreen ? "rounded-none" : ""
      )}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        className="w-full h-full cursor-none"
        playsInline
      />

      {/* Watermark */}
      <WatermarkOverlay />

      {/* Security Shield */}
      <div className="absolute top-8 left-8 z-[50] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">tensionনাই Guard Active</span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/80 backdrop-blur-md">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-primary animate-pulse">Initializing Secure Stream...</p>
        </div>
      )}

      {/* Controls Overlay */}
      <div className={cn(
        "absolute inset-0 z-[45] bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-500 flex flex-col justify-end p-8",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        {/* Progress Bar */}
        <div className="group/progress relative w-full h-1.5 bg-white/20 rounded-full mb-6 cursor-pointer overflow-hidden">
          <div
            className="absolute h-full bg-primary transition-all duration-100"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
              {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
            </button>

            <div className="flex items-center gap-3 group/volume">
              <button onClick={() => setIsMuted(!isMuted)} className="text-white">
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
              <input
                type="range"
                min="0" max="1" step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-24 transition-all duration-300 accent-primary"
              />
            </div>

            <span className="text-xs font-black text-white tracking-widest">
              {formatTime(currentTime)} <span className="opacity-30">/</span> {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end mr-4">
              <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{title || "Lesson Stream"}</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Forensic Identification: {ipAddress}</span>
            </div>
            <button onClick={toggleFullScreen} className="text-white hover:text-primary transition-colors">
              {isFullScreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
