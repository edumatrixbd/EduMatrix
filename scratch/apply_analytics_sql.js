import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function applySql() {
  const sqlPath = path.join(process.cwd(), "scripts/042_actionable_analytics.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  console.log("Applying SQL migration...");
  
  // Split SQL by statements if necessary, but here we can try running it as a whole if it's just functions
  const { error } = await supabase.rpc("admin_run_sql", { query: sql });
  
  if (error) {
    if (error.message.includes("function admin_run_sql() does not exist")) {
        console.error("admin_run_sql RPC not found. Please apply the SQL manually in the Supabase dashboard.");
    } else {
        console.error("Error applying SQL:", error);
    }
  } else {
    console.log("SQL migration applied successfully!");
  }
}

applySql();
