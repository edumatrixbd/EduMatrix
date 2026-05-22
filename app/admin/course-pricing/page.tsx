"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CoursePricingRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/admin/pricing")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-slate-500 font-medium animate-pulse">Redirecting to modern Superadmin Pricing Panel...</p>
    </div>
  )
}
