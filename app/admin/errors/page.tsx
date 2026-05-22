"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  AlertCircle, 
  ShieldAlert, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Globe, 
  CheckCircle2, 
  Loader2,
  ChevronDown,
  ExternalLink
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"

export default function AdminErrorsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("open")
  const [selectedLog, setSelectedLog] = useState<any | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [filterType, filterStatus])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterType !== 'all') params.append('type', filterType)
      
      const res = await fetch(`/api/error-logs?${params.toString()}`)
      const data = await res.json()
      setLogs(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const markResolved = async (id: string) => {
    try {
      await fetch('/api/error-logs', {
        method: 'PATCH',
        body: JSON.stringify({ id, status: 'resolved' })
      })
      fetchLogs()
      setSelectedLog(null)
    } catch (e) { console.error(e) }
  }

  const getErrorColor = (type: string) => {
    switch(type) {
      case 'hls_error': return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'payment_failed': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'auth_error': return 'text-primary bg-primary/10 border-primary/20'
      default: return 'text-slate-500 dark:text-slate-400 bg-slate-500/10 border-slate-500/20'
    }
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Error Logs</h1>
          <p className="text-muted-foreground text-lg">Real-time telemetry and diagnostic reports from the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] bg-muted/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px] bg-muted/50">
              <SelectValue placeholder="Error Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="hls_error">HLS Errors</SelectItem>
              <SelectItem value="video_load">Video Loading</SelectItem>
              <SelectItem value="payment_failed">Payments</SelectItem>
              <SelectItem value="api_error">API Errors</SelectItem>
              <SelectItem value="auth_error">Auth/Access</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <Card className="border-slate-200 dark:border-white/5 bg-white/50 dark:bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-40"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-slate-200 dark:border-white/5">
                  <TableHead className="w-[200px]">Time</TableHead>
                  <TableHead>Error Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground">No error logs found matching filters.</TableCell></TableRow>
                )}
                {logs.map((log) => (
                  <TableRow key={log.id} className="border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/[0.01] cursor-pointer" onClick={() => setSelectedLog(log)}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getErrorColor(log.error_type)} variant="outline">
                        {log.error_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.profiles?.full_name || 'Guest'}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-sm">
                      {log.message}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#FF3B30]" />
              Diagnostic Report
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Technical details for error ID: {selectedLog?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500 uppercase tracking-wider">Timestamp</Label>
                  <p className="text-sm font-medium">{format(new Date(selectedLog.created_at), 'PPPPpppp')}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500 uppercase tracking-wider">User Context</Label>
                  <p className="text-sm font-medium">{selectedLog.profiles?.full_name || 'Guest'} ({selectedLog.user_id || 'No ID'})</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500 uppercase tracking-wider">Page URL</Label>
                  <p className="text-sm font-mono bg-slate-50 dark:bg-white/5 p-1 rounded break-all">{selectedLog.page_url}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500 uppercase tracking-wider">Error Type</Label>
                  <Badge className={getErrorColor(selectedLog.error_type)}>{selectedLog.error_type}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-500 uppercase tracking-wider">Error Message</Label>
                <p className="text-sm font-bold text-[#FF3B30] bg-[#FF3B30]/10 p-3 rounded-xl border border-[#FF3B30]/20">
                  {selectedLog.message}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-500 uppercase tracking-wider">Technical Details (JSON)</Label>
                <pre className="text-xs bg-black/50 p-4 rounded-xl border border-slate-200 dark:border-white/5 overflow-auto max-h-[200px] custom-scrollbar text-emerald-400">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>

              <div className="flex gap-3 pt-4">
                {selectedLog.status === 'open' && (
                  <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold" onClick={() => markResolved(selectedLog.id)}>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Resolved
                  </Button>
                )}
                <Button variant="outline" className="flex-1 border-slate-200 dark:border-white/10" onClick={() => setSelectedLog(null)}>
                  Close Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
