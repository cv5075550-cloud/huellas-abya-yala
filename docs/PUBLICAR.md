# Publicar Huellas de Abya Yala (gratis)

## 1. GitHub Pages
1. Crea una cuenta en github.com y un repositorio **público** nuevo (p. ej. `huellas-abya-yala`).
2. Sube TODO el contenido de la carpeta del proyecto (index.html, css, js, assets, docs, cloudflare).
   Opción fácil: en el repositorio pulsa **Add file → Upload files**, arrastra las carpetas y **Commit changes**.
3. **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, carpeta `/ (root)` → **Save**.
4. En 1–2 minutos tu sitio queda en `https://TU-USUARIO.github.io/huellas-abya-yala/`.
   Cada vez que subas cambios al repositorio, la página se actualiza sola.

## 2. Kuntur con IA siempre activa (Cloudflare Worker)
La clave de Gemini NO debe ir en el código (el repositorio es público). Se guarda en un Worker gratuito:
1. Crea tu clave en aistudio.google.com → **Get API key**.
2. Crea una cuenta en dash.cloudflare.com → **Workers & Pages → Create → Create Worker**, nombre `kuntur-proxy` → **Deploy**.
3. **Edit code**: borra el contenido, pega `cloudflare/worker.js` → **Deploy**.
4. **Settings → Variables and Secrets → Add**:
   - `GEMINI_API_KEY` · tipo **Secret** · tu clave.
   - `ALLOWED_ORIGINS` · tipo **Text** · `https://TU-USUARIO.github.io,http://127.0.0.1:5500`
     (solo el dominio, sin la ruta; el segundo es para probar con Live Server).
5. Copia la URL del Worker (`https://kuntur-proxy.TU-CUENTA.workers.dev`) y pégala en `js/config.js` → `AI_PROXY_URL`.
6. Sube `config.js` a GitHub. Desde ese momento Kuntur usa IA para todos y el botón de configuración se oculta.

Si el Worker falla o se agota el límite gratuito, Kuntur sigue con sus reglas locales sin errores visibles.

## Privacidad
Los textos de los estudiantes (p. ej. el dictamen) se envían a Google. En el plan gratuito pueden usarse para mejorar sus productos.
Indica a los estudiantes que no escriban datos personales y consulta la política de tu institución.
