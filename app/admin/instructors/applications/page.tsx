"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { logAdminAction } from "@/lib/admin/actions"
import { ShieldAlert, ShieldCheck, Check, X, Eye, Loader2, ExternalLink, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function InstructorApplicationsPage() {
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<any[]>([])
  const [isSuper, setIsSuper] = useState(false)

  useEffect(() => {
    fetchApplications()
    checkRole()
  }, [])

  const checkRole = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      const role = profile?.role || ''
      setIsSuper(['admin', 'super_admin', 'superadmin'].includes(role))
    }
  }

  const fetchApplications = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("instructor_applications")
        .select("*")
        .order("created_at", { ascending: false })

      console.log(data)
      console.log(error)

      if (error) throw error
      setApplications(data || [])
    } catch (error: any) {
      console.error("Fetch Applications Error:", error)
      toast.error(`Failed to load applications: ${error.message || "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id: string, userId: string, status: "approved" | "rejected") => {
    console.log("clicked application id", id)
    
    if (!isSuper) {
      toast.error("Insufficient permissions")
      return
    }

    setLoading(true)
    try {
      const url = `/api/admin/instructor-applications/${id}`
      console.log(`Calling API: ${url} with status: ${status}`)
      
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      const data = await res.json()
      
      console.log(`${status} action result:`, data)

      if (data.success) {
        const successMessage = status === 'approved' 
          ? "Application approved and email sent." 
          : `Application ${status} successfully`
        toast.success(successMessage)
        await fetchApplications()
      } else {
        console.error(`${status} error`, data.error)
        toast.error(data.error || "Action failed")
      }
    } catch (error: any) {
      console.error(`${status} error`, error)
      toast.error(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!isSuper) {
      toast.error("Insufficient permissions")
      return
    }

    const toastId = toast.loading("Deleting application...")
    try {
      const res = await fetch(`/api/admin/instructor-applications/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.success) {
        toast.success("Application deleted successfully", { id: toastId })
        await fetchApplications()
      } else {
        console.error("Delete error", data.error)
        toast.error(data.error || "Delete failed", { id: toastId })
      }
    } catch (error: any) {
      console.error("Delete error", error)
      toast.error(`Error: ${error.message}`, { id: toastId })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Instructor Applications</h1>
          <p className="text-muted-foreground mt-1">Review and approve new instructor requests.</p>
        </div>
        {!isSuper && (
          <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/10 gap-1.5 px-3 py-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            View Only Access
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Expertise</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No applications found.
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold">{app.full_name}</span>
                            <span className="text-xs text-muted-foreground">{app.email}</span>
                            <span className="text-xs text-muted-foreground">{app.phone_number}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{app.expertise}</span>
                            <span className="text-xs text-muted-foreground italic">{app.institution}</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={
                            app.status === "approved" ? "default" : 
                            app.status === "pending" ? "secondary" : "destructive"
                          }>
                            {app.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {app.status === "pending" && (
                              <>
                                <Button size="sm" variant="outline" disabled={!isSuper} className="text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 disabled:opacity-30" onClick={() => handleAction(app.id, app.user_id, "approved")}>
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" disabled={!isSuper} className="text-rose-500 border-rose-500/20 hover:bg-rose-500/10 disabled:opacity-30" onClick={() => handleAction(app.id, app.user_id, "rejected")}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-white/10">
                                <DialogHeader>
                                  <DialogTitle>Application Details</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-6 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <p className="text-xs text-slate-500 uppercase font-bold">Full Name</p>
                                      <p>{app.full_name}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-xs text-slate-500 uppercase font-bold">Email</p>
                                      <p>{app.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-xs text-slate-500 uppercase font-bold">Phone</p>
                                      <p>{app.phone_number}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-xs text-slate-500 uppercase font-bold">Institution</p>
                                      <p>{app.institution}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-slate-500 uppercase font-bold">Expertise</p>
                                    <p>{app.expertise}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-slate-500 uppercase font-bold">Experience</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{app.experience}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-slate-500 uppercase font-bold">Reason for applying</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{app.reason}</p>
                                  </div>
                                  {app.portfolio_url && (
                                    <div className="space-y-1">
                                      <p className="text-xs text-slate-500 uppercase font-bold">Portfolio / Sample</p>
                                      <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                        View Content <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-white/10">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure you want to delete this application?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                                    This action cannot be undone. This will permanently delete the application record from the database.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-white/10 hover:bg-slate-700">Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(app.id)} className="bg-rose-600 hover:bg-rose-700 text-white border-none">
                                    Delete Application
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
