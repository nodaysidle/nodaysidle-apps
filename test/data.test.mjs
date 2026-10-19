import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadData, visibleApps, mainAssets } from '../lib/data.mjs';

const app = (id, showFrom) => ({ id, name: id, showFrom });

test('visibleApps hides an app before showFrom', () => {
  const apps = [app('a', '2026-10-21T17:30:00+02:00')];
  assert.deepEqual(visibleApps(apps, new Date('2026-10-21T15:29:59Z'), { showAll: false }), []);
});

test('visibleApps shows the app at 17:30 local', () => {
  const apps = [app('a', '2026-10-21T17:30:00+02:00')];
  const ids = visibleApps(apps, new Date('2026-10-21T15:30:05Z'), { showAll: false }).map((a) => a.id);
  assert.deepEqual(ids, ['a']);
});

test('visibleApps uses the winter offset after 25 Oct', () => {
  const apps = [app('a', '2026-10-28T17:30:00+01:00')];
  const ids = visibleApps(apps, new Date('2026-10-28T16:30:05Z'), { showAll: false }).map((a) => a.id);
  assert.deepEqual(ids, ['a']);
});

test('visibleApps showAll includes future apps', () => {
  const apps = [app('a', '2030-01-01T00:00:00+01:00')];
  const ids = visibleApps(apps, new Date('2026-10-19T12:00:00Z'), { showAll: true }).map((a) => a.id);
  assert.deepEqual(ids, ['a']);
});

test('visibleApps sorts newest first', () => {
  const apps = [
    app('old', '2026-09-16T17:30:00+02:00'),
    app('new', '2026-10-14T17:30:00+02:00'),
    app('mid', '2026-09-27T17:30:00+02:00'),
  ];
  const ids = visibleApps(apps, new Date('2026-10-19T12:00:00Z'), { showAll: false }).map((a) => a.id);
  assert.deepEqual(ids, ['new', 'mid', 'old']);
});

test('mainAssets picks one per platform', () => {
  const sonora = {
    downloads: [
      { label: '.dmg', platform: 'macOS Apple Silicon', size: 1 },
      { label: '.app.tar.gz', platform: 'macOS Apple Silicon', size: 2 },
      { label: '.AppImage', platform: 'Linux x86_64', size: 3 },
      { label: '.deb', platform: 'Linux x86_64', size: 4 },
      { label: '.rpm', platform: 'Linux x86_64', size: 5 },
    ],
  };
  assert.deepEqual(mainAssets(sonora), [
    { platform: 'macOS Apple Silicon', label: '.dmg', size: 1 },
    { platform: 'Linux x86_64', label: '.AppImage', size: 3 },
  ]);
});

test('loadData throws naming the app on a missing pitch', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'nds-apps-'));
  await mkdir(path.join(dir, 'data'));
  const bad = {
    id: 'kurek', name: 'Kurek', kind: 'web', repo: 'https://github.com/x/y',
    description: 'd', icon: '/assets/icons/kurek.webp', showFrom: '2026-10-14T17:30:00+02:00',
    liveUrl: 'https://example.com',
  };
  await writeFile(path.join(dir, 'data/apps.json'), JSON.stringify({ site: {}, apps: [bad] }));
  await assert.rejects(loadData(dir), /kurek.*pitch|pitch.*kurek/);
});
