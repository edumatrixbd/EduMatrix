import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { withRateLimit } from "@/lib/rate-limit"

const tables: Record<string, string> = {
  videos: "video_lectures",
  questions: "previous_questions",
  suggestions: "exam_suggestions",
  notes: "study_notes",
  solved: "solved_answers",
}

const PAGE_SIZE = 20

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const limited = withRateLimit(request)
  if (limited) return limited

  const supabase = await createClient()
  const { type } = await params
  const tableName = tables[type]

  if (!tableName) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  }

  const { searchParams } = request.nextUrl
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10))
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10))
  const from = page * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from(tableName)
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(
    { data, count, page, totalPages: Math.ceil((count ?? 0) / limit) },
    {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    }
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const limited = withRateLimit(request)
  if (limited) return limited

  const supabase = await createClient()
  const { type } = await params
  const tableName = tables[type]
  const body = await request.json()

  if (!tableName) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from(tableName)
    .insert([body])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data[0], { status: 201 })
}
