import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Manual env parsing
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    const key = match[1]
    let value = match[2] || ''
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    env[key] = value
  }
})

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

async function seed() {
  console.log('SEED: Starting robust Find-or-Create seed...')

  try {
    // 1. Seed University
    let uni
    const { data: existingUni } = await supabase.from('universities').select('*').eq('slug', 'diu').maybeSingle()
    
    if (existingUni) {
      uni = existingUni
      console.log('SEED: University exists:', uni.name)
    } else {
      const { data: newUni, error: uniErr } = await supabase
        .from('universities')
        .insert({ name: 'Daffodil International University', slug: 'diu', active: true })
        .select()
        .single()
      if (uniErr) throw uniErr
      uni = newUni
      console.log('SEED: University created:', uni.name)
    }

    // 2. Seed Department
    let dept
    const { data: existingDept } = await supabase.from('departments').select('*').eq('university_id', uni.id).eq('name', 'Computer Science and Engineering').maybeSingle()
    
    if (existingDept) {
      dept = existingDept
      console.log('SEED: Department exists:', dept.name)
    } else {
      const { data: newDept, error: deptErr } = await supabase
        .from('departments')
        .insert({ university_id: uni.id, name: 'Computer Science and Engineering', active: true })
        .select()
        .single()
      if (deptErr) throw deptErr
      dept = newDept
      console.log('SEED: Department created:', dept.name)
    }

    // 3. Seed Semester
    let sem
    const { data: existingSem } = await supabase.from('semesters').select('*').eq('university_id', uni.id).eq('name', 'Spring 2026').maybeSingle()
    
    if (existingSem) {
      sem = existingSem
      console.log('SEED: Semester exists:', sem.name)
    } else {
      const { data: newSem, error: semErr } = await supabase
        .from('semesters')
        .insert({ university_id: uni.id, name: 'Spring 2026', code: 'S26', is_current: true, status: 'active' })
        .select()
        .single()
      if (semErr) throw semErr
      sem = newSem
      console.log('SEED: Semester created:', sem.name)
    }

    // 4. Seed Batch
    let batch
    const { data: existingBatch } = await supabase.from('academic_batches').select('*').eq('university_id', uni.id).eq('department_id', dept.id).eq('batch', '61').maybeSingle()
    
    if (existingBatch) {
      batch = existingBatch
      console.log('SEED: Batch exists:', batch.batch)
    } else {
      const { data: newBatch, error: batchErr } = await supabase
        .from('academic_batches')
        .insert({ batch: '61', university: 'DIU', department: 'CSE', university_id: uni.id, department_id: dept.id, status: 'active' })
        .select()
        .single()
      if (batchErr) throw batchErr
      batch = newBatch
      console.log('SEED: Batch created:', batch.batch)
    }

    // 5. Seed Course
    let course
    const { data: existingCourse } = await supabase.from('courses').select('*').eq('course_code', 'CSE-201').maybeSingle()
    
    if (existingCourse) {
      course = existingCourse
      console.log('SEED: Course exists:', course.course_name)
    } else {
      const { data: newCourse, error: courseErr } = await supabase
        .from('courses')
        .insert({
          course_code: 'CSE-201',
          course_name: 'Data Structures',
          credits: 3,
          semester: 3,
          semester_id: sem.id,
          university_id: uni.id,
          department_id: dept.id,
          batch_id: batch.id,
          status: 'active',
          price: 800
        })
        .select()
        .single()
      if (courseErr) throw courseErr
      course = newCourse
      console.log('SEED: Course created:', course.course_name)
    }

    console.log('SEED: SUCCESS! All hierarchy data is live.')

  } catch (err) {
    console.error('SEED: FAILED!', err)
    process.exit(1)
  }
}

seed()
