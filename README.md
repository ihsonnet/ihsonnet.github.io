# ihsonnet.github.io

Personal portfolio of **Injamamul Haque Sonet**, served at [ihsonnet.com](https://ihsonnet.com).
It's plain HTML, CSS and JavaScript with no build step. All content lives in JSON files under `data/`.

## Structure

```
/
├── index.html                 → Portfolio homepage
├── projects.html              → All projects (filter by tag, search)
├── project.html?slug=...      → Project details
├── 404.html
│
├── data/                      → ✏️  edit these to update the site
│   ├── site.json              → brand, page title, "Let's Connect" link, GitHub settings
│   ├── profile.json           → name, photo, headline, about, résumé, social links
│   ├── projects.json          → projects (featured ones show on the homepage)
│   ├── repositories.json      → which repos to show (data is fetched live)
│   ├── organizations.json     → optional role/description per GitHub org (orgs are fetched live)
│   ├── stats.json             → labels & captions for the live stats
│   ├── skills.json            → skill groups
│   └── achievements.json      → "Beyond Code / Achievements"
│
├── js/
│   ├── ui.js                  → shared helpers: icons, header/footer, cards
│   ├── home.js                → homepage
│   ├── projects.js            → projects listing
│   ├── project-details.js     → project details
│   ├── github.js              → live GitHub stats (cached 1h)
│   └── theme.js               → light / dark mode
│
├── css/styles.css
└── assets/
    ├── img/                   → profile photo, Open Graph image
    └── projects/              → project covers & screenshots
```

## Editing content

| To…                         | Edit                                                                 |
| --------------------------- | -------------------------------------------------------------------- |
| Add a project               | Add an object to `data/projects.json` with a unique `slug`           |
| Show it on the homepage     | Set `"featured": true` (the first 4 featured projects are shown)     |
| Use a screenshot as a cover | `"cover": { "image": "assets/projects/my-shot.png" }`                |
| Use a generated cover       | `"cover": { "style": "navy", "icon": "lock", "text": "Title", "accent": "AI" }` |
| Show live GitHub stars      | Add `"repo": "<repository-name>"` to the project                     |
| Choose which repos to show  | List them under `"pinned"` in `repositories.json` as `{ "name", "icon" }` |
| Add an organization         | Add its login to `include` in `organizations.json`. Works for private memberships, which get a "Private" badge |
| Label an organization       | Set `role`, `description`, `url` for its login under `details` |
| Edit the About section       | `aboutTitle`, `about`, `availability`, `locations`, `socials` in `profile.json` |
| Change the header brand     | `"brand"` in `site.json`. Text after the `/` gets the gradient       |

**Cover styles:** `navy`, `emerald`, `crimson`, `indigo`, `space`.
**Icons:** `code`, `box`, `bot`, `shield`, `shield-check`, `lock`, `server`, `cloud`, `rocket`, `award`, `sparkles`, `repo`, `users`, `star`, `mail`, `github`, `linkedin`, `twitter`, `link`, `file`, and more. The full list is in `js/ui.js`.
**Achievement colours:** `blue`, `gold`, `purple`. You can also give an achievement an `"image"` instead of an `"icon"`.

### Live GitHub data

All GitHub numbers and repository details come from the public GitHub API on every page load, for the user named in `site.json` → `github.username`. None of them are stored in the JSON files:

- **Repositories section:** each repo's name, description, language, stars, forks and last update. `repositories.json` only chooses *which* repos appear (`pinned`) and how many (`limit`). If a pinned repo doesn't exist, or there are fewer pins than `limit`, the list is topped up with your most recently updated repos. To change a description, edit it on GitHub (the ⚙ next to "About" on the repo page).
- **Statistics:** public repo count, followers and following, join year, total stars on your non-fork repos, and the language mix (each repo's primary language). The sparklines are real too: they show cumulative repos created and cumulative stars by year. `stats.json` only holds labels and captions. A caption can include `{following}` or `{joined}`.
- **Projects:** any project with a `"repo"` field shows that repo's live stars and forks.

The browser follows GitHub's own 60-second cache, so data is never more than a minute old. The API allows 60 unauthenticated requests per hour per visitor, which normal browsing doesn't come close to. If GitHub can't be reached, the page shows the last successful fetch from that browser, with a "showing data from …" badge. If that browser has never fetched before, it shows a "couldn't load" message. It never shows made-up numbers.

## Running locally

Browsers block `fetch()` of local JSON from `file://`, so serve the folder instead:

```bash
npx serve .            # or
python -m http.server
```

Then open http://localhost:3000 (serve) or http://localhost:8000 (python).

## Deploying

Push to `master`/`main` and GitHub Pages serves the site as-is.

## SEO

- **Canonical address:** `https://ihsonnet.github.io`, set as `"url"` in `data/site.json`. All canonical, Open Graph and sitemap URLs use it.
- **`tools/seo.mjs`** generates these from `data/*.json`:
  - the hero and project cards, pre-rendered into `index.html` and `projects.html`, so crawlers and link previews see real content without running JavaScript;
  - JSON-LD structured data: Person, WebSite, ProfilePage, FairMark AI as an Organization, and the projects list. Edit `seo` in `profile.json` to change job title, topics, affiliations, awards and other profiles;
  - `sitemap.xml`, with every project page.
- **Pre-commit hook:** `.githooks/pre-commit` runs the generator on every commit. Enable it once per clone with `git config core.hooksPath .githooks`, or run `node tools/seo.mjs` yourself after editing JSON.
- **Project pages:** each sets its own title, description, canonical URL, share image and JSON-LD.
- **Share image:** `assets/img/og.jpg`, 1200×630.
