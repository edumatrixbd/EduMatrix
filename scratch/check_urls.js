const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUrls() {
  const { data, error } = await supabase.from('content_materials').select('id, title, type, file_key, file_url').eq('type', 'video').limit(10);
  console.log("Videos:", data);
}
checkUrls();
