/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Works per-process. For multi-instance deployments (e.g. Vercel),
 * swap `requestLog` with an Upstash Redis sorted set — only the
 * `checkRateLimit` function needs to change.
 *
 * Default: 60 requests per IP per minute.
 */

import { NextRequest, NextResponse } from "next/server"
import { redis } from "./redis"

const WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS = 60  // per window per IP

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number // Unix ms when window resets
}

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const now = Date.now()
  const windowStart = now - WINDOW_MS
  
  const key = `rate_limit:${ip}`
  
  try {
    const pipeline = redis.pipeline()
    // Remove scores before windowStart
    pipeline.zremrangebyscore(key, 0, windowStart)
    // Get count
    pipeline.zcard(key)
    // Add current timestamp
    pipeline.zadd(key, { score: now, member: String(now) + Math.random().toString(36).substring(7) })
    // Set expiry to keep DB clean
    pipeline.expire(key, Math.ceil(WINDOW_MS / 1000))

    const results = await pipeline.exec()
    const count = results[1] as number

    if (count >= MAX_REQUESTS) {
      return {
        success: false,
        remaining: 0,
        reset: now + WINDOW_MS,
      }
    }

    return {
      success: true,
      remaining: Math.max(0, MAX_REQUESTS - (count + 1)),
      reset: now + WINDOW_MS,
    }
  } catch (error) {
    console.error("Redis rate limit error:", error)
    // Fallback to allow request if Redis is down
    return {
      success: true,
      remaining: 1,
      reset: now + WINDOW_MS,
    }
  }
}

/** Returns 429 NextResponse with rate-limit headers, or null if OK */
export async function withRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"

  const result = await checkRateLimit(ip)

  const headers = {
    "X-RateLimit-Limit": String(MAX_REQUESTS),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
  }

  if (!result.success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers }
    )
  }

  return null // OK to proceed
}
