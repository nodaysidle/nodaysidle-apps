# nodaysidle-apps redesign: "Lights out"

Date: 2026-10-19. Owner: Alan. Builder: Claude on arch.
Approved mockups: `.superpowers/brainstorm/374613-1792416745/content/homepage-v6.html` (homepage) and `app-page-v1.html` (app page), plus the icon sources in `.superpowers/brainstorm/374613-1792416745/icons-src/`.

## Intent

nodaysidle-apps.vercel.app becomes the only NODAYSIDLE site. portfolio-nine is retired after this ships, but only once Alan confirms the removal.

**Why:** visitors arrive from Kaly's X launch posts. Within one second they should feel that the apps are really well made, before reading anything. Alan's words: "the Max Verstappen effect". That means calm, precise and fast, with no decoration and nothing that shouts. The page should be enough of an experience that a visitor wants to open every app because of the site itself. It should also carry the studio's mindset: deterministic, long working days, everything optimised.

## Anti-goals (these count as failure even if everything works)

- The 2025 AI look: a dark page with a purple or blue glow gradient, emojis or sparkle icons.
- The 2026 AI look: warm paper background (around `#f7f4ee`), an orange accent (around `#ff5a36`), Instrument Serif headings. Alan's own levele and the old portfolio-nine both use this, and it must not come back.
- Any number, claim or text that isn't verifiable (antislop R-17, R-36). This includes claims the vault has already flagged, such as Kurek's "sub-second", "~333MB RAM", "24 tools" and "~0.8ms".
- A generic "Download" button. Alan: "it would look like scam."

## Design read

The page kind is an app showcase and download site, for developers and Linux and macOS power users coming from X. The visual language is "Lights out": black, white and one red. The dials are ENERGY 3 (the homepage headline is huge), RHYTHM 2 (the homepage and app pages share one system with a few deliberate breaks) and MOTION 1 (the start lights plus hover states only; nothing fades in on scroll).

### What Alan decided

- **Direction B "Lights out":** a black background, a huge condensed uppercase headline, and five red start lights at the top of the homepage that go out one by one.
- **Real app icons only, shown as a row like a Dock:** no title-card images. Every icon is greyscale at rest and gets its colour back on hover and on keyboard focus. Hover also lifts the icon slightly.
- **Apps at launch (8):** F1 Telemetry Pro, AI Rules Builder, Kurek, NODAYSIDLE Browser for Linux, nodaysrammar, Cascade, WhisperBar, Sonora. Newest first. Prompt Optimizer is not on the site yet.
- **The two new icons drawn in this session:** F1 Telemetry Pro (a speed trace over one lap, red at the car marker) and AI Rules Builder (three rule switches, amber on, grey off). Alan: "10/10". They replace the old indigo `>_` icon of AI Rules Builder on this site. Whether they also go into the apps' own repos is a separate decision.
- **Clicking an icon opens that app's own page** in the same theme, with the coloured icon, the short description, and a button that goes to the GitHub release page, so people read the release notes before downloading.
- **The button says exactly what it does:** "Download vX.Y.Z on GitHub". Web apps without a release get "Open the app", linking to the live URL.
- **Each app page plays its demo video** below the details.
- **Descriptions come from the site's own checked data, never from raw GitHub text.** The build compares that data with each repo's GitHub description and fails if they differ or if the GitHub text contains a flagged claim. Corrections to the GitHub descriptions themselves go to Alan as a list; the builder never edits them.

## Pages

### Homepage `/`

1. A small top bar with the NODAYSIDLE wordmark on the left. No navigation links (R-24: there are no other sections to link to).
2. Five red lights (22 px). On the first load they go out left to right over about 600 ms, then stay dark. With `prefers-reduced-motion`, they render already dark.
3. The headline in Saira Condensed 800, uppercase, about 112 px on desktop and scaled down on mobile: "Lights out." on the first line, then "<N> apps shipped." on the second. N is the number of apps visible at build time, written out as a word.
4. One line of subtext in IBM Plex Sans: "Native apps for macOS, Linux, Chrome and the web. Built by one studio, released on a schedule, one after another." The platform list is derived from the apps that are visible.
5. The icon row: one 96 px icon per app, the name in Saira Condensed 600 uppercase, and a mono line with the version and the date shipped. Web apps show "web · <date>" instead of a version. Each item is a link to that app's page. Layout: 8 columns on desktop, 4 on tablet, 3 or 4 on phones. Shrink the icons if the row gets crowded (Alan: "if it gets too crowded make the logos a bit smaller").
6. A minimal footer: GitHub org link and the site repo link. Not a four-column footer.

