"use client"

import { useState } from "react"
import useSWR from "swr"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, MessageSquare, Loader2, ShieldCheck, FileText } from "lucide-react"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { swrKeys } from "@/lib/swr/keys"
import { supabaseFetcher } from "@/lib/swr/fetcher"
import { useDebounce } from "@/hooks/use-debounce"
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger 
} from "@/components/ui/dialog"
import SecurePDFViewer from "@/components/shared/SecurePDFViewer"
import { ReportMistakeButton } from "@/components/report-mistake-button"

interface SolvedAnswer {
  id: string
  title: string
  content: string | null
  file_url: string | null
  courses: { course_name: string; course_code: string } | null
}

export default function SolvedAnswersPage() {
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState("")
  const [viewingSolution, setViewingSolution] = useState<SolvedAnswer | null>(null)
  const search = useDebounce(searchInput, 400)

  const { data, isLoading } = useSWR(
    swrKeys.solved.list(page, search),
    supabaseFetcher<SolvedAnswer>,
    { keepPreviousData: true, revalidateOnFocus: false }
  )

  const answers = data?.data ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-3">
            <MessageSquare className="w-10 h-10 text-primary" />
            Solved Repository
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Expertly solved answers for past exam papers.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 px-4 py-2 rounded-2xl">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Forensic Secure</span>
        </div>
      </motion.div>

      <div className="relative group">
        <div className="absolute inset-0 bg-primary/5 blur-xl group-focus-within:bg-primary/10 transition-all rounded-3xl" />
        <div className="relative">
          {isLoading ? (
            <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
          ) : (
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          )}
          <Input 
            placeholder="Search solutions by topic or course code..." 
            value={searchInput} 
            onChange={(e) => { setSearchInput(e.target.value); setPage(0) }} 
            className="pl-12 h-14 bg-slate-900/50 border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:border-primary/50 transition-all backdrop-blur-xl" 
          />
        </div>
      </div>

      <div className="space-y-4">
        {isLoading && !data && [...Array(4)].map((_, i) => (
          <Card key={i} className="bg-slate-900/50 border-white/5 h-24 animate-pulse" />
        ))}

        {!isLoading && answers.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
            <p className="text-slate-600 font-bold italic">No solutions found matching your criteria.</p>
          </div>
        )}

        {answers.map((answer) => (
          <Card key={answer.id} className="group hover:bg-white/[0.02] transition-all duration-300 bg-slate-900/50 border-white/5 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-black text-white text-lg group-hover:text-primary transition-colors">{answer.title}</h3>
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{answer.courses?.course_code} • {answer.courses?.course_name}</p>
                </div>
                
                {answer.file_url ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full sm:w-auto shrink-0 bg-white text-black hover:bg-slate-200 font-black uppercase text-[10px] tracking-widest h-12 px-8 rounded-xl shadow-xl shadow-white/5"
                        onClick={() => setViewingSolution(answer)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Decrypt Solution
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl h-[95vh] bg-slate-950 border-white/10 p-0 overflow-hidden rounded-[3rem]">
                      <div className="h-full overflow-y-auto custom-scrollbar p-8">
                        {viewingSolution && (
                          <SecurePDFViewer 
                            url={viewingSolution.file_url!} 
                            pdfId={viewingSolution.id} 
                            fileName={viewingSolution.title} 
                          />
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button variant="outline" className="w-full sm:w-auto shrink-0 border-white/5 text-slate-600 font-bold uppercase text-[10px] h-12 rounded-xl" disabled>
                    Draft Only
                  </Button>
                )}
                <div className="w-full sm:w-auto mt-2 sm:mt-0 flex justify-end">
                  <ReportMistakeButton 
                    materialType="solved_answer"
                    materialId={answer.id}
                    materialTitle={answer.title}
                    variant="ghost"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#FF3B30] hover:bg-[#FF3B30]/10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="pt-8 border-t border-white/5">
        <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
