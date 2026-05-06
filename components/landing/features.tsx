"use client"

import { motion } from "framer-motion"
import { 
  Video, 
  FileQuestion, 
  Lightbulb, 
  BookMarked, 
  CheckCircle2, 
  BarChart3,
  Clock,
  Shield
} from "lucide-react"
import { TiltCard } from "@/components/animations/tilt-card"

const features = [
  {
    icon: Video,
    title: "Video Lectures",
    description: "High-quality video explanations for every topic, designed for your university curriculum.",
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: FileQuestion,
    title: "Previous Questions",
    description: "Access midterm and final exam questions from previous years with detailed solutions.",
    color: "from-indigo-500 to-purple-600",
  },
  {
    icon: Lightbulb,
    title: "Exam Suggestions",
    description: "Curated suggestions and important topics to focus on for upcoming exams.",
    color: "from-purple-500 to-pink-600",
  },
  {
    icon: BookMarked,
    title: "Study Notes",
    description: "Comprehensive notes created by top students and verified by faculty members.",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: CheckCircle2,
    title: "Solved Answers",
    description: "Step-by-step solutions to help you understand problem-solving approaches.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Monitor your preparation progress and identify areas that need more attention.",
    color: "from-cyan-500 to-blue-600",
  },
]

const highlights = [
  { icon: Clock, text: "Save 10+ hours weekly" },
  { icon: Shield, text: "Trusted by top performers" },
]

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-28">
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
            Everything you need to{" "}
            <span className="text-gradient-cyan">excel in your exams</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            A complete ecosystem of study resources designed for students
          </p>
          
          {/* Highlights */}
          <div className="mt-6 flex items-center justify-center gap-6">
            {highlights.map((highlight, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <highlight.icon className="w-4 h-4 text-cyan-500" />
                <span>{highlight.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <TiltCard maxTilt={10} scale={1.02} glare={true} className="h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl -z-10" />
                
                <div className="relative h-full p-6 sm:p-8 rounded-2xl border border-border/50 bg-card hover:border-cyan-500/40 transition-all duration-300 group-hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)]">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-lg`}>
                    <feature.icon className="w-6 h-6" />
                  </div>

                  {/* Content */}
                  <h3 className="mt-5 text-xl font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
