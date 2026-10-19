# Lights out redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild nodaysidle-apps.vercel.app as the "Lights out" homepage (8 greyscale app icons, newest first) plus one page per app, generated statically from `data/apps.json`.

**Architecture:** This stays a dependency-free Node build. The pure functions live in `lib/`:
- data loading and visibility
- the claim check
- HTML rendering

`scripts/build.mjs` wires them together and writes `dist/index.html` and `dist/apps/<id>/index.html`. A small `public/app.js` handles the start lights and the video behaviour. Tests use `node:test`.

**Tech Stack:** Node ≥22 (local v26.8.1), plain HTML/CSS/JS, `node --test`, ImageMagick and rsvg-convert for icon prep, and Playwright CLI for screenshots.

**Spec:** `docs/superpowers/specs/2026-10-19-lights-out-redesign-design.md`

## Global Constraints

- No runtime dependencies and no framework. Output is static `dist/`, and the CSP in `vercel.json` stays exactly as it is (`font-src 'self'`, `script-src 'self'`, `img-src 'self'`, `media-src 'self'`).
- **Colours:**
  - Background `#050505`, text `#f2f2f2`.
  - Secondary text `#c4c4c4`, mono labels `#9a9a9a`, the dimmed next-app name `#8f8f8f`.
  - The single accent is `#e10600`, used only for the lights, the button hover and focus, and never for body text.
- **Fonts** are self-hosted woff2 only:
  - Saira Condensed 600 and 800 for display.
  - IBM Plex Sans 400 and 600 for text.
  - IBM Plex Mono 400 and 500 for numbers and labels.
  - Manrope and DM Mono are removed.
- **Copy rules:**
  - No em dash (`—`) in any page text.
  - No buzzwords.
  - No number without a source.
  - The button text is exactly `Download vX.Y.Z on GitHub`, or `Open the app` for web apps.
- **Motion:**
  - The homepage lights go out left to right over about 600 ms, once.
  - Icons and the next-app link change in 120 ms on hover and focus.
  - Nothing fades in on scroll.
  - `prefers-reduced-motion` shows the lights already dark and doesn't autoplay videos.
- Every link and button has a visible focus style, and tap targets are at least 44 px.
- The site text never comes from raw GitHub text. The claim check warns in `build` and fails in `check`.
- Production builds only include apps whose `showFrom` time has passed. When `VERCEL_ENV=preview` or `SHOW_ALL=1`, every app is included.
- Work stays on branch `redesign/lights-out`. Merging to `main` needs Alan's quoted OK.

## Review Focus

