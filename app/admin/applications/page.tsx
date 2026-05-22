"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  UserCheck, 
  UserX, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  GraduationCap, 
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { format } from "date-fns"

export default function AdminApplicationsPage() {
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<any | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/admin/applications')
      const data = await res.json()
      console.log("Admin Applications Page Data:", data)
      setApps(data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success(`Application ${status} successfully`)
        fetchApplications()
        setSelectedApp(null)
      } else {
        toast.error(data.error || "Action failed")
      }
    } catch (e) {
      toast.error("An error occurred")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Instructor Applications</h1>
          <p className="text-muted-foreground mt-1">Review and manage partnership requests from potential educators.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-3 py-1">
            {apps.filter(a => a.status === 'pending').length} Pending Requests
          </Badge>
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
                  <TableHead>Applicant</TableHead>
                  <TableHead>Expertise</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground">No applications found.</TableCell></TableRow>
                )}
                {apps.map((app) => (
                  <TableRow key={app.id} className="border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/[0.01] cursor-pointer" onClick={() => setSelectedApp(app)}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{app.full_name}</span>
                        <span className="text-xs text-muted-foreground">{app.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10">{app.expertise}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{app.institution}</TableCell>
                    <TableCell>
                      <Badge className={
                        app.status === 'approved' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        app.status === 'rejected' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                        "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      }>
                        {app.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-primary">Review</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-3xl bg-[#111111] border-slate-200 dark:border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <GraduationCap className="w-6 h-6 text-primary" />
              Instructor Application Details
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Submitted on {selectedApp && format(new Date(selectedApp.created_at), 'PPP')}
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-8 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Full Name</label>
                    <p className="text-lg font-semibold">{selectedApp.full_name}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Contact Information</label>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <Mail className="w-4 h-4 text-primary/60" /> {selectedApp.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <Phone className="w-4 h-4 text-primary/60" /> {selectedApp.phone_number}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Expertise & Institution</label>
                    <p className="text-sm font-medium">{selectedApp.expertise} at <span className="text-primary">{selectedApp.institution}</span></p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Experience</label>
                    <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5 leading-relaxed">
                      {selectedApp.experience}
                    </div>
                  </div>
                  {selectedApp.portfolio_link && (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Portfolio / Sample Link</label>
                      <a href={selectedApp.portfolio_link} target="_blank" className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <ExternalLink className="w-4 h-4" /> View Work
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Why do they want to join?</label>
                <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5 leading-relaxed italic">
                  "{selectedApp.reason}"
                </div>
              </div>

              {selectedApp.status === 'pending' && (
                <div className="flex gap-4 pt-4">
                  <Button 
                    disabled={processing}
                    onClick={() => handleAction(selectedApp.id, 'approved')}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-14 rounded-2xl shadow-xl shadow-emerald-500/10"
                  >
                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserCheck className="w-5 h-5 mr-2" /> Approve Instructor</>}
                  </Button>
                  <Button 
                    disabled={processing}
                    variant="outline" 
                    onClick={() => handleAction(selectedApp.id, 'rejected')}
                    className="flex-1 border-slate-200 dark:border-white/10 hover:bg-red-500/10 hover:text-red-500 font-bold h-14 rounded-2xl"
                  >
                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserX className="w-5 h-5 mr-2" /> Reject Application</>}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
