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
  { icon: Video, label: "Video Lectures", href: "/dashboard/videos", color: "from-blue-500 via-indigo-500 to-purple-500" },
  { icon: FileQuestion, label: "Previous Questions", href: "/dashboard/questions", color: "from-purple-500 via-fuchsia-500 to-pink-500" },
  { icon: Lightbulb, label: "Exam Suggestions", href: "/dashboard/suggestions", color: "from-pink-500 via-rose-500 to-orange-500" },
  { icon: BookOpen, label: "Study Notes", href: "/dashboard/notes", color: "from-emerald-400 via-teal-500 to-cyan-500" },
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
  const { user: profile, isLoading: authLoading } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // SWR for Stats
  const { data: countsData } = useSWR(swrKeys.dashboard.stats(), supabaseFetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000 // Refresh every minute
  })

  // SWR for Recent Uploads
  const { data: recentUploadsRaw } = useSWR(swrKeys.dashboard.recentUploads(), supabaseFetcher, {
    revalidateOnFocus: false
  })

  useEffect(() => {
    // Check for welcome flag
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get("welcome") === "true") {
      toast({
        title: "Welcome to EduMatrix! 🎉",
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

  const semesters = Array.from({ length: 8 }, (_, index) => {
    const id = index + 1
    const semesterCourses = courses.filter((course) => course.semester === id).length
    const status = semesterCourses > 0 ? "current" : "upcoming"

    return {
      id,
      name: `Semester ${id}`,
      courses: semesterCourses,
      progress: semesterCourses > 0 ? 25 : 0,
      status,
    }
  })

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
          <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
          <p className="text-muted-foreground mt-1">Continue your exam preparation</p>
        </div>
        <Badge className="w-fit bg-primary/10 text-primary border-primary/20 px-3 py-1">
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
              <div className={`relative h-full group overflow-hidden rounded-lg p-6 text-white cursor-pointer transition-all hover:shadow-premium hover:shadow-${link.color.split('-')[1]}-500/50 bg-gradient-to-br ${link.color}`}>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                <div className="relative z-10">
                  <link.icon className="w-6 h-6 mb-3 drop-shadow-md" />
                  <p className="font-semibold text-sm drop-shadow-md">{link.label}</p>
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
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <stat.icon className="w-5 h-5 text-primary" />
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

      {/* Semesters Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>All Semesters</CardTitle>
              <CardDescription>Track your progress across all semesters</CardDescription>
            </div>
            <Link href="/dashboard/courses">
              <Button variant="ghost" size="sm" className="text-primary">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {semesters.map((semester) => (
                <Link key={semester.id} href={`/dashboard/semester/${semester.id}`}>
                  <div className="p-4 rounded-lg border border-border/50 bg-card/50 hover:border-primary/50 hover:shadow-[0_0_15px_-3px_rgba(139,92,246,0.2)] transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-foreground text-sm">{semester.name}</h3>
                      {semester.status === "current" && (
                        <Badge className="bg-primary text-primary-foreground text-xs">Current</Badge>
                      )}
                      {semester.status === "upcoming" && (
                        <Badge variant="secondary" className="text-xs">Empty</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{semester.courses} Courses</p>
                    <Progress value={semester.progress} className="h-1.5" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Uploads Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
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
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      upload.type === "video"
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        : upload.type === "question"
                        ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                    }`}
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
                    <p className="font-medium text-foreground truncate">{upload.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {upload.course} • {upload.time}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
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
