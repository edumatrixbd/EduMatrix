"use client"

import { motion } from "framer-motion"
import { FileText, Lightbulb, MessageSquare, Download } from "lucide-react"

const resources = [
  {
    title: "Previous Questions",
    count: "5000+",
    description: "Fully solved papers from the last 10 years.",
    icon: FileText
  },
  {
    title: "Exam Suggestions",
    count: "200+",
    description: "High-probability topics analyzed by experts.",
    icon: Lightbulb
  },
  {
    title: "Quick Revision Notes",
    count: "1000+",
    description: "Concise summaries for last-minute prep.",
    icon: Download
  },
  {
    title: "Student Discussion",
    count: "10k+",
    description: "Community-driven support for every doubt.",
    icon: MessageSquare
  }
]

export function ExamResources() {
  return (
    <section className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 leading-tight">
              Unrivaled Exam <br/> Resources.
            </h2>
            <p className="text-xl text-slate-800 font-medium mb-12 leading-relaxed">
              We've digitized and organized everything you need. No more hunting through messy folders or blurry photocopies.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {resources.map((item, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -5 }}
                  className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100"
                >
                  <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center text-yellow-600 mb-4">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900">{item.count}</h4>
                  <p className="font-bold text-slate-800 mb-1">{item.title}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="aspect-[4/5] rounded-[3rem] bg-slate-900 overflow-hidden shadow-2xl relative transform rotate-3">
              <img 
                src="https://images.unsplash.com/photo-1434031211128-a3a42f1cf0ea?q=80&w=2070&auto=format&fit=crop" 
                alt="Exam preparation"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 flex items-center justify-center p-12">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl text-white">
                  <p className="text-3xl font-black mb-4 italic">"I finished my entire 3rd semester syllabus in just 2 weeks using these materials."</p>
                  <p className="font-bold">— Rafid, RUET</p>
                </div>
              </div>
            </div>
            {/* Abstract Shapes */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  )
}
