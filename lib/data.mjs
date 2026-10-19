import { readFile } from 'node:fs/promises';
import path from 'node:path';

const COMMON_FIELDS = ['id', 'name', 'kind', 'repo', 'pitch', 'description', 'icon', 'showFrom'];
const KIND_FIELDS = {
  download: ['version', 'release', 'downloads'],
  web: ['liveUrl'],
};

// Preferred installer per platform: the format most people on that platform expect.
const ASSET_PREFERENCE = ['.dmg', '.AppImage', '.zip', '.tar.gz'];

function validateApp(app, index) {
  const label = app?.id || `#${index}`;
  const kindFields = KIND_FIELDS[app?.kind];
  if (!kindFields) throw new Error(`App ${label}: kind must be "download" or "web"`);
  for (const field of [...COMMON_FIELDS, ...kindFields]) {
    if (app[field] === undefined || app[field] === '') {
      throw new Error(`App ${label}: missing ${field}`);
    }
  }
  if (Number.isNaN(Date.parse(app.showFrom))) {
    throw new Error(`App ${label}: showFrom is not a valid date`);
  }
}

export async function loadData(rootDir) {
  const data = JSON.parse(await readFile(path.join(rootDir, 'data/apps.json'), 'utf8'));
  if (!Array.isArray(data.apps) || !data.apps.length) {
    throw new Error('data/apps.json must contain at least one app.');
  }
  const ids = new Set();
  data.apps.forEach((app, i) => {
    validateApp(app, i);
    if (ids.has(app.id)) throw new Error(`App ${app.id}: duplicate id`);
    ids.add(app.id);
  });
  return data;
}

export function visibleApps(apps, now, { showAll }) {
  return apps
    .map((app, order) => ({ app, order, at: Date.parse(app.showFrom) }))
    .filter(({ at }) => showAll || at <= now.getTime())
    .sort((a, b) => b.at - a.at || a.order - b.order)
    .map(({ app }) => app);
}

export function mainAssets(app) {
  const platforms = [];
  for (const asset of app.downloads ?? []) {
    if (!platforms.includes(asset.platform)) platforms.push(asset.platform);
  }
  return platforms.map((platform) => {
    const assets = app.downloads.filter((d) => d.platform === platform);
    const rank = (d) => {
      const i = ASSET_PREFERENCE.indexOf(d.label);
      return i === -1 ? ASSET_PREFERENCE.length : i;
    };
    const best = assets.reduce((a, b) => (rank(b) < rank(a) ? b : a));
    return { platform, label: best.label, size: best.size };
  });
}
