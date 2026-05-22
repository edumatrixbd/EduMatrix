"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  BookOpen,
  University,
  Building2,
  Layers,
  Loader2,
  RefreshCw,
  GraduationCap,
  CreditCard,
  Hash,
  Filter,
  XCircle
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { logAdminActivity } from "@/lib/activity-logger"
import { cn } from "@/lib/utils"

type Course = {
  id: string
  course_code: string
  course_name: string
  description: string
  instructor: string
  credits: number
  price: number
  university_id: string
  department_id: string
  batch_id: string
  active: boolean
  universities?: { name: string; short_name: string }
  departments?: { name: string; short_name: string }
  academic_batches?: { batch_number?: string; batch?: string }
}

type Uni = { id: string; name: string; short_name: string }
type Dept = { id: string; name: string; short_name: string; university_id: string }
type Batch = { id: string; batch_number: string; department_id: string }

const EMPTY_FORM = {
  course_code: "",
  course_name: "",
  description: "",
  instructor: "",
  credits: 3,
  university_id: "",
  department_id: "",
  batch_id: "",
  active: true,
}

export default function CoursesPage() {
  const supabase = createClient()

  const [courses, setCourses] = useState<Course[]>([])
  const [unis, setUnis] = useState<Uni[]>([])
  const [allDepts, setAllDepts] = useState<Dept[]>([])
  const [allBatches, setAllBatches] = useState<Batch[]>([])
  const [stats, setStats] = useState({
    universities: 0,
    departments: 0,
    batches: 0,
    courses: 0,
    activeCourses: 0,
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  // ─── Filter States ────────────────────────────────────────────────────────────
  const [filterUni, setFilterUni] = useState("")
  const [filterDept, setFilterDept] = useState("")
  const [filterBatch, setFilterBatch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterInstructor, setFilterInstructor] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [instructors, setInstructors] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("oldest_batch")

  const clearFilters = () => {
    setFilterUni("")
    setFilterDept("")
    setFilterBatch("")
    setFilterStatus("")
    setFilterInstructor("")
    setSearchQuery("")
    setSortBy("oldest_batch")
  }

  // ─── Fetch ───────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    const [
      uniRes, 
      deptRes, 
      batchRes,
      uniCountRes,
      deptCountRes,
      batchCountRes,
      courseCountRes,
      activeCourseCountRes
    ] = await Promise.all([
      supabase
        .from("universities")
        .select("id, name, short_name")
        .eq("active", true)
        .eq("is_locked", false)
        .order("name"),
      supabase
        .from("departments")
        .select("id, name, short_name, university_id")
        .eq("active", true)
        .eq("is_locked", false)
        .order("name"),
      supabase
        .from("academic_batches")
        .select("id, batch_number, department_id")
        .eq("active", true)
        .eq("is_locked", false)
        .order("batch_number", { ascending: true }),
      supabase
        .from("universities")
        .select("*", { count: "exact", head: true })
        .eq("active", true)
        .eq("is_locked", false),
      supabase
        .from("departments")
        .select("*", { count: "exact", head: true })
        .eq("active", true)
        .eq("is_locked", false),
      supabase
        .from("academic_batches")
        .select("*", { count: "exact", head: true })
        .eq("active", true)
        .eq("is_locked", false),
      supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .eq("is_locked", false),
      supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .eq("is_locked", false),
    ])

    const uData = uniRes.data || []
    const dData = deptRes.data || []
    const bData = batchRes.data || []

    if (!uniRes.error) setUnis(uData)
    if (!deptRes.error) setAllDepts(dData)
    if (!batchRes.error) setAllBatches(bData)

    setStats({
      universities: uniCountRes.count || 0,
      departments: deptCountRes.count || 0,
      batches: batchCountRes.count || 0,
      courses: courseCountRes.count || 0,
      activeCourses: activeCourseCountRes.count || 0,
    })

    // Fetch dynamic instructors list
    const { data: instData } = await supabase
      .from("courses")
      .select("instructor")
      .eq("status", "active")
      .eq("is_locked", false)
    const uniqueInstructors = Array.from(
      new Set((instData || []).map(c => c.instructor?.trim()).filter(Boolean))
    ).sort()
    setInstructors(uniqueInstructors)

    // Build conditional query based on selected filter values
    let query = supabase.from("courses").select("*").eq("status", "active").eq("is_locked", false)

    if (filterUni) {
      query = query.eq("university_id", filterUni)
    }
    if (filterDept) {
      query = query.eq("department_id", filterDept)
    }
    if (filterBatch) {
      query = query.eq("batch_id", filterBatch)
    }
    if (filterStatus) {
      query = query.eq("status", filterStatus)
    }
    if (filterInstructor) {
      query = query.eq("instructor", filterInstructor)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim()
      query = query.or(`course_name.ilike.%${q}%,course_code.ilike.%${q}%`)
    }

    query = query.order("course_code")
    const courseRes = await query

    if (courseRes.error) {
      console.error("COURSE_FETCH_ERROR MSG:", courseRes.error.message)
      console.log(JSON.stringify(courseRes.error, null, 2))
      toast.error("Failed to load courses: " + courseRes.error.message)
    } else {
      const enrichedCourses = (courseRes.data || []).map(c => ({
        ...c,
        universities: { name: uData.find(u => u.id === c.university_id)?.name || "Unknown", short_name: uData.find(u => u.id === c.university_id)?.short_name || "Unknown" },
        departments: { name: dData.find(d => d.id === c.department_id)?.name || "Unknown", short_name: dData.find(d => d.id === c.department_id)?.short_name || "Unknown" },
        academic_batches: { batch_number: bData.find(b => b.id === c.batch_id)?.batch_number || "Unknown" }
      }))

      // Apply dynamic sorting: latest/oldest batches numerically, or alphabetical course name
      if (sortBy === "latest_batch") {
        enrichedCourses.sort((a, b) => {
          const numA = parseInt(a.academic_batches.batch_number) || 0
          const numB = parseInt(b.academic_batches.batch_number) || 0
          return numB - numA // descending
        })
      } else if (sortBy === "oldest_batch") {
        enrichedCourses.sort((a, b) => {
          const numA = parseInt(a.academic_batches.batch_number) || 0
          const numB = parseInt(b.academic_batches.batch_number) || 0
          return numA - numB // ascending
        })
      } else if (sortBy === "course_name_az") {
        enrichedCourses.sort((a, b) => a.course_name.localeCompare(b.course_name))
      }

      setCourses(enrichedCourses)
    }

    setLoading(false)
  }, [supabase, filterUni, filterDept, filterBatch, filterStatus, filterInstructor, searchQuery, sortBy])

  useEffect(() => { fetchData() }, [fetchData])

  // ─── Open Dialogs ─────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingCourse(null)
    setForm({ ...EMPTY_FORM })
    setDialogOpen(true)
  }

  const openEdit = (course: Course) => {
    setEditingCourse(course)
    setForm({
      course_code: course.course_code,
      course_name: course.course_name,
      description: course.description || "",
      instructor: course.instructor || "",
      credits: course.credits || 3,
      university_id: course.university_id,
      department_id: course.department_id,
      batch_id: course.batch_id,
      active: course.active,
    })
    setDialogOpen(true)
  }

  // ─── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.university_id || !form.department_id || !form.batch_id) {
      return toast.error("Please complete the institutional hierarchy (Uni/Dept/Batch)")
    }
    if (!form.course_code.trim() || !form.course_name.trim()) {
      return toast.error("Course name and code are required")
    }

    const selectedUni = unis.find(u => u.id === form.university_id)
    const selectedDept = allDepts.find(d => d.id === form.department_id)
    const selectedBatch = allBatches.find(b => b.id === form.batch_id)

    const payload = {
      course_code: form.course_code.trim().toUpperCase(),
      course_name: form.course_name.trim(),
      description: form.description.trim(),
      instructor: form.instructor.trim(),
      credits: Number(form.credits),
      university_id: form.university_id,
      department_id: form.department_id,
      batch_id: form.batch_id,
      status: form.active ? 'active' : 'inactive' // legacy sync
    }

    console.log("COURSE PAYLOAD:", payload)
    setSaving(true)

    let error: any

    if (editingCourse) {
      const response = await fetch(`/api/admin/courses/${editingCourse.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok) {
        error = new Error(result.error || "Update failed")
      } else {
        await logAdminActivity("UPDATE_COURSE", "course", editingCourse.id, { course_name: payload.course_name })
      }
    } else {
      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok) {
        error = new Error(result.error || "Insert failed")
      } else {
        await logAdminActivity("CREATE_COURSE", "course", result.id, { course_name: payload.course_name })
      }
    }

    if (error) {
      console.log(JSON.stringify(error, null, 2))
      console.error("COURSE_SAVE_ERROR:", error)
      toast.error("Save failed: " + error.message)
      setSaving(false)
      return
    }

    toast.success(editingCourse ? "Course updated ✓" : "Course deployed ✓")
    setDialogOpen(false)
    setSaving(false)
    fetchData()
  }

  // ─── Toggle ───────────────────────────────────────────────────────────────────
  const handleToggle = async (course: Course) => {
    const newVal = !course.active
    console.log("toggle course active:", course.id, newVal)

    const { error } = await supabase
      .from("courses")
      .update({ active: newVal, status: newVal ? 'active' : 'inactive' })
      .eq("id", course.id)

    if (error) {
      console.error("COURSE_TOGGLE_ERROR:", error)
      toast.error("Update failed: " + error.message)
      return
    }

    await logAdminActivity("TOGGLE_COURSE_STATUS", "course", course.id, { active: newVal })

    toast.success("Course status updated ✓")
    fetchData()
  }

  // ─── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (course: Course) => {
    if (!confirm("Are you sure you want to delete this course?")) return

    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", course.id)

    if (error) {
      console.error("DELETE COURSE ERROR:", error)
      toast.error("Failed to delete: " + error.message)
      return
    }

    await logAdminActivity("DELETE_COURSE", "course", course.id, { course_name: course.course_name })

    toast.success("Course deleted successfully")
    fetchData()
  }

  // ─── Filter ───────────────────────────────────────────────────────────────────
  const filtered = courses

  // Dependent dropdowns
  const currentDepts = allDepts.filter(d => d.university_id === form.university_id)
  const currentBatches = allBatches.filter(b => b.department_id === form.department_id)

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Course Registry
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            100% DB-driven · Global academic catalog management
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={fetchData}
            className="h-10 px-4 rounded-xl border-white/10 font-black"
          >
            <RefreshCw className={cn("w-5 h-5 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            onClick={openAdd}
            className="bg-primary hover:bg-primary/90 text-white font-black rounded-xl h-10 px-5 shadow-xl shadow-primary/20 text-base"
          >
            <Plus className="w-6 h-6 mr-2" />
            Add Course
          </Button>
        </div>
      </motion.div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
         <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-card/50 backdrop-blur-sm rounded-2xl p-4 shadow-md flex flex-col justify-between min-h-[90px]">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Universities</span>
            <span className="text-lg font-black text-slate-900 dark:text-white mt-1">
               {stats.universities} {stats.universities === 1 ? 'University' : 'Universities'}
            </span>
         </Card>
         <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-card/50 backdrop-blur-sm rounded-2xl p-4 shadow-md flex flex-col justify-between min-h-[90px]">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Departments</span>
            <span className="text-lg font-black text-slate-900 dark:text-white mt-1">
               {stats.departments} {stats.departments === 1 ? 'Department' : 'Departments'}
            </span>
         </Card>
         <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-card/50 backdrop-blur-sm rounded-2xl p-4 shadow-md flex flex-col justify-between min-h-[90px]">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Batches</span>
            <span className="text-lg font-black text-slate-900 dark:text-white mt-1">
               {stats.batches} {stats.batches === 1 ? 'Batch' : 'Batches'}
            </span>
         </Card>
         <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-card/50 backdrop-blur-sm rounded-2xl p-4 shadow-md flex flex-col justify-between min-h-[90px]">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Courses</span>
            <span className="text-lg font-black text-slate-900 dark:text-white mt-1">
               {stats.courses} {stats.courses === 1 ? 'Course' : 'Courses'}
            </span>
         </Card>
         <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-card/50 backdrop-blur-sm rounded-2xl p-4 shadow-md flex flex-col justify-between min-h-[90px] col-span-2 md:col-span-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Active Courses</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
               {stats.activeCourses} Active
            </span>
         </Card>
      </div>

      {/* Filters Panel */}
      <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-card/50 backdrop-blur-sm rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
          <div className="flex items-center gap-3">
             <Filter className="w-5 h-5 text-primary" />
             <span className="font-black text-xs uppercase tracking-widest text-slate-800 dark:text-slate-200">Refine Catalog</span>
          </div>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black text-[10px] py-1 px-3 rounded-full">
            {filtered.length} {filtered.length === 1 ? 'Course' : 'Courses'} Matching
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {/* Search Input */}
           <div className="space-y-2 md:col-span-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 dark:text-slate-400">Search Course Code / Name</Label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  placeholder="Type to search code or name dynamically..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 h-11 rounded-2xl font-bold focus:ring-primary shadow-inner text-sm"
                />
              </div>
           </div>

           {/* University Filter */}
           <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 dark:text-slate-400">University</Label>
              <Select value={filterUni || "all"} onValueChange={v => {
                setFilterUni(v === "all" ? "" : v)
                setFilterDept("")
                setFilterBatch("")
              }}>
                 <SelectTrigger className="h-11 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 rounded-2xl font-black text-sm">
                   <SelectValue placeholder="All Universities" />
                 </SelectTrigger>
                 <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100">
                    <SelectItem value="all" className="font-bold py-3">All Universities</SelectItem>
                    {unis.map(u => <SelectItem key={u.id} value={u.id} className="font-bold py-3">{u.name}</SelectItem>)}
                 </SelectContent>
              </Select>
           </div>

           {/* Department Filter */}
           <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 dark:text-slate-400">Department</Label>
              <Select value={filterDept || "all"} onValueChange={v => {
                setFilterDept(v === "all" ? "" : v)
                setFilterBatch("")
              }}>
                 <SelectTrigger className="h-11 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 rounded-2xl font-black text-sm">
                   <SelectValue placeholder="All Departments" />
                 </SelectTrigger>
                 <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100">
                    <SelectItem value="all" className="font-bold py-3">All Departments</SelectItem>
                    {allDepts
                      .filter(d => !filterUni || d.university_id === filterUni)
                      .map(d => <SelectItem key={d.id} value={d.id} className="font-bold py-3">{d.name}</SelectItem>)}
                 </SelectContent>
              </Select>
           </div>

           {/* Batch Filter */}
           <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 dark:text-slate-400">Academic Batch</Label>
              <Select value={filterBatch || "all"} onValueChange={v => setFilterBatch(v === "all" ? "" : v)}>
                 <SelectTrigger className="h-11 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 rounded-2xl font-black text-sm">
                   <SelectValue placeholder="All Batches" />
                 </SelectTrigger>
                 <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100">
                    <SelectItem value="all" className="font-bold py-3">All Batches</SelectItem>
                    {allBatches
                      .filter(b => !filterDept || b.department_id === filterDept)
                      .map(b => <SelectItem key={b.id} value={b.id} className="font-bold py-3">Batch {b.batch_number}</SelectItem>)}
                 </SelectContent>
              </Select>
           </div>

           {/* Status Filter */}
           <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 dark:text-slate-400">Status</Label>
              <Select value={filterStatus || "all"} onValueChange={v => setFilterStatus(v === "all" ? "" : v)}>
                 <SelectTrigger className="h-11 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 rounded-2xl font-black text-sm">
                   <SelectValue placeholder="All Statuses" />
                 </SelectTrigger>
                 <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100">
                    <SelectItem value="all" className="font-bold py-3">All Statuses</SelectItem>
                    <SelectItem value="active" className="font-bold py-3">Active</SelectItem>
                    <SelectItem value="inactive" className="font-bold py-3">Inactive</SelectItem>
                 </SelectContent>
              </Select>
           </div>

           {/* Instructor Filter */}
           <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 dark:text-slate-400">Instructor</Label>
              <Select value={filterInstructor || "all"} onValueChange={v => setFilterInstructor(v === "all" ? "" : v)}>
                 <SelectTrigger className="h-11 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 rounded-2xl font-black text-sm">
                   <SelectValue placeholder="All Instructors" />
                 </SelectTrigger>
                 <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100">
                    <SelectItem value="all" className="font-bold py-3">All Instructors</SelectItem>
                    {instructors.map(ins => <SelectItem key={ins} value={ins} className="font-bold py-3">{ins}</SelectItem>)}
                 </SelectContent>
              </Select>
           </div>

           {/* Sort Dropdown */}
           <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 dark:text-slate-400">Sort Catalog</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                 <SelectTrigger className="h-11 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 rounded-2xl font-black text-sm">
                   <SelectValue placeholder="Sort By" />
                 </SelectTrigger>
                 <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100">
                    <SelectItem value="oldest_batch" className="font-bold py-3">Oldest Batch (Default)</SelectItem>
                    <SelectItem value="latest_batch" className="font-bold py-3">Latest Batch</SelectItem>
                    <SelectItem value="course_name_az" className="font-bold py-3">Course Name A-Z</SelectItem>
                 </SelectContent>
              </Select>
           </div>

           {/* Reset Filters */}
           <div className="flex items-end md:col-span-2">
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={!filterUni && !filterDept && !filterBatch && !filterStatus && !filterInstructor && !searchQuery && sortBy === "oldest_batch"}
                className="w-full h-11 rounded-2xl border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 font-black text-xs uppercase tracking-widest transition-all duration-300 disabled:opacity-40"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Clear Active Filters
              </Button>
           </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl">

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100 dark:bg-white/[0.02]">
              <TableRow className="border-slate-200 dark:border-white/5 hover:bg-transparent">
                <TableHead className="p-5 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Course Identity
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Institutional Context
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Specs
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 text-center">
                  Live
                </TableHead>
                <TableHead className="p-5 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-40">
                    <Loader2 className="animate-spin w-12 h-12 mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-40 text-slate-500 font-black italic uppercase tracking-widest text-sm"
                  >
                    No courses found in the registry.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((course) => (
                  <TableRow
                    key={course.id}
                    className="border-slate-200 dark:border-white/5 transition-all hover:bg-slate-50 dark:hover:bg-primary/[0.03]"
                  >
                    {/* Identity */}
                    <TableCell className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/5 flex items-center justify-center font-black text-primary text-xs shadow-2xl flex-shrink-0">
                          {course.course_code}
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-lg tracking-tight leading-none">
                            {course.course_name}
                          </p>
                          <div className="flex items-center gap-2">
                             <Badge variant="outline" className="text-[9px] font-black uppercase h-5 px-2 border-slate-200 dark:border-white/10">
                                {course.course_code}
                             </Badge>
                             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                {course.instructor || "No Instructor"}
                             </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Context */}
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <University className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-300">
                            {course.universities?.short_name || course.universities?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span className="font-bold text-[10px] text-slate-500 uppercase">
                            {course.departments?.short_name || course.departments?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                          <span className="font-bold text-[10px] text-slate-600 uppercase tracking-tighter">
                            Batch {course.academic_batches?.batch_number || course.academic_batches?.batch}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Specs */}
                    <TableCell>
                       <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                             <GraduationCap className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                             <span className="text-xs font-black text-indigo-700 dark:text-indigo-200">{course.credits} Credits</span>
                          </div>
                          
                       </div>
                    </TableCell>

                    {/* Active */}
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Switch
                          checked={!!course.active}
                          onCheckedChange={() => handleToggle(course)}
                        />
                        <Badge
                          className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5",
                            course.active
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                          )}
                        >
                          {course.active ? "Live" : "Draft"}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right p-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(course)}
                          className="h-9 w-9 text-primary hover:bg-primary/10 rounded-xl border border-transparent dark:border-white/5"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(course)}
                          className="h-9 w-9 text-red-500 hover:bg-red-500/10 rounded-xl border border-transparent dark:border-white/5"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl sm:max-w-[700px] p-0 overflow-hidden shadow-2xl">
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            <DialogTitle className="text-2xl font-black tracking-tight">
              {editingCourse ? "Modify Course" : "Deploy New Course"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">
              Course metadata linked to institutional hierarchy
            </DialogDescription>
          </div>

          <form onSubmit={handleSave} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
             {/* Institutional Context */}
             <div className="space-y-6">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 dark:text-slate-400">University *</Label>
                   <Select value={form.university_id} onValueChange={v => setForm({...form, university_id: v, department_id: "", batch_id: ""})}>
                      <SelectTrigger className="h-10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl font-black shadow-inner">
                        <SelectValue placeholder="Select University" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100">
                        {unis.map(u => <SelectItem key={u.id} value={u.id} className="font-bold py-3">{u.name}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 dark:text-slate-400">Department *</Label>
                   <Select value={form.department_id} onValueChange={v => setForm({...form, department_id: v, batch_id: ""})} disabled={!form.university_id}>
                      <SelectTrigger className={cn("h-10 rounded-xl font-black shadow-inner border", form.university_id ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700")}>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100">
                        {currentDepts.map(d => <SelectItem key={d.id} value={d.id} className="font-bold py-3">{d.name}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 dark:text-slate-400">Batch *</Label>
                   <Select value={form.batch_id} onValueChange={v => setForm({...form, batch_id: v})} disabled={!form.department_id}>
                      <SelectTrigger className={cn("h-10 rounded-xl font-black shadow-inner border", form.department_id ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700")}>
                        <SelectValue placeholder="Select Batch" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100">
                        {currentBatches.map(b => <SelectItem key={b.id} value={b.id} className="font-bold py-3">Batch {b.batch_number}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 dark:text-slate-400">Credits *</Label>
                   <Input type="number" step="0.5" value={form.credits} onChange={e => setForm({...form, credits: Number(e.target.value)})} className="h-10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl font-black text-center" required />
                </div>
             </div>

             {/* Identity & Specs */}
             <div className="space-y-6">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 dark:text-slate-400">Course Code *</Label>
                    <Input value={form.course_code} onChange={e => setForm({...form, course_code: e.target.value.toUpperCase()})} placeholder="e.g. CSE-101" className="h-10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl font-black uppercase" required />
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 dark:text-slate-400">Course Name *</Label>
                    <Input value={form.course_name} onChange={e => setForm({...form, course_name: e.target.value})} placeholder="e.g. Data Structures" className="h-10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl font-bold" required />
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 dark:text-slate-400">Instructor</Label>
                    <Input value={form.instructor} onChange={e => setForm({...form, instructor: e.target.value})} placeholder="e.g. Dr. John Doe" className="h-10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl font-bold" />
                </div>

                
             </div>

             <div className="md:col-span-2 space-y-6">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 dark:text-slate-400">Description</Label>
                    <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Brief course overview..." className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl font-medium min-h-[100px]" />
                </div>

                 <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
                   <div>
                       <p className="font-black text-slate-900 dark:text-slate-100 uppercase text-[10px] tracking-widest">Active Status</p>
                      <p className="text-[8px] text-slate-500 mt-0.5">Draft courses are hidden from students</p>
                   </div>
                   <Switch checked={form.active} onCheckedChange={v => setForm({...form, active: v})} />
                </div>

                <Button type="submit" disabled={saving} className="w-full h-10 bg-primary text-white font-black rounded-xl text-base shadow-2xl shadow-primary/30 mt-4">
                   {saving ? <Loader2 className="animate-spin w-6 h-6" /> : (editingCourse ? "Update Registry" : "Deploy Course")}
                </Button>
             </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
