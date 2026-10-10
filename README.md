# nodaysidle-apps

Static showcase and download site for NODAYSIDLE desktop apps, a Chrome extension, and Kurek:

1. **Cascade** — idea → five agent-ready planning documents  
2. **Sonora** — native music player (Spotify, YouTube Music, local files)  
3. **WhisperBar** — macOS menu bar dictation (Apple Silicon)  
4. **NODAYSIDLE Browser for Linux** — quiet native WebKitGTK browser  
5. **nodaysrammar** — private on-device grammar & spell checker (Chrome / Chromium MV3)  
6. **Kurek** — voice assistant daemon for Arch Linux / Hyprland (CC BY-NC 4.0)  

Downloads link straight to GitHub Release assets. Checksums are copied from release notes / READMEs / GitHub asset digests — never invented.

Live portfolio (related): [nodaysidle-portfolio-nine.vercel.app](https://nodaysidle-portfolio-nine.vercel.app) · [github.com/nodaysidle](https://github.com/nodaysidle)

## Stack

Plain HTML/CSS/JS. Node 22 build script writes `dist/` from `src/index.html` + `data/apps.json` + `public/`. No framework. Self-hosted Manrope + DM Mono (no Google Fonts CDN).

## Requirements

- Node.js 22+

## Scripts

```bash
npm run build     # write dist/
npm run dev       # rebuild, then serve dist/ at http://127.0.0.1:4173
npm run preview   # serve existing dist/ (no rebuild)
```

## Deploy (Vercel)

`vercel.json` sets `buildCommand` to `npm run build` and `outputDirectory` to `dist`. Create a new Vercel project pointed at this repo; no env vars required.

## Project layout

```
data/apps.json      # release metadata, asset URLs, checksums
src/index.html      # page template
scripts/build.mjs   # build → dist/
scripts/serve.mjs   # local static server
public/             # CSS, JS, fonts, demo media (copied into dist/)
```

## Updating a release

1. Edit `data/apps.json` with the new tag, dates, asset URLs, sizes, and SHA-256 values from the live GitHub release.  
2. Refresh demo media under `public/assets/media/` if the GIF changed.  
3. Run `npm run build` and spot-check download links.

## Licence

Site code in this repository is MIT unless noted otherwise. Individual apps keep their own licences (see each card).
