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
  { params }: { params: { type: string } }
) {
  const supabase = await createClient()
  const tableName = tables[params.type as keyof typeof tables]

  if (!tableName) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  const supabase = await createClient()
  const tableName = tables[params.type as keyof typeof tables]
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
