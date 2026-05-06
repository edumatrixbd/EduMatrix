"use client"

import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { PromoBanner } from "@/components/landing/promo-banner"
import { Features } from "@/components/landing/features"
import { Categories } from "@/components/landing/categories"
import { CoursesPreview } from "@/components/landing/courses-preview"
import { Pricing } from "@/components/landing/pricing"
import { CTA } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <PromoBanner 
        title="Welcome to EduMatrix" 
        description="Access organized study materials, video lectures, and previous questions in one place."
        ctaText="Explore Now"
        ctaLink="/login"
      />
      <Features />
      <Categories />
      <CoursesPreview />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  )
}
