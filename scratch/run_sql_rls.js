const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runSql() {
  const sql = `
    DROP POLICY IF EXISTS "allow authenticated read universities" ON public.universities;
    DROP POLICY IF EXISTS "Anyone can view active universities" ON public.universities;
    DROP POLICY IF EXISTS "public_read_universities" ON public.universities;
    
    CREATE POLICY "public_read_universities"
    ON public.universities FOR SELECT
    TO public
    USING (true);
  `;
  
  // Note: This requires the exec_sql RPC to exist. If not, I'll have to find another way.
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) console.error('SQL Error:', error);
  else console.log('SQL Executed:', data);
}

runSql();
