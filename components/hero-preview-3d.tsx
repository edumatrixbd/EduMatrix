"use client"

import Image from "next/image"
import { motion } from "framer-motion"

export function HeroPreview3D() {
  return (
    <div className="relative mx-auto mt-20 max-w-6xl h-[300px] sm:h-[400px] md:h-[540px] overflow-hidden px-6">
      {/* Blue Glow Background */}
      <div className="absolute inset-0 -top-20 z-0 flex items-center justify-center">
        <div className="h-[300px] w-[600px] sm:h-[400px] sm:w-[800px] rounded-full bg-blue-500/20 blur-[80px] sm:blur-[120px]" />
      </div>

      <style>{`
        @keyframes float-center {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float-left {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-10px) translateY(-5px); }
        }
        @keyframes float-right {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(10px) translateY(-5px); }
        }
        .anim-float-center { animation: float-center 6s ease-in-out infinite; }
        .anim-float-left { animation: float-left 7s ease-in-out infinite; }
        .anim-float-right { animation: float-right 8s ease-in-out infinite; }
      `}</style>

      <div className="relative z-10 flex items-center justify-center h-full w-full group">
        
        {/* Left Screenshot (Course) */}
        <motion.div
          initial={{ opacity: 0, x: 50, rotate: 0 }}
          animate={{ opacity: 0.95, x: 0, rotate: -5 }}
          transition={{ duration: 1, delay: 0.2, type: "spring", stiffness: 50 }}
          className="absolute left-[10%] w-[70%] hidden lg:block z-10 scale-100 origin-bottom-right"
        >
          {/* Hover Parallax Wrapper */}
          <div className="transition-all duration-500 ease-out group-hover:-translate-x-4 group-hover:-rotate-1 group-hover:opacity-100">
            {/* CSS Floating Animation Wrapper */}
            <div className="anim-float-left">
              <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 shadow-2xl backdrop-blur-sm">
                <Image
                  src="/previews/course.png"
                  alt="Course Interface Preview"
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Screenshot (Admin) */}
        <motion.div
          initial={{ opacity: 0, x: -50, rotate: 0 }}
          animate={{ opacity: 0.95, x: 0, rotate: 5 }}
          transition={{ duration: 1, delay: 0.4, type: "spring", stiffness: 50 }}
          className="absolute right-[10%] w-[70%] hidden lg:block z-10 scale-100 origin-bottom-left"
        >
          {/* Hover Parallax Wrapper */}
          <div className="transition-all duration-500 ease-out group-hover:translate-x-4 group-hover:rotate-1 group-hover:opacity-100">
            {/* CSS Floating Animation Wrapper */}
            <div className="anim-float-right">
              <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 shadow-2xl backdrop-blur-sm">
                <Image
                  src="/previews/admin.png"
                  alt="Admin Interface Preview"
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Center Main Screenshot (Dashboard) */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 50 }}
          className="absolute w-[90%] lg:w-[68%] max-w-4xl z-30"
        >
          {/* Hover Parallax Wrapper */}
          <div className="transition-all duration-500 ease-out group-hover:scale-[1.02] group-hover:-translate-y-2">
            {/* CSS Floating Animation Wrapper */}
            <div className="anim-float-center">
              <div className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl ring-1 ring-white/10 shadow-blue-500/20">
                {/* macOS-style Top Bar */}
                <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/80 px-4 py-3 backdrop-blur-md">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                {/* Image */}
                <Image
                  src="/previews/dashboard.png"
                  alt="Dashboard Interface Preview"
                  width={1600}
                  height={1000}
                  priority
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}

