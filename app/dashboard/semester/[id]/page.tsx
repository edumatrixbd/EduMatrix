"use client"

import { use } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  BookOpen,
  Video,
  FileQuestion,
  FileText,
  Clock,
  Users,
  Star,
  BookX,
} from "lucide-react"
import { Empty, EmptyMedia, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty"

const semesterData: Record<string, { name: string; subjects: Array<{
  id: string
  name: string
  code: string
  videos: number
  questions: number
  notes: number
  progress: number
  rating: number
  students: number
  color: string
}> }> = {
  "1": {
    name: "Semester 1",
    subjects: [
      { id: "cse101", name: "Programming Fundamentals", code: "CSE 101", videos: 32, questions: 45, notes: 12, progress: 100, rating: 4.8, students: 1250, color: "from-blue-500 to-blue-600" },
      { id: "phy101", name: "Physics", code: "PHY 101", videos: 28, questions: 38, notes: 10, progress: 100, rating: 4.5, students: 1100, color: "from-purple-500 to-purple-600" },
      { id: "mat101", name: "Mathematics I", code: "MAT 101", videos: 35, questions: 52, notes: 15, progress: 100, rating: 4.7, students: 1300, color: "from-emerald-500 to-emerald-600" },
      { id: "eng101", name: "English Composition", code: "ENG 101", videos: 20, questions: 25, notes: 8, progress: 100, rating: 4.3, students: 980, color: "from-amber-500 to-amber-600" },
      { id: "cse102", name: "Computer Fundamentals", code: "CSE 102", videos: 25, questions: 35, notes: 10, progress: 100, rating: 4.6, students: 1150, color: "from-cyan-500 to-cyan-600" },
      { id: "che101", name: "Chemistry", code: "CHE 101", videos: 22, questions: 30, notes: 9, progress: 100, rating: 4.4, students: 1050, color: "from-rose-500 to-rose-600" },
    ],
  },
  "6": {
    name: "Semester 6",
    subjects: [
      { id: "cse601", name: "Web Development", code: "CSE 601", videos: 45, questions: 60, notes: 18, progress: 65, rating: 4.9, students: 890, color: "from-blue-500 to-indigo-600" },
      { id: "cse602", name: "Artificial Intelligence", code: "CSE 602", videos: 38, questions: 48, notes: 15, progress: 45, rating: 4.8, students: 920, color: "from-purple-500 to-pink-600" },
      { id: "cse603", name: "Computer Graphics", code: "CSE 603", videos: 32, questions: 42, notes: 12, progress: 30, rating: 4.6, students: 780, color: "from-emerald-500 to-teal-600" },
      { id: "cse604", name: "Information Security", code: "CSE 604", videos: 28, questions: 38, notes: 11, progress: 55, rating: 4.7, students: 850, color: "from-red-500 to-rose-600" },
      { id: "cse605", name: "Mobile App Development", code: "CSE 605", videos: 40, questions: 52, notes: 14, progress: 40, rating: 4.8, students: 910, color: "from-cyan-500 to-blue-600" },
      { id: "cse606", name: "Software Project Management", code: "CSE 606", videos: 25, questions: 35, notes: 10, progress: 35, rating: 4.5, students: 760, color: "from-amber-500 to-orange-600" },
    ],
  },
}

// Default data for other semesters
const defaultSubjects = [
  { id: "sub1", name: "Data Structures", code: "CSE 201", videos: 40, questions: 55, notes: 14, progress: 100, rating: 4.8, students: 1200, color: "from-blue-500 to-blue-600" },
  { id: "sub2", name: "Object Oriented Programming", code: "CSE 202", videos: 35, questions: 48, notes: 12, progress: 100, rating: 4.7, students: 1150, color: "from-purple-500 to-purple-600" },
  { id: "sub3", name: "Digital Logic Design", code: "CSE 203", videos: 30, questions: 42, notes: 11, progress: 100, rating: 4.6, students: 1080, color: "from-emerald-500 to-emerald-600" },
  { id: "sub4", name: "Discrete Mathematics", code: "MAT 201", videos: 28, questions: 40, notes: 10, progress: 100, rating: 4.5, students: 1020, color: "from-amber-500 to-amber-600" },
  { id: "sub5", name: "Electronics", code: "EEE 201", videos: 25, questions: 35, notes: 9, progress: 100, rating: 4.4, students: 950, color: "from-cyan-500 to-cyan-600" },
  { id: "sub6", name: "Statistics", code: "MAT 202", videos: 22, questions: 32, notes: 8, progress: 100, rating: 4.3, students: 900, color: "from-rose-500 to-rose-600" },
]

export default function SemesterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const data = semesterData[id] || { name: `Semester ${id}`, subjects: defaultSubjects }

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
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{data.name}</h1>
            <p className="text-muted-foreground">
              {data.subjects.length} courses available
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="w-fit bg-primary/10 text-primary border-primary/20 px-3 py-1">
          <BookOpen className="w-3.5 h-3.5 mr-1.5" />
          {data.subjects.reduce((acc, s) => acc + s.videos + s.questions + s.notes, 0)}+ Resources
        </Badge>
      </motion.div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.subjects.length === 0 ? (
          <div className="col-span-full">
            <Empty className="py-12 border-none">
              <EmptyMedia variant="icon">
                <BookX className="w-8 h-8 text-muted-foreground" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No courses found</EmptyTitle>
                <EmptyDescription>
                  There are no courses currently available for {data.name}. Check back later!
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          data.subjects.map((subject, index) => (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={`/dashboard/course/${subject.id}`}>
                <Card className="h-full hover:shadow-premium transition-all duration-300 hover:border-primary/30 cursor-pointer group overflow-hidden">
                  {/* Header with gradient */}
                  <div className={`h-3 bg-gradient-to-r ${subject.color}`} />
                  
                  <CardContent className="p-6">
                    {/* Course Code Badge */}
                    <Badge variant="secondary" className="mb-3 text-xs">
                      {subject.code}
                    </Badge>

                    {/* Course Name */}
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-3">
                      {subject.name}
                    </h3>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <Video className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                        <div className="text-sm font-semibold text-foreground">{subject.videos}</div>
                        <div className="text-xs text-muted-foreground">Videos</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <FileQuestion className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                        <div className="text-sm font-semibold text-foreground">{subject.questions}</div>
                        <div className="text-xs text-muted-foreground">Questions</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <FileText className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                        <div className="text-sm font-semibold text-foreground">{subject.notes}</div>
                        <div className="text-xs text-muted-foreground">Notes</div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Your Progress</span>
                        <span className="font-medium text-foreground">{subject.progress}%</span>
                      </div>
                      <Progress value={subject.progress} className="h-2" />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium text-foreground">{subject.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{subject.students.toLocaleString()} students</span>
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
