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
import { ArrowLeft, UploadCloud, Loader2, CheckCircle2, AlertCircle, University, Building2, Layers, BookOpen } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Progress } from "@/components/ui/progress"
import { uploadContentFile } from "@/lib/content-upload"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Uni    { id: string; name: string; short_name: string }
interface Dept   { id: string; name: string; short_name: string; university_id: string }
interface Batch  { id: string; batch_number: string; department_id: string }
interface Course {
  id: string
  course_name: string
  course_code: string
  university_id: string
  department_id: string
  batch_id: string
}

// ─── Type label map ───────────────────────────────────────────────────────────

const contentLabels: Record<string, string> = {
  videos:      "Video Lecture",
  questions:   "Previous Question",
  suggestions: "Exam Suggestion",
  notes:       "Study Note",
  solved:      "Solved Answer",
}

// Route param → unified content_materials type
const typeMap: Record<string, string> = {
  videos:      "video",
  questions:   "previous_question",
  suggestions: "suggestion",
  notes:       "note",
  solved:      "solved_answer",
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddContentPage() {
  const router = useRouter()
  const params = useParams()
  const type = params.type as string

  // ── Hierarchy data ──────────────────────────────────────────────────────────
  const [unis,      setUnis]      = useState<Uni[]>([])
  const [allDepts,  setAllDepts]  = useState<Dept[]>([])
  const [allBatches,setAllBatches]= useState<Batch[]>([])
  const [allCourses,setAllCourses]= useState<Course[]>([])

  // ── Selection state ─────────────────────────────────────────────────────────
  const [selUni,    setSelUni]    = useState("")
  const [selDept,   setSelDept]   = useState("")
  const [selBatch,  setSelBatch]  = useState("")
  const [selCourse, setSelCourse] = useState("")

  // ── Form data ───────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<Record<string, any>>({
    title:        "",
    description:  "",
    content:      "",
    video_url:    "",
    question_text:"",
    exam_type:    "",
    priority:     "medium",
    topic:        "",
    file_url:     "",
    answer_text:  "",
    answer_file_url: "",
    solved_by:    "",
    playlist_type:"mid",
    duration:     "",
  })

  const [file,           setFile]           = useState<File | null>(null)
  const [loading,        setLoading]        = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus,   setUploadStatus]   = useState<"preparing"|"uploading"|"saving"|"completed"|"failed"|null>(null)
  const [errorMessage,   setErrorMessage]   = useState<string | null>(null)

  // ── Derived filtered lists ──────────────────────────────────────────────────
  const depts   = allDepts  .filter(d => d.university_id === selUni)
  const batches = allBatches.filter(b => b.department_id === selDept)
  const courses = allCourses.filter(c => c.batch_id === selBatch)

  // ── Load hierarchy on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const [uniRes, deptRes, batchRes, courseRes] = await Promise.all([
        supabase.from("universities")  .select("id, name, short_name").eq("active", true).eq("is_locked", false).order("name"),
        supabase.from("departments")   .select("id, name, short_name, university_id").eq("active", true).eq("is_locked", false).order("name"),
        supabase.from("academic_batches").select("id, batch_number, department_id").eq("active", true).eq("is_locked", false).order("batch_number"),
        supabase.from("courses")       .select("id, course_name, course_code, university_id, department_id, batch_id").eq("active", true).eq("is_locked", false).order("course_code"),
      ])
      setUnis      (uniRes.data    || [])
      setAllDepts  (deptRes.data   || [])
      setAllBatches(batchRes.data  || [])
      setAllCourses(courseRes.data || [])
    }
    load()
  }, [])

  // ── Cascade resets ──────────────────────────────────────────────────────────
  const handleUniChange = (v: string) => {
    setSelUni(v); setSelDept(""); setSelBatch(""); setSelCourse("")
  }
  const handleDeptChange = (v: string) => {
    setSelDept(v); setSelBatch(""); setSelCourse("")
  }
  const handleBatchChange = (v: string) => {
    setSelBatch(v); setSelCourse("")
  }
  const handleCourseChange = (v: string) => {
    setSelCourse(v)
    // Auto-fill hierarchy from selected course
    const course = allCourses.find(c => c.id === v)
    if (course) {
      setSelUni  (course.university_id  || "")
      setSelDept (course.department_id  || "")
      setSelBatch(course.batch_id       || "")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }))
  }
  const handleSelect = (name: string, value: string) => {
    setFormData(p => ({ ...p, [name]: value }))
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selCourse) {
      setErrorMessage("Please select a course before submitting.")
      setUploadStatus("failed")
      return
    }
    setLoading(true)
    setErrorMessage(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated. Please log in again.")

      let fileKey = ""
      let uploadFileUrl = ""

      // ── Upload file to R2 if present ─────────────────────────────────────
      if (file) {
        setUploadStatus("preparing")

        setUploadStatus("uploading")
        setUploadProgress(25)
        const uploadResult = await uploadContentFile(file, type)
        fileKey = uploadResult.fileKey
        uploadFileUrl = uploadResult.fileUrl
        setUploadProgress(100)
      }

      // ── Build unified content_materials payload ────────────────────────────
      setUploadStatus("saving")

      // Derive title from form fields depending on content type
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
        uploadFileUrl ||
        formData.video_url?.trim() ||
        formData.file_url?.trim() ||
        formData.answer_file_url?.trim() ||
        ""

      const fileKeyValue =
        fileKey ||
        formData.video_url?.trim() ||
        formData.file_url?.trim() ||
        formData.answer_file_url?.trim() ||
        ""

      const payload: Record<string, any> = {
        title,
        description,
        type:          typeMap[type] || type,
        course_id:     selCourse,
        university_id: selUni   || null,
        department_id: selDept  || null,
        batch_id:      selBatch || null,
        file_key:      fileKeyValue,
        file_url:      fileValue,
        uploaded_by:   user.id,
        active:        true,
      }

      const { data: insertData, error: insertError } = await supabase
        .from("content_materials")
        .insert([payload])
        .select()

      console.log("INSERT RESULT:", insertData, insertError)

      if (insertError) {
        console.error("CONTENT_MATERIALS INSERT ERROR:", insertError)
        throw new Error(insertError.message || "Failed to save content metadata")
      }

      setUploadStatus("completed")
      toast.success("Upload successful")

      setFormData({
        title: "",
        description: "",
        content: "",
        video_url: "",
        question_text: "",
        exam_type: "",
        priority: "medium",
        topic: "",
        file_url: "",
        answer_text: "",
        answer_file_url: "",
        solved_by: "",
        playlist_type: "mid",
        duration: "",
      })
      setFile(null)

      setTimeout(() => setUploadStatus(null), 3000)
      router.refresh()
    } catch (err: any) {
      console.error("AddContentPage handleSubmit error:", err)
      setUploadStatus("failed")
      setErrorMessage(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const isHierarchyComplete = selUni && selDept && selBatch && selCourse

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex items-center gap-4"
      >
        <Link href="/admin/content">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add New {contentLabels[type]}</h1>
          <p className="text-muted-foreground">Fill in the details below</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        className="max-w-2xl"
      >
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ── Hierarchy: University → Department → Batch → Course ─── */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Institutional Hierarchy
                </p>

                {/* University */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <University className="w-3.5 h-3.5" /> University *
                  </Label>
                  <Select value={selUni} onValueChange={handleUniChange}>
                    <SelectTrigger className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Select University" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-2xl">
                      {unis.map(u => (
                        <SelectItem key={u.id} value={u.id} className="hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer">
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <Building2 className="w-3.5 h-3.5" /> Department *
                  </Label>
                  <Select value={selDept} onValueChange={handleDeptChange} disabled={!selUni}>
                    <SelectTrigger className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white disabled:opacity-50">
                      <SelectValue placeholder={selUni ? "Select Department" : "Select University first"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-2xl">
                      {depts.map(d => (
                        <SelectItem key={d.id} value={d.id} className="hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer">
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Batch */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <Layers className="w-3.5 h-3.5" /> Batch *
                  </Label>
                  <Select value={selBatch} onValueChange={handleBatchChange} disabled={!selDept}>
                    <SelectTrigger className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white disabled:opacity-50">
                      <SelectValue placeholder={selDept ? "Select Batch" : "Select Department first"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-2xl">
                      {batches.map(b => (
                        <SelectItem key={b.id} value={b.id} className="hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer">
                          Batch {b.batch_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Course */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <BookOpen className="w-3.5 h-3.5" /> Course *
                  </Label>
                  <Select value={selCourse} onValueChange={handleCourseChange} disabled={!selBatch}>
                    <SelectTrigger className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white disabled:opacity-50">
                      <SelectValue placeholder={selBatch ? "Select Course" : "Select Batch first"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-2xl">
                      {courses.map(c => (
                        <SelectItem key={c.id} value={c.id} className="hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer">
                          {c.course_code} — {c.course_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ── Content-type specific fields ─────────────────────────── */}

              {/* Title (videos / suggestions / notes) */}
              {(type === "videos" || type === "suggestions" || type === "notes") && (
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" name="title" value={formData.title} onChange={handleChange} placeholder="Enter title" required />
                </div>
              )}

              {/* Videos */}
              {type === "videos" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Enter description" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Upload Video File</Label>
                    <Input
                      type="file"
                      accept="video/mp4"
                      onChange={e => {
                        const selectedFile = e.target.files?.[0] || null;
                        if (selectedFile && selectedFile.type !== "video/mp4") {
                          toast.error("Unsupported video format. Please upload MP4 H.264.");
                          e.target.value = "";
                          setFile(null);
                          return;
                        }
                        setFile(selectedFile);
                      }}
                    />
                    <p className="text-xs text-muted-foreground text-center my-2">— OR —</p>
                    <Label htmlFor="video_url">Video URL (if not uploading)</Label>
                    <Input id="video_url" name="video_url" type="url" value={formData.video_url} onChange={handleChange} placeholder="https://youtube.com/..." required={!file} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input id="duration" name="duration" type="number" value={formData.duration} onChange={handleChange} placeholder="60" />
                    </div>
                    <div className="space-y-2">
                      <Label>Playlist Type *</Label>
                      <Select value={formData.playlist_type} onValueChange={v => handleSelect("playlist_type", v)}>
                        <SelectTrigger className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-white/20 shadow-2xl z-[100]">
                          <SelectItem value="mid">Midterm</SelectItem>
                          <SelectItem value="final">Final</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* Questions */}
              {type === "questions" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="question_text">Question *</Label>
                    <Textarea id="question_text" name="question_text" value={formData.question_text} onChange={handleChange} placeholder="Enter question" rows={4} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Exam Type</Label>
                      <Select value={formData.exam_type} onValueChange={v => handleSelect("exam_type", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="midterm">Midterm</SelectItem>
                          <SelectItem value="final">Final</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Upload Question Paper</Label>
                    <Input type="file" accept=".pdf,.doc,.docx,image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                    <p className="text-xs text-muted-foreground text-center my-2">— OR —</p>
                    <Label htmlFor="file_url">Question Paper URL</Label>
                    <Input id="file_url" name="file_url" type="url" value={formData.file_url} onChange={handleChange} placeholder="https://..." />
                  </div>
                </>
              )}

              {/* Suggestions */}
              {type === "suggestions" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content *</Label>
                    <Textarea id="content" name="content" value={formData.content} onChange={handleChange} placeholder="Enter suggestion content" rows={4} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={formData.priority} onValueChange={v => handleSelect("priority", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Exam Type</Label>
                      <Select value={formData.exam_type} onValueChange={v => handleSelect("exam_type", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="midterm">Midterm</SelectItem>
                          <SelectItem value="final">Final</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              {type === "notes" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content *</Label>
                    <Textarea id="content" name="content" value={formData.content} onChange={handleChange} placeholder="Enter note content" rows={6} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="topic">Topic</Label>
                      <Input id="topic" name="topic" value={formData.topic} onChange={handleChange} placeholder="e.g., Chapter 5" />
                    </div>
                    <div className="space-y-2">
                      <Label>Upload File</Label>
                      <Input type="file" accept=".pdf,.doc,.docx,image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                      <p className="text-xs text-muted-foreground my-2">— OR —</p>
                      <Label htmlFor="file_url">File URL</Label>
                      <Input id="file_url" name="file_url" type="url" value={formData.file_url} onChange={handleChange} placeholder="https://..." />
                    </div>
                  </div>
                </>
              )}

              {/* Solved */}
              {type === "solved" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="answer_text">Answer *</Label>
                    <Textarea id="answer_text" name="answer_text" value={formData.answer_text} onChange={handleChange} placeholder="Enter answer" rows={6} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="solved_by">Solved By</Label>
                      <Input id="solved_by" name="solved_by" value={formData.solved_by} onChange={handleChange} placeholder="Name of solver" />
                    </div>
                    <div className="space-y-2">
                      <Label>Upload Answer File</Label>
                      <Input type="file" accept=".pdf,.doc,.docx,image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                      <p className="text-xs text-muted-foreground my-2">— OR —</p>
                      <Label htmlFor="answer_file_url">Answer File URL</Label>
                      <Input id="answer_file_url" name="answer_file_url" type="url" value={formData.answer_file_url} onChange={handleChange} placeholder="https://..." />
                    </div>
                  </div>
                </>
              )}

              {/* ── Upload status ────────────────────────────────────────── */}
              {uploadStatus && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/50"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {uploadStatus === "preparing"  && <Loader2     className="w-4 h-4 animate-spin text-primary" />}
                      {uploadStatus === "uploading"  && <UploadCloud className="w-4 h-4 animate-bounce text-primary" />}
                      {uploadStatus === "saving"     && <Loader2     className="w-4 h-4 animate-spin text-primary" />}
                      {uploadStatus === "completed"  && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {uploadStatus === "failed"     && <AlertCircle  className="w-4 h-4 text-rose-500" />}
                      <span className="font-medium capitalize text-foreground">
                        {uploadStatus === "completed" ? "Upload Successful" :
                         uploadStatus === "failed"    ? "Upload Failed"     :
                         `${uploadStatus}...`}
                      </span>
                    </div>
                    {uploadStatus === "uploading" && (
                      <span className="text-xs font-mono text-muted-foreground">{uploadProgress}%</span>
                    )}
                  </div>

                  {(uploadStatus === "uploading" || uploadStatus === "saving") && (
                    <Progress value={uploadProgress} className="h-1.5 bg-muted" />
                  )}

                  {uploadStatus === "failed" && errorMessage && (
                    <p className="text-xs text-rose-500 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                      {errorMessage}
                    </p>
                  )}
                  {uploadStatus === "completed" && (
                    <p className="text-xs text-emerald-500">Upload completed successfully. Form reset.</p>
                  )}
                </motion.div>
              )}

              {/* ── Actions ──────────────────────────────────────────────── */}
              <div className="flex gap-4 pt-2">
                <Button type="submit" disabled={loading || !isHierarchyComplete} className="min-w-[140px]">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing</>
                  ) : (
                    `Add ${contentLabels[type] ?? "Content"}`
                  )}
                </Button>
                <Link href="/admin/content">
                  <Button variant="outline" disabled={loading}>Cancel</Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
