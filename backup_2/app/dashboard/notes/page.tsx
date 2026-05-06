"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Search, Download, FileText } from "lucide-react"

const notes = [
  { id: 1, title: "Binary Search Trees Complete Guide", course: "Data Structures", pages: 12, downloads: 234 },
  { id: 2, title: "Dynamic Programming Essentials", course: "Algorithms", pages: 18, downloads: 456 },
  { id: 3, title: "SQL Advanced Queries", course: "Database Systems", pages: 15, downloads: 178 },
  { id: 4, title: "OS Process Management", course: "OS", pages: 20, downloads: 312 },
  { id: 5, title: "React Hooks Deep Dive", course: "Web Development", pages: 16, downloads: 523 },
  { id: 6, title: "UML & Design Patterns", course: "Software Engineering", pages: 14, downloads: 267 },
]

export default function NotesPage() {
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
            <BookOpen className="w-8 h-8 text-primary" />
            Study Notes
          </h1>
          <p className="text-muted-foreground mt-1">Comprehensive study notes for all courses</p>
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
        <Input placeholder="Search notes..." className="pl-10" />
      </motion.div>

      {/* Notes Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {notes.map((note) => (
          <Card key={note.id} className="hover:shadow-lg transition-shadow">
            <div className="h-32 bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <FileText className="w-12 h-12 text-white opacity-50" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">{note.title}</CardTitle>
              <CardDescription>{note.course}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {note.pages} pages • {note.downloads} downloads
              </div>
              <Button size="sm" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  )
}
