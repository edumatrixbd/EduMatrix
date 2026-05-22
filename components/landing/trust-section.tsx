"use client"

import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"

const benefits = [
  "Structured A-Z Preparation",
  "Save hundreds of hours before exams",
  "Learn from top student contributors",
  "No more last-minute panic",
  "Everything organized by syllabus",
  "Accessible on any device"
]

export function WhySection() {
  return (
    <section className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-8 leading-tight">
              Why thousands of <br/> students trust <br/> <span className="bg-white px-3 py-1 rounded-2xl shadow-sm">tensionনাই</span>
            </h2>
            <p className="text-xl text-slate-800 font-medium mb-10 leading-relaxed">
              We know the struggle of finding the right materials the night before an exam. tensionনাই is built to eliminate that chaos. Get everything you need to ace your courses in one organized platform.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                  </div>
                  <span className="text-slate-900 font-black text-sm uppercase tracking-wide">{benefit}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-square md:aspect-video lg:aspect-square rounded-[3rem] overflow-hidden bg-white shadow-2xl relative border-8 border-white">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" 
                alt="Students studying together"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-8 left-8 bg-slate-900 p-6 rounded-3xl shadow-2xl text-white">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-700 overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i + 15}`} alt="Student" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-lg font-black leading-none mb-1">50,000+</p>
                    <p className="text-xs text-slate-300 font-bold uppercase tracking-wider">Active Students</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
