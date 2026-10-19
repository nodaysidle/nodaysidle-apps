# NODAYSIDLE

The home of every NODAYSIDLE app: **https://nodaysidle-apps.vercel.app**

One page lists the apps, newest first, as greyscale icons that light up on hover. Each app has its own page with the pitch, what it does, the version, a button to the GitHub release page (or "Open the app" for web apps), checksums and a demo.

Static HTML, CSS and a few lines of JavaScript. No framework, no runtime dependencies, no analytics, no tracking.

## Commands

```bash
npm test          # unit tests (node --test)
npm run build     # writes dist/
npm run dev       # build and serve on http://localhost:4173
npm run check     # claim check, exits 1 on any warning
```

Node 22 or newer.

## Adding or updating an app

Everything comes from `data/apps.json`. Each app has:

- `kind`: `"download"` (GitHub release) or `"web"` (live site, `liveUrl`)
- `pitch`, `description`, `features`: the text shown on the site. This is checked text, written by hand, never copied from GitHub automatically.
- `githubDescription`: the repo's GitHub description as last checked
- `showFrom`: when the app appears on the site, as an ISO date with offset (`2026-10-21T17:30:00+02:00`)
- `icon`: `/assets/icons/<id>.webp`, trimmed to the same visible size as the others

## Launch day

Production builds only include apps whose `showFrom` time has passed. On launch day the site needs a rebuild at the launch time so the new app appears. On arch that runs from a one-off `systemd-run --user` timer that calls the Vercel deploy hook. If it didn't fire, redeploy `main` by hand in Vercel.

Preview deployments (`VERCEL_ENV=preview`) and local builds with `SHOW_ALL=1` include every app, so new pages can be reviewed before launch.

## Claim check

`data/flagged-claims.json` lists claims that were found to be unproven (for example Kurek's "sub-second"). The build compares each app's site text and its live GitHub description against that list, and against `githubDescription`. During `npm run build` it only warns, so a launch rebuild is never blocked. `npm run check` fails on the same warnings.

## Fonts and licences

Saira Condensed and IBM Plex Sans and Mono are self-hosted in `public/assets/fonts/` under the SIL Open Font License (licence files alongside). The site's Content Security Policy only allows files from its own origin.
