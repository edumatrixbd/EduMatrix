import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/providers/theme-provider'
import { Toaster } from "@/components/ui/toaster"
import { AnalyticsTracker } from "@/components/analytics/tracker"
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
})

export const metadata: Metadata = {
  title: 'tensionনাই - Ace Your Exams',
  description: 'The ultimate exam preparation platform for university students. Access videos, previous questions, suggestions, notes, and solved answers.',
  keywords: ['tensionনাই', 'university', 'exam preparation', 'study materials', 'previous questions'],
  authors: [{ name: 'tensionনাই Team' }],
  openGraph: {
    title: 'tensionনাই - Ace Your Exams',
    description: 'The ultimate exam preparation platform for university students',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} bg-background`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head />
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster />
        <AnalyticsTracker />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
