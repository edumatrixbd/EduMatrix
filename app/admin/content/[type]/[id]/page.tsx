"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Course {
  id: string
  course_name: string
}

const contentLabels: Record<string, string> = {
  videos: "Video Lecture",
  questions: "Previous Question",
  suggestions: "Exam Suggestion",
  notes: "Study Note",
  solved: "Solved Answer",
}

export default function EditContentPage() {
  const router = useRouter()
  const params = useParams()
  const type = params.type as string
  const id = params.id as string
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<any>({
    course_id: "",
    title: "",
    description: "",
    content: "",
    video_url: "",
    duration: "",
    question_text: "",
    exam_type: "",
    exam_year: new Date().getFullYear(),
    priority: "medium",
    topic: "",
    file_url: "",
    answer_text: "",
    answer_file_url: "",
    solved_by: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      const [coursesResponse, contentResponse] = await Promise.all([
        fetch("/api/admin/courses"),
        fetch(`/api/admin/content/${type}/${id}`),
      ])
      const coursesData = await coursesResponse.json()
      const contentData = await contentResponse.json()

      setCourses(Array.isArray(coursesData) ? coursesData : [])
      setFormData({
        course_id: contentData.course_id ?? "",
        title: contentData.title ?? "",
        description: contentData.description ?? "",
        content: contentData.content ?? "",
        video_url: contentData.video_url ?? "",
        duration: String(contentData.duration ?? ""),
        question_text: contentData.question_text ?? "",
        exam_type: contentData.exam_type ?? "",
        exam_year: String(contentData.exam_year ?? new Date().getFullYear()),
        priority: contentData.priority ?? "medium",
        topic: contentData.topic ?? "",
        file_url: contentData.file_url ?? "",
        answer_text: contentData.answer_text ?? "",
        answer_file_url: contentData.answer_file_url ?? "",
        solved_by: contentData.solved_by ?? "",
      })
      setLoading(false)
    }

    fetchData()
  }, [id, type])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)

    const payload: any = { course_id: formData.course_id }
    if (type === "videos") {
      payload.title = formData.title
      payload.description = formData.description
      payload.video_url = formData.video_url
      payload.duration = formData.duration ? parseInt(formData.duration) : 0
    } else if (type === "questions") {
      payload.question_text = formData.question_text
      payload.exam_type = formData.exam_type
      payload.exam_year = parseInt(formData.exam_year)
      payload.file_url = formData.file_url
    } else if (type === "suggestions") {
      payload.title = formData.title
      payload.content = formData.content
      payload.priority = formData.priority
      payload.exam_type = formData.exam_type
    } else if (type === "notes") {
      payload.title = formData.title
      payload.content = formData.content
      payload.topic = formData.topic
      payload.file_url = formData.file_url
    } else if (type === "solved") {
      payload.answer_text = formData.answer_text
      payload.answer_file_url = formData.answer_file_url
      payload.solved_by = formData.solved_by
    }

    await fetch(`/api/admin/content/${type}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    router.push("/admin/content")
  }

  if (loading) {
    return <Card><CardContent className="p-8 text-center text-muted-foreground">Loading content...</CardContent></Card>
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <Link href="/admin/content">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit {contentLabels[type] ?? "Content"}</h1>
          <p className="text-muted-foreground">Update learning material details</p>
        </div>
      </motion.div>

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={formData.course_id} onValueChange={(value) => setFormData({ ...formData, course_id: value })}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((course) => <SelectItem key={course.id} value={course.id}>{course.course_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {(type === "videos" || type === "suggestions" || type === "notes") && (
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
              </div>
            )}

            {type === "videos" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video_url">Video URL</Label>
                  <Input id="video_url" name="video_url" value={formData.video_url} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input id="duration" name="duration" type="number" value={formData.duration} onChange={handleChange} />
                </div>
              </>
            )}

            {type === "questions" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="question_text">Question</Label>
                  <Textarea id="question_text" name="question_text" value={formData.question_text} onChange={handleChange} rows={5} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Exam Type</Label>
                    <Select value={formData.exam_type} onValueChange={(value) => setFormData({ ...formData, exam_type: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="midterm">Midterm</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exam_year">Exam Year</Label>
                    <Input id="exam_year" name="exam_year" type="number" value={formData.exam_year} onChange={handleChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file_url">File URL</Label>
                  <Input id="file_url" name="file_url" value={formData.file_url} onChange={handleChange} />
                </div>
              </>
            )}

            {type === "suggestions" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea id="content" name="content" value={formData.content} onChange={handleChange} rows={6} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Exam Type</Label>
                    <Select value={formData.exam_type} onValueChange={(value) => setFormData({ ...formData, exam_type: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="midterm">Midterm</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {type === "notes" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea id="content" name="content" value={formData.content} onChange={handleChange} rows={6} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic</Label>
                    <Input id="topic" name="topic" value={formData.topic} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file_url">File URL</Label>
                    <Input id="file_url" name="file_url" value={formData.file_url} onChange={handleChange} />
                  </div>
                </div>
              </>
            )}

            {type === "solved" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="answer_text">Answer</Label>
                  <Textarea id="answer_text" name="answer_text" value={formData.answer_text} onChange={handleChange} rows={6} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="answer_file_url">Answer File URL</Label>
                    <Input id="answer_file_url" name="answer_file_url" value={formData.answer_file_url} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="solved_by">Solved By</Label>
                    <Input id="solved_by" name="solved_by" value={formData.solved_by} onChange={handleChange} />
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
              <Link href="/admin/content"><Button type="button" variant="outline">Cancel</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
