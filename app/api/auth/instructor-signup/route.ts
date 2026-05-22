import { createClient } from "@supabase/supabase-js"
import { NextResponse, NextRequest } from "next/server"
import { withRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request)
  if (limited) return limited

  try {
    const { email, password, fullName } = await request.json()

    // Initialize admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. Create user via admin client (No OTP/Email verification required)
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Mark as confirmed immediately
      user_metadata: { 
        full_name: fullName,
        role: 'instructor'
      }
    })

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    // 2. Create profile entry
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userData.user.id,
        full_name: fullName,
        email: email,
        role: 'instructor'
      })

    if (profileError) {
      console.error("Profile creation error:", profileError)
    }

    return NextResponse.json({ 
      success: true, 
      userId: userData.user.id 
    })

  } catch (error: any) {
    console.error("Instructor Signup Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
