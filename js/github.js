// Live GitHub data from the public REST API (no token).
//
// Every page load asks GitHub for fresh data. The browser's HTTP cache
// honours GitHub's own `Cache-Control: max-age=60`, so data is never more
// than a minute old and visitors stay well inside the 60 requests/hour
// unauthenticated limit.
//
// The last successful response is kept in localStorage and used only if
// GitHub can't be reached (offline / rate-limited) — and it is labelled as
// cached in the UI. Nothing here is ever made up.

const API = 'https://api.github.com';
const storeKey = (u) => `github:${u}`;

async function getJSON(url) {
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) {
    const limited = res.status === 403 && res.headers.get('X-RateLimit-Remaining') === '0';
    throw new Error(limited ? 'GitHub API rate limit reached' : `GitHub API ${res.status}`);
  }
  return res.json();
}

async function getAllRepos(username) {
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await getJSON(`${API}/users/${username}/repos?per_page=100&page=${page}&type=owner&sort=pushed`);
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

function save(username, data) {
  try { localStorage.setItem(storeKey(username), JSON.stringify({ at: Date.now(), data })); } catch (e) { /* storage unavailable */ }
}

function load(username) {
  try { return JSON.parse(localStorage.getItem(storeKey(username))); } catch (e) { return null; }
}

const inflight = new Map();

/**
 * Resolves to a summary of the user's GitHub data, or null when GitHub
 * can't be reached and nothing was fetched before in this browser.
 * summary.source is 'live' or 'cache'; summary.fetchedAt is a timestamp.
 */
export function fetchGitHub(config) {
  const username = config?.username;
  if (!username) return Promise.resolve(null);
  if (!inflight.has(username)) inflight.set(username, fetchFresh(username));
  return inflight.get(username);
}

async function fetchFresh(username) {
  try {
    const [user, repos] = await Promise.all([
      getJSON(`${API}/users/${username}`),
      getAllRepos(username),
    ]);
    // keep only the fields we use
    const data = {
      user: {
        login: user.login, html_url: user.html_url, public_repos: user.public_repos,
        followers: user.followers, following: user.following, created_at: user.created_at,
      },
      repos: repos.map((r) => ({
        name: r.name, fork: r.fork, archived: r.archived, language: r.language, description: r.description,
        stargazers_count: r.stargazers_count, forks_count: r.forks_count,
        pushed_at: r.pushed_at, created_at: r.created_at, html_url: r.html_url,
      })),
    };
    save(username, data);
    return summarize(data, { source: 'live', fetchedAt: Date.now() });
  } catch (err) {
    const cached = load(username);
    console.warn(`Live GitHub data unavailable (${err.message}).${cached ? ' Using last saved copy.' : ''}`);
    return cached ? summarize(cached.data, { source: 'cache', fetchedAt: cached.at, error: err.message }) : null;
  }
}

function cumulativeByYear(items, valueOf) {
  const years = {};
  items.forEach((r) => {
    const y = r.created_at?.slice(0, 4);
    if (y) years[y] = (years[y] || 0) + valueOf(r);
  });
  let acc = 0;
  return Object.keys(years).sort().map((y) => (acc += years[y]));
}

function summarize({ user, repos }, meta) {
  const own = repos.filter((r) => !r.fork);

  // primary language share, by number of (non-fork) repositories
  const counts = {};
  own.forEach((r) => { if (r.language) counts[r.language] = (counts[r.language] || 0) + 1; });
  const languageCounts = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return {
    ...meta,
    profileUrl: user.html_url,
    repositories: user.public_repos,
    followers: user.followers,
    following: user.following,
    joined: user.created_at?.slice(0, 4),
    stars: own.reduce((sum, r) => sum + r.stargazers_count, 0),
    languageCounts,
    repoTrend: cumulativeByYear(own, () => 1),
    starTrend: cumulativeByYear(own, (r) => r.stargazers_count),
    recent: own.filter((r) => !r.archived), // already sorted by last push
    byName: new Map(repos.map((r) => [r.name.toLowerCase(), r])),
  };
}

/**
 * Public organization memberships, with each org's profile details.
 * Same live-first / last-saved-copy fallback as fetchGitHub.
 * Resolves to { orgs, source, fetchedAt } or null.
 */
export function fetchOrgs(config, { limit = 8, include = [] } = {}) {
  const username = config?.username;
  if (!username) return Promise.resolve(null);
  const key = `orgs:${username}`;
  if (!inflight.has(key)) inflight.set(key, fetchOrgsFresh(username, limit, include));
  return inflight.get(key);
}

// `include` lists orgs to show even when the membership is private
// (GitHub only reports public memberships).
async function fetchOrgsFresh(username, limit, include) {
  const store = `github-orgs:${username}`;
  try {
    const members = await getJSON(`${API}/users/${username}/orgs`);
    const seen = new Set();
    const logins = [...include, ...members.map((o) => o.login)]
      .filter((l) => !seen.has(l.toLowerCase()) && seen.add(l.toLowerCase()))
      .slice(0, limit);
    const orgs = (await Promise.all(logins.map(async (login) => {
      const d = await getJSON(`${API}/orgs/${login}`).catch(() => members.find((m) => m.login === login));
      if (!d) return null; // typo or deleted org
      return {
        login: d.login,
        name: d.name || d.login,
        description: d.description || '',
        avatar_url: d.avatar_url,
        html_url: d.html_url || `https://github.com/${d.login}`,
        blog: d.blog || '',
        public_repos: d.public_repos,
        created_at: d.created_at,
        // not in the public membership list → membership is private
        private: !members.some((m) => m.login.toLowerCase() === login.toLowerCase()),
      };
    }))).filter(Boolean);
    try { localStorage.setItem(store, JSON.stringify({ at: Date.now(), orgs })); } catch (e) { /* storage unavailable */ }
    return { orgs, source: 'live', fetchedAt: Date.now() };
  } catch (err) {
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(store)); } catch (e) { /* ignore */ }
    console.warn(`Live GitHub organizations unavailable (${err.message}).`);
    return cached ? { orgs: cached.orgs, source: 'cache', fetchedAt: cached.at } : null;
  }
}

/** Top-N languages as percentages, remainder grouped into "Other". */
export function topLanguages(languageCounts, n = 4) {
  const total = languageCounts.reduce((a, l) => a + l.count, 0);
  if (!total) return [];
  const top = languageCounts.slice(0, n).map((l) => ({ name: l.name, percent: Math.round((l.count / total) * 100) }));
  const rest = 100 - top.reduce((a, l) => a + l.percent, 0);
  return languageCounts.length > n && rest > 0 ? [...top, { name: 'Other', percent: rest }] : top;
}
