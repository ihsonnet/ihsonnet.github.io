import {
  $, esc, icon, loadAll, mountChrome, trackActiveSection, projectCard, heroHTML,
  langColor, compact, timeAgo, reveal, showFatal,
} from './ui.js';
import { fetchGitHub, fetchOrgs, topLanguages } from './github.js';

try {
  const data = await loadAll(['site', 'profile', 'projects', 'repositories', 'organizations', 'stats', 'skills', 'achievements']);
  const gh = data.site.github;
  mountChrome({ page: 'home', site: data.site, profile: data.profile });

  renderHero(data.profile);
  renderAbout(data.profile);
  renderSkills(data.skills);
  renderAchievements(data.achievements);
  renderProjects(data.projects, null);

  // GitHub-backed sections show placeholders until live data arrives.
  $('#repo-all').href = `https://github.com/${gh.username}?tab=repositories`;
  renderRepos(data.repositories, gh, undefined);
  renderStats(data.stats, gh, undefined);
  renderOrgs(data.organizations, gh, undefined);

  trackActiveSection();
  reveal();

  fetchOrgs(gh, data.organizations).then((orgs) => renderOrgs(data.organizations, gh, orgs));
  const live = await fetchGitHub(gh);
  renderStatus(live);
  renderRepos(data.repositories, gh, live);
  renderStats(data.stats, gh, live);
  if (live) renderProjects(data.projects, live);
} catch (err) {
  showFatal(err);
}

/* ---------- shared bits for GitHub sections ---------- */
function skeletons(n, h) {
  return Array.from({ length: n }, () => `<div class="skeleton" style="min-height:${h}px"></div>`).join('');
}

function unavailable(username) {
  return `
  <div class="error-box" style="grid-column:1/-1">
    GitHub data couldn’t be loaded right now (network issue or API rate limit).
    <a class="view-all" href="https://github.com/${esc(username)}" target="_blank" rel="noopener">See it on GitHub ${icon('arrow-right')}</a>
  </div>`;
}

function renderStatus(live) {
  const el = $('#gh-status');
  if (!live) { el.hidden = true; return; }
  el.hidden = false;
  el.classList.toggle('stale', live.source !== 'live');
  el.innerHTML = live.source === 'live'
    ? `<i></i>Live from GitHub`
    : `<i></i>GitHub unavailable · showing data from ${timeAgo(live.fetchedAt)}`;
  el.title = `Fetched ${new Date(live.fetchedAt).toLocaleString()}`;
}

/* ---------- hero ---------- */
function renderHero(p) {
  // tools/seo.mjs pre-renders the same markup into index.html for crawlers
  $('#hero-content').innerHTML = heroHTML(p);
}

/* ---------- projects ---------- */
function renderProjects(projects, live) {
  const featured = projects.filter((p) => p.featured).slice(0, 4);
  $('#project-grid').innerHTML = featured.map((p) => projectCard(p, live)).join('');
}

/* ---------- repositories (100% live) ---------- */
function pickRepos(cfg, live) {
  const limit = cfg.limit || 6;
  const pinned = (cfg.pinned || [])
    .map((c) => ({ icon: c.icon, r: live.byName.get(c.name.toLowerCase()) }))
    .filter((x) => x.r);
  // top up with the most recently updated repos if pins are missing or few
  const used = new Set(pinned.map((x) => x.r.name));
  const extra = live.recent.filter((r) => !used.has(r.name)).map((r) => ({ r }));
  return [...pinned, ...extra].slice(0, limit);
}

function renderRepos(cfg, gh, live) {
  const grid = $('#repo-grid');
  if (live === undefined) { grid.innerHTML = skeletons(cfg.limit || 6, 74); return; }
  if (!live) { grid.innerHTML = unavailable(gh.username); return; }

  grid.innerHTML = pickRepos(cfg, live).map(({ r, icon: ic }) => `
    <a class="card repo" href="${esc(r.html_url)}" target="_blank" rel="noopener">
      <span class="repo-icon">${icon(ic || 'code')}</span>
      <span class="repo-copy">
        <strong>${esc(r.name)}</strong>
        <small${r.description ? '' : ' class="none"'}>${esc(r.description || 'No description provided')}</small>
        ${r.language ? `<span class="lang"><i class="dot" style="--c:${langColor(r.language)}"></i>${esc(r.language)}</span>` : ''}
      </span>
      <span class="repo-meta">
        <span title="Stars">${icon('star')} ${r.stargazers_count}</span>
        <span title="Forks">${icon('fork')} ${r.forks_count}</span>
        <span title="${esc(new Date(r.pushed_at).toLocaleString())}">${icon('clock')} Updated ${timeAgo(r.pushed_at)}</span>
      </span>
    </a>`).join('');
}

