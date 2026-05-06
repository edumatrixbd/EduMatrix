"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Search, BookOpen } from "lucide-react"

const suggestions = [
  { id: 1, title: "Focus on Graph Algorithms", course: "Data Structures", priority: "High", tips: 5 },
  { id: 2, title: "Practice Greedy Problems", course: "Algorithms", priority: "High", tips: 8 },
  { id: 3, title: "Master JOIN Operations", course: "Database Systems", priority: "Medium", tips: 6 },
  { id: 4, title: "Understand Deadlock Prevention", course: "OS", priority: "High", tips: 7 },
  { id: 5, title: "Learn Frontend Frameworks", course: "Web Development", priority: "Medium", tips: 9 },
  { id: 6, title: "Study Design Principles", course: "Software Engineering", priority: "Low", tips: 4 },
]

export default function SuggestionsPage() {
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
            <Lightbulb className="w-8 h-8 text-primary" />
            Exam Suggestions
          </h1>
          <p className="text-muted-foreground mt-1">Personalized suggestions to improve your exam performance</p>
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
        <Input placeholder="Search suggestions..." className="pl-10" />
      </motion.div>

      {/* Suggestions Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {suggestions.map((s) => (
          <Card key={s.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg flex-1">{s.title}</CardTitle>
                <Badge variant={s.priority === "High" ? "destructive" : s.priority === "Medium" ? "secondary" : "outline"}>
                  {s.priority}
                </Badge>
              </div>
              <CardDescription>{s.course}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                {s.tips} Study Tips
              </div>
              <Button size="sm" className="w-full">
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  )
}
