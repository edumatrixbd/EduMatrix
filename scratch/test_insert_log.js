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
  // Let's get an admin user id from profiles
  const { data: admin } = await supabase.from('profiles').select('id, email, role').eq('role', 'superadmin').limit(1).maybeSingle()
  console.log("Selected Admin:", admin)

  if (!admin) {
    console.error("No admin user found in profiles.")
    return
  }

  const payload = {
    admin_id: admin.id,
    admin_email: admin.email,
    action: "TEST_ACTION",
    target_type: "test",
    target_id: "test",
    details: { msg: "test" }
  }

  console.log("Attempting log insert payload:", payload)
  const { data, error } = await supabase.from('activity_logs').insert([payload]).select()
  if (error) {
    console.error("ERROR DETAIL:")
    console.error("Message:", error.message)
    console.error("Details:", error.details)
    console.error("Hint:", error.hint)
    console.error("Code:", error.code)
  } else {
    console.log("Success! Inserted log data:", data)
  }
}

run()
