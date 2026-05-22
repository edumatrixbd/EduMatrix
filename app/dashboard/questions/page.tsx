"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileQuestion, Search, Download, CheckCircle, Clock, Lock } from "lucide-react"
import { Empty, EmptyMedia, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { usePaidAccess } from "@/hooks/use-paid-access"
import { ReportMistakeButton } from "@/components/report-mistake-button"

interface Question {
  id: string
  question_text: string
  exam_type: string | null
  exam_year: number | null
  question_number: number | null
  file_url: string | null
  courses: {
    course_name: string
    course_code: string
  } | null
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const access = usePaidAccess()

  useEffect(() => {
    const fetchQuestions = async () => {
      if (access.loading) return
      if (!access.hasAccess) {
        setQuestions([])
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()
        setLoading(true)
        const { data, error } = await supabase
          .from("previous_questions")
          .select("id, question_text, exam_type, question_number, file_url, courses(course_name, course_code)")
          .order("question_number", { ascending: true })
          .order("created_at", { ascending: false })

        if (error) throw error
        setQuestions((data ?? []) as unknown as Question[])
      } catch (error) {
        console.error("Error fetching questions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [access.loading, access.hasAccess])

  const filteredQuestions = questions.filter((question) => {
    const query = searchTerm.toLowerCase()
    return (
      question.question_text.toLowerCase().includes(query) ||
      (question.exam_type ?? "").toLowerCase().includes(query) ||
      (question.courses?.course_name ?? "").toLowerCase().includes(query) ||
      (question.courses?.course_code ?? "").toLowerCase().includes(query)
    )
  })

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

      {access.loading || loading && access.hasAccess ? null : !access.hasAccess ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-dashed p-10 text-center flex flex-col items-center gap-5"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            {access.isPending ? <Clock className="w-8 h-8 text-primary" /> : <Lock className="w-8 h-8 text-primary" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {access.isPending ? "Waiting for your payment approval" : "Upgrade your plan"}
            </h2>
            <p className="text-muted-foreground max-w-md mt-2">
              {access.isPending
                ? "Your payment is waiting for admin approval. Access will unlock after approval."
                : "You need an active subscription to access previous questions."}
            </p>
          </div>
          {!access.isPending && (
            <Button asChild>
              <Link href="/dashboard/billing">Upgrade Your Plan</Link>
            </Button>
          )}
        </motion.div>
      ) : (
        <>
      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="pl-10"
        />
      </motion.div>

      {/* Questions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-4"
      >
        {loading && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">Loading questions...</CardContent>
          </Card>
        )}

        {!loading && filteredQuestions.length === 0 && (
          <Empty className="py-12 border border-dashed rounded-xl">
            <EmptyMedia variant="icon">
              <FileQuestion className="w-5 h-5 text-muted-foreground" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No questions found</EmptyTitle>
              <EmptyDescription>
                {searchTerm 
                  ? `We couldn't find any questions matching "${searchTerm}". Try a broader term.` 
                  : "No previous questions have been uploaded for this category yet."}
              </EmptyDescription>
            </EmptyHeader>
            {searchTerm && (
              <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
            )}
          </Empty>
        )}

        {!loading && filteredQuestions.map((q) => (
          <Card key={q.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {q.file_url && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                    <h3 className="font-semibold text-foreground">
                      {q.question_text}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {q.courses?.course_name ?? "Unassigned course"}
                    {q.question_number ? ` • Question ${q.question_number}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {q.exam_type ?? "Exam"}
                  </Badge>
                  {q.file_url ? (
                    <Button size="sm" variant="ghost" asChild>
                      <a href={q.file_url} target="_blank" rel="noreferrer">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </a>
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost">View</Button>
                  )}
                  <ReportMistakeButton 
                    materialType="question"
                    materialId={q.id}
                    materialTitle={q.question_text}
                    variant="ghost"
                    className="text-muted-foreground hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 ml-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
        </>
      )}
    </div>
  )
}
