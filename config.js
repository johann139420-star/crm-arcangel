// ============================================================
// ConfiguraciÃ³n de conexiÃ³n a Supabase â€” CRM Comercializadora ArcÃ¡ngel
// ============================================================

const SUPABASE_URL = 'https://knlpzhnunevhuyqppzgd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wz9_lE06cSs76cHioqaJJA_JZUZqXiY';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
