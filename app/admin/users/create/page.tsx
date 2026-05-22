"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Shield, UserPlus, Mail, Lock, User, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { logAdminActivity } from "@/lib/activity-logger"
import { Checkbox } from "@/components/ui/checkbox"

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

export default function CreateAdminPage() {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [emailExists, setEmailExists] = useState(false)
  const [existingUser, setExistingUser] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    dashboard_access: true,
    students_view: false,
    students_edit: false,
    students_delete: false,
    instructors_view: false,
    instructors_edit: false,
    instructors_delete: false,
    courses_view: false,
    courses_create: false,
    courses_edit: false,
    courses_delete: false,
    content_upload: false,
    content_edit: false,
    content_delete: false,
    payments_view: false,
    payments_approve: false,
    payments_reject: false,
    notifications_create: false,
    notifications_edit: false,
    notifications_delete: false,
    feedback_view: false,
    feedback_update: false,
    analytics_view: false,
    activity_logs_view: false,
    settings_manage: false
  })
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "admin"
  })

  useEffect(() => {
    checkAccess()
  }, [])

  useEffect(() => {
    if (!formData.email || !formData.email.includes("@")) {
      setEmailExists(false)
      setExistingUser(null)
      return
    }

    const checkEmail = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email, role")
          .eq("email", formData.email)
          .maybeSingle()

        if (data) {
          setEmailExists(true)
          setExistingUser(data)
        } else {
          setEmailExists(false)
          setExistingUser(null)
        }
      } catch (err) {
        console.error("Error checking duplicate email:", err)
      }
    }

    const timer = setTimeout(checkEmail, 400)
    return () => clearTimeout(timer)
  }, [formData.email])

  const checkAccess = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = "/admin/login"
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profile && (profile.role === "super_admin" || profile.role === "superadmin")) {
        setIsSuperAdmin(true)
      } else {
        toast.error("Access Denied: Super Admin permission required.")
        window.location.href = "/admin"
      }
    } catch (err) {
      console.error("Access check failed:", err)
      window.location.href = "/admin"
    } finally {
      setChecking(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!existingUser) return
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update({ role: formData.role })
        .eq("id", existingUser.id)

      if (error) throw error

      await logAdminActivity("UPDATE_ADMIN_ROLE", "user", existingUser.id, { 
        email: formData.email, 
        role: formData.role 
      })

      toast.success("Existing user role updated successfully.")
      
      setFormData({
        email: "",
        password: "",
        full_name: "",
        role: "admin"
      })
      setEmailExists(false)
      setExistingUser(null)
    } catch (err: any) {
      toast.error("Failed to update role: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/admin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          permissions: formData.role === "super_admin" ? {
            dashboard_access: true,
            students_view: true,
            students_edit: true,
            students_delete: true,
            instructors_view: true,
            instructors_edit: true,
            instructors_delete: true,
            courses_view: true,
            courses_create: true,
            courses_edit: true,
            courses_delete: true,
            content_upload: true,
            content_edit: true,
            content_delete: true,
            payments_view: true,
            payments_approve: true,
            payments_reject: true,
            notifications_create: true,
            notifications_edit: true,
            notifications_delete: true,
            feedback_view: true,
            feedback_update: true,
            analytics_view: true,
            activity_logs_view: true,
            settings_manage: true
          } : permissions
        })
      })

      const text = await response.text()
      let data: any = {}
      if (text) {
        try {
          data = JSON.parse(text)
        } catch (e) {
          console.error("Failed to parse admin create response:", e)
        }
      }
      console.log("create admin response:", data)

      if (!response.ok) {
        toast.error(data.error || "Failed to create admin")
        return
      }

      toast.success("Admin account created successfully")
      setFormData({
        full_name: "",
        email: "",
        password: "",
        role: "admin"
      })
      setPermissions({
        dashboard_access: true,
        students_view: false,
        students_edit: false,
        students_delete: false,
        instructors_view: false,
        instructors_edit: false,
        instructors_delete: false,
        courses_view: false,
        courses_create: false,
        courses_edit: false,
        courses_delete: false,
        content_upload: false,
        content_edit: false,
        content_delete: false,
        payments_view: false,
        payments_approve: false,
        payments_reject: false,
        notifications_create: false,
        notifications_edit: false,
        notifications_delete: false,
        feedback_view: false,
        feedback_update: false,
        analytics_view: false,
        activity_logs_view: false,
        settings_manage: false
      })
    } catch (error: any) {
      console.error("create admin error", error)
      toast.error(error.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isSuperAdmin) return null

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link 
        href="/admin/users" 
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Users
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Create Admin</h1>
        <p className="text-muted-foreground text-lg">Register a new administrative account with specific permissions.</p>
      </div>

      <Card className="border-slate-200 dark:border-white/5 bg-white/50 dark:bg-card/50 backdrop-blur-sm shadow-xl">
        <CardHeader className="space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Account Details</CardTitle>
          <CardDescription>Enter the credentials for the new administrative user.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="full_name"
                  placeholder="e.g. John Doe"
                  className="pl-9 bg-muted/30 border-slate-200 dark:border-white/10 h-11"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@tensionনাই.com"
                  className={`pl-9 bg-muted/30 border-slate-200 dark:border-white/10 h-11 ${emailExists ? 'border-[#FF3B30] focus-visible:ring-[#FF3B30]' : ''}`}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              {emailExists && (
                <div className="flex flex-col gap-2 mt-1">
                  <span className="text-sm text-[#FF3B30] font-medium">This email is already registered.</span>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="w-fit border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5"
                    onClick={handleUpdateRole}
                    disabled={loading}
                  >
                    Update this user role instead
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-10 bg-muted/30 border-slate-200 dark:border-white/10 h-11"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground focus-visible:ring-1 focus-visible:ring-primary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Assign Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(v) => setFormData({ ...formData, role: v })}
                >
                  <SelectTrigger className="bg-muted/30 border-slate-200 dark:border-white/10 h-11">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10">
                    <SelectItem value="admin">Standard Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom Permissions Block */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5">
              <div>
                <h3 className="font-bold text-lg text-foreground">Access Permissions</h3>
                <p className="text-sm text-muted-foreground">Select the specific modules this standard administrator is permitted to manage.</p>
              </div>

              {formData.role === "super_admin" ? (
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-primary text-sm font-medium">
                  Super Administrators have absolute bypass authority and possess ALL administrative privileges across the entire UniHub system.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {PERMISSION_GROUPS.map((group) => (
                    <Card key={group.title} className="bg-muted/20 border-slate-200 dark:border-white/5 shadow-none">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">{group.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2">
                        {group.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 py-1">
                            <Checkbox 
                              id={`perm-${item.id}`}
                              checked={permissions[item.id] || false}
                              onCheckedChange={(checked) => setPermissions(prev => ({
                                ...prev,
                                [item.id]: !!checked
                              }))}
                            />
                            <Label htmlFor={`perm-${item.id}`} className="text-sm text-slate-600 dark:text-slate-300 font-medium cursor-pointer">
                              {item.label}
                            </Label>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" 
              disabled={loading || emailExists}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Create Admin Account
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
