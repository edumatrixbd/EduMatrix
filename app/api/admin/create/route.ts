import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { email, password, full_name, role, permissions } = await request.json()

    const auth = await requireSuperAdmin()
    if (auth.response) return auth.response

    const supabaseAdmin = createAdminClient()

    // Create the new admin user using service role
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: role || 'admin'
      }
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // 2. Insert/upsert into profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        full_name,
        email,
        role: role || 'admin',
        created_at: new Date().toISOString()
      })

    if (profileError) {
      console.error("Profile creation error:", profileError)
      return NextResponse.json({ error: "Failed to create user profile: " + profileError.message }, { status: 500 })
    }

    // Insert permissions into admin_permissions table
    const { error: permError } = await supabaseAdmin
      .from('admin_permissions')
      .upsert({
        admin_id: newUser.user.id,
        permissions: permissions || {},
        created_by: auth.user!.id,
        updated_at: new Date().toISOString()
      })

    if (permError) {
      console.error("Permissions creation error:", permError)
      return NextResponse.json({ error: "Failed to create admin permissions: " + permError.message }, { status: 500 })
    }

    // 3. Add activity log
    await supabaseAdmin.from('activity_logs').insert({
      admin_id: auth.user!.id,
      admin_email: auth.user!.email,
      action: 'CREATE_ADMIN',
      target_type: 'user',
      target_id: newUser.user.id,
      details: { email, role: role || 'admin', permissions: permissions || {} }
    })

    return NextResponse.json({ 
      success: true, 
      user: {
        id: newUser.user.id,
        email: newUser.user.email
      }
    })

  } catch (error: any) {
    console.error('Admin Creation API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
