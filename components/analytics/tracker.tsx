"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function generateSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxx-xxxx-xxx-xxxx'.replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16));
}

export function AnalyticsTracker() {
  const pathname = usePathname()
  const visitIdRef = useRef<string | null>(null)

  useEffect(() => {
    // 1. Get or create session ID
    let sessionId = sessionStorage.getItem("edumatrix_session_id")
    if (!sessionId) {
      sessionId = generateSessionId()
      sessionStorage.setItem("edumatrix_session_id", sessionId)
    }

    const trackVisit = async () => {
      const supabase = createClient()
      
      // Get current user if any
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id || null

      // Insert new visit record for this page load
      const { data, error } = await supabase
        .from("website_visits")
        .insert([
          {
            session_id: sessionId,
            user_id: userId,
            path: pathname,
          }
        ])
        .select("id")
        .single()

      if (data && !error) {
        visitIdRef.current = data.id
      }
    }

    trackVisit()

    // Setup ping interval to update last_seen every 60 seconds
    const pingInterval = setInterval(async () => {
      if (visitIdRef.current) {
        const supabase = createClient()
        await supabase
          .from("website_visits")
          .update({ last_seen: new Date().toISOString() })
          .eq("id", visitIdRef.current)
      }
    }, 60000)

    // Cleanup interval on unmount or route change
    return () => {
      clearInterval(pingInterval)
    }
  }, [pathname])

  return null // Render nothing, purely background logic
}
