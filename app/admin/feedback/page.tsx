"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all") // 'all', 'open', 'reviewed', 'fixed'

  useEffect(() => {
    fetchFeedback()
  }, [])

  const fetchFeedback = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("material_feedback")
      .select("*, profiles!material_feedback_user_id_fkey(full_name, email)")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setFeedback(data)
    } else {
      console.error("FEEDBACK_FETCH_ERROR MSG:", error.message)
      console.error("FEEDBACK_FETCH_ERROR DETAILS:", error.details)
      console.error("FEEDBACK_FETCH_ERROR HINT:", error.hint)
      toast.error("Failed to load feedback: " + error.message)
    }
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    const toastId = toast.loading("Updating status...")
    try {
      const response = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      if (!response.ok) throw new Error("Failed to update status")
      
      toast.success("Status updated", { id: toastId })
      setFeedback(prev => prev.map(f => f.id === id ? { ...f, status } : f))
    } catch (error: any) {
      toast.error(error.message, { id: toastId })
    }
  }

  const filteredData = feedback.filter(f => filter === "all" || f.status === filter)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Material Feedback</h1>
          <p className="text-muted-foreground mt-1">Review and manage student error reports</p>
        </div>
        <div className="flex gap-2">
          {["all", "open", "reviewed", "fixed"].map(f => (
            <Button 
              key={f}
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="capitalize"
              size="sm"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-white/5">
            <TableRow className="border-none">
              <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Reporter</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Type</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Message</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Status</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Reported</TableHead>
              <TableHead className="text-right text-slate-700 dark:text-slate-300 font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow className="border-none">
                <TableCell colSpan={6} className="h-32 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 font-medium">
                  No feedback found for the current filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900">
                  <TableCell>
                    <div className="font-medium text-slate-900 dark:text-slate-200">{item.profiles?.full_name || "Unknown"}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">{item.profiles?.email || item.user_id}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">{item.material_type.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{item.message}</p>
                    {item.page_url && (
                      <a href={item.page_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1 mt-2 font-medium">
                        View Page <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      item.status === 'fixed' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' :
                      item.status === 'reviewed' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' :
                      'bg-red-100 text-red-800 hover:bg-red-100'
                    }>
                      {item.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {item.status !== 'fixed' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                          onClick={() => updateStatus(item.id, 'fixed')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Fix
                        </Button>
                      )}
                      {item.status === 'open' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateStatus(item.id, 'reviewed')}
                        >
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
