"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  University, 
  Building2, 
  Layers, 
  BookOpen, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Calendar
} from "lucide-react"
import Link from "next/link"

const SECTIONS = [
  {
    title: "Universities",
    description: "Manage institutions and global settings",
    href: "/admin/universities",
    icon: University,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    title: "Departments",
    description: "Assign academic departments to universities",
    href: "/admin/departments",
    icon: Building2,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10"
  },
  {
    title: "Semesters",
    description: "Define named academic terms like Spring 2026",
    href: "/admin/semesters",
    icon: Calendar,
    color: "text-rose-500",
    bg: "bg-rose-500/10"
  },
  {
    title: "Batches",
    description: "Manage student cohorts and graduation years",
    href: "/admin/batches",
    icon: Layers,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10"
  },
  {
    title: "Courses",
    description: "Manage subject-wise content and pricing",
    href: "/admin/courses",
    icon: BookOpen,
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  }
]

export default function HierarchyDashboard() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-foreground flex items-center gap-3 tracking-tight">
          <ShieldCheck className="w-8 h-8 text-primary" />
          Platform Hierarchy
        </h1>
        <p className="text-muted-foreground mt-1 text-sm font-semibold">
          Control the institutional structure and content targeting
        </p>
      </motion.div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SECTIONS.map((section, idx) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Link href={section.href}>
              <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border-slate-200 dark:border-white/10 bg-white dark:bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden min-h-[140px] flex items-center shadow-md">
                <CardContent className="p-5 flex items-center gap-5 w-full">
                   <div className={`w-14 h-14 rounded-xl ${section.bg} flex items-center justify-center ${section.color} group-hover:scale-105 transition-transform duration-300 shadow-inner shrink-0`}>
                      <section.icon className="w-7 h-7" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-black text-foreground tracking-tight mb-1 group-hover:text-primary transition-colors duration-300">{section.title}</h3>
                      <p className="text-muted-foreground font-bold italic text-xs truncate">{section.description}</p>
                   </div>
                   <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 shrink-0" />
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Integrity Note */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.3 }}
        className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 relative overflow-hidden shadow-inner"
      >
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-[0.05]">
           <Zap className="w-24 h-24 text-primary" />
        </div>
        <div className="relative z-10 space-y-2">
           <h4 className="text-base font-black text-slate-800 dark:text-slate-100">System Integrity</h4>
           <p className="text-slate-600 dark:text-slate-300 max-w-2xl font-semibold leading-relaxed text-xs">
             Changes to the hierarchy impact content access and subscription availability for thousands of students. Ensure that university codes match billing gateway configurations.
           </p>
        </div>
      </motion.div>
    </div>
  )
}
