import { NextRequest, NextResponse } from "next/server"
import { withRateLimit } from "@/lib/rate-limit"
import { requireAdmin } from "@/lib/admin/api-auth"

const typeMap: Record<string, string> = {
  videos: "video",
  questions: "previous_question",
  suggestions: "suggestion",
  notes: "note",
  solved: "solved_answer",
}

const PAGE_SIZE = 20

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const limited = await withRateLimit(request)
  if (limited) return limited

  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const supabase = auth.supabase
  const { type } = await params
  const mappedType = typeMap[type]

  if (!mappedType) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  }

  const { searchParams } = request.nextUrl
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10))
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10))
  const from = page * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from("content_materials")
    .select(`
      id,
      title,
      description,
      file_url,
      created_at,
      course:course_id(course_name),
      batch:batch_id(batch_number),
      department:department_id(name, short_name),
      university:university_id(name, short_name)
    `, { count: "exact" })
    .eq("type", mappedType)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(
    { data, count, page, totalPages: Math.ceil((count ?? 0) / limit) },
    {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    }
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const limited = await withRateLimit(request)
  if (limited) return limited

  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const supabase = auth.supabase
  const { type } = await params
  const mappedType = typeMap[type]
  const body = await request.json()

  if (!mappedType) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("content_materials")
    .insert([{ ...body, type: mappedType }])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data[0], { status: 201 })
}
