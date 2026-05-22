import { createClient } from "@supabase/supabase-js"
import { NextResponse, NextRequest } from "next/server"
import { withRateLimit } from "@/lib/rate-limit"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request)
  if (limited) return limited

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

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

    // 1. Check if user exists in profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      // For security, still return success but don't actually send OTP
      return NextResponse.json({ success: true, message: "If an account exists, an OTP has been sent." })
    }

    // 2. Check for resend limit (1 minute)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
    const { data: recentOtp } = await supabaseAdmin
      .from('password_reset_otps')
      .select('created_at')
      .eq('email', email)
      .gt('created_at', oneMinuteAgo)
      .limit(1)

    if (recentOtp && recentOtp.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Please wait at least 60 seconds before requesting another code." 
      }, { status: 429 })
    }

    // 3. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // 3. Hash OTP
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex')
    
    // 4. Set expiry (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    // 5. Store in DB
    const { error: otpError } = await supabaseAdmin
      .from('password_reset_otps')
      .insert({
        email,
        hashed_otp: hashedOtp,
        expires_at: expiresAt,
        attempts: 0,
        verified: false
      })

    if (otpError) {
      console.error("OTP storage error:", otpError)
      
      if (otpError.code === 'P0001' || otpError.message.includes('relation "password_reset_otps" does not exist')) {
        return NextResponse.json({ 
          success: false, 
          error: "Database table 'password_reset_otps' is missing. Please run the SQL migration." 
        }, { status: 500 })
      }
      
      return NextResponse.json({ success: false, error: `Failed to store OTP: ${otpError.message}` }, { status: 500 })
    }

    // 6. Send Email (Resend API)
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    const FROM_EMAIL = process.env.FROM_EMAIL || "Tensionনাই <reset@tensionai.net>"

    if (!RESEND_API_KEY) {
      console.warn(`[AUTH] RESEND_API_KEY is missing. OTP for ${email}: ${otp}`)
      return NextResponse.json({ 
        success: false, 
        error: "Email service not configured. Please contact support or check server environment." 
      }, { status: 500 })
    }

    try {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: email,
          subject: "Your Verification Code",
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
              <h2 style="color: #111827; margin-bottom: 16px;">Verification Code</h2>
              <p style="color: #4b5563; line-height: 1.5; font-size: 16px;">Your OTP is: <strong style="font-size: 24px; color: #111827;">${otp}</strong></p>
              <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">This code is valid for <strong>5 minutes</strong>. If you didn't request this, please ignore this email.</p>
              <div style="margin-top: 24px; padding-top: 16px; border-t: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
                Sent by Tensionনাই
              </div>
            </div>
          `,
        }),
      })

      const resendData = await resendResponse.json()

      if (!resendResponse.ok) {
        console.error("Resend API Error:", resendData)
        return NextResponse.json({ 
          success: false, 
          error: `Email delivery failed: ${resendData.message || "Unknown error"}` 
        }, { status: 500 })
      }

      console.log(`[AUTH] OTP sent successfully to ${email}`)
      return NextResponse.json({ 
        success: true, 
        message: "OTP sent successfully" 
      })

    } catch (emailError: any) {
      console.error("Email Sending Exception:", emailError)
      return NextResponse.json({ 
        success: false, 
        error: `Failed to connect to email service: ${emailError.message}` 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error("Send OTP Route Error:", error)
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
