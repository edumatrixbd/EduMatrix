"use client"

import { motion } from "framer-motion"
import Link from "next/link"
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

const semesters = [
  { id: 1, name: "Semester 1", courses: 6, progress: 100, status: "completed" },
  { id: 2, name: "Semester 2", courses: 6, progress: 100, status: "completed" },
  { id: 3, name: "Semester 3", courses: 7, progress: 100, status: "completed" },
  { id: 4, name: "Semester 4", courses: 7, progress: 100, status: "completed" },
  { id: 5, name: "Semester 5", courses: 6, progress: 100, status: "completed" },
  { id: 6, name: "Semester 6", courses: 6, progress: 45, status: "current" },
  { id: 7, name: "Semester 7", courses: 5, progress: 0, status: "upcoming" },
  { id: 8, name: "Semester 8", courses: 4, progress: 0, status: "upcoming" },
]

const quickLinks = [
  { icon: Video, label: "Video Lectures", href: "/dashboard/videos", color: "from-blue-500 to-blue-600" },
  { icon: FileQuestion, label: "Previous Questions", href: "/dashboard/questions", color: "from-purple-500 to-purple-600" },
  { icon: Lightbulb, label: "Exam Suggestions", href: "/dashboard/suggestions", color: "from-amber-500 to-amber-600" },
  { icon: BookOpen, label: "Study Notes", href: "/dashboard/notes", color: "from-emerald-500 to-emerald-600" },
]

const stats = [
  { label: "Study Hours", value: "156h", icon: Clock },
  { label: "Courses", value: "24", icon: BookOpen },
  { label: "Questions", value: "89", icon: Target },
  { label: "Progress", value: "72%", icon: TrendingUp },
]

export default function DashboardPage() {
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
          Semester 6
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
          <Link key={link.label} href={link.href}>
            <div className={`relative group overflow-hidden rounded-lg p-6 text-white cursor-pointer transition-all hover:shadow-lg bg-gradient-to-br ${link.color}`}>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              <div className="relative z-10">
                <link.icon className="w-6 h-6 mb-3" />
                <p className="font-semibold text-sm">{link.label}</p>
              </div>
            </div>
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
                  <div className="p-4 rounded-lg border border-border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-foreground text-sm">{semester.name}</h3>
                      {semester.status === "current" && (
                        <Badge className="bg-primary text-primary-foreground text-xs">Current</Badge>
                      )}
                      {semester.status === "completed" && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                          ✓
                        </Badge>
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
    </div>
  )
}
