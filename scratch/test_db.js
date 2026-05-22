// scratch/test_db.js
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://fzxsawdiuxrtgktukjrk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eHNhd2RpdXhydGdrdHVranJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMwODkyNCwiZXhwIjoyMDkyODg0OTI0fQ.DHg6b5CK_qFE7SHqobedNI8-2eGbZWX0Ofnh_W8l_fA";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from("courses").select("*").limit(1);
  console.log("COURSES RECORD SAMPLE:", data);
}

run();
