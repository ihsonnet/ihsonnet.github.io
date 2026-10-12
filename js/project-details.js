import { $, esc, icon, loadAll, mountChrome, coverHTML, langColor, timeAgo, showFatal } from './ui.js';
import { fetchGitHub } from './github.js';

const STATUS_COLORS = { Active: 'var(--green)', Production: 'var(--blue)', Research: 'var(--purple)', Archived: '#8a94a6', 'NASA Global Winner': 'var(--gold)' };

try {
  const { site, profile, projects } = await loadAll(['site', 'profile', 'projects']);
  mountChrome({ page: 'project', site, profile });

  const slug = new URLSearchParams(location.search).get('slug');
  const index = projects.findIndex((p) => p.slug === slug);

  if (index === -1) {
    setMeta('name', 'robots', 'noindex');
    renderNotFound();
  } else {
    const project = projects[index];
    applySEO(project, site, profile);
    renderHero(project);
    renderBody(project, projects, index, site.github, null);

    if (project.repo) {
      const live = await fetchGitHub(site.github);
      if (live) renderBody(project, projects, index, site.github, live);
    }
  }
} catch (err) {
  showFatal(err);
}

/* ---------- per-project SEO: title, meta, canonical, Open Graph, JSON-LD ---------- */
function setMeta(attr, key, value) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.append(el); }
  el.setAttribute('content', value);
}

function applySEO(p, site, profile) {
  const base = site.url.replace(/\/$/, '');
  const url = `${base}/project.html?slug=${encodeURIComponent(p.slug)}`;
  const img = p.cover?.image || p.cover?.logo;
  const image = img ? `${base}/${img}` : `${base}/assets/img/og.jpg`;
  const title = `${p.title} — ${profile.name}`;
  const description = p.description;

  document.title = title;
  setMeta('name', 'description', description);
  document.head.querySelector('link[rel="canonical"]')?.setAttribute('href', url);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:image', image);
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', image);

  const links = p.links || {};
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CreativeWork',
        '@id': `${url}#work`,
        name: p.title,
        description,
        url,
        image,
        keywords: (p.tags || []).join(', '),
        dateCreated: /\d{4}/.exec(p.year || '')?.[0],
        creator: { '@type': 'Person', '@id': `${base}/#person`, name: profile.name },
        sameAs: [links.live, links.github, links.article].filter(Boolean),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
          { '@type': 'ListItem', position: 2, name: 'Projects', item: `${base}/projects.html` },
          { '@type': 'ListItem', position: 3, name: p.title, item: url },
        ],
      },
    ],
  };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(ld);
  document.head.append(script);
}

function renderHero(p) {
  const links = p.links || {};
  $('#detail-hero').innerHTML = `
    <div class="detail-hero">
      <div>
        <nav class="crumbs" aria-label="Breadcrumb">
          <a href="index.html">Home</a><span>/</span><a href="projects.html">Projects</a><span>/</span><span>${esc(p.title)}</span>
        </nav>
        <h1>${esc(p.title)}</h1>
        <p class="lead">${esc(p.description)}</p>
        <div class="detail-meta">
          ${p.year ? `<span>${icon('calendar')} ${esc(p.year)}</span>` : ''}
          ${p.role ? `<span>${icon('user')} ${esc(p.role)}</span>` : ''}
          ${p.status ? `<span class="status" style="--c:${STATUS_COLORS[p.status] || 'var(--green)'}">${esc(p.status)}</span>` : ''}
        </div>
        <div class="tags">${(p.tags || []).map((t) => `<a class="tag" href="projects.html?tag=${encodeURIComponent(t)}">${esc(t)}</a>`).join('')}</div>
        <div class="btn-row">
          ${links.live ? `<a class="btn btn-primary" href="${esc(links.live)}" target="_blank" rel="noopener">${icon('external')} ${esc(links.liveLabel || 'Visit website')}</a>` : ''}
          ${links.github ? `<a class="btn btn-ghost" href="${esc(links.github)}" target="_blank" rel="noopener">${icon('github')} Source code</a>` : ''}
          ${links.article ? `<a class="btn btn-ghost" href="${esc(links.article)}" target="_blank" rel="noopener">${icon('file')} Press coverage</a>` : ''}
          <a class="btn btn-ghost" href="projects.html">${icon('arrow-left')} All projects</a>
        </div>
      </div>
      ${coverHTML(p, { eager: true })}
    </div>`;
}

