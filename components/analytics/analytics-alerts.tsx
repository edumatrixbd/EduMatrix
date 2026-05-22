"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, PlayCircle, Users, Video } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DropOffAlert {
  video_id: string;
  video_title: string;
  course_name: string;
  drop_off_count: number;
  total_viewers: number;
  drop_off_percentage: number;
}

interface EngagementWarning {
  type: string;
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
}

interface AnalyticsAlertsProps {
  dropOffs: DropOffAlert[];
  warnings: EngagementWarning[];
}

export function AnalyticsAlerts({ dropOffs, warnings }: AnalyticsAlertsProps) {
  const hasAlerts = dropOffs.length > 0 || warnings.length > 0;

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-[#FFB00F]/10 shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-none h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#FF3B30]" />
              Actionable Insights
            </CardTitle>
            <CardDescription>Critical alerts and engagement warnings</CardDescription>
          </div>
          {hasAlerts && (
            <Badge className="bg-[#FF3B30] text-white border-none font-black text-[10px] uppercase animate-pulse">
              {dropOffs.length + warnings.length} Alerts
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
              No significant drop-offs or engagement issues detected.
            </p>
          </div>
        ) : (
          <>
            {/* Drop-off Alerts */}
            {dropOffs.map((alert, i) => (
              <motion.div
                key={alert.video_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl border border-red-100 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5 group hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">High Drop-off Rate</h4>
                      <p className="text-xs text-slate-500 dark:text-white/40 font-medium">
                        {alert.video_title} • {alert.course_name}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-red-500 border-red-500/50 font-black text-[10px] uppercase">
                    {Math.round(alert.drop_off_percentage)}% Exit
                  </Badge>
                </div>
                <p className="text-xs mt-2 text-slate-600 dark:text-white/60 font-medium">
                  {alert.drop_off_count} out of {alert.total_viewers} students stopped before 30% of the video. Consider reviewing this lesson.
                </p>
              </motion.div>
            ))}

            {/* Engagement Warnings */}
            {warnings.map((warning, i) => (
              <motion.div
                key={warning.id + warning.type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (dropOffs.length + i) * 0.1 }}
                className={cn(
                  "p-4 rounded-xl border transition-colors group",
                  warning.severity === "high" 
                    ? "border-orange-100 dark:border-orange-500/20 bg-orange-50/50 dark:bg-orange-500/5 hover:bg-orange-50 dark:hover:bg-orange-500/10" 
                    : "border-blue-100 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      warning.severity === "high" ? "bg-orange-500/10 text-orange-500" : "bg-blue-500/10 text-blue-500"
                    )}>
                      {warning.type === "inactive_student" ? <Users className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {warning.type === "inactive_student" ? "Inactive Student" : warning.type === "course_low_watch" ? "Low Engagement" : "Poor Completion"}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-white/40 font-medium">
                        {warning.title}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn(
                    "font-black text-[10px] uppercase border-opacity-50",
                    warning.severity === "high" ? "text-orange-500 border-orange-500" : "text-blue-500 border-blue-500"
                  )}>
                    {warning.severity}
                  </Badge>
                </div>
                <p className="text-xs mt-2 text-slate-600 dark:text-white/60 font-medium">
                  {warning.description}
                </p>
              </motion.div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
