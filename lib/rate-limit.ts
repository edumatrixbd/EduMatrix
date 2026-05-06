/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Works per-process. For multi-instance deployments (e.g. Vercel),
 * swap `requestLog` with an Upstash Redis sorted set — only the
 * `checkRateLimit` function needs to change.
 *
 * Default: 60 requests per IP per minute.
 */

const WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS = 60  // per window per IP

// IP → array of timestamps (ms)
const requestLog = new Map<string, number[]>()

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number // Unix ms when window resets
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now()
  const windowStart = now - WINDOW_MS

  // Prune stale timestamps
  const timestamps = (requestLog.get(ip) ?? []).filter((t) => t > windowStart)

  if (timestamps.length >= MAX_REQUESTS) {
    const oldestInWindow = timestamps[0]
    return {
      success: false,
      remaining: 0,
      reset: oldestInWindow + WINDOW_MS,
    }
  }

  timestamps.push(now)
  requestLog.set(ip, timestamps)

  // Periodic cleanup to avoid memory leak in long-running processes
  if (Math.random() < 0.01) {
    for (const [key, ts] of requestLog.entries()) {
      if (ts.every((t) => t <= windowStart)) requestLog.delete(key)
    }
  }

  return {
    success: true,
    remaining: MAX_REQUESTS - timestamps.length,
    reset: now + WINDOW_MS,
  }
}

/** Returns 429 NextResponse with rate-limit headers, or null if OK */
import { NextRequest, NextResponse } from "next/server"

export function withRateLimit(request: NextRequest): NextResponse | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"

  const result = checkRateLimit(ip)

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
