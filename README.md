# Dr. Laurenie Louissaint — Professional Website

The professional website and living academic archive of Dr. Laurenie Louissaint. The site includes a biography, journey, publications library, events, news, media archive, search, and a private content dashboard.

## Architecture

- Static HTML, CSS, and browser JavaScript on Cloudflare Workers Static Assets
- A Cloudflare Worker for the public content API and private admin API
- Cloudflare R2 for content records, site settings, images, and PDF uploads
- Secret-backed, signed, HTTP-only administrator sessions

No biographical facts, publications, or events are hard-coded. Approved content is entered through `/admin.html` and published from the dashboard.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.dev.vars.example` to `.dev.vars` and replace both example secrets.
3. Start the Cloudflare development server with `npm run dev`.
4. Open the local URL shown by Wrangler. The dashboard is at `/admin.html`.

Run `npm run check` before committing changes.

## Cloudflare setup

The production Worker requires:

- An R2 bucket named `drll-media`, bound as `MEDIA_BUCKET`
- Encrypted secrets named `ADMIN_PASSWORD` and `SESSION_SECRET`

The existing `drll` application is connected to `christianbjeudy/drll`. It deploys `main` with `npx wrangler deploy` and serves the static assets and CMS API together.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full production checklist.

## Content workflow

Dashboard entries begin as drafts. Only entries marked **Published** appear on the public website. Site settings control the approved biography introduction, portrait, contact email, and professional profile links.

## Credit

Made by [christianbjeudy.com](https://christianbjeudy.com).
