"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, Lock, ArrowRight, Eye, EyeOff } from "lucide-react"
import { Logo } from "@/components/shared/logo"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPreparingSession, setIsPreparingSession] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const prepareRecoverySession = async () => {
      const email = (searchParams.get("email") || "").toLowerCase()

      if (!email) {
        setError("Invalid reset link. Please request a new OTP.")
      }

      setIsPreparingSession(false)
    }

    prepareRecoverySession()
  }, [searchParams, supabase.auth])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)
    const email = (searchParams.get("email") || "").toLowerCase()

    if (!email) {
      setError("Email is missing. Please restart the reset process.")
      setIsLoading(false)
      return
    }

    const response = await fetch("/api/auth/update-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()
    if (!response.ok) {
      setError(data.error || "Failed to update password")
      setIsLoading(false)
      return
    }

    setMessage("Password updated successfully! Redirecting to login...")
    
    // Determine redirect based on role
    let redirectPath = "/login"
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('email', email)
        .single()
      
      if (profile) {
        const role = profile.role.toLowerCase()
        if (role === 'instructor') redirectPath = "/instructor/login"
        else if (['admin', 'superadmin', 'super_admin'].includes(role)) redirectPath = "/admin/login"
      }
    } catch (e) {
      console.warn("Failed to fetch role for redirect, defaulting to student login")
    }

    setTimeout(() => {
      router.push(redirectPath)
    }, 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-8 justify-center">
          <Logo className="h-9" />
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Choose a new password</CardTitle>
            <CardDescription>Enter a strong password to restore access to your account.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="mb-4 border-primary/30 bg-primary/5">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={6}
                    className="h-11 pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={6}
                    className="h-11 pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-11 font-semibold" disabled={isLoading || isPreparingSession}>
                {isLoading || isPreparingSession ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Update password
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Back to{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
