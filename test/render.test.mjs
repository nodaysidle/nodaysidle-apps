import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderHome, renderAppPage, numberWord } from '../lib/render.mjs';

const site = {
  title: 'NODAYSIDLE',
  description: 'Native apps.',
  url: 'https://nodaysidle-apps.vercel.app',
  github: 'https://github.com/nodaysidle',
  repo: 'https://github.com/nodaysidle/nodaysidle-apps',
};

const media = { poster: '/assets/media/x.webp', mp4: '/assets/media/x.mp4', webm: '/assets/media/x.webm', alt: 'demo' };

const kurek = {
  id: 'kurek', name: 'Kurek', kind: 'download', repo: 'https://github.com/nodaysidle/kureksistant',
  version: 'v0.2.1', released: '2026-10-14', showFrom: '2026-10-14T17:30:00+02:00',
  release: 'https://github.com/nodaysidle/kureksistant/releases/tag/v0.2.1',
  pitch: 'A voice assistant daemon for Arch and Hyprland.', description: 'Middle-click to summon.',
  features: ['Runs as a user daemon'], icon: '/assets/icons/kurek.webp', media,
  platforms: ['Linux x86_64 (Arch / Hyprland)'],
  downloads: [{ label: '.tar.gz', platform: 'Linux x86_64 (Arch / Hyprland)', filename: 'k.tar.gz', url: 'https://github.com/x/k.tar.gz', size: 3623852 }],
};

const sonora = {
  ...kurek, id: 'sonora', name: 'Sonora', version: 'v0.1.2', released: '2026-10-16', showFrom: '2026-10-16T17:30:00+02:00',
  release: 'https://github.com/nodaysidle/nodaysidle-sonora/releases/tag/v0.1.2',
  platforms: ['macOS Apple Silicon', 'Linux x86_64'],
  downloads: [
    { label: '.dmg', platform: 'macOS Apple Silicon', filename: 's.dmg', url: 'https://github.com/x/s.dmg', size: 16315230 },
    { label: '.AppImage', platform: 'Linux x86_64', filename: 's.AppImage', url: 'https://github.com/x/s.AppImage', size: 94943736, sha256: 'abc123' },
    { label: '.deb', platform: 'Linux x86_64', filename: 's.deb', url: 'https://github.com/x/s.deb', size: 17124308 },
  ],
};

const f1 = {
  id: 'f1-telemetry-pro', name: 'F1 Telemetry Pro', kind: 'web', repo: 'https://github.com/nodaysidle/F1-nodaysidle',
  liveUrl: 'https://f1-telemetry-pro.vercel.app', platformLabel: 'Web', showFrom: '2026-10-24T17:30:00+02:00',
  pitch: 'F1 telemetry in the browser.', description: 'Compare laps.', features: ['Four drivers'],
  icon: '/assets/icons/f1-telemetry-pro.webp', media: { poster: '/assets/media/f1.webp', alt: 'F1' },
};

const chrome = { ...kurek, id: 'nodaysrammar', name: 'nodaysrammar', platforms: ['Chrome / Chromium (MV3)'] };

test('numberWord spells small counts', () => {
  assert.equal(numberWord(8), 'Eight');
  assert.equal(numberWord(6), 'Six');
});

test('home headline counts visible apps', () => {
  const html = renderHome(site, [f1, sonora, kurek]);
  assert.match(html, /Lights out\./);
  assert.match(html, /Three apps shipped\./);
});

test('home subtext lists platforms of visible apps', () => {
  assert.match(renderHome(site, [sonora, chrome]), /Native apps for macOS, Linux and Chrome\./);
  assert.match(renderHome(site, [f1, sonora, chrome]), /Native apps for macOS, Linux, Chrome and the web\./);
});

test('home lists apps newest first with web label', () => {
  const html = renderHome(site, [f1, kurek]);
  assert.ok(html.indexOf('F1 Telemetry Pro') < html.indexOf('Kurek'));
  assert.match(html, /web · 24 Oct/);
  assert.match(html, /v0\.2\.1 · 14 Oct/);
});

test('home links each icon to /apps/<id>/', () => {
  const html = renderHome(site, [f1, kurek]);
  assert.match(html, /<a class="app" href="\/apps\/kurek\/"/);
  assert.match(html, /<a class="app" href="\/apps\/f1-telemetry-pro\/"/);
});

test('download button text', () => {
  const html = renderAppPage(site, kurek, 0, [kurek, sonora]);
  assert.match(html, /<a class="btn" href="https:\/\/github\.com\/nodaysidle\/kureksistant\/releases\/tag\/v0\.2\.1">Download v0\.2\.1 on GitHub<\/a>/);
});

test('web button text', () => {
  const html = renderAppPage(site, f1, 0, [f1, kurek]);
  assert.match(html, /<a class="btn" href="https:\/\/f1-telemetry-pro\.vercel\.app">Open the app<\/a>/);
  assert.doesNotMatch(html, /Download v/);
});

test('spec row lists one size per platform', () => {
  const html = renderAppPage(site, sonora, 0, [sonora]);
  assert.match(html, /\.dmg 15\.6 MB/);
  assert.match(html, /\.AppImage 90\.5 MB/);
  assert.doesNotMatch(html, /\.deb 16/);
});

test('next wraps from last to first', () => {
  const html = renderAppPage(site, kurek, 1, [sonora, kurek]);
  assert.match(html, /<a class="next" href="\/apps\/sonora\/"/);
});

test('single app has no next link', () => {
  assert.doesNotMatch(renderAppPage(site, kurek, 0, [kurek]), /class="next"/);
});

test('escapes html in names and attributes', () => {
  const evil = { ...kurek, name: 'A&B <x>' };
  const page = renderAppPage(site, evil, 0, [evil]);
  const home = renderHome(site, [evil]);
  for (const html of [page, home]) {
    assert.match(html, /A&amp;B &lt;x&gt;/);
    assert.doesNotMatch(html, /A&B <x>/);
  }
  assert.match(page, /alt="A&amp;B &lt;x&gt; icon"/);
});

test('no em dash in rendered pages', () => {
  const all = [f1, sonora, kurek];
  const pages = [renderHome(site, all), ...all.map((a, i) => renderAppPage(site, a, i, all))];
  for (const html of pages) assert.ok(!html.includes('—'));
});

test('verify section lists sha256 per file', () => {
  const html = renderAppPage(site, sonora, 0, [sonora]);
  assert.match(html, /<details class="verify">/);
  assert.match(html, /abc123/);
  assert.match(html, /s\.AppImage/);
});

test('verify section is omitted without checksums', () => {
  assert.doesNotMatch(renderAppPage(site, kurek, 0, [kurek]), /class="verify"/);
});
