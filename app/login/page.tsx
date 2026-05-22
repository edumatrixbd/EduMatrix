"use client"

import { Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, Mail, Lock, ArrowRight, Eye, EyeOff, BookOpen, Video, FileQuestion, Sparkles } from "lucide-react"
import { Logo } from "@/components/shared/logo"
import { cn } from "@/lib/utils"

const features = [
  { icon: Video, text: "500+ Video Lectures" },
  { icon: FileQuestion, text: "1,500+ Previous Questions" },
  { icon: BookOpen, text: "Comprehensive Notes" },
]

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [isResetMode, setIsResetMode] = useState(false)
  const errorParam = searchParams.get('error')
  const urlError = errorParam === 'verify-email'
    ? "Please verify your email before logging in. Check your inbox for the verification code."
    : errorParam === 'suspended'
    ? "Account suspended"
    : null

  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(urlError)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const email = String(formData.get("email") || "").trim().toLowerCase()
    const password = String(formData.get("password") || "")
    const confirmPassword = String(formData.get("confirmPassword") || "")
    const fullName = String(formData.get("name") || "")
    const phone = String(formData.get("phone") || "")
    const redirectedFrom = searchParams.get("redirectedFrom")
    const next = redirectedFrom?.startsWith("/") ? redirectedFrom : "/dashboard"

    try {
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

      if (isLogin) {
        if (!password) {
          const { data: otpData, error: otpError } = await supabase.auth.signInWithOtp({ email })
          console.log("Supabase signInWithOtp response:", otpData)
          if (otpError) {
            console.error("Supabase signInWithOtp error:", otpError)
            throw new Error(otpError.message || "Failed to send OTP. Please try again.")
          }
          router.push(`/verify-otp?email=${encodeURIComponent(email)}&type=email`)
          return
        }

        const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          if (signInError.message === "Invalid login credentials") {
            setError("Invalid email or password. Alternatively, leave the password blank to receive a login code via email.")
            setIsLoading(false)
            return
          }
          throw signInError
        }

        // Authoritative server-side check — cannot be spoofed by a cached JWT
        const { data: { user: verifiedUser } } = await supabase.auth.getUser()

        if (!verifiedUser?.email_confirmed_at) {
          await supabase.auth.signOut({ scope: "global" })
          setError("Please verify your email before logging in. Check your inbox for the verification code.")
          setIsLoading(false)
          return
        }

        // Fetch profiles security parameters using verified user id
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, status, approved, is_active')
          .eq('id', verifiedUser.id)
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
          await supabase.auth.signOut({ scope: "global" })
          setError("Account suspended")
          setIsLoading(false)
          return
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
          router.replace("/admin")
          router.refresh()
          return
        }

        if (userRole === 'instructor') {
          router.replace("/instructor")
          router.refresh()
          return
        }

        if (userRole === 'student') {
          router.replace("/student")
          router.refresh()
          return
        }

        // If no matching role
        await supabase.auth.signOut({ scope: "global" })
        setError("Access denied. Invalid account role.")
        setIsLoading(false)
        return
      }

      // Signup via OTP with password — all 4 fields required
      if (!fullName) throw new Error("Full name is required")
      if (!email) throw new Error("Email is required")
      if (!password) throw new Error("Password is required")
      if (password.length < 6) throw new Error("Password must be at least 6 characters")
      if (!confirmPassword) throw new Error("Please confirm your password")
      if (password !== confirmPassword) throw new Error("Passwords do not match")
      if (!phone) throw new Error("Phone number is required")

      // Store password temporarily in sessionStorage
      // It will be set via updateUser after OTP is verified
      sessionStorage.setItem('pending_signup_password', password)
      sessionStorage.setItem('pending_signup_email', email)

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: {
            role: "student",
            full_name: fullName,
            phone_number: phone,
          },
        },
      })

      if (otpError) {
        sessionStorage.removeItem('pending_signup_password')
        sessionStorage.removeItem('pending_signup_email')
        throw new Error(otpError.message || "Failed to send verification code. Please try again.")
      }

      router.push(`/verify-otp?email=${encodeURIComponent(email)}&type=email`)
      return
    } catch (error) {
      console.error("Signup/Login error:", error)
      setError(error instanceof Error ? error.message : "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Gradient Background with Features */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-12">
            <Logo className="h-10" />
          </Link>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight text-balance">
              Organized resources for your academic success
            </h1>
            <p className="mt-4 text-lg text-white/80 max-w-md text-pretty">
              tensionনাই helps students access organized study materials, video lectures, notes, and previous questions by university, department, batch, and subject.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 space-y-4"
          >
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-white/90"
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{feature.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Hero description footer */}
          <div className="mt-12 text-white/60 text-sm italic">
            Simplifying academic life, one student at a time.
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <Logo className="h-9" />
          </Link>

          <Card className="border-0 shadow-none lg:border lg:shadow-premium">
            <CardHeader className="space-y-1 text-center pb-6">
              <CardTitle className="text-2xl font-bold">
                {isResetMode ? "Reset password" : isLogin ? "Welcome back" : "Create an account"}
              </CardTitle>
              <CardDescription>
                {isResetMode
                  ? "Enter your email and we will send a password reset link"
                  : isLogin
                  ? "Sign in to access your study materials"
                  : "Sign up to start your learning journey"}
              </CardDescription>
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
                {!isLogin && !isResetMode && (
                  <div className="space-y-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        className="h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="017XXXXXXXX"
                        className="h-11"
                        required
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your email address"
                      className="h-11 pl-10"
                      required
                    />
                  </div>
                </div>

                 {/* Password field: login + signup */}
                 {!isResetMode && (
                   <div className="space-y-4">
                     <div className="space-y-2">
                       <div className="flex items-center justify-between">
                         <Label htmlFor="password">Password</Label>
                         {isLogin && (
                           <button
                             type="button"
                             onClick={() => {
                               setIsResetMode(true)
                               setError(null)
                               setMessage(null)
                             }}
                             className="text-xs text-primary hover:underline"
                           >
                             Forgot password?
                           </button>
                         )}
                       </div>
                       <div className="relative">
                         <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                         <Input
                           id="password"
                           name="password"
                           type={showPassword ? "text" : "password"}
                           placeholder="••••••••"
                           className="h-11 pl-10 pr-10"
                           minLength={6}
                           required
                         />
                         <button
                           type="button"
                           onClick={() => setShowPassword(!showPassword)}
                           className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                         >
                           {showPassword ? (
                             <EyeOff className="h-4 w-4" />
                           ) : (
                             <Eye className="h-4 w-4" />
                           )}
                         </button>
                       </div>
                     </div>

                     {/* Confirm Password: signup only */}
                     {!isLogin && (
                       <div className="space-y-2">
                         <Label htmlFor="confirmPassword">Confirm Password</Label>
                         <div className="relative">
                           <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <Input
                             id="confirmPassword"
                             name="confirmPassword"
                             type={showPassword ? "text" : "password"}
                             placeholder="••••••••"
                             className="h-11 pl-10 pr-10"
                             minLength={6}
                             required
                           />
                         </div>
                       </div>
                     )}
                   </div>
                 )}

                {isLogin && !isResetMode && (
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" />
                    <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
                      Keep me signed in on this device
                    </Label>
                  </div>
                )}

                {!isLogin && !isResetMode && (
                  <div className="flex items-start gap-2">
                    <Checkbox id="terms" className="mt-0.5" required />
                    <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground cursor-pointer">
                      I agree to the{" "}
                      <Link href="/legal/terms" className="text-primary hover:underline">Terms of Service</Link>
                      {" "}and{" "}
                      <Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                    </Label>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {isResetMode ? "Send reset link" : isLogin ? "Sign in" : "Create account"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Toggle Login/Signup */}
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {isResetMode ? (
                  <>
                    Remember your password?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(false)
                        setIsLogin(true)
                        setError(null)
                        setMessage(null)
                      }}
                      className="text-primary font-medium hover:underline"
                    >
                      Sign in
                    </button>
                  </>
                ) : (
                  <>
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(!isLogin)
                        setError(null)
                        setMessage(null)
                      }}
                      className="text-primary font-medium hover:underline"
                    >
                      {isLogin ? "Sign up" : "Sign in"}
                    </button>
                  </>
                )}
              </p>

              <p className="mt-3 text-center text-sm text-muted-foreground flex items-center justify-center gap-4">
                <span>
                  Admin?{" "}
                  <Link href="/admin/login" className="text-primary font-medium hover:underline">
                    Use admin login
                  </Link>
                </span>
                <span className="w-px h-3 bg-border" />
                <span>
                  Instructor?{" "}
                  <Link href="/instructor/login" className="text-primary font-medium hover:underline">
                    Instructor panel
                  </Link>
                </span>
              </p>
            </CardContent>
          </Card>

          {/* Auth Status */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                Secure access with Supabase Auth
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
