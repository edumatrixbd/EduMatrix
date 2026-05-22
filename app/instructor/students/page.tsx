"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Users, 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  Mail,
  GraduationCap,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

export default function InstructorStudentsPage() {
  const [loading, setLoading] = React.useState(true)
  const [students, setStudents] = React.useState<any[]>([])
  const [search, setSearch] = React.useState("")

  React.useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: instCourses } = await supabase.from("instructor_courses").select("course_id").eq("instructor_id", user.id)
      const courseIds = instCourses?.map(c => c.course_id) || []

      if (courseIds.length > 0) {
        const { data: enrollData, error: enrollError } = await supabase
          .from("course_enrollments")
          .select(`
            enrolled_at,
            last_accessed_at,
            student:students(name, email, registration_number),
            course:courses(course_name, course_code)
          `)
          .in("course_id", courseIds)
        
        if (enrollError) throw enrollError
        setStudents(enrollData || [])
      }
    } catch (error) {
      console.error("Error fetching students:", error)
      toast.error("Failed to load students")
    } finally {
      setLoading(false)
    }
  }

  const handleEmailAll = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Preparing broadcast email...',
        success: 'Email portal opened for your students',
        error: 'Failed to open email portal'
      }
    )
  }

  const handleViewProgress = (name: string) => {
    toast.info(`Detailed progress tracking for "${name}" is coming soon.`)
  }

  const filteredStudents = students.filter(s => 
    s.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.course?.course_name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin" /></div>

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">My Students</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Engage with students enrolled in your assigned courses.</p>
      </motion.div>

      {/* Filters */}
      <Card className="border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 backdrop-blur-md">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              placeholder="Search student or course..." 
              className="pl-9 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:border-primary/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs h-10 hover:bg-slate-100 dark:hover:bg-white/10">
            <Filter className="w-4 h-4 mr-2" /> All Courses
          </Button>
          <Button 
            onClick={handleEmailAll}
            className="bg-primary hover:bg-primary/90 text-xs h-10"
          >
            <Mail className="w-4 h-4 mr-2" /> Email All
          </Button>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 backdrop-blur-md overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-slate-200 dark:border-white/5">
                  <TableHead className="w-[300px]">Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Enrolled At</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                      No students found in your courses.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((s, idx) => (
                    <TableRow key={idx} className="border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/[0.01] transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-slate-200 dark:border-white/10">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                              {s.student?.name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-200 truncate">{s.student?.name}</span>
                            <span className="text-[10px] text-slate-500 truncate">{s.student?.registration_number}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                            <BookOpen className="w-3 h-3" />
                          </div>
                          <span className="text-xs text-slate-700 dark:text-slate-300">{s.course?.course_code}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(s.enrolled_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {s.last_accessed_at ? formatDistanceToNow(new Date(s.last_accessed_at), { addSuffix: true }) : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleViewProgress(s.student?.name)}
                          className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        >
                          <GraduationCap className="w-4 h-4" />
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
