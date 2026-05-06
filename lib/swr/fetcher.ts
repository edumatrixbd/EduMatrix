import { createClient } from "@/lib/supabase/client"

export type PaginatedResult<T> = {
  data: T[]
  count: number
  page: number
  totalPages: number
}

/**
 * Generic Supabase fetcher for SWR.
 * Key format: "table|columns|filters|page|pageSize"
 */
export async function supabaseFetcher<T>(key: string): Promise<any> {
  const supabase = createClient()
  const parsed = JSON.parse(key) as any

  // Add a 15-second timeout to prevent infinite loading
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  const { table, select, filters = [], orderBy = [], search, page, pageSize, type, queries } = parsed

  try {
    // Optimized Dashboard Stats via RPC
    if (table === "dashboard_stats" && type === "multi_count") {
      const { data, error } = await supabase.rpc('get_dashboard_stats')
      clearTimeout(timeoutId)
      if (error) throw new Error(error.message)
      return data
    }

    // Optimized Dashboard Recent Activity via RPC
    if (table === "dashboard_recent" && type === "multi_union") {
      const { data, error } = await supabase.rpc('get_recent_activity', { limit_val: 5 })
      clearTimeout(timeoutId)
      if (error) throw new Error(error.message)
      return data || []
    }

    const from = page * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from(table)
      .select(select, { count: "exact" })
      .range(from, to)
      .abortSignal(controller.signal)

    if (search && search.query && search.fields.length > 0) {
      const orQuery = search.fields
        .map((field) => `${field}.ilike.%${search.query}%`)
        .join(",")
      query = (query as any).or(orQuery)
    }

    for (const f of filters) {
      if (f.op === "ilike") {
        query = (query as any).ilike(f.column, f.value)
      } else if (f.op === "eq") {
        query = (query as any).eq(f.column, f.value)
      }
    }

    for (const o of orderBy) {
      query = (query as any).order(o.column, { ascending: o.ascending })
    }

    const { data, error, count } = await query
    clearTimeout(timeoutId)

    if (error) throw new Error(error.message)

    const totalCount = count ?? 0
    return {
      data: (data ?? []) as T[],
      count: totalCount,
      page,
      totalPages: Math.ceil(totalCount / pageSize),
    }
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.')
    }
    throw error
  }
}

/**
 * Simple JSON fetcher for /api/* routes.
 */
export const apiFetcher = (url: string) => fetch(url).then((r) => r.json())
