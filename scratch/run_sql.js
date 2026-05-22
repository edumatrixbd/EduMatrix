const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runSql() {
  const sql = `
    ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS logo_url TEXT;
    UPDATE public.universities SET logo_url = '/logos/diu.png' WHERE slug = 'diu';
  `;
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) console.error('SQL Error:', error);
  else console.log('SQL Executed:', data);
}

// runSql();
// Wait, I don't know if exec_sql rpc exists.
// I'll just use the seed script without logo_url for now to see if it works.
