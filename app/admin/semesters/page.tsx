"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  University,
  Loader2,
  RefreshCw,
  CheckCircle2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Semester = {
  id: string
  name: string
  code: string
  university_id: string
  is_current: boolean
  active: boolean
  status: string // legacy
  universities?: { name: string; short_name: string }
}

type Uni = { id: string; name: string; short_name: string }

const EMPTY_FORM = {
  name: "",
  code: "",
  university_id: "",
  is_current: false,
  active: true,
}

export default function SemestersPage() {
  const supabase = createClient()

  const [sems, setSems] = useState<Semester[]>([])
  const [unis, setUnis] = useState<Uni[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSem, setEditingSem] = useState<Semester | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  // ─── Fetch ───────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    const [semRes, uniRes] = await Promise.all([
      supabase
        .from("semesters")
        .select("*, universities(name, short_name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("universities")
        .select("id, name, short_name")
        .eq("active", true)
        .order("name"),
    ])

    if (semRes.error) {
      console.error("SEM_FETCH_ERROR:", semRes.error)
      toast.error("Failed to load semesters: " + semRes.error.message)
    } else {
      setSems(semRes.data || [])
    }

    if (!uniRes.error) setUnis(uniRes.data || [])

    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  // ─── Open Add Dialog ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingSem(null)
    setForm({ ...EMPTY_FORM })
    setDialogOpen(true)
  }

  // ─── Open Edit Dialog ─────────────────────────────────────────────────────────
  const openEdit = (sem: Semester) => {
    setEditingSem(sem)
    setForm({
      name: sem.name,
      code: sem.code || "",
      university_id: sem.university_id,
      is_current: sem.is_current,
      active: sem.active,
    })
    setDialogOpen(true)
  }

  // ─── Save (Insert or Update) ──────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.university_id) return toast.error("Please select a university")
    if (!form.name.trim()) return toast.error("Semester name is required")

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      university_id: form.university_id,
      is_current: form.is_current,
      active: form.active,
      status: form.active ? 'active' : 'inactive' // legacy sync
    }

    setSaving(true)

    // If setting this one as current, unset others for the same university
    if (payload.is_current) {
      await supabase.from('semesters').update({ is_current: false }).eq('university_id', payload.university_id)
    }

    let error: any

    if (editingSem) {
      ;({ error } = await supabase.from("semesters").update(payload).eq("id", editingSem.id))
    } else {
      ;({ error } = await supabase.from("semesters").insert([payload]))
    }

    if (error) {
      console.error("SEM_SAVE_ERROR MSG:", error.message)
      console.error("SEM_SAVE_ERROR DETAILS:", error.details)
      console.error("SEM_SAVE_ERROR HINT:", error.hint)
      toast.error("Save failed: " + (error.message || "Unknown error"))
      setSaving(false)
      return
    }

    toast.success(editingSem ? "Semester updated ✓" : "Semester added ✓")
    setDialogOpen(false)
    setSaving(false)
    fetchData()
  }

  // ─── Toggle active ────────────────────────────────────────────────────────────
  const handleToggle = async (sem: Semester) => {
    const newValue = !sem.active
    
    const { error } = await supabase
      .from("semesters")
      .update({ active: newValue, status: newValue ? 'active' : 'inactive' })
      .eq("id", sem.id)

    if (error) {
      toast.error("Toggle failed: " + error.message)
      return
    }

    toast.success("Semester status updated ✓")
    fetchData()
  }

  // ─── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async (sem: Semester) => {
    if (!confirm(`Delete "${sem.name}"? Note: Courses associated with this semester will be affected.`)) return

    const { error } = await supabase.from("semesters").delete().eq("id", sem.id)

    if (error) {
      toast.error("Failed: " + error.message)
      return
    }

    toast.success("Semester deleted ✓")
    fetchData()
  }

  // ─── Filter ───────────────────────────────────────────────────────────────────
  const filtered = sems.filter((s) => {
    const q = searchTerm.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      (s.code || "").toLowerCase().includes(q) ||
      (s.universities?.name || "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            Semester Registry
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            100% DB-driven · Academic terms and targeting windows
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={fetchData}
            className="h-10 px-4 rounded-xl border-border font-black"
          >
            <RefreshCw className={cn("w-5 h-5 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            onClick={openAdd}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl h-10 px-5 shadow-xl shadow-primary/20 text-base"
          >
            <Plus className="w-6 h-6 mr-2" />
            Add Semester
          </Button>
        </div>
      </motion.div>

      {/* Table */}
      <Card className="border-border bg-card rounded-xl overflow-hidden shadow-sm">
        <CardHeader className="p-5 border-b border-border">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by semester or university..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-background h-10 rounded-xl border-input font-bold focus:ring-primary focus:border-primary shadow-inner"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="p-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Term</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Institution</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">Status</TableHead>
                <TableHead className="p-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-40">
                    <Loader2 className="animate-spin w-12 h-12 mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-40 text-muted-foreground font-black italic uppercase tracking-widest text-sm">No semesters found.</TableCell>
                </TableRow>
              ) : (
                filtered.map((sem) => (
                  <TableRow key={sem.id} className="border-border transition-all hover:bg-muted/50">
                    <TableCell className="p-5">
                      <div className="flex items-center gap-5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-2xl flex-shrink-0 ${sem.is_current ? 'bg-primary/20 text-primary border border-primary/20' : 'bg-muted border border-border text-muted-foreground'}`}>
                          {sem.code || sem.name.slice(0, 2)}
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-lg tracking-tight flex items-center gap-2">
                            {sem.name}
                            {sem.is_current && (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-black uppercase h-5 px-2">Current</Badge>
                            )}
                          </p>
                          <Badge variant="outline" className="text-[10px] font-black uppercase border-border text-muted-foreground px-3 h-6">{sem.code || 'NO_CODE'}</Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <University className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-bold text-sm text-foreground">{sem.universities?.short_name || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Switch checked={!!sem.active} onCheckedChange={() => handleToggle(sem)} />
                        <Badge className={cn("text-[8px] font-black uppercase px-2 py-0.5", sem.active ? "bg-emerald-500 text-white" : "bg-red-500/80 text-white")}>
                          {sem.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right p-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(sem)} className="h-9 w-9 text-primary hover:bg-primary/10 rounded-xl border border-border" title="Edit semester">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(sem)} className="h-9 w-9 text-red-400 hover:bg-red-500/10 rounded-xl border border-border" title="Delete semester">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground rounded-2xl sm:max-w-[450px] p-0 overflow-hidden shadow-2xl">
          <div className="p-6 bg-muted/20 border-b border-border">
            <DialogTitle className="text-2xl font-black tracking-tight">{editingSem ? "Edit Semester" : "Add Semester"}</DialogTitle>
            <DialogDescription className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-1">Saved directly to Supabase · linked by university_id</DialogDescription>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Parent University *</Label>
              <Select value={form.university_id} onValueChange={(v) => setForm({ ...form, university_id: v })}>
                <SelectTrigger className="h-10 bg-background border-input rounded-xl font-black">
                  <SelectValue placeholder="Select University" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border rounded-xl">
                  {unis.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="font-bold py-3">{u.name} ({u.short_name})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Semester Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Spring 2026" className="h-10 bg-background border-input rounded-xl font-bold" required />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Short Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. S26" className="h-10 bg-background border-input rounded-xl font-bold uppercase" />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border">
              <div>
                <p className="font-black text-foreground uppercase text-[10px] tracking-widest">Current Semester</p>
                <p className="text-[8px] text-muted-foreground mt-0.5">Mark as the active term for targeting</p>
              </div>
              <Switch checked={form.is_current} onCheckedChange={(v) => setForm({ ...form, is_current: v })} />
            </div>

            <Button type="submit" disabled={saving} className="w-full h-10 bg-primary text-primary-foreground font-black rounded-xl text-base shadow-2xl shadow-primary/30">
              {saving ? <Loader2 className="animate-spin w-6 h-6" /> : (editingSem ? "Save Changes" : "Add Semester")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
