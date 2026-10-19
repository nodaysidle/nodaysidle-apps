import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadData } from '../lib/data.mjs';
import { checkApps, githubDescription, summarise } from '../lib/claims.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const data = await loadData(root);
const flagged = JSON.parse(await readFile(path.join(root, 'data/flagged-claims.json'), 'utf8'));
const { warnings, unreachable } = await checkApps(data.apps, flagged, githubDescription);

for (const repo of unreachable) console.warn(`unreachable: ${repo} (GitHub not checked)`);
for (const line of warnings) console.error(`claim check: ${line}`);
const { exitCode, message } = summarise({ warnings, unreachable });
console.log(message);
process.exitCode = exitCode;
