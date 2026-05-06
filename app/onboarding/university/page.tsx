"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GraduationCap, ChevronRight, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const universities = [
  { id: "diu", name: "Daffodil International University", logo: "DIU", color: "from-blue-500 to-indigo-600" },
  { id: "nsu", name: "North South University", logo: "NSU", color: "from-emerald-500 to-teal-600" },
  { id: "brac", name: "BRAC University", logo: "BRAC", color: "from-purple-500 to-indigo-600" },
  { id: "aust", name: "Ahsanullah University", logo: "AUST", color: "from-rose-500 to-orange-600" },
  { id: "aiub", name: "AIUB", logo: "AIUB", color: "from-cyan-500 to-blue-600" },
  { id: "uiu", name: "United International University", logo: "UIU", color: "from-orange-500 to-amber-600" },
]

export default function UniversityOnboarding() {
  const router = useRouter()
  const supabase = createClient()
  const [selected, setSelected] = useState("")
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }
        setUser(user)
      } catch (error) {
        console.error("Error checking user session:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }
    checkUser()
  }, [])

  const handleNext = async () => {
    if (!selected || !user) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ university: selected })
        .eq('id', user.id)

      if (error) throw error
      
      console.log("University selected:", selected)
      console.log("Redirecting to: /onboarding/details")
      router.push("/onboarding/details")
    } catch (err) {
      console.error("Error saving university:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-primary/20 relative overflow-hidden flex flex-col items-center justify-center p-6">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      
      <div className="w-full max-w-4xl relative z-10 py-12">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 mb-8"
          >
            <GraduationCap className="w-10 h-10 text-primary" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight"
          >
            Where do you study?
          </motion.h1>
          <p className="text-slate-400 mt-4 text-xl">Select your university to get started.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {universities.map((uni) => (
            <motion.div
              key={uni.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={cn(
                  "cursor-pointer transition-all duration-500 border-2 group relative overflow-hidden h-full",
                  selected === uni.id 
                    ? "border-primary bg-primary/10 ring-4 ring-primary/10" 
                    : "bg-white/5 border-white/10 hover:border-white/20"
                )}
                onClick={() => setSelected(uni.id)}
              >
                <CardContent className="p-8 flex flex-col items-center text-center h-full">
                  <div className={cn(
                    "w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-black mb-6 transition-all duration-500 shadow-xl shadow-black/20 bg-gradient-to-br",
                    selected === uni.id ? uni.color : "from-slate-800 to-slate-900 group-hover:from-slate-700 group-hover:to-slate-800"
                  )}>
                    {uni.logo}
                  </div>
                  <h3 className="font-bold text-lg leading-snug text-slate-100">{uni.name}</h3>
                  
                  {selected === uni.id && (
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }}
                      className="absolute top-4 right-4 w-8 h-8 bg-primary rounded-2xl flex items-center justify-center shadow-lg"
                    >
                      <Check className="w-5 h-5 text-white" />
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center">
          <Button 
            size="lg"
            disabled={!selected || loading}
            onClick={handleNext}
            className="px-12 h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Next Step <ChevronRight className="ml-2 w-6 h-6" /></>}
          </Button>
        </div>
      </div>
    </div>
  )
}
