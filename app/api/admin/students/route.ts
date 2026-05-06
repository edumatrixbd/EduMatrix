import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { withRateLimit } from "@/lib/rate-limit"

const PAGE_SIZE = 50

export async function GET(request: NextRequest) {
  const limited = withRateLimit(request)
  if (limited) return limited

  const supabase = await createClient()
  const { searchParams } = request.nextUrl
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10))
  const limit = Math.min(200, parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10))
  const from = page * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data, count, page, totalPages: Math.ceil((count ?? 0) / limit) })
}

export async function POST(request: NextRequest) {
  const limited = withRateLimit(request)
  if (limited) return limited

  const supabase = await createClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from("profiles")
    .insert([body])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data[0], { status: 201 })
}
