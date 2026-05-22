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
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, serviceKey)

async function test() {
  // Let's test a couple of existing tables to verify connection
  const tables = ['courses', 'academic_batches', 'video_lectures', 'study_notes']
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('count')
    if (error) {
      console.log(`Table ${t}: Error - ${error.message}`)
    } else {
      console.log(`Table ${t}: Success! Row count placeholder / data exists.`)
    }
  }
}

test()
