"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Bell, CheckCircle, Megaphone, Send, Loader2, History, AlertTriangle, Info, Sparkles } from "lucide-react"
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

export default function AdminNotificationsPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [history, setHistory] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "announcement"
  })

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, message, type, created_at")
        .order("created_at", { ascending: false })
        .limit(10)
      
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
    if (!formData.title || !formData.message) {
      toast.error("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("notifications")
        .insert(formData)

      if (error) throw error
      
      toast.success("Notification broadcasted successfully!")
      setFormData({ title: "", message: "", type: "announcement" })
      fetchHistory()
    } catch (error) {
      console.error("Error sending notification:", error)
      toast.error("Failed to send notification")
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "exam": return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case "content": return <Sparkles className="w-4 h-4 text-emerald-500" />
      default: return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  return (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Notice Title</Label>
                <Input 
                  id="title" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Midterm Results Published" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Notice Category</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(val) => setFormData({...formData, type: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">General Announcement</SelectItem>
                    <SelectItem value="exam">Exam Notice</SelectItem>
                    <SelectItem value="content">New Content Alert</SelectItem>
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
          <CardContent className="pt-0 flex justify-end">
            <Button onClick={handleSend} disabled={loading} className="w-full sm:w-auto shadow-lg shadow-primary/20">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Broadcast Now
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
            {fetching ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No previous notifications</p>
            ) : (
              history.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/5 bg-muted/20 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type)}
                      <p className="text-sm font-bold text-foreground line-clamp-1">{item.title}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase">{item.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.message}</p>
                  <p className="text-[10px] text-muted-foreground/60 pt-1">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))
            )}
            {history.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-white/5">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                Showing latest 10 broadcasts
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