1. **The GitHub API is unreachable or rate-limited during a build** (no token, 60 requests per hour): the build must still succeed with a warning, never crash. The test lives in Task 2.
2. **An app with several platforms and several assets** (Sonora: .dmg, AppImage, .deb, .rpm, .tar.gz): the details row lists one size per platform's main asset, not all of them and not a single sum. The test lives in Task 3.
3. **The time-zone boundary for `showFrom`:** 2026-10-24 17:30 Europe/Ljubljana is 15:30 UTC (after the 25 Oct clock change it's UTC+1). The deploy hook fires at local 17:30, so a build at 15:30:05 UTC must include the app. The test lives in Task 1.
4. **The next app on the last app wraps to the first, and with a single visible app it doesn't link to itself.** The test lives in Task 3.
5. **An app id or text containing HTML characters** (`&`, `<`, quotes): it must be escaped everywhere, including `alt` and `aria-label` attributes. The test lives in Task 3.

---

### Task 1: Data model, visibility and the latest releases

**Files:**
- Create: `lib/data.mjs`
- Modify: `data/apps.json`
- Test: `test/data.test.mjs`
- Modify: `package.json` (add `"test": "node --test test/"` and `"check": "node scripts/check.mjs"`)

**Interfaces:**
- Produces:
  - `loadData(rootDir: string) => Promise<{site, apps}>`. It validates the shape and throws `Error` naming the app id on a missing field.
  - `visibleApps(apps: App[], now: Date, {showAll: boolean}) => App[]`. It keeps only apps with `showFrom <= now` unless `showAll` is set, sorted by `showFrom` newest first, with ties broken by array order.
  - `mainAssets(app: App) => Array<{platform, label, size}>`. It returns one asset per platform; the platform list comes from the assets, and the preference order is `.dmg`, `.AppImage`, `.zip`, `.tar.gz`.
- **App fields:**
  - `id`, `name`, `kind: "download"|"web"`, `repo`, `pitch`, `description`, `githubDescription`, `features[] (≤5)`, `icon`, `showFrom` (ISO with offset), `media`, `notes`.
  - Download apps also have `version`, `release`, `downloads[]` (`label`, `platform`, `filename`, `url`, `size`, `sha256?`).
  - Web apps also have `liveUrl` and `platformLabel: "Web"`.

- [ ] **Step 1: Write the failing tests** in `test/data.test.mjs`:
  - `visibleApps hides an app before showFrom`: with `showFrom` `2026-10-21T17:30:00+02:00` and now `2026-10-21T15:29:59Z`, the app is excluded.
  - `visibleApps shows the app at 17:30 local`: with now `2026-10-21T15:30:05Z`, the app is included.
  - `visibleApps uses the winter offset after 25 Oct`: with `showFrom` `2026-10-28T17:30:00+01:00` and now `2026-10-28T16:30:05Z`, the app is included.
  - `visibleApps showAll includes future apps`.
  - `visibleApps sorts newest first`.
  - `mainAssets picks one per platform`: Sonora fixture with .dmg, .AppImage, .deb, .rpm and .tar.gz gives `[{platform:'macOS Apple Silicon',label:'.dmg'},{platform:'Linux x86_64',label:'.AppImage'}]`.
  - `loadData throws naming the app on a missing pitch`.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL (`lib/data.mjs` doesn't exist yet).
- [ ] **Step 3: Implement `lib/data.mjs`** with the three exports above.
- [ ] **Step 4: Update `data/apps.json` with the latest releases and the two web apps:**
  - **Releases:** refresh Cascade to v3.1.1, Sonora to v0.1.2 and Browser for Linux to v0.2.1 from `gh api repos/nodaysidle/<repo>/releases/latest`. Take version, date, asset names, URLs and sizes from the API. Take `sha256` from each `.sha256` asset's contents. Cascade v3.1.1 has no .dmg, so its platforms become Linux only: set `platforms` from the assets and don't keep the old macOS entry.
  - **Existing apps:** for all 6, add `kind`, `icon`, `githubDescription` (the current repo description verbatim), and `showFrom` (the release date, at 17:30 local).
  - **New apps:** add `ai-rules-builder` (repo `nodaysidle/markdown-helper`, `liveUrl` `https://markdown-helper.vercel.app`, `showFrom` `2026-10-21T17:30:00+02:00`) and `f1-telemetry-pro` (repo `nodaysidle/F1-nodaysidle`, `liveUrl` `https://f1-telemetry-pro.vercel.app`, `showFrom` `2026-10-24T17:30:00+02:00`).
  - **Text for the new apps:** take the pitch, description and features from each README. Keep only claims confirmed in that repo's source or on the live site, and write next to the entry in the commit message which claims were cut and why.
  - **`site` block:** the title becomes `NODAYSIDLE`, the description is rewritten without an em dash, and the `portfolio` key is removed.
- [ ] **Step 5: Run** `npm test`. Expected: PASS.
- [ ] **Step 6: Commit** `feat(data): app visibility, per-platform assets, latest releases, two web apps`.

### Task 2: Claim check

**Files:**
- Create: `lib/claims.mjs`, `data/flagged-claims.json`, `scripts/check.mjs`
- Test: `test/claims.test.mjs`

**Interfaces:**
- Consumes: `loadData` from Task 1.
- Produces:
  - `findFlaggedClaims(text: string, flagged: string[]) => string[]`. Matching is case-insensitive and ignores whitespace variation.
  - `checkApps(apps: App[], flagged: string[], fetchDescription: (repo) => Promise<string|null>) => Promise<{warnings: string[], unreachable: string[]}>`.
  - `githubDescription(repo: string) => Promise<string|null>`. It calls `https://api.github.com/repos/<owner/name>`, has a 5 s timeout, and returns `null` on any failure.
- **The flagged list in `data/flagged-claims.json`:**
  - `["sub-second", "~333MB", "333 MB", "24 tools", "~0.8ms", "0.8 ms"]`.
  - The commit message notes the source: vault catalog and PRs #6 and #7.

- [ ] **Step 1: Write the failing tests:**
  - `flags sub-second in Kurek's live description`, using the exact string "Autonomous, sub-second personal AI assistant … ~333MB RAM …". Expected result: `['sub-second','~333MB']`.
  - `warns when the GitHub description differs from githubDescription`.
  - `checks site text too` (pitch, description and features).
  - `fetch failure is reported as unreachable, not thrown`: `fetchDescription` returns `null`, so `unreachable` contains the repo and `warnings` is empty.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement `lib/claims.mjs`.** Also add `scripts/check.mjs`, which prints the warnings and unreachable repos and exits 1 when there are warnings, 0 otherwise.
- [ ] **Step 4: Run** `npm test`, then `npm run check`. Expected: the tests pass, and `check` exits 1 while listing Kurek's two flagged claims (that's correct until Alan fixes GitHub).
- [ ] **Step 5: Commit** `feat(check): flagged-claim and GitHub description check`.

### Task 3: Page rendering

**Files:**
- Create: `lib/render.mjs`, `src/home.html`, `src/app.html`
- Delete: `src/index.html`
- Test: `test/render.test.mjs`

**Interfaces:**
- Consumes: `mainAssets` from Task 1, plus the `escapeHTML`, `safeURL`, `formatBytes` and `formatDate` already exported by `scripts/build.mjs`. These helpers move into `lib/render.mjs`, and `build.mjs` re-exports them.
- Produces:
  - `renderHome(site, apps: App[]) => string`.
  - `renderAppPage(site, app: App, index: number, apps: App[]) => string`.
  - `numberWord(n: number) => string`, which returns `'Eight'` for 8, `'Six'` for 6, and so on.
- **Markup the CSS (Task 4) relies on:**
  - Homepage: `.lights > i×5`, `h1.headline`, `.sub`, `ul.apps > li > a.app` (containing `img.icon`, `span.name`, `span.meta`), and `footer` with the GitHub org link and the site repo link.
  - App page: `.bar` (back link, `.lights` small, position), `.head` (`img.icon-lg`, `h1`), `.pitch`, `.desc`, `.source`, `ul.what`, `dl.spec`, `.actions` (`a.btn`, `a.src`), `.note`, `details.verify`, `.install-notes`, `video.demo` with poster, `a.next` (`span > small + b`, `img`).

- [ ] **Step 1: Write the failing tests:**
  - `home headline counts visible apps`: 8 apps give "Lights out." and "Eight apps shipped.".
  - `home subtext lists platforms of visible apps`: 6 download apps give "macOS, Linux and Chrome", and all 8 give "macOS, Linux, Chrome and the web".
  - `home lists apps newest first with web label`: F1 shows `web · 24 Oct`, Kurek shows `v0.2.1 · 14 Oct`.
  - `home links each icon to /apps/<id>/`.
  - `download button text`: Kurek gives exactly `Download v0.2.1 on GitHub` with `href` equal to `app.release`.
  - `web button text`: F1 gives exactly `Open the app` with `href` equal to `liveUrl`.
  - `spec row lists one size per platform`: Sonora shows `.dmg` and `.AppImage` with formatted sizes.
  - `next wraps from last to first`, and `single app has no next link`.
  - `escapes html in names and attributes`: the name `A&B <x>` appears as `A&amp;B &lt;x&gt;` in text and in `alt`.
  - `no em dash in rendered pages`: the output of every page doesn't contain `—`.
  - `verify section lists sha256 per file`, and is omitted when no download has `sha256`.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** `lib/render.mjs` and the two templates, following the approved mockups `app-page-v2.html` and `homepage-v6.html` in `.superpowers/brainstorm/374613-1792416745/content/`. Use real `<a>` elements for every control and an `<h1>` per page. Images get `width` and `height` set. The video gets the `poster`, `muted`, `loop`, `playsinline` and `preload="metadata"` attributes, with no `autoplay` attribute (Task 4's JS starts it).
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(render): Lights out homepage and app pages`.

### Task 4: Look, fonts, icons and motion

**Files:**
- Rewrite: `public/style.css`, `public/app.js`
- Create: `public/assets/fonts/*.woff2` and their `OFL.txt` licences, `public/assets/icons/<id>.png`, `public/assets/icons/src/{f1-telemetry-pro,ai-rules-builder}.svg`
- Delete: `public/assets/manrope*`, `public/assets/dm-mono*`

**Interfaces:**
- Consumes: the markup class names from Task 3.

- [ ] **Step 1: Fonts.** Download the woff2 files (latin subset) from `https://cdn.jsdelivr.net/npm/@fontsource/saira-condensed@5/files/`, `@fontsource/ibm-plex-sans@5` and `@fontsource/ibm-plex-mono@5`, in exactly the weights listed in Global Constraints. Copy each licence alongside. Declare them in `@font-face` with `font-display: swap`.
- [ ] **Step 2: Icons.**
  - Sources:
    - Cascade and Sonora: their `src-tauri/icons/icon.png`.
    - Kurek: the largest PNG embedded in `kurekizmo/menubar/AppIcon.icns`.
    - Browser for Linux: `nodaysidle-browser-linux/assets/icon.svg`.
    - nodaysrammar: `chrome-extension/assets/icon.svg`.
    - WhisperBar: `Resources/AppIcon.png` in the GitHub repo `nodaysidle/whisper-bar`.
    - F1 Telemetry Pro and AI Rules Builder: the two SVGs in `.superpowers/brainstorm/374613-1792416745/icons-src/`.
  - Normalise each one with `magick <in> -trim +repage -resize 492x492 -background none -gravity center -extent 512x512` into `public/assets/icons/<id>.png`, then also write a 192 px WebP. The site uses the WebP and keeps the PNG as fallback.
- [ ] **Step 3: Styles** from the approved mockups:
  - Greyscale icons at rest (`filter: grayscale(1) brightness(.85)`).
  - On `:hover` and `:focus-visible`, `filter:none` with a `translateY(-6px)` lift (-4 px on the next-app icon) over 120 ms.
  - The next-app name is `#8f8f8f` at 32 px and turns `#f2f2f2` on hover or focus.
  - The button turns `#e10600` on hover, with a 2 px `#f2f2f2` outline on focus.
  - Breakpoints: 8 columns ≥1100 px, 4 columns ≥560 px, 3 columns below. The headline uses `clamp(56px, 10vw, 112px)` and the app name `clamp(56px, 9vw, 104px)`.
- [ ] **Step 4: `public/app.js`:**
  - On the homepage, add `.out` to the lights one by one, 120 ms apart, starting 150 ms after load.
  - With reduced motion, add `.out` to all of them at once.
  - On app pages, call `video.play()` unless reduced motion is set, catching the rejection.
- [ ] **Step 5: Run** `npm run build && npm run preview` and look at `/` and `/apps/kurek/` at 1440 px with the Playwright CLI (`playwright screenshot --viewport-size=1440,900 --wait-for-timeout=1500`). Expected: it matches the mockups.
- [ ] **Step 6: Commit** `feat(style): Lights out theme, self-hosted fonts, normalised icons`.

### Task 5: Build wiring and README

**Files:**
- Modify: `scripts/build.mjs`, `README.md`
- Test: `test/build.test.mjs`

**Interfaces:**
- Consumes: Tasks 1 to 3.
- Produces: `build({now = new Date(), showAll = process.env.VERCEL_ENV === 'preview' || process.env.SHOW_ALL === '1', fetchDescription = githubDescription} = {}) => Promise<{pages: string[], warnings: string[]}>`.

- [ ] **Step 1: Write the failing tests** using a temp output dir:
  - `writes index and one page per visible app`.
  - `future app has no page in production build`: no `dist/apps/f1-telemetry-pro/` when now is 19 Oct and `showAll` is false.
  - `build succeeds when GitHub is unreachable`.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - The build copies `public/` to `dist/` and keeps the media path validation.
  - It prints the claim warnings without failing.
  - It writes a `404.html` in the same theme, containing a link back home.
  - The README is rewritten: what the site is, `npm test`, `npm run build`, `npm run check`, the meaning of `showFrom` and `SHOW_ALL`, and the launch rebuild. The "official portfolio" text is removed.
- [ ] **Step 4: Run** `npm test && SHOW_ALL=1 npm run build`. Expected: PASS and "Built 8 apps".
- [ ] **Step 5: Commit** `feat(build): static pages per app, launch-time visibility, README`.

### Task 6: Verification and the antislop Delivery Gate

**Files:**
- Create: `anti-slop/delivery-001-2026-10-19.md`

- [ ] **Step 1: Run** `SHOW_ALL=1 npm run build && npm run preview`. Take Playwright screenshots of `/`, `/apps/kurek/`, `/apps/sonora/` and `/apps/f1-telemetry-pro/` at 1440, 768 and 390 px wide, and check each one for horizontal overflow and clipping.
- [ ] **Step 2: Click through every link on every page with Playwright** (icons, all apps, download, open, source, next, details toggle, 404), plus Tab through `/` and one app page. Expected: every link reaches its target, no console errors, and focus is visible on each element.
- [ ] **Step 3: Contrast-check** each text colour on `#050505` with `antislop-human`'s `contrast-check.py`. Expected: all of them are ≥4.5:1.
- [ ] **Step 4: Emulate reduced motion** (`--color-scheme` isn't needed; set `reducedMotion: 'reduce'` in a Playwright script). Expected: the lights are dark at load and the video is paused.
- [ ] **Step 5: Write the Delivery Gate PASS/FAIL report**, with evidence per line, into the file above. Fix any FAIL before continuing.
- [ ] **Step 6: Commit** `docs: delivery gate report`.

### Task 7: Preview, launch rebuild, handoff

- [ ] **Step 1:** `git push -u origin redesign/lights-out`. Get the preview URL from Vercel (`list_deployments` for project `prj_avsKTC0wU3lCdS3UZEfcZs4jT56d`) and confirm it shows 8 apps. The preview also needs `SHOW_ALL` to work through `VERCEL_ENV=preview`.
- [ ] **Step 2: Send Alan** the preview URL, the Delivery Gate report, and a GitHub description correction list (Kurek: remove "sub-second" and "~333MB RAM"). Wait for his quoted OK to merge.
- [ ] **Step 3: After the OK,** merge to `main` and check that production shows 6 apps.
- [ ] **Step 4: Set up the launch rebuilds.**
  - Create a Vercel deploy hook for `main` and store its URL in `~/.config/nodaysidle/deploy-nodaysidle-apps.url` with chmod 600.
  - Schedule the rebuilds: `systemd-run --user --on-calendar='2026-10-21 17:30:00' --unit=nds-apps-launch-ai-rules-builder sh -c 'curl -fsS -X POST "$(cat ~/.config/nodaysidle/deploy-nodaysidle-apps.url)"'`, and the same for `2026-10-24 17:30:00` as `f1-telemetry-pro`.
  - Check both with `systemctl --user list-timers`.
- [ ] **Step 5: Write a vault handoff** at `sessions/handoffs/2026-10-19-claude-nodaysidle-apps.md`: the new site, the launch rebuild timers, the manual redeploy fallback, and the open GitHub description fix. The catalog card update and the portfolio-nine removal wait until Alan confirms.
