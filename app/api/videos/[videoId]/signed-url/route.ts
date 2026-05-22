import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSignedR2Url } from "@/lib/r2"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { videoId } = await params

    // 1. Fetch video metadata and course info with IDs
    const { data: video, error: vError } = await supabase
      .from("video_lectures")
      .select("*, courses(id, batch_id, university_id, department_id, semester)")
      .eq("id", videoId)
      .single()

    if (vError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // 2. Verify subscription using the new granular ID-based logic
    const { checkAccess } = require("@/lib/subscriptions");
    const { hasAccess, reason } = await checkAccess(user.id, {
      university_id: video.courses.university_id,
      department_id: video.courses.department_id,
      batch_id: video.courses.batch_id,
      course_id: video.courses.id,
      semester: video.courses.semester,
      category: video.category || 'mid'
    });

    if (!hasAccess) {
      return NextResponse.json({ error: reason || "Subscription required" }, { status: 403 })
    }

    // 3. Generate Secure Proxy URL with Token
    const { generateVideoToken } = require("@/lib/video-token")
    const token = generateVideoToken(user.id, videoId, 15) // 15 min token

    // The entry point is always the master manifest
    // We assume the hls_url points to the master.m3u8 key in R2
    const proxiedUrl = `/api/secure-hls/${videoId}/master.m3u8?token=${token}`

    return NextResponse.json({
      url: proxiedUrl,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // Logic for 10 min refresh
    })

  } catch (error) {
    console.error("Signed URL API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
