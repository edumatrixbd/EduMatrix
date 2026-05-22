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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey })
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log('Testing connection to:', supabaseUrl)
  const { data, error } = await supabase
    .from('instructor_courses')
    .select('*')
  
  if (error) {
    console.error('Error fetching instructor_courses:', error)
  } else {
    console.log('instructor_courses count:', data.length)
  }

  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, course_name')
    .limit(1)
  
  if (coursesError) {
    console.error('Error fetching courses:', coursesError)
  } else {
    console.log('Courses count:', courses.length)
  }
}

test()
