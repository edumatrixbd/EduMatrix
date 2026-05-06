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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

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
            "fixed inset-y-0 left-0 z-40 w-64 lg:hidden transform transition-transform duration-300",
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
            isCollapsed ? "lg:ml-[70px]" : "lg:ml-64"
          )}
        >
          <DashboardHeader onMenuClick={() => setIsMobileOpen(true)} />
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </TrackingProvider>
  )
}