/* ---------- organizations (live) ---------- */
function renderOrgs(cfg, gh, live) {
  const section = $('#organizations');
  const grid = $('#org-grid');
  $('#org-title').textContent = cfg.title || 'Organizations';
  $('#org-all').href = `https://github.com/${gh.username}`;
  if (live === undefined) { grid.innerHTML = skeletons(2, 92); return; }
  if (!live) { grid.innerHTML = unavailable(gh.username); return; }
  if (!live.orgs.length) { section.hidden = true; return; }

  const details = cfg.details || {};
  grid.innerHTML = live.orgs.map((o) => {
    const extra = details[o.login] || {};
    const desc = extra.description || o.description;
    const site = extra.url || (o.blog && !/^https?:\/\//.test(o.blog) ? `https://${o.blog}` : o.blog);
    const meta = [
      o.public_repos > 0 && `${icon('repo')} ${o.public_repos} public repo${o.public_repos === 1 ? '' : 's'}`,
      o.created_at && `${icon('calendar')} Created on GitHub ${o.created_at.slice(0, 4)}`,
    ].filter(Boolean);
    const badges = [
      extra.role && `<span class="org-role">${esc(extra.role)}</span>`,
      o.private && `<span class="org-private" title="Membership is private on GitHub">${icon('lock')} Private</span>`,
    ].filter(Boolean).join('');
    // Name link stretches over the card; the website link sits above it.
    return `
      <article class="card org">
        <img class="org-logo" src="${esc(o.avatar_url)}&s=128" alt="${esc(o.name)} logo" width="56" height="56" loading="lazy">
        <div class="org-copy">
          <strong><a class="stretched" href="${esc(o.html_url)}" target="_blank" rel="noopener">${esc(o.name)}</a></strong>
          ${badges ? `<span class="org-badges">${badges}</span>` : ''}
          ${desc ? `<span class="org-desc">${esc(desc)}</span>` : ''}
          <span class="org-meta">
            <span>${icon('github')} @${esc(o.login)}</span>
            ${meta.map((m) => `<span>${m}</span>`).join('')}
            ${site ? `<a class="org-site" href="${esc(site)}" target="_blank" rel="noopener">${icon('link')} ${esc(site.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a>` : ''}
          </span>
        </div>
        ${icon('arrow-up-right', 'org-go')}
      </article>`;
  }).join('');
}

/* ---------- statistics (100% live) ---------- */
function sparkline(values) {
  if (!values || values.length < 2) return '';
  const max = Math.max(...values), min = Math.min(...values);
  const span = max - min || 1;
  const xy = values.map((v, i) => [(i / (values.length - 1)) * 100, 38 - ((v - min) / span) * 34]);
  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
  return `<svg class="spark" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      <path class="area" d="${line}L100,40L0,40Z"/><path class="line" d="${line}"/>
    </svg>`;
}

function renderStats(cfg, gh, live) {
  const grid = $('#stats-grid');
  if (live === undefined) { grid.innerHTML = skeletons(4, 132); return; }
  if (!live) { grid.innerHTML = unavailable(gh.username); return; }

  const fill = (s) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => live[k] ?? '');
  const cards = [
    { key: 'repositories', icon: 'repo',  tone: 'blue',   value: live.repositories, trend: live.repoTrend, hint: 'Cumulative repositories created per year' },
    { key: 'followers',    icon: 'users', tone: 'purple', value: live.followers },
    { key: 'stars',        icon: 'star',  tone: 'gold',   value: live.stars,        trend: live.starTrend, hint: 'Cumulative stars by repository creation year' },
  ];
  const langCfg = cfg.languages || {};
  const languages = topLanguages(live.languageCounts, langCfg.top || 4);
  const maxPct = Math.max(...languages.map((l) => l.percent), 1);

  grid.innerHTML = cards.map((c) => {
    const s = cfg[c.key] || {};
    return `
      <article class="card stat tone-${c.tone}"${c.hint ? ` title="${c.hint}"` : ''}>
        <div class="stat-head">
          <span class="stat-icon">${icon(c.icon)}</span>
          <div><small>${esc(s.label || c.key)}</small><strong>${compact(c.value)}</strong></div>
        </div>
        <p${c.trend?.length > 1 ? '' : ' style="max-width:none"'}>${esc(fill(s.caption))}</p>
        ${sparkline(c.trend)}
      </article>`;
  }).join('') + `
    <article class="card stat languages" title="Primary language of each public, non-fork repository">
      <h3>${esc(langCfg.title || 'Most Used Languages')}</h3>
      ${languages.length ? languages.map((l) => `
        <div class="lang-row" style="--c:${langColor(l.name)}">
          <span><i class="dot"></i>${esc(l.name)}</span>
          <span class="bar"><i style="width:${(l.percent / maxPct) * 100}%"></i></span>
          <em>${l.percent}%</em>
        </div>`).join('') : '<p style="position:static;margin:0">No language data yet.</p>'}
    </article>`;
}

/* ---------- skills ---------- */
function renderSkills(skills) {
  $('#skills-grid').innerHTML = skills.map((s) => `
    <article class="card skill">
      <h3>${icon(s.icon || 'code')}${esc(s.group)}</h3>
      <div class="tags">${s.items.map((i) => `<span class="tag">${esc(i)}</span>`).join('')}</div>
    </article>`).join('');
}

/* ---------- achievements ---------- */
function renderAchievements(items) {
  $('#achievement-grid').innerHTML = items.map((a) => `
    <article class="card achievement tone-${esc(a.color || 'blue')}">
      <span class="ach-icon">${a.image ? `<img src="${esc(a.image)}" alt="" loading="lazy">` : icon(a.icon || 'award')}</span>
      <div>
        <h3>${esc(a.title)}</h3>
        <p>${esc(a.description)}</p>
        <span class="date">${esc(a.date)}${a.url ? ` · <a class="ach-link" href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.linkLabel || 'Read more')} ${icon('arrow-up-right')}</a>` : ''}</span>
      </div>
    </article>`).join('');
}

