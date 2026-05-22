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
  console.log("DEFINITIONS OF video_lectures:")
  console.log(JSON.stringify(doc.definitions?.video_lectures, null, 2))
  
  console.log("\nDEFINITIONS OF study_notes:")
  console.log(JSON.stringify(doc.definitions?.study_notes, null, 2))
  
  console.log("\nDEFINITIONS OF previous_questions:")
  console.log(JSON.stringify(doc.definitions?.previous_questions, null, 2))
  
  console.log("\nDEFINITIONS OF solved_answers:")
  console.log(JSON.stringify(doc.definitions?.solved_answers, null, 2))
}

run()
