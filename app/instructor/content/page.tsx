"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import { 
  Plus, 
  Video, 
  FileText, 
  FileQuestion, 
  Loader2,
  Trash2,
  Edit
} from "lucide-react"
import { toast } from "sonner"

export default function InstructorContentPage() {
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [content, setContent] = useState({
    videos: [] as any[],
    notes: [] as any[],
    questions: [] as any[],
  })

  // ── Hierarchy data ──────────────────────────────────────────
  const [unis,       setUnis]       = useState<any[]>([])
  const [allDepts,   setAllDepts]   = useState<any[]>([])
  const [allBatches, setAllBatches] = useState<any[]>([])
  const [hierUni,    setHierUni]    = useState("")
  const [hierDept,   setHierDept]   = useState("")
  const [hierBatch,  setHierBatch]  = useState("")

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load hierarchy data
      const [uniRes, deptRes, batchRes, courseRes] = await Promise.all([
        supabase.from("universities")    .select("id, name, short_name").eq("active", true).eq("is_locked", false).order("name"),
        supabase.from("departments")     .select("id, name, short_name, university_id").eq("active", true).eq("is_locked", false).order("name"),
        supabase.from("academic_batches").select("id, batch_number, department_id").eq("active", true).eq("is_locked", false).order("batch_number"),
        // Instructor's courses: fetch via instructor_courses join
        supabase.from("instructor_courses")
          .select("course:courses(id, course_name, course_code, university_id, department_id, batch_id)")
          .eq("instructor_id", user.id),
      ])

      setUnis      (uniRes.data    || [])
      setAllDepts  (deptRes.data   || [])
      setAllBatches(batchRes.data  || [])

      if (!courseRes.error) {
        const courseList = (courseRes.data || []).map((d: any) => d.course).filter(Boolean)
        setCourses(courseList)
        if (courseList.length > 0) setSelectedCourse(courseList[0].id)
      }
    } catch (error) {
      toast.error("Failed to load courses")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedCourse) fetchContent()
  }, [selectedCourse])

  const fetchContent = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      const [vData, nData, qData] = await Promise.all([
        supabase.from("content_materials").select("*").eq("course_id", selectedCourse).eq("type", "video"),
        supabase.from("content_materials").select("*").eq("course_id", selectedCourse).eq("type", "note"),
        supabase.from("content_materials").select("*").eq("course_id", selectedCourse).eq("type", "previous_question"),
      ])

      setContent({
        videos: vData.data || [],
        notes: nData.data || [],
        questions: qData.data || [],
      })
    } catch (error) {
      toast.error("Failed to load content")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (type: string, id: string) => {
    if (!confirm("Are you sure you want to delete this content?")) return
    
    const toastId = toast.loading("Deleting content...")
    try {
      const supabase = createClient()
      const table = "content_materials"

      const { error } = await supabase.from(table).delete().eq("id", id)
      if (error) throw error

      toast.success("Content deleted successfully", { id: toastId })
      fetchContent()
    } catch (error: any) {
      toast.error(error.message || "Delete failed", { id: toastId })
    }
  }

  const handleAction = (action: string) => {
    toast.info(`${action} is restricted to Admin panel for now to ensure quality control.`)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your course lectures, notes, and questions.</p>
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          {/* Hierarchy filters */}
          <div className="flex flex-wrap gap-2">
            <Select
              value={hierUni}
              onValueChange={v => { setHierUni(v); setHierDept(""); setHierBatch("") }}
            >
              <SelectTrigger className="w-[130px] h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10">
                <SelectValue placeholder="University" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <SelectItem value="all">All Universities</SelectItem>
                {unis.map(u => <SelectItem key={u.id} value={u.id}>{u.short_name || u.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select
              value={hierDept}
              onValueChange={v => { setHierDept(v); setHierBatch("") }}
              disabled={!hierUni || hierUni === "all"}
            >
              <SelectTrigger className="w-[130px] h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 disabled:opacity-50">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <SelectItem value="all">All Depts</SelectItem>
                {allDepts.filter(d => d.university_id === hierUni).map(d => <SelectItem key={d.id} value={d.id}>{d.short_name || d.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select
              value={hierBatch}
              onValueChange={v => setHierBatch(v)}
              disabled={!hierDept || hierDept === "all"}
            >
              <SelectTrigger className="w-[110px] h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 disabled:opacity-50">
                <SelectValue placeholder="Batch" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <SelectItem value="all">All Batches</SelectItem>
                {allBatches.filter(b => b.department_id === hierDept).map(b => <SelectItem key={b.id} value={b.id}>Batch {b.batch_number}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Course selector filtered by hierarchy */}
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10">
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto z-50 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10">
              {(() => {
                const filtered = courses.filter(c => {
                  if (hierBatch && hierBatch !== "all") return c.batch_id === hierBatch
                  if (hierDept  && hierDept  !== "all") return c.department_id === hierDept
                  if (hierUni   && hierUni   !== "all") return c.university_id === hierUni
                  return true
                })
                if (!filtered.length) return (
                  <SelectItem value="none" disabled className="text-muted-foreground italic">No matching courses</SelectItem>
                )
                return filtered.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.course_code} - {c.course_name}</SelectItem>
                ))
              })()}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="videos" className="space-y-6">
        <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-1">
          <TabsTrigger value="videos" className="data-[state=active]:bg-primary">
            <Video className="w-4 h-4 mr-2" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="notes" className="data-[state=active]:bg-primary">
            <FileText className="w-4 h-4 mr-2" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="questions" className="data-[state=active]:bg-primary">
            <FileQuestion className="w-4 h-4 mr-2" />
            Questions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Video Lectures</h3>
            <Button size="sm" onClick={() => handleAction("Adding videos")} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> Add Video
            </Button>
          </div>
          {loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.videos.map(v => (
              <Card key={v.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5">
                <CardHeader className="p-4">
                  <CardTitle className="text-base">{v.title}</CardTitle>
                  <CardDescription>Lecture #{v.lecture_number}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleAction("Editing content")}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete('video', v.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></Button>
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
           <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Study Notes</h3>
            <Button size="sm" onClick={() => handleAction("Adding notes")} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> Add Note
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.notes.map(n => (
              <Card key={n.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5">
                <CardHeader className="p-4">
                  <CardTitle className="text-base">{n.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleAction("Editing content")}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete('note', n.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
           <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Previous Questions</h3>
            <Button size="sm" onClick={() => handleAction("Adding questions")} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> Add Question
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.questions.map(q => (
              <Card key={q.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5">
                <CardHeader className="p-4">
                  <CardTitle className="text-base">{q.exam_type}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleAction("Editing content")}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete('question', q.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
