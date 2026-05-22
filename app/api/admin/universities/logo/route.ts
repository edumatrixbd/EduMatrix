import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { getLocalAdminConfig } from "@/lib/supabase/config"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

async function isAdminRequest() {
  const localAdmin = getLocalAdminConfig()
  const cookieStore = await cookies()
  const hasLocalAdminSession =
    Boolean(localAdmin.sessionSecret) &&
    cookieStore.get(localAdmin.cookieName)?.value === localAdmin.sessionSecret

  if (hasLocalAdminSession) return true

  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return false

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  return ["admin", "super_admin", "superadmin"].includes(String(profile?.role || "").toLowerCase())
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Logo file is required" }, { status: 400 })
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
  }

  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-")
  const fileName = `universities/${Date.now()}-${safeFileName}`
  const supabase = createAdminClient()

  const { error } = await supabase.storage
    .from("university-logos")
    .upload(fileName, file, { contentType: file.type })

  if (error) {
    console.error("UNIVERSITY_LOGO_API_UPLOAD_ERROR", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: publicUrl } = supabase
    .storage
    .from("university-logos")
    .getPublicUrl(fileName)

  return NextResponse.json({ logo_url: publicUrl.publicUrl, path: fileName })
}
