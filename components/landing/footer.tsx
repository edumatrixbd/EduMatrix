"use client"

import * as React from "react"
import Link from "next/link"
import { GraduationCap, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react"
import { Logo } from "@/components/shared/logo"

const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Courses", href: "#courses" },
  ],
  resources: [
    { label: "Video Lectures", href: "/dashboard" },
    { label: "Previous Questions", href: "/dashboard" },
    { label: "Study Notes", href: "/dashboard" },
    { label: "Exam Suggestions", href: "/dashboard" },
  ],
  company: [
    { label: "About Us", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Become an Instructor", href: "/instructor/apply" },
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Terms of Service", href: "/legal/terms" },
  ],
}

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Youtube, href: "#", label: "YouTube" },
]

export function Footer() {
  return (
    <footer className="bg-white dark:bg-[#0B0B0B] text-[#111111] dark:text-white border-t border-black/[0.05] dark:border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12 sm:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-10" />
            </Link>
            <p className="mt-4 text-sm text-[#555555] dark:text-[#A1A1A1] max-w-xs leading-relaxed font-medium">
              The ultimate exam preparation platform for university students. Study smarter, not harder.
            </p>

            {/* Contact Info */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-3 text-sm text-[#555555] dark:text-[#A1A1A1]">
                <Mail className="w-4 h-4 text-[#FFB00F]" />
                <span className="font-medium">support@tensionনাই.com</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-[#555555] dark:text-[#A1A1A1]">
                <MapPin className="w-4 h-4 text-[#FFB00F]" />
                <span className="font-medium">Global Student Network</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-6 flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-9 h-9 rounded-lg bg-black/[0.03] dark:bg-white/5 flex items-center justify-center text-[#111111] dark:text-white hover:bg-[#FFB00F] hover:text-[#0B0B0B] transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-black text-[#111111] dark:text-white mb-4 uppercase tracking-wider text-xs">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#555555] dark:text-[#A1A1A1] hover:text-[#FFB00F] dark:hover:text-[#FFB00F] transition-colors font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-black text-[#111111] dark:text-white mb-4 uppercase tracking-wider text-xs">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#555555] dark:text-[#A1A1A1] hover:text-[#FFB00F] dark:hover:text-[#FFB00F] transition-colors font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-black text-[#111111] dark:text-white mb-4 uppercase tracking-wider text-xs">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#555555] dark:text-[#A1A1A1] hover:text-[#FFB00F] dark:hover:text-[#FFB00F] transition-colors font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-8 border-t border-black/[0.05] dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-[#555555] dark:text-[#A1A1A1] flex items-center gap-2 font-medium">
            <span>&copy; 2026</span>
            <Logo className="h-5" />
            <span>• All rights reserved.</span>
          </div>
          <p className="text-sm text-[#555555] dark:text-[#A1A1A1] font-bold uppercase tracking-widest text-[10px]">
            Empowering students nationwide
          </p>
        </div>
      </div>
    </footer>
  )
}
