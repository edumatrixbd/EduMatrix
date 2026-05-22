"use client"

import { use, useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Empty, EmptyMedia, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { 
  ArrowLeft, BookOpen, Loader2, BookX, Video, 
  FileQuestion, FileText, Star, Users 
} from "lucide-react"

export default function SemesterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: semesterId } = use(params)
  const { user: profile, isLoading: authLoading } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSemesterCourses() {
      if (!profile) return
      
      try {
        const supabase = createClient()
        // Fetch courses for this specific cohort and semester
        const { data, error } = await supabase
          .from('courses')
          .select(`
            *,
            videos:video_lectures(count),
            questions:previous_questions(count),
            notes:study_notes(count)
          `)
          .eq('university_id', profile.university_id)
          .eq('department_id', profile.department_id)
          .eq('batch_id', profile.batch_id)
          .eq('semester', parseInt(semesterId))
          .eq('status', 'active')
          .order('course_code', { ascending: true })

        if (error) throw error
        
        // Map data to include counts
        const mappedCourses = (data || []).map(course => ({
          ...course,
          videosCount: course.videos?.[0]?.count || 0,
          questionsCount: course.questions?.[0]?.count || 0,
          notesCount: course.notes?.[0]?.count || 0,
          progress: 0, // Default to 0 for now
          rating: 4.8, // Static placeholder for now
          students: 1200, // Static placeholder for now
          color: "from-blue-500 to-blue-600" // Default color
        }))

        setCourses(mappedCourses)
      } catch (error) {
        console.error("Error fetching semester courses:", error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchSemesterCourses()
    }
  }, [profile, authLoading, semesterId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-xl text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Semester {semesterId}</h1>
            <p className="text-muted-foreground">
              {courses.length} courses available
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="w-fit bg-primary/10 text-primary border-primary/20 px-3 py-1">
          <BookOpen className="w-3.5 h-3.5 mr-1.5" />
          {courses.reduce((acc, s) => acc + s.videosCount + s.questionsCount + s.notesCount, 0)}+ Resources
        </Badge>
      </motion.div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length === 0 ? (
          <div className="col-span-full">
            <Empty className="py-12 border-none">
              <EmptyMedia variant="icon">
                <BookX className="w-8 h-8 text-muted-foreground" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No courses found</EmptyTitle>
                <EmptyDescription>
                  There are no courses currently available for Semester {semesterId} in your department.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={`/dashboard/course/${course.id}`}>
                <Card className="h-full hover:shadow-premium transition-all duration-300 hover:border-primary/30 cursor-pointer group overflow-hidden">
                  {/* Header with gradient */}
                  <div className={`h-3 bg-gradient-to-r ${course.color}`} />
                  
                  <CardContent className="p-6">
                    {/* Course Code Badge */}
                    <Badge variant="secondary" className="mb-3 text-xs">
                      {course.course_code}
                    </Badge>

                    {/* Course Name */}
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-3">
                      {course.course_name}
                    </h3>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <Video className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                        <div className="text-sm font-semibold text-foreground">{course.videosCount}</div>
                        <div className="text-xs text-muted-foreground">Videos</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <FileQuestion className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                        <div className="text-sm font-semibold text-foreground">{course.questionsCount}</div>
                        <div className="text-xs text-muted-foreground">Questions</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <FileText className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                        <div className="text-sm font-semibold text-foreground">{course.notesCount}</div>
                        <div className="text-xs text-muted-foreground">Notes</div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Your Progress</span>
                        <span className="font-medium text-foreground">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium text-foreground">{course.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{course.students.toLocaleString()} students</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
