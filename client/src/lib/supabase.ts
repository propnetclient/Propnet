import { createClient } from "@supabase/supabase-js";

// Supabase project configuration
const supabaseUrl = "https://qemmbkqbmaetlgkjealj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW1ia3FibWFldGxna2plYWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Mzc1NzAsImV4cCI6MjA3ODAxMzU3MH0.lvlsu7EYqPgCDBJHLZNGJELakftdRHNXByGp3hU6sHQ";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});


