import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin/api-auth"

const typeMap: Record<string, string> = {
  videos: "video",
  questions: "previous_question",
  suggestions: "suggestion",
  notes: "note",
  solved: "solved_answer",
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const supabase = auth.supabase
  const { type, id } = await params
  const mappedType = typeMap[type]

  if (!mappedType) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("content_materials")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const supabase = auth.supabase
  const { type, id } = await params
  const mappedType = typeMap[type]
  const body = await request.json()

  if (!mappedType) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("content_materials")
    .update(body)
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
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const supabase = auth.supabase
  const { type, id } = await params
  const mappedType = typeMap[type]

  if (!mappedType) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  }

  const { error } = await supabase
    .from("content_materials")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
