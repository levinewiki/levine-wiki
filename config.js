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

const SUPABASE_URL = "PASTE_YOUR_PROJECT_URL_HERE";
const SUPABASE_ANON_KEY = "PASTE_YOUR_ANON_PUBLIC_KEY_HERE";

const REST_URL = `${SUPABASE_URL}/rest/v1`;

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

const isConfigured = () =>
  !SUPABASE_URL.startsWith("PASTE_") && !SUPABASE_ANON_KEY.startsWith("PASTE_");
