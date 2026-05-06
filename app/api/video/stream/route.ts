import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getSignedR2Url } from "@/lib/r2"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const videoId = searchParams.get("videoId")
  const fileKey = searchParams.get("key")

  if (!fileKey) {
    return NextResponse.json({ error: "Missing file key" }, { status: 400 })
  }

  // Optional: Check if student is enrolled in the course that contains this video
  // For now, we trust authenticated students
  
  const signedUrl = await getSignedR2Url(fileKey)

  if (!signedUrl) {
    return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 })
  }

  return NextResponse.json({ url: signedUrl })
}
