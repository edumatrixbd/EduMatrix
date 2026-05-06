"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

interface PromoBannerProps {
  title: string
  description: string
  ctaText: string
  ctaLink: string
}

export function PromoBanner({ title, description, ctaText, ctaLink }: PromoBannerProps) {
  return (
    <section className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 -mt-12 sm:-mt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 sm:p-10 shadow-premium glow-premium"
      >
        {/* Colorful Gradient Accents */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex-1">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
              {title}
            </h3>
            <p className="mt-2 text-base sm:text-lg text-muted-foreground text-balance">
              {description}
            </p>
          </div>
          
          <div className="shrink-0 w-full md:w-auto">
            <Link href={ctaLink} className="block w-full">
              <Button size="lg" className="w-full md:w-auto bg-gradient-premium hover:bg-gradient-premium-hover text-white glow-premium-hover border-none transition-all duration-300 shadow-[0_0_20px_-5px_rgba(139,92,246,0.6)]">
                {ctaText}
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
