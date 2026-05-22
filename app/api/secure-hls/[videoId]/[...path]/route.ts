import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyVideoToken } from "@/lib/video-token"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { assertR2Config } from "@/lib/env"
import { getLatestSubscriptionAccess } from "@/lib/paid-access"
import { createR2Client } from "@/lib/r2"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ videoId: string; path: string[] }> }
) {
  try {
    const { videoId, path } = await params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    // 1. Basic auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response("Unauthorized", { status: 401 })

    // 2. Token verification
    if (!token || !verifyVideoToken(token, user.id, videoId)) {
      return new Response("Invalid or expired token", { status: 403 })
    }

    // 3. Subscription check (authoritative)
    const access = await getLatestSubscriptionAccess(supabase, user.id)
    
    if (!access.hasAccess) {
      if (access.isPending) {
        return new Response("Your payment is waiting for admin approval. Access will unlock after approval.", { status: 403 })
      }

      // Check if admin/instructor
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
      if (!profile || !['admin', 'super_admin', 'instructor'].includes(profile.role)) {
        return new Response("Forbidden: Subscription required", { status: 403 })
      }
    }

    // 4. Resolve R2 Key
    // The 'path' starts after [videoId]. Example: ['master.m3u8'] or ['720p', 'index.m3u8']
    // We need to know where the HLS files are stored in R2. 
    // Assuming they are in a folder named after the videoId or the hls_key.
    const { data: video } = await supabase.from("video_lectures").select("hls_url").eq("id", videoId).single()
    if (!video?.hls_url) return new Response("Video source not configured", { status: 404 })

    // hls_url is usually something like "videos/hls/my-video/master.m3u8"
    // The requested path is relative to the directory of hls_url.
    const baseDir = video.hls_url.split("/").slice(0, -1).join("/")
    const fullPath = `${baseDir}/${path.join("/")}`
    const r2Config = assertR2Config()

    // 5. Fetch from R2
    const command = new GetObjectCommand({
      Bucket: r2Config.bucketName,
      Key: fullPath,
    })

    const response = await createR2Client(r2Config).send(command)
    const contentType = response.ContentType || "application/octet-stream"

    // 6. Handle Manifest Rewriting (for .m3u8 files)
    if (fullPath.endsWith(".m3u8")) {
      let content = await response.Body?.transformToString()
      if (!content) return new Response("Empty manifest", { status: 500 })

      // Rewrite relative URLs to include the token
      // This is a simple regex that looks for lines not starting with # and appends ?token=...
      // Or appends &token=... if ? already exists.
      const lines = content.split("\n")
      const rewrittenLines = lines.map(line => {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith("#")) {
          const separator = trimmed.includes("?") ? "&" : "?"
          return `${trimmed}${separator}token=${token}`
        }
        return line
      })

      return new Response(rewrittenLines.join("\n"), {
        headers: { "Content-Type": "application/vnd.apple.mpegurl" }
      })
    }

    // 7. Serve Chunks Directly
    return new Response(response.Body as any, {
      headers: { 
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600" 
      }
    })

  } catch (error) {
    console.error("Secure HLS Proxy Error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
