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
  Video,
  FileQuestion,
  Upload,
  Settings,
  LogOut,
  ChevronLeft,
  BarChart3,
  FileText,
  Bell,
  Shield,
  FileCheck,
  Layers,
  CreditCard,
  Sparkles,
  AlertTriangle,
  DollarSign
} from "lucide-react"
import { Logo } from "@/components/shared/logo"
import { createClient } from "@/lib/supabase/client"
import { useAdminPermissions } from "@/lib/hooks/use-permissions"

interface AdminSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function AdminSidebar({ isCollapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname()
  const [role, setRole] = React.useState<string>("admin")
  const { hasPermission } = useAdminPermissions()

  React.useEffect(() => {
    const fetchRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()
        if (profile) setRole(profile.role)
      }
    }
    fetchRole()
  }, [])

  const navigation = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard, permission: "dashboard_access" },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3, permission: "analytics_view" },
    { name: "Hierarchy", href: "/admin/hierarchy", icon: Shield, permission: "courses_view" },
    { name: "Instructors", href: "/admin/instructors/applications", icon: GraduationCap, permission: "instructors_view" },
    { name: "Students", href: "/admin/students", icon: Users, permission: "students_view" },
    { name: "Courses", href: "/admin/courses", icon: BookOpen, permission: "courses_view" },
    { name: "Content", href: "/admin/content", icon: FileText, permission: "content_upload" },
    { name: "Payments", href: "/admin/payments", icon: CreditCard, permission: "payments_view" },
    { name: "Feedback", href: "/admin/feedback", icon: AlertTriangle, permission: "feedback_view" },
    { name: "Notifications", href: "/admin/notifications", icon: Bell, permission: "notifications_create" },
    ...(role === "super_admin" || role === "superadmin" ? [
      { name: "Pricing Panel", href: "/admin/pricing", icon: DollarSign, permission: "settings_manage" },
      { name: "Activity Logs", href: "/admin/activity-logs", icon: FileCheck, permission: "activity_logs_view" },
      { name: "Manage Admins", href: "/admin/users/create", icon: Shield, permission: "settings_manage" },
      { name: "Permissions", href: "/admin/permissions", icon: Shield, permission: "settings_manage" }
    ] : []),
  ].filter(item => hasPermission(item.permission))

  const bottomNavigation = [
    { name: "Settings", href: "/admin/settings", icon: Settings, permission: "settings_manage" },
  ].filter(item => hasPermission(item.permission))

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card text-card-foreground border-r border-border transition-all duration-300 flex flex-col",
        isCollapsed ? "w-[70px]" : "w-56"
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <Link href="/admin" className="flex items-center gap-2 overflow-hidden">
          <Logo className={cn("h-9", isCollapsed && "h-8 px-1")} />
          {!isCollapsed && (
            <div>
              <span className="block text-xs text-muted-foreground">Admin Panel</span>
            </div>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn("h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted", isCollapsed && "hidden")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
              prefetch={true}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          )
        })}

        {/* Logout */}
        <Link
          href="/auth/logout"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-red-400 hover:bg-red-500/10",
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
            "flex items-center gap-3 p-2 rounded-lg bg-muted mt-2",
            isCollapsed && "justify-center"
          )}
        >
          <Avatar className="h-9 w-9 border-2 border-primary/50">
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
              AD
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground">Admin User</p>
              <p className="text-xs text-muted-foreground truncate">admin@tensionনাই.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
