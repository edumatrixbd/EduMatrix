import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    // 1. Check session status and update last_active_at
    const { data: session, error } = await supabase
      .from('usage_sessions')
      .select('status')
      .eq('user_id', user.id)
      .eq('session_id', sessionId)
      .single()

    if (error || !session) {
      return NextResponse.json({ status: 'deactivated', reason: 'Session not found' })
    }

    if (session.status === 'active') {
      await supabase
        .from('usage_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('session_id', sessionId)
    }

    return NextResponse.json({ status: session.status })

  } catch (error) {
    console.error("Session Heartbeat Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
