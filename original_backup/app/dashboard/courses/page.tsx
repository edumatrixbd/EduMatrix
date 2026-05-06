"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Search, ArrowRight, Star } from "lucide-react"
import Link from "next/link"

const courses = [
  { id: 1, name: "Data Structures", semester: 2, progress: 100, rating: 4.8, students: 450, status: "completed" },
  { id: 2, name: "Database Systems", semester: 3, progress: 100, rating: 4.9, students: 420, status: "completed" },
  { id: 3, name: "Web Development", semester: 4, progress: 100, rating: 4.7, students: 380, status: "completed" },
  { id: 4, name: "Operating Systems", semester: 3, progress: 85, rating: 4.6, students: 410, status: "current" },
  { id: 5, name: "Software Engineering", semester: 5, progress: 60, rating: 4.5, students: 350, status: "current" },
  { id: 6, name: "Computer Networks", semester: 5, progress: 45, rating: 4.7, students: 390, status: "current" },
  { id: 7, name: "Artificial Intelligence", semester: 6, progress: 20, rating: 4.8, students: 300, status: "upcoming" },
  { id: 8, name: "Cybersecurity", semester: 7, progress: 0, rating: 4.6, students: 280, status: "upcoming" },
]

export default function CoursesPage() {
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
          <h1 className="text-3xl font-bold text-foreground">All Courses</h1>
          <p className="text-muted-foreground mt-1">Browse and manage all your courses</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          className="pl-10 h-10"
        />
      </motion.div>

      {/* Courses Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {courses.map((course, index) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <CardTitle className="line-clamp-2">{course.name}</CardTitle>
                  <CardDescription className="mt-1">Semester {course.semester}</CardDescription>
                </div>
                {course.status === "completed" && (
                  <Badge className="bg-emerald-100 text-emerald-700 shrink-0">✓ Done</Badge>
                )}
                {course.status === "current" && (
                  <Badge className="bg-primary text-primary-foreground shrink-0">Current</Badge>
                )}
                {course.status === "upcoming" && (
                  <Badge variant="secondary" className="shrink-0">Coming</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-2" />
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{course.rating}</span>
                </div>
                <span className="text-muted-foreground">{course.students} students</span>
              </div>

              <Link href={`/dashboard/course/${course.id}`}>
                <Button className="w-full" variant="outline">
                  View Course
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  )
}
