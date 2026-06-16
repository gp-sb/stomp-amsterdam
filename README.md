# STOMP — Amsterdam

Proof-of-concept website for the STOMP club (Amsterdam-Noord). A static, no-build,
sound-first site with an animated frontend schedule and a lightweight admin dashboard.

> No watermark, no framework lock-in, no monthly cost beyond a domain. Deploys free on Vercel.

## Live

- Dev (from `dev`): https://stomp-amsterdam-git-dev-gp-sbs-projects.vercel.app
- Production (from `main`): https://stomp-amsterdam.vercel.app

The `dev` branch auto-deploys on every push; `main` is reserved for production.

## What's here

| File | Purpose |
| --- | --- |
| `index.html` | Public site — animated hero, scrolling marquee, filterable schedule |
| `admin.html` | Admin dashboard — add/edit/delete nights, export `schedule.json` |
| `data/schedule.json` | The published schedule (single source of truth) |
| `assets/css/` | `style.css` (site) + `admin.css` (dashboard) |
| `assets/js/` | `store.js` (data layer), `app.js` (frontend), `admin.js` (dashboard) |
| `vercel.json` | Static hosting config (clean URLs, cache headers) |

No build step. It's plain HTML/CSS/JS. GSAP is loaded from a CDN for animation.
To run locally, serve the folder with any static server, e.g.:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

(Open via a server, not `file://`, so `fetch('data/schedule.json')` works.)

## How content updates work

The frontend reads `data/schedule.json`. The admin dashboard lets you edit nights
visually; for this POC, edits are stored in the browser (`localStorage`) so they
appear instantly on this device. To **publish for everyone**:

1. In the admin dashboard, click **Export schedule.json**.
2. Commit the downloaded file to `data/schedule.json`.
3. Push — Vercel redeploys automatically and the new schedule is live in ~30s.

A Git-based CMS (Decap or Tina) can later automate steps 1–3 so editors never
touch git. No database is required.

> ⚠️ The admin access code in this POC is client-side only (`stomp`) and is **not**
> real security. Before going live, gate `admin.html` behind proper auth
> (e.g. Vercel password protection or an auth provider).

## Deploying on Vercel (free)

1. In Vercel, **Add New → Project** and import `gp-sb/stomp-amsterdam`.
2. Framework preset: **Other**. Build command: none. Output directory: `./` (root).
3. Deploy. Connect a custom domain later under **Settings → Domains**.

This branch (`dev`) is for collaboration; promote to `main`/production when ready.
