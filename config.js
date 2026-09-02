// ---------------------------------------------------------------------------
// FILL IN THESE TWO VALUES. Everything else in the project works as-is.
//
// Find them in Supabase: Project Settings -> API
//   SUPABASE_URL      is "Project URL"       (looks like https://abcdefgh.supabase.co)
//   SUPABASE_ANON_KEY is the "anon public" key (a long string starting with eyJ)
//
// The anon key is meant to be public and safe to commit. It only permits what
// your table policies permit, which is: read tips, add tips. Nothing else.
// Never paste the "service_role" key here — that one bypasses every policy.
// ---------------------------------------------------------------------------

const SUPABASE_URL = "https://axcrhssxyytoavcwgeei.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4Y3Joc3N4eXl0b2F2Y3dnZWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNTM2MzIsImV4cCI6MjEwMzkyOTYzMn0.ui-ElVuU3i4kEP6Oj-HpZGu9I6yEySgKO3XmgP9Hd_c";

const REST_URL = `${SUPABASE_URL}/rest/v1`;

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

const isConfigured = () =>
  !SUPABASE_URL.startsWith("PASTE_") && !SUPABASE_ANON_KEY.startsWith("PASTE_");
