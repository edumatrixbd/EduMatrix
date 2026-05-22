import { createClient } from "@supabase/supabase-js"
import { NextResponse, NextRequest } from "next/server"
import { withRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request)
  if (limited) return limited

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Verify that there's a verified OTP for this email in the last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    
    const { data: verifiedRecord, error: verifyError } = await supabaseAdmin
      .from('password_reset_otps')
      .select('id')
      .eq('email', email)
      .eq('verified', true)
      .gt('created_at', fifteenMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (verifyError || !verifiedRecord) {
      return NextResponse.json({ error: "Unauthorized. Please verify OTP first." }, { status: 401 })
    }

    // 2. Find user ID from profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // 3. Update password in Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { password }
    )

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // 4. Optional: Mark OTP as used (by deleting or marking another flag)
    // For now, we rely on the 15-minute window or we can delete it.
    await supabaseAdmin
      .from('password_reset_otps')
      .delete()
      .eq('email', email)

    return NextResponse.json({ 
      success: true, 
      message: "Password updated successfully" 
    })

  } catch (error: any) {
    console.error("Update Password Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
