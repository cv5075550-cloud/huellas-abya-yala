/* worker.js · Proxy gratuito para Gemini (Cloudflare Workers)
   Variables en el panel de Cloudflare (Settings → Variables and Secrets):
     GEMINI_API_KEY   (Secret)  tu clave de Google AI Studio
     ALLOWED_ORIGINS  (Text)    p. ej. https://TU-USUARIO.github.io,http://127.0.0.1:5500
     SUPABASE_URL, SUPABASE_ANON_KEY (Text, opcionales; desde el Bloque 8 exigen sesión iniciada) */
const json = (obj, status, headers) =>
  new Response(JSON.stringify(obj), { status, headers: { ...headers, 'Content-Type': 'application/json' } });

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const okOrigin = allowed.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': okOrigin ? origin : (allowed[0] || ''),
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Vary': 'Origin'
    };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return json({ error: { message: 'Método no permitido' } }, 405, cors);
    if (!okOrigin) return json({ error: { message: 'Origen no permitido' } }, 403, cors);
    if (!env.GEMINI_API_KEY) return json({ error: { message: 'Falta GEMINI_API_KEY' } }, 500, cors);

    // Si hay Supabase configurado, solo responde a usuarios con sesión iniciada
    if (env.SUPABASE_URL) {
      const auth = req.headers.get('Authorization') || '';
      const r = await fetch(env.SUPABASE_URL + '/auth/v1/user', { headers: { Authorization: auth, apikey: env.SUPABASE_ANON_KEY || '' } });
      if (!auth || !r.ok) return json({ error: { message: 'Inicia sesión' } }, 401, cors);
    }

    let data;
    try { data = await req.json(); } catch { return json({ error: { message: 'JSON inválido' } }, 400, cors); }
    const model = /^gemini-[a-z0-9.\-]+$/i.test(data.model || '') ? data.model : 'gemini-2.5-flash-lite';
    const body = JSON.stringify(data.request || {});
    if (body.length > 12000) return json({ error: { message: 'Solicitud demasiado grande' } }, 413, cors);

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body
    });
    return new Response(r.body, { status: r.status, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
};
