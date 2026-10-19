import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findFlaggedClaims, checkApps } from '../lib/claims.mjs';

const FLAGGED = ['sub-second', '~333MB', '333 MB', '24 tools', '~0.8ms', '0.8 ms'];

const KUREK_GITHUB =
  'Autonomous, sub-second personal AI assistant for Arch Linux (Hyprland) & macOS. Features ~333MB RAM headless daemon, Middle Click   hardware summon, Muse Memory, TypeSafe Jev System One cognitive gating, DeepSeek-Flash reasoning, and xAI Grok (Sol) voice.';

const app = (overrides = {}) => ({
  id: 'kurek',
  repo: 'https://github.com/nodaysidle/kureksistant',
  pitch: 'A voice assistant daemon for Arch and Hyprland.',
  description: 'Middle-click to summon.',
  features: ['Runs as a user daemon'],
  githubDescription: KUREK_GITHUB,
  ...overrides,
});

test("flags sub-second in Kurek's live description", () => {
  assert.deepEqual(findFlaggedClaims(KUREK_GITHUB, FLAGGED), ['sub-second', '~333MB']);
});

test('flags ignore case and spacing', () => {
  assert.deepEqual(findFlaggedClaims('Answers in  SUB-SECOND time', FLAGGED), ['sub-second']);
});

test('warns when the GitHub description differs from githubDescription', async () => {
  const result = await checkApps([app({ githubDescription: 'old text' })], [], async () => 'new text');
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /kurek/);
  assert.match(result.warnings[0], /new text/);
});

test('checks site text too', async () => {
  const result = await checkApps(
    [app({ githubDescription: 'same', features: ['Replies in 0.8 ms'] })],
    FLAGGED,
    async () => 'same'
  );
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /0\.8 ms/);
});

test('fetch failure is reported as unreachable, not thrown', async () => {
  const result = await checkApps([app({ githubDescription: 'clean' })], FLAGGED, async () => null);
  assert.deepEqual(result.unreachable, ['https://github.com/nodaysidle/kureksistant']);
  assert.deepEqual(result.warnings, []);
});
