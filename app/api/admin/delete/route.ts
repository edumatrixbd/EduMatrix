import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { adminId } = await request.json()

    if (!adminId) {
      return NextResponse.json({ error: "Missing adminId parameter" }, { status: 400 })
    }

    const auth = await requireSuperAdmin()
    if (auth.response) return auth.response

    if (adminId === auth.user!.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // 1. Fetch user's profile to capture email for logging
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, role')
      .eq('id', adminId)
      .single()

    // 2. Delete auth user (which cascades and deletes profile/permissions)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(adminId)
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    // 3. Log the action
    await supabaseAdmin.from('activity_logs').insert({
      admin_id: auth.user!.id,
      admin_email: auth.user!.email,
      action: 'DELETE_ADMIN',
      target_type: 'user',
      target_id: adminId,
      details: { 
        deleted_id: adminId, 
        deleted_email: profile?.email || "unknown", 
        deleted_role: profile?.role || "admin" 
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin Deletion API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
