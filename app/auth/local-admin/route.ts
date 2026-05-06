import { getLocalAdminConfig } from "@/lib/supabase/config"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { username, password } = await request.json()
  const config = getLocalAdminConfig()

  const isConfigured = Boolean(config.username && config.password && config.sessionSecret)
  const isValid =
    isConfigured &&
    username === config.username &&
    password === config.password

  if (!isValid) {
    return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(config.cookieName, config.sessionSecret!, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  })

  return response
}
