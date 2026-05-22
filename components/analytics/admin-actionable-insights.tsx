"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, Clock, MessageSquare, XCircle, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AdminActionableInsightsProps {
  insights: {
    pendingPayments: number;
    unreadFeedback: number;
    rejectedPayments: number;
    inactiveCourses: number;
  };
}

export function AdminActionableInsights({ insights }: AdminActionableInsightsProps) {
  const hasAlerts = Object.values(insights).some(v => v > 0);

  const alerts = [
    {
      title: "Pending Payments",
      value: insights.pendingPayments,
      icon: Clock,
      color: "text-blue-500",
      bgColor: "bg-blue-50/50 dark:bg-blue-500/5",
      borderColor: "border-blue-100 dark:border-blue-500/20",
      iconBg: "bg-blue-500/10",
      hoverBg: "hover:bg-blue-50 dark:hover:bg-blue-500/10",
      description: "Manual payment requests awaiting admin approval.",
      badgeColor: "text-blue-500 border-blue-500/50"
    },
    {
      title: "Unread Feedback",
      value: insights.unreadFeedback,
      icon: MessageSquare,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50/50 dark:bg-emerald-500/5",
      borderColor: "border-emerald-100 dark:border-emerald-500/20",
      iconBg: "bg-emerald-500/10",
      hoverBg: "hover:bg-emerald-50 dark:hover:bg-emerald-500/10",
      description: "New material feedback from students to review.",
      badgeColor: "text-emerald-500 border-emerald-500/50"
    },
    {
      title: "Rejected Payments",
      value: insights.rejectedPayments,
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-50/50 dark:bg-red-500/5",
      borderColor: "border-red-100 dark:border-red-500/20",
      iconBg: "bg-red-500/10",
      hoverBg: "hover:bg-red-50 dark:hover:bg-red-500/10",
      description: "Payments rejected by admins requiring student attention.",
      badgeColor: "text-red-500 border-red-500/50"
    },
    {
      title: "Inactive Courses",
      value: insights.inactiveCourses,
      icon: BookOpen,
      color: "text-orange-500",
      bgColor: "bg-orange-50/50 dark:bg-orange-500/5",
      borderColor: "border-orange-100 dark:border-orange-500/20",
      iconBg: "bg-orange-500/10",
      hoverBg: "hover:bg-orange-50 dark:hover:bg-orange-500/10",
      description: "Courses that are currently in draft or inactive state.",
      badgeColor: "text-orange-500 border-orange-500/50"
    }
  ].filter(a => a.value > 0);

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-[#FFB00F]/10 shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-none h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#FF3B30]" />
              Actionable Insights
            </CardTitle>
            <CardDescription>Tasks requiring admin attention</CardDescription>
          </div>
          {hasAlerts && (
            <Badge className="bg-[#FF3B30] text-white border-none font-black text-[10px] uppercase animate-pulse">
              {alerts.reduce((acc, curr) => acc + curr.value, 0)} Items
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {!hasAlerts ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
              <Info className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">All Clear!</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
              No pending admin tasks found at this time.
            </p>
          </div>
        ) : (
          <>
            {alerts.map((alert, i) => (
              <motion.div
                key={alert.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "p-4 rounded-xl border transition-colors group",
                  alert.borderColor,
                  alert.bgColor,
                  alert.hoverBg
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      alert.iconBg,
                      alert.color
                    )}>
                      <alert.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{alert.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-white/40 font-medium">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("font-black text-[10px] uppercase", alert.badgeColor)}>
                    {alert.value} Items
                  </Badge>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
