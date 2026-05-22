import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { getLocalAdminConfig } from "@/lib/supabase/config"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

function jsonError(label: string, error: any, status = 400) {
  console.error(label, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
  })

  return NextResponse.json(
    {
      error: label,
      message: error?.message || "Unknown Supabase error",
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
    },
    { status },
  )
}

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

function universityPayload(body: any) {
  const shortName = String(body.short_name || "").trim().toUpperCase()

  return {
    name: String(body.name || "").trim(),
    short_name: shortName,
    slug: String(body.slug || shortName).trim().toLowerCase(),
    logo_url: String(body.logo_url || "").trim(),
    active: Boolean(body.active),
    locked: Boolean(body.locked),
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = universityPayload(await request.json())

  if (!payload.name || !payload.short_name) {
    return NextResponse.json({ error: "Name and short name are required" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("universities")
    .insert(payload)
    .select("id, name, short_name, slug, logo_url, active, locked")
    .single()

  if (error) return jsonError("UNIVERSITY_CREATE_ERROR", error)

  return NextResponse.json(data, { status: 201 })
}
