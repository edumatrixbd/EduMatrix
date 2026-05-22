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
  Building2,
  University,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Dept = {
  id: string
  name: string
  short_name: string
  code: string
  university_id: string
  active: boolean
  universities?: { name: string; short_name: string }
}

type Uni = { id: string; name: string; short_name: string }

const EMPTY_FORM = {
  name: "",
  short_name: "",
  code: "",
  university_id: "",
  active: true,
}

export default function DepartmentsPage() {
  const supabase = createClient()

  const [depts, setDepts] = useState<Dept[]>([])
  const [unis, setUnis] = useState<Uni[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Dept | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  // ─── Fetch ───────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    const [deptRes, uniRes] = await Promise.all([
      supabase
        .from("departments")
        .select("id, name, short_name, code, university_id, active, universities(name, short_name)")
        .order("name"),
      supabase
        .from("universities")
        .select("id, name, short_name")
        .eq("active", true)
        .order("name"),
    ])

    if (deptRes.error) {
      console.error("DEPT_FETCH_ERROR MSG:", deptRes.error.message)
      console.error("DEPT_FETCH_ERROR DETAILS:", deptRes.error.details)
      console.error("DEPT_FETCH_ERROR HINT:", deptRes.error.hint)
      toast.error("Failed to load departments: " + deptRes.error.message)
    } else {
      setDepts(deptRes.data || [])
    }

    if (uniRes.error) {
      console.error("UNI_FETCH_ERROR:", uniRes.error)
    } else {
      setUnis(uniRes.data || [])
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  // ─── Open Add Dialog ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingDept(null)
    setForm({ ...EMPTY_FORM })
    setDialogOpen(true)
  }

  // ─── Open Edit Dialog ─────────────────────────────────────────────────────────
  const openEdit = (dept: Dept) => {
    setEditingDept(dept)
    setForm({
      name: dept.name,
      short_name: dept.short_name,
      code: dept.code || "",
      university_id: dept.university_id,
      active: dept.active,
    })
    setDialogOpen(true)
  }

  // ─── Save (Insert or Update) ──────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.university_id) return toast.error("Please select a university")
    if (!form.name.trim()) return toast.error("Department name is required")
    if (!form.short_name.trim()) return toast.error("Short code is required")

    const payload = {
      name: form.name.trim(),
      short_name: form.short_name.trim().toUpperCase(),
      code: form.code.trim().toUpperCase() || form.short_name.trim().toUpperCase(),
      university_id: form.university_id,
      active: form.active,
    }

    console.log("DEPT_SAVE_PAYLOAD:", payload)
    setSaving(true)

    let error: any

    if (editingDept) {
      ;({ error } = await supabase.from("departments").update(payload).eq("id", editingDept.id))
    } else {
      ;({ error } = await supabase.from("departments").insert([payload]))
    }

    if (error) {
      console.error("DEPT_SAVE_ERROR MSG:", error.message)
      console.error("DEPT_SAVE_ERROR DETAILS:", error.details)
      console.error("DEPT_SAVE_ERROR HINT:", error.hint)
      console.error("DEPT_SAVE_ERROR FULL:", JSON.stringify(error, null, 2))
      toast.error("Save failed: " + (error.message || "Unknown error"))
      setSaving(false)
      return
    }

    toast.success(editingDept ? "Department updated ✓" : "Department added ✓")
    setDialogOpen(false)
    setSaving(false)
    fetchData()
  }

  // ─── Toggle active ────────────────────────────────────────────────────────────
  const handleToggle = async (dept: Dept) => {
    const newValue = !dept.active
    console.log("toggle dept active:", dept.id, newValue)

    const { error } = await supabase
      .from("departments")
      .update({ active: newValue })
      .eq("id", dept.id)

    if (error) {
      console.error("DEPT_TOGGLE_ERROR:", error)
      toast.error("Toggle failed: " + error.message)
      return
    }

    toast.success("Department status updated ✓")
    fetchData()
  }

  // ─── Soft Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async (dept: Dept) => {
    if (!confirm(`Deactivate "${dept.name}"? Note: Child records (batches, courses) will remain and must be managed separately.`)) return

    console.log("soft delete dept:", dept.id)

    const { error } = await supabase
      .from("departments")
      .update({ active: false })
      .eq("id", dept.id)

    if (error) {
      console.error("DEPT_DELETE_ERROR:", error)
      toast.error("Failed: " + error.message)
      return
    }

    toast.success("Department deactivated ✓")
    fetchData()
  }

  // ─── Filter ───────────────────────────────────────────────────────────────────
  const filtered = depts.filter((d) => {
    const q = searchTerm.toLowerCase()
    return (
      d.name.toLowerCase().includes(q) ||
      d.short_name.toLowerCase().includes(q) ||
      (d.universities?.name || "").toLowerCase().includes(q)
    )
  })

  // ─── Render ───────────────────────────────────────────────────────────────────
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
            <Building2 className="w-8 h-8 text-primary" />
            Departments
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            100% DB-driven · Linked to universities by UUID
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={fetchData}
            className="h-10 px-4 rounded-xl border-white/10 font-black"
          >
            <RefreshCw className={cn("w-5 h-5 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            onClick={openAdd}
            className="bg-primary hover:bg-primary/90 text-white font-black rounded-xl h-10 px-5 shadow-xl shadow-primary/20 text-base"
          >
            <Plus className="w-6 h-6 mr-2" />
            Add Department
          </Button>
        </div>
      </motion.div>

      {/* Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl">
        <CardHeader className="p-5 border-b border-white/5">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              placeholder="Search by department or university..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-slate-950/50 h-10 rounded-xl border-white/5 font-bold focus:ring-primary shadow-inner"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="p-5 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Department
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  University
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 text-center">
                  Active
                </TableHead>
                <TableHead className="p-5 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 text-right">
                  Actions
                </TableHead>
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
                  <TableCell
                    colSpan={4}
                    className="text-center py-40 text-slate-500 font-black italic uppercase tracking-widest text-sm"
                  >
                    No departments found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((dept) => (
                  <TableRow
                    key={dept.id}
                    className="border-white/5 transition-all hover:bg-primary/[0.03]"
                  >
                    {/* Department info */}
                    <TableCell className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center font-black text-primary text-sm shadow-2xl flex-shrink-0">
                          {dept.short_name.slice(0, 2)}
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-lg tracking-tight">{dept.name}</p>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-black uppercase border-white/10 px-3 h-6"
                          >
                            {dept.code || dept.short_name}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>

                    {/* University */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <University className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span className="font-bold text-sm text-slate-300">
                          {dept.universities?.name || "—"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Active toggle */}
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Switch
                          checked={!!dept.active}
                          onCheckedChange={() => handleToggle(dept)}
                        />
                        <Badge
                          className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5",
                            dept.active
                              ? "bg-emerald-500 text-white"
                              : "bg-red-500/80 text-white"
                          )}
                        >
                          {dept.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Actions — always visible */}
                    <TableCell className="text-right p-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(dept)}
                          className="h-9 w-9 text-primary hover:bg-primary/10 rounded-xl border border-white/5"
                          title="Edit department"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(dept)}
                          className="h-9 w-9 text-red-400 hover:bg-red-500/10 rounded-xl border border-white/5"
                          title="Deactivate department"
                        >
                          <Trash2 className="w-5 h-5" />
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
        <DialogContent className="bg-[#0B0F1A] border-white/10 text-white rounded-2xl sm:max-w-[500px] p-0 overflow-hidden shadow-2xl">
          <div className="p-6 bg-white/[0.02] border-b border-white/5">
            <DialogTitle className="text-2xl font-black tracking-tight">
              {editingDept ? "Edit Department" : "Add Department"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">
              Saved directly to Supabase · linked by university_id
            </DialogDescription>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-4">
            {/* University selector */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Parent University *
              </Label>
              <Select
                value={form.university_id}
                onValueChange={(v) => setForm({ ...form, university_id: v })}
              >
                <SelectTrigger className="h-10 bg-slate-950 border-white/5 rounded-xl font-black shadow-inner">
                  <SelectValue placeholder="Select University" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 rounded-xl">
                  {unis.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="font-bold py-3">
                      {u.name} ({u.short_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department name */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Department Name *
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Computer Science & Engineering"
                className="h-10 bg-slate-950 border-white/5 rounded-xl font-bold shadow-inner"
                required
              />
            </div>

            {/* Short code + internal code */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Short Code *
                </Label>
                <Input
                  value={form.short_name}
                  onChange={(e) =>
                    setForm({ ...form, short_name: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. CSE"
                  className="h-14 bg-slate-950 border-white/5 rounded-2xl font-bold shadow-inner uppercase"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Internal Code
                </Label>
                <Input
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. CS-101"
                  className="h-14 bg-slate-950 border-white/5 rounded-2xl font-bold shadow-inner uppercase"
                />
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
              <div>
                <p className="font-black text-slate-300 uppercase text-[10px] tracking-widest">
                  Active
                </p>
                <p className="text-[8px] text-slate-500 mt-0.5">Visible in onboarding</p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={saving}
              className="w-full h-14 bg-primary text-white font-black rounded-2xl text-lg shadow-2xl shadow-primary/30"
            >
              {saving ? (
                <Loader2 className="animate-spin w-6 h-6" />
              ) : editingDept ? (
                "Save Changes"
              ) : (
                "Add Department"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
