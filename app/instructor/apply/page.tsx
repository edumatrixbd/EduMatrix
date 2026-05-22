"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { 
  GraduationCap, 
  Video, 
  FileText, 
  FileQuestion, 
  UserCheck, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe
} from "lucide-react"
import { toast } from "sonner"
import { Logo } from "@/components/shared/logo"
import Link from "next/link"

const benefits = [
  {
    icon: Globe,
    title: "Share Expertise",
    description: "Share your knowledge with thousands of students across the nation."
  },
  {
    icon: Video,
    title: "Rich Content",
    description: "Upload video lectures, structured notes, and previous year questions."
  },
  {
    icon: UserCheck,
    title: "Instructor Profile",
    description: "Build your professional profile and establish yourself as an authority."
  },
  {
    icon: Zap,
    title: "Impact Learning",
    description: "Contribute to exam-focused learning and help students excel."
  },
  {
    icon: ShieldCheck,
    title: "Quality Control",
    description: "Get approved by our team before accessing the advanced instructor panel."
  }
]

export default function InstructorApplyLandingPage() {
  const [loading, setLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  console.log("Component Render - isSubmitted:", isSubmitted, "user:", user?.id)
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    institution: "",
    expertise: "",
    experience: "",
    reason: "",
    portfolio: ""
  })

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        
        // Fetch status from instructor_profiles
        const { data: profile } = await supabase
          .from('instructor_profiles')
          .select('status')
          .eq('id', user.id)
          .single()
        
        if (profile?.status === 'pending' || profile?.status === 'approved') {
          setIsSubmitted(true)
        }

        setFormData(prev => ({
          ...prev,
          fullName: user.user_metadata?.full_name || "",
          email: user.email || ""
        }))
      }
    }
    fetchUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Submit clicked. Form data:", { ...formData, password: "***" })
    setLoading(true)
    
    try {
      const supabase = createClient()
      let currentUserId = user?.id

      // 1. Prepare application data
      // No account creation here. We insert directly with user_id = null for guests.
      console.log("Submitting direct application for review...")

      // 2. Insert application details
      const { data: insertData, error: insertError } = await supabase
        .from("instructor_applications")
        .insert([{
          user_id: user?.id || null, // Nullable for new applicants
          full_name: formData.fullName,
          email: formData.email,
          phone_number: formData.phone,
          institution: formData.institution,
          expertise: formData.expertise,
          experience: formData.experience,
          reason: formData.reason,
          portfolio_url: formData.portfolio || null,
          status: "pending"
        }])

      console.log("inserted application", insertData)
      console.log("insert error", insertError)

      if (insertError) {
        throw new Error(insertError.message || "Database insertion failed.")
      }

      console.log("Submission successful. Transitioning to confirmation state.")
      window.scrollTo({ top: 0, behavior: 'instant' })
      setIsSubmitted(true)
      toast.success("Application submitted!")
    } catch (error: any) {
      console.error("Submission Error:", error)
      toast.error(`Submission failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0B0B0B] flex items-center justify-center p-6 text-slate-900 dark:text-white transition-colors duration-300">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="w-20 h-20 bg-[#FFB00F]/20 rounded-full flex items-center justify-center mx-auto ring-1 ring-[#FFB00F]/50">
            <CheckCircle2 className="w-10 h-10 text-[#FFB00F]" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">আবেদন সফল হয়েছে</h1>
          <div className="space-y-4 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 p-8 rounded-3xl border border-slate-200 dark:border-white/10">
            <p className="text-slate-900 dark:text-white font-medium text-lg leading-relaxed">
              আমরা আপনার Instructor Application পেয়েছি। 
            </p>
            <p className="text-sm">
              Super Admin verify করে approve করলে আপনাকে email জানানো হবে।
            </p>
          </div>
          <Button asChild className="w-full bg-[#FFB00F] hover:bg-[#FFB00F]/90 text-black font-bold h-14 rounded-2xl shadow-xl shadow-[#FFB00F]/10">
            <Link href="/">Back to Home</Link>
          </Button>
        </motion.div>
      </div>
    )
  }

  const isFormValid = Boolean(
    formData.fullName && 
    formData.email && 
    formData.password &&
    formData.phone && 
    formData.institution && 
    formData.expertise && 
    formData.experience && 
    formData.reason
  )

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0B0B] text-slate-900 dark:text-white transition-colors duration-300">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-white/80 dark:bg-[#0B0B0B]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 px-6 flex items-center justify-between">
        <Link href="/">
          <Logo className="h-10" />
        </Link>
        <div className="flex gap-4">
          <Button variant="ghost" asChild className="text-slate-700 dark:text-white hover:text-[#FFB00F] hover:bg-slate-50 dark:hover:bg-white/5">
            <Link href="/instructor/login">Login</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-[#FFB00F]/5 rounded-full blur-[120px] -z-10" />
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFB00F]/10 border border-[#FFB00F]/20 text-[#FFB00F] text-sm font-medium"
          >
            <GraduationCap className="w-4 h-4" />
            Instructor Partnership
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-bold tracking-tight text-balance leading-[1.1] text-slate-900 dark:text-white"
          >
            Teach exam-focused content with <span className="text-[#FFB00F]">tensionনাই</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-pretty"
          >
            Help students prepare smarter with structured lessons, notes, and exam resources.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pt-6"
          >
            <Button 
              onClick={() => document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="h-14 px-8 bg-[#FFB00F] hover:bg-[#FFB00F]/90 text-black font-bold text-lg rounded-2xl shadow-[0_8px_30px_rgb(255,176,15,0.2)] group"
            >
              Apply as Instructor
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6 bg-slate-50 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Why join our team?</h2>
            <p className="text-slate-500 dark:text-slate-400">Unlock your potential as an educator with premium tools.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-white dark:bg-[#111111] border-slate-200 dark:border-white/5 hover:border-[#FFB00F]/30 transition-all h-full group">
                  <CardContent className="p-8 space-y-4">
                    <div className="w-12 h-12 bg-[#FFB00F]/10 rounded-xl flex items-center justify-center text-[#FFB00F] ring-1 ring-[#FFB00F]/20 group-hover:scale-110 transition-transform">
                      <benefit.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{benefit.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section id="application-form" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-[#111111] rounded-3xl border border-slate-200 dark:border-white/5 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFB00F]/5 rounded-full blur-3xl -z-10" />
            
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Application Form</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Please provide your details for our team to review.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-slate-700 dark:text-slate-300">Full Name *</Label>
                  <Input 
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="Enter your full name"
                    className="h-12 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:border-[#FFB00F]/50 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email *</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="your@email.com"
                    className="h-12 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:border-[#FFB00F]/50 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" title="password" className="text-slate-700 dark:text-slate-300">Choose Password *</Label>
                  <Input 
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••"
                    className="h-12 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:border-[#FFB00F]/50 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">Phone Number *</Label>
                  <Input 
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+880 1XXX XXXXXX"
                    className="h-12 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:border-[#FFB00F]/50 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution" className="text-slate-700 dark:text-slate-300">Institution / University *</Label>
                  <Input 
                    id="institution"
                    value={formData.institution}
                    onChange={(e) => setFormData({...formData, institution: e.target.value})}
                    placeholder="e.g. BUET, DU"
                    className="h-12 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:border-[#FFB00F]/50 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expertise" className="text-slate-700 dark:text-slate-300">Subject Expertise *</Label>
                <Input 
                  id="expertise"
                  value={formData.expertise}
                  onChange={(e) => setFormData({...formData, expertise: e.target.value})}
                  placeholder="e.g. Higher Math, Physics, CSE"
                  className="h-12 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:border-[#FFB00F]/50 transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience" className="text-slate-700 dark:text-slate-300">Teaching Experience *</Label>
                <Textarea 
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => setFormData({...formData, experience: e.target.value})}
                  placeholder="Briefly describe your teaching background..."
                  className="min-h-[100px] bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:border-[#FFB00F]/50 transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason" className="text-slate-700 dark:text-slate-300">Why do you want to become an instructor? *</Label>
                <Textarea 
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  placeholder="Share your motivation..."
                  className="min-h-[100px] bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:border-[#FFB00F]/50 transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolio" className="text-slate-700 dark:text-slate-300">Sample content link / Portfolio (Optional)</Label>
                <Input 
                  id="portfolio"
                  value={formData.portfolio}
                  onChange={(e) => setFormData({...formData, portfolio: e.target.value})}
                  placeholder="Google Drive, YouTube, or Personal Site link"
                  className="h-12 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:border-[#FFB00F]/50 transition-colors"
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading || !isFormValid}
                className="w-full h-14 bg-[#FFB00F] hover:bg-[#FFB00F]/90 text-black font-bold text-lg rounded-2xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin mx-auto" />
                ) : (
                  "Submit Application"
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="py-12 border-t border-slate-200 dark:border-white/5 text-center text-slate-500 text-sm">
        <p>© 2026 tensionনাই. All rights reserved.</p>
        <p className="mt-2">Empowering students nationwide.</p>
      </footer>
    </div>
  )
}
