"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
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
  Search
} from "lucide-react"
import { LoadingTimeout } from "@/components/shared/loading-timeout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useTracking } from "@/hooks/use-tracking"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
              <p className="text-[10px] text-muted-foreground">{item.duration || "No duration"}</p>
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

export default function StudyZonePage() {
  const { logActivity } = useTracking()
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState({
    midPlaylist: [] as any[],
    finalPlaylist: [] as any[],
    notes: { mid: [] as any[], final: [] as any[] },
    questions: { mid: [] as any[], final: [] as any[] },
    solves: { mid: [] as any[], final: [] as any[] },
    featured: null as any
  })

  useEffect(() => {
    logActivity('study_zone', 'view', { action: 'entered_study_zone' })
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) fetchContent()
  }, [selectedCourse])

  const fetchCourses = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase.from("courses").select("id, course_name, course_code")
      if (data) {
        setCourses(data)
        if (data.length > 0) setSelectedCourse(data[0].id)
      }
    } catch (e) { console.error(e) }
  }

  const fetchContent = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Fetch Playlists (Videos)
      const { data: playlists } = await supabase
        .from("study_zone_playlists")
        .select("category, video:video_lectures(id, title, description, duration, video_url)")
        .eq("course_id", selectedCourse)
      
      // Fetch Notes
      const { data: notes } = await supabase
        .from("study_notes")
        .select("id, title, topic, category, file_url")
        .eq("course_id", selectedCourse)
      
      // Fetch Questions
      const { data: questions } = await supabase
        .from("previous_questions")
        .select("id, question_text, exam_type, exam_year, file_url")
        .eq("course_id", selectedCourse)
      
      // Fetch Solves
      const { data: solves } = await supabase
        .from("solved_answers")
        .select("id, answer_text, solved_by, category, answer_file_url")
        .eq("course_id", selectedCourse)

      const midPlaylist = playlists?.filter(p => p.category === "mid").map(p => p.video) || []
      const finalPlaylist = playlists?.filter(p => p.category === "final").map(p => p.video) || []

      setContent({
        midPlaylist,
        finalPlaylist,
        notes: {
          mid: notes?.filter(n => n.category === "mid") || [],
          final: notes?.filter(n => n.category === "final") || []
        },
        questions: {
          mid: questions?.filter(q => q.exam_type === "midterm") || [],
          final: questions?.filter(q => q.exam_type === "final") || []
        },
        solves: {
          mid: solves?.filter(s => s.category === "mid") || [],
          final: solves?.filter(s => s.category === "final") || []
        },
        featured: midPlaylist[0] || finalPlaylist[0] || null
      })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handlePlay = (video: any) => {
    setContent(prev => ({ ...prev, featured: video }))
    logActivity('video', 'watch', { title: video.title, video_id: video.id, course: selectedCourse })
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-full sm:w-[240px] bg-muted/30 border-white/10 rounded-xl">
              <SelectValue placeholder="Switch Course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.course_code} - {c.course_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge className="w-fit bg-violet-500/10 text-violet-400 border-violet-500/20 px-3 py-1 gap-1.5 whitespace-nowrap">
            <Sparkles className="w-3 h-3" /> Exam Season Active
          </Badge>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Gathering resources...</p>
          <LoadingTimeout timeout={12000} />
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
              <div className="relative w-full aspect-video bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center cursor-pointer group">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(99,102,241,0.18),transparent)]" />
                <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6">
                  {content.featured ? (
                    <>
                      <button className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:scale-110 hover:bg-white/20 transition-all duration-200 shadow-[0_0_40px_-5px_rgba(139,92,246,0.6)]">
                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                      </button>
                      <p className="text-white/50 text-sm">Now ready to watch</p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <Search className="w-12 h-12 mb-2" />
                      <p>Select a video from the playlists</p>
                    </div>
                  )}
                </div>
                {content.featured?.duration && (
                  <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1 text-white text-xs">
                    <Clock className="w-3 h-3" />{content.featured.duration}
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
                        <p className="text-sm text-muted-foreground mt-1">{content.featured.description || "No description available"}</p>
                      </div>
                      <Badge className="flex-shrink-0 bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Now Playing</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="text-foreground font-medium">{content.featured.instructor || "Platform Instructor"}</span>
                      <span>{content.featured.views || 0} views</span>
                    </div>
                    <div className="flex gap-2 mt-auto pt-1">
                      <Button size="sm" className="gap-1.5 rounded-xl flex-1 bg-primary hover:bg-primary/90">
                        <Play className="w-3.5 h-3.5 fill-current" /> Resume
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 rounded-xl">
                        <Download className="w-3.5 h-3.5" /> Download
                      </Button>
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
                        <p className="text-xs text-muted-foreground">{q.exam_year} Exam</p>
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
                        <p className="text-xs text-muted-foreground">{q.exam_year} Exam</p>
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

