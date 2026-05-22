import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    // Block unverified users even through OAuth/magic-link callback
    if (!error && data.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut()
      const verifyUrl = new URL('/verify-otp', requestUrl.origin)
      verifyUrl.searchParams.set('email', data.user.email || '')
      verifyUrl.searchParams.set('type', 'signup')
      return NextResponse.redirect(verifyUrl)
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
