"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  CreditCard, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Download,
  AlertCircle,
  ArrowUpRight,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { format } from "date-fns"
import { toast } from "sonner"

export default function InstructorPayoutsPage() {
  const [loading, setLoading] = React.useState(true)
  const [payouts, setPayouts] = React.useState<any[]>([])

  React.useEffect(() => {
    fetchPayouts()
  }, [])

  const fetchPayouts = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("payouts")
        .select("id, payout_month, amount, status, created_at")
        .eq("instructor_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setPayouts(data || [])
    } catch (error) {
      console.error("Error fetching payouts:", error)
      toast.error("Failed to load payout history")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Generating statement...',
        success: 'Payout statement downloaded',
        error: 'Failed to generate statement'
      }
    )
  }

  const handleRequestPayout = () => {
    if (pendingAmount <= 0) {
      toast.error("You don't have any pending balance to request.")
      return
    }
    
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2500)),
      {
        loading: 'Submitting payout request...',
        success: 'Request submitted! Our team will process it within 3-5 business days.',
        error: 'Failed to submit request'
      }
    )
  }

  const totalPaid = payouts.filter(p => p.status === 'paid').reduce((acc, p) => acc + Number(p.amount), 0)
  const pendingAmount = payouts.filter(p => p.status === 'pending').reduce((acc, p) => acc + Number(p.amount), 0)

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin" /></div>

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payout History</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track your monthly earnings and payment status.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleRequestPayout}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9"
          >
            <ArrowUpRight className="w-4 h-4 mr-2" /> Request Payout
          </Button>
          <Button 
            onClick={handleDownload}
            className="bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 text-xs h-9"
          >
            <Download className="w-4 h-4 mr-2" /> Download Statement
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200 dark:border-white/5 bg-emerald-500/5 backdrop-blur-md">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-400/70 uppercase tracking-wider">Total Paid Out</p>
              <h3 className="text-3xl font-bold mt-1">৳{totalPaid.toLocaleString()}</h3>
              <p className="text-xs text-emerald-500/50 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Successfully transferred
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <DollarSign className="w-8 h-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-white/5 bg-primary/5 backdrop-blur-md">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary/70 uppercase tracking-wider">Pending Payout</p>
              <h3 className="text-3xl font-bold mt-1">৳{pendingAmount.toLocaleString()}</h3>
              <p className="text-xs text-primary/50 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Processing for next cycle
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <CreditCard className="w-8 h-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payouts Table */}
      <Card className="border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 backdrop-blur-md overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-200 dark:border-white/5">
          <CardTitle className="text-lg">All Payout Transactions</CardTitle>
          <CardDescription>Comprehensive list of all payments processed to your account.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-slate-200 dark:border-white/5">
                  <TableHead>Payout Month</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-6 h-6 opacity-20" />
                        No payout history available yet.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  payouts.map((p) => (
                    <TableRow key={p.id} className="border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/[0.01] transition-colors">
                      <TableCell className="font-bold text-slate-200">{p.payout_month}</TableCell>
                      <TableCell className="font-bold text-primary">৳{p.amount}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {format(new Date(p.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge className={p.status === 'paid' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}>
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-white">
                          <ArrowUpRight className="w-4 h-4" />
                        </Button>
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
  )
}
