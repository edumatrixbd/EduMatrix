"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function CTAStory() {
  return (
    <section className="py-32 relative z-10 overflow-hidden">
      {/* Playful background pattern matching yellow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000001a_2px,transparent_2px),linear-gradient(to_bottom,#0000001a_2px,transparent_2px)] bg-[size:48px_48px]" />
      
      <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter mb-8 leading-[0.9]">
            Exam tension? <br/> <span className="bg-white px-6 py-2 rounded-[2rem] shadow-2xl">tensionনাই।</span>
          </h2>
          <p className="text-2xl text-slate-800 font-bold mb-12 max-w-2xl mx-auto leading-relaxed">
            Join 50,000+ students who have transformed their study habits and aced their exams.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto h-16 px-10 text-xl font-black rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-2xl transition-all hover:scale-105 active:scale-95">
                Start Learning Now
                <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-16 px-10 text-xl font-black rounded-full border-4 border-slate-900 bg-transparent hover:bg-slate-900 hover:text-white text-slate-900 transition-all">
                Browse Courses
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
