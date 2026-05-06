"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { 
  Activity,
  BarChart3, 
  BookOpen, 
  CalendarDays, 
  Clock, 
  Eye,
  FileQuestion, 
  Globe,
  Loader2,
  TrendingUp, 
  Users, 
  Video
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts"

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    live: 0,
    today: 0,
    week: 0,
    total: 0
  })
  const [visitorData, setVisitorData] = useState<any[]>([])
  const [topContent, setTopContent] = useState<any[]>([])
  const [contentDistribution, setContentDistribution] = useState<any[]>([])

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const supabase = createClient()
      
      // 1. Fetch Visitor Stats
      const { data: visits } = await supabase
        .from("website_visits")
        .select("session_id, created_at, last_seen")
      
      if (visits) {
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
        const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000
        const fiveMinsAgo = now.getTime() - 5 * 60 * 1000

        const live = new Set(visits.filter(v => new Date(v.last_seen).getTime() >= fiveMinsAgo).map(v => v.session_id)).size
        const today = visits.filter(v => new Date(v.created_at).getTime() >= todayStart).length
        const week = visits.filter(v => new Date(v.created_at).getTime() >= weekStart).length
        
        setStats({ live, today, week, total: visits.length })

        // Process trend data (last 7 days)
        const trendMap = new Map()
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          trendMap.set(d.toLocaleDateString('en-US', { weekday: 'short' }), 0)
        }
        visits.forEach(v => {
          const day = new Date(v.created_at).toLocaleDateString('en-US', { weekday: 'short' })
          if (trendMap.has(day)) trendMap.set(day, trendMap.get(day) + 1)
        })
        setVisitorData(Array.from(trendMap.entries()).map(([day, visits]) => ({ day, visits })))
      }

      // 2. Fetch Top Content
      const { data: views } = await supabase
        .from("content_views")
        .select("content_type, content_id, viewed_at")
        .order("viewed_at", { ascending: false })
      
      if (views) {
        const contentMap = new Map()
        views.forEach(v => {
          const key = `${v.content_type}:${v.content_id}`
          contentMap.set(key, (contentMap.get(key) || 0) + 1)
        })

        // Simplify for display (grouped by type)
        const typeMap = new Map()
        views.forEach(v => {
          typeMap.set(v.content_type, (typeMap.get(v.content_type) || 0) + 1)
        })
        
        const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"]
        setContentDistribution(Array.from(typeMap.entries()).map(([name, value], i) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: COLORS[i % COLORS.length]
        })))
      }

    } catch (error: any) {
      console.error("Error fetching analytics:", JSON.stringify(error, null, 2))
      if (error?.code === "42P01" || error?.code === "PGRST205") {
        toast.error("Analytics tables missing. Please run the SQL script.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin" /></div>

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Advanced Analytics</h1>
        <p className="text-muted-foreground mt-1">Real-time performance and audience engagement metrics</p>
      </motion.div>

      {/* Visitor Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Live Viewers", value: stats.live, icon: Activity, color: "bg-red-500", desc: "Active right now" },
          { label: "Today's Visits", value: stats.today, icon: Clock, color: "bg-blue-500", desc: "Past 24 hours" },
          { label: "Weekly Growth", value: stats.week, icon: CalendarDays, color: "bg-emerald-500", desc: "Past 7 days" },
          { label: "Total Sessions", value: stats.total, icon: Globe, color: "bg-purple-500", desc: "Since launch" },
        ].map((stat) => (
          <Card key={stat.label} className="overflow-hidden border-none bg-muted/20">
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center shadow-lg shadow-black/20`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <Badge variant="outline" className="text-[10px] uppercase border-white/10">{stat.desc}</Badge>
              </div>
              <div className="text-3xl font-bold">{stat.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visitor Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Visitor Trends</CardTitle>
            <CardDescription>Daily page traffic over the last week</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visitorData}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                />
                <Area type="monotone" dataKey="visits" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVisits)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Content Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Content Engagement</CardTitle>
            <CardDescription>Views by material type</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {contentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px" }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

