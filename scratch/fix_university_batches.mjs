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
  console.log("Testing relationship query using table names...")
  const { data, error } = await supabase
    .from("academic_batches")
    .select(`
      id,
      batch_number,
      active,
      departments(name),
      universities(name)
    `)
    .order("batch_number", { ascending: false })
  
  if (error) {
    console.error("Query failed:", error)
  } else {
    console.log("Query success! Data:")
    console.dir(data, { depth: null })
  }
}

run()
