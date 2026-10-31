# Dr. Laurenie Louissaint: Professional Website

The professional website and academic portfolio of Dr. Laurenie Louissaint, MD, MS, FAAPMR, CAQSM. The site includes a physician biography, verified credentials and affiliations, patient appointment resources, publications, career milestones, service, news, media, search, and a private content dashboard.

## Architecture

- Static HTML, CSS, and browser JavaScript on Cloudflare Workers Static Assets
- A Cloudflare Worker for the public content API and private admin API
- Cloudflare R2 for content records, site settings, images, and PDF uploads
- Secret-backed, signed, HTTP-only administrator sessions

Verified public-source profile data and starter entries are tracked in `content/verified-profile.json`. Live content remains editable through `/admin.html` and is stored in R2.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.dev.vars.example` to `.dev.vars` and replace both example secrets.
3. Start the Cloudflare development server with `npm run dev`.
4. Open the local URL shown by Wrangler. The dashboard is at `/admin.html`.

Run `npm run check` before committing changes.

To load or refresh the verified starter profile in a local or production environment:

```text
npm run content:publish -- <site-origin> --credentials-file <path>
```

The publisher updates entries by type and title, so it can be run again without creating duplicates. Leave unverified directory fields, including Zocdoc, blank until an exact profile is confirmed.

## Cloudflare setup

The production Worker requires:

- An R2 bucket named `drll-media`, bound as `MEDIA_BUCKET`
- Encrypted secrets named `ADMIN_PASSWORD` and `SESSION_SECRET`

The existing `drll` application is connected to `christianbjeudy/drll`. It deploys `main` with `npx wrangler deploy` and serves the static assets and CMS API together.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full production checklist.

## Content workflow

Dashboard entries begin as drafts. Only entries marked **Published** appear on the public website. The Professional Profile view controls biography, credentials, the national-team role, clinical focus, affiliations, training, languages, appointment information, portrait, contact information, and verified directory and social links.

## Credit

Made by [christianbjeudy.com](https://christianbjeudy.com).
