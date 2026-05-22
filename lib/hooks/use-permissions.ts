import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function useAdminPermissions() {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    async function loadPermissions() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (profile) {
          setRole(profile.role)
          
          // If superadmin, grant ALL permissions automatically
          if (profile.role === "super_admin" || profile.role === "superadmin") {
            const allPerms: Record<string, boolean> = {
              dashboard_access: true,
              students_view: true,
              students_edit: true,
              students_delete: true,
              instructors_view: true,
              instructors_edit: true,
              instructors_delete: true,
              courses_view: true,
              courses_create: true,
              courses_edit: true,
              courses_delete: true,
              content_upload: true,
              content_edit: true,
              content_delete: true,
              payments_view: true,
              payments_approve: true,
              payments_reject: true,
              notifications_create: true,
              notifications_edit: true,
              notifications_delete: true,
              feedback_view: true,
              feedback_update: true,
              analytics_view: true,
              activity_logs_view: true,
              settings_manage: true
            }
            setPermissions(allPerms)
            setLoading(false)
            return
          }
        }

        // Fetch permission row from DB
        const { data: permData } = await supabase
          .from("admin_permissions")
          .select("permissions")
          .eq("admin_id", user.id)
          .maybeSingle()

        if (permData?.permissions) {
          // Keep permissions in a clean boolean mapping
          setPermissions(permData.permissions as Record<string, boolean>)
        }
      } catch (err) {
        console.error("Failed to load permissions:", err)
      } finally {
        setLoading(false)
      }
    }

    loadPermissions()
  }, [])

  const hasPermission = (key: string) => {
    if (role === "super_admin" || role === "superadmin") return true
    return !!permissions[key]
  }

  return { permissions, role, loading, hasPermission }
}
