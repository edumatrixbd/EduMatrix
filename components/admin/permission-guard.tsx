"use client"

import { useAdminPermissions } from "@/lib/hooks/use-permissions"
import { Loader2, ShieldAlert } from "lucide-react"

interface PermissionGuardProps {
  permission: string
  children: React.ReactNode
}

export function PermissionGuard({ permission, children }: PermissionGuardProps) {
  const { hasPermission, loading } = useAdminPermissions()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl max-w-xl mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-[#FF3B30] animate-bounce">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm leading-relaxed">
          You do not have the required permission (`{permission}`) to access this administrative console. Please contact a Super Administrator to elevate your privileges.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
