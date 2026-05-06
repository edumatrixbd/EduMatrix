import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
  university: string | null
  department: string | null
  semester: number | null
  onboarding_completed: boolean
  avatar_url: string | null
}

/**
 * Hook to get the current user profile with SWR caching.
 * Prevents multiple components from fetching the session/profile repeatedly.
 */
export function useAuth() {
  const supabase = createClient()

  const { data: user, error, mutate, isLoading } = useSWR(
    'current_user_profile',
    async () => {
      // 1. Get the session (fast, from local storage/cookie)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      // 2. Fetch the profile (cached for 10 mins)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, university, department, semester, onboarding_completed')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error("Auth Hook: Error fetching profile:", profileError)
        return null
      }

      return {
        ...profile,
        avatar_url: session.user.user_metadata?.avatar_url || null
      } as UserProfile
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 600000, // 10 minutes cache
      staleTime: 600000
    }
  )

  const logout = async () => {
    await supabase.auth.signOut()
    mutate(null)
  }

  return {
    user,
    error,
    isLoading,
    logout,
    refresh: mutate
  }
}
