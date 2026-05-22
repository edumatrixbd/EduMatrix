"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Shield, 
  ShieldAlert, 
  Loader2, 
  Edit, 
  Trash2, 
  Ban, 
  Unlock, 
  Activity, 
  Save 
} from "lucide-react"
import { toast } from "sonner"
import { logAdminActivity } from "@/lib/activity-logger"
import Link from "next/link"

const PERMISSION_GROUPS = [
  {
    title: "General Access & Settings",
    items: [
      { id: "dashboard_access", label: "Dashboard Access" },
      { id: "analytics_view", label: "View Analytics" },
      { id: "activity_logs_view", label: "View System Activity Logs" },
      { id: "settings_manage", label: "Manage Platform Settings" },
    ]
  },
  {
    title: "Student Management",
    items: [
      { id: "students_view", label: "View Student Records" },
      { id: "students_edit", label: "Create / Edit Students" },
      { id: "students_delete", label: "Delete Students" },
    ]
  },
  {
    title: "Instructor Registry",
    items: [
      { id: "instructors_view", label: "View Instructor Applications" },
      { id: "instructors_edit", label: "Approve / Reject Applications" },
      { id: "instructors_delete", label: "Delete Instructors" },
    ]
  },
  {
    title: "Courses & Batch Cohorts",
    items: [
      { id: "courses_view", label: "View Courses / Batches" },
      { id: "courses_create", label: "Create Academic Records" },
      { id: "courses_edit", label: "Modify / Toggle Statuses" },
      { id: "courses_delete", label: "Delete Courses / Batches" },
    ]
  },
  {
    title: "Content Materials",
    items: [
      { id: "content_upload", label: "Upload Material Files" },
      { id: "content_edit", label: "Edit / Update Materials" },
      { id: "content_delete", label: "Delete Content Materials" },
    ]
  },
  {
    title: "Payments & Invoicing",
    items: [
      { id: "payments_view", label: "View Invoice Logs" },
      { id: "payments_approve", label: "Approve Subscription Submissions" },
      { id: "payments_reject", label: "Reject Subscription Submissions" },
    ]
  },
  {
    title: "Broadcast Notices",
    items: [
      { id: "notifications_create", label: "Broadcast Notices" },
      { id: "notifications_edit", label: "Edit Notices" },
      { id: "notifications_delete", label: "Delete Broadcast Records" },
    ]
  },
  {
    title: "Platform Feedback",
    items: [
      { id: "feedback_view", label: "View User Feedback" },
      { id: "feedback_update", label: "Mark Solved / Address Issues" },
    ]
  }
]

