"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Users, 
  Clock, 
  BookOpen, 
  Search, 
  Filter, 
  MoreHorizontal, 
  ArrowUpRight,
  TrendingUp,
  Activity,
  UserCheck,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"

export default function AdminStudentsPage() {
  const [loading, setLoading] = React.useState(true)
  const [students, setStudents] = React.useState<any[]>([])
  const [search, setSearch] = React.useState("")

  React.useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const supabase = createClient()
      
      // Fetch students with enrollment counts and session totals
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          course_enrollments(count),
          usage_sessions(duration_seconds)
        `)
      
      if (error) throw error
      
      // Process data to calculate totals
      const processed = data.map(s => {
        const totalSeconds = s.usage_sessions?.reduce((acc: number, curr: any) => acc + (curr.duration_seconds || 0), 0) || 0
        return {
          ...s,
          enrollmentCount: s.course_enrollments?.[0]?.count || 0,
          totalHours: Math.round(totalSeconds / 3600 * 10) / 10
        }
      })

      setStudents(processed)
    } catch (error: any) {
      console.error("Error fetching students:", JSON.stringify(error, null, 2))
      if (error?.code === "42P01" || error?.code === "PGRST205") {
        toast.error("Database tables missing. Please run the SQL script.")
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.registration_number?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = [
    { label: "Total Students", value: students.length, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Active Today", value: students.filter(s => s.last_accessed_at && new Date(s.last_accessed_at) > new Date(Date.now() - 86400000)).length, icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Avg. Progress", value: "68%", icon: TrendingUp, color: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "Pro Members", value: students.filter(s => s.plan === 'pro').length, icon: UserCheck, color: "text-amber-400", bg: "bg-amber-500/10" },
  ]

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin" /></div>

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Student Management</h1>
        <p className="text-muted-foreground mt-1">Track student engagement and platform performance.</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-white/5 bg-card/50 backdrop-blur-sm">
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

      {/* Main Table Card */}
      <Card className="border-white/5 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="p-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>All Students</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search name, email, ID..." 
                  className="pl-9 w-64 bg-muted/30 border-white/10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="border-white/10">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-[300px]">Student</TableHead>
                  <TableHead>Registration No.</TableHead>
                  <TableHead>Enrolled Courses</TableHead>
                  <TableHead>Time Spent</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No students found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-white/10">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {student.name?.split(' ').map((n: any) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-foreground truncate">{student.name}</span>
                            <span className="text-xs text-muted-foreground truncate">{student.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{student.registration_number || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-sm">{student.enrollmentCount} Courses</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-violet-400" />
                          <span className="text-sm">{student.totalHours} hrs</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {student.last_accessed_at ? formatDistanceToNow(new Date(student.last_accessed_at), { addSuffix: true }) : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "text-[10px] uppercase font-bold",
                          student.plan === 'pro' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                          student.plan === 'lifetime' ? "bg-violet-500/10 text-violet-500 border-violet-500/20" :
                          "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        )}>
                          {student.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-white/10">
                            <DropdownMenuLabel>Student Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem className="cursor-pointer">
                              <ArrowUpRight className="w-4 h-4 mr-2" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <BookOpen className="w-4 h-4 mr-2" /> View Enrollments
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Activity className="w-4 h-4 mr-2" /> Activity History
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
