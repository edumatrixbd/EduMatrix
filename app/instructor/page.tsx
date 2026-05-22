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
import { TopPerformingCourses } from "@/components/analytics/top-performing-courses"
import { AnalyticsAlerts } from "@/components/analytics/analytics-alerts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  getTopPerformingCourses, 
  getDropOffAlerts, 
  getEngagementWarnings 
} from "@/lib/admin/analytics"

export default function InstructorDashboard() {
  const [loading, setLoading] = React.useState(true)
  const [stats, setStats] = React.useState({
    totalStudents: 0,
    totalEarnings: 0,
    activeCourses: 0,
    earningsThisMonth: 0
  })
  const [notices, setNotices] = React.useState<any[]>([])
  const [recentSales, setRecentSales] = React.useState<any[]>([])
  const [performance, setPerformance] = React.useState<any[]>([])
  const [dropOffs, setDropOffs] = React.useState<any[]>([])
  const [warnings, setWarnings] = React.useState<any[]>([])

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
        { data: noticesData },
        perfData,
        dropOffData,
        warningData
      ] = await Promise.all([
        supabase.from("instructor_courses").select("course_id").eq("instructor_id", user.id),
        supabase.from("course_sales").select("id, instructor_earning, purchased_at, course:courses(course_name), student:students(name)").order("purchased_at", { ascending: false }).limit(5),
        supabase.from("instructor_notices").select("id, title, content, is_urgent, created_at").order("created_at", { ascending: false }).limit(3),
        getTopPerformingCourses(user.id),
        getDropOffAlerts(user.id),
        getEngagementWarnings(user.id)
      ])

      if (instructorCourses && instructorCourses.length > 0) {
        setStats(prev => ({ ...prev, activeCourses: instructorCourses.length }))
        
        // Count distinct students across all their courses
        const courseIds = instructorCourses.map((c: any) => c.course_id)
        const { data: enrollments, error: enrollError } = await supabase
          .from("course_enrollments")
          .select("student_id")
          .in("course_id", courseIds)
          .eq("status", "active")
        
        if (enrollError) {
          console.error("Error fetching instructor students:", enrollError)
        } else {
          const uniqueStudents = new Set(enrollments?.map(e => e.student_id)).size
          setStats(prev => ({ ...prev, totalStudents: uniqueStudents }))
        }
      }

      if (salesData) {
        setRecentSales(salesData)
        const total = salesData.reduce((acc: any, s: any) => acc + Number(s.instructor_earning || 0), 0)
        
        // Calculate this month's earnings
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)
        
        const thisMonthTotal = salesData
          .filter((s: any) => new Date(s.purchased_at) >= startOfMonth)
          .reduce((acc: any, s: any) => acc + Number(s.instructor_earning || 0), 0)
          
        setStats(prev => ({ ...prev, totalEarnings: total, earningsThisMonth: thisMonthTotal }))
      }

      if (noticesData) setNotices(noticesData)
      
      setPerformance(perfData || [])
      setDropOffs(dropOffData || [])
      setWarnings(warningData || [])

    } catch (error) {
      console.error("Error fetching instructor data:", error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: "Total Students", value: stats.totalStudents.toLocaleString(), icon: Users },
    { label: "Total Earnings", value: `৳${stats.totalEarnings.toLocaleString()}`, icon: DollarSign },
    { label: "Active Courses", value: stats.activeCourses.toString(), icon: BookOpen },
    { label: "Earnings (Month)", value: `৳${stats.earningsThisMonth.toLocaleString()}`, icon: TrendingUp },
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
          <Card key={i} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-[#FFB00F]/10 hover:border-[#FFB00F]/40 shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-none transition-all group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#FFB00F]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <stat.icon className="w-6 h-6 text-[#FFB00F]" />
                </div>
                <Badge variant="secondary" className="bg-[#FF3B30]/10 text-[#FF3B30] border-none font-black text-[10px] uppercase">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.5%
                </Badge>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-slate-500 dark:text-white/50 font-bold uppercase tracking-wider text-[10px] mt-1">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actionable Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnalyticsAlerts dropOffs={dropOffs} warnings={warnings} />
        <TopPerformingCourses courses={performance} />
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
              <div key={notice.id} className="p-4 rounded-xl border border-black/[0.08] dark:border-[#FFB00F]/10 bg-white dark:bg-black/40 shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-none hover:border-[#FFB00F]/40 transition-all group">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{notice.title}</h4>
                  {notice.is_urgent && <Badge className="bg-[#FF3B30] text-white text-[8px] uppercase border-none font-black">Urgent</Badge>}
                </div>
                <p className="text-xs text-slate-500 dark:text-white/40 line-clamp-2 mb-2 font-medium">{notice.content}</p>
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
