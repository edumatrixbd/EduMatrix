"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload, Loader2, CheckCircle, University, Building2, Layers, BookOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { logAdminActivity } from "@/lib/activity-logger"
import { PermissionGuard } from "@/components/admin/permission-guard"
import { uploadContentFile } from "@/lib/content-upload"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Uni    { id: string; name: string; short_name: string }
interface Dept   { id: string; name: string; short_name: string; university_id: string }
interface Batch  { id: string; batch_number: string; department_id: string }
interface Course { id: string; course_name: string; course_code: string; university_id: string; department_id: string; batch_id: string }

// ─── Component ────────────────────────────────────────────────────────────────

export default function UnifiedUploadPage() {
  const [loading, setLoading] = useState(false)
  const [file,    setFile]    = useState<File | null>(null)

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

  // ── Form fields ─────────────────────────────────────────────────────────────
  const [title, setTitle] = useState("")
  const [type,  setType]  = useState("note")

  // ── Derived filtered lists ──────────────────────────────────────────────────
  const depts   = allDepts  .filter(d => d.university_id === selUni)
  const batches = allBatches.filter(b => b.department_id === selDept)
  const courses = allCourses.filter(c => c.batch_id === selBatch)

  // ── Load hierarchy on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const [uniRes, deptRes, batchRes, courseRes] = await Promise.all([
        supabase.from("universities")    .select("id, name, short_name").eq("active", true).eq("is_locked", false).order("name"),
        supabase.from("departments")     .select("id, name, short_name, university_id").eq("active", true).eq("is_locked", false).order("name"),
        supabase.from("academic_batches").select("id, batch_number, department_id").eq("active", true).eq("is_locked", false).order("batch_number"),
        supabase.from("courses")         .select("id, course_name, course_code, university_id, department_id, batch_id").eq("active", true).eq("is_locked", false).order("course_code"),
      ])
      setUnis      (uniRes.data    || [])
      setAllDepts  (deptRes.data   || [])
      setAllBatches(batchRes.data  || [])
      setAllCourses(courseRes.data || [])
    }
    load()
  }, [])

  // ── Cascade handlers ────────────────────────────────────────────────────────
  const handleUniChange    = (v: string) => { setSelUni(v); setSelDept(""); setSelBatch(""); setSelCourse("") }
  const handleDeptChange   = (v: string) => { setSelDept(v); setSelBatch(""); setSelCourse("") }
  const handleBatchChange  = (v: string) => { setSelBatch(v); setSelCourse("") }
  const handleCourseChange = (v: string) => { setSelCourse(v) }

  // ── Upload ──────────────────────────────────────────────────────────────────
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title.trim() || !selCourse) {
      toast.error("Please fill in all required fields, select a course, and choose a file.")
      return
    }

    setLoading(true)
    try {
      const { fileKey, fileUrl } = await uploadContentFile(file, "study_material")

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No active session. Please log in again.")

      const payload = {
        title:         title.trim(),
        type,
        file_key:      fileKey,
        file_url:      fileUrl,
        course_id:     selCourse,
        university_id: selUni   || null,
        department_id: selDept  || null,
        batch_id:      selBatch || null,
        uploaded_by:   user.id,
        active:        true,
      }

      const { data: dbData, error: dbError } = await supabase
        .from("content_materials")
        .insert(payload)
        .select()
        .single()

      if (dbError) {
        console.error("CONTENT_MATERIALS INSERT ERROR:", dbError)
        throw new Error(dbError.message || "Failed to save metadata")
      }

      await logAdminActivity("UPLOAD_CONTENT", "content_materials", dbData.id, {
        title: title.trim(),
        course_id: selCourse,
        file_name: file.name,
      })

      toast.success("Study material uploaded successfully!")

      // Reset form
      setTitle(""); setType("note")
      setSelUni(""); setSelDept(""); setSelBatch(""); setSelCourse("")
      setFile(null)
      const fileInput = document.getElementById("file-upload") as HTMLInputElement
      if (fileInput) fileInput.value = ""

    } catch (err: any) {
      console.error("Upload error:", err)
      toast.error(err.message || "Upload failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const isReady = selUni && selDept && selBatch && selCourse && title.trim() && file

  return (
    <PermissionGuard permission="content_upload">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <Upload className="w-8 h-8 text-primary" />
            Study Materials Upload
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload lecture notes, question banks, or solutions to the secure platform.
          </p>
        </div>

        <Card className="border-slate-200 dark:border-white/5 shadow-xl">
          <CardHeader>
            <CardTitle>Material Metadata</CardTitle>
            <CardDescription>Select the institutional hierarchy, then choose a course and upload your file.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-6">

              {/* ── Hierarchy cascade ─────────────────────────────────── */}
              <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Institutional Hierarchy — University → Department → Batch → Course
                </p>

                {/* University */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold">
                    <University className="w-3.5 h-3.5" /> University *
                  </Label>
                  <Select value={selUni} onValueChange={handleUniChange} disabled={loading}>
                    <SelectTrigger className="bg-muted/10 border-slate-200 dark:border-white/10">
                      <SelectValue placeholder="Select University" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      {unis.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold">
                    <Building2 className="w-3.5 h-3.5" /> Department *
                  </Label>
                  <Select value={selDept} onValueChange={handleDeptChange} disabled={!selUni || loading}>
                    <SelectTrigger className="bg-muted/10 border-slate-200 dark:border-white/10 disabled:opacity-50">
                      <SelectValue placeholder={selUni ? "Select Department" : "Select University first"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      {depts.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Batch */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold">
                    <Layers className="w-3.5 h-3.5" /> Batch *
                  </Label>
                  <Select value={selBatch} onValueChange={handleBatchChange} disabled={!selDept || loading}>
                    <SelectTrigger className="bg-muted/10 border-slate-200 dark:border-white/10 disabled:opacity-50">
                      <SelectValue placeholder={selDept ? "Select Batch" : "Select Department first"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      {batches.map(b => (
                        <SelectItem key={b.id} value={b.id}>Batch {b.batch_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Course */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold">
                    <BookOpen className="w-3.5 h-3.5" /> Course *
                  </Label>
                  <Select value={selCourse} onValueChange={handleCourseChange} disabled={!selBatch || loading}>
                    <SelectTrigger className="bg-muted/10 border-slate-200 dark:border-white/10 disabled:opacity-50">
                      <SelectValue placeholder={selBatch ? "Select Course" : "Select Batch first"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      {courses.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.course_code} — {c.course_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ── Material details ───────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title / Name *</Label>
                  <Input
                    id="title"
                    placeholder="e.g. CSE-101 Midterm Prep Notes"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-muted/10 border-slate-200 dark:border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Material Type</Label>
                  <Select value={type} onValueChange={setType} disabled={loading}>
                    <SelectTrigger id="type" className="bg-muted/10 border-slate-200 dark:border-white/10">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="note">Lecture Notes</SelectItem>
                      <SelectItem value="previous_question">Question Bank</SelectItem>
                      <SelectItem value="solved_answer">Solution</SelectItem>
                      <SelectItem value="suggestion">Exam Suggestion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ── File upload ────────────────────────────────────────── */}
              <div className="space-y-2">
                <Label>Document Attachment *</Label>
                <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl p-8 flex flex-col items-center justify-center bg-muted/5 hover:bg-muted/10 transition-colors relative">
                  <Input
                    type="file"
                    id="file-upload"
                    accept="application/pdf,image/*,video/*,.doc,.docx"
                    onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]) }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                    disabled={loading}
                  />
                  <div className="flex flex-col items-center text-center space-y-2">
                    {file ? (
                      <>
                        <CheckCircle className="w-10 h-10 text-emerald-400 animate-bounce" />
                        <span className="font-semibold text-foreground">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-muted-foreground" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Click to upload or drag & drop</span>
                        <span className="text-xs text-muted-foreground">PDF, Images, Videos, Docs — up to 500 MB</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading || !isReady} className="w-full h-12 text-md font-bold">
                {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Upload className="w-5 h-5 mr-2" />}
                {loading ? "Uploading to R2..." : "Upload to Platform"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  )
}
