# Production deployment checklist

## 1. Create the Cloudflare resource

Create an R2 bucket named `drll-media` and bind it to the Worker as `MEDIA_BUCKET`. The bucket stores both small JSON content records and uploaded media. R2 provides strong consistency for these reads and writes, which suits this single-editor CMS without requiring a separate database.

- R2: `MEDIA_BUCKET`

## 2. Configure secrets

Add these encrypted production secrets to the Worker:

- `ADMIN_PASSWORD`: a unique administrator password
- `SESSION_SECRET`: a separate random value of at least 32 characters

Never store either value in Git, `wrangler.jsonc`, screenshots, logs, or support messages.

## 3. GitHub deployment

The `drll` Worker is connected to `christianbjeudy/drll` with:

- Production branch: `main`
- Build command: leave blank
- Root directory: repository root
- Deploy command: `npx wrangler deploy`

Confirm that production and preview environments both have their intended bindings and secrets. A binding or secret configured in one environment is not automatically proof that the other environment has it. Workers Static Assets serves `index.html`, `admin.html`, and `assets/`; the Worker handles `/api/*` and `/media/*`.

## 4. Configure the domain

Add the intended hostname under the Worker's **Domains** settings. Verify that the hostname appears as active and that Cloudflare has issued an edge certificate. Decide whether the apex domain or `www` hostname is canonical, and redirect the other hostname to it.

## 5. Verify production

Publish the verified starter profile after the first deployment or whenever its checked-in data is revised:

```text
npm run content:publish -- https://drlouissaint.com --credentials-file <protected-credentials-file>
```

- Load the home page at desktop and mobile widths.
- Confirm every navigation link reaches the correct section.
- Confirm search opens, filters entries, and opens detail dialogs.
- Sign in to `/admin.html`, then create, edit, publish, draft, search, and delete a temporary entry.
- Upload an image and a PDF smaller than 10 MB; verify the returned media links.
- Update site settings and verify the public site reflects the change.
- Confirm unauthenticated admin API requests return `401`.
- Confirm incorrect passwords do not create a session.
- Confirm the footer says **Made by christianbjeudy.com**.
- Confirm the Worker domain and custom domain use HTTPS without certificate warnings.

Remove any temporary verification content after testing.
