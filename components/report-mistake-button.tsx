"use client"

import { useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ReportMistakeButtonProps {
  materialType: "video" | "note" | "question" | "solved_answer" | "suggestion" | "course_material"
  materialId?: string
  materialTitle?: string
  className?: string
  variant?: "default" | "outline" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ReportMistakeButton({
  materialType,
  materialId,
  materialTitle,
  className,
  variant = "outline",
  size = "sm"
}: ReportMistakeButtonProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Please describe the mistake")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material_type: materialType,
          material_id: materialId || null,
          message: message.trim(),
          page_url: window.location.href,
        })
      })

      const text = await response.text()
      let data: any = {}
      if (text) {
        try {
          data = JSON.parse(text)
        } catch (e) {
          console.error("Failed to parse feedback response:", e)
        }
      }

      if (!response.ok) {
        throw new Error(data.error || `Failed to submit feedback (${response.status})`)
      }

      toast.success("Feedback submitted. Thank you!")
      setOpen(false)
      setMessage("")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <AlertTriangle className="w-4 h-4 mr-2" />
          Report a Mistake
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-white/10 text-card-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#FF3B30]">
            <AlertTriangle className="w-5 h-5" />
            Report a Mistake
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            Found an error in {materialTitle ? `"${materialTitle}"` : "this material"}? Describe it below so we can fix it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Describe the issue... (e.g. at 5:23 the formula is wrong)"
            className="min-h-[120px] bg-background border-white/10 focus-visible:ring-[#FF3B30]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !message.trim()}
            className="bg-[#FF3B30] text-white hover:bg-[#FF3B30]/90"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
