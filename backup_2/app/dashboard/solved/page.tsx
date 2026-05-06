"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Download, MessageSquare, Eye } from "lucide-react"

const solvedAnswers = [
  { id: 1, title: "Data Structures - Final 2024", course: "Data Structures", difficulty: "Hard", views: 1250, comments: 45, downloads: 320 },
  { id: 2, title: "Database Systems - Midterm 2024", course: "Database Systems", difficulty: "Medium", views: 980, comments: 32, downloads: 210 },
  { id: 3, title: "Web Development - Final 2023", course: "Web Development", difficulty: "Medium", views: 1100, comments: 28, downloads: 280 },
  { id: 4, title: "Operating Systems - Previous Year", course: "Operating Systems", difficulty: "Hard", views: 850, comments: 25, downloads: 180 },
  { id: 5, title: "Database Normalization - Solutions", course: "Database Systems", difficulty: "Medium", views: 650, comments: 18, downloads: 140 },
  { id: 6, title: "Algorithm Analysis - Solved Problems", course: "Data Structures", difficulty: "Hard", views: 920, comments: 35, downloads: 240 },
]

export default function SolvedAnswersPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Solved Answers</h1>
          <p className="text-muted-foreground mt-1">Complete solutions to exam questions</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search solved answers..."
          className="pl-10 h-10"
        />
      </motion.div>

      {/* Solved Answers List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="space-y-4"
      >
        {solvedAnswers.map((answer) => (
          <Card key={answer.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground">{answer.title}</h3>
                    <Badge variant={answer.difficulty === "Hard" ? "destructive" : "secondary"}>
                      {answer.difficulty}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{answer.course}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{answer.views} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{answer.comments} comments</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      <span>{answer.downloads} downloads</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  )
}
