import { readFile, writeFile, mkdir, cp, access, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadData, visibleApps } from '../lib/data.mjs';
import { checkApps, githubDescription } from '../lib/claims.mjs';
import { renderHome, renderAppPage, renderNotFound, safeURL } from '../lib/render.mjs';

export { escapeHTML, safeURL, formatBytes, formatDate } from '../lib/render.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

async function validateAssets(apps) {
  for (const app of apps) {
    const files = [app.icon, app.media?.poster, app.media?.mp4, app.media?.webm].filter(Boolean);
    for (const rel of files) {
      if (!rel.startsWith('/assets/')) throw new Error(`${app.id}: invalid asset path ${rel}`);
      await access(path.join(root, 'public', rel));
    }
    safeURL(app.repo);
    if (app.kind === 'web') safeURL(app.liveUrl);
    for (const d of app.downloads ?? []) {
      safeURL(d.url);
      if (!d.filename || !d.label || typeof d.size !== 'number') {
        throw new Error(`Incomplete download entry for ${app.id}`);
      }
    }
  }
}

export async function build({
  now = new Date(),
  showAll = process.env.VERCEL_ENV === 'preview' || process.env.SHOW_ALL === '1',
  fetchDescription = githubDescription,
  outDir = path.join(root, 'dist'),
} = {}) {
  const data = await loadData(root);
  await validateAssets(data.apps);

  // The claim check never blocks a deploy: the site ships the checked text from apps.json.
  const flagged = JSON.parse(await readFile(path.join(root, 'data/flagged-claims.json'), 'utf8'));
  const { warnings, unreachable } = await checkApps(data.apps, flagged, fetchDescription);
  for (const line of warnings) console.warn(`claim check: ${line}`);
  if (unreachable.length) console.warn(`claim check: GitHub not reachable for ${unreachable.length} repo(s), skipped`);

  const apps = visibleApps(data.apps, now, { showAll });

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await cp(path.join(root, 'public'), outDir, { recursive: true });
  await rm(path.join(outDir, 'assets/icons/src'), { recursive: true, force: true });

  await writeFile(path.join(outDir, 'index.html'), renderHome(data.site, apps));
  await writeFile(path.join(outDir, '404.html'), renderNotFound(data.site));
  const pages = [];
  for (const [i, app] of apps.entries()) {
    const dir = path.join(outDir, 'apps', app.id);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'index.html'), renderAppPage(data.site, app, i, apps));
    pages.push(`/apps/${app.id}/`);
  }
  console.log(`Built ${apps.length} apps${showAll ? ' (all, preview)' : ''} → ${path.relative(root, outDir) || outDir}/`);
  return { pages, warnings };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await build();
