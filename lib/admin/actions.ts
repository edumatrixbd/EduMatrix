import { createClient } from "@/lib/supabase/client"

export type AdminAction = 
  | 'APPROVE_INSTRUCTOR' 
  | 'REJECT_INSTRUCTOR' 
  | 'CREATE_ADMIN' 
  | 'DELETE_USER' 
  | 'APPROVE_PAYMENT' 
  | 'UPDATE_SETTINGS'
  | 'LOGIN_ADMIN'

interface LogActionParams {
  action: AdminAction
  targetId?: string
  targetType?: 'student' | 'instructor' | 'admin' | 'payment'
  details?: any
}

/**
 * Logs an administrative action to the activity_logs table.
 * Uses the security-definer function log_activity() to ensure the user_id is correctly captured.
 */
export async function logAdminAction({ action, targetId, targetType, details = {} }: LogActionParams) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.rpc('log_activity', {
      p_action: action,
      p_target_id: targetId,
      p_target_type: targetType,
      p_details: details
    })

    if (error) {
      console.error("Failed to log admin action:", error)
      return { success: false, error }
    }

    return { success: true, logId: data }
  } catch (err) {
    console.error("Error logging admin action:", err)
    return { success: false, error: err }
  }
}

/**
 * Helper to check if the current user is a superadmin.
 * Primarily used for UI-level conditional rendering.
 */
export async function isSuperAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'super_admin'
}
