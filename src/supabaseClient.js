import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://adbrbhrjdcrmtgqnbesf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkYnJiaHJqZGNybXRncW5iZXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4Nzk3OTgsImV4cCI6MjA5MzQ1NTc5OH0.vC-y4MIeTsJWelRVERN3imljVDQ3XUR0NDDFGAgp0AI";

export const supabase = createClient(supabaseUrl, supabaseKey);