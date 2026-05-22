const { getSupabaseConfig } = require('./lib/supabase/config.ts');

// Mock process.env
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_pub_test';

const config = getSupabaseConfig();
console.log('Config:', config);

if (config.anonKey === config.publishableKey && config.anonKey === 'sb_pub_test') {
  console.log('SUCCESS: anonKey is correctly mapped to publishableKey');
} else {
  console.log('FAILURE: anonKey mapping failed');
  process.exit(1);
}
