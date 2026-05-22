import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin/api-auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const supabase = auth.supabase
  const { id } = await params

  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

import { z } from "zod"
import { withRateLimit } from "@/lib/rate-limit"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await withRateLimit(request)
  if (limited) return limited

  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const supabase = auth.supabase
  const { id } = await params
  
  let body;
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const courseUpdateSchema = z.object({
    course_name: z.string().min(1).max(255).optional(),
    course_code: z.string().min(1).max(50).optional(),
    description: z.string().optional(),
    instructor: z.string().optional(),
    instructor_id: z.string().uuid().optional(),
    university_id: z.string().uuid().optional(),
    department_id: z.string().uuid().optional(),
    batch_id: z.string().uuid().optional(),
    semester_id: z.string().uuid().optional().nullable(),
    active: z.boolean().optional(),
    is_locked: z.boolean().optional(),
    thumbnail_url: z.string().url().optional().nullable(),
    price: z.number().nonnegative().optional().nullable(),
    credits: z.number().nonnegative().optional().nullable(),
    status: z.string().optional()
  }).partial()

  const parsed = courseUpdateSchema.safeParse(body)
  if (!parsed.success) {
    const errorMessages = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
    return NextResponse.json({ error: "Validation failed: " + errorMessages }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("courses")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const supabase = auth.supabase
  const { id } = await params

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
