import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!["open", "reviewed", "fixed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Verify Admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    const role = String(profile?.role || "").toLowerCase()
    if (!["admin", "super_admin", "superadmin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update using admin client
    const db = createAdminClient()
    const { error } = await db
      .from("material_feedback")
      .update({ status })
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Admin Feedback API Error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
