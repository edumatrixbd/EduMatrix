"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  BookOpen, 
  Users, 
  DollarSign, 
  TrendingUp, 
  BarChart2, 
  ExternalLink,
  ChevronRight,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function InstructorCoursesPage() {
  const [loading, setLoading] = React.useState(true)
  const [courses, setCourses] = React.useState<any[]>([])

  React.useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("instructor_courses")
        .select(`
          revenue_share_percentage,
          course:courses(id, course_name, course_code),
          course_id
        `)
        .eq("instructor_id", user.id)

      if (error) {
        console.error("Error fetching courses:", error)
        throw error
      }

      if (!data || data.length === 0) {
        setCourses([])
        return
      }

      // Enrich with enrollment counts (Sales tracking currently simplified/mocked)
      const enriched = await Promise.all(data.map(async (item: any) => {
        try {
          const { count: enrollCount } = await supabase
            .from("course_enrollments")
            .select("*", { count: 'exact', head: true })
            .eq("course_id", item.course_id)
          
          return {
            ...item.course,
            share: item.revenue_share_percentage,
            students: enrollCount || 0,
            earnings: (enrollCount || 0) * (item.course?.price || 0) * (item.revenue_share_percentage / 100)
          }
        } catch (e) {
          return { ...item.course, students: 0, earnings: 0, share: item.revenue_share_percentage }
        }
      }))

      setCourses(enriched)
    } catch (error) {
      console.error("Instructor Courses Fetch Failure:", error)
      toast.error("Failed to load courses")
    } finally {
      setLoading(false)
    }
  }

  const handleAnalytics = (courseName: string) => {
    toast.info(`Detailed analytics for "${courseName}" are being prepared for the next version.`)
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin" /></div>

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-500">
          <BookOpen className="w-8 h-8" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium">No Courses Assigned</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2">
            You don't have any courses assigned yet. Please contact the administration if you believe this is an error.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">My Courses</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and track performance for your assigned courses.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 backdrop-blur-md hover:border-primary/30 transition-all group">
            <CardHeader className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary ring-1 ring-white/10">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{course.course_code}</CardTitle>
                    <CardDescription className="text-slate-500 line-clamp-1">{course.course_name}</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Students</p>
                  <p className="text-lg font-bold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary" /> {course.students}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Your Share</p>
                  <p className="text-lg font-bold flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> {course.share}%
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Earnings</p>
                  <p className="text-lg font-bold flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-primary" /> ৳{Math.round(course.earnings || 0)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Monthly Enrollment Target</span>
                  <span className="text-primary font-bold">85%</span>
                </div>
                <Progress value={85} className="h-2 bg-slate-50 dark:bg-white/5" />
              </div>

              <div className="pt-4 flex items-center gap-2">
                <Button 
                  onClick={() => handleAnalytics(course.course_name)}
                  className="flex-1 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 text-xs"
                >
                  <BarChart2 className="w-3.5 h-3.5 mr-2" /> Course Analytics
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
