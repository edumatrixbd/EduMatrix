"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, CheckCircle, FileQuestion, FileText, Lightbulb, Upload, Video } from "lucide-react"

const uploadTypes = [
  { href: "/admin/content/videos/add", title: "Video Lecture", icon: Video, badge: "URL" },
  { href: "/admin/content/questions/add", title: "Previous Question", icon: FileQuestion, badge: "PDF/Text" },
  { href: "/admin/content/suggestions/add", title: "Exam Suggestion", icon: Lightbulb, badge: "Guide" },
  { href: "/admin/content/notes/add", title: "Study Note", icon: FileText, badge: "PDF/Text" },
  { href: "/admin/content/solved/add", title: "Solved Answer", icon: CheckCircle, badge: "Solution" },
]

export default function UploadPage() {
  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Upload Content</h1>
        <p className="text-muted-foreground mt-1">Choose what type of learning material to add</p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Content Shortcuts
          </CardTitle>
          <CardDescription>Storage uploads can be added later; current forms support public file URLs.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {uploadTypes.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="rounded-lg border p-5 hover:border-primary/50 hover:bg-muted/40 transition-colors h-full">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <Badge variant="secondary">{item.badge}</Badge>
                </div>
                <h3 className="font-semibold mt-4">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">Open the add form</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Link href="/admin/courses/add">
        <Button variant="outline">
          <BookOpen className="w-4 h-4 mr-2" />
          Add Course First
        </Button>
      </Link>
    </div>
  )
}
