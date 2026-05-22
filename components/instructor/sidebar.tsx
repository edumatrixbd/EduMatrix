"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  DollarSign,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  FileText,
} from "lucide-react"
import { Logo } from "@/components/shared/logo"

const navigation = [
  { name: "Overview", href: "/instructor", icon: LayoutDashboard },
  { name: "My Courses", href: "/instructor/courses", icon: BookOpen },
  { name: "Students", href: "/instructor/students", icon: Users },
  { name: "Course Content", href: "/instructor/content", icon: FileText },
  { name: "Earnings", href: "/instructor/earnings", icon: DollarSign },
  { name: "Payouts", href: "/instructor/payouts", icon: CreditCard },
  { name: "Announcements", href: "/instructor/notices", icon: Bell },
]

interface InstructorSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  isMobile?: boolean
}

export function InstructorSidebar({ isCollapsed, onToggle, isMobile }: InstructorSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-r border-slate-200 dark:border-white/10 transition-all duration-300 flex flex-col",
        isCollapsed ? "w-[70px]" : "w-56"
      )}
    >
      {/* Toggle Button (Desktop) */}
      <Button
        variant="outline"
        size="icon"
        onClick={onToggle}
        className="absolute -right-4 top-6 z-50 h-8 w-8 rounded-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hidden lg:flex shadow-sm"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        <Link 
          href="/instructor" 
          className="flex items-center gap-2 overflow-hidden"
          onClick={() => isMobile && onToggle()}
        >
          <Logo className={cn("h-9", isCollapsed && "h-8 px-1")} />
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="block text-[10px] text-slate-500 dark:text-white/60 font-medium uppercase tracking-wider">Instructor Panel</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/instructor" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white",
                  isCollapsed && "justify-center px-2"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-white" : "text-slate-500 dark:text-white/60"
                )} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Bottom Section */}
      <div className="border-t border-white/10 p-3 space-y-2">
        <Link
          href="/instructor/settings"
          prefetch={true}
          onClick={() => isMobile && onToggle()}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white",
            isCollapsed && "justify-center px-2"
          )}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </Link>

        <Link
          href="/auth/logout"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-rose-400 hover:bg-rose-500/10",
            isCollapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </Link>

        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg bg-slate-100 dark:bg-white/5 mt-2",
            isCollapsed && "justify-center"
          )}
        >
          <Avatar className="h-9 w-9 border border-primary/30">
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold uppercase">
              IN
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">Instructor</p>
              <p className="text-[10px] text-slate-500 dark:text-white/40 truncate uppercase tracking-tighter">tensionনাই Partner</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
