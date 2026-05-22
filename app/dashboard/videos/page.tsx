"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Video, Search, Clock, Eye, Play, Loader2, Lock } from "lucide-react"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { swrKeys } from "@/lib/swr/keys"
import { supabaseFetcher } from "@/lib/swr/fetcher"
import { useDebounce } from "@/hooks/use-debounce"
import { useAuth } from "@/hooks/use-auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronRight, LayoutGrid, List } from "lucide-react"

interface VideoLecture {
  id: string
  title: string
  video_url: string | null
  hls_url: string | null
  description: string | null
  duration: string | null
  playlist_type: 'mid' | 'final'
  university: string
  department: string
  batch: string
  courses: {
    id: string
    course_name: string
    course_code: string
  } | null
}

export default function VideosPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState("")
  const search = useDebounce(searchInput, 400)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)

  const { data, isLoading } = useSWR(
    user ? swrKeys.videos.list(page, search, user.university || undefined, user.department || undefined, user.batch || undefined) : null,
    supabaseFetcher<VideoLecture>,
    { keepPreviousData: true, revalidateOnFocus: false }
  )

  const videos = data?.data ?? []
  const totalPages = data?.totalPages ?? 0

  // Group videos by course
  const coursesWithVideos = videos.reduce((acc: any, video) => {
    const courseId = video.courses?.id || "unassigned"
    if (!acc[courseId]) {
      acc[courseId] = {
        id: courseId,
        name: video.courses?.course_name || "Unassigned Course",
        code: video.courses?.course_code || "UNC",
        videos: []
      }
    }
    acc[courseId].videos.push(video)
    return acc
  }, {})

  const courseList = Object.values(coursesWithVideos)

  const handleSearch = (val: string) => {
    setSearchInput(val)
    setPage(0)
  }

  const currentCourse = selectedCourse ? coursesWithVideos[selectedCourse] : null
  const midVideos = currentCourse?.videos.filter((v: any) => v.playlist_type === 'mid') || []
  const finalVideos = currentCourse?.videos.filter((v: any) => v.playlist_type === 'final') || []

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

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {!selectedCourse ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading && !data && (
              <>{[...Array(6)].map((_, i) => <Card key={i} className="h-40 bg-muted animate-pulse" />)}</>
            )}

            {!isLoading && courseList.length === 0 && (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No courses found for your cohort ({user?.university} {user?.batch}).
                </CardContent>
              </Card>
            )}

            {courseList.map((course: any) => (
              <Card 
                key={course.id} 
                className="hover:shadow-lg transition-all cursor-pointer group border-primary/10 hover:border-primary/30"
                onClick={() => setSelectedCourse(course.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-primary border-primary/20">{course.code}</Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="mt-2 text-xl">{course.name}</CardTitle>
                  <CardDescription>{course.videos.length} Lectures available</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(3, course.videos.length))].map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center">
                        <Play className="w-3 h-3 text-primary" />
                      </div>
                    ))}
                    {course.videos.length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold">
                        +{course.videos.length - 3}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setSelectedCourse(null)} className="text-muted-foreground hover:text-foreground">
                ← Back to Courses
              </Button>
              <h2 className="text-xl font-bold">{currentCourse.name}</h2>
            </div>

            <Tabs defaultValue="mid" className="w-full">
              <TabsList className="grid w-full max-w-[400px] grid-cols-2 bg-slate-900/50 border border-white/5">
                <TabsTrigger value="mid">Midterm Playlist</TabsTrigger>
                <TabsTrigger value="final">Final Playlist</TabsTrigger>
              </TabsList>
              
              <TabsContent value="mid" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {midVideos.length > 0 ? midVideos.map((video: any) => (
                    <VideoCard key={video.id} video={video} isSubscribed={!!user?.isSubscribed} onClick={() => router.push(`/dashboard/study-zone?videoId=${video.id}`)} />
                  )) : (
                    <p className="text-muted-foreground col-span-3 text-center py-12 bg-muted/20 rounded-xl border border-dashed">No midterm videos available.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="final" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {finalVideos.length > 0 ? finalVideos.map((video: any) => (
                    <VideoCard key={video.id} video={video} isSubscribed={!!user?.isSubscribed} onClick={() => router.push(`/dashboard/study-zone?videoId=${video.id}`)} />
                  )) : (
                    <p className="text-muted-foreground col-span-3 text-center py-12 bg-muted/20 rounded-xl border border-dashed">No final videos available.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </motion.div>

      {!selectedCourse && <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />}
    </div>
  )
}

function VideoCard({ video, isSubscribed, onClick }: { video: any, isSubscribed: boolean, onClick: () => void }) {
  const isLocked = !video.is_free && !isSubscribed
  
  return (
    <Card 
      className={cn(
        "hover:shadow-lg transition-all overflow-hidden group cursor-pointer border-white/5",
        isLocked ? "opacity-70 grayscale-[0.5] hover:grayscale-0" : "hover:border-primary/30"
      )}
      onClick={isLocked ? () => {} : onClick}
    >
      <div className="h-40 bg-slate-900 relative overflow-hidden flex items-center justify-center group">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
        
        {isLocked ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
             <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20 mb-3">
                <Lock className="w-5 h-5 text-white" />
             </div>
             <Badge variant="secondary" className="bg-primary text-white border-none font-black text-[9px] tracking-widest uppercase">Premium</Badge>
          </div>
        ) : (
          <Play className="w-10 h-10 text-white z-20 opacity-60 group-hover:scale-110 group-hover:opacity-100 transition-all" />
        )}

        {video.duration && (
          <div className="absolute bottom-3 right-3 z-20 bg-black/60 px-2 py-1 rounded text-[10px] font-mono text-white">
            {video.duration}m
          </div>
        )}
        {video.is_free && (
          <div className="absolute top-3 right-3 z-20 bg-emerald-500/80 px-2 py-0.5 rounded text-[9px] font-black uppercase text-white tracking-widest shadow-lg">
            Free
          </div>
        )}
      </div>
      <CardHeader className="p-4">
        <div className="flex items-center justify-between mb-1">
           <CardDescription className="line-clamp-1">{video.courses?.course_code}</CardDescription>
           {isLocked && <span className="text-[10px] font-bold text-primary uppercase">Upgrade to Unlock</span>}
        </div>
        <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">{video.title}</CardTitle>
      </CardHeader>
    </Card>
  )
}
