import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getAdminEmails, getLocalAdminConfig, getSupabaseConfig } from './config'

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
  const isProtectedRoute = (isDashboardRoute || isAdminRoute) && pathname !== '/login' && pathname !== '/admin/login'

  if (!isConfigured) {
    if (isProtectedRoute || pathname === '/login' || pathname === '/admin/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/supabase-setup'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
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

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  let user = null
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    user = authUser
  } catch (e) {
    console.error('Middleware: Error getting user:', e)
  }

  const role = user?.app_metadata?.role ?? user?.user_metadata?.role ?? 'student'
  const adminEmails = getAdminEmails()
  const localAdmin = getLocalAdminConfig()
  const hasLocalAdminSession =
    Boolean(localAdmin.sessionSecret) &&
    request.cookies.get(localAdmin.cookieName)?.value === localAdmin.sessionSecret
  const isAdmin =
    hasLocalAdminSession ||
    role === 'admin' ||
    Boolean(user?.email && adminEmails.includes(user.email.toLowerCase()))
  const isStudent = role === 'student' || !isAdmin

  if (isProtectedRoute && !user && !hasLocalAdminSession) {
    const url = request.nextUrl.clone()
    url.pathname = isAdminRoute ? '/admin/login' : '/login'
    url.searchParams.set('redirectedFrom', pathname)

    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })

    return redirectResponse
  }

  if (user && isAdminRoute && !isAdmin) {
    return redirectWithCookies(request, supabaseResponse, '/dashboard')
  }

  if (user && isDashboardRoute && !isStudent) {
    return redirectWithCookies(request, supabaseResponse, '/admin')
  }

  if (pathname === '/login' && user) {
    return redirectWithCookies(request, supabaseResponse, isAdmin ? '/admin' : '/dashboard')
  }

  if ((pathname === '/login' || pathname === '/admin/login') && hasLocalAdminSession) {
    return redirectWithCookies(request, supabaseResponse, '/admin')
  }

  if (pathname === '/admin/login' && user) {
    return redirectWithCookies(request, supabaseResponse, isAdmin ? '/admin' : '/dashboard')
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
