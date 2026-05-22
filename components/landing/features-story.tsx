"use client"

import { motion, Variants } from "framer-motion"
import { Video, FileQuestion, Lightbulb, BookOpen } from "lucide-react"

const features = [
  {
    title: "Video Lectures",
    description: "High-quality, focused video content covering your entire syllabus. Watch anytime, anywhere.",
    icon: Video,
    color: "bg-blue-100 text-blue-600"
  },
  {
    title: "Previous Questions & Solutions",
    description: "Access years of past exam papers fully solved and explained step-by-step.",
    icon: FileQuestion,
    color: "bg-purple-100 text-purple-600"
  },
  {
    title: "Exam Suggestions",
    description: "Targeted topics and vital questions curated to maximize your exam score.",
    icon: Lightbulb,
    color: "bg-amber-100 text-amber-600"
  },
  {
    title: "Study Notes",
    description: "Comprehensive and concise notes for quick revision before your exams.",
    icon: BookOpen,
    color: "bg-emerald-100 text-emerald-600"
  }
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
}

export function FeaturesStory() {
  return (
    <section className="py-32 relative z-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-5xl font-black tracking-tight text-slate-900 sm:text-6xl drop-shadow-sm">
            Everything you need. <br className="hidden sm:block"/> Nothing you don't.
          </h2>
          <p className="mt-6 text-xl text-slate-800 font-medium max-w-2xl mx-auto">
            A complete ecosystem designed to take the stress out of your exam preparation.
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
              className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${feature.color}`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
