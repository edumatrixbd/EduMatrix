"use client"

import * as React from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"

export function NotificationBell() {
  const { user } = useAuth()
  const userId = user?.id
  const userRole = user?.role

  const [notifications, setNotifications] = React.useState<any[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [selectedNotification, setSelectedNotification] = React.useState<any | null>(null)

  React.useEffect(() => {
    if (!userId) return

    fetchNotifications()
    
    const supabase = createClient()
    const channel = supabase
      .channel(`notifications_realtime_${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, userRole])

  const fetchNotifications = async () => {
    try {
      const supabase = createClient()
      
      let query = supabase
        .from("notifications")
        .select("id, title, message, category, target_role, created_at")
        .order("created_at", { ascending: false })
        .limit(10)

      if (userRole === "student") {
        query = query.in("target_role", ["all", "students"])
      } else if (userRole === "instructor") {
        query = query.in("target_role", ["all", "instructors"])
      }

      const { data: notifs, error } = await query

      if (error) throw error

      if (!notifs || notifs.length === 0) {
        setNotifications([])
        setUnreadCount(0)
        return
      }

      const notifIds = notifs.map(n => n.id)
      const { data: reads } = await supabase
        .from("notification_reads")
        .select("notification_id")
        .eq("user_id", userId)
        .in("notification_id", notifIds)

      const readIds = new Set(reads?.map(r => r.notification_id) || [])
      
      const enriched = notifs.map(n => ({
        ...n,
        isRead: readIds.has(n.id)
      }))

      setNotifications(enriched)
      setUnreadCount(enriched.filter(n => !n.isRead).length)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  const handleNotificationClick = async (n: any) => {
    setSelectedNotification(n)
    
    if (n.isRead) return

    try {
      const supabase = createClient()
      await supabase.from("notification_reads").insert({
        user_id: userId,
        notification_id: n.id
      }).select().maybeSingle()
      
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (e) {
      console.error("Failed to mark as read:", e)
    }
  }

  return (
    <>
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF3B30] rounded-full border-2 border-white dark:border-slate-950" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 z-[100]">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px]">{unreadCount} new</Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5" />
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              <p>No new notifications</p>
            </div>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem 
                key={n.id} 
                className={`flex flex-col items-start p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-100 dark:border-white/5 last:border-0 ${!n.isRead ? 'bg-primary/[0.02] dark:bg-primary/5' : ''}`}
                onSelect={() => handleNotificationClick(n)}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-sm line-clamp-1 flex-1 ${!n.isRead ? 'font-bold text-primary' : 'font-semibold'}`}>{n.title}</span>
                  <span className="text-[10px] text-slate-500 ml-2 shrink-0">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className={`text-xs line-clamp-2 ${!n.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>{n.message}</p>
                {n.category && (
                  <Badge variant="outline" className="mt-2 text-[9px] uppercase px-1 h-4">{n.category}</Badge>
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
      <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 max-w-md text-slate-900 dark:text-slate-100 z-[110]">
        {selectedNotification && (
          <>
            <DialogHeader className="space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] uppercase font-bold px-1.5 py-0.5">
                    {selectedNotification.category || "announcement"}
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-500">
                  {formatDistanceToNow(new Date(selectedNotification.created_at), { addSuffix: true })}
                </span>
              </div>
              <DialogTitle className="text-xl font-bold text-left">{selectedNotification.title}</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-600 dark:text-slate-300">
              {selectedNotification.message}
            </div>
            <DialogClose asChild>
              <Button className="w-full mt-2" variant="outline">
                Close Notice
              </Button>
            </DialogClose>
          </>
        )}
      </DialogContent>
    </Dialog>
  </>
  )
}
