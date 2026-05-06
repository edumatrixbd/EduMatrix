"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Video, Search, Clock, Eye } from "lucide-react"

const videos = [
  { id: 1, title: "Data Structures Basics", course: "Data Structures", duration: "45:30", views: "1.2K", date: "2 days ago" },
  { id: 2, title: "Algorithm Design Patterns", course: "Algorithms", duration: "38:15", views: "890", date: "4 days ago" },
  { id: 3, title: "Database Normalization", course: "Database Systems", duration: "52:20", views: "2.1K", date: "1 week ago" },
  { id: 4, title: "Operating System Processes", course: "OS", duration: "41:45", views: "1.5K", date: "1 week ago" },
  { id: 5, title: "Web Development Stack", course: "Web Development", duration: "56:10", views: "3.2K", date: "2 weeks ago" },
  { id: 6, title: "Software Design Patterns", course: "Software Engineering", duration: "48:30", views: "1.8K", date: "2 weeks ago" },
]

export default function VideosPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Video className="w-8 h-8 text-primary" />
            Video Lectures
          </h1>
          <p className="text-muted-foreground mt-1">Access comprehensive video lectures for all your courses</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search videos..." className="pl-10" />
      </motion.div>

      {/* Videos Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {videos.map((video) => (
          <Card key={video.id} className="hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer">
            <div className="h-40 bg-gradient-to-br from-blue-500 to-blue-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Video className="w-4 h-4 mr-2" />
                  Watch
                </Button>
              </div>
            </div>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{video.title}</CardTitle>
                  <CardDescription>{video.course}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {video.duration}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {video.views}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  )
}
