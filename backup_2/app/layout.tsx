import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/providers/theme-provider'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
})

export const metadata: Metadata = {
  title: 'DIU CSE Hub - Ace Your Exams',
  description: 'The ultimate exam preparation platform for Daffodil International University CSE students. Access videos, previous questions, suggestions, notes, and solved answers.',
  keywords: ['DIU', 'CSE', 'exam preparation', 'Daffodil International University', 'study materials', 'previous questions'],
  authors: [{ name: 'DIU CSE Hub Team' }],
  openGraph: {
    title: 'DIU CSE Hub - Ace Your Exams',
    description: 'The ultimate exam preparation platform for DIU CSE students',
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
    <html lang="en" className={`${inter.variable} bg-background`} data-scroll-behavior="smooth">
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
