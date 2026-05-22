"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Loader2, University, Building2, Layers, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Uni    { id: string; name: string }
interface Dept   { id: string; name: string; university_id: string }
interface Batch  { id: string; batch_number: string; department_id: string }
interface Course { id: string; course_name: string; course_code: string; university_id: string; department_id: string; batch_id: string }

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

  // Hierarchy data
  const [unis, setUnis] = useState<Uni[]>([])
  const [allDepts, setAllDepts] = useState<Dept[]>([])
  const [allBatches, setAllBatches] = useState<Batch[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([])

  // Selection state
  const [selUni, setSelUni] = useState("")
  const [selDept, setSelDept] = useState("")
  const [selBatch, setSelBatch] = useState("")
  const [selCourse, setSelCourse] = useState("")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    content: "",
    video_url: "",
    duration: "",
    question_text: "",
    exam_type: "",
    priority: "medium",
    topic: "",
    file_url: "",
    answer_text: "",
    answer_file_url: "",
    solved_by: "",
    playlist_type: "mid",
  })

  // Derived filtered lists
  const depts = allDepts.filter(d => d.university_id === selUni)
  const batches = allBatches.filter(b => b.department_id === selDept)
  const courses = allCourses.filter(c => c.batch_id === selBatch)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const [uniRes, deptRes, batchRes, courseRes, contentRes] = await Promise.all([
        supabase.from("universities").select("id, name").eq("active", true).order("name"),
        supabase.from("departments").select("id, name, university_id").eq("active", true).order("name"),
        supabase.from("academic_batches").select("id, batch_number, department_id").eq("active", true).order("batch_number"),
        supabase.from("courses").select("id, course_name, course_code, university_id, department_id, batch_id").eq("active", true).order("course_code"),
        fetch(`/api/admin/content/${type}/${id}`),
      ])

      setUnis(uniRes.data || [])
      setAllDepts(deptRes.data || [])
      setAllBatches(batchRes.data || [])
      setAllCourses(courseRes.data || [])

      const contentData = await contentRes.json()
      if (contentData && !contentData.error) {
        setSelUni(contentData.university_id || "")
        setSelDept(contentData.department_id || "")
        setSelBatch(contentData.batch_id || "")
        setSelCourse(contentData.course_id || "")

        setFormData({
          title: contentData.title ?? "",
          description: contentData.description ?? "",
          content: contentData.description ?? "",
          video_url: contentData.file_url ?? "",
          duration: String(contentData.duration ?? ""), 
          question_text: contentData.title ?? "",
          exam_type: contentData.exam_type ?? "",
          priority: contentData.priority ?? "medium",
          topic: contentData.topic ?? "",
          file_url: contentData.file_url ?? "",
          answer_text: contentData.description ?? "",
          answer_file_url: contentData.file_url ?? "",
          solved_by: contentData.solved_by ?? "",
          playlist_type: contentData.playlist_type ?? "mid",
        })
      }
      setLoading(false)
    }

    fetchData()
  }, [id, type])

  const handleUniChange = (v: string) => { setSelUni(v); setSelDept(""); setSelBatch(""); setSelCourse("") }
  const handleDeptChange = (v: string) => { setSelDept(v); setSelBatch(""); setSelCourse("") }
  const handleBatchChange = (v: string) => { setSelBatch(v); setSelCourse("") }
  const handleCourseChange = (v: string) => {
    setSelCourse(v)
    const course = allCourses.find(c => c.id === v)
    if (course) {
      setSelUni(course.university_id || "")
      setSelDept(course.department_id || "")
      setSelBatch(course.batch_id || "")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelect = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)

    // Build payload matching unified content_materials
    const title =
      formData.title?.trim() ||
      formData.question_text?.trim() ||
      (formData.exam_type ? `${formData.exam_type} Exam` : "") ||
      contentLabels[type] ||
      "Study Material"

    const description =
      formData.description?.trim() ||
      formData.content?.trim() ||
      formData.answer_text?.trim() ||
      ""

    const fileValue =
      formData.video_url?.trim() ||
      formData.file_url?.trim() ||
      formData.answer_file_url?.trim() ||
      ""

    // Safely send only columns that definitely exist in unified table
    const payload: Record<string, any> = {
      title,
      description,
      course_id: selCourse || null,
      university_id: selUni || null,
      department_id: selDept || null,
      batch_id: selBatch || null,
      file_url: fileValue,
      file_key: fileValue,
    }

    try {
      const response = await fetch(`/api/admin/content/${type}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error("Failed to save changes")
      
      toast.success("Changes saved successfully")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("An error occurred while saving")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Card><CardContent className="p-8 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></CardContent></Card>
  }

  const isHierarchyComplete = selUni && selDept && selBatch && selCourse

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

            {/* ── Hierarchy ── */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Institutional Hierarchy
              </p>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs"><University className="w-3.5 h-3.5" /> University *</Label>
                <Select value={selUni} onValueChange={handleUniChange}>
                  <SelectTrigger><SelectValue placeholder="Select University" /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto z-50">
                    {unis.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs"><Building2 className="w-3.5 h-3.5" /> Department *</Label>
                <Select value={selDept} onValueChange={handleDeptChange} disabled={!selUni}>
                  <SelectTrigger><SelectValue placeholder={selUni ? "Select Department" : "Select University first"} /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto z-50">
                    {depts.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs"><Layers className="w-3.5 h-3.5" /> Batch *</Label>
                <Select value={selBatch} onValueChange={handleBatchChange} disabled={!selDept}>
                  <SelectTrigger><SelectValue placeholder={selDept ? "Select Batch" : "Select Department first"} /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto z-50">
                    {batches.map(b => <SelectItem key={b.id} value={b.id}>Batch {b.batch_number}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs"><BookOpen className="w-3.5 h-3.5" /> Course *</Label>
                <Select value={selCourse} onValueChange={handleCourseChange} disabled={!selBatch}>
                  <SelectTrigger><SelectValue placeholder={selBatch ? "Select Course" : "Select Batch first"} /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto z-50">
                    {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.course_code} — {c.course_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Content Specific Fields ── */}
            {(type === "videos" || type === "suggestions" || type === "notes") && (
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
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
                  <Label htmlFor="video_url">Video URL / File URL</Label>
                  <Input id="video_url" name="video_url" value={formData.video_url} onChange={handleChange} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (mins)</Label>
                    <Input id="duration" name="duration" type="number" value={formData.duration} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Playlist Type</Label>
                    <Select value={formData.playlist_type} onValueChange={(v) => handleSelect("playlist_type", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mid">Midterm</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {type === "questions" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="question_text">Question *</Label>
                  <Textarea id="question_text" name="question_text" value={formData.question_text} onChange={handleChange} rows={5} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Exam Type</Label>
                    <Select value={formData.exam_type} onValueChange={(value) => handleSelect("exam_type", value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="midterm">Midterm</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <Label htmlFor="content">Content *</Label>
                  <Textarea id="content" name="content" value={formData.content} onChange={handleChange} rows={6} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => handleSelect("priority", value)}>
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
                    <Select value={formData.exam_type} onValueChange={(value) => handleSelect("exam_type", value)}>
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
                  <Label htmlFor="content">Content *</Label>
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
                  <Label htmlFor="answer_text">Answer *</Label>
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

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={saving || !isHierarchyComplete} className="min-w-[140px]">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}
              </Button>
              <Link href="/admin/content"><Button type="button" variant="outline">Back</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
