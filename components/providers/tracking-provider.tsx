"use client"

import { useTracking } from "@/hooks/use-tracking"

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  // Initialize tracking
  useTracking()
  
  return <>{children}</>
}
