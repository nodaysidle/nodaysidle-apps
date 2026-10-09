import { readFile, writeFile, mkdir, cp, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));

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
    timeZone: 'UTC',
  }).format(new Date(iso));
}

function platformBadges(platforms) {
  return platforms
    .map((p) => `<span class="badge">${escapeHTML(p)}</span>`)
    .join('');
}

function downloadButtons(downloads) {
  return downloads
    .map((d) => {
      const size = formatBytes(d.size);
      return `<a class="button download" href="${safeURL(d.url)}" download="${escapeHTML(d.filename)}" data-platform="${escapeHTML(d.platform)}"><span class="dl-label">${escapeHTML(d.label)}</span><span class="dl-meta">${escapeHTML(d.platform)} · ${escapeHTML(size)}</span></a>`;
    })
    .join('');
}

function checksumRows(downloads) {
  const withHash = downloads.filter((d) => d.sha256);
  if (!withHash.length) return '';
  const rows = withHash
    .map(
      (d) =>
        `<li><code class="checksum" data-checksum="${escapeHTML(d.sha256)}" tabindex="0" title="Click to copy SHA-256">${escapeHTML(d.sha256)}</code><span class="checksum-file">${escapeHTML(d.filename)}</span><button type="button" class="copy-btn" data-copy="${escapeHTML(d.sha256)}" aria-label="Copy SHA-256 for ${escapeHTML(d.filename)}">Copy</button></li>`
    )
    .join('');
  return `<div class="checksums"><h4>SHA-256</h4><ul>${rows}</ul><p class="checksum-hint">Verify with <code>shasum -a 256 &lt;file&gt;</code> (macOS) or <code>sha256sum &lt;file&gt;</code> (Linux). Click a hash to copy.</p></div>`;
}

function notesBlock(app) {
  const parts = [];
  if (app.notes?.mac) {
    parts.push(`<p><strong>macOS:</strong> ${escapeHTML(app.notes.mac)}</p>`);
  }
  if (app.notes?.linux) {
    parts.push(`<p><strong>Linux:</strong> ${escapeHTML(app.notes.linux)}</p>`);
  }
  if (app.notes?.chrome) {
    parts.push(`<p><strong>Chrome:</strong> ${escapeHTML(app.notes.chrome)}</p>`);
  }
  if (!parts.length) return '';
  return `<aside class="app-notes" aria-label="Install notes">${parts.join('')}</aside>`;
}

function featuresList(features) {
  return `<ul class="feature-list">${features.map((f) => `<li>${escapeHTML(f)}</li>`).join('')}</ul>`;
}

function mediaBlock(media) {
  return `<div class="demo-media">
<video class="demo-video" poster="${escapeHTML(media.poster)}" muted loop playsinline preload="none" aria-label="${escapeHTML(media.alt)}">
<source src="${escapeHTML(media.webm)}" type="video/webm">
<source src="${escapeHTML(media.mp4)}" type="video/mp4">
</video>
<img class="demo-poster" src="${escapeHTML(media.poster)}" alt="${escapeHTML(media.alt)}" width="960" height="540" loading="eager" decoding="async" fetchpriority="low">
</div>`;
}

export function renderAppCard(app, index, total) {
  const num = String(index + 1).padStart(2, '0');
  const totalStr = String(total).padStart(2, '0');
  return `<article class="app-card reveal" id="${escapeHTML(app.id)}" aria-labelledby="app-${escapeHTML(app.id)}">
<div class="app-media">${mediaBlock(app.media)}<span class="app-num">${num} / ${totalStr}</span></div>
<div class="app-body">
<div class="app-meta"><span>${escapeHTML(app.version)} · ${escapeHTML(formatDate(app.released))}</span><span class="licence">${escapeHTML(app.licence)}</span></div>
<div class="platforms" role="list" aria-label="Supported platforms">${platformBadges(app.platforms)}</div>
<h3 id="app-${escapeHTML(app.id)}">${escapeHTML(app.name)}</h3>
<p class="pitch">${escapeHTML(app.pitch)}</p>
<p class="desc">${escapeHTML(app.description)}</p>
${featuresList(app.features)}
<div class="downloads" role="group" aria-label="Downloads for ${escapeHTML(app.name)}">${downloadButtons(app.downloads)}</div>
${checksumRows(app.downloads)}
${notesBlock(app)}
<div class="app-links">
<a class="text-link" href="${safeURL(app.repo)}">Repository <span aria-hidden="true">↗</span></a>
<a class="text-link" href="${safeURL(app.release)}">Release notes <span aria-hidden="true">↗</span></a>
</div>
</div>
</article>`;
}

export async function build() {
  const data = JSON.parse(await readFile(path.join(root, 'data/apps.json'), 'utf8'));
  if (!Array.isArray(data.apps) || !data.apps.length) {
    throw new Error('data/apps.json must contain at least one app.');
  }

  const ids = new Set();
  for (const app of data.apps) {
    if (!app.id || ids.has(app.id) || !app.name || !Array.isArray(app.downloads)) {
      throw new Error('Each app needs a unique id, name, and downloads array.');
    }
    ids.add(app.id);
    for (const asset of ['poster', 'mp4', 'webm']) {
      const rel = app.media[asset];
      if (!rel?.startsWith('/assets/')) throw new Error(`Invalid media path: ${rel}`);
      await access(path.join(root, 'public', rel));
    }
    for (const d of app.downloads) {
      safeURL(d.url);
      if (!d.filename || !d.label || typeof d.size !== 'number') {
        throw new Error(`Incomplete download entry for ${app.id}`);
      }
    }
  }

  const cards = data.apps.map((app, i) => renderAppCard(app, i, data.apps.length)).join('\n');
  const navApps = data.apps
    .map((app) => `<a href="#${escapeHTML(app.id)}">${escapeHTML(app.name)}</a>`)
    .join('');

  const replacements = {
    TITLE: escapeHTML(data.site.title),
    DESCRIPTION: escapeHTML(data.site.description),
    SITE_URL: escapeHTML(data.site.url),
    PORTFOLIO: safeURL(data.site.portfolio),
    GITHUB: safeURL(data.site.github),
    REPO: safeURL(data.site.repo),
    YEAR: String(new Date().getFullYear()),
    APP_COUNT: String(data.apps.length).padStart(2, '0'),
    APPS: cards,
    NAV_APPS: navApps,
    OG_IMAGE: escapeHTML(`${data.site.url}/assets/media/cascade.jpg`),
  };

  let html = await readFile(path.join(root, 'src/index.html'), 'utf8');
  html = html.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
    if (!(key in replacements)) throw new Error(`Unknown template key ${key}`);
    return replacements[key];
  });

  await mkdir(path.join(root, 'dist'), { recursive: true });
  await cp(path.join(root, 'public'), path.join(root, 'dist'), { recursive: true });
  await writeFile(path.join(root, 'dist/index.html'), html);
  console.log(`Built ${data.apps.length} apps → dist/`);
  return html;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await build();
