// Creates Supabase client from config.js (load after supabase-js CDN and config.js)
(function () {
  if (typeof window.SUPABASE_URL === "undefined" || !window.SUPABASE_URL.includes("supabase.co")) {
    window.sb = null;
    return;
  }
  if (typeof supabase !== "undefined") {
    window.sb = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  } else {
    window.sb = null;
  }
})();
