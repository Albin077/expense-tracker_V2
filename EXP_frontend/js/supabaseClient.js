
// js/supabaseClient.js
if (!window.supabaseClient) {
  const SUPABASE_URL = "https://dekmfqyokdfvtbpdghwb.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRla21mcXlva2RmdnRicGRnaHdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDk1MTAsImV4cCI6MjA4MTcyNTUxMH0.oUcUmtb9oHe24DK9esF9coaFPAOfMd8rjCdcXlrcLVc";

  window.supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}

