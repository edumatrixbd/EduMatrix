"use client"

import { useState } from "react"
import useSWR from "swr"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookOpen, Search, Download, FileText, Loader2 } from "lucide-react"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { swrKeys } from "@/lib/swr/keys"
import { supabaseFetcher } from "@/lib/swr/fetcher"
import { useDebounce } from "@/hooks/use-debounce"

interface Note {
  id: string
  title: string
  content: string
  file_url: string | null
  topic: string | null
  courses: {
    course_name: string
    course_code: string
  } | null
}

export default function NotesPage() {
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState("")
  const search = useDebounce(searchInput, 400)

  const { data, isLoading } = useSWR(
    swrKeys.notes.list(page, search),
    supabaseFetcher<Note>,
    { keepPreviousData: true, revalidateOnFocus: false }
  )

  const notes = data?.data ?? []
  const totalPages = data?.totalPages ?? 0

  const handleSearch = (val: string) => {
    setSearchInput(val)
    setPage(0)
  }

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
          <p className="text-muted-foreground mt-1">
            Comprehensive study notes for all courses
            {data && (
              <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                {data.count} notes
              </span>
            )}
          </p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative"
      >
        {isLoading ? (
          <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        ) : (
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        )}
        <Input
          placeholder="Search notes by title..."
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </motion.div>

      {/* Notes Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {isLoading && !data && (
          <>
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-32 bg-muted animate-pulse" />
                <CardHeader>
                  <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-muted animate-pulse rounded mt-1" />
                </CardHeader>
                <CardContent>
                  <div className="h-9 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {!isLoading && notes.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="p-8 text-center text-muted-foreground">
              {search ? `No notes found for "${search}"` : "No study notes have been uploaded yet."}
            </CardContent>
          </Card>
        )}

        {notes.map((note) => (
          <Card key={note.id} className="hover:shadow-lg transition-shadow">
            <div className="h-32 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <FileText className="w-12 h-12 text-white opacity-50" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">{note.title}</CardTitle>
              <CardDescription>
                {note.courses?.course_name ?? "Unassigned course"}
                {note.topic ? ` • ${note.topic}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {note.content}
              </p>
              {note.file_url ? (
                <Button size="sm" className="w-full" asChild>
                  <a href={note.file_url} target="_blank" rel="noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                </Button>
              ) : (
                <Button size="sm" className="w-full" variant="outline">
                  Read Note
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
