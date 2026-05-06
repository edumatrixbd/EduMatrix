"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Play, 
  FileText, 
  FileQuestion, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  MoveRight,
  Loader2,
  BookOpenCheck
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function StudyZoneAdminPage() {
  const [activeTab, setActiveTab] = useState("playlists")
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("courses").select("id, course_name, course_code")
      if (error) throw error
      setCourses(data || [])
      if (data && data.length > 0) setSelectedCourse(data[0].id)
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast.error("Failed to load courses")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <BookOpenCheck className="w-8 h-8 text-primary" />
            Study Zone Control
          </h1>
          <p className="text-muted-foreground mt-1">Configure playlists and resource categorization for students</p>
        </div>
        <div className="w-full sm:w-64">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="bg-muted/50 border-primary/20">
              <SelectValue placeholder="Select Course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.course_code} - {course.course_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {selectedCourse ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1 border border-white/5 overflow-x-auto flex-nowrap w-full sm:w-auto">
            <TabsTrigger value="playlists" className="gap-2">
              <Play className="w-4 h-4" />
              Playlists
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <FileText className="w-4 h-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="questions" className="gap-2">
              <FileQuestion className="w-4 h-4" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="solves" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Solves
            </TabsTrigger>
          </TabsList>

          <TabsContent value="playlists">
            <PlaylistManager courseId={selectedCourse} />
          </TabsContent>
          <TabsContent value="notes">
            <ResourceManager courseId={selectedCourse} type="notes" table="study_notes" />
          </TabsContent>
          <TabsContent value="questions">
            <ResourceManager courseId={selectedCourse} type="questions" table="previous_questions" />
          </TabsContent>
          <TabsContent value="solves">
            <ResourceManager courseId={selectedCourse} type="solves" table="solved_answers" />
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            {loading ? "Loading courses..." : "Please select a course to manage its Study Zone content"}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function PlaylistManager({ courseId }: { courseId: string }) {
  const [midVideos, setMidVideos] = useState<any[]>([])
  const [finalVideos, setFinalVideos] = useState<any[]>([])
  const [availableVideos, setAvailableVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [courseId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Fetch all videos for course
      const { data: allVideos } = await supabase
        .from("video_lectures")
        .select("id, title, course_id")
        .eq("course_id", courseId)

      // Fetch existing playlist mappings
      const { data: mappings } = await supabase
        .from("study_zone_playlists")
        .select("video_id, category")
        .eq("course_id", courseId)

      const midIds = mappings?.filter(m => m.category === "mid").map(m => m.video_id) || []
      const finalIds = mappings?.filter(m => m.category === "final").map(m => m.video_id) || []

      setMidVideos(allVideos?.filter(v => midIds.includes(v.id)) || [])
      setFinalVideos(allVideos?.filter(v => finalIds.includes(v.id)) || [])
      setAvailableVideos(allVideos?.filter(v => !midIds.includes(v.id) && !finalIds.includes(v.id)) || [])
    } catch (error) {
      console.error("Error fetching playlist data:", error)
    } finally {
      setLoading(false)
    }
  }

  const addToPlaylist = async (videoId: string, category: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("study_zone_playlists")
        .insert({ course_id: courseId, video_id: videoId, category })

      if (error) throw error
      fetchData()
      toast.success(`Added to ${category} playlist`)
    } catch (error) {
      toast.error("Failed to add video")
    }
  }

  const removeFromPlaylist = async (videoId: string, category: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("study_zone_playlists")
        .delete()
        .match({ course_id: courseId, video_id: videoId, category })

      if (error) throw error
      fetchData()
      toast.success(`Removed from ${category} playlist`)
    } catch (error) {
      toast.error("Failed to remove video")
    }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Available Videos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {availableVideos.length === 0 && <p className="text-xs text-muted-foreground">No unassigned videos</p>}
          {availableVideos.map(video => (
            <div key={video.id} className="p-3 rounded-lg bg-muted/30 border border-white/5 flex flex-col gap-2">
              <span className="text-sm font-medium">{video.title}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="h-7 text-[10px] flex-1" onClick={() => addToPlaylist(video.id, "mid")}>
                  Add to Mid
                </Button>
                <Button size="sm" variant="secondary" className="h-7 text-[10px] flex-1" onClick={() => addToPlaylist(video.id, "final")}>
                  Add to Final
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-blue-500/20 bg-blue-500/[0.02]">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-blue-400 uppercase tracking-wider">Mid Playlist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {midVideos.map(video => (
            <div key={video.id} className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
              <span className="text-sm font-medium">{video.title}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeFromPlaylist(video.id, "mid")}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-purple-500/20 bg-purple-500/[0.02]">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-purple-400 uppercase tracking-wider">Final Playlist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {finalVideos.map(video => (
            <div key={video.id} className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10 flex items-center justify-between">
              <span className="text-sm font-medium">{video.title}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeFromPlaylist(video.id, "final")}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function ResourceManager({ courseId, type, table }: { courseId: string, type: string, table: string }) {
  const [midItems, setMidItems] = useState<any[]>([])
  const [finalItems, setFinalItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [courseId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const fields = table === "previous_questions" 
        ? "id, question_text, exam_type, course_id" 
        : "id, title, category, course_id";
      const { data } = await supabase
        .from(table)
        .select(fields)
        .eq("course_id", courseId)

      setMidItems(data?.filter(i => (i.category === "mid" || i.exam_type === "midterm")) || [])
      setFinalItems(data?.filter(i => (i.category === "final" || i.exam_type === "final")) || [])
    } catch (error) {
      console.error(`Error fetching ${type}:`, error)
    } finally {
      setLoading(false)
    }
  }

  const switchCategory = async (id: string, newCategory: string) => {
    try {
      const supabase = createClient()
      const column = table === "previous_questions" ? "exam_type" : "category"
      const value = table === "previous_questions" ? (newCategory === "mid" ? "midterm" : "final") : newCategory

      const { error } = await supabase
        .from(table)
        .update({ [column]: value })
        .eq("id", id)

      if (error) throw error
      fetchData()
      toast.success(`Moved to ${newCategory}`)
    } catch (error) {
      toast.error("Failed to update category")
    }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-blue-500/20 bg-blue-500/[0.02]">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-blue-400 uppercase tracking-wider">Mid {type}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {midItems.length === 0 && <p className="text-xs text-muted-foreground p-4 text-center">No Mid items</p>}
          {midItems.map(item => (
            <div key={item.id} className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 flex items-center justify-between group">
              <span className="text-sm font-medium">{item.title || item.question_text || "Untitled"}</span>
              <Button size="sm" variant="ghost" className="h-7 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => switchCategory(item.id, "final")}>
                Move to Final <MoveRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-purple-500/20 bg-purple-500/[0.02]">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-purple-400 uppercase tracking-wider">Final {type}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {finalItems.length === 0 && <p className="text-xs text-muted-foreground p-4 text-center">No Final items</p>}
          {finalItems.map(item => (
            <div key={item.id} className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10 flex items-center justify-between group">
              <Button size="sm" variant="ghost" className="h-7 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => switchCategory(item.id, "mid")}>
                <MoveRight className="w-3 h-3 mr-1 rotate-180" /> Move to Mid
              </Button>
              <span className="text-sm font-medium text-right">{item.title || item.question_text || "Untitled"}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
