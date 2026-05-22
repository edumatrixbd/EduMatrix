"use client"

import { Suspense, useEffect, useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, ShieldCheck, ArrowRight, Loader2, RefreshCw } from "lucide-react"
import { Logo } from "@/components/shared/logo"
import { toast } from "sonner"

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <VerifyForm />
    </Suspense>
  )
}

function VerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  
  const email = (searchParams.get("email") || "").toLowerCase()
  const type = searchParams.get("type") || "signup"
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(60)

  useEffect(() => {
    if (!email) {
      router.push("/login")
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [email])

  const sendOTP = async () => {
    try {
      setIsResending(true)
      setError(null)
      const { data, error } = await supabase.auth.resend({
        type: type as any,
        email: email,
      })
      console.log("Supabase resend OTP response:", data)
      if (error) throw error
      toast.success("Verification code sent to your email")
      setCountdown(60)
    } catch (err: any) {
      console.error("Error sending OTP:", err)
      setError(err?.message || "Failed to send verification code. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) return

    setIsLoading(true)
    setError(null)

    try {
      const isRecovery = type === "recovery"
      const isCustomRecovery = type === "custom-recovery"
      const verifyType = isRecovery ? "email" : type

      if (isCustomRecovery) {
        const response = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Verification failed")

        toast.success("Verification successful!")
        router.push(`/reset-password?email=${encodeURIComponent(email)}`)
        return
      }

      const { error } = await supabase.auth.verifyOtp({
        email: email,
        token: otp,
        type: verifyType as any,
      })

      if (error) throw error

      toast.success("Verification successful!")
      
      if (isRecovery) {
        router.push("/reset-password")
        return
      }

      // Get the now-verified user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      // ... existing student/signup logic ...
      const pendingPassword = sessionStorage.getItem('pending_signup_password')
      const pendingEmail = sessionStorage.getItem('pending_signup_email')

      if (pendingPassword && pendingEmail?.toLowerCase() === user.email?.toLowerCase()) {
        const { error: pwError } = await supabase.auth.updateUser({ password: pendingPassword })
        if (pwError) {
          console.warn("Password set failed (non-fatal):", pwError.message)
        }
        // Clear immediately — never leave password in storage
        sessionStorage.removeItem('pending_signup_password')
        sessionStorage.removeItem('pending_signup_email')
      }

      // Upsert student_profiles — ensures profile exists even if DB trigger was delayed
      await supabase.from('student_profiles').upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name || null,
        phone_number: user.user_metadata?.phone_number || null,
      }, { onConflict: 'id', ignoreDuplicates: false })

      // Also ensure core profiles row exists with correct role
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        role: 'student',
        full_name: user.user_metadata?.full_name || null,
      }, { onConflict: 'id', ignoreDuplicates: false })

      // Fetch profile to determine role and onboarding status
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarding_completed, university_id, department_id, batch_id')
        .eq('id', user.id)
        .single()
      
      const role = profile?.role?.toLowerCase()

      if (role === 'instructor') {
        router.push("/instructor")
        return
      }

      if (role === 'admin' || role === 'superadmin' || role === 'super_admin') {
        router.push("/admin")
        return
      }

      // Only redirect new signups to onboarding
      const isSignup = type === 'signup' || type === 'email'
      console.log("VERIFY_OTP_TYPE:", type, "isSignup:", isSignup)

      if (isSignup) {
        console.log("NEW_SIGNUP: Routing to institutional onboarding.")
        router.replace("/onboarding/university")
      } else {
        console.log("EXISTING_USER_LOGIN: Routing to dashboard.")
        router.replace("/dashboard")
      }
    } catch (err: any) {
      console.error("Verification error:", err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <Logo className="h-12" />
        </div>

        <Card className="border-border/50 shadow-premium">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
            <CardDescription className="text-base mt-2">
              We've sent a 6-digit code to <span className="font-bold text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="otp" className="text-center block text-muted-foreground uppercase tracking-wider text-xs font-bold">
                  Enter 6-Digit Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="h-16 text-center text-3xl font-bold tracking-[0.5em] bg-muted/30 border-border/50 focus:ring-primary/20 rounded-2xl"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/25"
                disabled={isLoading || otp.length < 6}
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Verify & Continue
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?
              </p>
              <Button
                variant="ghost"
                className="text-primary hover:text-primary hover:bg-primary/5 font-medium"
                onClick={sendOTP}
                disabled={isResending || countdown > 0}
              >
                {isResending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {countdown > 0 ? `Resend code in ${countdown}s` : "Resend Code"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Secure email verification</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
