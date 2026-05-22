
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("count", { count: "exact", head: true });

  if (error) {
    console.error("Error querying subscriptions table:", JSON.stringify(error, null, 2));
    
    // Check if it's a "relation does not exist" error
    if (error.code === "42P01") {
      console.log("TABLE_MISSING: subscriptions table does not exist.");
    }
  } else {
    console.log("TABLE_EXISTS: subscriptions table exists.");
  }
}

checkTable();
