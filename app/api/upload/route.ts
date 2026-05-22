import { NextResponse } from "next/server"
import crypto from "crypto"
import { uploadR2Object } from "@/lib/r2"
import { getR2PublicUrl } from "@/lib/env"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique file key
    const uniqueId = crypto.randomBytes(8).toString("hex")
    const extension = file.name.split('.').pop()
    const fileKey = `${uniqueId}-${Date.now()}.${extension}`

    const uploaded = await uploadR2Object(fileKey, buffer, file.type || "application/octet-stream")

    if (!uploaded.ok) {
      return NextResponse.json(
        { error: uploaded.error || "Failed to upload file to storage" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      file_key: fileKey,
      file_url: getR2PublicUrl(fileKey),
      message: "File uploaded to Cloudflare R2 successfully"
    })

  } catch (error: any) {
    console.error("R2 Upload Error:", error)
    return NextResponse.json(
      { error: "Failed to upload file to storage" },
      { status: 500 }
    )
  }
}