### App page `/apps/<id>/`

The structure follows `app-page-v1.html`:

- **Top bar:** "NODAYSIDLE · all apps" on the left, linking back home; five small dark lights in the middle; "position / total" on the right.
- **Header:** the coloured icon at 148 px next to the app name in Saira Condensed 800, about 104 px.
- **Text:** the pitch (one sentence, about 20 px), then the longer checked description, then a mono source line, for example "from github.com/nodaysidle/kureksistant".
- **Details row:** Platform, Version, Shipped, Size. Size is the size of the main download. Web apps show "Web" and the live URL host, and no size.
- **Actions:**
  - The primary button: "Download vX.Y.Z on GitHub", linking to the release page. Web apps get "Open the app" instead.
  - A text link "Source code" to the repo.
  - A mono note under the primary button: "Opens the GitHub release page: release notes, checksums and the download."
  - Existing per-platform notes, such as the macOS right-click-open note and the Linux AppImage note, stay as small notes on the page.
- **Demo video:** muted, looping, inline. It doesn't autoplay with `prefers-reduced-motion`; the poster image shows instead. F1 Telemetry Pro and AI Rules Builder need a clip or a real screenshot. F1 has `docs/screenshots/*.png` in its repo, and AI Rules Builder needs a capture from its live URL. These clips are separate tasks for REEL, and the builder may show a real screenshot until they exist.
- **"Next app":** at the bottom, the next app's name and its grey icon, which gets its colour back on hover. It wraps from the last app back to the first. This is what pulls visitors through every app.

## Visual system

- **Colours:**
  - Background `#050505` and text `#f2f2f2`.
  - Secondary text: `#c4c4c4` for longer text and `#9a9a9a` for mono labels, both checked to WCAG AA on `#050505`.
  - One accent, start-light red `#e10600`. It's used only for the lights, the primary button's hover state and focus details, never for body text.
- **Fonts:**
  - **Saira Condensed** for display: condensed, technical letters in the spirit of motorsport graphics.
  - **IBM Plex Sans** for text and **IBM Plex Mono** for numbers and labels: an engineering family with a matching mono.
  - All three are OFL and self-hosted as woff2 in `public/assets/`, because the CSP is `font-src 'self'`. No Google Fonts link, and the old Manrope and DM Mono files are removed.
- **Icons:** each icon is trimmed and normalised to the same visible size (about 492 px inside 512 px). The mockup step already did this with ImageMagick; the real build ships optimised PNGs or WebP at 2× display size.
- **Motion:** the lights go out once on the homepage, and icons change colour and lift on hover and focus in 120 ms. Nothing else moves.
- **Focus:** every link has a visible focus state: an underline on text, the coloured icon on icon links, and a 2 px outline on the button.

## Data

`data/apps.json` stays the single source. Each app gets:

- `kind`: `"download"` or `"web"`.
- `liveUrl`: web apps only.
- `icon`: path.
- `showFrom`: launch date and time, ISO, Europe/Ljubljana.
- `githubDescription`: the expected GitHub repo description, used by the build check.
- `description`: the checked longer text.

The existing fields (pitch, version, released, platforms, downloads, notes, media) stay as they are.

New entries:

- AI Rules Builder: repo `nodaysidle/markdown-helper`, live at https://markdown-helper.vercel.app, `showFrom` 2026-10-21 17:30.
- F1 Telemetry Pro: repo `nodaysidle/F1-nodaysidle`, live at https://f1-telemetry-pro.vercel.app, `showFrom` 2026-10-24 17:30.

Their pitch and description come from their READMEs and GitHub descriptions after the same check.

## Build

- It stays a dependency-free Node script (`scripts/build.mjs`) that outputs static `dist/`. The CSP and security headers in `vercel.json` stay unchanged.
- At build time:
  - The script fetches each repo's description from the GitHub API without a token, so failures are tolerated.
  - It compares each description with `githubDescription`, and with a deny list of flagged claims kept in the repo.
  - A mismatch or a flagged claim fails the build and prints the difference. If the network is down, it warns and continues, because the checked text is what ships either way.
