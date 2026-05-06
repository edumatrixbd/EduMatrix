"use client"

import { use, useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
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
import { VideoPlayer } from "@/components/dashboard/video-player"

interface Course {
  id: string
  course_code: string
  course_name: string
  description: string | null
  instructor: string | null
  credits: number | null
  semester: number | null
  status: string | null
}

interface VideoLecture {
  id: string
  title: string
  description: string | null
  video_url: string
  duration: number | null
  lecture_number: number | null
}

interface PreviousQuestion {
  id: string
  question_text: string
  exam_type: string | null
  exam_year: number | null
  question_number: number | null
  file_url: string | null
}

interface ExamSuggestion {
  id: string
  title: string
  content: string
  priority: string | null
  exam_type: string | null
  created_at: string | null
}

interface StudyNote {
  id: string
  title: string
  content: string
  file_url: string | null
  topic: string | null
}

interface SolvedAnswer {
  id: string
  answer_text: string
  answer_file_url: string | null
  solved_by: string | null
}

function formatDuration(duration: number | null) {
  if (!duration) return "Duration TBA"
  const minutes = duration >= 3600 ? Math.floor(duration / 60) : duration
  return `${minutes} min`
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState("videos")
  const [courseData, setCourseData] = useState<Course | null>(null)
  const [videos, setVideos] = useState<VideoLecture[]>([])
  const [questions, setQuestions] = useState<PreviousQuestion[]>([])
  const [suggestions, setSuggestions] = useState<ExamSuggestion[]>([])
  const [notes, setNotes] = useState<StudyNote[]>([])
  const [solvedAnswers, setSolvedAnswers] = useState<SolvedAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<VideoLecture | null>(null)

  useEffect(() => {
    const fetchCourseData = async () => {
      const supabase = createClient()
      setLoading(true)

      let course: Course | null = null

      if (isUuid(id)) {
        const { data } = await supabase
          .from("courses")
          .select("id, course_code, course_name, description, instructor, credits, semester, status")
          .eq("id", id)
          .maybeSingle()

        course = data as Course | null
      } else {
        const { data } = await supabase
          .from("courses")
          .select("id, course_code, course_name, description, instructor, credits, semester, status")

        course = ((data ?? []) as Course[]).find((item) =>
          normalize(item.course_code) === normalize(id) ||
          normalize(item.course_name) === normalize(id)
        ) ?? null
      }

      setCourseData(course)

      if (!course) {
        setVideos([])
        setQuestions([])
        setSuggestions([])
        setNotes([])
        setSolvedAnswers([])
        setLoading(false)
        return
      }

      const [
        videosResult,
        questionsResult,
        suggestionsResult,
        notesResult,
        solvedResult,
      ] = await Promise.all([
        supabase
          .from("video_lectures")
          .select("id, title, description, video_url, duration, lecture_number")
          .eq("course_id", course.id)
          .order("lecture_number", { ascending: true }),
        supabase
          .from("previous_questions")
          .select("id, question_text, exam_type, exam_year, question_number, file_url")
          .eq("course_id", course.id)
          .order("exam_year", { ascending: false }),
        supabase
          .from("exam_suggestions")
          .select("id, title, content, priority, exam_type, created_at")
          .eq("course_id", course.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("study_notes")
          .select("id, title, content, file_url, topic")
          .eq("course_id", course.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("solved_answers")
          .select("id, answer_text, answer_file_url, solved_by")
          .eq("course_id", course.id)
          .order("created_at", { ascending: false }),
      ])

      setVideos((videosResult.data ?? []) as VideoLecture[])
      setQuestions((questionsResult.data ?? []) as PreviousQuestion[])
      setSuggestions((suggestionsResult.data ?? []) as ExamSuggestion[])
      setNotes((notesResult.data ?? []) as StudyNote[])
      setSolvedAnswers((solvedResult.data ?? []) as SolvedAnswer[])
      setLoading(false)
    }

    fetchCourseData()
  }, [id])

  const midtermQuestions = questions.filter((question) =>
    (question.exam_type ?? "").toLowerCase().includes("mid")
  )
  const finalQuestions = questions.filter((question) =>
    (question.exam_type ?? "").toLowerCase().includes("final")
  )
  const otherQuestions = questions.filter((question) =>
    !midtermQuestions.includes(question) && !finalQuestions.includes(question)
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">Loading course...</CardContent>
      </Card>
    )
  }

  if (!courseData) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Course not found.
        </CardContent>
      </Card>
    )
  }

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
            <Link href={`/dashboard/semester/${courseData.semester ?? 1}`} className="hover:text-primary">
              Semester {courseData.semester ?? "N/A"}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{courseData.course_name}</span>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{courseData.course_code}</Badge>
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    Semester {courseData.semester ?? "N/A"}
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {courseData.course_name}
                </h1>
                <p className="text-muted-foreground max-w-2xl">
                  {courseData.description ?? "Course description coming soon."}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{courseData.instructor ?? "Instructor TBA"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-foreground">{courseData.credits ?? 0} credits</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{videos.length + questions.length + suggestions.length + notes.length + solvedAnswers.length} resources</span>
                  </div>
                </div>
              </div>
              
              <div className="lg:min-w-[200px] space-y-3">
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Your Progress</span>
                    <span className="text-sm font-semibold text-foreground">{videos.length > 0 ? "0" : "0"}%</span>
                  </div>
                  <Progress value={0} className="h-2" />
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
              {videos.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">No video lectures found.</CardContent>
                </Card>
              )}
              {videos.map((video, index) => (
                <Card key={video.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary">
                      <Play className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">#{video.lecture_number ?? index + 1}</span>
                        <h3 className="font-medium text-foreground truncate">{video.title}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(video.duration)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {video.description ?? "Video lecture"}
                        </span>
                      </div>
                    </div>
                    <Button variant="default" size="sm" onClick={() => setSelectedVideo(video)}>
                      Watch
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedVideo && (
              <VideoPlayer
                videoId={selectedVideo.id}
                videoKey={selectedVideo.video_url}
                title={selectedVideo.title}
                isOpen={!!selectedVideo}
                onClose={() => setSelectedVideo(null)}
              />
            )}
          </TabsContent>

          {/* Midterm Questions Tab */}
          <TabsContent value="midterm" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Midterm Previous Questions</h2>
              <Badge variant="secondary">{midtermQuestions.length} papers</Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {midtermQuestions.length === 0 && (
                <Card className="sm:col-span-2">
                  <CardContent className="p-8 text-center text-muted-foreground">No midterm questions found.</CardContent>
                </Card>
              )}
              {midtermQuestions.map((paper) => (
                <Card key={paper.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                          <FileQuestion className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{paper.question_text}</h3>
                          <p className="text-xs text-muted-foreground">Question {paper.question_number ?? "N/A"}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{paper.exam_year ?? "Year TBA"}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      {paper.file_url ? (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          File Available
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Questions Only</span>
                      )}
                      {paper.file_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={paper.file_url} target="_blank" rel="noreferrer">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </a>
                        </Button>
                      )}
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
              {finalQuestions.length === 0 && (
                <Card className="sm:col-span-2">
                  <CardContent className="p-8 text-center text-muted-foreground">No final questions found.</CardContent>
                </Card>
              )}
              {finalQuestions.map((paper) => (
                <Card key={paper.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                          <FileQuestion className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{paper.question_text}</h3>
                          <p className="text-xs text-muted-foreground">Question {paper.question_number ?? "N/A"}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{paper.exam_year ?? "Year TBA"}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      {paper.file_url ? (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          File Available
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Questions Only</span>
                      )}
                      {paper.file_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={paper.file_url} target="_blank" rel="noreferrer">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </a>
                        </Button>
                      )}
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
              {suggestions.length === 0 && (
                <Card className="sm:col-span-2">
                  <CardContent className="p-8 text-center text-muted-foreground">No exam suggestions found.</CardContent>
                </Card>
              )}
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
                          <p className="text-xs text-muted-foreground line-clamp-1">{suggestion.content}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">{suggestion.priority ?? suggestion.exam_type ?? "Guide"}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {suggestion.created_at ? new Date(suggestion.created_at).toLocaleDateString() : "Recently added"}
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
              {notes.length === 0 && (
                <Card className="sm:col-span-2 lg:col-span-3">
                  <CardContent className="p-8 text-center text-muted-foreground">No study notes found.</CardContent>
                </Card>
              )}
              {notes.map((note) => (
                <Card key={note.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="font-medium text-foreground mb-1">{note.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {note.topic ?? note.content}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Download className="w-3 h-3" />
                        {note.file_url ? "PDF" : "Text"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        Live
                      </span>
                    </div>
                    {note.file_url ? (
                      <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                        <a href={note.file_url} target="_blank" rel="noreferrer">
                          <Download className="w-4 h-4 mr-1" />
                          Download PDF
                        </a>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full mt-3">
                        Read Note
                      </Button>
                    )}
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
              {solvedAnswers.length === 0 && (
                <Card className="sm:col-span-2">
                  <CardContent className="p-8 text-center text-muted-foreground">No solved answers found.</CardContent>
                </Card>
              )}
              {solvedAnswers.map((solution) => (
                <Card key={solution.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground line-clamp-1">{solution.answer_text}</h3>
                          <p className="text-xs text-muted-foreground">
                            {solution.solved_by ? `Solved by ${solution.solved_by}` : "Solved answer"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">{solution.answer_file_url ? "PDF" : "Text"}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Available now</span>
                      {solution.answer_file_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={solution.answer_file_url} target="_blank" rel="noreferrer">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </a>
                        </Button>
                      )}
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
