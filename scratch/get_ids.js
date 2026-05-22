const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function getIds() {
  const { data: unis } = await supabase.from('universities').select('id, name, slug');
  console.log('Universities:', unis);
}

getIds();
