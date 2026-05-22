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
  console.log("Fetching all academic batches...")
  const { data: batches, error: batchError } = await supabase
    .from('academic_batches')
    .select('*')
  
  if (batchError) {
    console.error("Failed to fetch batches:", batchError)
    process.exit(1)
  }

  console.log(`Fetched ${batches.length} batches.`)

  console.log("Fetching all departments...")
  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .select('id, university_id, name')
  
  if (deptError) {
    console.error("Failed to fetch departments:", deptError)
    process.exit(1)
  }

  console.log(`Fetched ${departments.length} departments.`)

  // Create a map of department_id -> university_id
  const deptMap = new Map()
  departments.forEach(d => {
    deptMap.set(d.id, d.university_id)
  })

  // Backfill each batch
  let updatedCount = 0
  for (const batch of batches) {
    if (!batch.university_id) {
      const universityId = deptMap.get(batch.department_id)
      if (universityId) {
        console.log(`Backfilling batch ${batch.batch_number} (dept: ${batch.department_id}) with university_id: ${universityId}...`)
        const { error: updateError } = await supabase
          .from('academic_batches')
          .update({ university_id: universityId })
          .eq('id', batch.id)
        
        if (updateError) {
          console.error(`Failed to update batch ${batch.id}:`, updateError)
        } else {
          updatedCount++
        }
      } else {
        console.warn(`No university found for department ${batch.department_id} of batch ${batch.batch_number}`)
      }
    } else {
      console.log(`Batch ${batch.batch_number} already has university_id: ${batch.university_id}`)
    }
  }

  console.log(`Successfully backfilled ${updatedCount} batches.`)

  // Verification
  console.log("Verifying batches data...")
  const { data: verifyData, error: verifyError } = await supabase
    .from('academic_batches')
    .select('batch_number, department_id, university_id')
  
  if (verifyError) {
    console.error("Verification failed:", verifyError)
  } else {
    console.log("Verification results:")
    console.table(verifyData)
    const missingUni = verifyData.filter(b => !b.university_id)
    if (missingUni.length === 0) {
      console.log("All academic_batches rows have a valid university_id! Success.")
    } else {
      console.error(`Warning: ${missingUni.length} rows still have NULL university_id!`)
    }
  }
}

run()
