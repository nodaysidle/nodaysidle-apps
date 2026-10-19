import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadData } from '../lib/data.mjs';
import { checkApps, githubDescription } from '../lib/claims.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const data = await loadData(root);
const flagged = JSON.parse(await readFile(path.join(root, 'data/flagged-claims.json'), 'utf8'));
const { warnings, unreachable } = await checkApps(data.apps, flagged, githubDescription);

for (const repo of unreachable) console.warn(`unreachable: ${repo} (GitHub not checked)`);
for (const line of warnings) console.error(`claim check: ${line}`);
console.log(warnings.length ? `${warnings.length} claim warning(s).` : 'Claim check clean.');
process.exitCode = warnings.length ? 1 : 0;
