import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { getLatestSubscriptionAccess } from "@/lib/paid-access"

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
  university_id: string | null
  department_id: string | null
  batch_id: string | null
  university: string | null // human-readable name
  department: string | null // human-readable name
  batch: string | null // human-readable name
  phone_number: string | null
  semester: number | null
  onboarding_completed: boolean
  avatar_url: string | null
  isSubscribed?: boolean
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

      // 2. Fetch profile from standardized table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          universities(name, slug, short_name),
          departments(name, short_name),
          academic_batches(batch_number)
        `)
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error("Auth Hook: Error fetching profile:", profileError)
        return null
      }

      // 3. Fetch active subscription status
      let isSubscribed = false
      let subscriptionBatchId: string | null = null
      let subscriptionBatchNumber: string | null = null
      if (profile.role === 'student') {
        try {
          const access = await getLatestSubscriptionAccess(supabase, profile.id)
          isSubscribed = access.status === 'active'
          subscriptionBatchId = access.subscription?.batch_id || null
          subscriptionBatchNumber = access.subscription?.academic_batches?.batch_number || null
        } catch (subscriptionError: any) {
          console.error("Auth Hook: Error fetching subscription batch for user", profile.id, ":", subscriptionError)
          // Fallback to profile's batch number
          subscriptionBatchNumber = profile.academic_batches?.batch_number || null
        }
      }

      return {
        ...profile,
        batch_id: subscriptionBatchId || profile.batch_id,
        university: profile.universities?.name || null,
        department: profile.departments?.name || null,
        batch: subscriptionBatchNumber || profile.academic_batches?.batch_number || null,
        isSubscribed,
        avatar_url: session.user.user_metadata?.avatar_url || null
      } as UserProfile
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
      staleTime: 30000
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
