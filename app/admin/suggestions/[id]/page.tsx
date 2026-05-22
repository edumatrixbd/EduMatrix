"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { ArrowLeft, Save, Trash2, Sparkles } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function SuggestionEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const isAdd = id === "add"
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(!isAdd)
  
  const [universities, setUniversities] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    university_id: "",
    department_id: "",
    semester_id: "1",
    batch_id: "none",
    course_id: "",
    priority: "medium",
    study_tips: "",
    status: "active",
  })

  useEffect(() => {
    fetchUniversities()
    if (!isAdd) fetchSuggestion()
  }, [])

  useEffect(() => {
    if (formData.university_id) fetchDepartments(formData.university_id)
  }, [formData.university_id])

  useEffect(() => {
    if (formData.university_id && formData.department_id) {
      fetchBatches(formData.university_id, formData.department_id)
      fetchCourses(formData.university_id, formData.department_id)
    }
  }, [formData.university_id, formData.department_id])

  const fetchUniversities = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('universities').select('*').order('name')
    if (data) setUniversities(data)
  }

  const fetchDepartments = async (uniId: string) => {
    const supabase = createClient()
    const { data } = await supabase.from('departments').select('*').eq('university_id', uniId).order('name')
    if (data) setDepartments(data)
  }

  const fetchBatches = async (uniId: string, deptId: string) => {
    const supabase = createClient()
    const { data } = await supabase.from('academic_batches').select('*').eq('university_id', uniId).eq('department_id', deptId).order('batch')
    if (data) setBatches(data)
  }

  const fetchCourses = async (uniId: string, deptId: string) => {
    const supabase = createClient()
    const { data } = await supabase.from('courses').select('*').eq('university_id', uniId).eq('department_id', deptId).order('course_name')
    if (data) setCourses(data)
  }

  const fetchSuggestion = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('exam_suggestions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (data) {
        setFormData({
          title: data.title,
          description: data.description || "",
          university_id: data.university_id || "",
          department_id: data.department_id || "",
          semester_id: String(data.semester_id || 1),
          batch_id: data.batch_id || "none",
          course_id: data.course_id || "",
          priority: data.priority || "medium",
          study_tips: data.study_tips || "",
          status: data.status || "active",
        })
      }
    } catch (error) {
      console.error("Error fetching suggestion:", error)
      toast.error("Failed to load suggestion details")
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const payload = {
        ...formData,
        semester_id: parseInt(formData.semester_id),
        batch_id: formData.batch_id === "none" ? null : formData.batch_id,
      }

      let error
      if (isAdd) {
        ({ error } = await supabase.from('exam_suggestions').insert(payload))
      } else {
        ({ error } = await supabase.from('exam_suggestions').update(payload).eq('id', id))
      }

      if (error) throw error
      
      toast.success(isAdd ? "Suggestion created!" : "Suggestion updated!")
      router.push("/admin/suggestions")
    } catch (error: any) {
      console.error("Error saving suggestion:", error)
      toast.error(error.message || "Failed to save suggestion")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground font-medium">Loading editor...</p>
    </div>
  )

  return (
    <div className="space-y-8 pb-20">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4"
      >
        <Link href="/admin/suggestions">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-foreground">{isAdd ? "Create Suggestion" : "Edit Suggestion"}</h1>
          <p className="text-muted-foreground font-medium">Provide exam blueprints and high-priority topics</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-border/50 shadow-xl shadow-black/5 rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 p-8">
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Suggestion Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest ml-1">Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Midterm 2024 Algorithm Blueprint"
                  className="h-12 rounded-xl bg-background border-border/50 focus:border-primary/50 transition-all font-bold"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest ml-1">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Briefly describe what this suggestion covers..."
                  className="rounded-xl bg-background border-border/50 focus:border-primary/50 transition-all min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest ml-1">Study Tips & Strategy</Label>
                <Textarea
                  value={formData.study_tips}
                  onChange={(e) => setFormData({ ...formData, study_tips: e.target.value })}
                  placeholder="Provide actionable tips for students..."
                  className="rounded-xl bg-background border-border/50 focus:border-primary/50 transition-all min-h-[150px] font-medium"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-border/50 shadow-xl shadow-black/5 rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 p-8">
              <CardTitle className="text-xl font-black">Targeting</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest ml-1">University *</Label>
                <Select value={formData.university_id} onValueChange={(v) => setFormData({ ...formData, university_id: v })}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select University" />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest ml-1">Department *</Label>
                <Select value={formData.department_id} onValueChange={(v) => setFormData({ ...formData, department_id: v })} disabled={!formData.university_id}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest ml-1">Semester *</Label>
                  <Select value={formData.semester_id} onValueChange={(v) => setFormData({ ...formData, semester_id: v })}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(s => <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest ml-1">Batch</Label>
                  <Select value={formData.batch_id} onValueChange={(v) => setFormData({ ...formData, batch_id: v })} disabled={!formData.department_id}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">All Batches</SelectItem>
                      {batches.map(b => <SelectItem key={b.id} value={b.id}>Batch {b.batch}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest ml-1">Course *</Label>
                <Select value={formData.course_id} onValueChange={(v) => setFormData({ ...formData, course_id: v })} disabled={!formData.department_id}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select Course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(c => <SelectItem key={c.id} value={c.id}>[{c.course_code}] {c.course_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest ml-1">Priority</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest ml-1">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-black h-14 rounded-2xl shadow-xl shadow-primary/20 mt-4"
              >
                {loading ? "Saving..." : <><Save className="w-5 h-5 mr-2" /> {isAdd ? "Create" : "Update"} Suggestion</>}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
