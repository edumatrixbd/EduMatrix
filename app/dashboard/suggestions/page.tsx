"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Lightbulb, 
  Search, 
  BookOpen, 
  Loader2, 
  AlertCircle, 
  ShieldCheck,
  Clock,
  ChevronRight,
  Sparkles,
  Zap,
  Info
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getLatestSubscriptionAccess } from "@/lib/paid-access"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"
import Link from "next/link"
import { ReportMistakeButton } from "@/components/report-mistake-button"

interface Suggestion {
  id: string
  title: string
  description: string
  course_id: string
  priority: string
  study_tips: string
  courses: {
    course_name: string
    course_code: string
  }
}

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [hasPendingPayment, setHasPendingPayment] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Fetch latest subscription (source of truth)
      const { subscription: latestSub, hasAccess: subActive, isPending: subPending } = await getLatestSubscriptionAccess(supabase, user.id)

      setHasSubscription(subActive)
      setHasPendingPayment(subPending)

      if (!subActive) {
        setLoading(false)
        return
      }

      console.log("access status:", "active")
      setHasSubscription(true)
      setHasPendingPayment(false)

      // 2. Build Filter
      const subs = latestSub ? [latestSub] : []
      const allowedBatchIds = subs.filter(s => s.subscription_type === 'batch').map(s => s.batch_id)
      const allowedCourseIds = subs.filter(s => s.subscription_type === 'course').map(s => s.course_id)

      // 3. Fetch Suggestions
      let query = supabase
        .from('exam_suggestions')
        .select('*, courses(course_name, course_code)')
        .eq('status', 'active')

      // Apply filtering logic
      // We want suggestions where (course_id in allowedCourseIds) OR (batch_id in allowedBatchIds)
      // Supabase or logic: .or('course_id.in.(...),batch_id.in.(...)')
      
      const filterParts = []
      if (allowedCourseIds.length > 0) filterParts.push(`course_id.in.(${allowedCourseIds.map(id => `"${id}"`).join(',')})`)
      if (allowedBatchIds.length > 0) filterParts.push(`batch_id.in.(${allowedBatchIds.map(id => `"${id}"`).join(',')})`)

      if (filterParts.length > 0) {
        query = query.or(filterParts.join(','))
      } else {
        // If they have no course/batch IDs (maybe just a 'day' pass?)
        // Let's assume day pass gives access to everything? 
        // Requirement says match course_id/batch_id. 
        // If they have a day pass, maybe we should allow all suggestions in their department?
        // For now, stick to the requirement.
      }

      const { data: suggestionData, error } = await query
      if (error) throw error
      setSuggestions(suggestionData || [])

    } catch (error) {
      console.error("Error fetching suggestions:", error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = suggestions.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.courses?.course_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20'
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
    }
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-orange-500/20 border border-primary/20">
            <Lightbulb className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground">Exam Suggestions</h1>
            <p className="text-muted-foreground text-sm font-medium">Data-driven blueprints for your upcoming exams</p>
          </div>
        </div>
        {hasSubscription && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Premium Access Active</span>
          </div>
        )}
      </motion.div>

      {!hasSubscription && !loading ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative group overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/50 backdrop-blur-xl p-12 text-center flex flex-col items-center gap-6"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
          <div className="relative z-10">
            <div className="w-20 h-20 rounded-full bg-slate-950 flex items-center justify-center border border-white/10 mx-auto mb-6 shadow-2xl">
              {hasPendingPayment ? <Clock className="w-10 h-10 text-primary" /> : <Zap className="w-10 h-10 text-primary" />}
            </div>
            <h2 className="text-2xl font-black text-white mb-2">
              {hasPendingPayment ? "Payment Submitted" : "Subscribe to View Suggestions"}
            </h2>
            <p className="text-slate-500 max-w-md mx-auto font-medium">
              {hasPendingPayment
                ? "Payment Submitted — Waiting for Admin Approval. Your access will be activated once our team verifies the transaction."
                : "Exam suggestions and strategic blueprints are exclusively available to subscribed students. Get the competitive edge now."}
            </p>
            {!hasPendingPayment && (
              <Link href="/dashboard/billing" className="mt-8 block">
                <Button className="bg-primary hover:bg-primary/90 text-white font-black px-10 h-14 rounded-2xl shadow-2xl shadow-primary/20">
                  Unlock Premium Access
                </Button>
              </Link>
            )}
          </div>
        </motion.div>
      ) : (
        <>
          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-primary/5 blur-xl group-focus-within:bg-primary/10 transition-all rounded-3xl" />
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input 
                placeholder="Search suggestions by topic or course..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 bg-slate-900/30 border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:border-primary/50 transition-all" 
              />
            </div>
          </motion.div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-64 rounded-[2rem] bg-slate-900/50 border border-white/5 animate-pulse" />
              ))
            ) : filtered.length === 0 ? (
              <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                 <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-white/5">
                   <Info className="w-8 h-8 text-slate-700" />
                 </div>
                 <p className="text-slate-500 font-bold italic">No suggestions found for your current courses.</p>
              </div>
            ) : (
              <AnimatePresence>
                {filtered.map((s, idx) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 bg-slate-900/40 border-white/5 backdrop-blur-xl rounded-[2rem] overflow-hidden flex flex-col h-full border-t border-t-white/10">
                      <CardHeader className="p-8 pb-4">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <Badge className={`font-black text-[9px] uppercase tracking-tighter ${getPriorityColor(s.priority)}`}>
                            {s.priority} Priority
                          </Badge>
                          <Sparkles className="w-5 h-5 text-primary/40 group-hover:text-primary transition-colors" />
                        </div>
                        <CardTitle className="text-xl font-black text-white leading-tight line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors">
                          {s.title}
                        </CardTitle>
                        <CardDescription className="font-bold text-primary/80 uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
                           <BookOpen className="w-3 h-3" />
                           {s.courses?.course_code} • {s.courses?.course_name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-8 pt-0 flex flex-col gap-6 flex-1">
                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed flex-1">
                          {s.description}
                        </p>
                        <Button 
                          onClick={() => setSelectedSuggestion(s)}
                          className="w-full bg-white/5 hover:bg-primary hover:text-white border border-white/5 text-slate-400 font-black uppercase text-[10px] tracking-widest h-12 rounded-2xl transition-all"
                        >
                          View Blueprint
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </>
      )}

      {/* Details Modal */}
      <Dialog open={!!selectedSuggestion} onOpenChange={(o) => !o && setSelectedSuggestion(null)}>
        <DialogContent className="max-w-2xl bg-slate-950 border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-3xl shadow-primary/5">
          {selectedSuggestion && (
            <div className="flex flex-col h-full max-h-[90vh]">
               <div className="p-8 bg-gradient-to-br from-primary/10 via-slate-900 to-slate-950 border-b border-white/5">
                  <div className="flex items-center gap-3 mb-6">
                    <Badge className={`font-black text-[9px] uppercase tracking-tighter ${getPriorityColor(selectedSuggestion.priority)}`}>
                      {selectedSuggestion.priority} Priority
                    </Badge>
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                       {selectedSuggestion.courses?.course_code}
                    </span>
                  </div>
                  <DialogTitle className="text-3xl font-black text-white leading-tight mb-2">
                    {selectedSuggestion.title}
                  </DialogTitle>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">
                    {selectedSuggestion.description}
                  </p>
               </div>
               <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                       <Zap className="w-5 h-5" />
                       <h3 className="font-black uppercase text-xs tracking-widest">Strategic Study Plan</h3>
                    </div>
                    <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl text-slate-300 text-sm font-medium leading-relaxed whitespace-pre-wrap">
                      {selectedSuggestion.study_tips || "No study tips provided for this blueprint."}
                    </div>
                  </section>

                  <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl flex items-start gap-4">
                    <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <p className="text-[11px] text-primary/80 font-bold leading-relaxed italic">
                      This suggestion is a data-driven blueprint based on historical patterns. Ensure you cover all syllabus topics for comprehensive preparation.
                    </p>
                  </div>
               </div>
               <div className="p-8 border-t border-white/5 flex justify-between items-center">
                  <ReportMistakeButton 
                    materialType="suggestion"
                    materialId={selectedSuggestion.id}
                    materialTitle={selectedSuggestion.title}
                    variant="ghost"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#FF3B30] hover:bg-[#FF3B30]/10"
                  />
                  <Button onClick={() => setSelectedSuggestion(null)} className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest">
                    Got it
                  </Button>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
