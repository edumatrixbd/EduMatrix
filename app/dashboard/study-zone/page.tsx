"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { reportError } from "@/lib/error-logger"
import {
  Play,
  FileText,
  FileQuestion,
  CheckCircle2,
  Lock,
  BookOpenCheck,
  Clock,
  PlayCircle,
  Download,
  ExternalLink,
  Sparkles,
  ChevronRight,
  List,
  Loader2,
  Search,
  Maximize2,
  ShieldCheck,
  AlertCircle
} from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { CustomVideoPlayer } from "@/components/dashboard/custom-video-player"
import { ReportMistakeButton } from "@/components/report-mistake-button"
import { useAuth } from "@/hooks/use-auth"
import { LoadingTimeout } from "@/components/shared/loading-timeout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { getLatestSubscriptionAccess } from "@/lib/paid-access"
import { useTracking } from "@/hooks/use-tracking"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

function logSupabaseError(label: string, error: any) {
  console.error(label, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
    raw: error,
  })
}

const PENDING_PAYMENT_MESSAGE = "Payment Submitted — Waiting for Admin Approval. Your access will be activated once our team verifies the transaction."
const UNSUPPORTED_VIDEO_MESSAGE = "Unsupported video format. Upload MP4 H.264."

function getVideoUrlIssue(fileUrl?: string | null) {
  if (!fileUrl) return "Video URL missing"

  let url: URL
  try {
    url = new URL(fileUrl)
  } catch {
    return "Video URL is invalid. Upload again so the file_url is saved as a public R2 URL."
  }

  if (url.hostname.endsWith("r2.cloudflarestorage.com")) {
    return "Video URL is not public. Save file_url as the public R2 URL, not the internal S3 endpoint."
  }

  if (!url.hostname.endsWith("r2.dev")) {
    return "Video URL must be a public R2 URL."
  }

  if (!url.pathname.toLowerCase().endsWith(".mp4")) {
    return UNSUPPORTED_VIDEO_MESSAGE
  }

  return null
}

// ── Reusable Tab Toggle ───────────────────────────────────────────────────────

function MidFinalTabs({
  value,
  onChange,
}: {
  value: "mid" | "final"
  onChange: (v: "mid" | "final") => void
}) {
  return (
    <div className="flex bg-muted/60 rounded-xl p-1 gap-1 w-fit">
      {(["mid", "final"] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            "px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
            value === tab
              ? tab === "mid"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow"
                : "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab === "mid" ? "Mid" : "Final"}
        </button>
      ))}
    </div>
  )
}

// ── Playlist box ──────────────────────────────────────────────────────────────

function PlaylistBox({
  label,
  items,
  accent,
  onPlay,
}: {
  label: string
  items: any[]
  accent: "amber" | "violet"
  onPlay: (video: any) => void
}) {
  const watched = items.filter((i) => i.watched).length
  const pct = items.length > 0 ? Math.round((watched / items.length) * 100) : 0
  const gradFrom = accent === "amber" ? "from-amber-500 to-orange-500" : "from-violet-500 to-purple-600"
  const badgeColor = accent === "amber" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-violet-500/10 text-violet-400 border-violet-500/20"

  return (
    <div className="rounded-2xl border border-white/10 bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full bg-gradient-to-r", gradFrom)} />
          <span className="font-semibold text-sm text-foreground">{label}</span>
        </div>
        <Badge className={cn("text-xs", badgeColor)}>{watched}/{items.length} videos</Badge>
      </div>
      {/* Progress */}
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500 bg-gradient-to-r", gradFrom)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Items */}
      <div className="space-y-0.5 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
        {items.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-4">No videos assigned yet</p>}
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => onPlay(item)}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-all group text-left"
          >
            <span className={cn(
              "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
              item.watched ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
            )}>
              {item.watched ? "✓" : i + 1}
            </span>
            <span className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
              {item.duration && <p className="text-[10px] text-muted-foreground">{item.duration}</p>}
            </span>
            <List className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Section card with Mid/Final tabs ─────────────────────────────────────────

