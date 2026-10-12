// Shared helpers: data loading, icons, header/footer, cards.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* ---------- data ---------- */
export async function loadJSON(name) {
  const res = await fetch(`data/${name}.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load data/${name}.json (${res.status})`);
  return res.json();
}

export function loadAll(names) {
  return Promise.all(names.map(loadJSON)).then((list) =>
    Object.fromEntries(names.map((n, i) => [n, list[i]]))
  );
}

/* ---------- icons (Lucide-style, 24×24 strokes) ---------- */
const ICONS = {
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  twitter: '<path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>',
  github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'arrow-right': '<path d="M5 12h14M12 5l7 7-7 7"/>',
  'arrow-left': '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
  fork: '<circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9m6 3v3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
  bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2m16 0h2m-7-1v2m-6-2v2"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  'shield-check': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  repo: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  server: '<rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6 6h.01M6 18h.01"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0m1 7v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.48 12.89 17 22l-5-3-5 3 1.52-9.11"/>',
  sparkles: '<path d="m12 3-1.91 5.81a2 2 0 0 1-1.28 1.28L3 12l5.81 1.91a2 2 0 0 1 1.28 1.28L12 21l1.91-5.81a2 2 0 0 1 1.28-1.28L21 12l-5.81-1.91a2 2 0 0 1-1.28-1.28Z"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M16 13H8m8 4H8m2-8H8"/>',
  'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  briefcase: '<rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  terminal: '<path d="m4 17 6-6-6-6M12 19h8"/>',
  layout: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
  'arrow-up-right':'<path d="M7 17 17 7M7 7h10v10"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  external: '<path d="M15 3h6v6M10 14 21 3m-3 10v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
};

export function icon(name, cls = '') {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.code}</svg>`;
}

/* ---------- language colours (GitHub linguist) ---------- */
const LANG_COLORS = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572a5', Java: '#b07219', Rust: '#dea584',
  'C++': '#f34b7d', C: '#555555', 'C#': '#178600', HTML: '#e34c26', CSS: '#563d7c', Vue: '#41b883',
  'Jupyter Notebook': '#da5b0b', PHP: '#4f5d95', Go: '#00add8', Kotlin: '#a97bff', Dart: '#00b4ab',
  Shell: '#89e051', SCSS: '#c6538c', Svelte: '#ff3e00',
};
export const langColor = (name) => LANG_COLORS[name] || '#adb6c5';

/* ---------- formatting ---------- */
export function compact(n) {
  if (typeof n !== 'number') return esc(n);
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K+';
  return String(n);
}

export function timeAgo(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  const units = [['y', 31536000], ['mo', 2592000], ['w', 604800], ['d', 86400], ['h', 3600], ['m', 60]];
  for (const [u, sec] of units) if (s >= sec) return `${Math.floor(s / sec)}${u} ago`;
  return 'just now';
}

/* ---------- header & footer ---------- */
const NAV = [
  ['home', 'Home'], ['projects', 'Projects'], ['repositories', 'Repositories'],
  ['skills', 'Skills'], ['achievements', 'Achievements'], ['about', 'About'],
];

/* "owner/name" → logo tile + owner / name, like a repository path */
function brandHTML(brand) {
  const [owner, ...rest] = String(brand).split('/');
  const name = rest.join('/');
  return `
    <span class="brand-mark" aria-hidden="true">${icon('code')}</span>
    <span class="brand-text">
      <span class="brand-owner">${esc(owner)}</span>${name ? `<span class="brand-slash">/</span><span class="brand-name">${esc(name)}</span>` : ''}
    </span>`;
}

export function mountChrome({ page, site, profile }) {
  const onHome = page === 'home';
  const href = (id) => {
    if (id === 'projects' && !onHome) return 'projects.html';
    return onHome ? `#${id}` : `index.html#${id}`;
  };
  const navLinks = NAV.map(([id, label]) => {
    const active = (onHome && id === 'home') || (!onHome && id === 'projects');
    return `<a href="${href(id)}" data-section="${id}"${active ? ' class="active"' : ''}>${label}</a>`;
  }).join('');

  const header = document.createElement('header');
  header.className = `topbar${onHome ? '' : ' solid'}`;
  header.id = 'topbar';
  header.innerHTML = `
    <div class="shell nav-shell">
      <a class="brand" href="${onHome ? '#home' : 'index.html'}" aria-label="${esc(site.brand)} — home">${brandHTML(site.brand)}</a>
      <nav class="nav" id="nav" aria-label="Primary">${navLinks}</nav>
      <div class="nav-right">
        <button class="icon-btn theme-toggle" type="button" aria-label="Toggle dark mode">${icon('moon', 'moon')}${icon('sun', 'sun')}</button>
        <a class="connect" href="${esc(site.connectUrl)}" target="_blank" rel="noopener">${icon('send')}<span>Let’s Connect</span></a>
        <button class="icon-btn menu-btn" type="button" aria-label="Open menu" aria-controls="nav" aria-expanded="false">${icon('menu')}</button>
      </div>
    </div>`;
  document.body.prepend(header);

  const nav = $('#nav', header);
  const menuBtn = $('.menu-btn', header);
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.innerHTML = icon(open ? 'x' : 'menu');
  };
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.addEventListener('click', (e) => e.target.closest('a') && setMenu(false));

  if (onHome) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  const footer = document.createElement('footer');
  footer.innerHTML = `
    <div class="shell footer-shell">
      <span>© ${new Date().getFullYear()} ${esc(profile.name)}. Built with <span class="heart">♥</span> and lots of ☕.</span>
      <span class="loc">${icon('map-pin')}${profile.locations.map(esc).join('&nbsp;&nbsp;·&nbsp;&nbsp;')}</span>
    </div>`;
  document.body.append(footer);
}

