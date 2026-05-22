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
  Layers,
  Building2,
  University,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { logAdminActivity } from "@/lib/activity-logger"
import { cn } from "@/lib/utils"

type Batch = {
  id: string
  batch_number: string
  university_id: string
  department_id: string
  active: boolean
  university?: { name: string }
  department?: { name: string }
}

type Uni = { id: string; name: string; short_name: string }
type Dept = { id: string; name: string; short_name: string; university_id: string }

const EMPTY_FORM = {
  batch_number: "",
  university_id: "",
  department_id: "",
  active: true,
}

export default function BatchesPage() {
  const supabase = createClient()

  const [batches, setBatches] = useState<Batch[]>([])
  const [unis, setUnis] = useState<Uni[]>([])
  const [allDepts, setAllDepts] = useState<Dept[]>([])
  const [filteredDepts, setFilteredDepts] = useState<Dept[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  // ─── Fetch ───────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)

    // 1. Try direct relationship join first
    const { data: directData, error: directError } = await supabase
      .from("academic_batches")
      .select(`
        id,
        batch_number,
        active,
        university_id,
        department_id,
        department:department_id(name),
        university:university_id(name)
      `)
      .order("batch_number", { ascending: false })

    if (!directError && directData) {
      console.log("Direct relationship join succeeded!")
      
      // Standardize the shape and set the batches state
      const mapped = directData.map((b: any) => ({
        id: b.id,
        batch_number: b.batch_number,
        active: b.active,
        university_id: b.university_id,
        department_id: b.department_id,
        university: Array.isArray(b.university) ? b.university[0] : b.university || { name: "Unknown" },
        department: Array.isArray(b.department) ? b.department[0] : b.department || { name: "Unknown" }
      }))
      
      setBatches(mapped)
      
      // Fetch universities and departments list for the dropdown forms
      const [uniRes, deptRes] = await Promise.all([
        supabase
          .from("universities")
          .select("id, name, short_name")
          .eq("active", true)
          .order("name"),
        supabase
          .from("departments")
          .select("id, name, short_name, university_id")
          .eq("active", true)
          .order("name"),
      ])
      
      if (!uniRes.error) setUnis(uniRes.data || [])
      if (!deptRes.error) setAllDepts(deptRes.data || [])
      
      setLoading(false)
      return
    }

    // 2. Fallback to manual join if direct relationship query fails (e.g. missing foreign key constraint in cache)
    console.warn("Direct relationship query failed, falling back to manual parallel join. Error:", directError)

    const [batchRes, uniRes, deptRes] = await Promise.all([
      supabase
        .from("academic_batches")
        .select("id, batch_number, university_id, department_id, active")
        .order("batch_number", { ascending: false }),
      supabase
        .from("universities")
        .select("id, name, short_name")
        .eq("active", true)
        .order("name"),
      supabase
        .from("departments")
        .select("id, name, short_name, university_id")
        .eq("active", true)
        .order("name"),
    ])

    if (batchRes.error) {
      console.error("BATCH_FETCH_ERROR:", batchRes.error)
      toast.error("Failed to load batches: " + (batchRes.error.message || "Relationship Error"))
    } else {
      // Manually join the university and department names
      const uData = uniRes.data || []
      const dData = deptRes.data || []
      
      const enrichedBatches = (batchRes.data || []).map(b => ({
        ...b,
        university: { name: uData.find(u => u.id === b.university_id)?.name || "Unknown" },
        department: { name: dData.find(d => d.id === b.department_id)?.name || "Unknown" }
      }))
      
      setBatches(enrichedBatches)
    }

    if (!uniRes.error) setUnis(uniRes.data || [])
    if (!deptRes.error) setAllDepts(deptRes.data || [])

    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  // Filter departments whenever selected university changes
  useEffect(() => {
    if (form.university_id) {
      setFilteredDepts(allDepts.filter((d) => d.university_id === form.university_id))
    } else {
      setFilteredDepts([])
    }
  }, [form.university_id, allDepts])

  // ─── Open Add Dialog ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingBatch(null)
    setForm({ ...EMPTY_FORM })
    setDialogOpen(true)
  }

  // ─── Open Edit Dialog ─────────────────────────────────────────────────────────
  const openEdit = (batch: Batch) => {
    setEditingBatch(batch)
    setForm({
      batch_number: batch.batch_number,
      university_id: batch.university_id,
      department_id: batch.department_id,
      active: batch.active,
    })
    setDialogOpen(true)
  }

  // ─── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.university_id) return toast.error("Please select a university")
    if (!form.department_id) return toast.error("Please select a department")
    if (!form.batch_number.trim()) return toast.error("Batch number is required")

    const selectedUni = unis.find(u => u.id === form.university_id)
    const selectedDept = allDepts.find(d => d.id === form.department_id)

    const payload = {
      batch_number: form.batch_number.trim(),
      university_id: form.university_id,
      department_id: form.department_id,
      university: selectedUni?.short_name || "Unknown",
      department: selectedDept?.short_name || "Unknown",
      active: form.active,
    }

    console.log("BATCH_SAVE_PAYLOAD:", payload)
    setSaving(true)

    let error: any

    if (editingBatch) {
      ;({ error } = await supabase.from("academic_batches").update(payload).eq("id", editingBatch.id))
      if (!error) {
        await logAdminActivity("UPDATE_BATCH", "batch", editingBatch.id, { batch_number: payload.batch_number })
      }
    } else {
      const { data: inserted, error: insertError } = await supabase.from("academic_batches").insert([payload]).select("id").single()
      error = insertError
      if (!error) {
        await logAdminActivity("CREATE_BATCH", "batch", inserted?.id || null, { batch_number: payload.batch_number })
      }
    }

    if (error) {
      console.error("BATCH_SAVE_ERROR:", { message: error.message, details: error.details, hint: error.hint, code: error.code })
      toast.error("Save failed: " + error.message)
      setSaving(false)
      return
    }

    toast.success(editingBatch ? "Batch updated ✓" : "Batch added ✓")
    setDialogOpen(false)
    setSaving(false)
    fetchData()
  }

  // ─── Toggle active ────────────────────────────────────────────────────────────
  const handleToggle = async (batch: Batch) => {
    const newValue = !batch.active
    console.log("toggle batch active:", batch.id, newValue)

    const { error } = await supabase
      .from("academic_batches")
      .update({ active: newValue })
      .eq("id", batch.id)

    if (error) {
      console.error("BATCH_TOGGLE_ERROR:", error)
      toast.error("Toggle failed: " + error.message)
      return
    }

    await logAdminActivity("TOGGLE_BATCH_STATUS", "batch", batch.id, { active: newValue })

    toast.success("Batch status updated ✓")
    fetchData()
  }

  // ─── Soft Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async (batch: Batch) => {
    if (!confirm(`Deactivate Batch ${batch.batch_number}? Note: Child records (courses) will remain and must be managed separately.`)) return

    console.log("soft delete batch:", batch.id)

    const { error } = await supabase
      .from("academic_batches")
      .update({ active: false })
      .eq("id", batch.id)

    if (error) {
      console.error("BATCH_DELETE_ERROR:", error)
      toast.error("Failed: " + error.message)
      return
    }

    await logAdminActivity("DEACTIVATE_BATCH", "batch", batch.id, { batch_number: batch.batch_number })

    toast.success("Batch deactivated ✓")
    fetchData()
  }

  // ─── Filter ───────────────────────────────────────────────────────────────────
  const filtered = batches.filter((b) => {
    const q = searchTerm.toLowerCase()
    return (
      (b.batch_number || "").toLowerCase().includes(q) ||
      (b.university?.name || "").toLowerCase().includes(q) ||
      (b.department?.name || "").toLowerCase().includes(q)
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
            <Layers className="w-8 h-8 text-primary" />
            Academic Batches
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            100% DB-driven · Linked to university + department by UUID
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
            Add Batch
          </Button>
        </div>
      </motion.div>

      {/* Table */}
      <Card className="border-border bg-card rounded-xl overflow-hidden shadow-sm">
        <CardHeader className="p-5 border-b border-border">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by batch, department or university..."
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
                <TableHead className="p-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Batch
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Institution · Department
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">
                  Active
                </TableHead>
                <TableHead className="p-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-right">
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
                    className="text-center py-40 text-muted-foreground font-black italic uppercase tracking-widest text-sm"
                  >
                    No batches found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((batch) => (
                  <TableRow
                    key={batch.id}
                    className="border-border transition-all hover:bg-muted/50"
                  >
                    {/* Batch number */}
                    <TableCell className="p-5">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-xl shadow-inner flex-shrink-0">
                          {batch.batch_number}
                        </div>
                        <div>
                          <p className="font-black text-xl tracking-tight text-foreground">
                            Batch {batch.batch_number}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                            ID: {batch.id.slice(0, 8)}…
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Institution */}
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <University className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="font-bold text-sm text-foreground">
                            {batch.university?.name || "Unknown"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="font-bold text-xs text-muted-foreground">
                            {batch.department?.name || "Unknown"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Active toggle */}
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Switch
                          checked={!!batch.active}
                          onCheckedChange={() => handleToggle(batch)}
                        />
                        <Badge
                          className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5",
                            batch.active
                              ? "bg-emerald-500 text-white"
                              : "bg-muted text-muted-foreground border border-border"
                          )}
                        >
                          {batch.active ? "Live" : "Hidden"}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Actions — always visible */}
                    <TableCell className="text-right p-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(batch)}
                          className="h-9 w-9 text-primary hover:bg-primary/10 rounded-xl border border-border"
                          title="Edit batch"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(batch)}
                          className="h-9 w-9 text-red-500 hover:bg-red-500/10 rounded-xl border border-border"
                          title="Deactivate batch"
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
        <DialogContent className="bg-card border-border text-foreground rounded-2xl sm:max-w-[450px] p-0 overflow-hidden shadow-2xl">
          <div className="p-6 bg-muted/20 border-b border-border">
            <DialogTitle className="text-2xl font-black tracking-tight">
              {editingBatch ? "Edit Batch" : "Add Batch"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-1">
              Linked by university_id + department_id
            </DialogDescription>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-4">
            {/* University */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                University *
              </Label>
              <Select
                value={form.university_id}
                onValueChange={(v) =>
                  setForm({ ...form, university_id: v, department_id: "" })
                }
              >
                <SelectTrigger className="h-10 bg-background border-input rounded-xl font-black">
                  <SelectValue placeholder="Select University" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border rounded-xl">
                  {unis.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="font-bold py-3">
                      {u.name} ({u.short_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department (filtered by selected university) */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Department *
              </Label>
              <Select
                value={form.department_id}
                onValueChange={(v) => setForm({ ...form, department_id: v })}
                disabled={!form.university_id}
              >
                <SelectTrigger className="h-10 bg-background border-input rounded-xl font-black">
                  <SelectValue
                    placeholder={
                      form.university_id ? "Select Department" : "Select university first"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border rounded-xl">
                  {filteredDepts.length === 0 ? (
                    <SelectItem value="_none" disabled className="font-bold py-3 text-muted-foreground">
                      No departments for this university
                    </SelectItem>
                  ) : (
                    filteredDepts.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="font-bold py-3">
                        {d.name} ({d.short_name})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Batch number */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Batch Number *
              </Label>
              <Input
                value={form.batch_number}
                onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
                placeholder="e.g. 68"
                className="h-12 bg-background border-input rounded-xl font-black text-3xl text-center text-primary"
                required
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border">
              <div>
                <p className="font-black text-foreground uppercase text-[10px] tracking-widest">
                  Active
                </p>
                <p className="text-[8px] text-muted-foreground mt-0.5">Visible in onboarding</p>
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
              className="w-full h-10 bg-primary text-primary-foreground font-black rounded-xl text-base shadow-2xl shadow-primary/30"
            >
              {saving ? (
                <Loader2 className="animate-spin w-6 h-6" />
              ) : editingBatch ? (
                "Save Changes"
              ) : (
                "Add Batch"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
