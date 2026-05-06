"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Video, FileText, ArrowRight } from "lucide-react"
import Link from "next/link"

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
    <section id="courses" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-balance">
            All semesters,{" "}
            <span className="gradient-text">one platform</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Comprehensive resources for every semester of your CSE journey at DIU
          </p>
        </motion.div>

        {/* Courses Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {semesters.map((semester, index) => (
            <motion.div
              key={semester.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-premium transition-all duration-300 hover:border-primary/30 group">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold">{semester.name}</CardTitle>
                    {semester.popular && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        Popular
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="w-4 h-4" />
                      <span>{semester.courses} Courses</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span>{semester.materials}+ Materials</span>
                    </div>
                  </div>

                  {/* Subjects Preview */}
                  <div className="space-y-1">
                    {semester.subjects.map((subject) => (
                      <div
                        key={subject}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <Video className="w-3.5 h-3.5 text-primary/70" />
                        <span>{subject}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link href="/login" className="block pt-2">
                    <Button variant="ghost" className="w-full group-hover:bg-primary/5 group-hover:text-primary">
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
