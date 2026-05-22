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

console.log("Checking tables for url:", supabaseUrl)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testTable(name) {
  const { data, error } = await supabase.from(name).select('*').limit(1)
  if (error) {
    console.log(`❌ Table "${name}" error:`, error.message)
  } else {
    console.log(`✅ Table "${name}" exists! Data count:`, data ? data.length : 0)
  }
}

async function run() {
  await testTable('course_pricing')
  await testTable('subscription_plans')
  await testTable('offers')
  await testTable('promo_codes')
}

run()
