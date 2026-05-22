"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { BookOpen, Users, Loader2, ArrowLeft, Check, Sparkles } from "lucide-react"

const departments = [
  { id: "cse", name: "Computer Science and Engineering (CSE)" },
]

const batches = [68, 69, 70, 71, 72].map(b => ({
  id: String(b),
  name: `Batch ${b}`
}))

export default function DetailsOnboarding() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    department: "",
    batch: ""
  })

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      setUser(user)
    }
    checkUser()
  }, [])

  const handleComplete = async () => {
    if (!formData.department || !formData.batch || !user) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('student_profiles')
        .update({
          department: formData.department,
          batch: formData.batch,
          onboarding_completed: true
        })
        .eq('id', user.id)

      if (error) throw error
      
      router.push("/dashboard?welcome=true")
      router.refresh()
    } catch (err) {
      console.error("Error saving details:", err)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-primary/20 relative overflow-hidden flex flex-col items-center justify-center p-6">
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
      
      <div className="w-full max-w-xl relative z-10 py-12">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 mb-8"
          >
            <BookOpen className="w-10 h-10 text-primary" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold tracking-tight"
          >
            Almost there!
          </motion.h1>
          <p className="text-slate-400 mt-4 text-xl">Tell us about your current academic status.</p>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
          <CardContent className="space-y-8 p-0">
            <div className="space-y-4">
              <Label className="text-base font-bold flex items-center gap-2 text-slate-300">
                Select Department
              </Label>
              <Select 
                value={formData.department} 
                onValueChange={(v) => setFormData({ ...formData, department: v })}
              >
                <SelectTrigger className="h-16 bg-black/20 border-white/10 rounded-2xl focus:ring-primary/20 text-lg text-white">
                  <SelectValue placeholder="Choose your department" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-bold flex items-center gap-2 text-slate-300">
                Select Batch
              </Label>
              <Select 
                value={formData.batch} 
                onValueChange={(v) => setFormData({ ...formData, batch: v })}
              >
                <SelectTrigger className="h-16 bg-black/20 border-white/10 rounded-2xl focus:ring-primary/20 text-lg text-white">
                  <SelectValue placeholder="Batch" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
              <Button 
                variant="ghost"
                size="lg"
                onClick={() => router.push("/onboarding/university")}
                className="w-full sm:w-auto h-14 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5"
              >
                <ArrowLeft className="mr-2 w-5 h-5" /> Back
              </Button>
              <Button 
                size="lg"
                disabled={!formData.department || !formData.batch || loading}
                onClick={handleComplete}
                className="w-full h-14 rounded-2xl font-black text-lg bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-xl shadow-primary/20 group"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <div className="flex items-center">
                    <Sparkles className="mr-2 w-5 h-5 text-yellow-300 group-hover:rotate-12 transition-transform" /> 
                    Finish & Launch 
                    <Check className="ml-2 w-6 h-6" />
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
