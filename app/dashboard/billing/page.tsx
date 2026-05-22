"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Crown,
  Loader2,
  AlertCircle,
  ArrowRight,
  Calendar,
  BookOpen,
  Building2,
  GraduationCap,
  Clock,
  Terminal,
  CreditCard,
  Target,
  Users,
  Settings,
  Sparkles
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const ICON_MAP: Record<string, any> = {
  Zap,
  BookOpen,
  Target,
  Crown,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Building2,
  GraduationCap
}

export default function BillingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [isSavingBatch, setIsSavingBatch] = useState(false)
  
  const [profile, setProfile] = useState<any>(null)
  const [batches, setBatches] = useState<any[]>([])
  const [semesters, setSemesters] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [dbPlans, setDbPlans] = useState<any[]>([])

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [selectedSemId, setSelectedSemId] = useState<string | null>(null)

  const [promoCode, setPromoCode] = useState("")
  const [discount, setDiscount] = useState(0)

  useEffect(() => {
    fetchProfileAndData()
  }, [])

  useEffect(() => {
    console.log("BATCH_SELECTED_UPDATE:", selectedBatchId)
  }, [selectedBatchId])

  const [resolvedUni, setResolvedUni] = useState<any>(null)
  const [resolvedDept, setResolvedDept] = useState<any>(null)
  const [resolvedBatch, setResolvedBatch] = useState<any>(null)

  const applyProfileBatch = (batchId: string | null, batchFromDb?: any) => {
    setSelectedBatchId(batchId)
    setProfile((prev: any) => prev ? { ...prev, batch_id: batchId } : prev)

    const batchFromList = batches.find((batch) => batch.id === batchId)
    setResolvedBatch(batchFromList || batchFromDb || null)
  }

  const refetchProfileBatch = async (profileId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        batch_id,
        batch:academic_batches (
          batch_number
        )
      `)
      .eq('id', profileId)
      .single()

    if (error) throw error

    applyProfileBatch(data.batch_id, data.batch)
    console.log("PROFILE_BATCH_REFETCHED:", data)
    return data.batch_id as string | null
  }

  const persistSelectedBatch = async (batchId: string) => {
    if (!profile?.id) throw new Error("Profile is not loaded yet.")

    const { error } = await supabase
      .from('profiles')
      .update({ batch_id: batchId })
      .eq('id', profile.id)

    if (error) throw error

    const persistedBatchId = await refetchProfileBatch(profile.id)
    if (persistedBatchId !== batchId) {
      throw new Error(`Batch save verification failed. Expected ${batchId}, received ${persistedBatchId || 'empty'}.`)
    }

    return persistedBatchId
  }

  const fetchProfileAndData = async () => {
    setLoading(true)
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr) console.error("AUTH_ERROR:", authErr)
      if (!user) {
        console.error("NO_USER_FOUND")
        return
      }

      // 1. Efficient Relational Fetch (JOIN)
      const { data: joinedData, error: joinErr } = await supabase
        .from('profiles')
        .select(`
          id,
          university_id,
          department_id,
          batch_id,
          university:universities (
            name,
            short_name
          ),
          department:departments (
            name,
            short_name
          ),
          batch:academic_batches (
            batch_number
          )
        `)
        .eq('id', user.id)
        .single()

      if (joinErr || !joinedData) {
        console.error("JOIN_FETCH_ERROR:", JSON.stringify(joinErr, null, 2))
        throw new Error("Could not load your academic profile.")
      }

      console.log("JOINED_PROFILE_DATA:", joinedData)
      
      setProfile(joinedData as any)
      setResolvedUni(joinedData.university)
      setResolvedDept(joinedData.department)
      setResolvedBatch(joinedData.batch)

      // Dynamic Batch & Plan Fetching
      const batchQuery = supabase
        .from('academic_batches')
        .select('id, batch_number, university, department, active')
        .eq('university', joinedData.university?.short_name)
        .eq('department', joinedData.department?.short_name)
        .eq('active', true)
        .order('batch_number', { ascending: true })

      const semQuery = supabase
        .from('semesters')
        .select('*')
        .eq('university_id', joinedData.university_id)
        .eq('status', 'active')

      const plansQuery = supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true })

      const [batchRes, semRes, plansRes] = await Promise.all([
        batchQuery,
        semQuery,
        plansQuery
      ])

      console.log("DEBUG_PLANS_COUNT:", plansRes.data?.length)
      console.log("DEBUG_PLANS_RAW:", plansRes.data)
      if (plansRes.error) {
        console.error("PLANS_FETCH_ERROR_JSON:", JSON.stringify(plansRes.error, null, 2))
      }

      setBatches(batchRes.data || [])
      setSemesters(semRes.data || [])
      setDbPlans(plansRes.data || [])
      
      const currentSem = semRes.data?.find(s => s.is_current)
      if (currentSem) setSelectedSemId(currentSem.id)

      // Pre-select current batch if it exists
      applyProfileBatch(joinedData.batch_id, joinedData.batch)

      console.log("BILLING_INIT_DATA_LOADED:", {
        profile: joinedData,
        batches: batchRes.data?.length,
        plans: plansRes.data?.length
      })
      setLoading(false)
    } catch (e: any) {
      console.error("CRITICAL_FETCH_ERROR:", e)
      toast.error(e.message)
      setLoading(false)
    }
  }

  const selectedBatch = batches.find((batch) => batch.id === selectedBatchId) || resolvedBatch

  const handleBatchSelect = async (batchId: string) => {
    setSelectedBatchId(batchId)
    const nextBatch = batches.find((batch) => batch.id === batchId)
    if (nextBatch) setResolvedBatch(nextBatch)
    setProfile((prev: any) => prev ? { ...prev, batch_id: batchId } : prev)

    setIsSavingBatch(true)
    try {
      const persistedBatchId = await persistSelectedBatch(batchId)
      console.log("PROFILE_BATCH_SAVED:", { batch_id: persistedBatchId })
    } catch (e: any) {
      console.error("PROFILE_BATCH_SAVE_ERROR:", {
        message: e?.message,
        details: e?.details,
        hint: e?.hint,
        code: e?.code,
        raw: e,
      })
      toast.error("Failed to save selected batch: " + (e?.message || "Unknown error"))
    } finally {
      setIsSavingBatch(false)
    }
  }

  useEffect(() => {
    if (!profile?.id) return

    const refreshLatestBatch = () => {
      refetchProfileBatch(profile.id).catch((e: any) => {
        console.error("PROFILE_BATCH_BACK_NAV_REFETCH_ERROR:", {
          message: e?.message,
          details: e?.details,
          hint: e?.hint,
          code: e?.code,
          raw: e,
        })
      })
    }

    window.addEventListener("focus", refreshLatestBatch)
    window.addEventListener("pageshow", refreshLatestBatch)

    return () => {
      window.removeEventListener("focus", refreshLatestBatch)
      window.removeEventListener("pageshow", refreshLatestBatch)
    }
  }, [profile?.id, batches])



  const fetchCourses = async (batchId: string, semId: string) => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .match({ batch_id: batchId, semester_id: semId })
    setCourses(data || [])
  }

  useEffect(() => {
    if (selectedBatchId && selectedSemId && selectedPlanId) {
      const plan = dbPlans.find(p => p.id === selectedPlanId)
      if (plan?.type === 'course') {
        fetchCourses(selectedBatchId, selectedSemId)
      }
    }
  }, [selectedBatchId, selectedSemId, selectedPlanId, dbPlans])

  const handleApplyPromo = async () => {
    if (!promoCode) return
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('active', true)
        .maybeSingle()

      if (error || !data) {
        setDiscount(0)
        toast.error("Invalid promo code.")
        return
      }

      // 1. Expiry Check
      if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
        setDiscount(0)
        toast.error("This promo code has expired.")
        return
      }

      // 2. Usage Limit Check
      if (data.usage_limit && data.used_count >= data.usage_limit) {
        setDiscount(0)
        toast.error("This promo code has reached its usage limit.")
        return
      }

      // Store promo metadata for price calculation
      setPromoData(data)
      toast.success(`Promo applied! ${data.discount_type === 'percentage' ? data.discount_value + '%' : '৳' + data.discount_value} discount.`)
    } catch (e) {
      toast.error("Failed to validate promo code.")
    }
  }

  const [promoData, setPromoData] = useState<any>(null)

  const getPrice = () => {
    const plan = dbPlans.find(p => p.id === selectedPlanId)
    const basePrice = plan?.price || 0
    let discountAmount = 0
    
    if (promoData) {
      if (promoData.discount_type === 'percentage') {
        discountAmount = basePrice * (promoData.discount_value / 100)
      } else {
        discountAmount = promoData.discount_value
      }
    }

    return {
      subtotal: basePrice,
      discount: discountAmount,
      total: Math.max(0, basePrice - discountAmount)
    }
  }

  const handleSubscribe = async () => {
    if (!selectedBatchId || !selectedPlanId || !profile?.id) {
      toast.error("Please select a batch and plan before payment.")
      return
    }

    console.log("BILLING_SUBMITTING_SUBSCRIPTION:", {
      userId: profile.id,
      selectedBatchId,
      selectedPlanId,
      selectedSemId
    })

    setIsSavingBatch(true)
    try {
      // 1. Mandatory DB persistence before payment navigation.
      const persistedBatchId = await persistSelectedBatch(selectedBatchId)
      if (!persistedBatchId) throw new Error("Selected batch was not persisted.")

      // 2. Prepare Redirect to Payment
      const selectedSem = semesters.find(s => s.id === selectedSemId)
      const selectedPlan = dbPlans.find(p => p.id === selectedPlanId)
      const pricing = getPrice()

      const params = new URLSearchParams({
        plan: selectedPlanId,
        plan_id: selectedPlanId,
        batch_id: persistedBatchId,
        university_id: profile.university_id,
        department_id: profile.department_id,
        semester_id: selectedSemId || "",
        semester: selectedSem?.name || "",
        semester_name: selectedSem?.name || "",
        amount: pricing.total.toString(),
        subscription_type: selectedPlan?.type || 'batch',
        phase: selectedPlan?.phase || 'full',
        course_id: selectedCourseId || "",
        promo_code: discount > 0 ? promoCode : ""
      })
      router.push(`/dashboard/payment/manual?${params.toString()}`)
    } catch (e: any) {
      console.error("SUBSCRIPTION_INIT_ERROR:", e)
      toast.error("Could not initialize payment: " + (e.message || "Unknown error"))
    } finally {
      setIsSavingBatch(false)
    }
  }

  if (loading) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <p className="text-slate-500 font-bold italic">Loading subscription context...</p>
    </div>
  )

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  }

  const pricing = getPrice()

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-10 px-4 pb-40 dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-indigo-900/10 dark:via-slate-950 dark:to-slate-950 bg-gradient-to-b from-slate-50 to-indigo-50/30 min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-center justify-between dark:bg-white/5 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border dark:border-white/10 border-slate-200 shadow-xl shadow-indigo-100/20 dark:shadow-none gap-6"
      >
        <div className="flex items-center gap-4 md:gap-6">
           <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border border-white/20 shadow-lg shadow-indigo-500/20 flex-shrink-0">
              <Building2 className="w-7 h-7 md:w-8 md:h-8 text-white" />
           </div>
           <div>
              <h1 className="text-xl md:text-2xl font-black dark:text-white text-slate-900 tracking-tight leading-tight">
                 {resolvedUni?.short_name || resolvedUni?.name} • {resolvedDept?.name} • Batch {selectedBatch?.batch_number || selectedBatch?.batch}
              </h1>
              <p className="text-indigo-600 dark:text-indigo-400 font-bold uppercase text-[9px] md:text-[10px] tracking-widest mt-1 flex items-center gap-2">
                 <Building2 className="w-3 h-3 md:w-4 md:h-4" /> {resolvedUni?.name}
              </p>
           </div>
        </div>

      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 pt-4"
      >
         <div className="lg:col-span-2 space-y-8">
            {/* Batch Selection Card (Merged) */}
            <Card className="dark:bg-slate-900/40 bg-white/50 dark:border-white/10 border-slate-200 rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center gap-4">
                 <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
                    <Users className="w-6 h-6" />
                 </div>
                 <div>
                    <h4 className="text-lg font-black dark:text-white text-slate-900 tracking-tight uppercase">Confirm Your Batch</h4>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Please verify your cohort before proceeding to payment.</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Select Cohort (Batch)</label>
                    <div className="relative">
                      <select 
                        value={selectedBatchId || ""} 
                        onChange={(e) => handleBatchSelect(e.target.value)}
                        className="w-full h-14 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-white/10 rounded-2xl px-5 font-bold text-slate-700 dark:text-white outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm"
                      >
                        <option value="" disabled>Choose your batch</option>
                        {batches.map(batch => (
                          <option key={batch.id} value={batch.id}>
                            Batch {batch.batch_number || batch.batch}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Settings className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                 </div>
                 
                 {selectedBatchId && (
                   <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="pb-3 px-2">
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black text-[10px] uppercase h-8 px-4 rounded-full flex items-center gap-2">
                         <CheckCircle2 className="w-3 h-3" /> Batch Verified
                      </Badge>
                   </motion.div>
                 )}
              </div>
            </Card>

            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] dark:text-slate-500 text-slate-400 flex items-center gap-4 px-2">
               <div className="h-1 w-8 bg-indigo-500 rounded-full" /> Plan Selection
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
                   {loading ? (
                     // Skeleton Loader
                     [1, 2, 3, 4].map((i) => (
                       <div key={i} className="h-64 rounded-[2.5rem] bg-slate-200 dark:bg-white/5 animate-pulse" />
                     ))
                   ) : dbPlans.length > 0 ? (
                     dbPlans.map((plan) => {
                       const Icon = ICON_MAP[plan.icon_name || 'Zap'] || Zap
                       return (
                         <motion.button
                            variants={itemVariants}
                            whileHover={{ scale: 1.03, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            key={plan.id}
                            onClick={() => setSelectedPlanId(plan.id)}
                            className={cn(
                              "p-8 rounded-[2.5rem] border-2 transition-all duration-500 text-left relative overflow-hidden group shadow-xl",
                              selectedPlanId === plan.id 
                                ? "bg-white dark:border-transparent border-indigo-500 text-slate-950 ring-4 ring-indigo-500/10" 
                                : "dark:bg-slate-900/60 bg-white dark:border-white/5 border-slate-200 dark:text-white text-slate-900 hover:border-slate-300"
                            )}
                            style={selectedPlanId === plan.id ? (plan.is_premium ? {
                              boxShadow: '0 20px 40px -15px rgba(234, 179, 8, 0.4)',
                              borderColor: '#eab308',
                              backgroundColor: '#FFF7ED'
                            } : {
                               borderColor: '#6366f1',
                            }) : {}}
                         >
                            <div className={cn("absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r opacity-0 group-hover:opacity-100", plan.gradient_class || 'from-indigo-500 to-purple-600')} />
                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-6">
                                 <div className={cn("p-4 rounded-2xl shadow-sm", plan.icon_bg_class || 'bg-indigo-500/10 text-indigo-600')}>
                                    <Icon className="w-7 h-7" />
                                 </div>
                                 {plan.tag_text && (
                                   <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "font-black uppercase text-[10px] tracking-widest px-3 py-1.5 transition-all duration-500 rounded-lg shadow-sm", 
                                      selectedPlanId === plan.id 
                                        ? "border-indigo-500/20 bg-indigo-500/10 text-indigo-600" 
                                        : "dark:border-white/10 border-slate-200 dark:bg-white/5 bg-slate-50 dark:text-slate-400 text-slate-500 group-hover:text-slate-900",
                                      plan.tag_text === 'Recommended' && "animate-pulse border-yellow-500/50 text-yellow-600 bg-yellow-500/5"
                                    )}
                                   >
                                      {plan.tag_text}
                                   </Badge>
                                 )}
                              </div>
                              <h4 className="text-2xl font-black tracking-tight flex items-center gap-2">
                                {plan.name}
                                {plan.is_premium && <Sparkles className="w-5 h-5 text-yellow-500" />}
                              </h4>
                              <p className={cn("text-sm font-medium mt-2 leading-relaxed transition-colors pr-4", selectedPlanId === plan.id ? "text-slate-600" : "dark:text-slate-400 text-slate-500")}>{plan.description}</p>
                              <div className="mt-8 flex items-baseline gap-2">
                                 <span className="text-3xl font-black">৳{plan.price}</span>
                                 <span className={cn("text-[10px] font-bold uppercase tracking-widest opacity-50", selectedPlanId === plan.id ? "text-slate-600" : "dark:text-slate-400 text-slate-500")}>One Time</span>
                              </div>
                            </div>
                            {selectedPlanId === plan.id && (
                              <motion.div 
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute bottom-8 right-8"
                              >
                                <div className={cn("p-2 rounded-full", plan.is_premium ? "bg-yellow-500 text-white" : "bg-indigo-600 text-white")}>
                                  <CheckCircle2 className="w-5 h-5" />
                                </div>
                              </motion.div>
                            )}
                         </motion.button>
                       )
                     })
                   ) : (
                     <div className="col-span-full py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
                           <AlertCircle className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-bold italic">No subscription plans available currently.</p>
                     </div>
                   )}
                </div>

                {selectedPlanId === 'course' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pt-10 border-t dark:border-white/5 border-slate-200 px-2">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.4em] dark:text-slate-500 text-slate-400">Choose Course</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {courses.map(course => (
                          <motion.button 
                            key={course.id} 
                            onClick={() => setSelectedCourseId(course.id)} 
                            className={cn(
                              "p-5 rounded-2xl border-2 text-left font-black uppercase text-xs shadow-sm", 
                              selectedCourseId === course.id ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "dark:bg-slate-900/80 bg-white border-slate-200"
                            )}
                          >
                             {course.course_name}
                          </motion.button>
                        ))}
                     </div>
                  </motion.div>
                )}
             </div>

             <motion.div variants={itemVariants} className="space-y-8 px-2">
                <Card className="dark:bg-white/5 bg-white dark:border-white/10 border-slate-200 rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl sticky top-8">
                   <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
                   <CardHeader className="p-8 md:p-10 border-b dark:border-white/5 border-slate-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
                      <CardTitle className="text-[10px] font-black uppercase tracking-[0.4em] dark:text-slate-400 text-slate-500">Checkout Summary</CardTitle>
                   </CardHeader>
                   <CardContent className="p-8 md:p-10 space-y-8">
                      <div className="space-y-5">
                         <div className="flex justify-between items-center text-[13px] gap-4">
                            <span className="dark:text-slate-400 text-slate-500 font-bold shrink-0">University</span>
                            <span className="dark:text-white text-slate-900 font-black uppercase text-right">
                               {resolvedUni?.name}
                            </span>
                         </div>
                         <div className="flex justify-between items-center text-[13px] gap-4">
                            <span className="dark:text-slate-400 text-slate-500 font-bold shrink-0">Department</span>
                            <span className="dark:text-white text-slate-900 font-black uppercase text-right">
                               {resolvedDept?.name}
                            </span>
                         </div>
                         <div className="flex justify-between items-center text-[13px] gap-4">
                            <span className="dark:text-slate-400 text-slate-500 font-bold shrink-0">Batch</span>
                            <span className="dark:text-white text-slate-900 font-black">
                               {selectedBatch?.batch_number || selectedBatch?.batch || 'None'}
                            </span>
                         </div>
                         <div className="flex justify-between items-center text-[13px] gap-4">
                            <span className="dark:text-slate-400 text-slate-500 font-bold shrink-0">Plan</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-black uppercase text-right">
                               {dbPlans.find(p => p.id === selectedPlanId)?.name}
                            </span>
                         </div>
                      </div>

                      <div className="pt-6 border-t dark:border-white/10 border-slate-100 space-y-4">
                         <p className="text-[10px] font-black uppercase tracking-widest dark:text-slate-500 text-slate-400">Promo Code</p>
                         <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value)}
                              placeholder="SAVE10"
                              className="flex-1 bg-slate-50 dark:bg-white/5 border dark:border-white/10 border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                            <Button onClick={handleApplyPromo} className="h-10 px-4 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase">Apply</Button>
                         </div>
                      </div>
                      
                      <div className="pt-8 border-t dark:border-white/10 border-slate-100 space-y-3">
                         <div className="flex justify-between text-xs font-bold text-slate-500">
                            <span>Subtotal</span>
                            <span>৳{pricing.subtotal}</span>
                         </div>
                         {discount > 0 && (
                           <div className="flex justify-between text-xs font-bold text-emerald-500">
                              <span>Discount</span>
                              <span>-৳{pricing.discount}</span>
                           </div>
                         )}
                         <div className="flex justify-between items-end pt-2">
                            <div>
                              <span className="dark:text-slate-400 text-slate-500 font-black uppercase text-[9px] tracking-[0.3em] block mb-2">Total Amount</span>
                              <motion.h2 key={pricing.total} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-black dark:text-white text-slate-900 flex items-baseline gap-1">
                                <span className="text-xl md:text-2xl text-indigo-600">৳</span>{pricing.total}
                              </motion.h2>
                            </div>
                            <div className="p-3.5 dark:bg-white/5 bg-emerald-50 rounded-2xl border dark:border-white/10 border-emerald-100 shadow-sm">
                              <ShieldCheck className="w-6 h-6 text-emerald-600" />
                            </div>
                         </div>
                      </div>
                   </CardContent>
                   <CardFooter className="p-8 md:p-10 pt-0">
                      <Button 
                        className="w-full h-16 rounded-2xl font-black text-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-xl transition-all text-white group disabled:opacity-50 disabled:grayscale"
                        onClick={handleSubscribe}
                        disabled={!selectedPlanId || !selectedBatchId || isSavingBatch || (selectedPlanId === 'course' && !selectedCourseId)}
                      >
                        {isSavingBatch ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <>
                            Confirm & Pay <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>
                    </CardFooter>
                 </Card>
              </motion.div>
         </motion.div>
      </div>
    )
}
