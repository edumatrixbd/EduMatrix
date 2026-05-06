"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  BookOpen, 
  Percent, 
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Edit,
  Trash2,
  Loader2
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function AdminInstructorsPage() {
  const [loading, setLoading] = React.useState(true)
  const [instructors, setInstructors] = React.useState<any[]>([])
  const [search, setSearch] = React.useState("")

  React.useEffect(() => {
    fetchInstructors()
  }, [])

  const fetchInstructors = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("instructors")
        .select(`
          *,
          instructor_courses(count),
          payouts(amount, status)
        `)
      
      if (error) throw error
      
      // Calculate earnings (simplified for this view)
      const processed = data.map(inst => {
        const totalPayouts = inst.payouts?.filter((p: any) => p.status === 'paid').reduce((acc: number, curr: any) => acc + Number(curr.amount), 0) || 0
        return {
          ...inst,
          courseCount: inst.instructor_courses?.[0]?.count || 0,
          totalEarnings: totalPayouts
        }
      })

      setInstructors(processed)
    } catch (error: any) {
      console.error("Error fetching instructors:", JSON.stringify(error, null, 2))
      if (error?.code === "42P01" || error?.code === "PGRST205") {
        toast.error("Instructor tables missing. Please run the SQL script.")
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredInstructors = instructors.filter(i => 
    i.name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin" /></div>

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Instructors</h1>
          <p className="text-muted-foreground mt-1">Manage course instructors and revenue sharing agreements.</p>
        </div>
        <Button className="gap-2 bg-primary hover:bg-primary/90">
          <UserPlus className="w-4 h-4" /> Add Instructor
        </Button>
      </motion.div>

      {/* Main Table Card */}
      <Card className="border-white/5 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">Instructor Roster</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name..." 
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
                  <TableHead className="w-[300px]">Instructor</TableHead>
                  <TableHead>Assigned Courses</TableHead>
                  <TableHead>Total Earnings</TableHead>
                  <TableHead>Expertise</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstructors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No instructors found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInstructors.map((inst) => (
                    <TableRow key={inst.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {inst.name?.[0]}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-foreground truncate">{inst.name}</span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">instructor@example.com</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-sm font-medium">{inst.courseCount} Courses</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-sm font-bold text-emerald-400">৳{inst.totalEarnings.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {inst.expertise?.slice(0, 2).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] bg-white/5 text-white/70">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {inst.created_at ? new Date(inst.created_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-white/10">
                            <DropdownMenuLabel>Instructor Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem className="cursor-pointer">
                              <Edit className="w-4 h-4 mr-2" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-blue-400">
                              <BookOpen className="w-4 h-4 mr-2" /> Manage Courses
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-emerald-400">
                              <Percent className="w-4 h-4 mr-2" /> Adjust Shares
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem className="cursor-pointer text-red-400">
                              <Trash2 className="w-4 h-4 mr-2" /> Remove
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
