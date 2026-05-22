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
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  University,
  Loader2,
  Globe,
  Lock,
  Unlock,
  RefreshCw,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function reportSupabaseError(label: string, error: any) {
  const normalized = {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
    raw: error,
  }

  console.error(label, normalized)
  toast.error(`${label}: ${normalized.message || "Unknown Supabase error"}`)
}

async function adminUniversityRequest(url: string, method: "POST" | "PATCH", body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw {
      message: data?.message || data?.error || `Request failed with status ${response.status}`,
      details: data?.details,
      hint: data?.hint,
      code: data?.code,
      status: response.status,
      raw: data,
    }
  }

  return data as Uni
}

type Uni = {
  id: string
  name: string
  short_name: string
  slug: string
  logo_url: string
  active: boolean
  locked: boolean
}

const EMPTY_FORM = {
  name: "",
  short_name: "",
  slug: "",
  logo_url: "",
  active: true,
  locked: false,
}

export default function UniversitiesPage() {
  const [unis, setUnis] = useState<Uni[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUni, setEditingUni] = useState<Uni | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchUnis = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("universities")
      .select("id, name, short_name, slug, logo_url, active, locked")
      .order("name")

    if (error) {
      reportSupabaseError("UNIVERSITIES_FETCH_ERROR", error)
    } else {
      setUnis(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchUnis() }, [fetchUnis])

  // ─── Open Add Dialog ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingUni(null)
    setForm({ ...EMPTY_FORM })
    setDialogOpen(true)
  }

  // ─── Open Edit Dialog ────────────────────────────────────────────────────────
  const openEdit = (uni: Uni) => {
    setEditingUni(uni)
    setForm({
      name: uni.name,
      short_name: uni.short_name,
      slug: uni.slug || "",
      logo_url: uni.logo_url || "",
      active: uni.active,
      locked: uni.locked,
    })
    setDialogOpen(true)
  }

  // ─── Save (Insert or Update) ─────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim()) return toast.error("University name is required")
    if (!form.short_name.trim()) return toast.error("Short name is required")

    const payload = {
      name: form.name.trim(),
      short_name: form.short_name.trim().toUpperCase(),
      slug: form.slug.trim() || form.short_name.trim().toLowerCase(),
      logo_url: form.logo_url.trim(),
      active: form.active,
      locked: form.locked,
    }

    console.log("SAVE_PAYLOAD:", payload)
    setSaving(true)

    let data: Uni | null = null

    try {
      data = editingUni
        ? await adminUniversityRequest(`/api/admin/universities/${editingUni.id}`, "PATCH", payload)
        : await adminUniversityRequest("/api/admin/universities", "POST", payload)
    } catch (error) {
      reportSupabaseError("UNIVERSITY_SAVE_ERROR", error)
      setSaving(false)
      return
    }

    console.log("SAVE_CONFIRMED_DB_ROW:", data)
    toast.success(editingUni ? "University updated ✓" : "University added ✓")
    setDialogOpen(false)
    setSaving(false)
    fetchUnis()
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      return
    }

    const supabase = createClient()
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-")
    const fileName = `universities/${Date.now()}-${safeFileName}`

    setUploadingLogo(true)
    try {
      const { error } = await supabase.storage
        .from("university-logos")
        .upload(fileName, file)

      let logoUrl = ""
      if (error) {
        console.warn("Direct logo upload failed, retrying through admin API:", error)
        const uploadForm = new FormData()
        uploadForm.append("file", file)

        const response = await fetch("/api/admin/universities/logo", {
          method: "POST",
          body: uploadForm,
        })
        const result = await response.json().catch(() => null)

        if (!response.ok) {
          throw {
            message: result?.error || `Logo upload failed with status ${response.status}`,
            raw: result,
          }
        }

        logoUrl = result.logo_url
      } else {
        const { data: publicUrl } = supabase
          .storage
          .from("university-logos")
          .getPublicUrl(fileName)

        logoUrl = publicUrl.publicUrl
      }

      setForm((current) => ({ ...current, logo_url: logoUrl }))

      if (editingUni?.id) {
        const updated = await adminUniversityRequest(
          `/api/admin/universities/${editingUni.id}`,
          "PATCH",
          { logo_url: logoUrl },
        )

        setEditingUni(updated)
        setUnis((current) =>
          current.map((uni) => (uni.id === updated.id ? updated : uni)),
        )
      }

      toast.success("Logo uploaded ✓")
    } catch (error) {
      reportSupabaseError("UNIVERSITY_LOGO_UPLOAD_ERROR", error)
    } finally {
      setUploadingLogo(false)
      e.target.value = ""
    }
  }

  // ─── Toggle active / locked ──────────────────────────────────────────────────
  const handleToggle = async (uni: Uni, field: "active" | "locked") => {
    const newValue = !uni[field]
    console.log(`toggle ${field}:`, uni.id, newValue)

    const patch =
      field === "active"
        ? { active: newValue }
        : { locked: newValue }

    let data: Uni
    try {
      data = await adminUniversityRequest(`/api/admin/universities/${uni.id}`, "PATCH", patch)
    } catch (error) {
      reportSupabaseError(`UNIVERSITY_${field.toUpperCase()}_ERROR`, error)
      return
    }

    if (data?.[field] !== newValue) {
      const message = `DB verification failed for ${field}. Expected ${newValue}, received ${data?.[field]}.`
      console.error("UNIVERSITY_TOGGLE_VERIFY_ERROR:", { row: data, field, expected: newValue })
      toast.error(message)
      return
    }

    console.log("TOGGLE_CONFIRMED_DB_ROW:", data)
    toast.success(`${field === "locked" ? "Lock" : "Status"} updated ✓`)
    fetchUnis()
  }

  // ─── Soft Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async (uni: Uni) => {
    console.log("DELETE CLICKED", uni.id)
    if (!confirm("Deactivate this university? Note: Child records (departments, batches, courses) will remain and must be managed separately.")) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("universities")
        .update({ active: false, deleted_at: new Date().toISOString() })
        .eq("id", uni.id)

      if (error) {
        alert(error.message)
        console.error("delete error", error)
        return
      }
    } catch (error) {
      alert((error as any)?.message || "Failed to delete university")
      console.error("delete error", error)
      return
    }

    setUnis((prev) => prev.filter((u) => u.id !== uni.id))
    await fetchUnis()
    toast.success("University deleted")
  }

  // ─── Filter ──────────────────────────────────────────────────────────────────
  const filtered = unis.filter((u) => {
    const q = searchTerm.toLowerCase()
    return (
      u.name.toLowerCase().includes(q) ||
      u.short_name.toLowerCase().includes(q) ||
      (u.slug || "").toLowerCase().includes(q)
    )
  })

  // ─── Render ──────────────────────────────────────────────────────────────────
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
            <University className="w-8 h-8 text-primary" />
            University Registry
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            100% DB-driven · All changes sync immediately to Supabase
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={fetchUnis}
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
            Add University
          </Button>
        </div>
      </motion.div>

      {/* Search */}
      <Card className="border-border bg-card rounded-xl overflow-hidden shadow-sm">
        <CardHeader className="p-5 border-b border-border">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, code or slug..."
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
                  Institution
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">
                  Active
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">
                  Lock
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
                    No institutions found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((uni) => (
                  <TableRow
                    key={uni.id}
                    className="border-border transition-all hover:bg-muted/50"
                  >
                    {/* Institution details */}
                    <TableCell className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
                          {uni.logo_url ? (
                            <img
                              src={uni.logo_url}
                              className="w-10 h-10 object-contain"
                              alt={uni.short_name}
                            />
                          ) : (
                            <span className="font-black text-primary text-xl uppercase">
                              {uni.short_name.slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-lg tracking-tight text-foreground">{uni.name}</p>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-black uppercase border-border text-muted-foreground px-3 h-6"
                            >
                              {uni.short_name}
                            </Badge>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {uni.slug || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Active toggle */}
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Switch
                          checked={!!uni.active}
                          onCheckedChange={() => handleToggle(uni, "active")}
                        />
                        <Badge
                          className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5",
                            uni.active
                              ? "bg-emerald-500 text-white"
                              : "bg-red-500/80 text-white"
                          )}
                        >
                          {uni.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Lock toggle */}
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggle(uni, "locked")}
                          className={cn(
                            "h-9 px-4 rounded-xl font-black text-[10px] uppercase border",
                            uni.locked
                              ? "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                          )}
                        >
                          {uni.locked ? (
                            <Lock className="w-3 h-3 mr-1.5" />
                          ) : (
                            <Unlock className="w-3 h-3 mr-1.5" />
                          )}
                          {uni.locked ? "Locked" : "Open"}
                        </Button>
                      </div>
                    </TableCell>

                    {/* Actions - always visible */}
                    <TableCell className="text-right p-8">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(uni)}
                          className="h-11 w-11 text-primary hover:bg-primary/10 rounded-2xl border border-border"
                          title="Edit university"
                        >
                          <Edit className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(uni)
                          }}
                          className="relative z-50 pointer-events-auto h-11 w-11 text-red-400 hover:bg-red-500/10 rounded-2xl border border-border"
                          title="Deactivate university"
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
        <DialogContent className="w-[92vw] max-w-xl max-h-[85vh] overflow-y-auto overflow-x-hidden bg-card border-border text-foreground rounded-[2rem] p-0 shadow-2xl custom-scrollbar">
          <div className="p-6 bg-muted/20 border-b border-border">
            <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tight">
              {editingUni ? "Edit University" : "Add University"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-1">
              All changes sync directly to Supabase
            </DialogDescription>
          </div>

          <form onSubmit={handleSave} className="w-full p-6 space-y-6 overflow-x-hidden">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Official Name *
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Daffodil International University"
                className="h-14 bg-background border-input rounded-2xl font-bold"
                required
              />
            </div>

            {/* Short Name + Slug */}
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Short Name *
                </Label>
                <Input
                  value={form.short_name}
                  onChange={(e) =>
                    setForm({ ...form, short_name: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. DIU"
                  className="h-14 bg-background border-input rounded-2xl font-bold uppercase"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Slug
                </Label>
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    setForm({ ...form, slug: e.target.value.toLowerCase() })
                  }
                  placeholder="e.g. diu"
                  className="h-14 bg-background border-input rounded-2xl font-bold"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Logo Configuration
              </Label>
              <div className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl border border-border bg-muted/20 p-6">
                <div className="w-16 h-16 rounded-2xl bg-background border border-border flex items-center justify-center overflow-hidden shrink-0">
                  {form.logo_url ? (
                    <img
                      src={form.logo_url}
                      className="w-16 h-16 object-contain"
                      alt={form.short_name || form.name || "University logo"}
                    />
                  ) : (
                    <span className="font-black text-primary text-xl uppercase">
                      {(form.short_name || form.name || "UN").slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="w-full max-w-full flex-1 space-y-3 overflow-hidden">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="h-12 bg-background border-input rounded-2xl font-bold cursor-pointer w-full file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2 file:text-[10px] file:font-black file:text-primary-foreground"
                  />
                  <p className="block max-w-full truncate overflow-hidden text-[10px] font-bold text-muted-foreground">
                    {form.logo_url || "No logo uploaded yet"}
                  </p>
                </div>
                {uploadingLogo && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center justify-between p-6 bg-muted/20 rounded-2xl border border-border">
                <div>
                  <p className="font-black text-foreground uppercase text-[10px] tracking-widest">
                    Active Status
                  </p>
                  <p className="text-[8px] text-muted-foreground mt-0.5">Visible on platform</p>
                </div>
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) => setForm({ ...form, active: v })}
                />
              </div>
              <div className="flex items-center justify-between p-6 bg-muted/20 rounded-2xl border border-border">
                <div>
                  <p className="font-black text-foreground uppercase text-[10px] tracking-widest">
                    Access Lock
                  </p>
                  <p className="text-[8px] text-muted-foreground mt-0.5">Coming Soon mode</p>
                </div>
                <Switch
                  checked={form.locked}
                  onCheckedChange={(v) => setForm({ ...form, locked: v })}
                />
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={saving || uploadingLogo}
              className="w-full max-w-full h-14 bg-primary text-primary-foreground font-black rounded-2xl text-lg shadow-2xl shadow-primary/30"
            >
              {saving || uploadingLogo ? (
                <Loader2 className="animate-spin w-6 h-6" />
              ) : editingUni ? (
                "Save Changes"
              ) : (
                "Add University"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
