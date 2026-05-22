"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Video, FileQuestion, Lightbulb, BookOpen, CheckCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const contentTypes = [
  { id: "videos", label: "Video Lectures", icon: Video, color: "from-[#FFB00F] to-[#FFB00F]/80" },
  { id: "questions", label: "Previous Questions", icon: FileQuestion, color: "from-[#FF3B30] to-[#FF3B30]/80" },
  { id: "suggestions", label: "Exam Suggestions", icon: Lightbulb, color: "from-[#FFB00F] to-[#FFB00F]/60" },
  { id: "notes", label: "Study Notes", icon: BookOpen, color: "from-slate-700 to-slate-900" },
  { id: "solved", label: "Solved Answers", icon: CheckCircle, color: "from-pink-500 to-pink-600" },
]

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState("videos")

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Manage Content</h1>
        <p className="text-muted-foreground mt-1">Add, edit, or remove learning materials</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            {contentTypes.map((type) => (
              <TabsTrigger key={type.id} value={type.id} className="text-xs">
                <type.icon className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{type.label.split(" ")[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {contentTypes.map((type) => (
            <TabsContent key={type.id} value={type.id} className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{type.label}</h2>
                  <p className="text-muted-foreground">Manage all {type.label.toLowerCase()}</p>
                </div>
                <Link href={`/admin/content/${type.id}/add`}>
                  <Button>
                    + Add {type.label.split(" ")[0]}
                  </Button>
                </Link>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All {type.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ContentList type={type.id} />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </div>
  )
}

function ContentList({ type }: { type: string }) {
  const [content, setContent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchContent()
  }, [type])

  const fetchContent = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/content/${type}`)
      const text = await response.text()
      let result: any = {}
      if (text) {
        try {
          result = JSON.parse(text)
        } catch (e) {
          console.error("Failed to parse admin content response:", e)
        }
      }
      
      if (!response.ok || !result || !Array.isArray(result.data)) {
        setError(result?.error ?? `Could not load ${type}. Server returned ${response.status}`)
        setContent([])
        return
      }
      setContent(result.data)
      setError(null)
    } catch (error) {
      console.error("Error fetching content:", error)
      setError(`Could not connect to the ${type} API.`)
      setContent([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content? This action cannot be undone.")) return
    
    const toastId = toast.loading("Deleting content...")
    try {
      const response = await fetch(`/api/admin/content/${type}/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete content")
      
      setContent(content.filter(c => c.id !== id))
      toast.success("Content deleted successfully", { id: toastId })
    } catch (error: any) {
      console.error("Error deleting content:", error)
      toast.error(error.message || "Failed to delete content", { id: toastId })
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-destructive">{error}</div>
  }

  if (content.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No content found</div>
  }

  return (
    <div className="space-y-3">
      {content.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50">
          <div>
            <p className="font-semibold">{item.title || item.question_text || item.content || "Untitled"}</p>
            <p className="text-sm text-slate-500 mt-1">
              {item.university?.short_name || item.university?.name || "N/A"} • {item.department?.short_name || item.department?.name || "N/A"} • Batch {item.batch?.batch_number || "N/A"}
              {item.course?.course_name ? ` • ${item.course.course_name}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/content/${type}/${item.id}`}>
              <Button variant="ghost" size="sm">Edit</Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(item.id)}
              className="text-destructive"
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
