"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  ClipboardList, 
  Search, 
  Filter, 
  BookOpen, 
  User, 
  Calendar, 
  BarChart2,
  Clock,
  ExternalLink,
  Loader2,
  ChevronDown
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"

export default function AdminEnrollmentsPage() {
  const [loading, setLoading] = React.useState(true)
  const [enrollments, setEnrollments] = React.useState<any[]>([])
  const [courses, setCourses] = React.useState<any[]>([])
  const [search, setSearch] = React.useState("")
  const [selectedCourse, setSelectedCourse] = React.useState<string>("all")

  React.useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = createClient()
      
      const [{ data: enrollData }, { data: courseData }] = await Promise.all([
        supabase
          .from("course_enrollments")
          .select(`
            *,
            student:students(name, email, registration_number),
            course:courses(course_name, course_code)
          `)
          .order("enrolled_at", { ascending: false }),
        supabase
          .from("courses")
          .select("id, course_name, course_code")
      ])
      
      if (enrollData) setEnrollments(enrollData)
      if (courseData) setCourses(courseData)
    } catch (error: any) {
      console.error("Error fetching enrollments:", JSON.stringify(error, null, 2))
      if (error?.code === "42P01" || error?.code === "PGRST205") {
        toast.error("Database table 'course_enrollments' missing. Please run the SQL script.")
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredEnrollments = enrollments.filter(e => {
    const matchesSearch = 
      e.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.student?.registration_number?.toLowerCase().includes(search.toLowerCase()) ||
      e.course?.course_name?.toLowerCase().includes(search.toLowerCase())
    
    const matchesCourse = selectedCourse === "all" || e.course_id === selectedCourse
    
    return matchesSearch && matchesCourse
  })

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin" /></div>

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Course Enrollments</h1>
        <p className="text-muted-foreground mt-1">Manage and track student progress across all courses.</p>
      </motion.div>

      {/* Filters */}
      <Card className="border-white/5 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search student or course..." 
              className="pl-9 bg-muted/30 border-white/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-full md:w-[240px] bg-muted/30 border-white/10">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10">
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.course_code} - {course.course_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-white/10 w-full md:w-auto">
            <Calendar className="w-4 h-4 mr-2" /> Date Range
          </Button>
        </CardContent>
      </Card>

      {/* Enrollments Table */}
      <Card className="border-white/5 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-[280px]">Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Enrolled Date</TableHead>
                  <TableHead className="w-[200px]">Progress</TableHead>
                  <TableHead>Last Accessed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No enrollments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEnrollments.map((e) => (
                    <TableRow key={e.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{e.student?.name}</span>
                          <span className="text-xs text-muted-foreground">ID: {e.student?.registration_number || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                            <BookOpen className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{e.course?.course_code}</span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{e.course?.course_name}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {e.enrolled_at ? format(new Date(e.enrolled_at), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground font-medium">{e.progress}% Complete</span>
                            <span className="text-primary">{e.progress}/100</span>
                          </div>
                          <Progress value={e.progress} className="h-1.5 bg-white/5" />
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {e.last_accessed_at ? format(new Date(e.last_accessed_at), 'MMM dd, HH:mm') : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "text-[10px] uppercase font-bold",
                          e.status === 'completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                          e.status === 'dropped' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                          "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        )}>
                          {e.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
