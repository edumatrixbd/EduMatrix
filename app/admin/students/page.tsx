"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Loader2,
  Edit2,
  Save,
  X,
  Phone,
  Mail,
  Building2,
  Layers,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  User
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { format, formatDistanceToNow } from "date-fns"
import { logAdminActivity } from "@/lib/activity-logger"
import { cn } from "@/lib/utils"

type Student = {
  id: string
  full_name: string
  email: string
  phone: string
  university_id: string
  department_id: string
  batch_id: string
  role: string
  created_at: string
  updated_at: string
  updated_by: string
  universities?: { name: string }
  departments?: { name: string }
  academic_batches?: { batch_number: string }
}

type Uni = { id: string; name: string }
type Dept = { id: string; name: string; university_id: string }
type Batch = { id: string; batch_number: string; department_id: string }

export default function AdminStudentsPage() {
  const [loading, setLoading] = React.useState(true)
  const [students, setStudents] = React.useState<Student[]>([])
  const [search, setSearch] = React.useState("")
  const [unis, setUnis] = React.useState<Uni[]>([])
  const [depts, setDepts] = React.useState<Dept[]>([])
  const [batches, setBatches] = React.useState<Batch[]>([])
  
  // Edit State
  const [editingStudent, setEditingStudent] = React.useState<Student | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const supabase = createClient()

  React.useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [studentRes, uniRes, deptRes] = await Promise.all([
        supabase
          .from("profiles")
          .select(`
            *,
            universities:university_id(name),
            departments:department_id(name),
            academic_batches:batch_id(batch_number)
          `)
          .or("role.eq.student,role.is.null")
          .order("created_at", { ascending: false }),
        supabase.from("universities").select("id, name"),
        supabase.from("departments").select("id, name, university_id")
      ])

      if (studentRes.error) throw studentRes.error
      
      setStudents(studentRes.data || [])
      setUnis(uniRes.data || [])
      setDepts(deptRes.data || [])
    } catch (error: any) {
      console.error("Error fetching students:", error)
      toast.error("Failed to load students: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Targeted Batch Fetching on Department UUID
  React.useEffect(() => {
    if (!editingStudent?.department_id) {
      setBatches([])
      return
    }

    const fetchBatches = async () => {
      const rawDeptId = editingStudent.department_id
      const deptId = typeof rawDeptId === "string" ? rawDeptId.trim() : rawDeptId
      
      console.log("FORM DEPARTMENT ID:", deptId)
      console.log("TYPE OF DEPT ID:", typeof deptId)
      
      // TEMP DEBUG: Fetch all to see if filter is the issue
      const { data: allData } = await supabase.from("academic_batches").select("*")
      console.log("TEMP DEBUG ALL BATCHES:", allData)

      const { data, error } = await supabase
        .from("academic_batches")
        .select("id, batch_number, department_id")
        .eq("department_id", deptId)

      console.log("BATCH QUERY RESULT:", data, error)
      
      if (error) {
        console.error("BATCH_FETCH_ERROR:", error)
      }

      setBatches(data || [])
    }

    fetchBatches()
  }, [editingStudent?.department_id, supabase])

  const handleEdit = (student: Student) => {
    setEditingStudent({ ...student })
  }

  const handleSave = async () => {
    if (!editingStudent) return
    if (!editingStudent.phone || editingStudent.phone.trim() === "") {
      toast.error("Phone number cannot be empty")
      return
    }

    // Prevent invalid combinations
    if (editingStudent.university_id) {
      if (editingStudent.department_id) {
        const dept = depts.find(d => d.id === editingStudent.department_id)
        if (dept?.university_id !== editingStudent.university_id) {
          toast.error("Selected department does not belong to the selected university")
          return
        }
      }
      
      if (editingStudent.batch_id) {
        const batch = batches.find(b => b.id === editingStudent.batch_id)
        if (batch?.department_id !== editingStudent.department_id) {
          toast.error("Selected batch does not belong to the selected department")
          return
        }
      }
    }

    const formData = {
      full_name: editingStudent.full_name,
      phone: editingStudent.phone,
      university_id: editingStudent.university_id || null,
      department_id: editingStudent.department_id || null,
      batch_id: editingStudent.batch_id || null,
      updated_at: new Date().toISOString()
    }

    console.log("saving student", editingStudent.id, formData)
    setIsSaving(true)

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", editingStudent.id)
        .select()

      console.log("update result", data, error)

      if (error) {
        console.error("student update error", error)
        alert(error.message)
        setIsSaving(false)
        return
      }

      await logAdminActivity("UPDATE_STUDENT", "student", editingStudent.id, { 
        full_name: formData.full_name,
        phone: formData.phone 
      })

      toast.success("Student updated successfully")
      setEditingStudent(null)
      fetchData()
    } catch (error: any) {
      console.error("Unexpected error:", error)
      alert(error.message || "An unexpected error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.id?.toLowerCase().includes(search.toLowerCase())
  )

  const availableDepts = editingStudent ? depts.filter(d => d.university_id === editingStudent.university_id) : []
  // Batches are now handled by targeted useEffect and stored in the global 'batches' state

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Students Registry
          </h1>
          <p className="text-muted-foreground mt-1">Manage and verify student information across institutions.</p>
        </motion.div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search name, email, UID..." 
              className="pl-9 w-64 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="border-slate-200 dark:border-white/10">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-white/5 bg-white/50 dark:bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-white/[0.02]">
                <TableRow className="border-slate-200 dark:border-white/5">
                  <TableHead className="w-[280px]">Student Details</TableHead>
                  <TableHead>UID (Short)</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Cohort</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Fetching registry records...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No students found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id} className="border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm">
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-xs font-bold">
                              {student.full_name?.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-foreground truncate">{student.full_name}</span>
                              {student.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Mail className="w-3 h-3" /> {student.email}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Phone className="w-3 h-3" /> {student.phone || 'No phone'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10">
                          {student.id.slice(0, 8).toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-primary/60" />
                          <span className="text-sm font-medium">{student.universities?.name || 'Unassigned'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-primary/60" />
                            <span className="text-xs font-semibold uppercase tracking-tight">
                              {student.departments?.name || 'N/A'}
                            </span>
                          </div>
                          <Badge variant="secondary" className="w-fit text-[9px] h-4 font-bold bg-primary/10 text-primary border-0">
                            BATCH {student.academic_batches?.batch_number || 'N/A'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(student.created_at), 'MMM dd, yyyy')}
                          </div>
                          {student.updated_at && (
                            <div className="text-[9px] text-primary/60 font-medium italic">
                              Modified {formatDistanceToNow(new Date(student.updated_at), { addSuffix: true })}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-xl">
                            <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">Management</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(student)} className="cursor-pointer gap-2">
                              <Edit2 className="w-4 h-4 text-primary" /> Edit Info
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer gap-2 text-blue-500">
                              <CheckCircle2 className="w-4 h-4" /> Verify Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent className="max-w-2xl w-full p-6 overflow-visible bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Edit Student Profile</DialogTitle>
                <DialogDescription>Update institutional details for {editingStudent?.full_name}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {editingStudent && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6 w-full max-h-[80vh] overflow-y-auto">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Full Name</label>
                  <Input 
                    value={editingStudent.full_name}
                    onChange={(e) => setEditingStudent({ ...editingStudent, full_name: e.target.value })}
                    className="w-full min-w-0 bg-slate-50 dark:bg-slate-800/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Phone Number</label>
                  <Input 
                    value={editingStudent.phone || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                    className="w-full min-w-0 bg-slate-50 dark:bg-slate-800/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Email (Read Only)</label>
                  <Input value={editingStudent.email} disabled className="w-full min-w-0 bg-slate-100 dark:bg-slate-800 opacity-50" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">University</label>
                  <Select 
                    value={editingStudent.university_id || "none"}
                    onValueChange={(val) => {
                      const newUniId = val === "none" ? "" : val
                      setEditingStudent({ 
                        ...editingStudent, 
                        university_id: newUniId,
                        department_id: "", // Reset department
                        batch_id: ""       // Reset batch
                      })
                    }}
                  >
                    <SelectTrigger className="w-full min-w-0 bg-slate-50 dark:bg-slate-800/50">
                      <SelectValue placeholder="Select University" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {unis.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Department</label>
                  <Select 
                    value={editingStudent.department_id || "none"}
                    disabled={!editingStudent.university_id}
                    onValueChange={(val) => {
                      const newDeptId = val === "none" ? "" : val
                      const dept = depts.find(d => d.id === newDeptId)
                      console.log("selected department:", newDeptId, "| name:", dept?.name)
                      setEditingStudent({ 
                        ...editingStudent, 
                        department_id: newDeptId,
                        batch_id: "" // Reset batch
                      })
                    }}
                  >
                    <SelectTrigger className="w-full min-w-0 bg-slate-50 dark:bg-slate-800/50">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {availableDepts.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Batch</label>
                  <Select 
                    value={editingStudent.batch_id || "none"}
                    disabled={!editingStudent.department_id}
                    onValueChange={(val) => setEditingStudent({ 
                      ...editingStudent, 
                      batch_id: val === "none" ? "" : val 
                    })}
                  >
                    <SelectTrigger className="w-full min-w-0 bg-slate-50 dark:bg-slate-800/50">
                      <SelectValue placeholder="Select Batch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {batches.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.batch_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="bg-slate-50 dark:bg-slate-800/50 -mx-6 -mb-6 p-6 mt-2 border-t border-slate-200 dark:border-white/10">
            <Button variant="ghost" onClick={() => setEditingStudent(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="font-bold min-w-[120px]">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
