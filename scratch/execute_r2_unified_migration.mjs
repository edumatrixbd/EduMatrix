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
  const sqlPath = path.resolve(__dirname, '../scripts/076_r2_unified_content.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')

  console.log("Attempting to run migration for 076_r2_unified_content.sql via 'exec_sql' RPC...")
  const { data: execData, error: execError } = await supabase.rpc('exec_sql', { sql_query: sql })
  
  if (execError) {
    console.warn("exec_sql RPC failed. Error details:", execError)
    console.warn("Trying 'admin_run_sql'...")
    const { data: adminData, error: adminError } = await supabase.rpc('admin_run_sql', { query: sql })
    
    if (adminError) {
      console.error("Both RPCs failed. You may need to run the migration manually in Supabase SQL editor.")
      console.error("admin_run_sql error details:", adminError)
    } else {
      console.log("Migration executed successfully via 'admin_run_sql'!", adminData)
    }
  } else {
    console.log("Migration executed successfully via 'exec_sql'!", execData)
  }
}

run()
