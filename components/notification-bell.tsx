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

interface NotificationBellProps {
  table: "notifications" | "instructor_notices"
}

export function NotificationBell({ table }: NotificationBellProps) {
  const [notifications, setNotifications] = React.useState<any[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)

  React.useEffect(() => {
    fetchNotifications()
    
    const supabase = createClient()
    const channel = supabase
      .channel(`${table}_realtime`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table])

  const fetchNotifications = async () => {
    try {
      const supabase = createClient()
      const fields = table === "notifications" ? "id, title, message, created_at" : "id, title, content, created_at";
      const { data, error } = await supabase
        .from(table)
        .select(fields)
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) throw error
      setNotifications(data || [])
      setUnreadCount(data?.length || 0)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && setUnreadCount(0)}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-white/5">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-950" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-slate-900 border-white/10 text-slate-200">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5" />
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              <p>No new notifications</p>
            </div>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start p-4 cursor-pointer hover:bg-white/5 border-b border-white/5 last:border-0">
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-sm">{n.title}</span>
                  <span className="text-[10px] text-slate-500">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{n.message || n.content}</p>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
