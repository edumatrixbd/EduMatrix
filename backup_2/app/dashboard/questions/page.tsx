"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileQuestion, Search, Zap, CheckCircle } from "lucide-react"

const questions = [
  { id: 1, title: "Tree Traversal Methods", course: "Data Structures", difficulty: "Medium", solved: true },
  { id: 2, title: "Dynamic Programming Optimization", course: "Algorithms", difficulty: "Hard", solved: false },
  { id: 3, title: "SQL Query Optimization", course: "Database Systems", difficulty: "Medium", solved: true },
  { id: 4, title: "Process Synchronization", course: "OS", difficulty: "Hard", solved: false },
  { id: 5, title: "REST API Design", course: "Web Development", difficulty: "Easy", solved: true },
  { id: 6, title: "UML Diagrams", course: "Software Engineering", difficulty: "Medium", solved: true },
]

export default function QuestionsPage() {
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
            <FileQuestion className="w-8 h-8 text-primary" />
            Previous Questions
          </h1>
          <p className="text-muted-foreground mt-1">Practice with previous exam questions</p>
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
        <Input placeholder="Search questions..." className="pl-10" />
      </motion.div>

      {/* Questions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-4"
      >
        {questions.map((q) => (
          <Card key={q.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {q.solved && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                    <h3 className="font-semibold text-foreground">{q.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{q.course}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={q.difficulty === "Hard" ? "destructive" : q.difficulty === "Medium" ? "secondary" : "outline"}>
                    {q.difficulty}
                  </Badge>
                  <Button size="sm" variant="ghost">
                    Attempt
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  )
}
