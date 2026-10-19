import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build } from '../scripts/build.mjs';

const offline = async () => null;
const exists = (p) => access(p).then(() => true, () => false);

async function buildInto(opts) {
  const outDir = await mkdtemp(path.join(tmpdir(), 'nds-dist-'));
  const result = await build({ fetchDescription: offline, outDir, ...opts });
  return { outDir, result };
}

test('writes index and one page per visible app', async () => {
  const { outDir } = await buildInto({ now: new Date('2026-10-25T12:00:00Z'), showAll: false });
  assert.match(await readFile(path.join(outDir, 'index.html'), 'utf8'), /Eight apps shipped\./);
  for (const id of ['kurek', 'sonora', 'f1-telemetry-pro', 'ai-rules-builder']) {
    assert.ok(await exists(path.join(outDir, 'apps', id, 'index.html')), id);
  }
  assert.ok(await exists(path.join(outDir, '404.html')));
  assert.ok(await exists(path.join(outDir, 'style.css')));
});

test('future app has no page in production build', async () => {
  const { outDir } = await buildInto({ now: new Date('2026-10-19T12:00:00Z'), showAll: false });
  assert.equal(await exists(path.join(outDir, 'apps', 'f1-telemetry-pro')), false);
  const home = await readFile(path.join(outDir, 'index.html'), 'utf8');
  assert.doesNotMatch(home, /F1 Telemetry Pro/);
  assert.match(home, /Six apps shipped\./);
});

test('build succeeds when GitHub is unreachable', async () => {
  const { result } = await buildInto({ now: new Date('2026-10-19T12:00:00Z'), showAll: true });
  assert.equal(result.pages.length, 8);
});
