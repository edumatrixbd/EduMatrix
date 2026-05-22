import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env.local')

const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const cleanLine = line.trim()
  if (cleanLine && !cleanLine.startsWith('#')) {
    const parts = cleanLine.split('=')
    if (parts.length >= 2) {
      const key = parts[0].trim()
      const value = parts.slice(1).join('=').trim()
      env[key] = value
    }
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

async function run() {
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    }
  })
  
  const doc = await response.json()
  const logsDef = doc.definitions?.activity_logs
  
  if (logsDef) {
    console.log("SUCCESS! Activity Logs properties:")
    console.log(JSON.stringify(logsDef.properties, null, 2))
  } else {
    console.error("activity_logs definition not found in OpenAPI spec.")
  }
}

run()
