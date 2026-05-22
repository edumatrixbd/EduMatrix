"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { DashboardHeader } from "@/components/dashboard/header"
import { TrackingProvider } from "@/components/providers/tracking-provider"
import { cn } from "@/lib/utils"

const DashboardSidebar = dynamic(
  () => import("@/components/dashboard/sidebar").then((mod) => mod.DashboardSidebar),
  { ssr: false }
)

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)

  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('role, onboarding_completed, university_id, department_id, batch_id')
          .eq('id', user.id)
          .single()

        setProfile(profileData)
        setIsVerifying(false)
      } catch (error) {
        console.error("Profile check error:", error)
        setIsVerifying(false)
      }
    }
    checkOnboarding()
  }, [pathname])

  if (isVerifying) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-slate-500 font-bold italic">Verifying profile access...</p>
    </div>
  )

  const isProfileIncomplete = profile?.role === 'student' && (
    !profile?.onboarding_completed || 
    !profile?.university_id || 
    !profile?.department_id || 
    !profile?.batch_id
  )

  return (
    <TrackingProvider>
      <div className="min-h-screen bg-muted/30">
        {/* Sidebar */}
        <div className="hidden lg:block">
          <DashboardSidebar
            isCollapsed={isCollapsed}
            onToggle={() => setIsCollapsed(!isCollapsed)}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-56 lg:hidden transform transition-transform duration-300",
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <DashboardSidebar
            isCollapsed={false}
            onToggle={() => setIsMobileOpen(false)}
            isMobile={true}
          />
        </div>

        {/* Main Content */}
        <div
          className={cn(
            "relative z-0 min-h-screen transition-all duration-300",
            isCollapsed ? "lg:ml-[70px]" : "lg:ml-56"
          )}
        >
          <DashboardHeader 
            onMenuClick={() => setIsMobileOpen(true)} 
            profile={profile}
          />
          
          {/* Onboarding Banner */}
          {isProfileIncomplete && (
            <div className="px-4 py-3 bg-primary/10 border-b border-primary/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Complete your profile</p>
                  <p className="text-xs text-slate-500">Select your university and batch to see relevant resources.</p>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => router.push("/onboarding/university")}
                className="bg-primary text-white font-bold h-8 px-4 text-xs rounded-lg whitespace-nowrap"
              >
                Complete Now
              </Button>
            </div>
          )}

          <main className="p-4 sm:p-5 lg:p-6">{children}</main>
        </div>
      </div>
    </TrackingProvider>
  )
}
