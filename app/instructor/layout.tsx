"use client"

import React, { useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Menu, User, LogOut, ChevronDown, CreditCard, Loader2, Moon, Sun } from "lucide-react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { NotificationBell } from "@/components/notification-bell"

const InstructorSidebar = dynamic(
  () => import("@/components/instructor/sidebar").then((mod) => mod.InstructorSidebar),
  { ssr: false }
)

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const isLoginPage = pathname === "/instructor/login" || pathname === "/instructor/apply"
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  // Auth & Role Protection
  const { createClient: createBrowserClient } = require("@/lib/supabase/client")
  const [authChecked, setAuthChecked] = useState(false)

  React.useEffect(() => {
    const checkAuth = async () => {
      if (isLoginPage) {
        setAuthChecked(true)
        return
      }

      const supabase = createBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/instructor/login")
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'student') {
        router.push("/dashboard")
        return
      }

      if (!['instructor', 'admin', 'super_admin', 'superadmin'].includes(profile?.role || '')) {
        router.push("/instructor/login")
        return
      }

      setAuthChecked(true)
    }

    checkAuth()
  }, [isLoginPage, router])

  if (isLoginPage) return <>{children}</>
  if (!authChecked) return <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center transition-colors duration-300"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <InstructorSidebar
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
          "fixed inset-y-0 left-0 z-40 w-64 lg:hidden transform transition-transform duration-300",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <InstructorSidebar
          isCollapsed={false}
          onToggle={() => setIsMobileOpen(false)}
          isMobile={true}
        />
      </div>

      {/* Main Content */}
      <div
        className={cn(
          "relative z-0 min-h-screen transition-all duration-300",
          isCollapsed ? "lg:ml-[70px]" : "lg:ml-64"
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-950 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="hidden sm:flex items-center relative">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses, students..."
                className="w-64 lg:w-80 pl-9 h-10 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="sm:hidden">
              <Search className="h-5 w-5" />
            </Button>

            <ThemeToggle />

            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                      IN
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">Instructor</span>
                    <span className="text-[10px] text-muted-foreground">Course Partner</span>
                  </div>
                  <ChevronDown className="hidden md:block h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" /> Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <CreditCard className="h-4 w-4 mr-2" /> Payout Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  )
}
