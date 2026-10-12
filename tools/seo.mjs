// Generates the SEO parts of the site from data/*.json:
//   • pre-rendered hero + project cards in index.html / projects.html
//     (so crawlers that don't run JavaScript still see real content and links)
//   • JSON-LD structured data (Person, WebSite, ProfilePage, projects list)
//   • sitemap.xml
//
// Run:  node tools/seo.mjs
// The .githooks/pre-commit hook runs it automatically on every commit.

import { readFile, writeFile } from 'node:fs/promises';
import { heroHTML, projectCard } from '../js/ui.js';

const root = new URL('../', import.meta.url);
const read = async (p) => JSON.parse(await readFile(new URL(p, root), 'utf8'));

const [site, profile, projects] = await Promise.all(
  ['data/site.json', 'data/profile.json', 'data/projects.json'].map(read)
);
const base = site.url.replace(/\/$/, '');
const seo = profile.seo || {};
const abs = (path) => (/^https?:/.test(path) ? path : `${base}/${path.replace(/^\//, '')}`);
const projectUrl = (p) => `${base}/project.html?slug=${encodeURIComponent(p.slug)}`;

/* ---------- structured data ---------- */
function address(loc = '') {
  const [locality, region, country] = loc.split(',').map((s) => s.trim());
  if (!country) return undefined;
  return { '@type': 'PostalAddress', addressLocality: locality, addressRegion: region, addressCountry: country === 'USA' ? 'US' : country };
}

const email = profile.socials.find((s) => s.url.startsWith('mailto:'))?.url;
const sameAs = [...new Set([
  ...profile.socials.map((s) => s.url).filter((u) => !u.startsWith('mailto:')),
  ...(seo.sameAs || []),
])].filter((u) => !u.startsWith(base));

const personId = `${base}/#person`;
const person = {
  '@type': 'Person',
  '@id': personId,
  name: profile.name,
  alternateName: site.github?.username,
  url: `${base}/`,
  image: abs(profile.avatar),
  jobTitle: seo.jobTitle,
  description: profile.tagline,
  email,
  address: address(profile.locations?.[0]),
  knowsAbout: seo.knowsAbout,
  award: seo.awards,
  affiliation: seo.affiliation && { '@type': 'CollegeOrUniversity', ...seo.affiliation },
  alumniOf: seo.alumniOf && { '@type': 'CollegeOrUniversity', ...seo.alumniOf },
  worksFor: (seo.worksFor || []).map(({ founder, ...o }) => ({ '@type': 'Organization', ...o })),
  sameAs,
};
const founded = (seo.worksFor || []).filter((o) => o.founder).map(({ founder, ...o }) => ({
  '@type': 'Organization', ...o, founder: { '@id': personId },
}));
const website = {
  '@type': 'WebSite',
  '@id': `${base}/#website`,
  url: `${base}/`,
  name: site.brand,
  description: site.description,
  inLanguage: 'en',
  publisher: { '@id': personId },
};

const homeLd = {
  '@context': 'https://schema.org',
  '@graph': [
    website,
    {
      '@type': 'ProfilePage',
      '@id': `${base}/#profilepage`,
      url: `${base}/`,
      name: site.title,
      isPartOf: { '@id': `${base}/#website` },
      mainEntity: { '@id': personId },
    },
    person,
    ...founded,
  ],
};

const projectsLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': `${base}/projects.html#page`,
      url: `${base}/projects.html`,
      name: `Projects — ${profile.name}`,
      isPartOf: { '@id': `${base}/#website` },
      about: { '@id': personId },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: projects.map((p, i) => ({
          '@type': 'ListItem', position: i + 1, url: projectUrl(p), name: p.title,
        })),
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
        { '@type': 'ListItem', position: 2, name: 'Projects', item: `${base}/projects.html` },
      ],
    },
  ],
};

/* ---------- injection between <!-- seo:name --> … <!-- /seo:name --> ---------- */
const clean = (v) => JSON.parse(JSON.stringify(v)); // drops undefined fields
const ldTag = (obj) =>
  `\n  <script type="application/ld+json">\n${JSON.stringify(clean(obj), null, 2).replace(/</g, '\\u003c')}\n  </script>\n  `;

function inject(html, name, content) {
  const re = new RegExp(`(<!-- seo:${name}\\b[^>]*-->)[\\s\\S]*?(<!-- /seo:${name} -->)`);
  if (!re.test(html)) throw new Error(`Marker <!-- seo:${name} --> not found`);
  return html.replace(re, (_, open, close) => `${open}${content}${close}`);
}

async function update(file, edits) {
  const url = new URL(file, root);
  const before = await readFile(url, 'utf8');
  const after = edits.reduce((html, [name, content]) => inject(html, name, content), before);
  if (after !== before) await writeFile(url, after);
  console.log(`${after !== before ? 'updated ' : 'unchanged'}  ${file}`);
}

const featured = projects.filter((p) => p.featured).slice(0, 4);

await update('index.html', [
  ['jsonld', ldTag(homeLd)],
  ['hero', heroHTML(profile)],
  ['featured', featured.map((p) => projectCard(p, null)).join('')],
]);
await update('projects.html', [
  ['jsonld', ldTag(projectsLd)],
  ['projects', projects.map((p) => projectCard(p, null)).join('')],
]);

/* ---------- sitemap ---------- */
const today = new Date().toISOString().slice(0, 10);
const urls = [
  { loc: `${base}/`, priority: '1.0' },
  { loc: `${base}/projects.html`, priority: '0.8' },
  ...projects.map((p) => ({ loc: projectUrl(p), priority: p.featured ? '0.7' : '0.5' })),
];
const xmlEsc = (s) => s.replace(/&/g, '&amp;');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${xmlEsc(u.loc)}</loc><lastmod>${today}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
// only touch the file when the URL set changes, so lastmod doesn't churn every commit
const sitemapUrl = new URL('sitemap.xml', root);
const old = await readFile(sitemapUrl, 'utf8').catch(() => '');
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).join('\n');
if (locs(old) !== locs(sitemap)) {
  await writeFile(sitemapUrl, sitemap);
  console.log('updated    sitemap.xml');
} else {
  console.log('unchanged  sitemap.xml');
}
