import { getR2PublicUrl } from "@/lib/env"

export async function uploadContentFile(file: File, type: string) {
  // 1. Request Signed URL from Server
  const response = await fetch("/api/video/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      type: type,
    }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error || "Failed to generate secure upload URL")
  }

  if (!data?.uploadUrl || !data?.fileKey) {
    throw new Error("Server did not return a valid signed URL or file key.")
  }

  const { uploadUrl, fileKey } = data

  // 2. Upload file directly to R2 using the Signed URL
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  })

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload directly to storage (Status: ${uploadResponse.status})`)
  }

  // 3. Reconstruct public URL manually or let the caller use the fileKey
  // Since we don't have getR2PublicUrl directly on the client if it's dependent on server envs,
  // we can reconstruct it from NEXT_PUBLIC envs, or have the server return it.
  // Wait, let's just make the server return the fileUrl alongside the uploadUrl.
  
  return { fileKey, fileUrl: data.fileUrl }
}
