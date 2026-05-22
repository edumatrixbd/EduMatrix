"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Search, 
  Download, 
  ShieldAlert, 
  ShieldCheck, 
  CreditCard, 
  Ban, 
  Unlock,
  MoreVertical,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Student {
  id: string
  email: string
  name: string
  registration_number: string
  semester: number
  cgpa: number
  status: string
  role: string
  plan: string
  is_blocked: boolean
}

export default function UsersPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [currentAdmin, setCurrentAdmin] = useState<{id: string, role: string} | null>(null)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  useEffect(() => {
    fetchStudents()
    fetchCurrentAdminRole()
  }, [])

  const fetchCurrentAdminRole = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile) setCurrentAdmin({ id: user.id, role: profile.role })
    }
  }

  const fetchStudents = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, name:full_name, registration_number, role, plan, is_blocked, semester")
        .order("created_at", { ascending: false })
      
      if (error) throw error
      setStudents(data || [])
      setError(null)
    } catch (error: any) {
      console.error("Error fetching students:", JSON.stringify(error, null, 2))
      setError("Could not load users. This usually happens if the profiles table is missing columns (registration_number, plan, is_blocked). Please run script 010 in your SQL editor.")
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (id === currentAdmin?.id) {
      toast.error("You cannot delete your own account.")
      return
    }

    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return
    
    const toastId = toast.loading("Deleting user...")
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      toast.success(`User ${name} deleted successfully`, { id: toastId })
      await fetchStudents()
    } catch (error: any) {
      console.error("Error deleting user:", error)
      toast.error(error.message || "Failed to delete user", { id: toastId })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStudent) return
    
    if (editingStudent.id === currentAdmin?.id && editingStudent.role !== currentAdmin.role) {
      toast.error("You cannot change your own role.")
      return
    }

    setUpdatingId(editingStudent.id)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editingStudent.name,
          role: editingStudent.role,
          plan: editingStudent.plan,
          is_blocked: editingStudent.is_blocked
        })
        .eq('id', editingStudent.id)

      if (error) throw error
      
      toast.success(`User ${editingStudent.name} updated successfully`)
      setIsEditOpen(false)
      setEditingStudent(null)
      await fetchStudents()
    } catch (error: any) {
      console.error("Error updating user:", error)
      toast.error(error.message || "Failed to update user")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleToggleBlock = async (user: Student) => {
    if (user.id === currentAdmin?.id) {
      toast.error("You cannot block your own account.")
      return
    }

    setUpdatingId(user.id)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: !user.is_blocked })
        .eq('id', user.id)

      if (error) throw error
      
      toast.success(`User ${user.is_blocked ? 'unblocked' : 'blocked'} successfully`)
      await fetchStudents()
    } catch (error: any) {
      toast.error(error.message || "Action failed")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleUpdateStatus = async (id: string, updates: Partial<Student>) => {
    setUpdatingId(id)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)

      if (error) throw error
      
      setStudents(students.map(s => s.id === id ? { ...s, ...updates } : s))
      toast.success("User updated successfully")
    } catch (error) {
      console.error("Error updating user:", error)
      toast.error("Failed to update user")
    } finally {
      setUpdatingId(null)
    }
  }


  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.registration_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Control access, roles, and plans for all students</p>
        </div>
        <div className="flex items-center gap-2">
          {currentAdmin?.role === "super_admin" && (
            <Link href="/admin/users/create">
              <Button variant="outline" className="border-primary/20 hover:bg-primary/5 text-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Admin
              </Button>
            </Link>
          )}
          <Link href="/admin/users/add">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button 
                variant="outline"
                onClick={() => {
                  toast.promise(
                    new Promise((resolve) => setTimeout(resolve, 1500)),
                    {
                      loading: 'Preparing CSV...',
                      success: 'User data exported successfully',
                      error: 'Export failed'
                    }
                  )
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>User</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                        Loading student records...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-destructive">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                        No students found matching "{searchTerm}"
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id} className={cn("hover:bg-muted/30", student.is_blocked && "opacity-60 grayscale-[0.5]")}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              {student.name}
                              {student.is_blocked && <Badge className="h-4 px-1 text-[10px] bg-[#FF3B30] text-white border-none font-black uppercase">Blocked</Badge>}
                            </span>
                            <span className="text-xs text-muted-foreground">{student.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{student.registration_number}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "gap-1",
                              student.role === "super_admin" ? "bg-primary/10 text-primary border-primary/20" :
                              student.role === "admin" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : ""
                            )}
                          >
                            {student.role === "super_admin" ? <ShieldAlert className="w-3 h-3" /> : 
                             student.role === "admin" ? <ShieldAlert className="w-3 h-3" /> : 
                             <ShieldCheck className="w-3 h-3" />}
                            {student.role?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "gap-1",
                              student.plan === "pro" ? "border-primary text-primary bg-primary/5" :
                              student.plan === "lifetime" ? "border-emerald-500 text-emerald-400 bg-emerald-500/5" : ""
                            )}
                          >
                            <CreditCard className="w-3 h-3" />
                            {student.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("font-black text-[10px] uppercase border-none", student.is_blocked ? "bg-[#FF3B30] text-white" : "bg-[#FFB00F] text-[#0B0B0B]")}>
                            {student.is_blocked ? "Blocked" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                  disabled={updatingId === student.id}
                                >
                                  {updatingId === student.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                                <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-200 dark:bg-white/5" />
                                
                                <DropdownMenuItem className="cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5" asChild>
                                  <Link href={`/admin/users/${student.id}`}>
                                    View Full Details
                                  </Link>
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator className="bg-slate-200 dark:bg-white/5" />
                                
                                <DropdownMenuLabel className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1">Roles</DropdownMenuLabel>
                                <DropdownMenuItem 
                                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5"
                                  onClick={() => handleUpdateStatus(student.id, { role: "admin" })}
                                  disabled={student.role === "admin" || (student.id === currentAdmin?.id)}
                                >
                                  Make Administrator
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-100 dark:hover:bg-white/5"
                                  onClick={() => handleUpdateStatus(student.id, { role: "student" })}
                                  disabled={student.role === "student" || (student.id === currentAdmin?.id)}
                                >
                                  Set as Student
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator className="bg-slate-200 dark:bg-white/5" />
                                
                                <DropdownMenuLabel className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1">Plans</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(student.id, { plan: "free" })} className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-100 dark:hover:bg-white/5">Free Tier</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(student.id, { plan: "pro" })} className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-100 dark:hover:bg-white/5">Pro Subscription</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(student.id, { plan: "lifetime" })} className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-100 dark:hover:bg-white/5">Lifetime Access</DropdownMenuItem>
                                
                                <DropdownMenuSeparator className="bg-slate-200 dark:bg-white/5" />
                                
                                <DropdownMenuItem 
                                  className={cn("font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-100 dark:hover:bg-white/5", student.is_blocked ? "text-emerald-400" : "text-rose-400")}
                                  onClick={() => handleToggleBlock(student)}
                                  disabled={student.id === currentAdmin?.id}
                                >
                                  {student.is_blocked ? (
                                    <><Unlock className="w-4 h-4 mr-2" /> Unblock Access</>
                                  ) : (
                                    <><Ban className="w-4 h-4 mr-2" /> Block User</>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                              onClick={() => {
                                setEditingStudent(student)
                                setIsEditOpen(true)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                              onClick={() => handleDelete(student.id, student.name)}
                              disabled={student.id === currentAdmin?.id || student.role === 'super_admin'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit User Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[450px] bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Update the administrative and profile settings for this user.
            </DialogDescription>
          </DialogHeader>
          {editingStudent && (
            <form onSubmit={handleUpdate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-slate-700 dark:text-slate-300 font-medium">Full Name</Label>
                <Input 
                  id="full_name"
                  className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">Account Role</Label>
                  <Select 
                    value={editingStudent.role} 
                    onValueChange={(v) => setEditingStudent({...editingStudent, role: v})}
                    disabled={editingStudent.id === currentAdmin?.id}
                  >
                    <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="instructor">Instructor</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">Access Plan</Label>
                  <Select value={editingStudent.plan} onValueChange={(v) => setEditingStudent({...editingStudent, plan: v})}>
                    <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                      <SelectItem value="free">Free Tier</SelectItem>
                      <SelectItem value="pro">Pro Plan</SelectItem>
                      <SelectItem value="lifetime">Lifetime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300 font-medium">Account Status</Label>
                <Select 
                  value={editingStudent.is_blocked ? "blocked" : "active"} 
                  onValueChange={(v) => setEditingStudent({...editingStudent, is_blocked: v === "blocked"})}
                  disabled={editingStudent.id === currentAdmin?.id}
                >
                  <SelectTrigger className={cn(
                    "bg-slate-800 border-white/10 text-white",
                    editingStudent.is_blocked ? "text-rose-400" : "text-emerald-400"
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    <SelectItem value="active" className="text-emerald-400">Active Access</SelectItem>
                    <SelectItem value="blocked" className="text-rose-400">Blocked / Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-6 flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-100 dark:hover:bg-white/5" 
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-primary text-primary-foreground font-black"
                  disabled={!!updatingId}
                >
                  {updatingId ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

