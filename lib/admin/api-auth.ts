import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ADMIN_ROLES = new Set(["admin", "super_admin", "superadmin"])

export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      supabase,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || !ADMIN_ROLES.has(String(profile?.role ?? "").toLowerCase())) {
    return {
      supabase,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return { supabase, user, profile, response: null }
}

export async function requireSuperAdmin() {
  const auth = await requireAdmin()
  if (auth.response) return auth

  const role = String(auth.profile?.role ?? "").toLowerCase()
  if (role !== "super_admin" && role !== "superadmin") {
    return {
      ...auth,
      response: NextResponse.json({ error: "Forbidden: Superadmin access required" }, { status: 403 }),
    }
  }

  return auth
}
