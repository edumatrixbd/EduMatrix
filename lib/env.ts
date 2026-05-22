/**
 * Central environment variable management for tensionনাই.
 * This utility ensures that required variables are present and provides type-safe access.
 */

export const env = {
  // Supabase (Public)
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  
  // Supabase (Private)
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // Cloudflare R2
  r2AccountId: process.env.R2_ACCOUNT_ID,
  r2Endpoint: process.env.R2_ENDPOINT,
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  r2BucketName: process.env.R2_BUCKET_NAME,
  r2PublicUrl: process.env.R2_PUBLIC_URL,

  // Video Streaming
  videoTokenSecret: process.env.VIDEO_TOKEN_SECRET,

  // Payment Integration (SSLCommerz or similar)
  paymentStoreId: process.env.PAYMENT_STORE_ID,
  paymentStorePassword: process.env.PAYMENT_STORE_PASSWORD,
  paymentSecretKey: process.env.PAYMENT_SECRET_KEY,

  // App Settings
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  isProduction: process.env.NODE_ENV === "production",
}

/**
 * Validates that a required environment variable is present.
 * Throws a descriptive error in production, or logs a warning in development.
 */
export function getRequiredEnv(key: keyof typeof env): string {
  const value = env[key]
  
  if (!value) {
    const errorMsg = `Missing required environment variable: ${key}`
    
    if (env.isProduction) {
      throw new Error(errorMsg)
    } else {
      console.warn(`[ENV WARNING]: ${errorMsg}`)
      return "" // Return empty string to prevent total crash in dev, but still warns
    }
  }
  
  return value as string
}

/**
 * Asserts that all critical R2 variables are present.
 */
export function assertR2Config() {
  const config = {
    accountId: getRequiredEnv("r2AccountId"),
    endpoint: getRequiredEnv("r2Endpoint"),
    accessKeyId: getRequiredEnv("r2AccessKeyId"),
    secretAccessKey: getRequiredEnv("r2SecretAccessKey"),
    bucketName: getRequiredEnv("r2BucketName"),
    publicUrl: env.r2PublicUrl,
  }

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  const placeholders = Object.entries(config)
    .filter(([, value]) => value ? isPlaceholderValue(value) : false)
    .map(([key]) => key)

  if (missing.length || placeholders.length) {
    const details = [
      missing.length ? `missing: ${missing.join(", ")}` : "",
      placeholders.length ? `placeholder values: ${placeholders.join(", ")}` : "",
    ].filter(Boolean).join("; ")

    throw new Error(`Cloudflare R2 is not configured (${details}). Update the R2_* values in .env.local.`)
  }

  validateR2Endpoint(config.endpoint, config.accountId)

  return config
}

export function getR2PublicUrl(key: string) {
  const baseUrl = env.r2PublicUrl?.replace(/\/+$/, "")
  if (!baseUrl) return null

  return `${baseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`
}

function isPlaceholderValue(value: string) {
  const normalized = value.trim().toLowerCase()
  return (
    normalized.startsWith("your_") ||
    normalized.startsWith("your-") ||
    normalized.startsWith("replace-with-") ||
    normalized.includes("your-cloudflare") ||
    normalized.includes("example")
  )
}

function validateR2Endpoint(endpoint: string, accountId: string) {
  let url: URL
  try {
    url = new URL(endpoint)
  } catch {
    throw new Error("R2_ENDPOINT must be a valid HTTPS URL.")
  }

  if (url.protocol !== "https:") {
    throw new Error("R2_ENDPOINT must use https.")
  }

  const expectedHost = `${accountId}.r2.cloudflarestorage.com`
  if (url.hostname !== expectedHost) {
    throw new Error("R2_ENDPOINT must match R2_ACCOUNT_ID and end with r2.cloudflarestorage.com.")
  }
}
