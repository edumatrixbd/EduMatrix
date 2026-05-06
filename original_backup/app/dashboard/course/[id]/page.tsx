"use client"

import { use, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Video,
  FileQuestion,
  Lightbulb,
  FileText,
  CheckCircle,
  Play,
  Download,
  Clock,
  Eye,
  BookOpen,
  Star,
  Calendar,
  ChevronRight,
} from "lucide-react"

const courseData = {
  id: "cse601",
  name: "Web Development",
  code: "CSE 601",
  semester: "Semester 6",
  description: "Learn modern web development with HTML, CSS, JavaScript, React, Next.js, and more.",
  instructor: "Dr. Rahman",
  rating: 4.9,
  students: 890,
  progress: 65,
}

const videos = [
  { id: 1, title: "Introduction to Web Development", duration: "15:30", views: 1250, completed: true },
  { id: 2, title: "HTML5 Fundamentals", duration: "22:45", views: 1180, completed: true },
  { id: 3, title: "CSS3 and Flexbox", duration: "28:15", views: 1050, completed: true },
  { id: 4, title: "JavaScript Basics", duration: "35:20", views: 980, completed: true },
  { id: 5, title: "DOM Manipulation", duration: "25:10", views: 920, completed: false },
  { id: 6, title: "React Introduction", duration: "32:45", views: 850, completed: false },
  { id: 7, title: "React Hooks Deep Dive", duration: "40:30", views: 780, completed: false },
  { id: 8, title: "Next.js Fundamentals", duration: "45:15", views: 720, completed: false },
]

const midtermQuestions = [
  { id: 1, title: "Midterm 2024 Spring", questions: 10, solved: true, year: "2024" },
  { id: 2, title: "Midterm 2023 Fall", questions: 8, solved: true, year: "2023" },
  { id: 3, title: "Midterm 2023 Spring", questions: 10, solved: true, year: "2023" },
  { id: 4, title: "Midterm 2022 Fall", questions: 9, solved: false, year: "2022" },
]

const finalQuestions = [
  { id: 1, title: "Final 2024 Spring", questions: 12, solved: true, year: "2024" },
  { id: 2, title: "Final 2023 Fall", questions: 15, solved: true, year: "2023" },
  { id: 3, title: "Final 2023 Spring", questions: 12, solved: false, year: "2023" },
  { id: 4, title: "Final 2022 Fall", questions: 14, solved: false, year: "2022" },
]

const suggestions = [
  { id: 1, title: "Important Topics for Midterm", type: "midterm", topics: 15, updated: "2 days ago" },
  { id: 2, title: "Final Exam Focus Areas", type: "final", topics: 20, updated: "1 week ago" },
  { id: 3, title: "Lab Exam Preparation", type: "lab", topics: 10, updated: "3 days ago" },
  { id: 4, title: "Viva Questions Bank", type: "viva", topics: 25, updated: "5 days ago" },
]

const notes = [
  { id: 1, title: "Complete HTML5 Notes", pages: 45, downloads: 1250, rating: 4.9 },
  { id: 2, title: "CSS3 Cheat Sheet", pages: 12, downloads: 980, rating: 4.8 },
  { id: 3, title: "JavaScript Concepts", pages: 65, downloads: 1100, rating: 4.7 },
  { id: 4, title: "React Fundamentals", pages: 55, downloads: 850, rating: 4.9 },
  { id: 5, title: "Next.js Guide", pages: 40, downloads: 720, rating: 4.8 },
]

