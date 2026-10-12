import { $, esc, loadAll, mountChrome, projectCard, showFatal } from './ui.js';
import { fetchGitHub } from './github.js';

const MAX_CHIPS = 10;

try {
  const { site, profile, projects } = await loadAll(['site', 'profile', 'projects']);
  mountChrome({ page: 'projects', site, profile });

  const params = new URLSearchParams(location.search);
  const state = { tag: params.get('tag') || 'All', q: params.get('q') || '' };
  let live = null;

  // most-used tags first
  const freq = {};
  projects.forEach((p) => (p.tags || []).forEach((t) => (freq[t] = (freq[t] || 0) + 1)));
  const tags = ['All', ...Object.keys(freq).sort((a, b) => freq[b] - freq[a] || a.localeCompare(b)).slice(0, MAX_CHIPS)];
  if (!tags.includes(state.tag)) tags.push(state.tag);

  const search = $('#search');
  search.value = state.q;

  function syncURL() {
    const p = new URLSearchParams();
    if (state.tag !== 'All') p.set('tag', state.tag);
    if (state.q) p.set('q', state.q);
    history.replaceState(null, '', p.toString() ? `?${p}` : location.pathname);
  }

  function render() {
    $('#chips').innerHTML = tags.map((t) =>
      `<button class="chip${t === state.tag ? ' on' : ''}" type="button" data-tag="${esc(t)}" aria-pressed="${t === state.tag}">${esc(t)}</button>`
    ).join('');

    const q = state.q.trim().toLowerCase();
    const list = projects.filter((p) =>
      (state.tag === 'All' || (p.tags || []).includes(state.tag)) &&
      (!q || [p.title, p.description, ...(p.tags || [])].join(' ').toLowerCase().includes(q))
    );
    $('#project-grid').innerHTML = list.map((p) => projectCard(p, live)).join('');
    $('#empty').hidden = list.length > 0;
  }

  $('#chips').addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    state.tag = btn.dataset.tag;
    syncURL();
    render();
  });
  search.addEventListener('input', () => {
    state.q = search.value;
    syncURL();
    render();
  });

  render();
  live = await fetchGitHub(site.github);
  if (live) render();
} catch (err) {
  showFatal(err);
}
