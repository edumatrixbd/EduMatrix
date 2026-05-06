import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

const tables = {
  videos: "video_lectures",
  questions: "previous_questions",
  suggestions: "exam_suggestions",
  notes: "study_notes",
  solved: "solved_answers",
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const supabase = await createClient()
  const { type, id } = await params
  const tableName = tables[type as keyof typeof tables]

  if (!tableName) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from(tableName)
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
  const supabase = await createClient()
  const { type, id } = await params
  const tableName = tables[type as keyof typeof tables]
  const body = await request.json()

  if (!tableName) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from(tableName)
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
  const supabase = await createClient()
  const { type, id } = await params
  const tableName = tables[type as keyof typeof tables]

  if (!tableName) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  }

  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
