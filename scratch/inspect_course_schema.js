const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8')
const env = {}
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '')
  }
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const sql = `
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'courses';
  `
  // We can't run this query directly unless we have an admin RPC or a select from a custom view or we can just fetch one row from courses if there are any!
  // Wait! Let's try querying information_schema columns via supabase.rpc if possible, or wait!
  // Supabase postgrest doesn't expose information_schema directly unless RLS is bypassed or we have a custom view.
  // But wait! We can query pg_catalog or information_schema if there is no RLS on it, but usually Postgrest blocks information_schema.
  // Let's try querying it anyway to see if postgrest has access!
  const { data, error } = await supabase.from('courses').select().limit(1)
  if (error) {
    console.error("Select error:", error)
  } else {
    console.log("Success fetching courses row! Sample row:", data[0])
    // If empty, let's try getting all columns by doing a dummy select that fails or a raw select
  }
}

run()