export default function PermissionsPage() {
  const [loading, setLoading] = useState(true)
  const [admins, setAdmins] = useState<any[]>([])
  const [isSuper, setIsSuper] = useState(false)
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null)
  
  // UI Actions states
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null)
  const [activePermissions, setActivePermissions] = useState<Record<string, boolean>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [savingPermissions, setSavingPermissions] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [blockingId, setBlockingId] = useState<string | null>(null)

  useEffect(() => {
    checkRoleAndFetchData()
  }, [])

  const checkRoleAndFetchData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = "/admin/login"
        return
      }

      setCurrentAdminId(user.id)

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profile && (profile.role === "super_admin" || profile.role === "superadmin")) {
        setIsSuper(true)
        await fetchAdminsAndPermissions()
      } else {
        toast.error("Access Denied: Super Admin permission required.")
        window.location.href = "/admin"
      }
    } catch (error) {
      console.error("Access check error:", error)
      window.location.href = "/admin"
    }
  }

  const fetchAdminsAndPermissions = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // 1. Fetch admin profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, created_at, is_blocked")
        .in("role", ["admin", "super_admin", "superadmin"])
        .order("created_at", { ascending: false })

      if (profilesError) throw profilesError

      // 2. Fetch admin permissions
      const { data: permissionsList, error: permError } = await supabase
        .from("admin_permissions")
        .select("*")

      if (permError) throw permError

      const permissionsMap = new Map(permissionsList?.map(p => [p.admin_id, p.permissions]))

      const adminsMerged = (profiles || []).map(p => ({
        ...p,
        permissions: permissionsMap.get(p.id) || {}
      }))

      setAdmins(adminsMerged)
    } catch (error: any) {
      console.error("Error loading admins:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack
      })
      toast.error("Failed to load administrators data.")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenEdit = (admin: any) => {
    setSelectedAdmin(admin)
    setActivePermissions(admin.permissions || {})
    setIsModalOpen(true)
  }

  const handleSavePermissions = async () => {
    if (!selectedAdmin) return
    setSavingPermissions(true)

    try {
      const supabase = createClient()
      
      // Update DB permissions
      const { error } = await supabase
        .from("admin_permissions")
        .upsert({
          admin_id: selectedAdmin.id,
          permissions: activePermissions,
          updated_at: new Date().toISOString()
        }, { onConflict: "admin_id" })

      if (error) throw error

      await logAdminActivity("UPDATE_ADMIN_PERMISSIONS", "admin_permissions", selectedAdmin.id, {
        admin_email: selectedAdmin.email,
        permissions: activePermissions
      })

      toast.success(`Permissions for ${selectedAdmin.full_name || selectedAdmin.email} updated successfully.`)
      setIsModalOpen(false)
      setSelectedAdmin(null)
      await fetchAdminsAndPermissions()
    } catch (error: any) {
      console.error("Error updating permissions:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack
      })
      toast.error("Failed to update permissions.")
    } finally {
      setSavingPermissions(false)
    }
  }

  const handleToggleBlock = async (admin: any) => {
    if (admin.id === currentAdminId) {
      toast.error("You cannot block your own account.")
      return
    }

    setBlockingId(admin.id)
    const newStatus = !admin.is_blocked

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update({ is_blocked: newStatus })
        .eq("id", admin.id)

      if (error) throw error

      await logAdminActivity(
        newStatus ? "SUSPEND_ADMIN" : "ACTIVATE_ADMIN",
        "user",
        admin.id,
        { email: admin.email }
      )

      toast.success(`Admin account ${newStatus ? 'suspended' : 'activated'} successfully.`)
      await fetchAdminsAndPermissions()
    } catch (error: any) {
      console.error("Block action failure:", error)
      toast.error("Failed to modify account access.")
    } finally {
      setBlockingId(null)
    }
  }

  const handleDeleteAdmin = async (admin: any) => {
    if (admin.id === currentAdminId) {
      toast.error("You cannot delete your own account.")
      return
    }

    if (!confirm(`Are you absolutely sure you want to delete ${admin.full_name || admin.email}? This will delete their authorization credentials entirely.`)) {
      return
    }

    setDeletingId(admin.id)

    try {
      const response = await fetch("/api/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: admin.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete admin")
      }

      toast.success("Administrator deleted successfully.")
      await fetchAdminsAndPermissions()
    } catch (error: any) {
      console.error("Delete action failure:", error)
      toast.error(error.message || "Failed to delete administrative account.")
    } finally {
      setDeletingId(null)
    }
  }

  if (loading && admins.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          Admin Permissions Center
        </h1>
        <p className="text-muted-foreground mt-1">Manage standard and super-admin credentials, suspend access, and override module permissions.</p>
      </div>

      <Card className="bg-card text-card-foreground border-border shadow-xl">
        <CardHeader>
          <CardTitle>Registered Administrators</CardTitle>
          <CardDescription>Control database credentials, toggle blocks, and assign module permissions.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border">
                <TableHead>Administrator</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered At</TableHead>
                <TableHead className="text-right">Access Controls</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id} className="hover:bg-muted/50 border-border">
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground text-sm">{admin.full_name || "Standard Administrator"}</span>
                      <span className="text-xs text-muted-foreground">{admin.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={admin.role === "super_admin" || admin.role === "superadmin" ? "default" : "secondary"} className="gap-1 text-xs">
                      {(admin.role === "super_admin" || admin.role === "superadmin") ? <ShieldAlert className="w-3 h-3 text-white" /> : <Shield className="w-3 h-3" />}
                      {admin.role === "super_admin" || admin.role === "superadmin" ? "Super Admin" : "Standard Admin"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={admin.is_blocked ? "destructive" : "outline"} className="text-xs uppercase font-black">
                      {admin.is_blocked ? "Suspended" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(admin.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <div className="flex items-center justify-end gap-2">
                      {/* View Activity */}
                      <Link href={`/admin/activity-logs?admin=${admin.email}`}>
                        <Button variant="ghost" size="sm" className="h-9 hover:bg-muted gap-1.5">
                          <Activity className="w-4 h-4 text-primary" />
                          Activity
                        </Button>
                      </Link>

                      {/* Edit Permissions */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 hover:bg-muted gap-1.5"
                        onClick={() => handleOpenEdit(admin)}
                        disabled={admin.role === "super_admin" || admin.role === "superadmin"}
                      >
                        <Edit className="w-4 h-4 text-emerald-400" />
                        Permissions
                      </Button>

                      {/* Suspend / Activate */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-9 gap-1.5 ${admin.is_blocked ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-amber-500 hover:bg-amber-500/10'}`}
                        onClick={() => handleToggleBlock(admin)}
                        disabled={blockingId === admin.id || admin.id === currentAdminId}
                      >
                        {blockingId === admin.id ? <Loader2 className="w-4 h-4 animate-spin" /> : admin.is_blocked ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        {admin.is_blocked ? "Activate" : "Suspend"}
                      </Button>

                      {/* Delete */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 hover:bg-rose-500/10 hover:text-rose-400 gap-1.5 text-rose-500/80"
                        onClick={() => handleDeleteAdmin(admin)}
                        disabled={deletingId === admin.id || admin.id === currentAdminId}
                      >
                        {deletingId === admin.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Permissions Editor Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl bg-card border-border text-foreground max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Edit Administrator Permissions
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Configure modular overrides for {selectedAdmin?.full_name || selectedAdmin?.email}. Permissions adapt instantly upon save.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            {PERMISSION_GROUPS.map((group) => (
              <Card key={group.title} className="bg-muted/30 border-border shadow-none">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-black text-foreground uppercase tracking-wider">{group.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2.5">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-0.5">
                      <Checkbox 
                        id={`modal-perm-${item.id}`}
                        checked={activePermissions[item.id] || false}
                        onCheckedChange={(checked) => setActivePermissions(prev => ({
                          ...prev,
                          [item.id]: !!checked
                        }))}
                      />
                      <Label htmlFor={`modal-perm-${item.id}`} className="text-sm text-muted-foreground font-medium cursor-pointer">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={savingPermissions}>
              Cancel
            </Button>
            <Button onClick={handleSavePermissions} disabled={savingPermissions} className="gap-2 font-bold">
              {savingPermissions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
