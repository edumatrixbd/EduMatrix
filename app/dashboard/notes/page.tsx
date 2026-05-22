"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookOpen, Search, Eye, FileText, Loader2, ShieldCheck, Clock, Lock } from "lucide-react"
import { toast } from "sonner"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { swrKeys } from "@/lib/swr/keys"
import { supabaseFetcher } from "@/lib/swr/fetcher"
import { useDebounce } from "@/hooks/use-debounce"
import { usePaidAccess } from "@/hooks/use-paid-access"
import { cn } from "@/lib/utils"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from "@/components/ui/dialog"
import SecurePDFViewer from "@/components/shared/SecurePDFViewer"
import { ReportMistakeButton } from "@/components/report-mistake-button"

interface Note {
  id: string
  title: string
  type: string
  file_url: string | null
  courses: {
    course_name: string
    course_code: string
  } | null
}

export default function NotesPage() {
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState("")
  const [viewingNote, setViewingNote] = useState<Note | null>(null)
  const search = useDebounce(searchInput, 400)
  const access = usePaidAccess()

  const { data, isLoading } = useSWR(
    access.hasAccess ? swrKeys.notes.list(page, search) : null,
    supabaseFetcher<Note>,
    { keepPreviousData: true, revalidateOnFocus: false }
  )

  const notes = data?.data ?? []
  const totalPages = data?.totalPages ?? 0

  const handleSearch = (val: string) => {
    setSearchInput(val)
    setPage(0)
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-3">
            <BookOpen className="w-10 h-10 text-primary" />
            Study Vault
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Secure access to premium curated study materials.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 px-4 py-2 rounded-2xl">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Protected Content</span>
        </div>
      </motion.div>

      {access.loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-slate-500 font-medium">Checking access...</p>
        </div>
      ) : !access.hasAccess ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[2rem] border border-white/5 bg-slate-900/50 p-12 text-center flex flex-col items-center gap-5"
        >
          <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center border border-white/10">
            {access.isPending ? <Clock className="w-8 h-8 text-primary" /> : <Lock className="w-8 h-8 text-primary" />}
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">
              {access.isPending ? "Waiting for your payment approval" : "Upgrade your plan"}
            </h2>
            <p className="text-slate-500 max-w-md mt-2 font-medium">
              {access.isPending
                ? "Your payment is waiting for admin approval. Access will unlock after approval."
                : "You need an active subscription to access premium study materials."}
            </p>
          </div>
          {!access.isPending && (
            <Button asChild className="rounded-2xl font-black px-8">
              <Link href="/dashboard/billing">Upgrade Your Plan</Link>
            </Button>
          )}
        </motion.div>
      ) : (
        <>
      {/* Search */}
      <div className="relative group">
        <div className="absolute inset-0 bg-primary/5 blur-xl group-focus-within:bg-primary/10 transition-all rounded-3xl" />
        <div className="relative">
          {isLoading ? (
            <Loader2 className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
          ) : (
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
          )}
          <Input
            placeholder="Search vault for topics, courses or titles..."
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-12 h-14 bg-slate-900/50 border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:border-primary/50 transition-all backdrop-blur-xl"
          />
        </div>
      </div>

      {/* Notes Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {!isLoading && notes.length === 0 && (
          <div className="md:col-span-3 py-20 text-center">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
               <FileText className="w-8 h-8 text-slate-700" />
            </div>
            <p className="text-slate-500 font-bold italic">No materials found in the vault.</p>
          </div>
        )}

        {notes.map((note) => (
          <Card key={note.id} className="group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 bg-slate-900/50 border-white/5 backdrop-blur-xl rounded-[2rem] overflow-hidden">
            <div className="h-40 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
              <div className="absolute top-4 right-4">
                <Badge className="bg-white/5 text-slate-500 border-none font-black text-[9px] uppercase tracking-tighter">PDF Secure</Badge>
              </div>
              <FileText className="w-16 h-16 text-primary/40 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl text-white font-black leading-tight line-clamp-1">{note.title}</CardTitle>
              <CardDescription className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">
                {note.courses?.course_code} • {note.courses?.course_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                Study Note
              </p>
              
              {note.file_url ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="w-full bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest h-12 rounded-2xl shadow-lg shadow-primary/20"
                      onClick={() => setViewingNote(note)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Decrypt & View
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl h-[95vh] bg-slate-950 border-white/10 p-0 overflow-hidden rounded-[3rem]">
                    <div className="h-full overflow-y-auto custom-scrollbar p-8">
                      {viewingNote && (
                        <SecurePDFViewer 
                          url={viewingNote.file_url!} 
                          pdfId={viewingNote.id} 
                          fileName={viewingNote.title} 
                        />
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button 
                  size="sm" 
                  className="w-full h-12 rounded-2xl border-white/5 bg-white/5 text-slate-600 font-bold uppercase text-[10px]" 
                  variant="outline"
                  disabled
                >
                  Document Unavailable
                </Button>
              )}
              <div className="pt-2 mt-2 border-t border-white/5">
                <ReportMistakeButton 
                  materialType="note"
                  materialId={note.id}
                  materialTitle={note.title}
                  variant="ghost"
                  className="w-full text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#FF3B30] hover:bg-[#FF3B30]/10"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="pt-8 border-t border-white/5">
        <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
        </>
      )}
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn("px-2 py-1 rounded-md text-[10px] font-bold", className)}>
      {children}
    </span>
  )
}
