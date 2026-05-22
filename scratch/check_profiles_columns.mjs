import { createClient } from '@supabase/supabase-js'
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
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  const { data, error } = await supabase.rpc('get_profiles_schema')
  if (error) {
    // If no RPC, let's just query a single row and see the keys
    console.log("Querying single profile row...")
    const { data: row, error: qError } = await supabase.from('profiles').select('*').limit(1).maybeSingle()
    if (qError) {
      console.error("Query error:", qError)
    } else {
      console.log("Profile keys:", Object.keys(row || {}))
    }
  } else {
    console.log("Schema:", data)
  }
}

run()
