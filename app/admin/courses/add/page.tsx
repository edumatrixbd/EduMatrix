"use client"

import { useState, useEffect } from "react"
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
import { ArrowLeft, Loader2, Sparkles } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function AddCoursePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Data Lists
  const [universities, setUniversities] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [semesters, setSemesters] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])

  const [formData, setFormData] = useState({
    course_code: "",
    course_name: "",
    description: "",
    instructor_id: "",
    credits: "3",
    semester: "1", // Numeric fallback
    semester_id: "", // Named term ID
    price: "0",
    status: "active",
    university_id: "",
    department_id: "",
    batch_id: "",
    category: "Mid",
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (formData.university_id) fetchHierarchyForUni(formData.university_id)
  }, [formData.university_id])

  useEffect(() => {
    if (formData.university_id && formData.department_id) {
      fetchBatches(formData.university_id, formData.department_id)
    }
  }, [formData.university_id, formData.department_id])

  const fetchInitialData = async () => {
    const supabase = createClient()
    const [uniRes, instRes] = await Promise.all([
      supabase.from('universities').select('*').eq('status', 'active').order('name'),
      supabase.from('profiles').select('id, full_name').eq('role', 'instructor')
    ])
    if (uniRes.data) setUniversities(uniRes.data)
    if (instRes.data) setInstructors(instRes.data)
  }

  const fetchHierarchyForUni = async (uniId: string) => {
    const supabase = createClient()
    const [deptRes, semRes] = await Promise.all([
      supabase.from('departments').select('*').eq('university_id', uniId).eq('status', 'active').order('name'),
      supabase.from('semesters').select('*').eq('university_id', uniId).eq('status', 'active').order('created_at', { ascending: false })
    ])
    if (deptRes.data) setDepartments(deptRes.data)
    if (semRes.data) setSemesters(semRes.data)
  }

  const fetchBatches = async (uniId: string, deptId: string) => {
    const supabase = createClient()
    const { data } = await supabase.from('academic_batches').select('*').match({ university_id: uniId, department_id: deptId, status: 'active' }).order('batch_number')
    if (data) setBatches(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Get the short names for compatibility with legacy string-based columns
      const uni = universities.find(u => u.id === formData.university_id)
      const dept = departments.find(d => d.id === formData.department_id)
      const batch = batches.find(b => b.id === formData.batch_id)

      const payload = {
        ...formData,
        university: uni?.short_name,
        department: dept?.short_name,
        batch: batch?.batch_number,
        credits: parseInt(formData.credits),
        semester: parseInt(formData.semester),
        price: parseFloat(formData.price),
        instructor: instructors.find(i => i.id === formData.instructor_id)?.full_name
      }

      const { error } = await supabase.from('courses').insert(payload)
      if (error) throw error
      
      toast.success("Course added successfully!")
      router.push("/admin/courses")
    } catch (error: any) {
      console.error("Error adding course:", error)
      toast.error(error.message || "Failed to add course")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 pb-20">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
        <Link href="/admin/courses">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-foreground">Add New Course</h1>
          <p className="text-muted-foreground font-medium">Define academic content and subscription targeting</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-border/50 shadow-xl shadow-black/5 rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-500">Course Code *</Label>
                  <Input
                    value={formData.course_code}
                    onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                    placeholder="CSE-201"
                    className="h-14 bg-background border-border/50 rounded-2xl font-bold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-500">Course Name *</Label>
                  <Input
                    value={formData.course_name}
                    onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                    placeholder="Data Structures"
                    className="h-14 bg-background border-border/50 rounded-2xl font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-500">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide a brief overview of the course curriculum..."
                  className="bg-background border-border/50 rounded-2xl min-h-[150px] p-6"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-500">Instructor *</Label>
                    <Select value={formData.instructor_id} onValueChange={(v) => setFormData({ ...formData, instructor_id: v })}>
                      <SelectTrigger className="h-14 bg-background border-border/50 rounded-2xl">
                        <SelectValue placeholder="Select Instructor" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        {instructors.map(inst => <SelectItem key={inst.id} value={inst.id}>{inst.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-500">Subscription Price (৳) *</Label>
                   <Input
                     type="number"
                     value={formData.price}
                     onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                     className="h-14 bg-background border-border/50 rounded-2xl font-black text-xl text-primary"
                     required
                   />
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
           <Card className="border-border/50 shadow-xl shadow-black/5 rounded-[2.5rem] overflow-hidden">
             <CardHeader className="bg-muted/30 border-b border-border/50 p-8">
                <CardTitle className="text-xl font-black flex items-center gap-2">
                   <Sparkles className="w-5 h-5 text-primary" /> Targeting
                </CardTitle>
             </CardHeader>
             <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-500">University *</Label>
                  <Select value={formData.university_id} onValueChange={(v) => setFormData({ ...formData, university_id: v })}>
                    <SelectTrigger className="h-12 bg-background border-border/50 rounded-xl">
                      <SelectValue placeholder="Select Institution" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      {universities.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-500">Department *</Label>
                  <Select value={formData.department_id} onValueChange={(v) => setFormData({ ...formData, department_id: v })} disabled={!formData.university_id}>
                    <SelectTrigger className="h-12 bg-background border-border/50 rounded-xl">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-500">Academic Term (Semester) *</Label>
                  <Select value={formData.semester_id} onValueChange={(v) => setFormData({ ...formData, semester_id: v })} disabled={!formData.university_id}>
                    <SelectTrigger className="h-12 bg-background border-border/50 rounded-xl">
                      <SelectValue placeholder="Select Semester Term" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      {semesters.map(s => <SelectItem key={s.id} value={s.id}>{s.name} {s.is_current && "(Current)"}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-500">Batch Cohort *</Label>
                  <Select value={formData.batch_id} onValueChange={(v) => setFormData({ ...formData, batch_id: v })} disabled={!formData.department_id}>
                    <SelectTrigger className="h-12 bg-background border-border/50 rounded-xl">
                      <SelectValue placeholder="Select Batch" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      {batches.map(b => <SelectItem key={b.id} value={b.id}>Batch {b.batch_number}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-500">Level (Numeric)</Label>
                    <Input type="number" value={formData.semester} onChange={(e) => setFormData({...formData, semester: e.target.value})} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-500">Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleSubmit} 
                  disabled={loading || !formData.batch_id || !formData.semester_id}
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-xl shadow-primary/20 mt-4"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Publish Course"}
                </Button>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  )
}
