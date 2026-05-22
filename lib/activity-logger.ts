import { createClient } from "@/lib/supabase/client"

/**
 * Reusable utility to log administrative actions to Supabase activity_logs.
 */
export async function logAdminActivity(
  action: string,
  targetType: string | null,
  targetId: string | null,
  details: any = null
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from("activity_logs")
      .insert({
        admin_id: user.id,
        admin_email: user.email,
        action,
        target_type: targetType,
        target_id: targetId,
        feature: targetType || "admin",
        details: details ? (typeof details === "string" ? { message: details } : details) : null
      })

    if (error) {
      console.log(JSON.stringify(error, null, 2))
      console.error("Logger Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
    }
  } catch (err) {
    console.error("Activity logging failed:", err)
  }
}
