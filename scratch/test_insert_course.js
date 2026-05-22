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
  // Let's get a valid university_id, department_id, batch_id from the DB
  const { data: uni } = await supabase.from('universities').select('id').limit(1).maybeSingle()
  const { data: dept } = await supabase.from('departments').select('id').limit(1).maybeSingle()
  const { data: batch } = await supabase.from('academic_batches').select('id').limit(1).maybeSingle()

  if (!uni || !dept || !batch) {
    console.error("Missing institutional hierarchy records in DB to test insert.")
    return
  }

  const payload = {
    course_code: "TEST101",
    course_name: "Test Course",
    description: "Test description",
    instructor: "Test Instructor",
    credits: 3,
    semester: 1,
    university_id: uni.id,
    department_id: dept.id,
    batch_id: batch.id,
    status: 'active'
  }

  console.log("Attempting insert payload:", payload)
  const { data, error } = await supabase.from('courses').insert([payload]).select()
  if (error) {
    console.error("ERROR DETAIL:")
    console.error("Message:", error.message)
    console.error("Details:", error.details)
    console.error("Hint:", error.hint)
    console.error("Code:", error.code)
  } else {
    console.log("Success! Inserted data:", data)
  }
}

run()
