"use client"

import { motion } from "framer-motion"
import { Code, Binary, Database, Cpu, Globe, Layout, Smartphone, Blocks } from "lucide-react"
import { TiltCard } from "@/components/animations/tilt-card"

const categories = [
  {
    name: "Programming",
    icon: Code,
    color: "from-orange-500 to-red-500",
    bgClass: "bg-orange-500/10 hover:bg-orange-500/20",
    textClass: "text-orange-500",
    count: "45+ Resources",
  },
  {
    name: "Mathematics",
    icon: Binary,
    color: "from-blue-500 to-cyan-500",
    bgClass: "bg-blue-500/10 hover:bg-blue-500/20",
    textClass: "text-blue-500",
    count: "32+ Resources",
  },
  {
    name: "Databases",
    icon: Database,
    color: "from-green-500 to-emerald-500",
    bgClass: "bg-green-500/10 hover:bg-green-500/20",
    textClass: "text-green-500",
    count: "28+ Resources",
  },
  {
    name: "Algorithms",
    icon: Blocks,
    color: "from-purple-500 to-pink-500",
    bgClass: "bg-purple-500/10 hover:bg-purple-500/20",
    textClass: "text-purple-500",
    count: "50+ Resources",
  },
  {
    name: "Hardware",
    icon: Cpu,
    color: "from-yellow-500 to-orange-500",
    bgClass: "bg-yellow-500/10 hover:bg-yellow-500/20",
    textClass: "text-yellow-500",
    count: "15+ Resources",
  },
  {
    name: "Web Dev",
    icon: Globe,
    color: "from-cyan-500 to-blue-500",
    bgClass: "bg-cyan-500/10 hover:bg-cyan-500/20",
    textClass: "text-cyan-500",
    count: "40+ Resources",
  },
  {
    name: "Design",
    icon: Layout,
    color: "from-pink-500 to-rose-500",
    bgClass: "bg-pink-500/10 hover:bg-pink-500/20",
    textClass: "text-pink-500",
    count: "22+ Resources",
  },
  {
    name: "Mobile",
    icon: Smartphone,
    color: "from-indigo-500 to-purple-500",
    bgClass: "bg-indigo-500/10 hover:bg-indigo-500/20",
    textClass: "text-indigo-500",
    count: "18+ Resources",
  },
]

export function Categories() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-balance">
            Explore subjects by <span className="text-gradient-purple">category</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Find exactly what you need from our extensive collection of organized study materials.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <TiltCard maxTilt={8} scale={1.03} glare={false} className="h-full">
                <div className={`p-6 rounded-2xl border border-border/50 cursor-pointer transition-all duration-300 ${category.bgClass} group h-full flex flex-col justify-center items-center text-center`}>
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <category.icon className="w-6 h-6" />
                  </div>
                  <h3 className={`font-semibold text-lg ${category.textClass} mb-1`}>{category.name}</h3>
                  <p className="text-xs text-muted-foreground">{category.count}</p>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
