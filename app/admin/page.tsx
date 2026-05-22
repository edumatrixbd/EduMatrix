"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Activity,
  ArrowRight,
  BookOpen,
  FileQuestion,
  TrendingUp,
  Upload,
  UserPlus,
  Users,
  Video,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { 
  getTopPerformingCourses, 
  getPlatformOverview,
  getAdminActionableInsights
} from "@/lib/admin/analytics"
import { AdminActionableInsights } from "@/components/analytics/admin-actionable-insights"
import { TopPerformingCourses } from "@/components/analytics/top-performing-courses"

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState([
    { label: "Total Users", value: "0", change: "+0", trend: "up", icon: Users },
    { label: "Total Courses", value: "0", change: "+0", trend: "up", icon: BookOpen },
    { label: "Video Lectures", value: "0", change: "+0", trend: "up", icon: Video },
    { label: "Question Papers", value: "0", change: "+0", trend: "up", icon: FileQuestion },
  ])
  const [recentUsersData, setRecentUsersData] = useState<any[]>([])
  const [topCoursesData, setTopCoursesData] = useState<any[]>([])
  const [recentUploadsData, setRecentUploadsData] = useState<any[]>([])
  const [adminInsights, setAdminInsights] = useState({
    pendingPayments: 0,
    unreadFeedback: 0,
    rejectedPayments: 0,
    inactiveCourses: 0
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const supabase = createClient()
        setLoading(true)

        const [
          studentsRes, coursesRes, videosRes, questionsRes,
          recentUsersRes, 
          recentVideosRes, recentQuestionsRes, recentNotesRes,
          perfData, insightsData, overview
        ] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq('role', 'student'),
          supabase.from("courses").select("id", { count: "exact", head: true }),
          supabase.from("video_lectures").select("id", { count: "exact", head: true }),
          supabase.from("previous_questions").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("full_name, email, created_at, student_profiles(semester)").eq('role', 'student').order("created_at", { ascending: false }).limit(5),
          supabase.from("video_lectures").select("title, created_at, courses(course_name)").order("created_at", { ascending: false }).limit(2),
          supabase.from("previous_questions").select("question_text, created_at, courses(course_name)").order("created_at", { ascending: false }).limit(2),
          supabase.from("study_notes").select("title, created_at, courses(course_name)").order("created_at", { ascending: false }).limit(2),
          getTopPerformingCourses(),
          getAdminActionableInsights(),
          getPlatformOverview()
        ])

        setStats([
          { label: "Total Users", value: (studentsRes.count || 0).toString(), change: "+0", trend: "up", icon: Users },
          { label: "Total Courses", value: (coursesRes.count || 0).toString(), change: "+0", trend: "up", icon: BookOpen },
          { label: "Revenue", value: `৳${overview.totalRevenue.toLocaleString()}`, change: "+0", trend: "up", icon: TrendingUp },
          { label: "Video Lectures", value: (videosRes.count || 0).toString(), change: "+0", trend: "up", icon: Video },
        ])

        setRecentUsersData(recentUsersRes.data?.map(u => ({
          name: u.full_name,
          email: u.email,
          semester: u.student_profiles ? `Semester ${u.student_profiles.semester}` : "N/A",
          joinedAt: u.created_at ? formatDistanceToNow(new Date(u.created_at), { addSuffix: true }) : "recently"
        })) || [])

        setTopCoursesData(perfData || [])
        setAdminInsights(insightsData || {
          pendingPayments: 0,
          unreadFeedback: 0,
          rejectedPayments: 0,
          inactiveCourses: 0
        })

        const allUploads = [
          ...(recentVideosRes.data?.map(v => ({ type: "video", title: v.title, course: (v.courses as any)?.course_name, time: v.created_at })) || []),
          ...(recentQuestionsRes.data?.map(q => ({ type: "question", title: "Question Paper", course: (q.courses as any)?.course_name, time: q.created_at })) || []),
          ...(recentNotesRes.data?.map(n => ({ type: "note", title: n.title, course: (n.courses as any)?.course_name, time: n.created_at })) || []),
        ]

        allUploads.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        setRecentUploadsData(allUploads.slice(0, 4).map(u => ({
          ...u,
          time: u.time ? formatDistanceToNow(new Date(u.time), { addSuffix: true }) : "recently"
        })))

      } catch (error) {
        console.error("Error fetching admin dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here is what is happening with tensionনাই today.
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card border-border hover:border-primary/40 shadow-sm transition-all group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <Badge
                  variant="secondary"
                  className="bg-destructive/10 text-destructive border-none font-black text-[10px] uppercase"
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-black text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-bold uppercase tracking-wider text-[10px] mt-1">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>New students who joined the platform</CardDescription>
              </div>
              <Link href="/admin/students">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? <p className="text-sm text-muted-foreground text-center py-4">Loading users...</p> : 
                recentUsersData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No users found.</p> :
                recentUsersData.map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {user.name.split(" ").map((n: string) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="mb-1">{user.semester}</Badge>
                      <p className="text-xs text-muted-foreground">{user.joinedAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actionable Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <AdminActionableInsights 
            insights={adminInsights} 
          />
        </motion.div>

        {/* Top Performing Courses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <TopPerformingCourses courses={topCoursesData} />
        </motion.div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Uploads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Uploads</CardTitle>
                <CardDescription>Latest content added to the platform</CardDescription>
              </div>
              <Link href="/admin/upload">
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-1" />
                  Upload
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? <p className="text-sm text-muted-foreground text-center py-4">Loading uploads...</p> : 
                 recentUploadsData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No uploads yet.</p> :
                 recentUploadsData.map((upload, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
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
                      <p className="font-medium text-foreground truncate">{upload.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {upload.course} • {upload.time}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {upload.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Link href="/admin/students">
                <div className="p-4 rounded-xl bg-card border border-border hover:border-primary/40 shadow-sm transition-all cursor-pointer text-center group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-foreground text-sm">Manage Students</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">View & edit profiles</p>
                </div>
              </Link>

              <Link href="/admin/courses">
                <div className="p-4 rounded-xl bg-card border border-border hover:border-primary/40 shadow-sm transition-all cursor-pointer text-center group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-foreground text-sm">Manage Courses</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Add & edit courses</p>
                </div>
              </Link>

              <Link href="/admin/upload">
                <div className="p-4 rounded-xl bg-card border border-border hover:border-primary/40 shadow-sm transition-all cursor-pointer text-center group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-foreground text-sm">Upload Content</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Add new materials</p>
                </div>
              </Link>

              <Link href="/admin/analytics">
                <div className="p-4 rounded-xl bg-card border border-border hover:border-primary/40 shadow-sm transition-all cursor-pointer text-center group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Activity className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-foreground text-sm">View Analytics</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Platform insights</p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
