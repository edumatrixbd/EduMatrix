"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  History, 
  Search, 
  Filter, 
  Video, 
  FileText, 
  FileQuestion, 
  Download, 
  BookOpenCheck,
  MousePointer2,
  Clock,
  ArrowUpRight,
  Loader2,
  Trash2,
  DownloadCloud,
  Activity
} from "lucide-react"
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
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { format, formatDistanceToNow } from "date-fns"

const featureIcons: Record<string, any> = {
  video: Video,
  notes: FileText,
  questions: FileQuestion,
  solves: BookOpenCheck,
  study_zone: MousePointer2,
  search: Search,
  download: DownloadCloud,
}

const featureColors: Record<string, string> = {
  video: "text-sky-400 bg-sky-400/10",
  notes: "text-emerald-400 bg-emerald-400/10",
  questions: "text-amber-400 bg-amber-400/10",
  solves: "text-violet-400 bg-violet-400/10",
  study_zone: "text-rose-400 bg-rose-400/10",
  search: "text-slate-400 bg-slate-400/10",
  download: "text-indigo-400 bg-indigo-400/10",
}

export default function AdminActivityLogsPage() {
  const [loading, setLoading] = React.useState(true)
  const [logs, setLogs] = React.useState<any[]>([])
  const [search, setSearch] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState<string>("all")

  React.useEffect(() => {
    fetchLogs()
    
    // Set up real-time subscription
    const supabase = createClient()
    const subscription = supabase
      .channel('activity_logs_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, payload => {
        fetchLogs() // Simple refresh for now
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  const fetchLogs = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("activity_logs")
        .select(`
          *,
          student:students(name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(100)
      
      if (error) throw error
      setLogs(data || [])
    } catch (error: any) {
      console.error("Error fetching logs:", JSON.stringify(error, null, 2))
      if (error?.code === "42P01" || error?.code === "PGRST205") {
        toast.error("Database table 'activity_logs' missing. Please run the SQL script.")
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.metadata?.title?.toLowerCase().includes(search.toLowerCase())
    
    const matchesType = typeFilter === "all" || log.feature === typeFilter
    
    return matchesSearch && matchesType
  })

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin" /></div>

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Activity Logs</h1>
          <p className="text-muted-foreground mt-1">Real-time monitoring of all platform interactions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1 animate-pulse">
            <Activity className="w-3 h-3 mr-1.5" /> Live Monitoring Active
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchLogs} className="border-white/10">
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search activity, student, or content..." 
            className="pl-9 bg-muted/30 border-white/10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px] bg-muted/30 border-white/10">
            <SelectValue placeholder="All Features" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-white/10">
            <SelectItem value="all">All Features</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="notes">Notes</SelectItem>
            <SelectItem value="questions">Questions</SelectItem>
            <SelectItem value="solves">Solved Answers</SelectItem>
            <SelectItem value="study_zone">Study Zone</SelectItem>
            <SelectItem value="download">Downloads</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs Feed */}
      <Card className="border-white/5 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-[200px]">Student</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Target Content</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        No activity logs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => {
                      const Icon = featureIcons[log.feature] || MousePointer2
                      const colorClass = featureColors[log.feature] || "text-slate-400 bg-slate-400/10"
                      
                      return (
                        <TableRow 
                          key={log.id} 
                          className="border-white/5 hover:bg-white/[0.02] transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                {log.student?.name?.split(' ').map((n: any) => n[0]).join('')}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-semibold text-foreground truncate">{log.student?.name}</span>
                                <span className="text-[10px] text-muted-foreground truncate">{log.student?.email}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${colorClass}`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-medium capitalize">{log.action} {log.feature}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-foreground truncate max-w-[250px]">
                                {log.metadata?.title || 'System Action'}
                              </span>
                              <span className="text-[10px] text-muted-foreground italic">
                                {log.metadata?.course || 'General'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
import { cn } from "@/lib/utils"
