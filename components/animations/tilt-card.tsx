"use client"

import React, { useRef, useState, useEffect } from "react"
import { motion, useMotionValue, useSpring, useTransform, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface TiltCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  maxTilt?: number
  scale?: number
  glare?: boolean
}

export function TiltCard({
  children,
  className,
  maxTilt = 15,
  scale = 1.02,
  glare = true,
  ...props
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  
  // Track if we are on mobile (disable heavy effects)
  const [isMobile, setIsMobile] = useState(true)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || window.matchMedia("(hover: none)").matches)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Mouse position values
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Smooth springs for natural feel
  const springConfig = { damping: 20, stiffness: 150, mass: 0.5 }
  const mouseX = useSpring(x, springConfig)
  const mouseY = useSpring(y, springConfig)

  // Transforms
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [maxTilt, -maxTilt])
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-maxTilt, maxTilt])

  // Glare effect positioning
  const glareX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"])
  const glareY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"])
  const glareOpacity = useTransform(mouseX, [-0.5, 0.5], [0, 0.15])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || isMobile) return
    const rect = ref.current.getBoundingClientRect()
    
    const width = rect.width
    const height = rect.height
    
    const mouseXPos = e.clientX - rect.left
    const mouseYPos = e.clientY - rect.top
    
    // Calculate values from -0.5 to 0.5
    const xPct = mouseXPos / width - 0.5
    const yPct = mouseYPos / height - 0.5
    
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    if (isMobile) return
    x.set(0)
    y.set(0)
  }

  if (isMobile) {
    return (
      <div className={cn("relative w-full h-full", className)} {...props}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale }}
      style={{
        perspective: 1000,
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={cn("relative w-full h-full", className)}
      {...props}
    >
      <div 
        style={{ transform: "translateZ(30px)" }} 
        className="w-full h-full relative"
      >
        {children}
        
        {glare && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-50 rounded-xl"
            style={{
              background: "radial-gradient(circle at 50% 50%, white, transparent 40%)",
              left: glareX,
              top: glareY,
              opacity: glareOpacity,
              transform: "translate(-50%, -50%)",
              mixBlendMode: "overlay",
            }}
          />
        )}
      </div>
    </motion.div>
  )
}
