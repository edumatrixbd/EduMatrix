"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { GraduationCap, Menu, X, ChevronRight, Moon, Sun } from "lucide-react"
import { useTheme } from "@/providers/theme-provider"
import { Logo } from "@/components/shared/logo"

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#courses", label: "Courses" },
  { href: "#pricing", label: "Pricing" },
]

export function Navbar({ hideLogo = false }: { hideLogo?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm"
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo or Left Navigation (when logo is hidden and centered) */}
          <div className="flex-1 flex items-center justify-start">
            {!hideLogo ? (
              <Link href="/" className="flex items-center gap-2 group">
                <Logo className="h-10 transition-transform group-hover:scale-105" />
              </Link>
            ) : (
              <div className="hidden md:flex items-center gap-10">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative text-sm font-black text-slate-900/60 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-all group py-2"
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FFB00F] dark:bg-[#FF3B30] transition-all duration-300 group-hover:w-full" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Navigation (normal) */}
          {!hideLogo && (
            <div className="hidden md:flex flex-1 items-center justify-center gap-10">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative text-sm font-black text-slate-900/60 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-all group py-2"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FFB00F] dark:bg-[#FF3B30] transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>
          )}

          {/* Spacer for center alignment when logo is hidden */}
          {hideLogo && (
            <div className="hidden md:block flex-1"></div>
          )}

          {/* Desktop CTA */}
          <div className="hidden md:flex flex-1 items-center justify-end gap-5">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover:bg-[#FFB00F]/10 dark:hover:bg-[#FF3B30]/10 hover:text-[#FFB00F] dark:hover:text-[#FF3B30]"
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            <Link href="/login">
              <Button size="sm" className="font-black bg-[#FFB00F] text-[#0B0B0B] hover:bg-[#0B0B0B] hover:text-[#FFB00F] dark:hover:text-[#FF3B30] shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl">
                Log in
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="font-black bg-[#FFB00F] text-[#0B0B0B] hover:bg-[#0B0B0B] hover:text-[#FFB00F] dark:hover:text-[#FF3B30] shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl">
                Get Started
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-slate-900 dark:text-white hover:text-[#FFB00F] dark:hover:text-[#FF3B30] transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 pt-3 border-t border-border">
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button size="sm" className="w-full">
                      Get Started
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  )
}