- **Launch-day visibility (builder's call):**
  - The build includes only apps whose `showFrom` is in the past.
  - The app appears through a rebuild at launch time: a Vercel deploy hook called from the existing launch tasks (SHIP's 17:30 step, through `nds-tasks`).
  - There's no client-side hiding, so an unreleased app never sits in the HTML.
  - If the hook isn't set up in time, a manual redeploy at 17:30 is the fallback.
- The old `README` claims about the site (four apps, "official portfolio" text) are updated.

## Verification before Alan sees the preview

- `npm run build` passes.
- The pages run locally (`npm run preview`), and every link is clicked through: icons, all apps, next app, download and open buttons, source links.
- Screenshots at 1440, 768 and 390 px wide: no horizontal overflow, and tap targets of at least 44 px.
- Keyboard: Tab order follows the visual order, and focus is visible everywhere.
- `prefers-reduced-motion`: the lights are static and the videos don't autoplay.
- A contrast check on every text colour.
- No console errors.
- The antislop Delivery Gate report goes with the preview.

## Shipping

- The work happens on branch `redesign/lights-out` and is pushed to GitHub, which gives a Vercel preview URL. Pushing a non-main branch only creates a preview; the live site is untouched.
- Merging to `main` (production) needs Alan's quoted OK, per the vault rule for app pushes.
- **Target:** live before Wed 21 Oct 17:30, the AI Rules Builder launch.
- After it's live, the catalog card in the vault (`_system/templates/catalog/nodaysidle-apps.md`) is updated through a handoff, and portfolio-nine is removed after Alan confirms.

## Calls made after the builder check (Claude's calls, for Alan to check)

1. **The claim check never blocks a deploy.** Kurek's live GitHub description already contains the flagged "sub-second" and "~333MB RAM", so a hard failure would stop every build until GitHub is fixed, including the 17:30 launch builds.
   - `npm run build` only prints warnings for description mismatches and flagged claims.
   - A separate `npm run check` exits non-zero on them, for use by people and CI.
   - The site always ships the checked text from `apps.json`.
   - Alan gets a list of GitHub description corrections to approve; the builder never edits them.
2. **Preview builds show apps that haven't launched yet.** When `VERCEL_ENV=preview` (or `SHOW_ALL=1` locally), the `showFrom` filter is skipped, so Alan can review F1 Telemetry Pro and AI Rules Builder before launch. Production builds always filter. A preview URL is unlisted, and these launches are teased publicly on Tue 20 Oct anyway.
3. **The launch-time rebuild is set up on arch by the builder, not in the bots' flow.**
   - A Vercel deploy hook for `nodaysidle-apps` (production, `main`). Its URL is stored in `~/.config/nodaysidle/deploy-nodaysidle-apps.url` (chmod 600), never in a repo or the vault.
   - One `systemd-run --user --on-calendar` timer per launch time (21 Oct 17:30, 24 Oct 17:30) fires the hook. The timers are tested once with a dry run.
   - The builder writes a vault handoff, so EO and SHIP know the site rebuilds itself and that a manual redeploy is the fallback.
   - `nds-tasks` itself is unchanged.
4. **Versions are updated to the latest GitHub releases before the launch:** Cascade v3.1.1, Sonora v0.1.2, Browser for Linux v0.2.1. Version, date, download URLs, sizes and checksums are all read from the GitHub releases API. The "Download vX.Y.Z on GitHub" button must never point at an old release.
5. **Text for the two web apps:** the builder checks each claim against the repo and the live app, and cuts anything it can't confirm. F1's "4-driver lap overlays" and "60 FPS scrubbing" stay only if the code or the live app shows them. Alan reviews the result in the preview. For web apps, "Shipped" is the `showFrom` date and "Platform" is "Web".
6. **Features and checksums stay, kept quiet:**
   - A short "What it does" list (at most 5 checked items) under the description.
   - A collapsed "Verify the download" section with the SHA-256 per file (`<details>`, keyboard accessible).
   - Feature lines go through the same flagged-claims check. Kurek's "25 tools" and "~450MB peak RAM observed" are already recorded as checked in the site's history (PRs #6, #7), so they stay.
7. **One size per platform** in the details row (for example ".dmg 11.6 MB · AppImage 86.4 MB"), never a single number for an app that ships on two platforms.

## Left to the builder

- Exact breakpoints and font sizes on tablet and phone.
- Image formats and sizes.
- Wording of small labels.
- How the deny list is stored.
- Whether the lights also appear, statically, on app pages.
