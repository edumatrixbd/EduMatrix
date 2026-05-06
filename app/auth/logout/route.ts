import { createClient } from '@/lib/supabase/server'
import { getLocalAdminConfig } from '@/lib/supabase/config'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const response = NextResponse.redirect(new URL('/', request.url))
  response.cookies.delete(getLocalAdminConfig().cookieName)

  return response
}
