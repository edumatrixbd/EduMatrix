import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

/**
 * Hook for fetching and caching static data that doesn't change often.
 * Uses a long revalidation time and keepPreviousData for smooth UI.
 */
export function useStaticData() {
  const supabase = createClient()

  const { data: universities } = useSWR(
    'static_universities',
    async () => {
      // In a real app, this might fetch from a table. 
      // For now, we use the hardcoded list but cache it.
      return [
        { id: "diu", name: "Daffodil International University" },
        { id: "nsu", name: "North South University" },
        { id: "brac", name: "BRAC University" },
        { id: "aust", name: "Ahsanullah University" },
        { id: "aiub", name: "AIUB" },
        { id: "uiu", name: "United International University" },
      ]
    },
    { 
      revalidateOnFocus: false, 
      revalidateOnReconnect: false,
      dedupingInterval: 3600000 // 1 hour
    }
  )

  const { data: departments } = useSWR(
    'static_departments',
    async () => {
      return [
        { id: "cse", name: "Computer Science and Engineering" },
        { id: "eee", name: "Electrical and Electronics Engineering" },
        { id: "bba", name: "Business Administration" },
        { id: "civil", name: "Civil Engineering" },
      ]
    },
    { 
      revalidateOnFocus: false, 
      revalidateOnReconnect: false,
      dedupingInterval: 3600000 // 1 hour
    }
  )

  return {
    universities,
    departments,
    isLoading: !universities || !departments
  }
}

/**
 * Hook for fetching all active courses once and caching them globally.
 */
export function useCourses() {
  const supabase = createClient()
  
  return useSWR(
    'active_courses_static',
    async () => {
      const { data } = await supabase
        .from('courses')
        .select('id, course_code, course_name, semester')
        .eq('status', 'active')
        .order('course_code')
      return data || []
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 600000 // 10 minutes
    }
  )
}
