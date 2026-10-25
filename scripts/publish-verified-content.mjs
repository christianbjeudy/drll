import { readFileSync } from "node:fs";

const baseUrl = new URL(process.argv[2] || "http://localhost:8788").origin;
const credentialFlag = process.argv.indexOf("--credentials-file");
if (credentialFlag < 0 || !process.argv[credentialFlag + 1]) {
  throw new Error("Use --credentials-file <path> to provide the administrator password.");
}

const credentialText = readFileSync(process.argv[credentialFlag + 1], "utf8");
const password = (
  credentialText.match(/^Password: (.+)$/mu)?.[1]
  || credentialText.match(/^ADMIN_PASSWORD=(.+)$/mu)?.[1]?.replace(/^['"]|['"]$/gu, "")
);
if (!password) throw new Error("The credentials file does not contain a Password line.");

const profile = JSON.parse(readFileSync(new URL("../content/verified-profile.json", import.meta.url), "utf8"));
let cookie = "";

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("accept", "application/json");
  headers.set("origin", baseUrl);
  if (cookie) headers.set("cookie", cookie);
  if (options.body) headers.set("content-type", "application/json");
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `${path} failed with ${response.status}.`);
  return { response, payload };
}

const login = await request("/api/admin/login", {
  method: "POST",
  body: JSON.stringify({ password }),
});
cookie = login.response.headers.get("set-cookie")?.split(";")[0] || "";
if (!cookie) throw new Error("The login response did not include a session cookie.");

await request("/api/admin/settings", {
  method: "PUT",
  body: JSON.stringify(profile.settings),
});

const current = (await request("/api/admin/entries")).payload.entries || [];
let created = 0;
let updated = 0;
for (const entry of profile.entries) {
  const existing = current.find((item) => item.title === entry.title && item.type === entry.type);
  if (existing) {
    await request(`/api/admin/entries/${encodeURIComponent(existing.id)}`, {
      method: "PUT",
      body: JSON.stringify(entry),
    });
    updated += 1;
  } else {
    await request("/api/admin/entries", {
      method: "POST",
      body: JSON.stringify(entry),
    });
    created += 1;
  }
}

await request("/api/admin/logout", { method: "POST", body: "{}" });
console.log(`Published verified profile settings and ${profile.entries.length} entries to ${baseUrl} (${created} created, ${updated} updated).`);
