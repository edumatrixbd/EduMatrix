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

async function inspectTable(name) {
  console.log(`\n--- Inspecting Table: ${name} ---`)
  const { data, error } = await supabase.from(name).select('*').limit(1)
  if (error) {
    console.error(`Error querying ${name}:`, error)
  } else {
    console.log(`Success! ${name} exists.`)
    console.log(`Columns:`, Object.keys(data[0] || {}))
    console.log(`Sample row:`, data[0])
  }
}

async function run() {
  await inspectTable('video_lectures')
  await inspectTable('study_notes')
  await inspectTable('previous_questions')
  await inspectTable('solved_answers')
}

run()
