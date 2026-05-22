"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Video, FileText, ArrowRight } from "lucide-react"
import Link from "next/link"
import { TiltCard } from "@/components/animations/tilt-card"

const semesters = [
  {
    name: "Semester 1",
    courses: 6,
    materials: 45,
    popular: false,
    subjects: ["Programming Fundamentals", "Physics", "Math I"],
  },
  {
    name: "Semester 2",
    courses: 6,
    materials: 52,
    popular: false,
    subjects: ["Data Structures", "OOP", "Math II"],
  },
  {
    name: "Semester 3",
    courses: 7,
    materials: 68,
    popular: true,
    subjects: ["Database", "Algorithms", "Digital Logic"],
  },
  {
    name: "Semester 4",
    courses: 7,
    materials: 71,
    popular: true,
    subjects: ["Operating Systems", "Computer Networks", "Software Engineering"],
  },
  {
    name: "Semester 5",
    courses: 6,
    materials: 58,
    popular: false,
    subjects: ["Web Development", "AI", "Computer Graphics"],
  },
  {
    name: "Semester 6",
    courses: 6,
    materials: 55,
    popular: false,
    subjects: ["Machine Learning", "Compiler Design", "Distributed Systems"],
  },
]

export function CoursesPreview() {
  return (
    <section id="courses" className="py-24 relative z-10">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight">
            Popular Courses
          </h2>
          <p className="mt-6 text-xl text-slate-800 font-medium">
            Everything organized neatly so you can focus on learning.
          </p>
        </motion.div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {semesters.map((semester, index) => (
            <motion.div
              key={semester.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full bg-white rounded-[2.5rem] border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-black text-slate-900">{semester.name}</CardTitle>
                    {semester.popular && (
                      <Badge className="bg-slate-900 text-yellow-400 border-none font-black text-[10px] uppercase tracking-widest">
                        Popular
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 flex-grow flex flex-col justify-between">
                  <div>
                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                        <BookOpen className="w-4 h-4" />
                        <span>{semester.courses} Courses</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                        <FileText className="w-4 h-4" />
                        <span>{semester.materials}+ Materials</span>
                      </div>
                    </div>

                    {/* Subjects Preview */}
                    <div className="space-y-2 mb-8">
                      {semester.subjects.map((subject) => (
                        <div
                          key={subject}
                          className="flex items-center gap-3 text-sm font-bold text-slate-700"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                          <span>{subject}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <Link href="/login" className="block">
                    <Button variant="outline" className="w-full h-12 rounded-xl border-2 border-slate-900 font-black hover:bg-slate-900 hover:text-white transition-all">
                      Explore {semester.name}
                      <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
