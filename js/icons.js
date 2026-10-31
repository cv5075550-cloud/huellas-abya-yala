/* icons.js · Íconos SVG en línea (usan currentColor) */
const ICONS = (() => {
  const wrap = (body, fill = 'none') =>
    `<svg viewBox="0 0 64 64" fill="${fill}" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
  return {
    compass: wrap('<circle cx="32" cy="32" r="24"/><path d="M32 8v5M32 51v5M8 32h5M51 32h5"/><path d="M41 23l-6 15-12 3 6-15z" fill="currentColor" fill-opacity=".28"/>'),
    hourglass: wrap('<path d="M18 8h28M18 56h28"/><path d="M22 8v10l10 14-10 14v10M42 8v10L32 32l10 14v10"/><path d="M26 48h12" /><path d="M26 18h12" />'),
    scroll: wrap('<path d="M22 12h26v34a8 8 0 0 0 8 8H20a8 8 0 0 1-8-8V22a10 10 0 0 1 10-10z"/><path d="M26 24h14M26 32h14M26 40h8"/>'),
    columns: wrap('<path d="M8 25 32 10l24 15z"/><path d="M14 30v20M26 30v20M38 30v20M50 30v20M8 56h48M11 51h42"/>'),
    lock: wrap('<rect x="14" y="28" width="36" height="26" rx="5"/><path d="M22 28v-7a10 10 0 0 1 20 0v7"/>'),
    plus: wrap('<path d="M32 12v40M12 32h40"/>'),
    bulb: wrap('<path d="M24 44c0-5-8-9-8-18a16 16 0 0 1 32 0c0 9-8 13-8 18z"/><path d="M26 52h12M28 58h8"/>'),
    unlock: wrap('<rect x="14" y="28" width="36" height="26" rx="5"/><path d="M22 28v-7a10 10 0 0 1 19-4"/>'),
    star: wrap('<path d="M32 8l7.5 15.5 17 2.4-12.3 12 2.9 17L32 46.8 16.9 54.9l2.9-17-12.3-12 17-2.4z"/>'),
    map: wrap('<path d="M8 16l16-6 16 6 16-6v38l-16 6-16-6-16 6z"/><path d="M24 10v38M40 16v38"/>'),
    medal: wrap('<circle cx="32" cy="38" r="14"/><path d="M22 6l8 18M42 6l-8 18"/>'),
    book: wrap('<path d="M10 12h18a4 4 0 0 1 4 4v38a4 4 0 0 0-4-4H10zM54 12H36a4 4 0 0 0-4 4v38a4 4 0 0 1 4-4h18z"/>')
  };
})();

function injectIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => {
    if (!el.firstChild) el.innerHTML = ICONS[el.dataset.icon] || '';
  });
}