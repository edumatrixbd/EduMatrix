import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSignedR2Url } from "@/lib/r2"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const { data: video, error } = await supabase
      .from("content_materials")
      .select("file_key, file_url")
      .eq("id", id)
      .eq("type", "video")
      .single()

    if (error || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    if (!video.file_key) {
      // If no file_key but has file_url (e.g. YouTube), redirect to that
      if (video.file_url) {
        return NextResponse.redirect(video.file_url)
      }
      return NextResponse.json({ error: "No video source found" }, { status: 404 })
    }

    // Generate secure expiring URL for R2 directly
    const signedUrl = await getSignedR2Url(video.file_key, 14400) // 4 hours
    
    if (!signedUrl) {
      return NextResponse.json({ error: "Could not secure video stream" }, { status: 500 })
    }

    return NextResponse.redirect(signedUrl)
  } catch (err) {
    console.error("Play video API Error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
