"use client"

import { motion } from "framer-motion"
import { PlayCircle, GraduationCap, Target } from "lucide-react"

const steps = [
  {
    title: "Watch",
    description: "Learn complex topics through crystal-clear video lectures.",
    icon: PlayCircle,
    color: "bg-blue-500"
  },
  {
    title: "Practice",
    description: "Solve years of previous questions with step-by-step guides.",
    icon: Target,
    color: "bg-purple-500"
  },
  {
    title: "Prepare",
    description: "Ace your exams with targeted suggestions and quick-notes.",
    icon: GraduationCap,
    color: "bg-emerald-500"
  }
]

export function HowItWorks() {
  return (
    <section className="py-24 relative z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6">
            How it works
          </h2>
          <p className="text-xl text-slate-800 font-medium max-w-2xl mx-auto">
            A simple 3-step process to transform your exam preparation from chaotic to confident.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10" />
          
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="flex flex-col items-center text-center group"
            >
              <div className={`w-20 h-20 rounded-3xl ${step.color} flex items-center justify-center text-white shadow-2xl mb-8 transform group-hover:scale-110 transition-transform duration-300`}>
                <step.icon className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">{step.title}</h3>
              <p className="text-slate-700 leading-relaxed max-w-[250px]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
