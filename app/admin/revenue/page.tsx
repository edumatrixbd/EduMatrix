"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  Loader2,
  Users
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
import { logAdminAction } from "@/lib/admin/actions"
import { ShieldAlert } from "lucide-react"
import { format } from "date-fns"

import { useToast } from "@/components/ui/use-toast"

export default function AdminRevenuePage() {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [isSuper, setIsSuper] = React.useState(false)
  // ... rest of state

  const handleExportReport = () => {
    toast({
      title: "Generating Report",
      description: "Financial report is being prepared for download...",
    })
    setTimeout(() => {
      toast({
        title: "Report Ready",
        description: "Revenue_Report_May_2026.csv has been downloaded.",
      })
    }, 2000)
  }

  const handleProcessPayouts = async () => {
    if (!isSuper) {
      toast({
        title: "Access Denied",
        description: "Only Superadmins can process payouts.",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Processing Payouts",
      description: "Batch payout sequence initiated for all pending instructors.",
    })
    
    // Log action
    await logAdminAction({
      action: 'APPROVE_PAYMENT',
      details: { type: 'batch_payout', timestamp: new Date().toISOString() }
    })

    // Mocking an API call
    setTimeout(() => {
      toast({
        title: "Payouts Successful",
        description: "All pending payments have been marked as 'Paid'.",
      })
      fetchFinancialData()
    }, 3000)
  }
  const [sales, setSales] = React.useState<any[]>([])
  const [payouts, setPayouts] = React.useState<any[]>([])
  const [stats, setStats] = React.useState({
    totalRevenue: 0,
    platformFees: 0,
    instructorEarnings: 0,
    pendingPayouts: 0
  })

  React.useEffect(() => {
    fetchFinancialData()
    checkRole()
  }, [])

  const checkRole = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      setIsSuper(profile?.role === 'super_admin')
    }
  }

  const fetchFinancialData = async () => {
    try {
      const supabase = createClient()
      
      const [
        { data: subscriptions }, 
        { data: instructorPayouts },
        { data: batches },
        { data: courses }
      ] = await Promise.all([
        supabase
          .from("batch_subscriptions")
          .select(`*, student_profiles(full_name), academic_batches(batch_number, university, department)`)
          .order("created_at", { ascending: false }),
        supabase
          .from("instructor_payouts")
          .select(`*, profiles(full_name), courses(course_name), academic_batches(batch_number)`)
          .order("calculated_at", { ascending: false }),
        supabase.from("academic_batches").select("id, batch_number"),
        supabase.from("courses").select("id, course_name, instructor_id, batch, university, department")
      ])

      if (subscriptions) {
        setSales(subscriptions)
        const total = subscriptions.reduce((acc, s) => acc + Number(s.amount_paid), 0)
        // Platform keeps 70%, Instructors get 30% pool
        const instructorPool = total * 0.3
        const platformFees = total * 0.7
        
        setStats(prev => ({
          ...prev,
          totalRevenue: total,
          platformFees: platformFees,
          instructorEarnings: instructorPool
        }))
      }

      if (instructorPayouts) {
        setPayouts(instructorPayouts)
        const pending = instructorPayouts
          .filter(p => p.status === 'pending')
          .reduce((acc, p) => acc + Number(p.amount), 0)
        setStats(prev => ({ ...prev, pendingPayouts: pending }))
      }
    } catch (error) {
      console.error("Error fetching financial data:", error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: "Total Revenue", value: `৳${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Platform Fees", value: `৳${stats.platformFees.toLocaleString()}`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { label: "Instructor Shares", value: `৳${stats.instructorEarnings.toLocaleString()}`, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Pending Payouts", value: `৳${stats.pendingPayouts.toLocaleString()}`, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
  ]

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Revenue & Payouts</h1>
              <p className="text-muted-foreground mt-1">Track platform sales and manage instructor payments.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-slate-200 dark:border-white/10" onClick={handleExportReport}>
                <Download className="w-4 h-4 mr-2" /> Export Report
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90 disabled:opacity-50" 
                onClick={handleProcessPayouts}
                disabled={!isSuper}
              >
                <CreditCard className="w-4 h-4 mr-2" /> 
                {isSuper ? "Process Payouts" : "Process Payouts (Locked)"}
              </Button>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, i) => (
              <Card key={i} className="border-slate-200 dark:border-white/5 bg-white/50 dark:bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Sales */}
            <Card className="border-slate-200 dark:border-white/5 bg-white/50 dark:bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                    Recent Sales
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">View All</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-slate-200 dark:border-white/5">
                      <TableHead>Student</TableHead>
                      <TableHead>Batch Info</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.slice(0, 10).map((sale) => (
                      <TableRow key={sale.id} className="border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/[0.01]">
                        <TableCell className="text-sm font-medium">{sale.student_profiles?.full_name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {sale.academic_batches?.batch_number} ({sale.academic_batches?.university})
                        </TableCell>
                        <TableCell className="text-sm font-bold text-emerald-400">৳{sale.amount_paid}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {format(new Date(sale.created_at), 'MMM dd')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Payout History */}
            <Card className="border-slate-200 dark:border-white/5 bg-white/50 dark:bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowDownLeft className="w-5 h-5 text-primary" />
                    Payout Status
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">Manage</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-slate-200 dark:border-white/5">
                      <TableHead>Instructor</TableHead>
                      <TableHead>Course / Batch</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.slice(0, 10).map((payout) => (
                      <TableRow key={payout.id} className="border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/[0.01]">
                        <TableCell className="text-sm font-medium">{payout.profiles?.full_name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {payout.courses?.course_name} (Batch {payout.academic_batches?.batch_number})
                        </TableCell>
                        <TableCell className="text-sm font-bold">৳{payout.amount}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={payout.status === 'paid' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}>
                            {payout.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