/* Highlight the nav link of the section currently in view (home page). */
export function trackActiveSection() {
  const links = $$('#nav a[data-section]');
  const targets = links.map((a) => document.getElementById(a.dataset.section)).filter(Boolean);
  const update = () => {
    const atBottom = window.scrollY > 0 && window.innerHeight + window.scrollY >= document.body.scrollHeight - 4;
    let current = targets[0];
    for (const t of targets) if (t.getBoundingClientRect().top <= 120) current = t;
    if (atBottom) current = targets[targets.length - 1];
    links.forEach((a) => a.classList.toggle('active', a.dataset.section === current?.id));
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/* ---------- hero (also pre-rendered into index.html by tools/seo.mjs) ---------- */
export function heroHTML(p) {
  return `
      <img class="avatar" src="${esc(p.avatar)}" alt="${esc(p.name)}" width="168" height="168" fetchpriority="high">
      <h1>${esc(p.name)}</h1>
      <p class="hero-headline">${esc(p.headline)}</p>
      <p class="hero-roles">${p.roles.map(esc).join('<b>·</b>')}</p>
      <p class="hero-tagline">${esc(p.tagline)}</p>
      <div class="socials">${p.socials.map((s) => `
        <a class="social" href="${esc(s.url)}"${s.url.startsWith('mailto:') ? '' : ' target="_blank" rel="noopener"'}>${icon(s.icon)}${esc(s.label)}</a>`).join('')}
      </div>
    `;
}

/* ---------- project cover & card ---------- */
export function coverHTML(p, { eager = false } = {}) {
  const c = p.cover || {};
  if (c.image) {
    return `<div class="cover"><img src="${esc(c.image)}" alt="${esc(p.title)}" ${eager ? '' : 'loading="lazy"'}></div>`;
  }
  if (c.logo) {
    return `<div class="cover cover-logo" style="background:${esc(c.bg || '#fff')}">
        <img src="${esc(c.logo)}" alt="${esc(p.title)} logo" ${eager ? '' : 'loading="lazy"'}>
      </div>`;
  }
  const text = esc(c.text || p.title);
  const accent = c.accent ? ` <em>${esc(c.accent)}</em>` : '';
  const long = (c.text || p.title).length > 14 ? ' class="long"' : '';
  return `<div class="cover" role="img" aria-label="${esc(p.title)}">
      <div class="cover-art cover-${esc(c.style || 'navy')}">
        ${c.icon ? icon(c.icon) : ''}<strong${long}>${text}${accent}</strong>
      </div>
    </div>`;
}

export function projectCard(p, live) {
  const r = p.repo && live?.byName.get(p.repo.toLowerCase());
  const meta = r
    ? `<span title="Stars">${icon('star')} ${r.stargazers_count}</span><span title="Forks">${icon('fork')} ${r.forks_count}</span>`
    : p.year ? `<span>${icon('calendar')} ${esc(p.year)}</span>` : '';
  const l = p.links || {};
  const ext = [
    l.live && `<a class="ext" href="${esc(l.live)}" target="_blank" rel="noopener" title="${esc(l.liveLabel || 'Visit website')}" aria-label="${esc(l.liveLabel || 'Visit website')}">${icon('external')}</a>`,
    l.github && `<a class="ext" href="${esc(l.github)}" target="_blank" rel="noopener" title="Source code" aria-label="Source code on GitHub">${icon('github')}</a>`,
  ].filter(Boolean).join('');
  // The title link stretches over the whole card; external links sit above it.
  return `
    <article class="card project-card">
      ${coverHTML(p)}
      <div class="project-body">
        <h3><a class="stretched" href="project.html?slug=${encodeURIComponent(p.slug)}">${esc(p.title)}</a></h3>
        <p>${esc(p.description)}</p>
        <div class="tags">${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <div class="project-foot">
          <span class="meta">${meta}</span>
          <span class="actions">${ext}<span class="more">Details ${icon('arrow-right')}</span></span>
        </div>
      </div>
    </article>`;
}

/* ---------- misc ---------- */
export function reveal(root = document) {
  const items = $$('.reveal:not(.in)', root);
  if (!('IntersectionObserver' in window)) return items.forEach((el) => el.classList.add('in'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -40px 0px' });
  items.forEach((el) => io.observe(el));
}

export function showFatal(err) {
  console.error(err);
  const local = location.protocol === 'file:';
  document.body.insertAdjacentHTML('beforeend', `
    <div class="shell" style="padding:120px 0">
      <div class="error-box">
        <strong>Couldn’t load the site data.</strong><br>
        ${local
          ? 'Browsers block reading JSON files from <code>file://</code>. Run a local server instead — e.g. <code>npx serve</code> or <code>python -m http.server</code> — and open <code>http://localhost</code>.'
          : esc(err.message)}
      </div>
    </div>`);
}
