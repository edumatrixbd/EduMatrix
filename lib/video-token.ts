import { createHmac } from "crypto"
import { getRequiredEnv } from "./env"

const VIDEO_TOKEN_SECRET = getRequiredEnv("videoTokenSecret")

export function generateVideoToken(userId: string, videoId: string, expiresInMinutes: number = 10) {
  const expiresAt = Math.floor(Date.now() / 1000) + (expiresInMinutes * 60)
  const payload = `${userId}:${videoId}:${expiresAt}`
  const signature = createHmac("sha256", VIDEO_TOKEN_SECRET)
    .update(payload)
    .digest("hex")
  
  return `${payload}:${signature}`
}

export function verifyVideoToken(token: string, userId: string, videoId: string) {
  try {
    const [tUserId, tVideoId, tExpiresAt, tSignature] = token.split(":")
    
    // 1. Verify integrity
    const payload = `${tUserId}:${tVideoId}:${tExpiresAt}`
    const expectedSignature = createHmac("sha256", VIDEO_TOKEN_SECRET)
      .update(payload)
      .digest("hex")
    
    if (tSignature !== expectedSignature) return false
    
    // 2. Verify identity and video
    if (tUserId !== userId || tVideoId !== videoId) return false
    
    // 3. Verify expiry
    const now = Math.floor(Date.now() / 1000)
    if (now > parseInt(tExpiresAt)) return false
    
    return true
  } catch (e) {
    return false
  }
}
