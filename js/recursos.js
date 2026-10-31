/* recursos.js · Recursos de la clase (Bloque 9)
   El docente sube video, audio, PDF, imágenes, archivos o enlaces (incl. YouTube); los estudiantes los ven.
   Los datos van a Supabase (tabla resources + bucket "resources"). Los permisos reales los impone la base (RLS). */
const Recursos = (() => {
  const MAX = 50 * 1024 * 1024;      // límite del plan gratuito de Supabase
  const BUCKET = 'resources';
  const KIND = { video: 'Video', audio: 'Audio', pdf: 'PDF', image: 'Imagen', file: 'Archivo', link: 'Enlace', youtube: 'YouTube' };
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let current = null;

  const on = () => typeof Auth !== 'undefined' && Auth.active() && !Auth.needsLogin();
  const enc = path => path.split('/').map(encodeURIComponent).join('/');
  const safeUrl = u => { try { const x = new URL(String(u).trim()); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch { return ''; } };
  function ytId(u) {
    try {
      const x = new URL(u), host = x.hostname.replace(/^(www|m)\./, '');
      let id = '';
      if (host === 'youtu.be') id = x.pathname.slice(1).split('/')[0];
      else if (host === 'youtube.com') id = x.searchParams.get('v') || (x.pathname.match(/\/(?:embed|shorts|live)\/([\w-]+)/) || [])[1] || '';
      return /^[\w-]{6,15}$/.test(id) ? id : '';
    } catch { return ''; }
  }
  const safeName = n => String(n).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '').slice(-80) || 'archivo';
  function kindOf(f) {
    const t = f.type || '', n = (f.name || '').toLowerCase();
    if (t.startsWith('video/')) return 'video';
    if (t.startsWith('audio/')) return 'audio';
    if (t.startsWith('image/')) return 'image';
    return t === 'application/pdf' || n.endsWith('.pdf') ? 'pdf' : 'file';
  }
  const sizeTxt = b => b >= 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
  const publicUrl = path => Auth.baseUrl() + '/storage/v1/object/public/' + BUCKET + '/' + enc(path);

  /* ---------- Pintar ---------- */
  function media(r) {
    const u = safeUrl(r.url);
    if (!u) return '';
    if (r.kind === 'video') return `<video controls preload="metadata" src="${esc(u)}"></video>`;
    if (r.kind === 'audio') return `<audio controls preload="none" src="${esc(u)}"></audio>`;
    if (r.kind === 'image') return `<img src="${esc(u)}" alt="${esc(r.title)}" loading="lazy">`;
    if (r.kind === 'youtube') {
      const id = ytId(u);
      return id ? `<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${esc(r.title)}" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>` : '';
    }
    return '';
  }
  function card(r) {
    const u = safeUrl(r.url), m = media(r);
    const d = new Date(r.created_at);
    const meta = [KIND[r.kind] || 'Recurso', isNaN(d) ? '' : d.toLocaleDateString('es-EC'), r.size ? sizeTxt(r.size) : ''].filter(Boolean).join(' · ');
    const label = r.kind === 'link' || r.kind === 'youtube' ? 'Abrir enlace' : 'Abrir o descargar';
    return `<article class="res-card">
      ${m ? `<div class="res-media">${m}</div>` : ''}
      <div class="res-body">
        <span class="tag">${esc(KIND[r.kind] || 'Recurso')}</span>
        <h3>${esc(r.title)}</h3>
        ${r.description ? `<p>${esc(r.description)}</p>` : ''}
        <small>${esc(meta)}</small>
        <div class="res-actions">
          ${u ? `<a class="btn btn-ghost" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${label}</a>` : ''}
          <button class="btn btn-ghost teacher-only" type="button" data-del="${esc(r.id)}" data-path="${esc(r.path || '')}">Eliminar</button>
        </div>
      </div></article>`;
  }

  async function render(subjectId) {
    current = subjectId;
    const box = $('#curso-resources'), list = $('#res-list');
    if (!box) return;
    if (!on()) { box.hidden = true; return; }       // sin cuentas no hay recursos
    box.hidden = false;
    list.innerHTML = '<p class="muted">Cargando recursos…</p>';
    try {
      const rows = await Auth.api(`/rest/v1/resources?subject_id=eq.${encodeURIComponent(subjectId)}&select=*&order=created_at.desc`, { bearer: Auth.token() });
      if (current !== subjectId) return;
      list.innerHTML = rows && rows.length ? rows.map(card).join('') : '<p class="empty">Aún no hay recursos en esta asignatura.</p>';
    } catch (e) {
      if (current === subjectId) list.innerHTML = `<p class="empty">No se pudieron cargar los recursos. ${esc(e.message)}</p>`;
    }
  }

  /* ---------- Crear y borrar (solo docentes; lo exige la base de datos) ---------- */
  async function create(o) {
    const title = String(o.title || '').trim();
    if (!title) throw new Error('Escribe un título.');
    if (!(await Auth.ensureFresh())) throw new Error('Tu sesión venció. Ingresa de nuevo.');
    const bearer = Auth.token();
    const row = { subject_id: o.subjectId, title: title.slice(0, 120), description: String(o.desc || '').trim().slice(0, 500) || null };
    let uploaded = '';
    if (o.type === 'file') {
      const f = o.file;
      if (!f) throw new Error('Elige un archivo.');
      if (f.size > MAX) throw new Error('El archivo supera el máximo de 50 MB. Para videos largos usa un enlace de YouTube.');
      const path = `${o.subjectId}/${Date.now()}-${safeName(f.name)}`;
      await Auth.api('/storage/v1/object/' + BUCKET + '/' + enc(path),
        { method: 'POST', raw: f, bearer, headers: { 'Content-Type': f.type || 'application/octet-stream', 'x-upsert': 'false' } });
      uploaded = path;
      Object.assign(row, { kind: kindOf(f), url: publicUrl(path), path, size: f.size });
    } else {
      const u = safeUrl(o.url);
      if (!u) throw new Error('Escribe un enlace válido que empiece con https://');
      if (o.type === 'youtube') { if (!ytId(u)) throw new Error('No reconozco ese enlace de YouTube.'); row.kind = 'youtube'; }
      else row.kind = 'link';
      row.url = u;
    }
    try { await Auth.api('/rest/v1/resources', { method: 'POST', body: row, bearer, headers: { Prefer: 'return=minimal' } }); }
    catch (e) {
      if (uploaded) Auth.api('/storage/v1/object/' + BUCKET + '/' + enc(uploaded), { method: 'DELETE', bearer }).catch(() => { /* nada */ });
      throw e;
    }
  }

  async function remove(id, path) {
    const bearer = Auth.token();
    await Auth.api('/rest/v1/resources?id=eq.' + encodeURIComponent(id), { method: 'DELETE', bearer });
    if (path) await Auth.api('/storage/v1/object/' + BUCKET + '/' + enc(path), { method: 'DELETE', bearer }).catch(() => { /* ya no está */ });
  }

  /* ---------- Eventos ---------- */
  function bind() {
    const dlg = $('#dlg-resource');
    if (!dlg) return;
    const type = $('#res-type'), msg = $('#res-msg');
    const sync = () => {
      $('#res-file-box').hidden = type.value !== 'file';
      $('#res-url-box').hidden = type.value === 'file';
      $('#res-url').placeholder = type.value === 'youtube' ? 'https://www.youtube.com/watch?v=…' : 'https://…';
    };
    type.addEventListener('change', sync);
    $('#btn-add-resource').addEventListener('click', () => { $('#form-resource').reset(); msg.textContent = ''; sync(); dlg.showModal(); });
    $('#res-cancel').addEventListener('click', () => dlg.close());
    $('#form-resource').addEventListener('submit', async e => {
      e.preventDefault();
      const btn = $('#res-save'); btn.disabled = true;
      msg.dataset.ok = '1'; msg.textContent = type.value === 'file' ? 'Subiendo… no cierres esta ventana.' : 'Guardando…';
      try {
        await create({ subjectId: current, type: type.value, title: $('#res-title').value, desc: $('#res-desc').value,
          file: $('#res-file').files[0], url: $('#res-url').value });
        dlg.close(); render(current);
      } catch (err) { msg.dataset.ok = '0'; msg.textContent = err.message; }
      btn.disabled = false;
    });
    $('#res-list').addEventListener('click', async e => {
      const b = e.target.closest('[data-del]');
      if (!b || !confirm('¿Eliminar este recurso? Los estudiantes dejarán de verlo.')) return;
      b.disabled = true;
      try { await remove(b.dataset.del, b.dataset.path); render(current); }
      catch (err) { alert('No se pudo eliminar: ' + err.message); b.disabled = false; }
    });
  }
  document.addEventListener('DOMContentLoaded', bind);

  return { render, create, remove, _t: { ytId, safeName, kindOf, safeUrl, card } };
})();
