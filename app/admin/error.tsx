"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import { reportError } from "@/lib/error-logger"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to our error tracking system
    reportError('dashboard_error_boundary', error.message, { stack: error.stack })
    console.error("Dashboard Error Boundary Caught:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="p-4 rounded-full bg-destructive/10 border border-destructive/20">
        <AlertCircle className="w-12 h-12 text-destructive" />
      </div>
      
      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold text-foreground">Something went wrong</h2>
        <p className="text-muted-foreground text-sm">
          {error.message || "An unexpected error occurred while loading this page. Our team has been notified."}
        </p>
      </div>

      <div className="flex gap-4">
        <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
          Reload Page
        </Button>
        <Button onClick={() => reset()} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Try Again
        </Button>
      </div>
    </div>
  )
}
