import { mainAssets } from './data.mjs';

export const escapeHTML = (value) =>
  String(value).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );

export function safeURL(value) {
  const url = new URL(value);
  if (!['https:', 'mailto:'].includes(url.protocol)) {
    throw new Error(`Unsupported URL protocol: ${url.protocol}`);
  }
  return escapeHTML(value);
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(iso) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Ljubljana',
  }).format(new Date(iso));
}

const shortDate = (iso) =>
  new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', timeZone: 'Europe/Ljubljana' }).format(
    new Date(iso)
  );

const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
export const numberWord = (n) => WORDS[n] ?? String(n);

const listJoin = (items) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;

// The order the platforms are named in on the homepage, and how each platform string maps to it.
const PLATFORM_GROUPS = [
  ['macOS', (p) => p.startsWith('macOS')],
  ['Linux', (p) => p.startsWith('Linux')],
  ['Chrome', (p) => p.startsWith('Chrome')],
];

function platformSummary(apps) {
  const platforms = apps.flatMap((a) => a.platforms ?? []);
  const names = PLATFORM_GROUPS.filter(([, match]) => platforms.some(match)).map(([name]) => name);
  if (apps.some((a) => a.kind === 'web')) names.push('the web');
  return listJoin(names);
}

const shippedDate = (app) => (app.kind === 'web' ? app.showFrom : app.released);
const appMeta = (app) => `${app.kind === 'web' ? 'web' : app.version} · ${shortDate(shippedDate(app))}`;

function iconImg(app, cls, size) {
  return `<img class="${cls}" src="${escapeHTML(app.icon)}" alt="${escapeHTML(app.name)} icon" width="${size}" height="${size}" decoding="async">`;
}

const lights = (cls = 'lights') =>
  `<div class="${cls}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>`;

function layout(site, { title, description, canonical, body, pageClass }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHTML(title)}</title>
<meta name="description" content="${escapeHTML(description)}">
<meta name="theme-color" content="#050505">
<link rel="canonical" href="${escapeHTML(site.url + canonical)}">
<meta property="og:title" content="${escapeHTML(title)}">
<meta property="og:description" content="${escapeHTML(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${escapeHTML(site.url + canonical)}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/saira-condensed-800.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css">
<script src="/app.js" defer></script>
</head>
<body class="${pageClass}">
${body}
<footer class="footer">
<a href="${safeURL(site.github)}">GitHub</a>
<a href="${safeURL(site.repo)}">Source of this site</a>
</footer>
</body>
</html>
`;
}

export function renderHome(site, apps) {
  const items = apps
    .map(
      (app) => `<li><a class="app" href="/apps/${escapeHTML(app.id)}/">${iconImg(app, 'icon', 96)}<span class="name">${escapeHTML(app.name)}</span><span class="meta">${escapeHTML(appMeta(app))}</span></a></li>`
    )
    .join('\n');
  const body = `<header class="top"><a class="wordmark" href="/">NODAYSIDLE</a></header>
<main class="home">
${lights()}
<h1 class="headline">Lights out.<br>${escapeHTML(numberWord(apps.length))} apps shipped.</h1>
<p class="sub">Native apps for ${escapeHTML(platformSummary(apps))}. Built by one studio, released on a schedule, one after another.</p>
<ul class="apps">
${items}
</ul>
</main>`;
  return layout(site, { title: site.title, description: site.description, canonical: '/', body, pageClass: 'page-home' });
}

function specRow(app) {
  const rows =
    app.kind === 'web'
      ? [
          ['Platform', app.platformLabel],
          ['Live at', new URL(app.liveUrl).host],
          ['Shipped', formatDate(app.showFrom)],
        ]
      : [
          ['Platform', listJoin([...new Set(app.platforms.map((p) => p.replace(/ \(.*\)$/, '')))])],
          ['Version', app.version],
          ['Shipped', formatDate(app.released)],
          ['Download', mainAssets(app).map((a) => `${a.label} ${formatBytes(a.size)}`).join(' · ')],
        ];
  return `<dl class="spec">${rows
    .map(([k, v]) => `<div><dt>${escapeHTML(k)}</dt><dd>${escapeHTML(v)}</dd></div>`)
    .join('')}</dl>`;
}

function actions(app) {
  const primary =
    app.kind === 'web'
      ? `<a class="btn" href="${safeURL(app.liveUrl)}">Open the app</a>`
      : `<a class="btn" href="${safeURL(app.release)}">Download ${escapeHTML(app.version)} on GitHub</a>`;
  const note =
    app.kind === 'web'
      ? 'Runs in your browser. Nothing to install.'
      : 'Opens the GitHub release page: release notes, checksums and the download.';
  return `<div class="actions">${primary}<a class="src" href="${safeURL(app.repo)}">Source code</a></div>
