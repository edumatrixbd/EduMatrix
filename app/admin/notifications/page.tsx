"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Bell, CheckCircle, Megaphone, Send, Loader2, History, AlertTriangle, Info, Sparkles, Edit2, Trash2, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { logAdminActivity } from "@/lib/activity-logger"
import { PermissionGuard } from "@/components/admin/permission-guard"
import { useAdminPermissions } from "@/lib/hooks/use-permissions"

export default function AdminNotificationsPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [history, setHistory] = useState<any[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const { hasPermission } = useAdminPermissions()
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "announcement",
    target_role: "all"
  })

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, message, type, category, target_role, created_at")
        .order("created_at", { ascending: false })
        .limit(20)
      
      if (error) throw error
      setHistory(data || [])
    } catch (error: any) {
      console.error("Error fetching notification history:", JSON.stringify(error, null, 2))
      if (error?.code === "42P01" || error?.code === "PGRST205") {
        toast.error("Database table 'notifications' missing. Please run the SQL script.")
      }
    } finally {
      setFetching(false)
    }
  }

  const handleSend = async () => {
    if (editingId) {
      if (!hasPermission("notifications_edit")) {
        toast.error("Access Denied: You do not have permission to edit notifications.");
        return;
      }
    } else {
      if (!hasPermission("notifications_create")) {
        toast.error("Access Denied: You do not have permission to create notifications.");
        return;
      }
    }

    if (!formData.title || !formData.message) {
      toast.error("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      
      const payload = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        category: formData.type, // duplicate for backward compatibility
        target_role: formData.target_role,
        created_by: userData.user?.id
      }

      if (editingId) {
        const { error } = await supabase
          .from("notifications")
          .update(payload)
          .eq("id", editingId)
        if (error) throw error
        await logAdminActivity("UPDATE_BROADCAST", "notification", editingId, { title: payload.title, target_role: payload.target_role })
        toast.success("Notification updated successfully!")
      } else {
        const { data: inserted, error } = await supabase
          .from("notifications")
          .insert(payload)
          .select("id")
          .single()
        if (error) throw error
        await logAdminActivity("CREATE_BROADCAST", "notification", inserted?.id || null, { title: payload.title, target_role: payload.target_role })
        toast.success("Notification broadcasted successfully!")
      }
      
      setFormData({ title: "", message: "", type: "announcement", target_role: "all" })
      setEditingId(null)
      fetchHistory()
    } catch (error) {
      console.error("Error sending notification:", error)
      toast.error(editingId ? "Failed to update notification" : "Failed to send notification")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item: any) => {
    setFormData({
      title: item.title,
      message: item.message,
      type: item.type || item.category || "announcement",
      target_role: item.target_role || "all"
    })
    setEditingId(item.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!hasPermission("notifications_delete")) {
      toast.error("Access Denied: You do not have permission to delete notifications.");
      return;
    }
    if (!confirm("Are you sure you want to delete this notification broadcast?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("notifications").delete().eq("id", id)
      if (error) throw error
      await logAdminActivity("DELETE_BROADCAST", "notification", id, { id })
      toast.success("Broadcast deleted")
      fetchHistory()
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to delete broadcast")
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ title: "", message: "", type: "announcement", target_role: "all" })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "exam": return <AlertTriangle className="w-4 h-4 text-[#FF3B30]" />
      case "content": return <Sparkles className="w-4 h-4 text-emerald-500" />
      default: return <Info className="w-4 h-4 text-primary" />
    }
  }

  const renderHistory = () => {
    if (fetching) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )
    }

    if (history.length === 0) {
      return <p className="text-sm text-muted-foreground text-center py-8">No previous notifications</p>
    }

    return history.map((item) => (
      <div key={item.id} className="rounded-xl border border-slate-200 dark:border-white/5 bg-muted/20 p-4 space-y-3 group">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <div className="mt-1">{getTypeIcon(item.type || item.category)}</div>
            <div>
              <p className="text-sm font-bold text-foreground line-clamp-1">{item.title}</p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase flex gap-1 mt-1">
                <Badge variant="outline" className="text-[9px] px-1 h-4">{item.type || item.category}</Badge>
                <Badge variant="secondary" className="text-[9px] px-1 h-4">{item.target_role || "all"}</Badge>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-primary" onClick={() => handleEdit(item)}>
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-red-500" onClick={() => handleDelete(item.id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{item.message}</p>
        <p className="text-[10px] text-muted-foreground/60">
          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
        </p>
      </div>
    ))
  }

  return (
    <PermissionGuard permission="notifications_create">
      <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Notification Center</h1>
        <p className="text-muted-foreground mt-1">Broadcast announcements and important notices to all students</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-primary/20 bg-primary/[0.01]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              Broadcaster
            </CardTitle>
            <CardDescription>This message will be visible to all registered students on their dashboards.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Notice Title</Label>
                <Input 
                  id="title" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Midterm Results Published" 
                />
              </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Notice Category</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(val) => setFormData({...formData, type: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10">
                    <SelectItem value="announcement">General Announcement</SelectItem>
                    <SelectItem value="exam">Exam Notice</SelectItem>
                    <SelectItem value="content">New Content Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_role">Target Audience</Label>
                <Select 
                  value={formData.target_role} 
                  onValueChange={(val) => setFormData({...formData, target_role: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10">
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="students">Students Only</SelectItem>
                    <SelectItem value="instructors">Instructors Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message Body</Label>
              <Textarea 
                id="message" 
                rows={6} 
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="Write the full announcement message here..." 
              />
            </div>
          </CardContent>
          <CardContent className="pt-0 flex justify-end gap-3">
            {editingId && (
              <Button variant="outline" onClick={cancelEdit} disabled={loading}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
            )}
            <Button onClick={handleSend} disabled={loading} className="w-full sm:w-auto shadow-lg shadow-primary/20">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : editingId ? <CheckCircle className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              {editingId ? "Update Broadcast" : "Broadcast Now"}
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Recent Broadcasts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderHistory()}
            {history.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-slate-200 dark:border-white/5">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                Showing latest 20 broadcasts
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </PermissionGuard>
  )
}

