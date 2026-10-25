# Production deployment checklist

## 1. Create the Cloudflare resource

Create an R2 bucket named `drll-media` and bind it to the Pages project as `MEDIA_BUCKET`. The bucket stores both small JSON content records and uploaded media. R2 provides strong consistency for these reads and writes, which suits this single-editor CMS without requiring a separate database.

- R2: `MEDIA_BUCKET`

## 2. Configure secrets

Add these encrypted production secrets to the Pages project:

- `ADMIN_PASSWORD`: a unique administrator password
- `SESSION_SECRET`: a separate random value of at least 32 characters

Never store either value in Git, `wrangler.jsonc`, screenshots, logs, or support messages.

## 3. Connect GitHub to Pages

Import `christianbjeudy/drll` as a Cloudflare Pages project with:

- Production branch: `main`
- Build command: leave blank
- Build output directory: `.`
- Root directory: repository root

Confirm that production and preview environments both have their intended bindings and secrets. A binding or secret configured in one environment is not automatically proof that the other environment has it.

## 4. Configure the domain

Add the intended hostname under the Pages project's **Custom domains** settings. Verify that the hostname appears as active and that Cloudflare has issued an edge certificate. Decide whether the apex domain or `www` hostname is canonical, and redirect the other hostname to it.

## 5. Verify production

- Load the home page at desktop and mobile widths.
- Confirm every navigation link reaches the correct section.
- Confirm search opens, filters entries, and opens detail dialogs.
- Sign in to `/admin.html`, then create, edit, publish, draft, search, and delete a temporary entry.
- Upload an image and a PDF smaller than 10 MB; verify the returned media links.
- Update site settings and verify the public site reflects the change.
- Confirm unauthenticated admin API requests return `401`.
- Confirm incorrect passwords do not create a session.
- Confirm the footer says **Made by christianbjeudy.com**.
- Confirm both the `pages.dev` address and custom domain use HTTPS without certificate warnings.

Remove any temporary verification content after testing.
