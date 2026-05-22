import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Authenticate the user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { material_type, material_id, message, page_url } = body

    if (!material_type || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { error } = await supabase
      .from("material_feedback")
      .insert({
        user_id: user.id,
        material_type,
        material_id,
        message,
        page_url
      })

    if (error) {
      console.error("Feedback insert error:", error)
      return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
    
  } catch (err: any) {
    console.error("Feedback API Error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
