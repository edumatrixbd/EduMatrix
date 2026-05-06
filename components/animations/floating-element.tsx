"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface FloatingElementProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  yOffset?: number
  xOffset?: number
  duration?: number
  delay?: number
}

export function FloatingElement({
  children,
  className,
  yOffset = 10,
  xOffset = 0,
  duration = 4,
  delay = 0,
  ...props
}: FloatingElementProps) {
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

  if (isMobile) {
    return (
      <div className={cn("", className)} {...props}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      animate={{
        y: [0, -yOffset, 0],
        x: [0, -xOffset, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      className={cn("", className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
