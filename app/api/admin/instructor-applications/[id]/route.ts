import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params
    const { status } = await request.json()
    const id = paramId
    console.log("received id", id)
    
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 1. Role check
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!['admin', 'super_admin', 'superadmin'].includes(profile?.role || '')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 2. Fetch the application safely using admin client
    const { createAdminClient } = require("@/lib/supabase/admin")
    const adminSupabase = createAdminClient()
    
    const { data: app, error: appError } = await adminSupabase
      .from('instructor_applications')
      .select('*')
      .eq('id', id)
      .single()

    if (appError || !app) {
      console.error("Admin Application Fetch Error:", appError)
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 })
    }

    // 3. Update application status
    const { error: updateError } = await adminSupabase
      .from('instructor_applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) throw updateError

    // 4. If approved, handle profile and account
    if (status === 'approved') {
      const { createAdminClient } = require("@/lib/supabase/admin")
      const adminSupabase = createAdminClient()
      let targetUserId = app.user_id
      let tempPassword = ""
      console.log(`[APPROVE] Processing application for: ${app.email}`)

      // Case A: Applicant is a guest (no user_id)
      if (!targetUserId) {
        console.log("[APPROVE] No user_id found. Attempting to create auth account...")
        tempPassword = Math.random().toString(36).slice(-8) + "!" // Simple random password
        
        const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
          email: app.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { 
            full_name: app.full_name,
            role: 'instructor' 
          }
        })

        if (createError) {
          console.error("[APPROVE] Auth creation error:", createError)
          if (createError.message.includes('already registered') || createError.message.includes('User already registered')) {
             console.log("[APPROVE] User already exists in Auth. Fetching existing user ID...")
             // If already registered, just find the user
             const { data: usersData, error: listError } = await adminSupabase.auth.admin.listUsers()
             if (listError) throw listError
             
             const existingUser = usersData?.users.find((u: any) => u.email.toLowerCase() === app.email.toLowerCase())
             targetUserId = existingUser?.id
             console.log(`[APPROVE] Found existing user ID: ${targetUserId}`)
             tempPassword = "" // They already have a password
             
             // Ensure they are confirmed
             if (targetUserId) {
               await adminSupabase.auth.admin.updateUserById(targetUserId, { email_confirm: true })
             }
          } else {
            return NextResponse.json({ success: false, error: `Auth creation failed: ${createError.message}` }, { status: 500 })
          }
        } else {
          targetUserId = newUser.user?.id
          console.log(`[APPROVE] New auth user created: ${targetUserId}`)
        }
        
        // Link the application to the new user
        if (targetUserId) {
          const { error: linkError } = await adminSupabase
            .from('instructor_applications')
            .update({ user_id: targetUserId })
            .eq('id', id)
          if (linkError) console.error("[APPROVE] Error linking application to user:", linkError)
        }
      } else {
        console.log(`[APPROVE] Existing targetUserId found: ${targetUserId}. Confirming email...`)
        // Even if they have a user_id, ensure they are confirmed
        await adminSupabase.auth.admin.updateUserById(targetUserId, { email_confirm: true })
      }

      // Case B: Applicant already has a user account (or we just created one)
      if (targetUserId) {
        console.log(`[APPROVE] Promoting user ${targetUserId} to instructor role...`)
        
        // Update profile role
        const { data: profileUpdate, error: profileError } = await adminSupabase
          .from('profiles')
          .update({ 
            role: 'instructor',
            email: app.email
          })
          .eq('id', targetUserId)
          .select()
        
        if (profileError) {
          console.error("[APPROVE] Profile update error:", profileError)
          return NextResponse.json({ success: false, error: `Profile update failed: ${profileError.message}` }, { status: 500 })
        }
        console.log("[APPROVE] Profile updated successfully:", profileUpdate)

        // Create instructor record if missing
        const { error: instError } = await adminSupabase
          .from('instructors')
          .upsert({
            id: targetUserId,
            name: app.full_name,
            expertise: app.expertise?.split(',').map((s: string) => s.trim()) || []
          }, { onConflict: 'id' })
        
        if (instError) console.error("[APPROVE] Instructor record upsert error:", instError)

        console.log("[APPROVE] Core records synchronized.")
        
        // 5. Send approval email
        const resendApiKey = process.env.RESEND_API_KEY
        const fromEmail = process.env.FROM_EMAIL || "Tensionনাই <admin@tensionai.net>"
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tensionনাই.com"

        if (resendApiKey) {
          try {
            console.log(`[APPROVE] Attempting to send approval email to ${app.email}...`)
            const emailRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${resendApiKey}`,
              },
              body: JSON.stringify({
                from: fromEmail,
                to: app.email,
                subject: "Your instructor account is ready!",
                html: `
                  <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #111827;">
                    <div style="text-align: center; margin-bottom: 32px;">
                      <h1 style="font-size: 24px; font-weight: 800; color: #4f46e5; margin: 0;">Tensionনাই</h1>
                      <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Instructor Recruitment</p>
                    </div>

                    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 16px;">Congratulations, ${app.full_name}!</h2>
                      <p style="color: #4b5563; line-height: 1.6; font-size: 16px; margin-bottom: 24px;">Your instructor application has been approved. We're excited to have you join our teaching community!</p>
                      
                      ${tempPassword ? `
                      <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
                        <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Your Login Credentials</p>
                        <p style="margin: 0; color: #111827; font-size: 14px;"><strong>Email:</strong> ${app.email}</p>
                        <p style="margin: 8px 0 0; color: #111827; font-size: 14px;"><strong>Password:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
                        <p style="margin: 16px 0 0; color: #ef4444; font-size: 12px; font-weight: 500;">* Please change your password immediately after logging in.</p>
                      </div>
                      ` : `
                      <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
                        <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.5;">You can now access the Instructor Panel using your <strong>existing account password</strong>.</p>
                      </div>
                      `}

                      <div style="text-align: center;">
                        <a href="${siteUrl}/instructor/login" style="background-color: #4f46e5; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                          Access Instructor Panel
                        </a>
                      </div>
                    </div>

                    <div style="text-align: center; margin-top: 32px; color: #9ca3af; font-size: 12px;">
                      <p>© ${new Date().getFullYear()} Tensionনাই. All rights reserved.</p>
                    </div>
                  </div>
                `,
              }),
            })
            console.log("[APPROVE] Email service response:", emailRes.status)
          } catch (emailErr) {
            console.error("[APPROVE] Failed to send approval email:", emailErr)
          }
        }
      } else {
        return NextResponse.json({ success: false, error: "Failed to resolve target user ID" }, { status: 500 })
      }
    } else if (status === 'rejected') {
      // Optional: Send rejection email
      const resendApiKey = process.env.RESEND_API_KEY
      const fromEmail = process.env.FROM_EMAIL || "Tensionনাই <admin@tensionai.net>"

      if (resendApiKey) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: fromEmail,
              to: app.email,
              subject: "Update on your Instructor Application",
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
                  <h2 style="color: #111827; margin-bottom: 16px;">Application Update</h2>
                  <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">Thank you for your interest in teaching with us.</p>
                  <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">After carefully reviewing your application, we regret to inform you that we cannot move forward with your instructor request at this time.</p>
                  <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">We appreciate the time you took to apply and wish you the best in your future endeavors.</p>
                  <p style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; pt: 16px; margin-top: 32px;">
                    Best regards,<br>
                    <strong>Tensionনাই Team</strong>
                  </p>
                </div>
              `,
            }),
          })
          console.log(`[EMAIL] Rejection email sent to ${app.email}`)
        } catch (emailErr) {
          console.error("Failed to send rejection email:", emailErr)
        }
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Application Process Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 1. Role check
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!['admin', 'super_admin', 'superadmin'].includes(profile?.role || '')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 2. Delete the application using admin client
    const { createAdminClient } = require("@/lib/supabase/admin")
    const adminSupabase = createAdminClient()
    
    const { error: deleteError } = await adminSupabase
      .from('instructor_applications')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error("Admin Application Delete Error:", deleteError)
      return NextResponse.json({ success: false, error: "Failed to delete application" }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Application Delete Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
