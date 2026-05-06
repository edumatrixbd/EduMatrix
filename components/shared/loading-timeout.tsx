"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCcw, AlertCircle } from "lucide-react"

interface LoadingTimeoutProps {
  timeout?: number
  message?: string
}

export function LoadingTimeout({ 
  timeout = 8000, 
  message = "This is taking longer than expected..." 
}: LoadingTimeoutProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true)
    }, timeout)

    return () => clearTimeout(timer)
  }, [timeout])

  if (!show) return null

  return (
    <div className="mt-8 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
      <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full mb-4">
        <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
      </div>
      <p className="text-sm font-medium text-foreground mb-4">{message}</p>
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Reload Page
        </Button>
      </div>
    </div>
  )
}
