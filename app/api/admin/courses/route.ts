import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { withRateLimit } from "@/lib/rate-limit"
import { requireAdmin } from "@/lib/admin/api-auth"
import { z } from "zod"

const PAGE_SIZE = 20

export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request)
  if (limited) return limited

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  let query = supabase.from("courses").select("*", { count: "exact" })

  if (profile?.role === 'instructor') {
    // Only courses assigned to this instructor via the new instructor_id column
    query = query.eq('instructor_id', user.id)
  }

  const { searchParams } = request.nextUrl
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10))
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10))
  const from = page * limit
  const to = from + limit - 1

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data, count, page, totalPages: Math.ceil((count ?? 0) / limit) })
}

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request)
  if (limited) return limited

  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const supabase = auth.supabase
  let body;
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const courseSchema = z.object({
    course_name: z.string().min(1, "Course name is required").max(255),
    course_code: z.string().min(1, "Course code is required").max(50),
    description: z.string().optional(),
    instructor: z.string().optional(),
    instructor_id: z.string().uuid("Invalid instructor_id").optional().nullable(),
    university_id: z.string().uuid("Valid university_id is required"),
    department_id: z.string().uuid("Valid department_id is required"),
    batch_id: z.string().uuid("Valid batch_id is required"),
    semester_id: z.string().uuid().optional().nullable(),
    active: z.boolean().default(true),
    is_locked: z.boolean().default(false),
    thumbnail_url: z.string().url().optional().nullable(),
    price: z.number().nonnegative().optional().nullable(),
    credits: z.number().nonnegative().optional().nullable(),
    status: z.string().optional()
  })

  const parsed = courseSchema.safeParse(body)
  if (!parsed.success) {
    const errorMessages = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
    return NextResponse.json({ error: "Validation failed: " + errorMessages }, { status: 400 })
  }

  const validBody = parsed.data

  const { data, error } = await supabase
    .from("courses")
    .insert([validBody])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data[0], { status: 201 })
}
