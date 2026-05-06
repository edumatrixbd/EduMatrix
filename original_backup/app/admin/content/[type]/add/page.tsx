"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Course {
  id: string
  course_name: string
}

const contentLabels = {
  videos: "Video Lecture",
  questions: "Previous Question",
  suggestions: "Exam Suggestion",
  notes: "Study Note",
  solved: "Solved Answer",
}

export default function AddContentPage() {
  const router = useRouter()
  const params = useParams()
  const type = params.type as string
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<any>({
    course_id: "",
    title: "",
    description: "",
    content: "",
    video_url: "",
    question_text: "",
    exam_type: "",
    exam_year: new Date().getFullYear(),
    priority: "medium",
    topic: "",
    file_url: "",
    solved_by: "",
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/admin/courses")
      const data = await response.json()
      setCourses(data)
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload: any = {
        course_id: formData.course_id,
      }

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

      const response = await fetch(`/api/admin/content/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push("/admin/content")
      }
    } catch (error) {
      console.error("Error adding content:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-4"
      >
        <Link href="/admin/content">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add New {contentLabels[type as keyof typeof contentLabels]}</h1>
          <p className="text-muted-foreground">Fill in the details below</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="max-w-2xl"
      >
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="course">Course *</Label>
                <Select value={formData.course_id} onValueChange={(value) => handleSelectChange("course_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.course_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(type === "videos" || type === "suggestions" || type === "notes") && (
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter title"
                    required
                  />
                </div>
              )}

              {type === "videos" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Enter description"
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="video_url">Video URL *</Label>
                    <Input
                      id="video_url"
                      name="video_url"
                      type="url"
                      value={formData.video_url}
                      onChange={handleChange}
                      placeholder="https://youtube.com/..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      name="duration"
                      type="number"
                      value={formData.duration}
                      onChange={handleChange}
                      placeholder="60"
                    />
                  </div>
                </>
              )}

              {type === "questions" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="question_text">Question *</Label>
                    <Textarea
                      id="question_text"
                      name="question_text"
                      value={formData.question_text}
                      onChange={handleChange}
                      placeholder="Enter question"
                      rows={4}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="exam_type">Exam Type</Label>
                      <Select value={formData.exam_type} onValueChange={(value) => handleSelectChange("exam_type", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="midterm">Midterm</SelectItem>
                          <SelectItem value="final">Final</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exam_year">Exam Year</Label>
                      <Input
                        id="exam_year"
                        name="exam_year"
                        type="number"
                        value={formData.exam_year}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file_url">Question Paper URL</Label>
                    <Input
                      id="file_url"
                      name="file_url"
                      type="url"
                      value={formData.file_url}
                      onChange={handleChange}
                      placeholder="https://..."
                    />
                  </div>
                </>
              )}

              {type === "suggestions" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      placeholder="Enter suggestion content"
                      rows={4}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={formData.priority} onValueChange={(value) => handleSelectChange("priority", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exam_type">Exam Type</Label>
                      <Select value={formData.exam_type} onValueChange={(value) => handleSelectChange("exam_type", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="midterm">Midterm</SelectItem>
                          <SelectItem value="final">Final</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {type === "notes" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      placeholder="Enter note content"
                      rows={6}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="topic">Topic</Label>
                      <Input
                        id="topic"
                        name="topic"
                        value={formData.topic}
                        onChange={handleChange}
                        placeholder="e.g., Chapter 5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="file_url">File URL</Label>
                      <Input
                        id="file_url"
                        name="file_url"
                        type="url"
                        value={formData.file_url}
                        onChange={handleChange}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </>
              )}

              {type === "solved" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="answer_text">Answer *</Label>
                    <Textarea
                      id="answer_text"
                      name="answer_text"
                      value={formData.answer_text}
                      onChange={handleChange}
                      placeholder="Enter answer"
                      rows={6}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="solved_by">Solved By</Label>
                      <Input
                        id="solved_by"
                        name="solved_by"
                        value={formData.solved_by}
                        onChange={handleChange}
                        placeholder="Name of solver"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="answer_file_url">Answer File URL</Label>
                      <Input
                        id="answer_file_url"
                        name="answer_file_url"
                        type="url"
                        value={formData.answer_file_url}
                        onChange={handleChange}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : `Add ${contentLabels[type as keyof typeof contentLabels]}`}
                </Button>
                <Link href="/admin/content">
                  <Button variant="outline">Cancel</Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
