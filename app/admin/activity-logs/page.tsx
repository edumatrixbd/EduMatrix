"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  FileSearch, 
  User, 
  Calendar, 
  Filter, 
  Search, 
  Loader2, 
  Database,
  ArrowUpDown,
  History,
  ShieldCheck,
  CreditCard,
  UserPlus
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
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { format } from "date-fns"
import { PermissionGuard } from "@/components/admin/permission-guard"

export default function ActivityLogsPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<any[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const supabase = createClient()
      
      // Step 1: Fetch activity logs first
      const { data: logsData, error: logsError } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
      
      if (logsError) throw logsError
      if (!logsData) {
        setLogs([])
        return
      }

      // Step 2: Manually fetch profiles for these logs to bypass missing DB relationship
      const adminIds = Array.from(new Set(logsData.map(log => log.admin_id).filter(Boolean)))
      
      if (adminIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email, role")
          .in("id", adminIds)
        
        if (profilesError) {
          console.error("Error fetching profiles for logs:", profilesError)
        } else {
          // Create a lookup map for profiles
          const profilesMap = (profilesData || []).reduce((acc: any, p: any) => {
            acc[p.id] = p
            return acc
          }, {})

          // Enrich logs with profile data
          const enrichedLogs = logsData.map(log => ({
            ...log,
            profiles: log.admin_id ? profilesMap[log.admin_id] : null
          }))

          setLogs(enrichedLogs)
          return
        }
      }

      setLogs(logsData)
    } catch (error: any) {
      console.error("Error fetching logs:", JSON.stringify(error, null, 2))
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes('APPROVE_INSTRUCTOR')) return <ShieldCheck className="w-4 h-4 text-emerald-400" />
    if (action.includes('APPROVE_PAYMENT')) return <CreditCard className="w-4 h-4 text-primary" />
    if (action.includes('CREATE_ADMIN')) return <UserPlus className="w-4 h-4 text-primary" />
    return <History className="w-4 h-4 text-slate-500 dark:text-slate-400" />
  }

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    log.target_type?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PermissionGuard permission="activity_logs_view">
      <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">System Activity Logs</h1>
          <p className="text-muted-foreground text-lg">Track every administrative action made across the platform.</p>
        </div>
        <Button variant="outline" className="border-slate-200 dark:border-white/10" onClick={fetchLogs}>
          <Database className="w-4 h-4 mr-2" /> Refresh Data
        </Button>
      </motion.div>

      <Card className="border-slate-200 dark:border-white/5 bg-white/50 dark:bg-card/50 backdrop-blur-sm shadow-xl">
        <CardHeader className="border-b border-slate-200 dark:border-white/5 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2 font-bold">
              <FileSearch className="w-5 h-5 text-primary" />
              Recent Actions
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Filter by action or user..." 
                  className="pl-9 w-64 bg-muted/30 border-slate-200 dark:border-white/10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="border-slate-200 dark:border-white/10">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-slate-200 dark:border-white/5">
                  <TableHead className="w-[180px]">Admin</TableHead>
                  <TableHead className="w-[200px]">Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                      <p className="mt-2 text-sm text-muted-foreground">Loading system logs...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No activity logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/[0.01] transition-colors group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {log.profiles?.full_name?.[0]}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold truncate">{log.profiles?.full_name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{log.profiles?.role?.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-slate-50 dark:bg-white/5 group-hover:bg-primary/10 transition-colors">
                            {getActionIcon(log.action)}
                          </div>
                          <span className="text-sm font-medium">{log.action.replace(/_/g, ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.target_type && (
                          <Badge variant="outline" className="capitalize text-[10px] border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                            {log.target_type}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground font-mono">
                          {JSON.stringify(log.details)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-medium">{format(new Date(log.created_at), 'MMM dd, yyyy')}</span>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(log.created_at), 'HH:mm:ss')}</span>
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
    </div>
    </PermissionGuard>
  )
}
