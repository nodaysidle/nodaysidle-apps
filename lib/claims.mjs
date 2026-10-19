const normalise = (text) => String(text).toLowerCase().replace(/\s+/g, ' ');

export function findFlaggedClaims(text, flagged) {
  const haystack = normalise(text);
  return flagged.filter((claim) => haystack.includes(normalise(claim)));
}

export async function githubDescription(repo) {
  const slug = new URL(repo).pathname.replace(/^\/|\/$/g, '');
  try {
    const res = await fetch(`https://api.github.com/repos/${slug}`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'nodaysidle-apps-build' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body.description ?? '';
  } catch {
    return null;
  }
}

export async function checkApps(apps, flagged, fetchDescription) {
  const warnings = [];
  const unreachable = [];
  for (const app of apps) {
    const siteText = [app.pitch, app.description, ...(app.features ?? [])].join('\n');
    for (const claim of findFlaggedClaims(siteText, flagged)) {
      warnings.push(`${app.id}: site text contains flagged claim "${claim}"`);
    }
    const live = await fetchDescription(app.repo);
    if (live === null) {
      unreachable.push(app.repo);
      continue;
    }
    if (normalise(live) !== normalise(app.githubDescription)) {
      warnings.push(`${app.id}: GitHub description changed. Now: "${live}"`);
    }
    for (const claim of findFlaggedClaims(live, flagged)) {
      warnings.push(`${app.id}: GitHub description contains flagged claim "${claim}"`);
    }
  }
  return { warnings, unreachable };
}
