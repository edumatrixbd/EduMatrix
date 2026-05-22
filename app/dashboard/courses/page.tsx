"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Search, ArrowRight, Star, Loader2, BookOpen } from "lucide-react"
import Link from "next/link"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { swrKeys } from "@/lib/swr/keys"
import { supabaseFetcher } from "@/lib/swr/fetcher"
import { useDebounce } from "@/hooks/use-debounce"
import { Empty, EmptyMedia, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty"

import { useAuth } from "@/hooks/use-auth"

interface Course {
  id: string
  course_code: string
  course_name: string
  description: string | null
  instructor: string | null
  credits: number | null
  semester: number | null
  status: string | null
  university: string | null
  department: string | null
  batch: string | null
}

export default function CoursesPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get("search") || ""
  
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState(initialSearch)
  const search = useDebounce(searchInput, 400)

  const { data, isLoading } = useSWR(
    swrKeys.courses.list(page, search, user?.university || undefined, user?.department || undefined, user?.batch || undefined),
    supabaseFetcher<Course>,
    { keepPreviousData: true, revalidateOnFocus: false }
  )

  const courses = data?.data ?? []
  const totalPages = data?.totalPages ?? 0

  // Reset to page 0 when search changes
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
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">All Courses</h1>
          <p className="text-muted-foreground mt-1">
            Browse and manage all your courses
            {data && (
              <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                {data.count} total
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
          <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        ) : (
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          placeholder="Search courses by name or code..."
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 h-10"
        />
      </motion.div>

      {/* Courses Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {isLoading && !data && (
          <>
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-3 space-y-2">
                  <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-2 bg-muted animate-pulse rounded" />
                  <div className="h-9 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {!isLoading && courses.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3">
            <Empty className="py-12">
              <EmptyMedia variant="icon">
                <BookOpen className="w-5 h-5" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No courses found</EmptyTitle>
                <EmptyDescription>
                  {search 
                    ? `We couldn't find any courses matching "${search}". Try a different term or browse all semesters.` 
                    : "There are no courses available in this category yet."}
                </EmptyDescription>
              </EmptyHeader>
              <Button variant="outline" onClick={() => handleSearch("")}>
                Clear Search
              </Button>
            </Empty>
          </div>
        )}

        {courses.map((course) => (
          <Card key={course.id} className="bg-white dark:bg-[#0B0B0B]/60 border-black/[0.08] dark:border-[#FFB00F]/10 hover:border-[#FFB00F]/30 shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-none transition-all overflow-hidden group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <CardTitle className="line-clamp-2 text-[#111111] dark:text-white font-bold">{course.course_name}</CardTitle>
                  <CardDescription className="mt-1 text-[#555555] dark:text-white/40">
                    {course.course_code} • Semester {course.semester ?? "N/A"}
                  </CardDescription>
                </div>
                <Badge
                  className={`${course.status === "active" ? "bg-[#FFB00F] text-[#0B0B0B]" : "bg-black/[0.04] dark:bg-white/5 text-[#555555] dark:text-white/40 border-none"} shrink-0 capitalize font-black text-[10px] uppercase`}
                >
                  {course.status ?? "draft"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#555555] dark:text-white/40 font-medium">Credits</span>
                  <span className="font-black text-[#111111] dark:text-white">{course.credits ?? 0}</span>
                </div>
                <Progress value={course.status === "active" ? 100 : 0} className="h-1 bg-black/[0.04] dark:bg-white/5" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-[#FFB00F] text-[#FFB00F]" />
                  <span className="font-bold text-[#111111] dark:text-white">Live</span>
                </div>
                <span className="text-[#555555] dark:text-white/40 truncate max-w-[140px] font-medium">
                  {course.instructor ?? "Instructor TBA"}
                </span>
              </div>
              <Link href={`/dashboard/course/${course.id}`}>
                <Button className="w-full bg-[#FFB00F] hover:bg-[#FFB00F]/90 text-[#0B0B0B] font-black rounded-xl" variant="default">
                  View Course
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
