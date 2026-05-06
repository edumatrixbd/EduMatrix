"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "@/providers/theme-provider"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Video,
  FileQuestion,
  Lightbulb,
  FileText,
  CheckCircle,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  User,
  Moon,
  Sun,
  BookOpenCheck,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Study Zone", href: "/dashboard/study-zone", icon: BookOpenCheck },
  { name: "My Courses", href: "/dashboard/courses", icon: BookOpen },
  { name: "Video Lectures", href: "/dashboard/videos", icon: Video },
  { name: "Previous Questions", href: "/dashboard/questions", icon: FileQuestion },
  { name: "Suggestions", href: "/dashboard/suggestions", icon: Lightbulb },
  { name: "Study Notes", href: "/dashboard/notes", icon: FileText },
  { name: "Solved Answers", href: "/dashboard/solved", icon: CheckCircle },
]

const bottomNavigation = [
  { name: "Profile", href: "/dashboard/profile", icon: User },
]

interface DashboardSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  isMobile?: boolean
}

export function DashboardSidebar({ isCollapsed, onToggle, isMobile }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { user, isLoading: authLoading } = useAuth()

  const fullName = user?.full_name || "Student User"
  const avatarUrl = user?.avatar_url
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col",
        isCollapsed ? "w-[70px]" : "w-64"
      )}
    >
      {/* Toggle Button (Desktop) */}
      <Button
        variant="outline"
        size="icon"
        onClick={onToggle}
        className="absolute -right-4 top-6 z-50 h-8 w-8 rounded-full bg-card hidden lg:flex"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Close Button (Mobile) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute right-2 top-3 z-50 h-10 w-10 lg:hidden"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </Button>
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 overflow-hidden"
          onClick={() => isMobile && onToggle()}
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold text-foreground whitespace-nowrap">
              EduMatrix
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                onMouseEnter={() => router.prefetch(item.href)}
                onClick={() => isMobile && onToggle()}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  isCollapsed && "justify-center px-2"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Bottom Section */}
      <div className="border-t border-border p-3 space-y-2">
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => isMobile && onToggle()}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          )
        })}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            isCollapsed && "justify-center px-2"
          )}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 flex-shrink-0" />
          ) : (
            <Moon className="h-5 w-5 flex-shrink-0" />
          )}
          {!isCollapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
        </button>

        {/* Logout */}
        <Link
          href="/auth/logout"
          onClick={() => isMobile && onToggle()}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-destructive hover:bg-destructive/10",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </Link>

        {/* User Profile */}
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg bg-muted/50 mt-2",
            isCollapsed && "justify-center"
          )}
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatarUrl} alt={fullName} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || "Student"}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
