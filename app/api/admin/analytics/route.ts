import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Check admin role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!['admin', 'super_admin'].includes(profile?.role || '')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [
      { data: popularCourses },
      { data: videoCompletion },
      { data: studentActivity },
      { data: totalStats }
    ] = await Promise.all([
      // 1. Course Popularity
      supabase.rpc('get_course_popularity'),
      
      // 2. Video Completion Rates
      supabase.from('video_progress')
        .select('video_id, video_lectures(title), completed')
        .order('updated_at', { ascending: false }),

      // 3. Student Activity (Last 50 active students)
      supabase.from('video_progress')
        .select('user_id, profiles(full_name), updated_at')
        .order('updated_at', { ascending: false })
        .limit(50),

      // 4. General Stats
      supabase.from('video_progress').select('*', { count: 'exact', head: true })
    ])

    return NextResponse.json({
      popularCourses: popularCourses || [],
      videoCompletion: videoCompletion || [],
      studentActivity: studentActivity || [],
      totalEngagement: totalStats
    })

  } catch (error) {
    console.error("Analytics API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
