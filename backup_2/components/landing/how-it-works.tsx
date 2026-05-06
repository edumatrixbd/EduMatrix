"use client"

import { motion } from "framer-motion"
import { UserPlus, BookOpen, Target, Award } from "lucide-react"

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create Your Account",
    description: "Sign up in seconds with your DIU email and get instant access to the platform.",
  },
  {
    icon: BookOpen,
    step: "02",
    title: "Choose Your Semester",
    description: "Select your current semester and explore all available courses and materials.",
  },
  {
    icon: Target,
    step: "03",
    title: "Access Resources",
    description: "Dive into videos, notes, previous questions, and suggestions for each course.",
  },
  {
    icon: Award,
    step: "04",
    title: "Ace Your Exams",
    description: "Study smarter, track your progress, and achieve your academic goals.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-muted/30">
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
            Get started in{" "}
            <span className="gradient-text">4 simple steps</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            From sign-up to success, we have made the journey as simple as possible
          </p>
        </motion.div>

        {/* Steps */}
        <div className="mt-16 relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative text-center"
              >
                {/* Step Number */}
                <div className="relative inline-flex">
                  <div className="w-16 h-16 rounded-2xl bg-card border-2 border-border flex items-center justify-center shadow-premium relative z-10">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md">
                    {index + 1}
                  </div>
                </div>

                {/* Content */}
                <h3 className="mt-6 text-xl font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
