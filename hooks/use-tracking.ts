"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { usePathname } from "next/navigation"

export type ActivityFeature = 'video' | 'notes' | 'questions' | 'solves' | 'study_zone' | 'search' | 'download'
export type ActivityAction = 'view' | 'open' | 'watch' | 'search' | 'download'

export function useTracking() {
  const supabase = createClient()
  const pathname = usePathname()
  const sessionStartTime = useRef<number>(Date.now())
  const currentSessionId = useRef<string | null>(null)
  const isStarting = useRef(false)

  // Function to log a specific activity
  const logActivity = async (feature: ActivityFeature, action: ActivityAction, metadata: any = {}) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      await supabase.from("activity_logs").insert({
        student_id: session.user.id,
        feature,
        action,
        metadata: {
          ...metadata,
          path: pathname,
          timestamp: new Date().toISOString()
        }
      })

      // Also log to the new unified material_views if an ID is present
      if (metadata.id || metadata.video_id) {
        let sessionId = sessionStorage.getItem("tensionনাই_session_id")
        if (sessionId) {
          await supabase.from("material_views").insert({
            session_id: sessionId,
            user_id: session.user.id,
            material_id: metadata.id || metadata.video_id,
          })
        }
      }
    } catch (error) {
      console.error("Error logging activity:", error)
    }
  }

  // Session tracking logic
  useEffect(() => {
    if (isStarting.current) return
    isStarting.current = true

    let interval: NodeJS.Timeout
    
    const startSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user
        if (!user) {
          isStarting.current = false
          return
        }

        // Create a new usage session
        const { data, error } = await supabase
          .from("usage_sessions")
          .insert({
            student_id: user.id,
            feature: pathname.split('/')[2] || 'dashboard',
            start_time: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (data) {
          currentSessionId.current = data.id
          
          // Heartbeat to update duration
          interval = setInterval(async () => {
            const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000)
            await supabase
              .from("usage_sessions")
              .update({ 
                end_time: new Date().toISOString(),
                duration_seconds: duration 
              })
              .eq('id', currentSessionId.current)
          }, 30000) // Update every 30 seconds
        }
      } catch (error) {
        console.error("Error starting usage session:", error)
      } finally {
        isStarting.current = false
      }
    }

    startSession()

    return () => {
      if (interval) clearInterval(interval)
      isStarting.current = false
      
      // Final update on unmount
      if (currentSessionId.current) {
        const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000)
        supabase
          .from("usage_sessions")
          .update({ 
            end_time: new Date().toISOString(),
            duration_seconds: duration 
          })
          .eq('id', currentSessionId.current)
          .then(() => {})
      }
    }
  }, [pathname])

  return { logActivity }
}
