"use client"

import { useState } from "react"
import useSWR from "swr"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Download, MessageSquare, Eye, Loader2 } from "lucide-react"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { swrKeys } from "@/lib/swr/keys"
import { supabaseFetcher } from "@/lib/swr/fetcher"
import { useDebounce } from "@/hooks/use-debounce"

interface SolvedAnswer {
  id: string
  title: string
  content: string | null
  file_url: string | null
  difficulty: string | null
  courses: { course_name: string; course_code: string } | null
}

export default function SolvedAnswersPage() {
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState("")
  const search = useDebounce(searchInput, 400)

  const { data, isLoading } = useSWR(
    swrKeys.solved.list(page, search),
    supabaseFetcher<SolvedAnswer>,
    { keepPreviousData: true, revalidateOnFocus: false }
  )

  const answers = data?.data ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold text-foreground">Solved Answers</h1>
        <p className="text-muted-foreground mt-1">
          Complete solutions to exam questions
          {data && <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">{data.count} solutions</span>}
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="relative">
        {isLoading ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" /> : <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
        <Input placeholder="Search solved answers..." value={searchInput} onChange={(e) => { setSearchInput(e.target.value); setPage(0) }} className="pl-10 h-10" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="space-y-4">
        {isLoading && !data && [...Array(4)].map((_, i) => (
          <Card key={i}><CardContent className="p-6"><div className="h-5 w-3/4 bg-muted animate-pulse rounded mb-2" /><div className="h-3 w-1/3 bg-muted animate-pulse rounded" /></CardContent></Card>
        ))}

        {!isLoading && answers.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">{search ? `No solved answers found for "${search}"` : "No solved answers have been uploaded yet."}</CardContent></Card>
        )}

        {answers.map((answer) => (
          <Card key={answer.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground">{answer.title}</h3>
                    {answer.difficulty && (
                      <Badge variant={answer.difficulty === "Hard" ? "destructive" : "secondary"}>{answer.difficulty}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{answer.courses?.course_name ?? "Unassigned course"}</p>
                  {answer.content && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{answer.content}</p>}
                </div>
                {answer.file_url ? (
                  <Button className="w-full sm:w-auto shrink-0" asChild>
                    <a href={answer.file_url} target="_blank" rel="noreferrer">
                      <Download className="h-4 w-4 mr-2" />Download
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full sm:w-auto shrink-0">View Solution</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
