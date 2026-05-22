export type ErrorType = 
  | 'video_load' 
  | 'hls_error' 
  | 'token_expiry' 
  | 'payment_failed' 
  | 'api_error' 
  | 'r2_error' 
  | 'auth_error'
  | 'dashboard_error_boundary'

export async function reportError(type: ErrorType, message: string, details?: any) {
  try {
    const pageUrl = typeof window !== 'undefined' ? window.location.href : 'SSR'
    
    // Log to console in dev
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR_LOG][${type}]: ${message}`, details)
    }

    await fetch('/api/error-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        errorType: type,
        pageUrl,
        message,
        details
      })
    })
  } catch (e) {
    // Fail silently to not disrupt the user
    console.error("Critical: Failed to report error to log system", e)
  }
}
