"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ShieldAlert, 
  Lock, 
  Eye, 
  Maximize2, 
  Minimize2, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  AlertTriangle
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Set worker for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface SecurePDFViewerProps {
  url: string
  pdfId: string
  fileName?: string
}

export default function SecurePDFViewer({ url, pdfId, fileName }: SecurePDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [loading, setLoading] = useState(true)
  const [isFocused, setIsFocused] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [ipAddress, setIpAddress] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const viewerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMetadata()
    setupSecurity()
    logAccess()

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("contextmenu", handleContextMenu)
    }
  }, [])

  const fetchMetadata = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setUserData({ ...user, ...profile })
    }

    try {
      const res = await fetch('https://api.ipify.org?format=json')
      const text = await res.text()
      if (text) {
        const data = JSON.parse(text)
        setIpAddress(data.ip)
      } else {
        setIpAddress("Forensic ID Active")
      }
    } catch (e) {
      setIpAddress("Hidden")
    }
  }

  const logAccess = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('pdf_access_logs').insert({
      user_id: user.id,
      pdf_id: pdfId,
      user_agent: navigator.userAgent,
      ip_address: ipAddress || 'pending'
    })
  }

  const setupSecurity = () => {
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("contextmenu", handleContextMenu)
    
    window.onblur = () => setIsFocused(false)
    window.onfocus = () => setIsFocused(true)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    // Disable Ctrl+P, Ctrl+S, Cmd+P, Cmd+S
    if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's')) {
      e.preventDefault()
      toastError("Action blocked for security reasons.")
    }
    // Disable Print Screen (limited support)
    if (e.key === 'PrintScreen') {
      e.preventDefault()
      navigator.clipboard.writeText("") // Clear clipboard
    }
  }

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
  }

  const toastError = (msg: string) => {
    // Implement toast or simple alert
    console.warn(msg)
  }

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
  }

  const WatermarkOverlay = () => {
    if (!userData) return null
    
    const watermarkText = `${userData.full_name || userData.email} | ID: ${userData.id.slice(0,8)} | ${ipAddress} | ${new Date().toLocaleString()}`
    
    return (
      <div className="absolute inset-0 pointer-events-none select-none z-50 overflow-hidden opacity-[0.07] dark:opacity-[0.1]">
        <div className="flex flex-wrap gap-x-20 gap-y-20 rotate-[-35deg] scale-150 origin-center justify-center items-center w-[200%] h-[200%] absolute -left-[50%] -top-[50%]">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="text-sm font-black whitespace-nowrap text-slate-900 dark:text-white uppercase tracking-widest border-2 border-slate-500/20 px-4 py-2 rounded-lg">
              {watermarkText}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-5xl mx-auto space-y-4 pt-4" ref={viewerRef}>
      {/* Header Info */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900/50 border border-white/5 rounded-3xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-black text-xs uppercase tracking-widest text-white">{fileName || "Secure Document"}</h3>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Protected by tensionনাই Guard</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 text-[9px] uppercase font-black">
             <Eye className="w-3 h-3 mr-1" /> Authorized View Only
           </Badge>
        </div>
      </div>

      {/* Viewer Container */}
      <div className={cn(
        "relative min-h-[600px] bg-slate-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-700",
        !isFocused && "blur-xl grayscale scale-[0.98] opacity-50"
      )}>
        {!isFocused && (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-4 text-white">
            <ShieldAlert className="w-16 h-16 text-primary animate-pulse" />
            <p className="font-black uppercase tracking-widest text-sm">Viewer Paused</p>
            <p className="text-xs text-slate-500 font-bold">Return focus to resume secure viewing</p>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-slate-950">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 animate-pulse">Decrypting Security Layers...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-slate-950 px-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500" />
            <p className="font-black text-white uppercase tracking-widest">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Retry Loading</Button>
          </div>
        )}

        <div className="flex justify-center p-4 md:p-12 min-h-screen">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={() => setError("Failed to load PDF. Access denied.")}
            className="flex flex-col items-center relative"
            loading={null}
          >
            <div className="relative group shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              <Page 
                pageNumber={pageNumber} 
                width={Math.min(window?.innerWidth * 0.9, 800)}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="bg-white rounded-xl overflow-hidden"
              />
              <WatermarkOverlay />
              
              {/* Fake Overlay to block selection */}
              <div className="absolute inset-0 z-40 bg-transparent" />
            </div>
          </Document>
        </div>

        {/* Controls Overlay */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-4 bg-slate-900/90 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md shadow-2xl">
          <button 
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber(prev => prev - 1)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex flex-col items-center px-4 border-l border-r border-white/10">
            <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Page</span>
            <span className="text-xs font-black text-white tracking-widest">{pageNumber} <span className="text-slate-500 opacity-50">/</span> {numPages || "?"}</span>
          </div>

          <button 
            disabled={numPages ? pageNumber >= numPages : true}
            onClick={() => setPageNumber(prev => prev + 1)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Security Warning */}
      <div className="flex items-start gap-4 p-6 bg-red-500/5 border border-red-500/10 rounded-3xl">
        <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div className="space-y-1">
          <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest">Confidentiality Agreement</h4>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            By viewing this document, you acknowledge that your IP address ({ipAddress}), device information, and identity are being logged. Any attempt to redistribute, photograph, or capture this content will lead to immediate account suspension and legal action. The watermark is persistent and contains forensic data unique to your session.
          </p>
        </div>
      </div>
    </div>
  )
}
