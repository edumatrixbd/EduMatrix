import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getSignedUploadUrl, uploadR2Object } from "@/lib/r2"
import { getR2PublicUrl } from "@/lib/env"
import { v4 as uuidv4 } from 'uuid'
import { withRateLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"

function getFileExtension(fileName: string, contentType: string) {
  const extension = fileName.split(".").pop()
  if (extension && extension !== fileName) {
    return extension.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "bin"
  }

  const mimeExtension = contentType.split("/").pop()
  return mimeExtension?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "bin"
}

function getStoragePrefix(type: unknown) {
  return String(type || "videos").replace(/[^a-zA-Z0-9_-]/g, "_")
}

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request)
  if (limited) return limited

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Only admins, superadmins or instructors can upload
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const allowedRoles = ['admin', 'superadmin', 'super_admin', 'instructor']
  const isAllowed = profile && allowedRoles.includes(profile.role)

  console.log("UPLOAD AUTH CHECK:", {
    userId: user.id,
    email: user.email,
    role: profile?.role,
    isAllowed,
    reason: !profile ? "No profile found" : (!isAllowed ? "Insufficient role permissions" : "Authorized")
  })

  if (!isAllowed) {
    return NextResponse.json({
      error: "Forbidden",
      details: `Role '${profile?.role}' is not authorized to upload content.`
    }, { status: 403 })
  }

  const requestContentType = request.headers.get("content-type") || ""

  if (requestContentType.includes("multipart/form-data")) {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof Blob) || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "Missing uploaded file" }, { status: 400 })
    }

    const uploadFile = file as File
    const contentType = uploadFile.type || "application/octet-stream"
    const fileExt = getFileExtension(uploadFile.name || "upload", contentType)
    const fileKey = `${getStoragePrefix(formData.get("type"))}/${uuidv4()}.${fileExt}`
    const buffer = Buffer.from(await uploadFile.arrayBuffer())
    const uploaded = await uploadR2Object(fileKey, buffer, contentType)

    if (!uploaded.ok) {
      return NextResponse.json({ error: uploaded.error || "Failed to upload file to storage" }, { status: 500 })
    }

    const fileUrl = getR2PublicUrl(fileKey)
    if (!fileUrl) {
      return NextResponse.json({ error: "R2_PUBLIC_URL is not configured." }, { status: 500 })
    }

    return NextResponse.json({ fileKey, fileUrl })
  }

  if (!requestContentType.includes("application/json")) {
    return NextResponse.json({ error: "Expected multipart form data or JSON upload metadata" }, { status: 400 })
  }

  let body: { fileName?: string; contentType?: string; type?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { fileName, contentType, type } = body

  if (!fileName || !contentType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const fileExt = getFileExtension(fileName, contentType)
  const fileKey = `${getStoragePrefix(type)}/${uuidv4()}.${fileExt}`

  const uploadUrl = await getSignedUploadUrl(fileKey, contentType)

  if (!uploadUrl) {
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 })
  }

  const fileUrl = getR2PublicUrl(fileKey)

  return NextResponse.json({ uploadUrl, fileKey, fileUrl })
}
