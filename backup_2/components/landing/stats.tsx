"use client"

import { motion } from "framer-motion"
import { Users, BookOpen, FileCheck, Trophy } from "lucide-react"

const stats = [
  {
    icon: Users,
    value: "5,000+",
    label: "Active Students",
    description: "Learning every day",
  },
  {
    icon: BookOpen,
    value: "200+",
    label: "Study Materials",
    description: "Across all semesters",
  },
  {
    icon: FileCheck,
    value: "1,500+",
    label: "Previous Questions",
    description: "With solutions",
  },
  {
    icon: Trophy,
    value: "95%",
    label: "Success Rate",
    description: "Pass their exams",
  },
]

export function Stats() {
  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-foreground">
                {stat.value}
              </div>
              <div className="mt-1 text-base font-semibold text-foreground">
                {stat.label}
              </div>
              <div className="mt-0.5 text-sm text-muted-foreground">
                {stat.description}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
