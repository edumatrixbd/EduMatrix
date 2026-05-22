"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Plus, 
  Edit, 
  Trash2, 
  University, 
  Building2, 
  Layers, 
  Loader2, 
  Lock, 
  Unlock,
  CheckCircle2,
  XCircle,
  Link2,
  Calendar,
  BookOpen,
  Search,
  Globe,
  Upload,
  Zap,
  MoreVertical
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function AcademicManagementPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("universities")

  // --- Data States ---
  const [universities, setUniversities] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [semesters, setSemesters] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])

  // --- Filter/Selection States ---
  const [selectedUniId, setSelectedUniId] = useState<string>("")
  const [selectedDeptId, setSelectedDeptId] = useState<string>("")
  const [selectedBatchId, setSelectedBatchId] = useState<string>("")
  const [selectedSemId, setSelectedSemId] = useState<string>("")
  
  const [searchTerm, setSearchTerm] = useState("")

  // --- Dialog States ---
  const [activeDialog, setActiveDialog] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<any>(null)

  // --- Form States ---
  const [uniForm, setUniForm] = useState({ name: "", short_name: "", slug: "", logo_url: "", active: true, locked: true })
  const [deptForm, setDeptForm] = useState({ name: "", short_name: "", code: "", active: true })
  const [batchForm, setBatchForm] = useState({ batch: "", batch_number: "", status: "active" })
  const [semForm, setSemForm] = useState({ name: "", code: "", is_current: false, status: "active" })
  const [courseForm, setCourseForm] = useState({ 
    course_name: "", 
    course_code: "", 
    instructor: "", 
    credits: 3, 
    price: 0,
    status: "active" 
  })

  // --- Initial Fetch ---
  useEffect(() => {
    fetchUniversities()
  }, [])

  useEffect(() => {
    if (selectedUniId) fetchDepartments(selectedUniId)
    if (activeTab === 'semesters' && selectedUniId) fetchSemesters(selectedUniId)
  }, [selectedUniId, activeTab])

  useEffect(() => {
    if (selectedDeptId) fetchBatches(selectedDeptId)
  }, [selectedDeptId])

  useEffect(() => {
    if (activeTab === 'courses' && selectedUniId && selectedDeptId) fetchCourses()
  }, [selectedUniId, selectedDeptId, selectedBatchId, selectedSemId, activeTab])

  const fetchUniversities = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('universities').select('*').order('name')
    if (!error) setUniversities(data || [])
    setLoading(false)
  }

  const fetchDepartments = async (uniId: string) => {
    const { data, error } = await supabase.from('departments').select('*').eq('university_id', uniId).order('name')
    if (!error) setDepartments(data || [])
  }

  const fetchBatches = async (deptId: string) => {
    const { data, error } = await supabase.from('academic_batches').select('*').eq('department_id', deptId).order('batch_number')
    if (!error) setBatches(data || [])
  }

  const fetchSemesters = async (uniId: string) => {
    const { data, error } = await supabase.from('semesters').select('*').eq('university_id', uniId).order('name', { ascending: false })
    if (!error) setSemesters(data || [])
  }

  const fetchCourses = async () => {
    let query = supabase.from('courses').select('*, semesters(name)').eq('university_id', selectedUniId)
    if (selectedDeptId) query = query.eq('department_id', selectedDeptId)
    if (selectedBatchId) query = query.eq('batch_id', selectedBatchId)
    if (selectedSemId) query = query.eq('semester_id', selectedSemId)
    
    const { data, error } = await query.order('course_name')
    if (!error) setCourses(data || [])
  }

  // --- CRUD Handlers ---

  const handleSaveUniversity = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 1. Validate inputs
    if (!uniForm.name || !uniForm.short_name || !uniForm.slug) {
      return toast.error("Name, Short Name, and Slug are required")
    }

    setIsActionLoading(true)

    // 2. Prepare payload
    const payload = {
      name: uniForm.name,
      short_name: uniForm.short_name,
      slug: uniForm.slug,
      logo_url: uniForm.logo_url,
      active: uniForm.active,
      locked: uniForm.locked,
      status: uniForm.active ? 'active' : 'inactive' // Keep status synced for RLS
    }

    // 4. Add debug
    console.log("payload:", payload)

    try {
      const supabase = createClient()
      let error
      
      if (editingItem) {
        ({ error } = await supabase.from('universities').update(payload).eq('id', editingItem.id))
      } else {
        ({ error } = await supabase.from('universities').insert(payload))
      }

      // 4. Add debug (error)
      if (error) {
        console.log("error:", error)
        throw error
      }

      // 5. If success
      toast.success(editingItem ? "University updated!" : "University registered successfully!")
      setActiveDialog(null)
      fetchUniversities()
    } catch (err: any) {
      // 6. If error
      console.error("UNI_SAVE_EXCEPTION:", err)
      toast.error(err.message || "Failed to save university. Check console for details.")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUniId) return toast.error("No university selected")
    setIsActionLoading(true)
    const payload = { ...deptForm, university_id: selectedUniId, code: deptForm.code || deptForm.short_name, status: deptForm.active ? 'active' : 'inactive' }
    try {
      let error
      if (editingItem) {
        ({ error } = await supabase.from('departments').update(payload).eq('id', editingItem.id))
      } else {
        ({ error } = await supabase.from('departments').insert(payload))
      }
      if (error) throw error
      toast.success("Department saved successfully")
      setActiveDialog(null)
      fetchDepartments(selectedUniId)
    } catch (err: any) {
      console.error("DEPT_SAVE_ERROR:", err)
      toast.error(err.message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUniId || !selectedDeptId) return toast.error("Uni/Dept required")
    setIsActionLoading(true)
    const payload = { 
      university_id: selectedUniId, 
      department_id: selectedDeptId, 
      batch: batchForm.batch || batchForm.batch_number, 
      batch_number: batchForm.batch_number || batchForm.batch,
      status: batchForm.status 
    }
    try {
      let error
      if (editingItem) {
        ({ error } = await supabase.from('academic_batches').update(payload).eq('id', editingItem.id))
      } else {
        ({ error } = await supabase.from('academic_batches').insert(payload))
      }
      if (error) throw error
      toast.success("Cohort targeting updated")
      setActiveDialog(null)
      fetchBatches(selectedDeptId)
    } catch (err: any) {
      console.error("BATCH_SAVE_ERROR:", err)
      toast.error(err.message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleSaveSemester = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUniId) return toast.error("Select university first")
    setIsActionLoading(true)
    try {
      if (semForm.is_current) {
        await supabase.from('semesters').update({ is_current: false }).eq('university_id', selectedUniId)
      }
      const payload = { ...semForm, university_id: selectedUniId }
      let error
      if (editingItem) {
        ({ error } = await supabase.from('semesters').update(payload).eq('id', editingItem.id))
      } else {
        ({ error } = await supabase.from('semesters').insert(payload))
      }
      if (error) throw error
      toast.success("Academic term saved")
      setActiveDialog(null)
      fetchSemesters(selectedUniId)
    } catch (err: any) {
      console.error("SEM_SAVE_ERROR:", err)
      toast.error(err.message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUniId || !selectedDeptId) return toast.error("Relational context missing (Uni/Dept)")
    setIsActionLoading(true)
    const payload = { 
      ...courseForm, 
      university_id: selectedUniId, 
      department_id: selectedDeptId,
      batch_id: selectedBatchId || null,
      semester_id: selectedSemId || null
    }
    try {
      let error
      if (editingItem) {
        ({ error } = await supabase.from('courses').update(payload).eq('id', editingItem.id))
      } else {
        ({ error } = await supabase.from('courses').insert(payload))
      }
      if (error) throw error
      toast.success("Curriculum updated")
      setActiveDialog(null)
      fetchCourses()
    } catch (err: any) {
      console.error("COURSE_SAVE_ERROR:", err)
      toast.error(err.message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDelete = async (table: string, id: string) => {
    if (!confirm("Are you sure? This action may impact students and content dependencies.")) return
    setIsActionLoading(true)
    try {
      // Basic dependency checks for safety
      if (table === 'departments') {
        const { count } = await supabase.from('academic_batches').select('id', { count: 'exact', head: true }).eq('department_id', id)
        if ((count || 0) > 0) return toast.error("Cannot delete. Department contains active batches.")
      }

      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) {
        console.error(`DELETE_ERROR (${table}):`, error)
        toast.error(`Delete failed: ${error.message}. Try disabling it instead.`)
      } else {
        toast.success("Record purged from database")
        if (table === 'universities') fetchUniversities()
        if (table === 'departments') fetchDepartments(selectedUniId)
        if (table === 'academic_batches') fetchBatches(selectedDeptId)
        if (table === 'semesters') fetchSemesters(selectedUniId)
        if (table === 'courses') fetchCourses()
      }
    } catch (err: any) {
      toast.error("Operation failed")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleToggle = async (table: string, id: string, field: string, value: boolean) => {
    console.log(`updating ${field}:`, id, value)
    try {
      const { error } = await supabase
        .from(table)
        .update({ [field]: value })
        .eq('id', id)

      if (error) {
        console.log("error:", error)
        throw error
      }
      
      toast.success(`Institutional ${field} synchronized with database`)
      fetchUniversities()
    } catch (error: any) {
      console.error("TOGGLE_ERROR:", error)
      toast.error(error.message || "Toggle failed")
    }
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
        <div>
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-black uppercase tracking-widest px-4 py-1">Platform Hierarchy v2</Badge>
          <h1 className="text-5xl font-black text-foreground tracking-tighter">Academic Control Center</h1>
          <p className="text-muted-foreground mt-3 text-lg font-medium max-w-2xl">
            100% Real-time database management for universities, departments, cohorts, and curricula.
          </p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" className="rounded-2xl h-14 px-8 font-black border-border" onClick={() => window.location.reload()}>
              Refresh DB State
           </Button>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
        <TabsList className="bg-muted/50 border border-border p-1 rounded-[1.5rem] h-16 w-full flex justify-between overflow-x-auto">
          <TabsTrigger value="universities" className="flex-1 rounded-[1.25rem] font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full transition-all">
            <University className="w-4 h-4 mr-2" /> Universities
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex-1 rounded-[1.25rem] font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full transition-all">
            <Building2 className="w-4 h-4 mr-2" /> Departments
          </TabsTrigger>
          <TabsTrigger value="batches" className="flex-1 rounded-[1.25rem] font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full transition-all">
            <Layers className="w-4 h-4 mr-2" /> Batches
          </TabsTrigger>
          <TabsTrigger value="semesters" className="flex-1 rounded-[1.25rem] font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full transition-all">
            <Calendar className="w-4 h-4 mr-2" /> Semesters
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex-1 rounded-[1.25rem] font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full transition-all">
            <BookOpen className="w-4 h-4 mr-2" /> Courses
          </TabsTrigger>
        </TabsList>

        {/* --- UNIVERSITIES --- */}
        <TabsContent value="universities" className="space-y-6">
          <Card className="border-border bg-card rounded-xl overflow-hidden shadow-sm">
            <CardHeader className="p-10 flex flex-row items-center justify-between border-b border-border bg-muted/20">
              <div className="space-y-1">
                <CardTitle className="text-3xl font-black tracking-tight">Institutional Registry</CardTitle>
                <CardDescription className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Global university infrastructure</CardDescription>
              </div>
              <Button onClick={() => { setEditingItem(null); setUniForm({ name: "", short_name: "", slug: "", logo_url: "", active: true, locked: true }); setActiveDialog('uni'); }} className="bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl px-8 h-14 shadow-xl shadow-primary/20">
                <Plus className="w-5 h-5 mr-2" /> Add University
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="p-10 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Institution</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">Active</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">State</TableHead>
                    <TableHead className="text-right p-10 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {universities.map(uni => (
                    <TableRow key={uni.id} className="border-border hover:bg-muted/50 transition-all group">
                      <TableCell className="p-10">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-[1.25rem] bg-muted border border-border flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                            {uni.logo_url ? <img src={uni.logo_url} className="w-10 h-10 object-contain" /> : <span className="font-black text-primary text-xl uppercase">{uni.short_name.slice(0,2)}</span>}
                          </div>
                          <div>
                            <p className="font-black text-lg text-foreground tracking-tight">{uni.name}</p>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mt-1">
                               <Globe className="w-3 h-3" /> {uni.slug} • {uni.short_name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center relative z-20">
                        <div className="flex flex-col items-center gap-2">
                           <Switch 
                              checked={uni.active} 
                              onCheckedChange={(v) => { console.log("active toggle clicked", uni.id); handleToggle('universities', uni.id, 'active', v); }} 
                              className="relative z-30 pointer-events-auto"
                           />
                           <Badge className={cn("text-[8px] font-black uppercase px-2 py-0.5", uni.active ? "bg-emerald-500 text-white" : "bg-red-500 text-white")}>
                              {uni.active ? 'Operational' : 'Maintenance'}
                           </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center relative z-20">
                         <div className="flex flex-col items-center gap-2">
                            <Button 
                               variant="outline" 
                               size="sm" 
                               onClick={() => { console.log("lock toggle clicked", uni.id); handleToggle('universities', uni.id, 'locked', !uni.locked); }}
                               className={cn("h-10 px-4 rounded-xl font-black text-[10px] uppercase transition-all relative z-30 pointer-events-auto", uni.locked ? "bg-muted border-border text-muted-foreground" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20")}
                            >
                               {uni.locked ? <Lock className="w-3 h-3 mr-2" /> : <Unlock className="w-3 h-3 mr-2 text-emerald-400" />}
                               {uni.locked ? 'Locked' : 'Open'}
                            </Button>
                         </div>
                      </TableCell>
                      <TableCell className="text-right p-10 relative z-20">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingItem(uni); setUniForm({ name: uni.name, short_name: uni.short_name, slug: uni.slug || "", logo_url: uni.logo_url || "", active: uni.active, locked: uni.locked }); setActiveDialog('uni'); }} className="h-12 w-12 text-primary hover:bg-primary/10 rounded-2xl border border-border relative z-30 pointer-events-auto">
                            <Edit className="w-5 h-5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete('universities', uni.id)} className="h-12 w-12 text-red-500 hover:bg-red-500/10 rounded-2xl border border-border relative z-30 pointer-events-auto">
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- DEPARTMENTS --- */}
        <TabsContent value="departments" className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="md:col-span-1 border-border bg-card rounded-[2.5rem] p-10 space-y-8 h-fit sticky top-8 shadow-sm">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Relational Scope</Label>
                    <Select value={selectedUniId} onValueChange={setSelectedUniId}>
                      <SelectTrigger className="h-16 bg-background border-input rounded-[1.5rem] font-black text-lg focus:ring-primary shadow-inner">
                        <SelectValue placeholder="Select University" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border rounded-2xl">
                        {universities.map(u => <SelectItem key={u.id} value={u.id} className="font-bold py-3">{u.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                 </div>
                 <Button disabled={!selectedUniId} onClick={() => { setEditingItem(null); setDeptForm({ name: "", short_name: "", code: "", active: true }); setActiveDialog('dept'); }} className="w-full h-16 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/20 text-lg">
                    <Plus className="w-6 h-6 mr-2" /> Add Department
                 </Button>
              </Card>

              <Card className="md:col-span-2 border-border bg-card rounded-[2.5rem] overflow-hidden shadow-sm">
                 {!selectedUniId ? (
                   <div className="py-40 flex flex-col items-center justify-center text-center space-y-6">
                      <div className="w-24 h-24 rounded-[2rem] bg-muted border border-border flex items-center justify-center shadow-sm">
                         <Building2 className="w-12 h-12 text-foreground" />
                      </div>
                      <div className="space-y-1">
                         <h3 className="text-2xl font-black tracking-tight text-foreground uppercase">Context Required</h3>
                         <p className="text-muted-foreground font-bold italic text-sm">Select a university from the registry to manage its academic departments.</p>
                      </div>
                   </div>
                 ) : (
                    <Table>
                       <TableHeader className="bg-muted/50">
                          <TableRow className="border-border hover:bg-transparent">
                             <TableHead className="p-10 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Department</TableHead>
                             <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Code/Status</TableHead>
                             <TableHead className="text-right p-10 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {departments.length === 0 ? (
                             <TableRow><TableCell colSpan={3} className="text-center py-20 font-bold text-muted-foreground italic uppercase tracking-tighter">No departments registered</TableCell></TableRow>
                          ) : departments.map(dept => (
                             <TableRow key={dept.id} className="border-border hover:bg-muted/50 transition-all group">
                                <TableCell className="p-10">
                                   <div className="flex items-center gap-5">
                                      <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center font-black text-primary text-sm uppercase">
                                         {dept.short_name.slice(0,2)}
                                      </div>
                                      <span className="font-black text-lg tracking-tight text-foreground">{dept.name}</span>
                                   </div>
                                </TableCell>
                                <TableCell>
                                   <div className="flex items-center gap-3">
                                      <Badge variant="outline" className="font-black text-[10px] uppercase border-border text-muted-foreground h-7 px-3">{dept.code || dept.short_name}</Badge>
                                      <Badge className={cn("font-black text-[10px] uppercase h-7 px-3", dept.active ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                                         {dept.active ? 'Active' : 'Disabled'}
                                      </Badge>
                                   </div>
                                </TableCell>
                                <TableCell className="text-right p-10">
                                   <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                      <Button variant="ghost" size="icon" onClick={() => { setEditingItem(dept); setDeptForm({ name: dept.name, short_name: dept.short_name, code: dept.code || "", active: dept.active }); setActiveDialog('dept'); }} className="h-12 w-12 text-primary hover:bg-primary/10 rounded-2xl border border-border">
                                         <Edit className="w-5 h-5" />
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={() => handleDelete('departments', dept.id)} className="h-12 w-12 text-red-500 hover:bg-red-500/10 rounded-2xl border border-border">
                                         <Trash2 className="w-5 h-5" />
                                      </Button>
                                   </div>
                                </TableCell>
                             </TableRow>
                          ))}
                       </TableBody>
                    </Table>
                 )}
              </Card>
           </div>
        </TabsContent>

        {/* --- BATCHES --- */}
        <TabsContent value="batches" className="space-y-8">
           <Card className="border-border bg-card rounded-[3rem] p-12 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 items-end">
                 <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1 flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Phase 1: University
                    </Label>
                    <Select value={selectedUniId} onValueChange={setSelectedUniId}>
                      <SelectTrigger className="h-16 bg-background border-input rounded-[1.5rem] font-black shadow-inner">
                        <SelectValue placeholder="Select Institution" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border rounded-2xl">
                        {universities.map(u => <SelectItem key={u.id} value={u.id} className="font-bold py-3">{u.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1 flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Phase 2: Department
                    </Label>
                    <Select value={selectedDeptId} onValueChange={setSelectedDeptId} disabled={!selectedUniId}>
                      <SelectTrigger className="h-16 bg-background border-input rounded-[1.5rem] font-black shadow-inner">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border rounded-2xl">
                        {departments.map(d => <SelectItem key={d.id} value={d.id} className="font-bold py-3">{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                 </div>
                 <Button disabled={!selectedDeptId} onClick={() => { setEditingItem(null); setBatchForm({ batch: "", batch_number: "", status: "active" }); setActiveDialog('batch'); }} className="h-16 bg-primary text-primary-foreground font-black rounded-[1.5rem] shadow-2xl shadow-primary/30 text-lg group">
                    <Plus className="w-6 h-6 mr-2 group-hover:rotate-90 transition-transform" /> Add Cohort (Batch)
                 </Button>
              </div>
           </Card>

           {selectedDeptId ? (
              <Card className="border-border bg-card rounded-[3rem] overflow-hidden shadow-sm">
                 <Table>
                    <TableHeader className="bg-muted/50">
                       <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="p-12 font-black text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Academic Cohort</TableHead>
                          <TableHead className="font-black text-[11px] uppercase tracking-[0.2em] text-muted-foreground text-center">Status</TableHead>
                          <TableHead className="text-right p-12 font-black text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Actions</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {batches.length === 0 ? (
                          <TableRow><TableCell colSpan={3} className="text-center py-40 font-black text-muted-foreground italic uppercase tracking-widest text-xs">No batches defined for this curriculum.</TableCell></TableRow>
                       ) : batches.map(b => (
                          <TableRow key={b.id} className="border-border hover:bg-muted/50 transition-all group">
                             <TableCell className="p-12">
                                <div className="flex items-center gap-8">
                                   <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-2xl shadow-inner">
                                      {b.batch_number || b.batch}
                                   </div>
                                   <div>
                                      <p className="font-black text-2xl tracking-tighter text-foreground">Batch {b.batch_number}</p>
                                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Cohort ID: {b.id}</p>
                                   </div>
                                </div>
                             </TableCell>
                             <TableCell>
                                <Badge className={cn("font-black text-[10px] uppercase h-8 px-5 rounded-full shadow-sm", b.status === "active" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border")}>
                                   {b.status}
                                </Badge>
                             </TableCell>
                             <TableCell className="text-right p-12">
                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                   <Button variant="ghost" size="icon" onClick={() => { setEditingItem(b); setBatchForm({ batch: b.batch || "", batch_number: b.batch_number, status: b.status }); setActiveDialog('batch'); }} className="h-14 w-14 text-primary hover:bg-primary/10 rounded-3xl border border-border">
                                      <Edit className="w-6 h-6" />
                                   </Button>
                                   <Button variant="ghost" size="icon" onClick={() => handleDelete('academic_batches', b.id)} className="h-14 w-14 text-red-500 hover:bg-red-500/10 rounded-3xl border border-border">
                                      <Trash2 className="w-6 h-6" />
                                   </Button>
                                </div>
                             </TableCell>
                          </TableRow>
                       ))}
                    </TableBody>
                 </Table>
              </Card>
           ) : (
              <div className="py-40 text-center space-y-8">
                 <div className="w-32 h-32 rounded-[3rem] bg-muted border border-border flex items-center justify-center mx-auto shadow-sm">
                    <Layers className="w-16 h-16 text-foreground" />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-3xl font-black text-foreground tracking-tight uppercase">Curriculum Isolation</h3>
                    <p className="text-muted-foreground max-w-md mx-auto font-bold italic text-sm">Select a department to manage specific student batches and cohort targeting.</p>
                 </div>
              </div>
           )}
        </TabsContent>

        {/* --- SEMESTERS --- */}
        <TabsContent value="semesters" className="space-y-8">
           <Card className="border-border bg-card rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10 shadow-sm">
              <div className="flex-1 w-full space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Scope Academic Terms By University</Label>
                 <Select value={selectedUniId} onValueChange={setSelectedUniId}>
                   <SelectTrigger className="h-16 bg-background border-input rounded-[1.5rem] font-black text-lg">
                     <SelectValue placeholder="Choose Institution..." />
                   </SelectTrigger>
                   <SelectContent className="bg-popover border-border rounded-2xl">
                     {universities.map(u => <SelectItem key={u.id} value={u.id} className="font-bold py-3">{u.name}</SelectItem>)}
                   </SelectContent>
                 </Select>
              </div>
              <Button disabled={!selectedUniId} onClick={() => { setEditingItem(null); setSemForm({ name: "", code: "", is_current: false, status: "active" }); setActiveDialog('sem'); }} className="h-16 px-10 bg-primary text-primary-foreground font-black rounded-[1.5rem] shadow-xl shadow-primary/20 text-lg">
                 <Plus className="w-6 h-6 mr-3" /> Create Term
              </Button>
           </Card>

           {selectedUniId ? (
              <Card className="border-border bg-card rounded-[2.5rem] overflow-hidden shadow-sm">
                 <Table>
                    <TableHeader className="bg-muted/50">
                       <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="p-10 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Term Name</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Configuration</TableHead>
                          <TableHead className="text-right p-10 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {semesters.length === 0 ? (
                          <TableRow><TableCell colSpan={3} className="text-center py-20 font-bold text-muted-foreground italic uppercase">No academic terms found</TableCell></TableRow>
                       ) : semesters.map(sem => (
                          <TableRow key={sem.id} className="border-border hover:bg-muted/50 transition-all group">
                             <TableCell className="p-10">
                                <div className="flex items-center gap-6">
                                   <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center font-black shadow-inner border border-white/5", sem.is_current ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                                      {sem.code || sem.name.slice(0,2)}
                                   </div>
                                   <div>
                                      <p className="font-black text-xl tracking-tight flex items-center gap-3">
                                         {sem.name}
                                         {sem.is_current && <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black uppercase px-2 h-5">Current Active</Badge>}
                                      </p>
                                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Term Code: {sem.code || 'UNNAMED'}</p>
                                   </div>
                                </div>
                             </TableCell>
                             <TableCell>
                                <Badge className={cn("font-black text-[10px] uppercase h-7 px-4 shadow-sm", sem.status === "active" ? "bg-muted border border-border text-foreground" : "bg-red-500/10 text-red-500")}>
                                   {sem.status}
                                </Badge>
                             </TableCell>
                             <TableCell className="text-right p-10">
                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                   <Button variant="ghost" size="icon" onClick={() => { setEditingItem(sem); setSemForm({ name: sem.name, code: sem.code || "", is_current: sem.is_current, status: sem.status }); setActiveDialog('sem'); }} className="h-12 w-12 text-primary hover:bg-primary/10 rounded-2xl border border-border">
                                      <Edit className="w-5 h-5" />
                                   </Button>
                                   <Button variant="ghost" size="icon" onClick={() => handleDelete('semesters', sem.id)} className="h-12 w-12 text-red-500 hover:bg-red-500/10 rounded-2xl border border-border">
                                      <Trash2 className="w-5 h-5" />
                                   </Button>
                                </div>
                             </TableCell>
                          </TableRow>
                       ))}
                    </TableBody>
                 </Table>
              </Card>
           ) : (
              <div className="py-40 text-center">
                 <Calendar className="w-20 h-20 text-foreground mx-auto mb-6" />
                 <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Timeline Management</h3>
                 <p className="text-muted-foreground font-bold italic mt-2 text-sm">Select a university to configure its academic semesters and active terms.</p>
              </div>
           )}
        </TabsContent>

        {/* --- COURSES --- */}
        <TabsContent value="courses" className="space-y-8">
           <Card className="border-border bg-card rounded-[3rem] p-12 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">University</Label>
                    <Select value={selectedUniId} onValueChange={setSelectedUniId}>
                      <SelectTrigger className="h-14 bg-background border-input rounded-2xl font-black shadow-inner">
                        <SelectValue placeholder="Institution" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border rounded-2xl">
                        {universities.map(u => <SelectItem key={u.id} value={u.id} className="font-bold py-2">{u.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Department</Label>
                    <Select value={selectedDeptId} onValueChange={setSelectedDeptId} disabled={!selectedUniId}>
                      <SelectTrigger className="h-14 bg-background border-input rounded-2xl font-black shadow-inner">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border rounded-2xl">
                        {departments.map(d => <SelectItem key={d.id} value={d.id} className="font-bold py-2">{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cohort (Optional)</Label>
                    <Select value={selectedBatchId} onValueChange={setSelectedBatchId} disabled={!selectedDeptId}>
                      <SelectTrigger className="h-14 bg-background border-input rounded-2xl font-black shadow-inner">
                        <SelectValue placeholder="All Batches" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border rounded-2xl">
                        <SelectItem value="_all" className="font-bold py-2 text-slate-500 italic">All Batches</SelectItem>
                        {batches.map(b => <SelectItem key={b.id} value={b.id} className="font-bold py-2">Batch {b.batch_number}</SelectItem>)}
                      </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Semester (Optional)</Label>
                    <Select value={selectedSemId} onValueChange={setSelectedSemId} disabled={!selectedUniId}>
                      <SelectTrigger className="h-14 bg-background border-input rounded-2xl font-black shadow-inner">
                        <SelectValue placeholder="All Semesters" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border rounded-2xl">
                        <SelectItem value="_all" className="font-bold py-2 text-slate-500 italic">All Semesters</SelectItem>
                        {semesters.map(s => <SelectItem key={s.id} value={s.id} className="font-bold py-2">{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                 </div>
              </div>
              <div className="mt-10 flex justify-end">
                 <Button disabled={!selectedUniId || !selectedDeptId} onClick={() => { 
                   setEditingItem(null); 
                   setCourseForm({ course_name: "", course_code: "", instructor: "", credits: 3, price: 0, status: "active" }); 
                   setActiveDialog('course'); 
                 }} className="h-16 px-12 bg-primary text-primary-foreground font-black rounded-3xl shadow-2xl shadow-primary/30 text-xl group">
                    <Plus className="w-8 h-8 mr-3 group-hover:scale-125 transition-transform" /> Register New Course
                 </Button>
              </div>
           </Card>

           {selectedUniId && selectedDeptId ? (
              <Card className="border-border bg-card rounded-[3rem] overflow-hidden shadow-sm">
                 <Table>
                    <TableHeader className="bg-muted/50">
                       <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="p-10 font-black text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Course Identification</TableHead>
                          <TableHead className="font-black text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Academic Scope</TableHead>
                          <TableHead className="font-black text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Commercials</TableHead>
                          <TableHead className="text-right p-10 font-black text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Actions</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {courses.length === 0 ? (
                          <TableRow><TableCell colSpan={4} className="text-center py-40 font-black text-muted-foreground italic uppercase tracking-widest text-xs">No courses registered for this selection.</TableCell></TableRow>
                       ) : courses.map(c => (
                          <TableRow key={c.id} className="border-border hover:bg-muted/50 transition-all group">
                             <TableCell className="p-10">
                                <div className="flex items-center gap-6">
                                   <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center font-black text-primary shadow-inner">
                                      {c.course_code.slice(0,2)}
                                   </div>
                                   <div>
                                      <p className="font-black text-lg tracking-tight text-foreground">{c.course_name}</p>
                                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] mt-1 flex items-center gap-2">
                                         {c.course_code} • <span className="text-primary/70 italic">Instructor: {c.instructor || 'Unassigned'}</span>
                                      </p>
                                   </div>
                                </div>
                             </TableCell>
                             <TableCell>
                                <div className="flex flex-col gap-2">
                                   <Badge variant="outline" className="font-black text-[9px] uppercase border-border text-muted-foreground w-fit h-6 px-3">
                                      {c.semesters?.name || 'Any Semester'}
                                   </Badge>
                                   <Badge className="font-black text-[9px] uppercase bg-muted border border-border text-muted-foreground w-fit h-6 px-3">
                                      {c.credits} Credits
                                   </Badge>
                                </div>
                             </TableCell>
                             <TableCell>
                                <div className="space-y-1">
                                   <p className="font-black text-2xl tracking-tighter text-foreground italic">৳{c.price || 0}</p>
                                   <Badge className={cn("font-black text-[8px] uppercase px-2 h-5", c.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                                      {c.status}
                                   </Badge>
                                </div>
                             </TableCell>
                             <TableCell className="text-right p-10">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                   <Button variant="ghost" size="icon" onClick={() => { 
                                      setEditingItem(c); 
                                      setCourseForm({ 
                                        course_name: c.course_name, 
                                        course_code: c.course_code, 
                                        instructor: c.instructor || "", 
                                        credits: c.credits || 3, 
                                        price: c.price || 0,
                                        status: c.status || "active"
                                      }); 
                                      setActiveDialog('course'); 
                                   }} className="h-12 w-12 text-primary hover:bg-primary/10 rounded-2xl border border-border">
                                      <Edit className="w-5 h-5" />
                                   </Button>
                                   <Button variant="ghost" size="icon" onClick={() => handleDelete('courses', c.id)} className="h-12 w-12 text-red-500 hover:bg-red-500/10 rounded-2xl border border-border">
                                      <Trash2 className="w-5 h-5" />
                                   </Button>
                                </div>
                             </TableCell>
                          </TableRow>
                       ))}
                    </TableBody>
                 </Table>
              </Card>
           ) : (
              <div className="py-40 text-center">
                 <div className="w-32 h-32 rounded-full bg-muted border border-border flex items-center justify-center mx-auto mb-8 shadow-sm">
                    <BookOpen className="w-16 h-16 text-foreground" />
                 </div>
                 <h3 className="text-3xl font-black text-foreground tracking-tight uppercase">Academic Curricula</h3>
                 <p className="text-muted-foreground max-w-md mx-auto font-bold italic mt-3 text-sm">Target a university and department to manage available courses and pricing.</p>
              </div>
           )}
        </TabsContent>
      </Tabs>

      {/* --- DIALOGS --- */}

      {/* UNI DIALOG */}
      <Dialog open={activeDialog === 'uni'} onOpenChange={(open: boolean) => !open && setActiveDialog(null)}>
         <DialogContent className="bg-background border-border text-foreground rounded-[2.5rem] sm:max-w-[550px] shadow-2xl p-0 overflow-hidden">
            <div className="p-10 bg-muted/30 border-b border-border">
               <DialogTitle className="text-3xl font-black tracking-tight">University Config</DialogTitle>
               <DialogDescription className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-1">Infrastructure parameters</DialogDescription>
            </div>
            <form onSubmit={handleSaveUniversity} className="p-10 space-y-8">
               <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Official Name</Label>
                  <Input value={uniForm.name} onChange={e => setUniForm({...uniForm, name: e.target.value})} placeholder="Full University Name" className="h-14 bg-background border-input rounded-2xl font-bold shadow-inner" required />
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Short Label</Label>
                     <Input value={uniForm.short_name} onChange={e => setUniForm({...uniForm, short_name: e.target.value})} placeholder="e.g. DIU" className="h-14 bg-background border-input rounded-2xl font-bold uppercase shadow-inner" required />
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">URL Slug</Label>
                     <Input value={uniForm.slug} onChange={e => setUniForm({...uniForm, slug: e.target.value.toLowerCase()})} placeholder="e.g. diu" className="h-14 bg-background border-input rounded-2xl font-bold shadow-inner" />
                  </div>
               </div>
               <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Logo URL Path</Label>
                  <Input value={uniForm.logo_url} onChange={e => setUniForm({...uniForm, logo_url: e.target.value})} placeholder="/logos/diu.png" className="h-14 bg-background border-input rounded-2xl font-bold shadow-inner" />
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-6 bg-muted rounded-3xl border border-border shadow-inner">
                     <Label className="font-black text-foreground uppercase text-[10px] tracking-widest">Active State</Label>
                     <Switch checked={uniForm.active} onCheckedChange={v => setUniForm({...uniForm, active: v})} />
                  </div>
                  <div className="flex items-center justify-between p-6 bg-muted rounded-3xl border border-border shadow-inner">
                     <Label className="font-black text-foreground uppercase text-[10px] tracking-widest">Locked State</Label>
                     <Switch checked={uniForm.locked} onCheckedChange={v => setUniForm({...uniForm, locked: v})} />
                  </div>
               </div>
               <Button 
                  type="button"
                  disabled={isActionLoading} 
                  onClick={async () => {
                    console.log("SAVE CLICKED")
                    setIsActionLoading(true)
                    
                    const payload = {
                      name: uniForm.name,
                      short_name: uniForm.short_name,
                      slug: uniForm.slug || uniForm.short_name.toLowerCase(),
                      logo_url: uniForm.logo_url,
                      active: uniForm.active,
                      locked: uniForm.locked,
                      status: uniForm.active ? 'active' : 'inactive' // Support legacy status
                    }

                    console.log("payload:", payload)

                    try {
                      const { data, error } = await supabase
                        .from("universities")
                        .insert([payload])
                        .select()

                      console.log("response:", data)
                      console.log("error:", error)

                      if (error) {
                        alert(error.message)
                        return
                      }

                      alert("University added successfully")

                      // Refresh and close
                      fetchUniversities()
                      setActiveDialog(null)
                    } catch (exc: any) {
                      console.error("FATAL_EXCEPTION:", exc)
                      alert("Fatal error: " + exc.message)
                    } finally {
                      setIsActionLoading(false)
                    }
                  }}
                  className="w-full h-16 bg-primary text-primary-foreground font-black rounded-3xl text-xl shadow-2xl shadow-primary/30 group"
               >
                  {isActionLoading ? <Loader2 className="animate-spin w-6 h-6" /> : (editingItem ? "Update Institutional Data" : "Provision New University")}
               </Button>
            </form>
         </DialogContent>
      </Dialog>

      {/* DEPT DIALOG */}
      <Dialog open={activeDialog === 'dept'} onOpenChange={(open: boolean) => !open && setActiveDialog(null)}>
         <DialogContent className="bg-background border-border text-foreground rounded-[2.5rem] sm:max-w-[500px] p-0 overflow-hidden">
            <div className="p-8 bg-muted/30 border-b border-border">
               <DialogTitle className="text-2xl font-black">Department Details</DialogTitle>
            </div>
            <form onSubmit={handleSaveDepartment} className="p-8 space-y-6">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Department Name</Label>
                  <Input value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} className="h-14 bg-background border-input rounded-2xl font-bold" required />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Official Code</Label>
                     <Input value={deptForm.short_name} onChange={e => setDeptForm({...deptForm, short_name: e.target.value})} className="h-14 bg-background border-input rounded-2xl font-bold uppercase" required />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Internal Slug</Label>
                     <Input value={deptForm.code} onChange={e => setDeptForm({...deptForm, code: e.target.value})} className="h-14 bg-background border-input rounded-2xl font-bold uppercase" />
                  </div>
               </div>
               <div className="flex items-center justify-between p-5 bg-muted rounded-2xl border border-border shadow-inner">
                  <Label className="font-black text-foreground uppercase text-[10px] tracking-widest">Operational</Label>
                  <Switch checked={deptForm.active} onCheckedChange={v => setDeptForm({...deptForm, active: v})} />
               </div>
               <Button type="submit" disabled={isActionLoading} className="w-full h-16 bg-primary text-primary-foreground font-black rounded-2xl text-lg">
                  {isActionLoading ? <Loader2 className="animate-spin w-6 h-6" /> : "Commit Department Changes"}
               </Button>
            </form>
         </DialogContent>
      </Dialog>

      {/* BATCH DIALOG */}
      <Dialog open={activeDialog === 'batch'} onOpenChange={(open: boolean) => !open && setActiveDialog(null)}>
         <DialogContent className="bg-background border-border text-foreground rounded-[2.5rem] sm:max-w-[400px] p-0 overflow-hidden">
            <div className="p-8 bg-muted/30 border-b border-border text-center">
               <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Cohort Definition</DialogTitle>
            </div>
            <form onSubmit={handleSaveBatch} className="p-10 space-y-8">
               <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground block text-center">Batch Number</Label>
                  <Input value={batchForm.batch_number} onChange={e => setBatchForm({...batchForm, batch_number: e.target.value})} className="h-24 bg-background border-input rounded-[2rem] font-black text-5xl text-center text-primary shadow-inner" required />
               </div>
               <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-center block">Targeting Status</Label>
                  <Select value={batchForm.status} onValueChange={v => setBatchForm({...batchForm, status: v})}>
                    <SelectTrigger className="h-14 bg-background border-input rounded-2xl font-black">
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border rounded-xl">
                       <SelectItem value="active" className="font-bold py-2">Active Production</SelectItem>
                       <SelectItem value="inactive" className="font-bold py-2">Internal Testing</SelectItem>
                       <SelectItem value="archived" className="font-bold py-2">Archived Legacy</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
               <Button type="submit" disabled={isActionLoading} className="w-full h-16 bg-primary text-primary-foreground font-black rounded-[1.5rem] text-xl shadow-2xl shadow-primary/30">
                  {isActionLoading ? <Loader2 className="animate-spin w-6 h-6" /> : "Deploy Cohort"}
               </Button>
            </form>
         </DialogContent>
      </Dialog>

      {/* SEMESTER DIALOG */}
      <Dialog open={activeDialog === 'sem'} onOpenChange={(open: boolean) => !open && setActiveDialog(null)}>
         <DialogContent className="bg-background border-border text-foreground rounded-[2.5rem] sm:max-w-[450px] p-0 overflow-hidden shadow-2xl">
            <div className="p-8 bg-muted/30 border-b border-border">
               <DialogTitle className="text-2xl font-black tracking-tight">Academic Term Config</DialogTitle>
            </div>
            <form onSubmit={handleSaveSemester} className="p-8 space-y-6">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Semester Designation</Label>
                  <Input value={semForm.name} onChange={e => setSemForm({...semForm, name: e.target.value})} placeholder="e.g. Spring 2026" className="h-14 bg-background border-input rounded-2xl font-bold" required />
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Short Identifier</Label>
                  <Input value={semForm.code} onChange={e => setSemForm({...semForm, code: e.target.value})} placeholder="e.g. S26" className="h-14 bg-background border-input rounded-2xl font-bold uppercase" />
               </div>
               <div className="flex items-center justify-between p-5 bg-muted rounded-2xl border border-border shadow-inner">
                  <div className="space-y-0.5">
                    <Label className="font-black text-foreground uppercase text-[10px] tracking-widest">Active Enrollment</Label>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase italic">Set as global current for Uni</p>
                  </div>
                  <Switch checked={semForm.is_current} onCheckedChange={v => setSemForm({...semForm, is_current: v})} />
               </div>
               <Button type="submit" disabled={isActionLoading} className="w-full h-16 bg-primary text-primary-foreground font-black rounded-2xl text-xl shadow-2xl shadow-primary/30">
                  {isActionLoading ? <Loader2 className="animate-spin w-6 h-6" /> : "Commit Term Setup"}
               </Button>
            </form>
         </DialogContent>
      </Dialog>

      {/* COURSE DIALOG */}
      <Dialog open={activeDialog === 'course'} onOpenChange={(open: boolean) => !open && setActiveDialog(null)}>
         <DialogContent className="bg-background border-border text-foreground rounded-[3rem] sm:max-w-[650px] p-0 overflow-hidden shadow-2xl">
            <div className="p-10 bg-muted/30 border-b border-border flex items-center justify-between">
               <div>
                 <DialogTitle className="text-3xl font-black tracking-tight">Course Registration</DialogTitle>
                 <DialogDescription className="text-muted-foreground font-bold uppercase tracking-widest text-[9px] mt-1">Curriculum & Commercial configuration</DialogDescription>
               </div>
               <BookOpen className="w-10 h-10 text-primary/30" />
            </div>
            <form onSubmit={handleSaveCourse} className="p-10 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subject Title</Label>
                     <Input value={courseForm.course_name} onChange={e => setCourseForm({...courseForm, course_name: e.target.value})} placeholder="e.g. Data Structures" className="h-14 bg-background border-input rounded-2xl font-bold" required />
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subject Code</Label>
                     <Input value={courseForm.course_code} onChange={e => setCourseForm({...courseForm, course_code: e.target.value})} placeholder="e.g. CSE-211" className="h-14 bg-background border-input rounded-2xl font-bold uppercase" required />
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Instructor</Label>
                     <Input value={courseForm.instructor} onChange={e => setCourseForm({...courseForm, instructor: e.target.value})} placeholder="Name" className="h-12 bg-background border-input rounded-xl font-bold" />
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Credits</Label>
                     <Input type="number" value={courseForm.credits} onChange={e => setCourseForm({...courseForm, credits: parseInt(e.target.value)})} className="h-12 bg-background border-input rounded-xl font-bold" required />
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Price (৳)</Label>
                     <Input type="number" value={courseForm.price} onChange={e => setCourseForm({...courseForm, price: parseInt(e.target.value)})} className="h-12 bg-background border-input rounded-xl font-bold text-primary" required />
                  </div>
               </div>
               <div className="flex items-center justify-between p-6 bg-muted rounded-3xl border border-border shadow-inner">
                  <Label className="font-black text-slate-300 uppercase text-[10px] tracking-widest">Enrollment Availability</Label>
                  <Select value={courseForm.status} onValueChange={v => setCourseForm({...courseForm, status: v})}>
                    <SelectTrigger className="w-[140px] h-10 bg-background border-input rounded-xl font-black text-xs">
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border rounded-xl">
                       <SelectItem value="active" className="font-bold py-2">Active</SelectItem>
                       <SelectItem value="inactive" className="font-bold py-2">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
               <Button type="submit" disabled={isActionLoading} className="w-full h-18 bg-primary text-primary-foreground font-black rounded-3xl text-2xl shadow-2xl shadow-primary/30 group py-4">
                  {isActionLoading ? <Loader2 className="animate-spin w-8 h-8" /> : "Deploy Course Asset"}
               </Button>
            </form>
         </DialogContent>
      </Dialog>
    </div>
  )
}
