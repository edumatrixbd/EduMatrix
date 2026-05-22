"use client"

import { useEffect, useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { swrKeys } from "@/lib/swr/keys"
import { supabaseFetcher } from "@/lib/swr/fetcher"
import { useAuth } from "@/hooks/use-auth"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  Video,
  FileQuestion,
  Lightbulb,
  ArrowRight,
  Clock,
  TrendingUp,
  Target,
  Calendar,
} from "lucide-react"
import { TiltCard } from "@/components/animations/tilt-card"
import { useToast } from "@/components/ui/use-toast"
import { Empty, EmptyMedia, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty"

// Lazy-load Recharts — saves ~80KB from initial bundle
const DashboardChart = dynamic(
  () => import("@/components/dashboard/activity-chart"),
  { ssr: false, loading: () => <div className="h-[300px] w-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div> }
)

const quickLinks = [
  { icon: Video, label: "Video Lectures", href: "/dashboard/videos" },
  { icon: FileQuestion, label: "Previous Questions", href: "/dashboard/questions" },
  { icon: Lightbulb, label: "Exam Suggestions", href: "/dashboard/suggestions" },
  { icon: BookOpen, label: "Study Notes", href: "/dashboard/notes" },
]



interface Course {
  id: string
  semester: number | null
}

interface DashboardCounts {
  courses: number
  questions: number
  videos: number
  notes: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { user: profile, isLoading: authLoading } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Redirect instructors to instructor panel
  useEffect(() => {
    if (!authLoading && profile?.role === 'instructor') {
      router.push("/instructor")
    }
  }, [profile, authLoading, router])

  // SWR for Stats
  const { data: countsData } = useSWR(
    profile ? swrKeys.dashboard.stats(profile.university_id, profile.department_id, profile.batch_id) : null, 
    supabaseFetcher, 
    {
      revalidateOnFocus: false,
      refreshInterval: 60000 // Refresh every minute
    }
  )

  // SWR for Recent Uploads
  const { data: recentUploadsRaw } = useSWR(
    profile ? swrKeys.dashboard.recentUploads(profile.university_id, profile.department_id, profile.batch_id) : null, 
    supabaseFetcher, 
    {
      revalidateOnFocus: false
    }
  )

  useEffect(() => {
    // Check for welcome flag
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get("welcome") === "true") {
      toast({
        title: "Welcome to tensionনাই! 🎉",
        description: "Your email has been successfully verified.",
        duration: 5000,
      })
      // Clean up URL without reloading
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }

    const fetchInitialData = async () => {
      try {
        const supabase = createClient()
        // We only need courses here, profile is handled by useAuth
        const { data: coursesRes } = await supabase
          .from('courses')
          .select('id, semester')
          .eq('status', 'active')
          .eq('university_id', profile?.university_id || '')
          .eq('department_id', profile?.department_id || '')
          .eq('batch_id', profile?.batch_id || '')
        
        if (coursesRes) {
          setCourses(coursesRes)
        }
      } catch (error) {
        console.error("Error fetching initial dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  // Optimized derived data
  const counts = useMemo(() => ({
    courses: countsData?.courses || courses.length || 0,
    questions: countsData?.questions || 0,
    videos: countsData?.videos || 0,
    notes: countsData?.notes || 0,
  }), [countsData, courses])

  const recentUploadsData = useMemo(() => {
    if (!recentUploadsRaw) return []
    return recentUploadsRaw.map((u: any) => ({
      ...u,
      course: u.courses?.course_name,
      time: u.created_at ? formatDistanceToNow(new Date(u.created_at), { addSuffix: true }) : "recently"
    }))
  }, [recentUploadsRaw])

  const contentUpdatesData = useMemo(() => {
    if (!recentUploadsRaw) return []
    const last7Days = new Map<string, number>()
    const today = new Date()
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      last7Days.set(dateStr, 0)
    }

    recentUploadsRaw.forEach((u: any) => {
      const d = new Date(u.created_at)
      const dateStr = d.toISOString().split('T')[0]
      if (last7Days.has(dateStr)) {
        last7Days.set(dateStr, last7Days.get(dateStr)! + 1)
      }
    })

    return Array.from(last7Days.entries()).map(([dateStr, count]) => {
      const d = new Date(dateStr)
      return {
        day: days[d.getDay()],
        items: count
      }
    })
  }, [recentUploadsRaw])

  const stats = [
    { label: "Courses", value: loading ? "..." : String(counts.courses), icon: BookOpen },
    { label: "Questions", value: loading ? "..." : String(counts.questions), icon: Target },
    { label: "Videos", value: loading ? "..." : String(counts.videos), icon: Clock },
    { label: "Notes", value: loading ? "..." : String(counts.notes), icon: TrendingUp },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Welcome back!</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm font-bold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-primary" />
              {profile?.university || "No University"}
            </span>
            <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
            <span>{profile?.department || "No Department"}</span>
            <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
            <span className="text-primary">Batch {profile?.batch || "N/A"}</span>
          </div>
        </div>
        <Badge className="w-fit bg-primary/10 text-primary border-primary/20 px-3 py-1 font-black">
          <Calendar className="w-3.5 h-3.5 mr-1.5" />
          Semester {profile?.semester || "N/A"}
        </Badge>
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {quickLinks.map((link) => (
          <Link key={link.label} href={link.href} className="block h-full">
            <TiltCard maxTilt={10} scale={1.05} glare={true} className="h-full">
              <div className="relative h-full group overflow-hidden rounded-2xl p-6 text-white cursor-pointer transition-all bg-[#0B0B0B] border border-white/5 hover:border-[#FFB00F]/50 hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_0_20px_-5px_rgba(255,176,15,0.4)]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFB00F]/10 via-transparent to-[#FF3B30]/5 opacity-30 group-hover:opacity-50 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-[#FFB00F]/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <link.icon className="w-6 h-6 text-[#FFB00F]" />
                  </div>
                  <p className="font-bold text-sm text-white drop-shadow-sm">{link.label}</p>
                </div>
              </div>
            </TiltCard>
          </Link>
        ))}
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-white dark:bg-[#0B0B0B]/60 border-black/[0.08] dark:border-[#FFB00F]/10 hover:border-[#FFB00F]/30 shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-none transition-all group">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#555555] dark:text-white/50 font-medium">{stat.label}</p>
                  <p className="text-2xl font-black text-[#111111] dark:text-white mt-1">{stat.value}</p>
                </div>
                <div className="p-3 bg-[#FFB00F]/10 rounded-xl group-hover:scale-110 transition-transform">
                  <stat.icon className="w-5 h-5 text-[#FFB00F]" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Activity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.18 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>New Content Added</CardTitle>
            <CardDescription>Resources uploaded over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardChart data={contentUpdatesData} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Uploads Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recently Added Materials</CardTitle>
            <CardDescription>Latest content available for your courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentUploadsData.length === 0 ? (
                <Empty className="py-8 border-none">
                  <EmptyMedia variant="icon">
                    <Video className="w-5 h-5 text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>No recent uploads</EmptyTitle>
                    <EmptyDescription>
                      There hasn't been any new study material uploaded to the platform recently.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
               recentUploadsData.map((upload, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/5 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#FFB00F]/10 text-[#FFB00F]"
                  >
                    {upload.type === "video" ? (
                      <Video className="w-5 h-5" />
                    ) : upload.type === "question" ? (
                      <FileQuestion className="w-5 h-5" />
                    ) : (
                      <BookOpen className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#111111] dark:text-white truncate">{upload.title}</p>
                    <p className="text-xs text-[#555555] dark:text-white/40">
                      {upload.course} • {upload.time}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize text-[10px] border-black/10 dark:border-white/10 text-[#555555] dark:text-white/40">
                    {upload.type}
                  </Badge>
                </div>
              )))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