function renderBody(p, all, i, gh, live) {
  const r = p.repo && live?.byName.get(p.repo.toLowerCase());
  const prev = all[(i - 1 + all.length) % all.length];
  const next = all[(i + 1) % all.length];

  $('#detail-body').innerHTML = `
    <div class="detail-grid">
      <div>
        ${p.overview?.length ? `
          <section class="card detail-section">
            <h2>Overview</h2>
            ${p.overview.map((t) => `<p>${esc(t)}</p>`).join('')}
          </section>` : ''}
        ${p.features?.length ? `
          <section class="card detail-section">
            <h2>Key features</h2>
            <ul class="features">${p.features.map((f) => `<li>${icon('check')}<span>${esc(f)}</span></li>`).join('')}</ul>
          </section>` : ''}
        ${p.gallery?.length ? `
          <section class="card detail-section">
            <h2>Gallery</h2>
            <div class="gallery">${p.gallery.map((src) => `<a href="${esc(src)}" target="_blank" rel="noopener"><img src="${esc(src)}" alt="${esc(p.title)} screenshot" loading="lazy"></a>`).join('')}</div>
          </section>` : ''}
      </div>

      <aside class="aside">
        <div class="card facts">
          <h3>Project facts</h3>
          <dl>
            ${p.year ? `<dt>Timeline</dt><dd>${esc(p.year)}</dd>` : ''}
            ${p.role ? `<dt>Role</dt><dd>${esc(p.role)}</dd>` : ''}
            ${p.status ? `<dt>Status</dt><dd>${esc(p.status)}</dd>` : ''}
            ${p.tags?.length ? `<dt>Stack</dt><dd>${p.tags.map(esc).join(', ')}</dd>` : ''}
          </dl>
        </div>
        ${p.repo ? `
          <a class="card facts" href="https://github.com/${esc(gh.username)}/${esc(p.repo)}" target="_blank" rel="noopener">
            <h3 style="display:flex;align-items:center;gap:8px">${icon('github')} ${esc(p.repo)}</h3>
            ${r ? `
              <dl>
                ${r.language ? `<dt>Language</dt><dd><span class="lang" style="margin:0"><i class="dot" style="--c:${langColor(r.language)}"></i>${esc(r.language)}</span></dd>` : ''}
                <dt>Stars</dt><dd>${r.stargazers_count}</dd>
                <dt>Forks</dt><dd>${r.forks_count}</dd>
                <dt>Updated</dt><dd>${timeAgo(r.pushed_at)}</dd>
              </dl>` : `<p style="margin:0;color:var(--muted);font-size:14px">View the repository on GitHub →</p>`}
          </a>` : ''}
      </aside>
    </div>

    ${all.length > 1 ? `
      <nav class="pager" aria-label="More projects">
        <a class="card" href="project.html?slug=${encodeURIComponent(prev.slug)}">
          <small>${icon('arrow-left')} Previous</small><strong>${esc(prev.title)}</strong>
        </a>
        <a class="card next" href="project.html?slug=${encodeURIComponent(next.slug)}">
          <small>Next ${icon('arrow-right')}</small><strong>${esc(next.title)}</strong>
        </a>
      </nav>` : ''}`;
}

function renderNotFound() {
  document.title = 'Project not found';
  $('#detail-hero').innerHTML = `
    <nav class="crumbs"><a href="index.html">Home</a><span>/</span><a href="projects.html">Projects</a></nav>
    <h1>Project not found</h1>
    <p class="lead">This project doesn’t exist or may have been renamed.</p>`;
  $('#detail-body').innerHTML = `<a class="btn btn-primary" href="projects.html">${icon('arrow-left')} Browse all projects</a>`;
}
