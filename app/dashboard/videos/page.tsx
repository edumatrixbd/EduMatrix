"use client"

import { useState } from "react"
import useSWR from "swr"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Video, Search, Clock, Eye, Play, Loader2 } from "lucide-react"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { swrKeys } from "@/lib/swr/keys"
import { supabaseFetcher } from "@/lib/swr/fetcher"
import { useDebounce } from "@/hooks/use-debounce"

interface VideoLecture {
  id: string
  title: string
  video_url: string | null
  description: string | null
  duration: string | null
  courses: {
    course_name: string
    course_code: string
  } | null
}

export default function VideosPage() {
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState("")
  const search = useDebounce(searchInput, 400)

  const { data, isLoading } = useSWR(
    swrKeys.videos.list(page, search),
    supabaseFetcher<VideoLecture>,
    { keepPreviousData: true, revalidateOnFocus: false }
  )

  const videos = data?.data ?? []
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
            <Video className="w-8 h-8 text-primary" />
            Video Lectures
          </h1>
          <p className="text-muted-foreground mt-1">
            Access comprehensive video lectures for all your courses
            {data && (
              <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                {data.count} videos
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
          placeholder="Search videos by title..."
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </motion.div>

      {/* Videos Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* Skeleton loading */}
        {isLoading && !data && (
          <>
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-40 bg-muted animate-pulse" />
                <CardHeader>
                  <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-muted animate-pulse rounded mt-1" />
                </CardHeader>
                <CardContent>
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {!isLoading && videos.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="p-8 text-center text-muted-foreground">
              {search ? `No videos found for "${search}"` : "No video lectures have been uploaded yet."}
            </CardContent>
          </Card>
        )}

        {videos.map((video) => (
          <Card key={video.id} className="hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer">
            <div className="h-40 bg-gradient-to-br from-blue-500 to-indigo-600 relative overflow-hidden flex items-center justify-center">
              <Play className="w-12 h-12 text-white opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                {video.video_url ? (
                  <a
                    href={video.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button size="sm">
                      <Video className="w-4 h-4 mr-2" />
                      Watch
                    </Button>
                  </a>
                ) : null}
              </div>
            </div>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {video.courses?.course_name ?? "Unassigned course"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {video.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {video.duration}
                  </div>
                )}
                {video.courses?.course_code && (
                  <Badge variant="outline" className="text-xs">
                    {video.courses.course_code}
                  </Badge>
                )}
              </div>
              {video.description && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {video.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
