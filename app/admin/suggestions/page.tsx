"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Plus, Edit, Trash2, Search, Sparkles } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface Suggestion {
  id: string
  title: string
  priority: string
  status: string
  course_id: string
  courses?: {
    course_name: string
    course_code: string
  }
  created_at: string
}

export default function SuggestionsAdminPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const fetchSuggestions = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('exam_suggestions')
        .select('*, courses(course_name, course_code)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSuggestions(data || [])
      setError(null)
    } catch (error: any) {
      console.error("Error fetching suggestions:", error)
      setError("Could not load suggestions.")
      toast.error("Failed to load suggestions")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this suggestion?")) return
    
    const toastId = toast.loading("Deleting suggestion...")
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('exam_suggestions')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setSuggestions(suggestions.filter(s => s.id !== id))
      toast.success("Suggestion deleted successfully", { id: toastId })
    } catch (error: any) {
      console.error("Error deleting suggestion:", error)
      toast.error(error.message || "Failed to delete suggestion", { id: toastId })
    }
  }

  const filtered = suggestions.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.courses?.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.courses?.course_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
    }
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            Exam Suggestions
          </h1>
          <p className="text-muted-foreground mt-1">Manage course-wise exam blueprints and suggestions</p>
        </div>
        <Link href="/admin/suggestions/add">
          <Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            Create Suggestion
          </Button>
        </Link>
      </motion.div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background/50"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-bold">Title</TableHead>
                  <TableHead className="font-bold">Course</TableHead>
                  <TableHead className="font-bold">Priority</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Date</TableHead>
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-muted-foreground font-medium">Fetching suggestions...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                      No suggestions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => (
                    <TableRow key={s.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-bold text-sm">{s.title}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-primary">{s.courses?.course_code}</span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{s.courses?.course_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`capitalize font-black text-[10px] ${getPriorityColor(s.priority)}`}>
                          {s.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.status === "active" ? "default" : "secondary"} className="capitalize font-black text-[10px]">
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[10px] font-medium text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/suggestions/${s.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(s.id)}
                            className="h-8 w-8 hover:bg-red-500/10 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
  )
}
