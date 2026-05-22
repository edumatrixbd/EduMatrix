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

function allowedPatch(body: any) {
  const patch: Record<string, string | boolean> = {}

  if ("name" in body) patch.name = String(body.name || "").trim()
  if ("short_name" in body) patch.short_name = String(body.short_name || "").trim().toUpperCase()
  if ("slug" in body) patch.slug = String(body.slug || body.short_name || "").trim().toLowerCase()
  if ("logo_url" in body) patch.logo_url = String(body.logo_url || "").trim()
  if ("active" in body) patch.active = Boolean(body.active)
  if ("locked" in body) patch.locked = Boolean(body.locked)

  return patch
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const patch = allowedPatch(await request.json())

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No supported university fields supplied" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("universities")
    .update(patch)
    .eq("id", id)
    .select("id, name, short_name, slug, logo_url, active, locked")
    .single()

  if (error) return jsonError("UNIVERSITY_UPDATE_ERROR", error)

  return NextResponse.json(data)
}
