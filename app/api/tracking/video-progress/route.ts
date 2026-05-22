import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function logProgressError(label: string, error: any) {
  console.error(label, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
  })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { videoId, courseId, lastPosition, totalDuration, watchedSeconds } = await request.json()

    if (!videoId || !courseId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const safeLastPosition = Number.isFinite(Number(lastPosition)) ? Math.max(0, Math.round(Number(lastPosition))) : 0
    const safeTotalDuration = Number.isFinite(Number(totalDuration)) ? Math.max(0, Math.round(Number(totalDuration))) : 0
    const safeWatchedSeconds = Number.isFinite(Number(watchedSeconds)) ? Math.max(0, Math.round(Number(watchedSeconds))) : safeLastPosition
    const progressPercentage = safeTotalDuration > 0
      ? Math.min(100, Math.max(0, Math.round((safeLastPosition / safeTotalDuration) * 100)))
      : 0
    const isCompleted = progressPercentage >= 90

    const { data: legacyVideo, error: legacyVideoError } = await supabase
      .from('video_lectures')
      .select('id')
      .eq('id', videoId)
      .maybeSingle()

    if (legacyVideoError) throw legacyVideoError

    if (!legacyVideo) {
      const { data: contentVideo } = await supabase
        .from('content_materials')
        .select('id')
        .eq('id', videoId)
        .eq('type', 'video')
        .maybeSingle()

      if (contentVideo) {
        return NextResponse.json({
          success: true,
          completed: isCompleted,
          tracked: false,
          reason: "Unified content video progress table is not configured",
        })
      }

      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    const { error } = await supabase
      .from('video_progress')
      .upsert({
        user_id: user.id,
        video_id: videoId,
        course_id: courseId,
        last_position: safeLastPosition,
        total_duration: safeTotalDuration,
        watched_seconds: safeWatchedSeconds,
        progress_percentage: progressPercentage,
        completed: isCompleted,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, video_id' })

    if (error) {
      if (error.code === '23503') {
        return NextResponse.json({
          success: true,
          completed: isCompleted,
          tracked: false,
          reason: "Video progress foreign key does not match this video source",
        })
      }

      throw error
    }

    return NextResponse.json({ success: true, completed: isCompleted, tracked: true })

  } catch (error) {
    logProgressError("Video Progress Tracking Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get("videoId")

    if (!videoId) return NextResponse.json({ error: "Video ID required" }, { status: 400 })

    const { data: legacyVideo, error: legacyVideoError } = await supabase
      .from('video_lectures')
      .select('id')
      .eq('id', videoId)
      .maybeSingle()

    if (legacyVideoError) throw legacyVideoError

    if (!legacyVideo) {
      return NextResponse.json({ last_position: 0, completed: false, tracked: false })
    }

    const { data, error } = await supabase
      .from('video_progress')
      .select('last_position, completed')
      .eq('user_id', user.id)
      .eq('video_id', videoId)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json(data || { last_position: 0, completed: false })

  } catch (error) {
    logProgressError("Video Progress Fetch Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
