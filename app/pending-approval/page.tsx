"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ShieldAlert, RefreshCw, LogOut, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/shared/logo"
import { toast } from "sonner"

export default function PendingApprovalPage() {
  const [loading, setLoading] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleCheckApproval = async () => {
    setLoading(true)
    try {
      // Force token refresh by retrieving user details
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role, approved, status')
          .eq('id', user.id)
          .single()

        if (profile && profile.approved === true && profile.status === 'active') {
          toast.success("Congratulations! Your account has been approved.")
          const role = profile.role || 'student'
          
          if (role === 'admin' || role === 'super_admin' || role === 'superadmin') {
            router.push("/admin")
          } else if (role === 'instructor') {
            router.push("/instructor")
          } else {
            router.push("/student")
          }
          return
        }
      }
      toast.info("Your application is still undergoing security review. We will notify you once approved!")
    } catch (error) {
      console.error(error)
      toast.error("Failed to check application status.")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLogoutLoading(true)
    try {
      await supabase.auth.signOut({ scope: "global" })
      router.push("/login")
      toast.success("Signed out successfully.")
    } catch (error) {
      console.error(error)
      toast.error("Failed to sign out.")
    } finally {
      setLogoutLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Background glowing gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-primary/10 blur-[130px] dark:bg-primary/5 animate-pulse" />
        <div className="absolute -bottom-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-amber-500/10 blur-[130px] dark:bg-amber-500/5" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Brand Logo Header */}
        <div className="flex justify-center mb-10">
          <Logo className="h-14" />
        </div>

        {/* Glassmorphism Card */}
        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/5 shadow-2xl rounded-3xl p-8 md:p-10 text-center relative overflow-hidden">
          {/* Pulsing Status Icon */}
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6"
          >
            <Clock className="w-8 h-8 text-amber-500 dark:text-amber-400" />
          </motion.div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
            Awaiting Approval
          </h1>
          
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed mb-8 max-w-md mx-auto">
            Your account is currently pending administrative approval. 
            EduMatrix security officers review registration profiles to keep the portal safe. Please check back shortly.
          </p>

          {/* Action buttons */}
          <div className="space-y-4">
            <Button
              onClick={handleCheckApproval}
              disabled={loading || logoutLoading}
              className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              Check Approval Status
            </Button>

            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={loading || logoutLoading}
              className="w-full h-12 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-300"
            >
              {logoutLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LogOut className="w-5 h-5" />
              )}
              Sign Out & Logout
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
