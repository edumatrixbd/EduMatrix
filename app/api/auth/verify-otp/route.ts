import { createClient } from "@supabase/supabase-js"
import { NextResponse, NextRequest } from "next/server"
import { withRateLimit } from "@/lib/rate-limit"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request)
  if (limited) return limited

  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Find the latest unverified OTP for this email
    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from('password_reset_otps')
      .select('*')
      .eq('email', email)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !otpRecord) {
      return NextResponse.json({ error: "No active OTP found" }, { status: 400 })
    }

    // 1. Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 })
    }

    // 2. Check max attempts
    if (otpRecord.attempts >= 5) {
      return NextResponse.json({ error: "Maximum attempts reached. Please request a new code." }, { status: 400 })
    }

    // 3. Verify OTP
    const hashedInput = crypto.createHash('sha256').update(otp).digest('hex')
    
    if (hashedInput !== otpRecord.hashed_otp) {
      // Increment attempts
      await supabaseAdmin
        .from('password_reset_otps')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id)

      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 })
    }

    // 4. Mark as verified
    const { error: updateError } = await supabaseAdmin
      .from('password_reset_otps')
      .update({ verified: true })
      .eq('id', otpRecord.id)

    if (updateError) {
      return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "OTP verified successfully" 
    })

  } catch (error: any) {
    console.error("Verify OTP Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
