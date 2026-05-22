import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseConfig, getLocalAdminConfig } from './config'

function redirectWithCookies(request: NextRequest, response: NextResponse, pathname: string) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = ''

  const redirectResponse = NextResponse.redirect(url)
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie)
  })

  return redirectResponse
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })
  const { url, anonKey, isConfigured } = getSupabaseConfig()
  const pathname = request.nextUrl.pathname
  const isDashboardRoute = pathname === '/dashboard' || pathname.startsWith('/dashboard/')
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')
  const isInstructorRoute = pathname === '/instructor' || pathname.startsWith('/instructor/')
  const isOnboardingRoute = pathname === '/onboarding' || pathname.startsWith('/onboarding/')
  const isVerifyRoute = pathname === '/verify-otp'

  if (!isConfigured) {
    if ((isDashboardRoute || isAdminRoute || isInstructorRoute) || pathname === '/login' || pathname === '/admin/login' || pathname === '/instructor/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/supabase-setup'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  const supabase = createServerClient(
    url!,
    anonKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  let user = null
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    user = authUser
  } catch (e) {
    console.error('Middleware: Error getting user:', e)
  }

  const isLoginOrAuthPath = 
    pathname === '/login' || 
    pathname === '/admin/login' || 
    pathname === '/instructor/login' || 
    pathname.startsWith('/auth/') || 
    pathname === '/pending-approval' ||
    pathname === '/auth/pending';

  const isProtectedRoute = (isDashboardRoute || isAdminRoute || isInstructorRoute || isOnboardingRoute) && 
                           !isLoginOrAuthPath && 
                           pathname !== '/instructor/apply' && 
                           !isVerifyRoute;

  // 1. Unauthenticated direct URL access prevention
  if (isProtectedRoute && !user) {
    let loginPath = '/login'
    if (pathname.startsWith('/instructor')) loginPath = '/instructor/login'
    else if (pathname.startsWith('/admin')) loginPath = '/admin/login'
    
    const url = request.nextUrl.clone()
    url.pathname = loginPath
    url.searchParams.set('redirectedFrom', pathname)

    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  // 2. Authenticated user state evaluation & multi-tier guards
  if (user) {
    // Check profiles table first
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status, approved, is_active')
      .eq('id', user.id)
      .single()

    // Rule 1: If no profile: redirect /auth/pending
    if (!profile) {
      if (!isLoginOrAuthPath && pathname !== '/auth/pending') {
        return redirectWithCookies(request, supabaseResponse, '/auth/pending')
      }
      return supabaseResponse
    }

    const role = profile.role || 'student'
    const status = profile.status || 'pending'
    const approved = profile.approved === true
    const isActive = profile.is_active !== false

    // Rule 3: If is_active = false OR status = 'suspended': logout user and show "Account suspended"
    if (!isActive || status === 'suspended') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'suspended')
      
      const redirectResponse = NextResponse.redirect(url)
      // Clear cookies to destroy browser session completely
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set({ ...cookie, maxAge: 0 })
      })

      try {
        await supabase.auth.signOut({ scope: 'global' })
      } catch (err) {
        console.error("SignOut in middleware error:", err)
      }

      return redirectResponse
    }

    // Rule 2: If approved = false OR status = 'pending': redirect /pending-approval
    if (!approved || status === 'pending') {
      if (!isLoginOrAuthPath && pathname !== '/pending-approval') {
        return redirectWithCookies(request, supabaseResponse, '/pending-approval')
      }
      // If they are on a login path, let them pass so they can sign out if needed, but block standard views
      if (isProtectedRoute) {
        return redirectWithCookies(request, supabaseResponse, '/pending-approval')
      }
      return supabaseResponse
    }

    // Rule 4 & 5: Only approved active users can enter panel. Direct URL access guards.
    const userRole = role.toLowerCase()
    const isSuperAdmin = userRole === 'super_admin' || userRole === 'superadmin'
    const isAdmin = userRole === 'admin' || isSuperAdmin

    if (isAdminRoute && !isAdmin) {
      // Direct URL entry block for admin routes
      return redirectWithCookies(request, supabaseResponse, userRole === 'instructor' ? '/instructor' : '/dashboard')
    }

    if (isInstructorRoute && userRole !== 'instructor') {
      // Direct URL entry block for instructor routes
      return redirectWithCookies(request, supabaseResponse, isAdmin ? '/admin' : '/dashboard')
    }

    if (isDashboardRoute && (isAdmin || userRole === 'instructor')) {
      // Direct URL entry block for dashboard routes
      return redirectWithCookies(request, supabaseResponse, isAdmin ? '/admin' : '/instructor')
    }

    // Prevent authenticated approved users from accessing login screens again
    if (pathname === '/login' || pathname === '/admin/login' || pathname === '/instructor/login') {
      let dest = '/dashboard'
      if (userRole === 'instructor') dest = '/instructor'
      if (isAdmin) dest = '/admin'
      return redirectWithCookies(request, supabaseResponse, dest)
    }
  }

  return supabaseResponse
}