const solvedAnswers = [
  { id: 1, title: "Midterm 2024 Solutions", questions: 10, type: "midterm", year: "2024" },
  { id: 2, title: "Final 2024 Solutions", questions: 12, type: "final", year: "2024" },
  { id: 3, title: "Lab Assignment Solutions", questions: 8, type: "lab", year: "2024" },
  { id: 4, title: "Previous Year Compilations", questions: 50, type: "compilation", year: "Mixed" },
]

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState("videos")

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:text-primary">Dashboard</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href={`/dashboard/semester/6`} className="hover:text-primary">{courseData.semester}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{courseData.name}</span>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{courseData.code}</Badge>
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    {courseData.semester}
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {courseData.name}
                </h1>
                <p className="text-muted-foreground max-w-2xl">
                  {courseData.description}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{courseData.instructor}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-foreground">{courseData.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{courseData.students} students</span>
                  </div>
                </div>
              </div>
              
              <div className="lg:min-w-[200px] space-y-3">
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Your Progress</span>
                    <span className="text-sm font-semibold text-foreground">{courseData.progress}%</span>
                  </div>
                  <Progress value={courseData.progress} className="h-2" />
                </div>
                <Button className="w-full">
                  <Play className="w-4 h-4 mr-2" />
                  Continue Learning
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full flex flex-wrap h-auto p-1 bg-muted/50">
            <TabsTrigger value="videos" className="flex-1 min-w-[100px] gap-2">
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">Videos</span>
            </TabsTrigger>
            <TabsTrigger value="midterm" className="flex-1 min-w-[100px] gap-2">
              <FileQuestion className="w-4 h-4" />
              <span className="hidden sm:inline">Midterm</span>
            </TabsTrigger>
            <TabsTrigger value="final" className="flex-1 min-w-[100px] gap-2">
              <FileQuestion className="w-4 h-4" />
              <span className="hidden sm:inline">Final</span>
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex-1 min-w-[100px] gap-2">
              <Lightbulb className="w-4 h-4" />
              <span className="hidden sm:inline">Suggestions</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex-1 min-w-[100px] gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Notes</span>
            </TabsTrigger>
            <TabsTrigger value="solved" className="flex-1 min-w-[100px] gap-2">
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Solved</span>
            </TabsTrigger>
          </TabsList>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Video Lectures</h2>
              <Badge variant="secondary">{videos.length} videos</Badge>
            </div>
            <div className="grid gap-4">
              {videos.map((video, index) => (
                <Card key={video.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${video.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                      {video.completed ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">#{index + 1}</span>
                        <h3 className="font-medium text-foreground truncate">{video.title}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {video.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {video.views} views
                        </span>
                      </div>
                    </div>
                    <Button variant={video.completed ? "outline" : "default"} size="sm">
                      {video.completed ? "Rewatch" : "Watch"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Midterm Questions Tab */}
          <TabsContent value="midterm" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Midterm Previous Questions</h2>
              <Badge variant="secondary">{midtermQuestions.length} papers</Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {midtermQuestions.map((paper) => (
                <Card key={paper.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                          <FileQuestion className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{paper.title}</h3>
                          <p className="text-xs text-muted-foreground">{paper.questions} questions</p>
                        </div>
                      </div>
                      <Badge variant="outline">{paper.year}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      {paper.solved ? (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Solutions Available
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Questions Only</span>
                      )}
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Final Questions Tab */}
          <TabsContent value="final" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Final Previous Questions</h2>
              <Badge variant="secondary">{finalQuestions.length} papers</Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {finalQuestions.map((paper) => (
                <Card key={paper.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                          <FileQuestion className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{paper.title}</h3>
                          <p className="text-xs text-muted-foreground">{paper.questions} questions</p>
                        </div>
                      </div>
                      <Badge variant="outline">{paper.year}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      {paper.solved ? (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Solutions Available
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Questions Only</span>
                      )}
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Exam Suggestions</h2>
              <Badge variant="secondary">{suggestions.length} guides</Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                          <Lightbulb className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{suggestion.title}</h3>
                          <p className="text-xs text-muted-foreground">{suggestion.topics} topics covered</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">{suggestion.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Updated {suggestion.updated}
                      </span>
                      <Button variant="ghost" size="sm">
                        View Guide
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Study Notes</h2>
              <Badge variant="secondary">{notes.length} notes</Badge>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note) => (
                <Card key={note.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="font-medium text-foreground mb-1">{note.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{note.pages} pages</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Download className="w-3 h-3" />
                        {note.downloads}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {note.rating}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3">
                      <Download className="w-4 h-4 mr-1" />
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Solved Answers Tab */}
          <TabsContent value="solved" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Solved Answers</h2>
              <Badge variant="secondary">{solvedAnswers.length} solutions</Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {solvedAnswers.map((solution) => (
                <Card key={solution.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{solution.title}</h3>
                          <p className="text-xs text-muted-foreground">{solution.questions} solved questions</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">{solution.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{solution.year}</span>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
