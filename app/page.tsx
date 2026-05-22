"use client"

import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { PlayCircle, FileText, Target, BookOpen } from "lucide-react"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { 
  HeroHeading, 
  FeatureGrid, 
  HowItWorks, 
  CoreMessage, 
  AdditionalGrid, 
  Pricing, 
  FinalCTA 
} from "@/components/landing/homepage-flow"
import { Logo } from "@/components/shared/logo"

const features = [
  { 
    title: "Video Lectures", 
    icon: PlayCircle, 
    color: "text-blue-500", 
    bg: "bg-blue-50" 
  },
  { 
    title: "Previous Questions & Solutions", 
    icon: FileText, 
    color: "text-purple-500", 
    bg: "bg-purple-50" 
  },
  { 
    title: "Exam Suggestions", 
    icon: Target, 
    color: "text-rose-500", 
    bg: "bg-rose-50" 
  },
  { 
    title: "Study Notes", 
    icon: BookOpen, 
    color: "text-emerald-500", 
    bg: "bg-emerald-50" 
  },
]

function RevealSection({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} // Smooth premium ease
      className="w-full"
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  const [step, setStep] = useState(0)
  const isAnimating = useRef(false)
  const lastActionTime = useRef(0)

  const [vh, setVh] = useState(800)
  const [headerScale, setHeaderScale] = useState(0.16)

  useEffect(() => {
    const update = () => {
      setVh(window.innerHeight)
      const currentWidth = Math.min(window.innerWidth * 0.75, 700)
      setHeaderScale(120 / currentWidth)
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  // Lock body scroll while in animation steps (0 to 2)
  useEffect(() => {
    if (step < 3) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.scrollBehavior = 'auto'
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.scrollBehavior = 'smooth'
    }
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [step])

  const goToStep = (newStep: number) => {
    if (newStep < 0 || newStep > 3) return;
    isAnimating.current = true;
    setStep(newStep);
    setTimeout(() => {
      isAnimating.current = false;
    }, 1000); // Lock for 1 second per step
  }

  // Scroll Hijack logic
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Normal scroll when unlocked
      if (step === 3 && e.deltaY > 0) return;
      
      const now = Date.now();
      
      // Reverse from unlocked state if at the top
      if (step === 3 && e.deltaY < 0 && window.scrollY <= 10) {
        if (now - lastActionTime.current > 1000 && !isAnimating.current) {
          e.preventDefault();
          lastActionTime.current = now;
          goToStep(2);
        }
        return;
      }

      // Step by step logic
      if (step < 3) {
        e.preventDefault();
        if (now - lastActionTime.current > 1000 && !isAnimating.current) {
          if (e.deltaY > 0) {
            lastActionTime.current = now;
            goToStep(step + 1);
          } else if (e.deltaY < 0) {
            lastActionTime.current = now;
            goToStep(step - 1);
          }
        }
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (step < 3) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const delta = touchStartY - touchEndY; // positive = scrolling down
      
      if (Math.abs(delta) < 30) return;

      const now = Date.now();
      if (step === 3 && delta > 0) return;
      
      if (step === 3 && delta < 0 && window.scrollY <= 10) {
        if (now - lastActionTime.current > 1000 && !isAnimating.current) {
          lastActionTime.current = now;
          goToStep(2);
        }
        return;
      }

      if (step < 3) {
        if (now - lastActionTime.current > 1000 && !isAnimating.current) {
          if (delta > 0) {
            lastActionTime.current = now;
            goToStep(step + 1);
          } else {
            lastActionTime.current = now;
            goToStep(step - 1);
          }
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    }
  }, [step])

  return (
    <main className="min-h-screen bg-[#ffb00f] dark:bg-[#0B0B0B] text-slate-900 dark:text-white transition-colors duration-500 overflow-x-hidden">
      <Navbar hideLogo={true} />

      {/* FIXED LOGO & EXAM TEXT */}
      <div className="fixed inset-0 pointer-events-none z-[60] flex items-center justify-center overflow-hidden">
        <motion.div
          variants={{
            0: { scale: 1, y: 0, opacity: 1 },
            1: { scale: 0.3, y: -160, opacity: 1 },
            2: { scale: 0.3, y: -160, opacity: 0 },
            3: { scale: 0.3, y: -160, opacity: 0 },
          }}
          initial="0"
          animate={step.toString()}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute font-black tracking-tighter leading-none text-slate-900/10 dark:text-white/10 select-none"
        >
          <span className="text-[min(18vw,260px)]">exam?</span>
        </motion.div>

        <motion.div
          variants={{
            0: { scale: 0.8, y: vh, opacity: 0 },
            1: { scale: 1, y: 0, opacity: 1 },
            2: { scale: 1, y: 0, opacity: 1 },
            3: { scale: headerScale, y: -(vh / 2) + 32, opacity: 1 },
          }}
          initial="0"
          animate={step.toString()}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute pointer-events-auto"
        >
          <Link href="/">
            <Logo
              draggable={false}
              className="w-[75vw] max-w-[700px] h-auto select-none filter drop-shadow-xl"
            />
          </Link>
        </motion.div>
      </div>

      {/* Hero Spacer that collapses perfectly at step 3 */}
      <motion.div 
        initial={false}
        animate={{ height: step < 3 ? "100vh" : "0vh" }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full flex-shrink-0"
      />

      {/* Main Content Flow */}
      <motion.div
        initial={false}
        animate={{ 
          y: step < 3 ? "-38vh" : 0, 
        }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full bg-[#ffb00f] dark:bg-[#0B0B0B] transition-colors duration-500 flex flex-col items-center"
      >
        {/* 4 Feature Boxes */}
        <motion.div 
          variants={{
            0: { opacity: 0 },
            1: { opacity: 0 },
            2: { opacity: 1, transition: { staggerChildren: 0.1 } },
            3: { opacity: 1 },
          }}
          initial="0"
          animate={step.toString()}
          className="w-full max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-12"
          style={{
            pointerEvents: step >= 2 ? "auto" : "none"
          }}
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={{
                0: { opacity: 0, y: 30, scale: 0.96 },
                1: { opacity: 0, y: 30, scale: 0.96 },
                2: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
                3: { opacity: 1, y: 0, scale: 1 },
              }}
              whileHover={{ 
                y: -4, 
                scale: 1.01,
                boxShadow: "0 12px 30px rgba(0, 0, 0, 0.08)",
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="group bg-white dark:bg-white/5 dark:backdrop-blur-md rounded-[3rem] p-10 flex flex-col items-center text-center gap-8 border border-white/80 dark:border-white/10 shadow-[0_8px_25px_rgba(0,0,0,0.06)] dark:shadow-none"
            >
              <div className={`w-24 h-24 rounded-[2rem] ${f.bg} dark:bg-[#FF3B30]/5 flex items-center justify-center ${f.color} dark:text-[#FF3B30] shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                <f.icon className="w-12 h-12" />
              </div>
              <h3 className="font-black text-[#111] dark:text-white text-xl md:text-2xl leading-tight tracking-tight px-2">
                {f.title}
              </h3>
              <div className="w-12 h-1.5 bg-[#111]/5 dark:bg-[#FF3B30]/20 rounded-full group-hover:bg-[#111]/20 dark:group-hover:bg-[#FF3B30]/40 transition-colors duration-300" />
            </motion.div>
          ))}
        </motion.div>


        {/* Normal Homepage Content (Revealed at step 3) */}
        <motion.div
          animate={{ opacity: step === 3 ? 1 : 0 }}
          transition={{ duration: 0.8 }}
          className="w-full pt-16 flex flex-col gap-0"
          style={{ pointerEvents: step === 3 ? "auto" : "none" }}
        >
          <RevealSection><HeroHeading /></RevealSection>
          <RevealSection><FeatureGrid /></RevealSection>
          <RevealSection><HowItWorks /></RevealSection>
          <RevealSection><CoreMessage /></RevealSection>
          <RevealSection><AdditionalGrid /></RevealSection>
          <RevealSection><Pricing /></RevealSection>
          <RevealSection><FinalCTA /></RevealSection>
          <Footer />
        </motion.div>
      </motion.div>
    </main>
  )
}
