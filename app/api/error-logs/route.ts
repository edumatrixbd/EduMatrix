import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { errorType, pageUrl, message, details } = body

    if (!errorType || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { error } = await supabase
      .from('error_logs')
      .insert({
        user_id: user?.id || null,
        error_type: errorType,
        page_url: pageUrl || 'Unknown',
        message: message,
        details: details || {},
        status: 'open'
      })

    if (error) {
      console.error("DB Logging Error:", error)
      return NextResponse.json({ error: "Failed to record log" }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error Logging API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Role check
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!['admin', 'super_admin'].includes(profile?.role || '')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")

    let query = supabase.from('error_logs').select('*, profiles(full_name)').order('created_at', { ascending: false })
    
    if (status) query = query.eq('status', status)
    if (type) query = query.eq('error_type', type)

    const { data, error } = await query.limit(100)
    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { id, status } = body

    const { error } = await supabase
      .from('error_logs')
      .update({ status })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
