import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { deviceInfo } = await request.json()
    const newSessionId = uuidv4()

    // 1. Deactivate old active sessions for this user
    await supabase
      .from('usage_sessions')
      .update({ status: 'deactivated' })
      .eq('user_id', user.id)
      .eq('status', 'active')

    // 2. Start new session
    const { error: insertError } = await supabase
      .from('usage_sessions')
      .insert({
        user_id: user.id,
        session_id: newSessionId,
        device_info: deviceInfo || 'Unknown Device',
        status: 'active'
      })

    if (insertError) throw insertError

    return NextResponse.json({ sessionId: newSessionId })

  } catch (error) {
    console.error("Session Start Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