/* ---------- about & contact (one section) ---------- */
function handle(url) {
  return url.replace(/^mailto:/, '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

function renderAbout(p) {
  const email = p.socials.find((s) => s.url.startsWith('mailto:'));
  const links = p.socials.filter((s) => s !== email);

  $('#about-body').innerHTML = `
    <div class="about-main">
      ${p.aboutTitle ? `<p class="about-title">${esc(p.aboutTitle)}</p>` : ''}
      ${p.about.map((t) => `<p>${esc(t)}</p>`).join('')}
      <dl class="about-meta">
        <div><dt>Based in</dt><dd>${p.locations.map(esc).join(' · ')}</dd></div>
        <div><dt>Focus</dt><dd>${(p.focus || p.roles).map(esc).join(' · ')}</dd></div>
      </dl>
    </div>

    <div class="about-contact" id="contact">
      <p class="eyebrow">Get in touch</p>
      ${email ? `<a class="contact-email" href="${esc(email.url)}">${esc(handle(email.url))}${icon('arrow-up-right')}</a>` : ''}
      ${p.availability ? `<p class="availability"><i></i>${esc(p.availability)}</p>` : ''}
      <ul class="link-list">
        ${links.map((s) => `
          <li><a href="${esc(s.url)}" target="_blank" rel="noopener">
            ${icon(s.icon)}<span>${esc(s.label)}</span><small>${esc(handle(s.url))}</small>${icon('arrow-up-right', 'go')}
          </a></li>`).join('')}
        ${p.resume ? `
          <li><a href="${esc(p.resume)}" target="_blank" rel="noopener">
            ${icon('file')}<span>Résumé</span><small>PDF</small>${icon('download', 'go')}
          </a></li>` : ''}
      </ul>
    </div>`;
}
