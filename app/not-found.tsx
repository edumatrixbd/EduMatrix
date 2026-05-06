"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GraduationCap, ArrowLeft, SearchX } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-card border border-border shadow-premium rounded-2xl p-8 text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 shadow-sm border border-border">
          <SearchX className="w-10 h-10 text-muted-foreground" />
        </div>
        
        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary/50 mb-4 drop-shadow-sm">
          404
        </h1>
        
        <h2 className="text-2xl font-bold text-foreground mb-3 tracking-tight">
          Lost in the campus?
        </h2>
        
        <p className="text-muted-foreground mb-8 text-balance">
          We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in our curriculum.
        </p>

        <div className="flex flex-col w-full gap-3">
          <Link href="/dashboard" className="w-full">
            <Button className="w-full h-11 flex items-center justify-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Return to Dashboard
            </Button>
          </Link>
          <Button variant="ghost" className="w-full h-11 text-muted-foreground" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go back
          </Button>
        </div>
      </div>
    </div>
  )
}
