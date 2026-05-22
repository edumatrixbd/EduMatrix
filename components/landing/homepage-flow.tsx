"use client"

import { motion } from "framer-motion"
import { PlayCircle, FileText, Target, BookOpen, Zap, ArrowRight, Check, Sparkles, Layout, RotateCcw, BarChart3 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const BRAND_YELLOW = "#FFB00F"
const BRAND_BLACK = "#0B0B0B"
const BRAND_RED = "#FF3B30"
const EASE = [0.22, 1, 0.36, 1] as const

// 1. HERO HEADING
export function HeroHeading() {
  return (
    <section className="pt-40 pb-24 relative z-10 text-center">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <h2 className="text-6xl md:text-8xl font-black text-[#0B0B0B] dark:text-white tracking-tighter mb-12 leading-[0.85]">
            Everything you need <br/> to prepare for your exams
          </h2>
          <p className="text-2xl md:text-3xl text-[#0B0B0B]/60 dark:text-[#A1A1A1] font-black max-w-2xl mx-auto leading-tight">
            Focused. Structured. Built for real exam preparation.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// 2. FEATURE GRID (Light Glass Cards)
export function FeatureGrid() {
  const content = [
    { 
      name: "Video Lectures", 
      desc: "Short, focused lessons designed for exams",
      icon: PlayCircle, 
      color: "text-blue-500", 
      bg: "bg-blue-500/10" 
    },
    { 
      name: "Previous Questions", 
      desc: "Practice from real exam patterns",
      icon: FileText, 
      color: "text-purple-500", 
      bg: "bg-purple-500/10" 
    },
    { 
      name: "Exam Suggestions", 
      desc: "Understand what matters most",
      icon: Target, 
      color: "text-rose-500", 
      bg: "bg-rose-500/10" 
    },
    { 
      name: "Study Notes", 
      desc: "Quick revision, organized for speed",
      icon: BookOpen, 
      color: "text-emerald-500", 
      bg: "bg-emerald-500/10" 
    }
  ]

  return (
    <section className="py-24 px-4 relative z-10 bg-white/10 dark:bg-[#0B0B0B]/50 backdrop-blur-md transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {content.map((item, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: EASE }}
              whileHover={{ y: -12, boxShadow: "0 40px 80px -15px rgba(0,0,0,0.08)" }}
              className="bg-white dark:bg-white/5 dark:backdrop-blur-2xl p-12 rounded-[3.5rem] border border-white/80 dark:border-white/10 flex flex-col items-start text-left group transition-all duration-500"
            >
              <div className={`w-16 h-16 rounded-2xl ${item.bg} dark:bg-white/5 flex items-center justify-center ${item.color} mb-10 group-hover:scale-110 transition-transform duration-500`}>
                <item.icon className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-black text-[#0B0B0B] dark:text-white mb-4 tracking-tight">{item.name}</h4>
              <p className="text-[#0B0B0B]/40 dark:text-[#A1A1A1] font-black leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// 3. HOW IT WORKS
export function HowItWorks() {
  const steps = [
    { title: "Watch", desc: "Start with concise, exam-focused video lectures that break down complex topics." },
    { title: "Practice", desc: "Solve real previous exam questions to master the patterns and timing." },
    { title: "Prepare", desc: "Use curated suggestions and revision notes to finalize your preparation." }
  ]

  return (
    <section className="py-40 relative z-10 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mb-32 relative inline-block"
        >
          <h2 className="text-5xl md:text-7xl font-black text-[#0B0B0B] dark:text-white tracking-tighter leading-none mb-4">
            Get started in <span className="text-[#FFB00F] drop-shadow-[0_0_15px_rgba(255,176,15,0.4)]">3 simple steps</span>
          </h2>
          <div className="h-1.5 w-full bg-gradient-to-r from-[#FFB00F] via-[#FF3B30] to-transparent rounded-full opacity-80" />
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-20 relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-[#FFB00F]/20 to-transparent z-0" />
          
          {steps.map((step, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.2, ease: EASE }}
              className="flex flex-col items-center group relative z-10"
            >
              <div className="w-24 h-24 rounded-[2.5rem] bg-white dark:bg-white/5 dark:backdrop-blur-xl border border-white/10 dark:border-white/10 shadow-2xl flex items-center justify-center text-4xl font-black text-[#0B0B0B] dark:text-white mb-10 transition-all group-hover:scale-110 group-hover:border-[#FFB00F]/30 group-hover:bg-[#FFB00F]/5 duration-500">
                {i + 1}
              </div>
              <h3 className="text-3xl font-black text-[#0B0B0B] dark:text-white mb-6 tracking-tight">{step.title}</h3>
              <p className="text-xl text-[#0B0B0B]/50 dark:text-[#BDBDBD] font-black leading-relaxed px-4">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// 4. CORE MESSAGE (Strong Minimalist)
export function CoreMessage() {
  return (
    <section className="py-24 px-4 relative z-10">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: EASE }}
          className="bg-[#0B0B0B] dark:bg-white/5 border dark:border-white/10 text-white rounded-[4rem] py-32 px-6 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,59,48,0.05)_0%,transparent_100%)] opacity-50" />
          <div className="relative z-10 max-w-[900px] mx-auto">
            <h2 
              className="font-black tracking-[-0.04em] mb-12 leading-[1.15]"
              style={{ fontSize: "clamp(48px, 8vw, 96px)" }}
            >
              Not everything. <br/>
              Only what <span className="text-[#FFB00F] dark:text-[#FF3B30]">matters</span> <br/>
              for your exam.
            </h2>
            <div className="w-20 h-1.5 bg-[#FFB00F] dark:bg-[#FF3B30] mx-auto mb-12 rounded-full opacity-50" />
            <p className="text-2xl md:text-3xl font-black text-white/30 dark:text-[#A1A1A1] leading-tight tracking-tight">
              Stop wasting time on random topics. <br/>
              Start preparing with <span className="dark:text-[#FF3B30]/60">structure</span>.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// 5. ADDITIONAL GRID
export function AdditionalGrid() {
  const items = [
    { title: "Smart Tracking", icon: BarChart3, desc: "Monitor your progress across every course and topic." },
    { title: "Structured Learning", icon: Layout, desc: "Everything organized exactly how it appears in your syllabus." },
    { title: "Fast Revision", icon: RotateCcw, desc: "Built for speed. Find what you need in seconds." }
  ]

  return (
    <section className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -6, scale: 1.01, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
              className="bg-white dark:bg-white/5 p-16 rounded-[3.5rem] shadow-2xl border border-slate-100 dark:border-white/10 flex flex-col items-center text-center group transition-all duration-300"
            >
              <div className="w-20 h-20 rounded-[2rem] bg-[#0B0B0B] dark:bg-white/10 flex items-center justify-center text-[#FFB00F] mb-10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <item.icon className="w-10 h-10" />
              </div>
              <h4 className="text-3xl font-black text-[#0B0B0B] dark:text-white mb-6 tracking-tight">{item.title}</h4>
              <p className="text-xl text-[#0B0B0B]/40 dark:text-[#A1A1A1] font-black leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// 6. PRICING
export function Pricing() {
  const plans = [
    { name: "Free", price: "0", desc: "Basic access to get started", popular: false },
    { name: "Pro", price: "299", desc: "Complete exam-focused preparation", popular: true },
    { name: "Lifetime", price: "999", desc: "One-time payment, forever access", popular: false }
  ]

  return (
    <section className="py-40 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-32">
          <h2 className="text-5xl md:text-8xl font-black text-[#0B0B0B] dark:text-white tracking-tighter leading-none">
            Choose your path to success
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, i) => (
            <motion.div 
              key={i} 
              whileHover={{ scale: 1.02 }}
              className={`p-12 rounded-[4rem] transition-all duration-500 relative ${
                plan.popular 
                  ? 'bg-[#0B0B0B] dark:bg-white/10 text-white shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_40px_80px_-15px_rgba(255,59,48,0.1)] scale-105' 
                  : 'bg-white dark:bg-white/5 text-[#0B0B0B] dark:text-white shadow-xl border border-slate-100 dark:border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#FFB00F] dark:bg-[#FF3B30] text-[#0B0B0B] dark:text-white border-none px-6 py-2 rounded-full font-black uppercase tracking-[0.2em] text-[10px] shadow-lg">
                    Most Popular
                  </Badge>
                </div>
              )}
              <h3 className="text-4xl font-black mb-4 tracking-tight">{plan.name}</h3>
              <p className={`text-xl font-black mb-12 ${plan.popular ? 'text-white/40 dark:text-white/60' : 'text-[#0B0B0B]/40 dark:text-[#A1A1A1]'}`}>{plan.desc}</p>
              <div className="flex items-baseline gap-2 mb-12">
                <span className={`text-2xl font-black ${plan.popular ? 'text-white/20' : 'text-slate-200 dark:text-white/10'}`}>৳</span>
                <span className="text-7xl font-black tracking-tighter">{plan.price}</span>
              </div>
              <ul className="space-y-6 mb-16">
                {["Video Lectures", "Previous Questions", "Exam Suggestions", "Study Notes"].map((f, fi) => (
                  <li key={fi} className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full ${plan.popular ? 'bg-white/5' : 'bg-[#0B0B0B]/5 dark:bg-[#FF3B30]/10'} flex items-center justify-center`}>
                      <Check className={`w-3.5 h-3.5 ${plan.popular ? 'text-[#FFB00F] dark:text-[#FF3B30]' : 'text-[#0B0B0B] dark:text-[#FF3B30]'}`} />
                    </div>
                    <span className="text-lg font-black opacity-80">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/login">
                <Button size="lg" className={`w-full h-20 text-2xl font-black rounded-[1.5rem] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${plan.popular ? 'bg-[#FFB00F] text-[#0B0B0B] hover:bg-[#0B0B0B] dark:hover:bg-white hover:text-[#FFB00F] shadow-2xl' : 'bg-[#0B0B0B] dark:bg-white text-white dark:text-[#0B0B0B] hover:bg-slate-800 dark:hover:bg-slate-200'}`}>
                  Get Started
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// 7. FINAL CTA
export function FinalCTA() {
  return (
    <section className="py-40 px-4 relative z-10 text-center">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: EASE }}
          className="bg-[#0B0B0B] dark:bg-white/5 border dark:border-white/10 rounded-[5rem] py-32 px-6 text-white relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] dark:shadow-[0_50px_100px_-20px_rgba(255,59,48,0.1)]"
        >
          <div className="absolute top-0 right-0 p-12 text-[#FFB00F]/10 dark:text-[#FF3B30]/10 pointer-events-none">
            <Sparkles className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <h2 className="text-6xl md:text-9xl font-black tracking-tighter mb-12 leading-[0.85]">
              Start preparing smarter
            </h2>
            <p className="text-2xl md:text-4xl font-black text-white/30 dark:text-[#A1A1A1] mb-20 max-w-2xl mx-auto leading-tight tracking-tight">
              Everything you need, <br/> nothing you don't.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-10">
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-24 px-16 text-3xl font-black rounded-full bg-[#FFB00F] text-[#111] shadow-[0_25px_50px_-12px_rgba(255,176,15,0.2)] transition-all hover:bg-[#0B0B0B] dark:hover:bg-[#FF3B30] hover:text-[#FFB00F] group duration-200 ease-in-out dark:hover:shadow-[0_0_30px_rgba(255,59,48,0.4)] hover:-translate-y-1">
                  Start Learning
                  <ArrowRight className="ml-3 w-10 h-10 transition-transform group-hover:translate-x-3" />
                </Button>
              </Link>
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full h-24 px-16 text-3xl font-black rounded-full border-[8px] border-white/5 dark:border-white/10 bg-transparent dark:bg-white/5 text-white hover:bg-white dark:hover:bg-[#FF3B30] hover:text-[#0B0B0B] dark:text-[#FFB00F] transition-all duration-200 ease-in-out dark:hover:shadow-[0_0_30px_rgba(255,59,48,0.3)] hover:-translate-y-1">
                  Browse Courses
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
