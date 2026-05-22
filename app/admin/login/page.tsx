"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Eye, EyeOff, GraduationCap, Lock, User } from "lucide-react"
import { Logo } from "@/components/shared/logo"

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-slate-950" />}>
      <AdminLoginForm />
    </Suspense>
  )
}

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResetMode, setIsResetMode] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget as HTMLFormElement)
    const email = String(formData.get("email") || "").trim().toLowerCase()
    const password = String(formData.get("password") || "")
    const next = searchParams.get("redirectedFrom") || "/admin"

    try {
      const supabase = createClient()

      if (isResetMode) {
        const response = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        })

        const data = await response.json()
        if (!response.ok || data.success === false) {
          const errMsg = data.error || "Failed to send OTP"
          console.error("OTP Generation Error:", data)
          throw new Error(errMsg)
        }

        setMessage("Verification code sent to your email. Redirecting to verify...")
        router.push(`/verify-otp?email=${encodeURIComponent(email)}&type=custom-recovery`)
        return
      }

      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      const { data: currentUserData } = await supabase.auth.getUser()
      const isEmailVerified = Boolean(user?.email_confirmed_at) && Boolean(currentUserData.user?.email_confirmed_at)
      if (!isEmailVerified) {
        await supabase.auth.signOut()
        throw new Error("Please verify your email before logging in")
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status, approved, is_active')
        .eq('id', user?.id)
        .single()

      // Rule 1: If no profile: redirect /auth/pending
      if (!profile) {
        router.push("/auth/pending")
        return
      }

      const role = profile.role || 'student'
      const status = profile.status || 'pending'
      const approved = profile.approved === true
      const isActive = profile.is_active !== false

      // Rule 3: If is_active = false OR status = 'suspended': logout user and show "Account suspended"
      if (!isActive || status === 'suspended') {
        await supabase.auth.signOut()
        throw new Error("Account suspended")
      }

      // Rule 2: If approved = false OR status = 'pending': redirect /pending-approval
      if (!approved || status === 'pending') {
        router.push("/pending-approval")
        return
      }

      const userRole = role.toLowerCase()
      const isSuperAdmin = userRole === 'super_admin' || userRole === 'superadmin'
      const isAdmin = userRole === 'admin' || isSuperAdmin

      // Redirect strictly by role
      if (isAdmin) {
        router.push("/admin")
        router.refresh()
      } else if (userRole === 'instructor') {
        router.push("/instructor")
        router.refresh()
      } else if (userRole === 'student') {
        router.push("/student")
        router.refresh()
      } else {
        await supabase.auth.signOut()
        throw new Error("Access denied. Invalid account role.")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Admin authentication failed.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-slate-950 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo className="h-12" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Administrator Access Console</p>
        </div>

        <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Admin Login</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">Please enter your administrative credentials</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/20 text-red-400">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="mb-6 bg-primary/10 border-primary/20 text-primary">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Admin Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@tensionনাই.com"
                    className="h-11 pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-primary/50"
                    required
                  />
                </div>
              </div>

              {!isResetMode && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" title="password" className="text-slate-700 dark:text-slate-300">Password</Label>
                    <button
                      type="button"
                      onClick={() => setIsResetMode(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-11 pl-10 pr-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-primary/50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full h-11 bg-primary text-primary-foreground font-bold" disabled={isLoading}>
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isResetMode ? "Send Verification Code" : "Sign In to Console"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              {isResetMode && (
                <button
                  type="button"
                  onClick={() => setIsResetMode(false)}
                  className="w-full text-center text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white mt-4"
                >
                  Back to Login
                </button>
              )}
            </form>

            <div className="mt-8 text-center border-t border-slate-200 dark:border-white/5 pt-6">
              <Link href="/login" className="text-sm text-slate-500 hover:text-primary">
                Switch to Student Access
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
