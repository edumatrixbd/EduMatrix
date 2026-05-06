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
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const email = String(formData.get("email") || "").trim()
    const password = String(formData.get("password") || "")
    const confirmPassword = String(formData.get("confirmPassword") || "")
    const fullName = String(formData.get("name") || "")
    const redirectedFrom = searchParams.get("redirectedFrom")
    const next = redirectedFrom?.startsWith("/") ? redirectedFrom : "/dashboard"

    try {
      if (isResetMode) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })

        if (error) throw error

        setMessage("Password reset link sent. Please check your email.")
        return
      }

      if (isLogin) {
        if (!password) {
          const { error: otpError } = await supabase.auth.signInWithOtp({ email })
          if (otpError) throw otpError
          router.push(`/verify-otp?email=${encodeURIComponent(email)}&type=email`)
          return
        }

        const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError

        // Fetch profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, onboarding_completed')
          .eq('id', user?.id)
          .single()

        console.log("Logged in user:", user?.id)
        console.log("Profile role:", profile?.role)
        console.log("Onboarding completed:", profile?.onboarding_completed)

        if (profile?.role !== 'student') {
          await supabase.auth.signOut()
          throw new Error("Invalid role for student login")
        }

        const nextPath = profile?.onboarding_completed ? next : "/onboarding/university"
        console.log("Redirecting to:", nextPath)
        
        router.push(nextPath)
        router.refresh()
        return
      }

      if (password !== confirmPassword && password) {
        throw new Error("Passwords do not match")
      }

      if (!password) {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            data: {
              full_name: fullName,
              role: "student",
            },
          },
        })
        if (otpError) throw otpError
        router.push(`/verify-otp?email=${encodeURIComponent(email)}&type=email`)
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: "student",
          },
        },
      })

      if (error) throw error

      console.log("Signup successful for:", email)
      console.log("Redirecting to: /verify-otp")
      router.push(`/verify-otp?email=${encodeURIComponent(email)}&type=signup`)
      return
    } catch (error) {
      console.error("Signup/Login error:", error)
      setError(error instanceof Error ? error.message : "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)
    setMessage(null)

    const redirectedFrom = searchParams.get("redirectedFrom")
    const next = redirectedFrom?.startsWith("/") ? redirectedFrom : "/dashboard"

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })

    if (error) {
      setError(error.message)
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              EduMatrix
            </span>
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
              EduMatrix helps students access organized study materials, video lectures, notes, and previous questions by university, department, batch, and subject.
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-foreground">
              EduMatrix
            </span>
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

                {!isResetMode && (
                  <div className={cn("space-y-4", !isLogin && "grid grid-cols-1 sm:grid-cols-2 gap-4 space-y-0")}>
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

              {!isResetMode && (
                <>
                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  {/* Social Login */}
                  <Button
                    variant="outline"
                    className="w-full h-11"
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                </>
              )}

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
