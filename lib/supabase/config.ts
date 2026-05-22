export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return {
    url,
    publishableKey,
    anonKey: publishableKey,
    isConfigured: Boolean(url && publishableKey),
  }
}

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function getLocalAdminConfig() {
  return {
    username: process.env.LOCAL_ADMIN_USERNAME,
    password: process.env.LOCAL_ADMIN_PASSWORD,
    sessionSecret: process.env.LOCAL_ADMIN_SESSION_SECRET,
    cookieName: "diu-local-admin",
  }
}

export function assertSupabaseConfig() {
  const config = getSupabaseConfig()

  if (!config.isConfigured) {
    throw new Error(
      "Missing Supabase configuration. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.",
    )
  }

  return {
    url: config.url!,
    anonKey: config.publishableKey!, // Keeping the key name internal to avoid breaking all consumers
  }
}