<p class="note">${escapeHTML(note)}</p>`;
}

function verifyBlock(app) {
  const hashed = (app.downloads ?? []).filter((d) => d.sha256);
  if (!hashed.length) return '';
  const rows = hashed
    .map((d) => `<li><span class="file">${escapeHTML(d.filename)}</span><code>${escapeHTML(d.sha256)}</code></li>`)
    .join('');
  return `<details class="verify"><summary>Verify the download</summary><ul>${rows}</ul><p>Check with <code>sha256sum &lt;file&gt;</code> on Linux or <code>shasum -a 256 &lt;file&gt;</code> on macOS.</p></details>`;
}

function installNotes(app) {
  const labels = { mac: 'macOS', linux: 'Linux', chrome: 'Chrome' };
  const parts = Object.entries(labels)
    .filter(([key]) => app.notes?.[key])
    .map(([key, label]) => `<p><b>${label}</b> ${escapeHTML(app.notes[key])}</p>`);
  return parts.length ? `<div class="install-notes">${parts.join('')}</div>` : '';
}

function demo(app) {
  const m = app.media;
  if (!m?.mp4) {
    return `<img class="demo" src="${escapeHTML(m.poster)}" alt="${escapeHTML(m.alt)}" width="1600" height="900" loading="lazy" decoding="async">`;
  }
  return `<video class="demo" poster="${escapeHTML(m.poster)}" muted loop playsinline preload="metadata" aria-label="${escapeHTML(m.alt)}">
<source src="${escapeHTML(m.webm)}" type="video/webm">
<source src="${escapeHTML(m.mp4)}" type="video/mp4">
</video>`;
}

function nextLink(index, apps) {
  if (apps.length < 2) return '';
  const next = apps[(index + 1) % apps.length];
  return `<a class="next" href="/apps/${escapeHTML(next.id)}/"><span><small>next app</small><b>${escapeHTML(next.name)}</b></span>${iconImg(next, 'next-icon', 64).replace(/ alt="[^"]*"/, ' alt=""')}</a>`;
}

export function renderAppPage(site, app, index, apps) {
  const what = (app.features ?? []).map((f) => `<li>${escapeHTML(f)}</li>`).join('');
  const body = `<header class="bar"><a href="/">NODAYSIDLE · all apps</a>${lights('lights lights-sm')}<span>${index + 1} / ${apps.length}</span></header>
<main class="app-page">
<div class="head">${iconImg(app, 'icon-lg', 148)}<h1>${escapeHTML(app.name)}</h1></div>
<p class="pitch">${escapeHTML(app.pitch)}</p>
<p class="desc">${escapeHTML(app.description)}</p>
${what ? `<ul class="what">${what}</ul>` : ''}
${specRow(app)}
${actions(app)}
${installNotes(app)}
${verifyBlock(app)}
${demo(app)}
${nextLink(index, apps)}
</main>`;
  return layout(site, {
    title: `${app.name} · ${site.title}`,
    description: app.pitch,
    canonical: `/apps/${app.id}/`,
    body,
    pageClass: 'page-app',
  });
}
