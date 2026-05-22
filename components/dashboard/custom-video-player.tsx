"use client"

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react"
import { 
  Loader2, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  RotateCcw,
  RotateCw,
  Settings,
  Lock
} from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { VideoWatermark } from "./video-watermark"

interface CustomVideoPlayerProps {
  url: string | null
  title?: string
  poster?: string
  onProgress?: (progress: { currentTime: number; duration: number }) => void
  resumePosition?: number
  onError?: (e: any) => void
}

export const CustomVideoPlayer = forwardRef<HTMLVideoElement, CustomVideoPlayerProps>(({ 
  url, 
  title = "Protected Video", 
  poster,
  onProgress,
  resumePosition = 0,
  onError
}, ref) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)

  const videoRef = useRef<HTMLVideoElement>(null)
  
  // Expose the internal videoRef to the parent ref
  useImperativeHandle(ref, () => videoRef.current!)

  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (url && videoRef.current) {
      const video = videoRef.current
      video.src = url
      if (resumePosition > 0) {
        video.currentTime = resumePosition
      }
    }
  }, [url, resumePosition])

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
      const current = videoRef.current.currentTime
      const total = videoRef.current.duration
      setCurrentTime(current)
      if (onProgress) onProgress({ currentTime: current, duration: total })
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

  const [isFocused, setIsFocused] = useState(true)

  useEffect(() => {
    window.onblur = () => setIsFocused(false)
    window.onfocus = () => setIsFocused(true)
    return () => {
      window.onblur = null
      window.onfocus = null
    }
  }, [])

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
    if (isNaN(time)) return "0:00"
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
      // Check if any input/textarea is focused
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return

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
  }, [togglePlay])

  if (!url) return null

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :fullscreen video {
          width: 100vw !important;
          height: 100vh !important;
          object-fit: contain !important;
        }
        :fullscreen .video-container {
          width: 100vw !important;
          height: 100vh !important;
        }
        :fullscreen .video-watermark,
        :-webkit-full-screen .video-watermark {
          font-size: 36px !important;
          opacity: 0.12 !important;
        }
      `}} />
      <div 
        ref={containerRef}
        className={cn(
          "video-container relative w-full h-full bg-black flex items-center justify-center group overflow-hidden transition-all duration-700",
          !isFocused && "blur-2xl grayscale scale-[0.98] opacity-50"
        )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <VideoWatermark />

      {!isFocused && (
        <div className="absolute inset-0 z-[110] flex flex-col items-center justify-center gap-4 text-white bg-black/40 backdrop-blur-sm pointer-events-none">
          <Lock className="w-12 h-12 text-primary animate-pulse" />
          <p className="font-black uppercase tracking-[0.3em] text-xs">Security Pause</p>
        </div>
      )}
      
      <video 
        ref={videoRef}
        autoPlay 
        poster={poster}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onContextMenu={(e) => e.preventDefault()}
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        onError={onError}
        playsInline
      />

      {/* Custom Controls Overlay */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/60 transition-opacity duration-300 flex flex-col justify-between p-4 sm:p-6 z-[50]",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={(e) => {
          if (e.target === e.currentTarget) togglePlay()
        }}
      >
        {/* Top Info */}
        <div className="flex items-center justify-between">
          <div className="text-sm sm:text-base font-semibold text-white/90 truncate max-w-[80%] drop-shadow-md">
            {title}
          </div>
          <div className="flex items-center gap-4">
            {/* Additional header controls can go here */}
          </div>
        </div>

        {/* Center Play Button (Glassy & Smooth) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl transition-transform transform hover:scale-105">
              <Play className="w-6 h-6 text-white fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="flex items-center gap-3 sm:gap-4 group/slider">
            <span className="text-[10px] sm:text-xs font-mono text-white/80 w-10 sm:w-12 text-right select-none">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="flex-1 cursor-pointer [&>span:first-child]:h-1 sm:[&>span:first-child]:h-1.5 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-orange-500 [&_[role=slider]]:border-orange-500 [&>span>span]:bg-orange-500 hover:[&_[role=slider]]:scale-125 transition-all"
            />
            <span className="text-[10px] sm:text-xs font-mono text-white/80 w-10 sm:w-12 select-none">
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-6">
              <button 
                onClick={togglePlay}
                className="text-white hover:text-orange-400 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-full"
              >
                {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />}
              </button>

              <div className="flex items-center gap-2 group/volume">
                <button onClick={toggleMute} className="text-white hover:text-orange-400 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-full">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <div className="w-0 sm:group-hover/volume:w-24 transition-all overflow-hidden flex items-center opacity-0 group-hover/volume:opacity-100">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="w-20 sm:w-24 cursor-pointer [&>span:first-child]:h-1 [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5 [&_[role=slider]]:bg-white [&>span>span]:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 hidden sm:flex border-l border-white/20 pl-4">
                <button 
                  onClick={() => { if(videoRef.current) videoRef.current.currentTime -= 10 }}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all outline-none"
                  title="Backward 10s"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { if(videoRef.current) videoRef.current.currentTime += 10 }}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all outline-none"
                  title="Forward 10s"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
              <div className="relative group/speed flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-md px-2 py-1 transition-colors">
                <select 
                  value={playbackRate}
                  onChange={(e) => {
                    const rate = parseFloat(e.target.value)
                    setPlaybackRate(rate)
                    if (videoRef.current) videoRef.current.playbackRate = rate
                  }}
                  className="appearance-none bg-transparent text-xs sm:text-sm font-semibold text-white border-none focus:ring-0 cursor-pointer outline-none pr-3"
                >
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                    <option key={rate} value={rate} className="bg-slate-900 text-white">{rate}x</option>
                  ))}
                </select>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Settings className="w-3 h-3 text-white/70" />
                </div>
              </div>

              <button 
                onClick={toggleFullscreen}
                className="text-white/80 hover:text-white hover:scale-110 transition-all outline-none p-1"
              >
                {isFullscreen ? <Minimize className="w-5 h-5 sm:w-6 sm:h-6" /> : <Maximize className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </>
  )
})