function SectionCard({
  title,
  icon,
  gradient,
  glowColor,
  borderColor,
  iconBg,
  href,
  accentColor,
  midContent,
  finalContent,
}: {
  title: string
  icon: React.ReactNode
  gradient: string
  glowColor: string
  borderColor: string
  iconBg: string
  href: string
  accentColor: string
  midContent: React.ReactNode
  finalContent: React.ReactNode
}) {
  const [tab, setTab] = useState<"mid" | "final">("mid")

  return (
    <div
      className={cn("relative rounded-3xl overflow-hidden border bg-card flex flex-col p-5", borderColor)}
      style={{ boxShadow: `0 0 30px -8px ${glowColor}` }}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br pointer-events-none", gradient)} />
      <div className="relative z-10 flex flex-col gap-4 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className={cn("p-2 rounded-xl", iconBg)}>{icon}</div>
            <h3 className="font-bold text-foreground">{title}</h3>
          </div>
          <MidFinalTabs value={tab} onChange={setTab} />
        </div>
        {/* Content */}
        <div className="flex flex-col gap-2 flex-1 min-h-[200px]">
          {tab === "mid" ? midContent : finalContent}
        </div>
        {/* Footer */}
        <Link
          href={href}
          className={cn("mt-2 pt-3 border-t border-white/5 flex items-center gap-1.5 text-sm font-medium hover:opacity-70 transition-opacity", accentColor)}
        >
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic"

export default function StudyZonePage() {
  const { user } = useAuth()
  const { logActivity } = useTracking()
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [profileIncomplete, setProfileIncomplete] = useState(false)
  const [content, setContent] = useState({
    midPlaylist: [] as any[],
    finalPlaylist: [] as any[],
    notes: { mid: [] as any[], final: [] as any[] },
    questions: { mid: [] as any[], final: [] as any[] },
    solves: { mid: [] as any[], final: [] as any[] },
    featured: null as any
  })
  const searchParams = useSearchParams()
  const videoIdFromUrl = searchParams.get("videoId")
  const [url, setUrl] = useState<string | null>(null)
  const [playerLoading, setPlayerLoading] = useState(false)
  const [playerError, setPlayerError] = useState<string | null>(null)
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false)
  const [hasPendingPayment, setHasPendingPayment] = useState<boolean>(false)
  const [checkingSubscription, setCheckingSubscription] = useState(true)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [resumePosition, setResumePosition] = useState<number>(0)
  const [isReady, setIsReady] = useState(false)
  const studyVideoRef = useRef<HTMLVideoElement>(null)
  const isSavingProgressRef = useRef(false)
  const lastSavedPositionRef = useRef(0)
  const router = useRouter()
  const selectedVideo = content.featured
  const selectedVideoUrlIssue = getVideoUrlIssue(selectedVideo?.file_url)

  useEffect(() => {
    logActivity('study_zone', 'view', { action: 'entered_study_zone' })
    startSession()
    initializeStudyZone()
  }, [])

  useEffect(() => {
    if (!selectedVideo) return

    console.log("selectedVideo.file_url", selectedVideo.file_url)
    if (selectedVideo.file_url) {
      console.log("Open selected video URL directly:", selectedVideo.file_url)
    }
  }, [selectedVideo])

  const startSession = async () => {
    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        body: JSON.stringify({ deviceInfo: navigator.userAgent })
      })
      const text = await res.text()
      if (text) {
        const data = JSON.parse(text)
        if (data.sessionId) setSessionId(data.sessionId)
      }
    } catch (e) { console.error("Session initialization failed:", e) }
  }

  useEffect(() => {
    if (!sessionId) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/sessions/heartbeat', {
          method: 'POST',
          body: JSON.stringify({ sessionId })
        })
        const text = await res.text()
        if (text) {
          const data = JSON.parse(text)
          if (data.status === 'deactivated') {
            setSessionError("Your account is active on another device.")
            if (studyVideoRef.current) studyVideoRef.current.pause()
          }
        }
      } catch (e) { console.error("Heartbeat failed:", e) }
    }, 30000)

    return () => clearInterval(interval)
  }, [sessionId])

  const fetchInitialData = async () => {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return null

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const subActive = subscription?.status === "active"
    const subPending = subscription?.status === "pending_payment"

    if (!subActive) {
      return { authUser, subActive, subPending, profileIncomplete: false, courses: [] }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("university_id, department_id, batch_id")
      .eq("id", authUser.id)
      .single()

    if (!profile || !profile.university_id || !profile.department_id || !profile.batch_id) {
      return { authUser, subActive, subPending, profileIncomplete: true, courses: [] }
    }

    const { data: coursesData } = await supabase
      .from("courses")
      .select("id, course_name, course_code")
      .eq("university_id", profile.university_id)
      .eq("department_id", profile.department_id)
      .eq("batch_id", profile.batch_id)
      .eq("status", "active")
      .order("course_code")

    return { authUser, subActive, subPending, profileIncomplete: false, courses: coursesData || [] }
  }

  const { data: initialData, isLoading: initialLoading } = useSWR('studyZoneInit', fetchInitialData, {
    revalidateOnFocus: false
  })

  useEffect(() => {
    if (initialData && initialData.authUser) {
      setIsSubscribed(initialData.subActive)
      setHasPendingPayment(initialData.subPending)
      setCheckingSubscription(false)
      setProfileIncomplete(initialData.profileIncomplete)
      setCourses(initialData.courses)
      if (initialData.courses.length > 0 && !selectedCourse) {
        setSelectedCourse(initialData.courses[0].id)
      }
      setLoading(false)
    }
  }, [initialData])

  const fetchCourseContent = async (courseId: string) => {
    const supabase = createClient()
    let { data: allContent, error: contentError } = await supabase
      .from("content_materials")
      .select("*")
      .eq("course_id", courseId)
      .eq("active", true)

    let midPlaylist: any[] = []
    let finalPlaylist: any[] = []
    let notesMid: any[] = []
    let notesFinal: any[] = []
    let questionsMid: any[] = []
    let questionsFinal: any[] = []
    let solvesMid: any[] = []
    let solvesFinal: any[] = []

    if (contentError) {
      const [videosRes, notesRes, questionsRes, solvesRes] = await Promise.all([
        supabase.from("video_lectures").select("*").eq("course_id", courseId),
        supabase.from("study_notes").select("*").eq("course_id", courseId),
        supabase.from("previous_questions").select("*").eq("course_id", courseId),
        supabase.from("solved_answers").select("*").eq("course_id", courseId),
      ])

      const rawVideos = videosRes.data || []
      const rawNotes = notesRes.data || []
      const rawQuestions = questionsRes.data || []
      const rawSolves = solvesRes.data || []

      rawVideos.forEach((v: any) => {
        const item = {
          id: v.id,
          title: v.title,
          type: "video",
          course_id: v.course_id,
          file_url: v.video_url || v.file_url,
          description: v.description,
          duration: v.duration ? `${Math.floor(v.duration / 60)}m` : null,
          instructor: "Platform Instructor"
        }
        if (v.playlist_type === "final") finalPlaylist.push(item)
        else midPlaylist.push(item)
      })

      rawNotes.forEach((n: any) => {
        const item = {
          id: n.id,
          title: n.title,
          type: "note",
          course_id: n.course_id,
          file_url: n.file_url,
          topic: n.topic || "General"
        }
        if (n.category === "final") notesFinal.push(item)
        else notesMid.push(item)
      })

      rawQuestions.forEach((q: any) => {
        const item = {
          id: q.id,
          question_text: q.question_text || q.title || "Previous Question",
          type: "previous_question",
          course_id: q.course_id,
          file_url: q.file_url
        }
        if (q.exam_type === "final") questionsFinal.push(item)
        else questionsMid.push(item)
      })

      rawSolves.forEach((s: any) => {
        const item = {
          id: s.id,
          title: s.answer_text || "Solved Answer",
          type: "solved_answer",
          course_id: s.course_id,
          file_url: s.answer_file_url,
          solved_by: s.solved_by
        }
        if (s.category === "final") solvesFinal.push(item)
        else solvesMid.push(item)
      })
    } else {
      const videos = allContent?.filter(c => c.type === "video") || []
      videos.forEach((v: any) => {
        if (v.category === "final") finalPlaylist.push(v)
        else midPlaylist.push(v)
      })

      notesMid = allContent?.filter(c => c.type === "note" && c.category !== "final") || []
      notesFinal = allContent?.filter(c => c.type === "note" && c.category === "final") || []
      questionsMid = allContent?.filter(c => c.type === "previous_question" && c.category !== "final") || []
      questionsFinal = allContent?.filter(c => c.type === "previous_question" && c.category === "final") || []
      solvesMid = allContent?.filter(c => c.type === "solved_answer" && c.category !== "final") || []
      solvesFinal = allContent?.filter(c => c.type === "solved_answer" && c.category === "final") || []
    }

    return {
      midPlaylist,
      finalPlaylist,
      notes: { mid: notesMid, final: notesFinal },
      questions: { mid: questionsMid, final: questionsFinal },
      solves: { mid: solvesMid, final: solvesFinal },
      featured: midPlaylist[0] || finalPlaylist[0] || null
    }
  }

  const { data: courseContentData, isLoading: contentLoading } = useSWR(
    selectedCourse && isSubscribed ? ['courseContent', selectedCourse] : null,
    ([, courseId]) => fetchCourseContent(courseId as string),
    { revalidateOnFocus: false }
  )

  useEffect(() => {
    if (courseContentData) {
      setContent(courseContentData)
    }
  }, [courseContentData])

  const fetchSpecificVideo = async (vid: string) => {
    try {
      const supabase = createClient()

      // 1. Try unified content first
      const { data: unifiedData, error: unifiedError } = await supabase
        .from('content_materials')
        .select('*')
        .eq('id', vid)
        .eq('type', 'video')
        .maybeSingle()

      if (!unifiedError && unifiedData) {
        handlePlay(unifiedData)
        return
      }

      // 2. Fallback to video_lectures
      const { data: fallbackData } = await supabase
        .from('video_lectures')
        .select('*')
        .eq('id', vid)
        .maybeSingle()

      if (fallbackData) {
        handlePlay({
          id: fallbackData.id,
          title: fallbackData.title,
          type: 'video',
          course_id: fallbackData.course_id,
          file_url: fallbackData.video_url || fallbackData.file_url,
          description: fallbackData.description,
          duration: fallbackData.duration ? `${Math.floor(fallbackData.duration / 60)}m` : null,
          instructor: "Platform Instructor"
        })
      }
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    if (videoIdFromUrl && !loading) {
      // Check if we already have it in playlists
      const allVideos = [...content.midPlaylist, ...content.finalPlaylist]
      const found = allVideos.find(v => v.id === videoIdFromUrl)
      if (found) {
        handlePlay(found)
      } else {
        fetchSpecificVideo(videoIdFromUrl)
      }
    }
  }, [videoIdFromUrl, loading, content.midPlaylist, content.finalPlaylist])

  const fetchSignedUrl = async (video: any) => {
    setPlayerLoading(true)
    setPlayerError(null)
    try {
      const response = await fetch(`/api/videos/${video.id}/signed-url`)
      const text = await response.text()
      let data: any = {}
      if (text) {
        try { data = JSON.parse(text) } 
        catch (e) { console.error(e) }
      }

      if (data.url) {
        setUrl(data.url)
        setExpiresAt(data.expiresAt)
        console.log("PROACTIVE: Signed URL refreshed. Expires at:", data.expiresAt)
      } else {
        const msg = data.error || "Failed to load video"
        setPlayerError(msg)
        reportError('video_load', msg, { videoId: video.id, error: data.error })
      }
    } catch (err: any) {
      const msg = "An unexpected error occurred while securing the stream"
      setPlayerError(msg)
      reportError('api_error', msg, { videoId: video.id, error: err.message })
    } finally {
      setPlayerLoading(false)
    }
  }

  const fetchResumePosition = async (videoId: string) => {
    try {
      const res = await fetch(`/api/tracking/video-progress?videoId=${videoId}`)
      const text = await res.text()
      if (text) {
        const data = JSON.parse(text)
        if (data.last_position) {
          setResumePosition(data.last_position)
          console.log("TRACKING: Found resume position:", data.last_position)
        } else {
          setResumePosition(0)
        }
      } else {
        setResumePosition(0)
      }
    } catch (e) { console.error("Failed to fetch resume position:", e) }
  }

  const saveProgress = useCallback(async () => {
    if (!studyVideoRef.current || !content.featured || !selectedCourse || isSavingProgressRef.current) return
    const video = studyVideoRef.current
    const currentPos = Math.round(video.currentTime)
    const duration = Math.round(video.duration)

    if (!Number.isFinite(currentPos) || !Number.isFinite(duration) || duration <= 0) return

    // Only save if moved at least 5 seconds or marking as completed
    if (Math.abs(currentPos - lastSavedPositionRef.current) < 5 && currentPos < duration * 0.9) return

    isSavingProgressRef.current = true
    try {
      const response = await fetch('/api/tracking/video-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: content.featured.id,
          courseId: selectedCourse,
          lastPosition: currentPos,
          totalDuration: duration,
          watchedSeconds: currentPos // Simple approx
        })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || `Progress save failed (${response.status})`)
      }

      lastSavedPositionRef.current = currentPos
      console.log("TRACKING: Progress saved at", currentPos)
    } catch {
      // Progress tracking is best-effort; transient fetch failures should not trip the dev overlay.
    } finally {
      isSavingProgressRef.current = false
    }
  }, [content.featured, selectedCourse])

  // Periodic Save Interval (Every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      saveProgress()
    }, 30000)
    return () => {
      clearInterval(interval)
      saveProgress() // Final save on cleanup
    }
  }, [saveProgress])


  // Proactive Auto-Refresh before expiry
  useEffect(() => {
    if (!expiresAt || !content.featured) return

    const expiryTime = new Date(expiresAt).getTime()
    const now = Date.now()
    const timeUntilExpiry = expiryTime - now

    // Refresh 5 minutes before actual expiry (300,000 ms)
    const refreshBuffer = 300000
    const waitTime = Math.max(0, timeUntilExpiry - refreshBuffer)

    console.log(`SESSION: Next auto-refresh in ${Math.round(waitTime / 1000 / 60)} minutes`)

    const timer = setTimeout(() => {
      console.log("PROACTIVE: Refreshing signed URL before expiry...")
      fetchSignedUrl(content.featured)
    }, waitTime)

    return () => clearTimeout(timer)
  }, [expiresAt, content.featured])

  const handlePlay = (video: any) => {
    setContent(prev => ({ ...prev, featured: video }))
    fetchResumePosition(video.id)
    logActivity('video', 'watch', { video_id: video.id, title: video.title, course: selectedCourse })
    // Scroll to top to see player
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleResourceClick = (feature: any, resource: any) => {
    logActivity(feature, 'open', { title: resource.title, id: resource.id, course: selectedCourse })
    if (resource.file_url) window.open(resource.file_url, '_blank')
  }

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20">
            <BookOpenCheck className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Study Zone</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Your focused exam prep space.</p>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-3 w-full sm:w-auto">

          {/* Course selector filtered by batch */}
          <div className="flex items-center gap-3">
            <Select
              value={selectedCourse}
              onValueChange={setSelectedCourse}
              disabled={!isSubscribed || courses.length === 0}
            >
              <SelectTrigger className="w-full sm:w-[240px] bg-muted/30 border-white/10 rounded-xl">
                <SelectValue placeholder={!isSubscribed ? (hasPendingPayment ? "Waiting for approval" : "Subscription Required") : "Select Course"} />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto z-50">
                {courses.length === 0 ? (
                  <SelectItem value="none" disabled className="text-muted-foreground italic">
                    No courses found
                  </SelectItem>
                ) : (
                  courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.course_code} - {c.course_name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Badge className="w-fit bg-violet-500/10 text-violet-400 border-violet-500/20 px-3 py-1 gap-1.5 whitespace-nowrap">
              <Sparkles className="w-3 h-3" /> Exam Season Active
            </Badge>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Gathering resources...</p>
          <LoadingTimeout timeout={12000} />
        </div>
      ) : profileIncomplete ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4 text-center">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <h2 className="text-2xl font-bold text-foreground">Profile Incomplete</h2>
          <p className="text-muted-foreground max-w-md">
            Your academic profile is incomplete. We need your University, Department, and Batch to show you the correct courses. Please contact support.
          </p>
        </div>
      ) : (
        <>
          {/* ── Top: Video + Stacked Playlists ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}
            className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5"
          >
            {/* Video Player */}
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-card shadow-2xl shadow-black/30 flex flex-col">
              {/* Player */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
                {!isSubscribed && !checkingSubscription && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md text-center p-8">
                    <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
                      {hasPendingPayment ? <Clock className="w-12 h-12 text-amber-500" /> : <Lock className="w-12 h-12 text-amber-500" />}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {hasPendingPayment ? "Payment Submitted" : "Subscription Required"}
                    </h3>
                    <p className="text-slate-400 max-w-md mb-8">
                      {hasPendingPayment
                        ? PENDING_PAYMENT_MESSAGE
                        : "You need an active subscription to access the Study Zone and watch these premium lectures."}
                    </p>
                    {!hasPendingPayment && (
                      <Link href="/dashboard/billing">
                        <Button className="bg-primary text-primary-foreground font-bold px-8 py-6 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                          Upgrade Your Plan
                        </Button>
                      </Link>
                    )}
                  </div>
                )}

                {sessionError && (
                  <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl text-center p-8">
                    <div className="p-4 rounded-full bg-[#FF3B30]/10 border border-[#FF3B30]/20 mb-6">
                      <ShieldCheck className="w-12 h-12 text-[#FF3B30]" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Session Conflict</h3>
                    <p className="text-slate-400 max-w-md mb-8">
                      {sessionError} Please log out from other devices to continue.
                    </p>
                    <Button
                      onClick={() => window.location.reload()}
                      className="bg-white text-black font-bold px-8 py-6 rounded-2xl hover:bg-slate-200 transition-all"
                    >
                      Re-activate This Session
                    </Button>
                  </div>
                )}
                {(!content.featured) && (
                  <div className="flex flex-col items-center gap-4 text-center px-6">
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <Search className="w-12 h-12 mb-2" />
                      <p className="text-sm">Select a video from the playlists</p>
                    </div>
                  </div>
                )}

                {selectedVideo && selectedVideoUrlIssue && (
                  <div className="flex flex-col items-center gap-4 text-center px-6 text-[#FF3B30] absolute inset-0 z-[100] justify-center bg-black/90 backdrop-blur-xl">
                    <AlertCircle className="w-12 h-12" />
                    <p className="text-sm font-bold">{selectedVideoUrlIssue}</p>
                    {selectedVideo.file_url && (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                        onClick={() => window.open(selectedVideo.file_url, "_blank", "noopener,noreferrer")}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open video URL
                      </Button>
                    )}
                  </div>
                )}

                {selectedVideo && selectedVideo.file_url && !selectedVideoUrlIssue && (
                  <div className="relative w-full h-full">
                    <CustomVideoPlayer
                      key={selectedVideo.id}
                      ref={studyVideoRef}
                      url={`/api/play-video/${selectedVideo.id}`}
                      title={selectedVideo.title}
                      onError={(e) => {
                        const target = e.target as HTMLVideoElement
                        const mediaError = target?.error
                        console.error(`VIDEO_ERROR: code=${mediaError?.code || 'N/A'}, msg=${mediaError?.message || 'N/A'}`)
                        toast.error(UNSUPPORTED_VIDEO_MESSAGE)
                      }}
                    />
                  </div>
                )}
              </div>
              {/* Meta */}
              <div className="p-5 flex flex-col gap-3 flex-1">
                {content.featured ? (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-foreground leading-tight">{content.featured.title}</h2>
                      </div>
                      <Badge className="flex-shrink-0 bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Now Playing</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="text-foreground font-medium">{content.featured.instructor || "Platform Instructor"}</span>
                      <span>{content.featured.views || 0} views</span>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <ReportMistakeButton
                          materialType="video"
                          materialId={content.featured.id}
                          materialTitle={content.featured.title}
                          variant="ghost"
                          className="h-8 text-xs text-muted-foreground hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 px-2 -ml-2"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 ml-auto">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Protected Stream</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-10 text-center text-muted-foreground italic">No video selected</div>
                )}
              </div>
            </div>

            {/* Stacked Playlists */}
            <div className="flex flex-col gap-4">
              <PlaylistBox label="Mid Playlist" items={content.midPlaylist} accent="amber" onPlay={handlePlay} />
              <PlaylistBox label="Final Playlist" items={content.finalPlaylist} accent="violet" onPlay={handlePlay} />
            </div>
          </motion.div>

          {/* ── Bottom 3 Sections ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.16 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {/* Notes */}
            <SectionCard
              title="Study Notes"
              icon={<FileText className="w-5 h-5 text-emerald-400" />}
              gradient="from-emerald-500/15 via-teal-500/8 to-transparent"
              glowColor="rgba(16,185,129,0.15)"
              borderColor="border-emerald-500/20"
              iconBg="bg-emerald-500/15"
              href="/dashboard/notes"
              accentColor="text-emerald-400"
              midContent={
                <div className="space-y-2">
                  {content.notes.mid.length === 0 && <p className="text-[10px] text-muted-foreground p-4 text-center">No mid notes yet</p>}
                  {content.notes.mid.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleResourceClick('notes', n)}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/20 hover:bg-emerald-500/5 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.topic || "General"}</p>
                      </div>
                      <Download className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                  ))}
                </div>
              }
              finalContent={
                <div className="space-y-2">
                  {content.notes.final.length === 0 && <p className="text-[10px] text-muted-foreground p-4 text-center">No final notes yet</p>}
                  {content.notes.final.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleResourceClick('notes', n)}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/20 hover:bg-emerald-500/5 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.topic || "General"}</p>
                      </div>
                      <Download className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                  ))}
                </div>
              }
            />

            {/* Previous Questions */}
            <SectionCard
              title="Previous Questions"
              icon={<FileQuestion className="w-5 h-5 text-violet-400" />}
              gradient="from-violet-500/15 via-purple-500/8 to-transparent"
              glowColor="rgba(139,92,246,0.15)"
              borderColor="border-violet-500/20"
              iconBg="bg-violet-500/15"
              href="/dashboard/questions"
              accentColor="text-violet-400"
              midContent={
                <div className="space-y-2">
                  {content.questions.mid.length === 0 && <p className="text-[10px] text-muted-foreground p-4 text-center">No mid questions yet</p>}
                  {content.questions.mid.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => handleResourceClick('questions', { ...q, title: q.question_text })}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-violet-500/20 hover:bg-violet-500/5 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                        <FileQuestion className="w-4 h-4 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{q.question_text || "Untitled Question"}</p>
                        <p className="text-xs text-muted-foreground">Previous Exam</p>
                      </div>
                      <Badge className="text-[10px] flex-shrink-0 bg-amber-500/10 text-amber-400 border-amber-500/20">Mid</Badge>
                    </div>
                  ))}
                </div>
              }
              finalContent={
                <div className="space-y-2">
                  {content.questions.final.length === 0 && <p className="text-[10px] text-muted-foreground p-4 text-center">No final questions yet</p>}
                  {content.questions.final.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => handleResourceClick('questions', { ...q, title: q.question_text })}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-violet-500/20 hover:bg-violet-500/5 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                        <FileQuestion className="w-4 h-4 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{q.question_text || "Untitled Question"}</p>
                        <p className="text-xs text-muted-foreground">Previous Exam</p>
                      </div>
                      <Badge className="text-[10px] flex-shrink-0 bg-violet-500/10 text-violet-400 border-violet-500/20">Final</Badge>
                    </div>
                  ))}
                </div>
              }
            />

            {/* Solved Answers */}
            <SectionCard
              title="Previous Solved Answers"
              icon={<CheckCircle2 className="w-5 h-5 text-sky-400" />}
              gradient="from-sky-500/15 via-blue-500/8 to-transparent"
              glowColor="rgba(14,165,233,0.15)"
              borderColor="border-sky-500/20"
              iconBg="bg-sky-500/15"
              href="/dashboard/solved"
              accentColor="text-sky-400"
              midContent={
                <div className="space-y-2">
                  {content.solves.mid.length === 0 && <p className="text-[10px] text-muted-foreground p-4 text-center">No mid solves yet</p>}
                  {content.solves.mid.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleResourceClick('solves', { ...s, title: s.answer_text })}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-sky-500/20 hover:bg-sky-500/5 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-sky-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{s.answer_text || "Solved Answer"}</p>
                        <p className="text-xs text-muted-foreground">By {s.solved_by || "Anonymous"}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                  ))}
                </div>
              }
              finalContent={
                <div className="space-y-2">
                  {content.solves.final.length === 0 && <p className="text-[10px] text-muted-foreground p-4 text-center">No final solves yet</p>}
                  {content.solves.final.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleResourceClick('solves', { ...s, title: s.answer_text })}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-sky-500/20 hover:bg-sky-500/5 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-sky-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{s.answer_text || "Solved Answer"}</p>
                        <p className="text-xs text-muted-foreground">By {s.solved_by || "Anonymous"}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                  ))}
                </div>
              }
            />
          </motion.div>
        </>
      )}
    </div>
  )
}
