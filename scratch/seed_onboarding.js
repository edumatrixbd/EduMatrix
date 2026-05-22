const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  console.log('Seeding Onboarding Data...');
  
  // 1. Ensure University
  let { data: uni } = await supabase.from('universities').select('id').eq('short_name', 'DIU').single();
  if (!uni) {
    const { data: newUni, error: uniErr } = await supabase.from('universities').insert({
      name: 'Daffodil International University',
      slug: 'diu',
      short_name: 'DIU',
      status: 'active'
    }).select().single();
    if (uniErr) return console.error('Uni Insert Error:', uniErr);
    uni = newUni;
  }
  console.log('University ID:', uni.id);

  // 2. Ensure Department
  let { data: dept } = await supabase.from('departments').select('id').eq('university_id', uni.id).eq('short_name', 'CSE').single();
  if (!dept) {
    const { data: newDept, error: deptErr } = await supabase.from('departments').insert({
      university_id: uni.id,
      name: 'Computer Science and Engineering',
      short_name: 'CSE',
      status: 'active'
    }).select().single();
    if (deptErr) return console.error('Dept Insert Error:', deptErr);
    dept = newDept;
  }
  console.log('Department ID:', dept.id);

  // 3. Ensure Batches
  const batches = ['68', '69', '70', '71', '72'];
  for (const b of batches) {
    let { data: batch } = await supabase.from('academic_batches').select('id').eq('batch', b).eq('university', 'DIU').eq('department', 'CSE').single();
    if (!batch) {
      const { data: newBatch, error: bErr } = await supabase.from('academic_batches').insert({
        batch: b,
        university: 'DIU',
        department: 'CSE',
        status: 'active'
      }).select().single();
      if (bErr) console.error(`Batch ${b} Insert Error:`, bErr);
      else console.log(`Batch ${b} Inserted:`, newBatch.id);
    } else {
      console.log(`Batch ${b} already exists:`, batch.id);
    }
  }

  console.log('Seeding Complete!');
}

seed();
