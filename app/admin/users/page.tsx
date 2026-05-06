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
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

  useEffect(() => {
    fetchStudents()
  }, [])

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
    } catch (error) {
      console.error("Error fetching students:", error)
      setError("Could not load students. Ensure the 003 SQL migration has been run.")
      setStudents([])
    } finally {
      setLoading(false)
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will permanently delete the student account.")) return
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", id)

      if (error) throw error
      setStudents(students.filter(s => s.id !== id))
      toast.success("User deleted")
    } catch (error) {
      console.error("Error deleting student:", error)
      toast.error("Failed to delete user")
    }
  }

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.registration_number.toLowerCase().includes(searchTerm.toLowerCase())
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
        <Link href="/admin/users/add">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </Link>
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
              <Button variant="outline">
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
                              {student.is_blocked && <Badge variant="destructive" className="h-4 px-1 text-[10px]">Blocked</Badge>}
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
                              student.role === "admin" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : ""
                            )}
                          >
                            {student.role === "admin" ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                            {student.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "gap-1",
                              student.plan === "pro" ? "border-indigo-500 text-indigo-400 bg-indigo-500/5" :
                              student.plan === "lifetime" ? "border-emerald-500 text-emerald-400 bg-emerald-500/5" : ""
                            )}
                          >
                            <CreditCard className="w-3 h-3" />
                            {student.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.is_blocked ? "destructive" : "default"}>
                            {student.is_blocked ? "Blocked" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" disabled={updatingId === student.id}>
                                  {updatingId === student.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Manage Access</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                
                                {/* Role Management */}
                                <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase py-1 px-2">Change Role</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(student.id, { role: "admin" })} disabled={student.role === "admin"}>
                                  Set as Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(student.id, { role: "student" })} disabled={student.role === "student"}>
                                  Set as Student
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                
                                {/* Plan Management */}
                                <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase py-1 px-2">Change Plan</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(student.id, { plan: "free" })} disabled={student.plan === "free"}>
                                  Free Plan
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(student.id, { plan: "pro" })} disabled={student.plan === "pro"}>
                                  Pro Plan
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(student.id, { plan: "lifetime" })} disabled={student.plan === "lifetime"}>
                                  Lifetime Plan
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                {/* Blocking Control */}
                                <DropdownMenuItem 
                                  className={student.is_blocked ? "text-emerald-500" : "text-destructive"}
                                  onClick={() => handleUpdateStatus(student.id, { is_blocked: !student.is_blocked })}
                                >
                                  {student.is_blocked ? (
                                    <>
                                      <Unlock className="w-4 h-4 mr-2" />
                                      Unblock User
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="w-4 h-4 mr-2" />
                                      Block User
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <Link href={`/admin/users/edit/${student.id}`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(student.id)}
                              className="text-destructive hover:bg-destructive/10"
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
    </div>
  )
}

