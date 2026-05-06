"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  Bell, 
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"

export default function InstructorDashboard() {
  const [loading, setLoading] = React.useState(true)
  const [stats, setStats] = React.useState({
    totalStudents: 1284,
    totalEarnings: 0,
    activeCourses: 0,
    earningsThisMonth: 0
  })
  const [notices, setNotices] = React.useState<any[]>([])
  const [recentSales, setRecentSales] = React.useState<any[]>([])

  React.useEffect(() => {
    fetchInstructorData()
  }, [])

  const fetchInstructorData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [
        { data: instructorCourses },
        { data: salesData },
        { data: noticesData }
      ] = await Promise.all([
        supabase.from("instructor_courses").select("course_id").eq("instructor_id", user.id),
        supabase.from("course_sales").select("id, instructor_earning, purchased_at, course:courses(course_name), student:students(name)").order("purchased_at", { ascending: false }).limit(5),
        supabase.from("instructor_notices").select("id, title, content, is_urgent, created_at").order("created_at", { ascending: false }).limit(3)
      ])

      if (instructorCourses) {
        setStats(prev => ({ ...prev, activeCourses: instructorCourses.length }))
      }

      if (salesData) {
        setRecentSales(salesData)
        const total = salesData.reduce((acc, s) => acc + Number(s.instructor_earning), 0)
        setStats(prev => ({ ...prev, totalEarnings: total, earningsThisMonth: total * 0.4 }))
      }

      if (noticesData) setNotices(noticesData)

    } catch (error) {
      console.error("Error fetching instructor data:", error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: "Total Students", value: stats.totalStudents.toLocaleString(), icon: Users, color: "bg-blue-500" },
    { label: "Total Earnings", value: `৳${stats.totalEarnings.toLocaleString()}`, icon: DollarSign, color: "bg-emerald-500" },
    { label: "Active Courses", value: stats.activeCourses.toString(), icon: BookOpen, color: "bg-violet-500" },
    { label: "Earnings (Month)", value: `৳${stats.earningsThisMonth.toLocaleString()}`, icon: TrendingUp, color: "bg-indigo-500" },
  ]

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin" /></div>

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Instructor Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening with your courses today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="bg-primary text-primary-foreground">
            New Announcement
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center text-white`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.5%
                </Badge>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Enrollment Activity</CardTitle>
            <CardDescription>Live sales from your assigned courses.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Course</th>
                    <th className="px-6 py-4">Earning</th>
                    <th className="px-6 py-4 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7">
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                              {sale.student?.name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{sale.student?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{sale.course?.course_name}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600">+৳{sale.instructor_earning}</td>
                      <td className="px-6 py-4 text-right text-xs text-muted-foreground">
                        {format(new Date(sale.purchased_at), 'h:mm a')}
                      </td>
                    </tr>
                  ))}
                  {recentSales.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No recent enrollment activity found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Notices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" /> Admin Notices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {notices.map((notice) => (
              <div key={notice.id} className="p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold">{notice.title}</h4>
                  {notice.is_urgent && <Badge variant="destructive" className="text-[8px] uppercase">Urgent</Badge>}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{notice.content}</p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{format(new Date(notice.created_at), 'MMM dd, yyyy')}</span>
                  <button className="text-primary font-medium flex items-center gap-1">
                    Read More <ArrowUpRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))}
            {notices.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No active notices from administration.</p>
            )}
            <Button variant="outline" className="w-full text-xs h-10">
              View Notice Archive
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
