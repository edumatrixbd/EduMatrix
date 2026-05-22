"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  GraduationCap, 
  ChevronRight, 
  Check, 
  Loader2, 
  Lock, 
  X,
  BookOpen,
  Users,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

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

export default function UniversityOnboarding() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Data
  const [universities, setUniversities] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])

  // Selection
  const [selectedUni, setSelectedUni] = useState<any>(null)
  const [selectedDeptId, setSelectedDeptId] = useState("")
  const [selectedBatchId, setSelectedBatchId] = useState("")
  
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) {
          reportSupabaseError("ONBOARDING_AUTH_USER_ERROR", userError)
          router.push("/login")
          return
        }
        if (!user) {
          router.push("/login")
          return
        }
        setUser(user)

        const { data: uniData, error: uniError } = await supabase
          .from('universities')
          .select('id, name, short_name, logo_url, active, locked')
          .eq('active', true)
          .order('locked', { ascending: true }) // Unlocked (false) first
          .order('name')
        
        if (uniError) {
          reportSupabaseError("ONBOARDING_UNIVERSITIES_FETCH_ERROR", uniError)
        }

        console.log("ONBOARDING_RAW_UNI_DATA:", uniData)
        setUniversities(uniData || [])
      } catch (error) {
        console.error("Onboarding init exception:", error)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    console.log("ONBOARDING_BATCHES_STATE_UPDATE:", batches)
  }, [batches])

  const handleUniSelect = async (uni: any) => {
    setSelectedUni(uni)
    setLoading(true)
    try {
      // Only fetch Departments initially
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('id, name, short_name, university_id, active')
        .eq('university_id', uni.id)
        .eq('active', true)
        .order('name')
      
      if (deptError) throw deptError
      
      setDepartments(deptData || [])
      setBatches([]) // Reset batches
      setSelectedDeptId("") // Reset selection
      setSelectedBatchId("")
      setShowPopup(true)
    } catch (error: any) {
      reportSupabaseError("ONBOARDING_DEPARTMENTS_FETCH_ERROR", error)
    } finally {
      setLoading(false)
    }
  }

  // Reactive Batch Fetching
  useEffect(() => {
    async function fetchBatches() {
      if (!selectedUni?.short_name || !selectedDeptId) return
      
      const selectedDept = departments.find((d) => d.id === selectedDeptId)
      if (!selectedDept?.short_name) return
      
      console.log("FETCHING_BATCHES_FOR:", {
        university: selectedUni.short_name,
        department: selectedDept.short_name,
      })
      
      try {
        const { data, error } = await supabase
          .from('academic_batches')
          .select('id, batch_number, university, department, active')
          .eq('university', selectedUni.short_name)
          .eq('department', selectedDept.short_name)
          .eq('active', true)
          .order('batch_number')
        
        if (error) throw error
        setBatches(data || [])
      } catch (error: any) {
        reportSupabaseError("ONBOARDING_BATCHES_FETCH_ERROR", error)
      }
    }

    fetchBatches()
  }, [departments, selectedDeptId, selectedUni])

  const handleCompleteOnboarding = async () => {
    if (!selectedUni || !selectedDeptId || !selectedBatchId) {
      toast.error("Please select all institutional details.")
      return
    }
    
    setIsSaving(true)
    try {
      // 1. Verify session FIRST to ensure RLS allows lookups
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        reportSupabaseError("ONBOARDING_SESSION_ERROR", sessionError)
        router.push("/login")
        return
      }
      const userId = session?.user?.id || user?.id

      if (!userId) {
        toast.error("Authentication session lost. Please login again.")
        router.push("/login")
        return
      }

      // 2. Dynamic ID Resolution (No hardcoded fallbacks)
      const finalUniId = selectedUni.id
      const finalDeptId = selectedDeptId
      const finalBatchId = selectedBatchId

      // 3. CRITICAL STOP CHECK: Ensure we have REAL UUIDs
      const isUuid = (id: string) => id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      
      console.log("DIAGNOSTIC_BEFORE_SAVE:", {
        university: finalUniId,
        department: finalDeptId,
        batch: finalBatchId,
        isUniValid: isUuid(finalUniId),
        isDeptValid: isUuid(finalDeptId),
        isBatchValid: isUuid(finalBatchId)
      })

      if (!isUuid(finalUniId) || !isUuid(finalDeptId) || !isUuid(finalBatchId)) {
        console.error("DYNAMIC_ONBOARDING_INVALID_IDS:", { finalUniId, finalDeptId, finalBatchId })
        throw new Error("Institutional assignment failed. Please select your university, department, and batch again.")
      }

      // 4. Perform the update
      console.log("EXECUTING_PROFILE_UPDATE_FOR:", userId)
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          university_id: finalUniId,
          department_id: finalDeptId,
          batch_id: finalBatchId,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateErr) {
        reportSupabaseError("ONBOARDING_PROFILE_UPDATE_ERROR", updateErr)
        throw new Error(`Database error: ${updateErr.message}`)
      }

      // 5. POST-SAVE VERIFICATION
      const { data: savedProfile, error: verifyErr } = await supabase
        .from('profiles')
        .select('university_id, department_id, batch_id')
        .eq('id', userId)
        .maybeSingle()

      console.log("POST_SAVE_VERIFICATION_RESULT:", savedProfile)
      
      if (verifyErr || !savedProfile) {
        if (verifyErr) reportSupabaseError("ONBOARDING_PROFILE_VERIFY_ERROR", verifyErr)
        if (!savedProfile) toast.error("ONBOARDING_PROFILE_VERIFY_ERROR: Saved profile was not returned.")
      } else if (!savedProfile.university_id || !savedProfile.department_id) {
        console.error("SAVE_VERIFICATION_FAILURE: Records still null after update!", savedProfile)
        throw new Error("Data persistence failed. Your selections were not saved. Please try again.")
      }
      
      toast.success("Profile fully initialized!")
      setTimeout(() => {
        router.replace("/dashboard?onboarding=success")
        router.refresh()
      }, 1500)
    } catch (err: any) {
      console.error("ONBOARDING_CRITICAL_FAILURE:", err)
      toast.error(err.message || "An unexpected error occurred.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white flex flex-col items-center pt-24 pb-12 px-6">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-2xl font-bold text-slate-400 uppercase tracking-[0.2em]">Select your university to get started.</h1>
        </div>

        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 place-items-center"
        >
          {loading ? (
            <div className="col-span-full py-20 flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-slate-500 font-bold animate-pulse">Loading institutions...</p>
            </div>
          ) : universities.length === 0 ? (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-900 border border-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-10 h-10 text-slate-700" />
              </div>
              <h2 className="text-2xl font-bold text-white">No institutions found</h2>
              <p className="text-slate-500 max-w-sm mx-auto">
                We couldn't find any registered universities in our database. Please contact support to add your institution.
              </p>
            </div>
          ) : (
            universities.map((uni) => {
              const isSelected = selectedUni?.id === uni.id;
              const isLocked = uni.locked === true;

              return (
                <motion.div
                  key={uni.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 }
                  }}
                  whileHover={!isLocked ? { scale: 1.02, translateY: -5 } : {}}
                  whileTap={!isLocked ? { scale: 0.98 } : {}}
                  className={cn(
                    "w-[290px] h-[270px] rounded-[18px] border transition-all duration-500 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-[#111525] border-[#2a3040] shadow-xl",
                    !isLocked ? "cursor-pointer hover:border-primary/50" : "cursor-not-allowed opacity-60 grayscale-[0.5]",
                    isSelected && "border-primary bg-primary/10 shadow-[0_0_40px_rgba(255,176,15,0.15)] ring-1 ring-primary/50"
                  )}
                  onClick={() => !isLocked && handleUniSelect(uni)}
                >
                  {/* Lock Overlay */}
                  {isLocked && (
                    <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                       <Badge className="bg-slate-800 text-slate-300 border-none font-black text-[8px] uppercase tracking-tighter flex items-center gap-1.5 px-2.5 py-1">
                          <Lock className="w-3 h-3" />
                          Coming Soon
                       </Badge>
                    </div>
                  )}

                  {/* Logo Box */}
                  <div className="w-[80px] h-[80px] rounded-[24px] bg-[#0B0F1A] border border-[#2a3040] flex items-center justify-center mb-5 overflow-hidden shadow-inner transition-all duration-300 relative z-10 group-hover:scale-105">
                    {uni.logo_url ? (
                      <img 
                        src={uni.logo_url} 
                        alt={uni.name}
                        className="w-16 h-16 object-contain relative z-20"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.parentElement?.querySelector('.logo-fallback') as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'flex';
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center text-xl font-black text-slate-400 uppercase tracking-tighter">
                        {uni.short_name || uni.name.slice(0, 2)}
                      </div>
                    )}
                    
                    {/* Error Fallback (Hidden by default) */}
                    <div 
                      className="logo-fallback absolute inset-0 hidden items-center justify-center text-xl font-black text-slate-400 bg-slate-900/50 uppercase tracking-tighter"
                    >
                      {uni.short_name || uni.name.slice(0, 2)}
                    </div>
                  </div>

                  <h3 className="font-bold text-lg leading-tight transition-colors z-10 text-white">
                    {uni.name}
                  </h3>

                  {isLocked && (
                    <Badge className="mt-3 bg-slate-800 text-slate-400 border-none text-[10px] uppercase font-black tracking-widest px-2 py-0.5">
                      Coming Soon
                    </Badge>
                  )}
                </motion.div>
              )
            })
          )}
        </motion.div>

        {/* Centered Next Step Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => selectedUni && setShowPopup(true)}
            disabled={!selectedUni}
            className="h-12 px-10 bg-[#FFB00F] hover:bg-[#FFB00F]/90 text-slate-950 font-black rounded-xl text-lg flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            Next Step
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* POPUP MODAL */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowPopup(false)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-[#151B2B] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Academic Details</h2>
                  <button onClick={() => setShowPopup(false)} className="p-2 rounded-full hover:bg-white/5 text-slate-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Department Select */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">1. Select Department</label>
                    <Select onValueChange={setSelectedDeptId} value={selectedDeptId}>
                      <SelectTrigger className="w-full h-12 bg-[#0B0F1A] border-slate-800 rounded-xl font-bold text-white">
                        <SelectValue placeholder="Choose Department" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#151B2B] border-slate-800 text-white">
                        {departments.length > 0 ? (
                          departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id} className="font-bold">
                              {dept.name} ({dept.short_name})
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-4 text-xs text-slate-500 text-center italic">No departments found.</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Batch Select */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">2. Select Your Batch</label>
                    <Select onValueChange={setSelectedBatchId} value={selectedBatchId}>
                      <SelectTrigger className="w-full h-12 bg-[#0B0F1A] border-slate-800 rounded-xl font-bold text-white">
                        <SelectValue placeholder="Choose Batch" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#151B2B] border-slate-800 text-white">
                        {batches.length > 0 ? (
                          batches.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id} className="font-bold">
                              Batch {batch.batch_number}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-4 text-xs text-slate-500 text-center italic">No batches found.</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  size="lg"
                  disabled={!selectedDeptId || !selectedBatchId || isSaving}
                  onClick={handleCompleteOnboarding}
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-slate-950 font-black rounded-xl text-lg mt-4 shadow-xl shadow-primary/20"
                >
                  {isSaving ? <Loader2 className="w-6 h-6 animate-spin text-slate-950" /> : "Complete Onboarding"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
