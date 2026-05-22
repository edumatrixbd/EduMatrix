"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, TrendingUp, DollarSign, Users } from "lucide-react";
import { motion } from "framer-motion";

interface CoursePerformance {
  course_id: string;
  course_name: string;
  total_views: number;
  avg_completion: number;
  total_revenue: number;
}

interface TopPerformingCoursesProps {
  courses: CoursePerformance[];
}

export function TopPerformingCourses({ courses }: TopPerformingCoursesProps) {
  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-[#FFB00F]/10 shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#FFB00F]" />
            Top Performing Courses
          </CardTitle>
          <CardDescription>Based on views, completion, and revenue</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {courses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No performance data available yet.
          </div>
        ) : (
          courses.map((course, index) => (
            <motion.div
              key={course.course_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFB00F]/10 flex items-center justify-center text-[#FFB00F] font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-[#FFB00F] transition-colors line-clamp-1">
                      {course.course_name}
                    </h4>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                        <Users className="w-3 h-3" /> {course.total_views} views
                      </span>
                      {course.total_revenue > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-emerald-500 uppercase font-black tracking-widest">
                          <DollarSign className="w-3 h-3" /> {course.total_revenue.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase">
                  {Math.round(course.avg_completion)}% Comp.
                </Badge>
              </div>
              <Progress 
                value={course.avg_completion} 
                className="h-1.5 bg-slate-100 dark:bg-white/5" 
              />
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
