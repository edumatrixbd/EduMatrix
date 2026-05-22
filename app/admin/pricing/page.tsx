"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  DollarSign, 
  Percent, 
  Tag, 
  Sparkles, 
  Plus, 
  Edit3, 
  Trash2, 
  Settings, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Ticket,
  Loader2,
  BookOpen,
  Briefcase,
  Layers,
  ArrowRight,
  Database,
  Info
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
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { format } from "date-fns"

export default function PricingPage() {
  const supabase = createClient()
  const [isSuper, setIsSuper] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Table checks
  const [missingTables, setMissingTables] = useState<string[]>([])
  
  // DB Data
  const [courses, setCourses] = useState<any[]>([])
  const [coursePricing, setCoursePricing] = useState<any[]>([])
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([])
  const [offers, setOffers] = useState<any[]>([])
  const [promoCodes, setPromoCodes] = useState<any[]>([])

  // Offline mock fallbacks in case SQL migrations are not run yet
  const [coursePricingMock, setCoursePricingMock] = useState<any[]>([
    { id: "mock-cp-1", course_id: "cse-101", regular_price: 600.00, sale_price: 499.00, discount_percent: 17, active: true },
    { id: "mock-cp-2", course_id: "cse-201", regular_price: 1000.00, sale_price: 799.00, discount_percent: 20, active: true }
  ])
  const [plansMock, setPlansMock] = useState<any[]>([
    { id: "mock-sp-1", name: "24h Instant Access", type: "day", price: 50.00, duration: "1 Day", features: ["Full access to all batch content", "Active for 24 hours only", "Includes Mid and Final preps"], status: "active" },
    { id: "mock-sp-2", name: "Single Course - Complete Semester", type: "course", price: 450.00, duration: "1 Semester", features: ["Unlimited access to selected course", "Study notes and HLS video streaming", "Verified certificates"], status: "active" },
    { id: "mock-sp-3", name: "Complete Semester Batch Pass", type: "batch", price: 2500.00, duration: "1 Semester", features: ["Complete pass for all courses in batch", "Premium priority student support", "Exclusive downloadable notes"], status: "active" }
  ])
  const [offersMock, setOffersMock] = useState<any[]>([
    { id: "mock-of-1", title: "Eid Mubarak Mega Offer", discount_type: "percent", discount_value: 20, start_date: "2026-05-15T00:00:00Z", end_date: "2026-05-30T00:00:00Z", active: true }
  ])
  const [promoCodesMock, setPromoCodesMock] = useState<any[]>([
    { id: "mock-pc-1", code: "UNIHUB50", discount_type: "percentage", discount_value: 50, expiry_date: "2026-06-30T00:00:00Z", usage_limit: 500, used_count: 82, status: "active" },
    { id: "mock-pc-2", code: "FLAT100", discount_type: "fixed", discount_value: 100, expiry_date: "2026-06-15T00:00:00Z", usage_limit: 200, used_count: 14, status: "active" }
  ])

  // Modals & Forms states
  const [activeTab, setActiveTab] = useState("course-pricing")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)

  // Sub-forms state management
  const [coursePricingForm, setCoursePricingForm] = useState({
    course_id: "",
    regular_price: "",
    sale_price: "",
    discount_percent: "",
    active: true
  })

  const [planForm, setPlanForm] = useState({
    name: "",
    type: "course",
    price: "",
    duration: "",
    featuresString: "",
    status: "active"
  })

  const [offerForm, setOfferForm] = useState({
    title: "",
    discount_type: "percent",
    discount_value: "",
    start_date: "",
    end_date: "",
    active: true
  })

  const [promoForm, setPromoForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    expiry_date: "",
    usage_limit: "",
    status: "active"
  })

  // Role authentication checking
  const checkRoleAndFetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = "/admin/login"
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profile && (profile.role === "super_admin" || profile.role === "superadmin")) {
        setIsSuper(true)
        await fetchData()
      } else {
        toast.error("Access Denied: Super Admin permissions required.")
        window.location.href = "/admin"
      }
    } catch (error) {
      console.error("Access check error:", error)
      window.location.href = "/admin"
    }
  }, [supabase])

  useEffect(() => {
    checkRoleAndFetchData()
  }, [checkRoleAndFetchData])

  // Central Database Fetching
  const fetchData = async () => {
    setLoading(true)
    const missed: string[] = []

    // 1. Fetch courses (highly essential)
    const { data: courseData } = await supabase
      .from("courses")
      .select("id, course_name, course_code, university, department")
      .order("course_name")
    setCourses(courseData || [])

    // 2. Fetch Course Pricing
    try {
      const { data, error } = await supabase.from("course_pricing").select("*")
      if (error) throw error
      setCoursePricing(data || [])
    } catch (e) {
      missed.push("course_pricing")
    }

    // 3. Fetch Subscription Plans
    try {
      const { data, error } = await supabase.from("subscription_plans").select("*")
      if (error) throw error
      setSubscriptionPlans(data || [])
    } catch (e) {
      missed.push("subscription_plans")
    }

    // 4. Fetch Offers
    try {
      const { data, error } = await supabase.from("offers").select("*")
      if (error) throw error
      setOffers(data || [])
    } catch (e) {
      missed.push("offers")
    }

    // 5. Fetch Promo Codes
    try {
      const { data, error } = await supabase.from("promo_codes").select("*")
      if (error) throw error
      setPromoCodes(data || [])
    } catch (e) {
      missed.push("promo_codes")
    }

    setMissingTables(missed)
    setLoading(false)
  }

  // Calculate discount percentage helper
  const handleCalcDiscount = (regStr: string, saleStr: string, setFormState: Function) => {
    const reg = parseFloat(regStr)
    const sale = parseFloat(saleStr)
    if (reg > 0 && sale > 0 && reg >= sale) {
      const pct = Math.round(((reg - sale) / reg) * 100)
      setFormState((prev: any) => ({ ...prev, discount_percent: pct.toString() }))
    }
  }

  // Save Operations
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const isOffline = missingTables.includes(activeTab.replace('-', '_'))

    try {
      if (activeTab === "course-pricing") {
        if (!coursePricingForm.course_id || !coursePricingForm.regular_price || !coursePricingForm.sale_price) {
          throw new Error("Please complete all required fields.")
        }
        const payload = {
          course_id: coursePricingForm.course_id,
          regular_price: parseFloat(coursePricingForm.regular_price),
          sale_price: parseFloat(coursePricingForm.sale_price),
          discount_percent: parseInt(coursePricingForm.discount_percent) || 0,
          active: coursePricingForm.active
        }

        if (isOffline) {
          // offline mockup state update
          if (editingItem) {
            setCoursePricingMock(prev => prev.map(p => p.id === editingItem.id ? { ...p, ...payload } : p))
            toast.success("Offline Course Price updated successfully.")
          } else {
            setCoursePricingMock(prev => [...prev, { id: 'mock-' + Date.now(), ...payload }])
            toast.success("Offline Course Price configured successfully.")
          }
        } else {
          // db insert/update
          let error
          if (editingItem) {
            const { error: err } = await supabase.from("course_pricing").update(payload).eq("id", editingItem.id)
            error = err
          } else {
            const { error: err } = await supabase.from("course_pricing").insert(payload)
            error = err
          }
          if (error) throw error
          toast.success("Course Price configured successfully.")
        }
      }

      else if (activeTab === "subscription-plans") {
        if (!planForm.name || !planForm.price || !planForm.duration) {
          throw new Error("Please complete plan title, price, and duration.")
        }
        const features = planForm.featuresString.split('\n').map(f => f.trim()).filter(Boolean)
        const payload = {
          name: planForm.name,
          type: planForm.type,
          price: parseFloat(planForm.price),
          duration: planForm.duration,
          features,
          status: planForm.status,
          phase: "full" // standard default
        }

        if (isOffline) {
          if (editingItem) {
            setPlansMock(prev => prev.map(p => p.id === editingItem.id ? { ...p, ...payload } : p))
            toast.success("Offline Subscription Plan updated successfully.")
          } else {
            setPlansMock(prev => [...prev, { id: 'mock-' + Date.now(), ...payload }])
            toast.success("Offline Subscription Plan added successfully.")
          }
        } else {
          let error
          if (editingItem) {
            const { error: err } = await supabase.from("subscription_plans").update(payload).eq("id", editingItem.id)
            error = err
          } else {
            const { error: err } = await supabase.from("subscription_plans").insert(payload)
            error = err
          }
          if (error) throw error
          toast.success("Subscription Plan configured successfully.")
        }
      }

      else if (activeTab === "offers") {
        if (!offerForm.title || !offerForm.discount_value) {
          throw new Error("Please complete the offer title and discount.")
        }
        const payload = {
          title: offerForm.title,
          discount_type: offerForm.discount_type,
          discount_value: parseFloat(offerForm.discount_value),
          start_date: offerForm.start_date || null,
          end_date: offerForm.end_date || null,
          active: offerForm.active
        }

        if (isOffline) {
          if (editingItem) {
            setOffersMock(prev => prev.map(p => p.id === editingItem.id ? { ...p, ...payload } : p))
            toast.success("Offline Campaign Offer updated successfully.")
          } else {
            setOffersMock(prev => [...prev, { id: 'mock-' + Date.now(), ...payload }])
            toast.success("Offline Campaign Offer added successfully.")
          }
        } else {
          let error
          if (editingItem) {
            const { error: err } = await supabase.from("offers").update(payload).eq("id", editingItem.id)
            error = err
          } else {
            const { error: err } = await supabase.from("offers").insert(payload)
            error = err
          }
          if (error) throw error
          toast.success("Campaign Offer configured successfully.")
        }
      }

      else if (activeTab === "promo-codes") {
        if (!promoForm.code || !promoForm.discount_value) {
          throw new Error("Please specify the unique code and discount.")
        }
        const payload = {
          code: promoForm.code.trim().toUpperCase(),
          discount_type: promoForm.discount_type,
          discount_value: parseFloat(promoForm.discount_value),
          expiry_date: promoForm.expiry_date || null,
          usage_limit: promoForm.usage_limit ? parseInt(promoForm.usage_limit) : null,
          status: promoForm.status
        }

        if (isOffline) {
          if (editingItem) {
            setPromoCodesMock(prev => prev.map(p => p.id === editingItem.id ? { ...p, ...payload } : p))
            toast.success("Offline Promo Code updated successfully.")
          } else {
            setPromoCodesMock(prev => [...prev, { id: 'mock-' + Date.now(), ...payload }])
            toast.success("Offline Promo Code added successfully.")
          }
        } else {
          let error
          if (editingItem) {
            const { error: err } = await supabase.from("promo_codes").update(payload).eq("id", editingItem.id)
            error = err
          } else {
            const { error: err } = await supabase.from("promo_codes").insert(payload)
            error = err
          }
          if (error) throw error
          toast.success("Promo Code configured successfully.")
        }
      }

      setDialogOpen(false)
      setEditingItem(null)
      await fetchData()
    } catch (e: any) {
      console.error("Save failure:", e)
      toast.error(e.message || "Failed to configure pricing options.")
    } finally {
      setSaving(false)
    }
  }

  // Delete Operations
  const handleDelete = async (item: any) => {
    if (!confirm("Are you absolutely sure you want to delete this pricing metadata? This action cannot be undone.")) return

    const key = activeTab.replace('-', '_')
    const isOffline = missingTables.includes(key)

    try {
      if (isOffline) {
        if (activeTab === "course-pricing") setCoursePricingMock(prev => prev.filter(p => p.id !== item.id))
        else if (activeTab === "subscription-plans") setPlansMock(prev => prev.filter(p => p.id !== item.id))
        else if (activeTab === "offers") setOffersMock(prev => prev.filter(p => p.id !== item.id))
        else if (activeTab === "promo-codes") setPromoCodesMock(prev => prev.filter(p => p.id !== item.id))
        toast.success("Simulated metadata removed successfully.")
      } else {
        const { error } = await supabase.from(key).delete().eq("id", item.id)
        if (error) throw error
        toast.success("Pricing record deleted successfully.")
        await fetchData()
      }
    } catch (e: any) {
      console.error("Delete failed:", e)
      toast.error("Failed to delete the pricing option.")
    }
  }

  // Edit triggers
  const triggerEdit = (item: any) => {
    setEditingItem(item)
    if (activeTab === "course-pricing") {
      setCoursePricingForm({
        course_id: item.course_id,
        regular_price: item.regular_price.toString(),
        sale_price: item.sale_price.toString(),
        discount_percent: item.discount_percent.toString(),
        active: !!item.active
      })
    } else if (activeTab === "subscription-plans") {
      setPlanForm({
        name: item.name,
        type: item.type || "course",
        price: item.price.toString(),
        duration: item.duration || "",
        featuresString: (item.features || []).join('\n'),
        status: item.status || "active"
      })
    } else if (activeTab === "offers") {
      setOfferForm({
        title: item.title,
        discount_type: item.discount_type || "percent",
        discount_value: item.discount_value.toString(),
        start_date: item.start_date ? format(new Date(item.start_date), "yyyy-MM-dd'T'HH:mm") : "",
        end_date: item.end_date ? format(new Date(item.end_date), "yyyy-MM-dd'T'HH:mm") : "",
        active: !!item.active
      })
    } else if (activeTab === "promo-codes") {
      setPromoForm({
        code: item.code,
        discount_type: item.discount_type || "percentage",
        discount_value: item.discount_value.toString(),
        expiry_date: item.expiry_date ? format(new Date(item.expiry_date), "yyyy-MM-dd'T'HH:mm") : "",
        usage_limit: item.usage_limit ? item.usage_limit.toString() : "",
        status: item.status || "active"
      })
    }
    setDialogOpen(true)
  }

  // Add triggers
  const triggerAdd = () => {
    setEditingItem(null)
    if (activeTab === "course-pricing") {
      setCoursePricingForm({ course_id: "", regular_price: "", sale_price: "", discount_percent: "0", active: true })
    } else if (activeTab === "subscription-plans") {
      setPlanForm({ name: "", type: "course", price: "", duration: "", featuresString: "", status: "active" })
    } else if (activeTab === "offers") {
      setOfferForm({ title: "", discount_type: "percent", discount_value: "", start_date: "", end_date: "", active: true })
    } else if (activeTab === "promo-codes") {
      setPromoForm({ code: "", discount_type: "percentage", discount_value: "", expiry_date: "", usage_limit: "", status: "active" })
    }
    setDialogOpen(true)
  }

  if (loading && coursePricing.length === 0 && coursePricingMock.length > 0 && courses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-primary" />
            Superadmin Pricing Panel
          </h1>
          <p className="text-muted-foreground mt-1">Configure DB-driven course tiers, customizable subscription plans, active promo codes, and special marketing offers.</p>
        </div>
        <Button onClick={triggerAdd} className="bg-primary hover:bg-primary/95 text-white font-bold gap-2 shadow-lg">
          <Plus className="w-5 h-5" />
          Create New Configuration
        </Button>
      </div>

      {/* SQL Migration Warnings Banner */}
      {missingTables.length > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/10 text-amber-900 dark:text-amber-100 rounded-xl overflow-hidden shadow-inner">
          <CardContent className="p-5 flex items-start gap-4">
            <ShieldAlert className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-bold text-sm">Database Schema Pricing Upgrades Pending!</h3>
              <p className="text-xs text-muted-foreground max-w-4xl">
                The new database-driven pricing system requires specific tables in Supabase. We detected that the table <span className="font-black underline text-amber-600 dark:text-amber-300">"{missingTables.join(', ')}"</span> is missing from your public schema. 
                Please copy and run the SQL instructions located in <code className="p-1 bg-amber-500/20 rounded font-black text-[11px] text-amber-800 dark:text-amber-200">scripts/080_pricing_tables.sql</code> directly inside your Supabase SQL Editor to enable real-time writes. 
                <br />
                <span className="font-black text-amber-500 mt-1 inline-block">🚀 Admin Mode Fallback: Showing offline-simulated mock options so you can fully interact with the UI.</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-xl w-full max-w-2xl grid grid-cols-4 gap-1">
          <TabsTrigger value="course-pricing" className="rounded-lg font-bold text-xs gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="subscription-plans" className="rounded-lg font-bold text-xs gap-1.5">
            <Briefcase className="w-3.5 h-3.5" />
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="offers" className="rounded-lg font-bold text-xs gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Offers
          </TabsTrigger>
          <TabsTrigger value="promo-codes" className="rounded-lg font-bold text-xs gap-1.5">
            <Ticket className="w-3.5 h-3.5" />
            Promos
          </TabsTrigger>
        </TabsList>

        {/* 1. Course Pricing Tab Content */}
        <TabsContent value="course-pricing">
          <Card className="border-border bg-card shadow-xl overflow-hidden">
            <CardHeader className="p-6 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-500" />
                    Interactive Course Pricing
                  </CardTitle>
                  <CardDescription>Configure course-specific pricing, sale discounts, and live checkout statuses.</CardDescription>
                </div>
                {missingTables.includes("course_pricing") && <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Offline Simulation</Badge>}
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border">
                    <TableHead>Course Identity</TableHead>
                    <TableHead>University & Dept</TableHead>
                    <TableHead>Regular Price</TableHead>
                    <TableHead>Sale Price</TableHead>
                    <TableHead>Discount Value</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right p-5">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {((missingTables.includes("course_pricing") ? coursePricingMock : coursePricing).length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-20 text-muted-foreground font-bold">
                        No course pricing configured. Click "Create New Configuration" to add one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (missingTables.includes("course_pricing") ? coursePricingMock : coursePricing).map((item) => {
                      const matchedCourse = courses.find(c => c.id === item.course_id);
                      return (
                        <TableRow key={item.id} className="hover:bg-muted/30 border-border">
                          <TableCell className="py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground text-sm">{matchedCourse?.course_name || item.course_id || "Unlinked Course"}</span>
                              <span className="text-xs font-black uppercase text-indigo-500">{matchedCourse?.course_code || "MOCK-CODE"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-muted-foreground uppercase">
                            {matchedCourse ? `${matchedCourse.university} • ${matchedCourse.department}` : "DIU • CSE"}
                          </TableCell>
                          <TableCell className="font-semibold text-muted-foreground text-sm">৳{item.regular_price}</TableCell>
                          <TableCell className="font-black text-emerald-500 text-sm">৳{item.sale_price}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black">
                              <Percent className="w-3 h-3 mr-0.5" />
                              {item.discount_percent}% OFF
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.active ? "default" : "outline"} className={item.active ? "bg-primary text-white" : ""}>
                              {item.active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right p-5">
                            <div className="flex items-center justify-end gap-2">
                              <Button onClick={() => triggerEdit(item)} variant="ghost" size="sm" className="h-9 hover:bg-muted text-emerald-500">
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button onClick={() => handleDelete(item)} variant="ghost" size="sm" className="h-9 hover:bg-rose-500/10 text-rose-500">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Subscription Plans Tab Content */}
        <TabsContent value="subscription-plans">
          <Card className="border-border bg-card shadow-xl overflow-hidden">
            <CardHeader className="p-6 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-500" />
                    Subscription Plan Configurations
                  </CardTitle>
                  <CardDescription>Define flexible packages based on access duration (monthly, semester pass, 24h instant view).</CardDescription>
                </div>
                {missingTables.includes("subscription_plans") && <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Offline Simulation</Badge>}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {((missingTables.includes("subscription_plans") ? plansMock : subscriptionPlans).length === 0) ? (
                  <div className="col-span-3 text-center py-20 text-muted-foreground font-bold">
                    No active packages constructed yet.
                  </div>
                ) : (
                  (missingTables.includes("subscription_plans") ? plansMock : subscriptionPlans).map((item) => (
                    <Card key={item.id} className="relative border-border bg-muted/30 hover:shadow-lg transition overflow-hidden">
                      <CardContent className="p-6 space-y-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 capitalize font-black text-[10px] tracking-widest">{item.type || "Tier"}</Badge>
                            <h3 className="text-base font-black mt-2 text-foreground">{item.name}</h3>
                          </div>
                          <Badge variant={item.status === "active" ? "default" : "outline"} className={item.status === "active" ? "bg-primary text-white" : ""}>
                            {item.status === "active" ? "Active" : "Disabled"}
                          </Badge>
                        </div>

                        <div className="flex items-baseline gap-1 bg-background p-4 rounded-xl shadow-inner justify-center">
                          <span className="text-2xl font-black text-foreground">৳{item.price}</span>
                          <span className="text-xs font-bold text-muted-foreground">/ {item.duration}</span>
                        </div>

                        {/* Features display */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Included Features</p>
                          <ul className="space-y-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                            {(item.features || []).map((feature: string, idx: number) => (
                              <li key={idx} className="flex items-center gap-2">
                                <ArrowRight className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Actions wrapper */}
                        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                          <Button onClick={() => triggerEdit(item)} variant="outline" size="sm" className="gap-1 font-bold h-9">
                            <Edit3 className="w-3.5 h-3.5 text-emerald-500" /> Edit
                          </Button>
                          <Button onClick={() => handleDelete(item)} variant="outline" size="sm" className="gap-1 font-bold h-9 text-rose-500 hover:bg-rose-500/10 border-border">
                            <Trash2 className="w-3.5 h-3.5" /> Strip Plan
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Campaign Offers Tab Content */}
        <TabsContent value="offers">
          <Card className="border-border bg-card shadow-xl overflow-hidden">
            <CardHeader className="p-6 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    Global Campaign & Discount Offers
                  </CardTitle>
                  <CardDescription>Configure marketing campaigns, flat or percentage sales, and active checkout notifications.</CardDescription>
                </div>
                {missingTables.includes("offers") && <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Offline Simulation</Badge>}
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border">
                    <TableHead>Campaign Details</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Discount Value</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right p-5">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {((missingTables.includes("offers") ? offersMock : offers).length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-20 text-muted-foreground font-bold">
                        No active campaigns configured. Click "Create New Configuration" to add one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (missingTables.includes("offers") ? offersMock : offers).map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30 border-border">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="font-bold text-foreground text-sm">{item.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize font-semibold text-xs text-muted-foreground">{item.discount_type}</TableCell>
                        <TableCell className="font-black text-sm text-indigo-500">
                          {item.discount_type === "percent" ? `${item.discount_value}% OFF` : `৳${item.discount_value} FLAT`}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">
                          {item.start_date ? format(new Date(item.start_date), "MMM dd, yyyy • HH:mm") : "Immediate"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">
                          {item.end_date ? format(new Date(item.end_date), "MMM dd, yyyy • HH:mm") : "Ongoing"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.active ? "default" : "outline"} className={item.active ? "bg-primary text-white" : ""}>
                            {item.active ? "Live" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right p-5">
                          <div className="flex items-center justify-end gap-2">
                            <Button onClick={() => triggerEdit(item)} variant="ghost" size="sm" className="h-9 hover:bg-muted text-emerald-500">
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => handleDelete(item)} variant="ghost" size="sm" className="h-9 hover:bg-rose-500/10 text-rose-500">
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
        </TabsContent>

        {/* 4. Promo Codes Tab Content */}
        <TabsContent value="promo-codes">
          <Card className="border-border bg-card shadow-xl overflow-hidden">
            <CardHeader className="p-6 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-indigo-500" />
                    Student Promo Codes
                  </CardTitle>
                  <CardDescription>Distribute promotional discount codes with expiration and custom usage limits.</CardDescription>
                </div>
                {missingTables.includes("promo_codes") && <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Offline Simulation</Badge>}
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border">
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Usage Limit</TableHead>
                    <TableHead>Used Count</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right p-5">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {((missingTables.includes("promo_codes") ? promoCodesMock : promoCodes).length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-20 text-muted-foreground font-bold">
                        No promo codes constructed yet. Click "Create New Configuration" to add one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (missingTables.includes("promo_codes") ? promoCodesMock : promoCodes).map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30 border-border">
                        <TableCell className="py-4">
                          <code className="p-2 bg-indigo-500/10 text-indigo-600 rounded-lg font-black text-xs uppercase shadow-sm tracking-widest">{item.code}</code>
                        </TableCell>
                        <TableCell className="capitalize font-semibold text-xs text-muted-foreground">{item.discount_type}</TableCell>
                        <TableCell className="font-black text-sm text-indigo-500">
                          {item.discount_type === "percentage" ? `${item.discount_value}% OFF` : `৳${item.discount_value} FLAT`}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">
                          {item.expiry_date ? format(new Date(item.expiry_date), "MMM dd, yyyy") : "Lifetime"}
                        </TableCell>
                        <TableCell className="text-xs text-foreground font-black">{item.usage_limit || "Unlimited"}</TableCell>
                        <TableCell className="text-xs text-indigo-500 font-black">{item.used_count || 0} times</TableCell>
                        <TableCell>
                          <Badge variant={item.status === "active" ? "default" : "outline"} className={item.status === "active" ? "bg-primary text-white" : ""}>
                            {item.status === "active" ? "Active" : "Expired"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right p-5">
                          <div className="flex items-center justify-end gap-2">
                            <Button onClick={() => triggerEdit(item)} variant="ghost" size="sm" className="h-9 hover:bg-muted text-emerald-500">
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => handleDelete(item)} variant="ghost" size="sm" className="h-9 hover:bg-rose-500/10 text-rose-500">
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
        </TabsContent>
      </Tabs>

      {/* Dialog config modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border border-border text-foreground rounded-2xl p-0 overflow-hidden shadow-2xl max-w-lg">
          <DialogHeader className="p-6 border-b border-border bg-slate-50 dark:bg-slate-900/50">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              {editingItem ? `Modify ${activeTab.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}` : `Add New ${activeTab.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}`}
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
              Ensure DB compliance and values validation before save
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            
            {/* 1. Course Pricing Forms */}
            {activeTab === "course-pricing" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Select Course *</Label>
                  <Select 
                    value={coursePricingForm.course_id} 
                    onValueChange={val => setCoursePricingForm(prev => ({ ...prev, course_id: val }))}
                    disabled={!!editingItem}
                  >
                    <SelectTrigger className="h-10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-xl font-medium">
                      <SelectValue placeholder="Select course..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border rounded-xl">
                      {courses.map(c => (
                        <SelectItem key={c.id} value={c.id} className="font-bold">{c.course_name} ({c.course_code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Regular Price (৳) *</Label>
                    <Input 
                      type="number"
                      value={coursePricingForm.regular_price}
                      onChange={e => {
                        const val = e.target.value
                        setCoursePricingForm(prev => ({ ...prev, regular_price: val }))
                        handleCalcDiscount(val, coursePricingForm.sale_price, setCoursePricingForm)
                      }}
                      className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Sale Price (৳) *</Label>
                    <Input 
                      type="number"
                      value={coursePricingForm.sale_price}
                      onChange={e => {
                        const val = e.target.value
                        setCoursePricingForm(prev => ({ ...prev, sale_price: val }))
                        handleCalcDiscount(coursePricingForm.regular_price, val, setCoursePricingForm)
                      }}
                      className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-black text-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Calculated Discount Percent (%)</Label>
                  <Input 
                    type="number"
                    value={coursePricingForm.discount_percent}
                    readOnly
                    className="bg-muted text-muted-foreground border border-border rounded-xl font-black"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border shadow-inner">
                  <div>
                    <p className="font-black text-foreground uppercase text-[10px] tracking-widest">Active Status</p>
                    <p className="text-[8px] text-muted-foreground mt-0.5">Toggle status of this pricing layout in courses page</p>
                  </div>
                  <Switch 
                    checked={coursePricingForm.active} 
                    onCheckedChange={v => setCoursePricingForm(prev => ({ ...prev, active: v }))} 
                  />
                </div>
              </div>
            )}

            {/* 2. Subscription Plans Forms */}
            {activeTab === "subscription-plans" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Plan Name *</Label>
                  <Input 
                    placeholder="e.g. Complete Semester Batch Pass"
                    value={planForm.name}
                    onChange={e => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Plan Type *</Label>
                    <Select value={planForm.type} onValueChange={val => setPlanForm(prev => ({ ...prev, type: val }))}>
                      <SelectTrigger className="h-10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border rounded-xl font-bold">
                        <SelectItem value="day">24h Pass</SelectItem>
                        <SelectItem value="course">Course tier</SelectItem>
                        <SelectItem value="batch">Batch Pass</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Price (৳) *</Label>
                    <Input 
                      type="number"
                      value={planForm.price}
                      onChange={e => setPlanForm(prev => ({ ...prev, price: e.target.value }))}
                      className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Plan Duration *</Label>
                  <Input 
                    placeholder="e.g. 1 Semester, 24 Hours, 1 Month"
                    value={planForm.duration}
                    onChange={e => setPlanForm(prev => ({ ...prev, duration: e.target.value }))}
                    className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Features (one per line) *</Label>
                  <Textarea 
                    placeholder="Unlimited course streaming&#10;Study notes access&#10;Instructor forum support"
                    value={planForm.featuresString}
                    onChange={e => setPlanForm(prev => ({ ...prev, featuresString: e.target.value }))}
                    className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl min-h-[100px]"
                    required
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border shadow-inner">
                  <div>
                    <p className="font-black text-foreground uppercase text-[10px] tracking-widest">Active Status</p>
                    <p className="text-[8px] text-muted-foreground mt-0.5">Control checkout accessibility of this plan</p>
                  </div>
                  <Switch 
                    checked={planForm.status === "active"} 
                    onCheckedChange={v => setPlanForm(prev => ({ ...prev, status: v ? "active" : "inactive" }))} 
                  />
                </div>
              </div>
            )}

            {/* 3. Offers Forms */}
            {activeTab === "offers" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Offer Title *</Label>
                  <Input 
                    placeholder="e.g. Midterm Preparation discount"
                    value={offerForm.title}
                    onChange={e => setOfferForm(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Discount Type *</Label>
                    <Select value={offerForm.discount_type} onValueChange={val => setOfferForm(prev => ({ ...prev, discount_type: val }))}>
                      <SelectTrigger className="h-10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border rounded-xl font-bold">
                        <SelectItem value="percent">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Flat Price (৳)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Discount Value *</Label>
                    <Input 
                      type="number"
                      value={offerForm.discount_value}
                      onChange={e => setOfferForm(prev => ({ ...prev, discount_value: e.target.value }))}
                      className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Start Date & Time</Label>
                    <Input 
                      type="datetime-local"
                      value={offerForm.start_date}
                      onChange={e => setOfferForm(prev => ({ ...prev, start_date: e.target.value }))}
                      className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">End Date & Time</Label>
                    <Input 
                      type="datetime-local"
                      value={offerForm.end_date}
                      onChange={e => setOfferForm(prev => ({ ...prev, end_date: e.target.value }))}
                      className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border shadow-inner">
                  <div>
                    <p className="font-black text-foreground uppercase text-[10px] tracking-widest">Active Campaign Status</p>
                    <p className="text-[8px] text-muted-foreground mt-0.5">Toggle visual promotional badges on landing page</p>
                  </div>
                  <Switch 
                    checked={offerForm.active} 
                    onCheckedChange={v => setOfferForm(prev => ({ ...prev, active: v }))} 
                  />
                </div>
              </div>
            )}

            {/* 4. Promo Codes Forms */}
            {activeTab === "promo-codes" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Unique Promo Code *</Label>
                  <Input 
                    placeholder="e.g. WELCOME10, MEGA50"
                    value={promoForm.code}
                    onChange={e => setPromoForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-black uppercase tracking-wider"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Discount Type *</Label>
                    <Select value={promoForm.discount_type} onValueChange={val => setPromoForm(prev => ({ ...prev, discount_type: val }))}>
                      <SelectTrigger className="h-10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border rounded-xl font-bold">
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Flat Price (৳)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Discount Value *</Label>
                    <Input 
                      type="number"
                      value={promoForm.discount_value}
                      onChange={e => setPromoForm(prev => ({ ...prev, discount_value: e.target.value }))}
                      className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Expiry Date</Label>
                    <Input 
                      type="datetime-local"
                      value={promoForm.expiry_date}
                      onChange={e => setPromoForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                      className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Max Usage Limit</Label>
                    <Input 
                      type="number"
                      placeholder="e.g. 500 usages"
                      value={promoForm.usage_limit}
                      onChange={e => setPromoForm(prev => ({ ...prev, usage_limit: e.target.value }))}
                      className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border shadow-inner">
                  <div>
                    <p className="font-black text-foreground uppercase text-[10px] tracking-widest">Active Code Status</p>
                    <p className="text-[8px] text-muted-foreground mt-0.5">Toggle checkout acceptance of this promo code</p>
                  </div>
                  <Switch 
                    checked={promoForm.status === "active"} 
                    onCheckedChange={v => setPromoForm(prev => ({ ...prev, status: v ? "active" : "inactive" }))} 
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/95 text-white font-bold gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingItem ? "Update Configuration" : "Deploy Configuration"}
              </Button>
            </div>

          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
