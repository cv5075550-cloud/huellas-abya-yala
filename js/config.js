/* config.js · Ajustes del despliegue. Solo contiene datos PÚBLICOS (nunca pongas aquí la clave de Gemini). */
const APP_CONFIG = {
  // URL de tu Worker de Cloudflare (guarda la clave de Gemini). Con esto Kuntur usa IA siempre.
  // Ejemplo: 'kuntur-proxy.cobenacarlos50.workers.dev'
  AI_PROXY_URL: 'https://kuntur-proxy.cobenacarlos50.workers.dev',
  AI_MODEL: 'gemini-2.5-flash-lite',

  // Bloque 8 (cuentas y recursos): datos públicos de tu proyecto Supabase
SUPABASE_URL: 'https://zffcbdzulbfixrqheotu.supabase.co',
SUPABASE_ANON_KEY: 'sb_publishable_kV2EKoIrXjskyFa_64OzLQ_F5bbNRGi'
};
