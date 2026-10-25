import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const baseUrl = process.argv[2] || "http://localhost:8788";
let password = process.argv[3];
if (password === "--credentials-file") {
  const contents = readFileSync(process.argv[4], "utf8");
  password = (
    contents.match(/^Password: (.+)$/mu)?.[1]
    || contents.match(/^ADMIN_PASSWORD=(.+)$/mu)?.[1]?.replace(/^['"]|['"]$/gu, "")
  );
}
if (!password) throw new Error("Pass the test password or --credentials-file <path> after the URL.");

let cookie = "";
let createdEntryId = "";
let uploadedUrl = "";
let assertions = 0;
let originalSettings = null;

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (cookie) headers.set("cookie", cookie);
  if (options.body && !(options.body instanceof FormData) && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return fetch(`${baseUrl}${path}`, { ...options, headers });
}

function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

try {
  const home = await request("/");
  check(home.status === 200, "Home page should load.");
  check((await home.text()).includes("Made by <strong>christianbjeudy.com</strong>"), "Footer credit should be present.");
  check(home.headers.get("content-security-policy")?.includes("default-src 'self'"), "Security headers should be present.");

  for (const path of ["/admin.html", "/assets/styles.css", "/assets/admin.css", "/assets/site.js", "/assets/admin.js"]) {
    const response = await request(path);
    check(response.status === 200, `${path} should load.`);
  }

  const publicEmpty = await request("/api/site");
  check(publicEmpty.status === 200, "Public content API should load.");

  const unauthorized = await request("/api/admin/session");
  check(unauthorized.status === 401, "Anonymous admin session should be rejected.");

  const wrongLogin = await request("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ password: "incorrect" }),
  });
  check(wrongLogin.status === 401, "Incorrect password should be rejected.");

  const login = await request("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  check(login.status === 200, "Correct password should sign in.");
  cookie = login.headers.get("set-cookie")?.split(";")[0] || "";
  check(cookie.startsWith("drll_session="), "Login should issue a session cookie.");

  const authenticated = await request("/api/admin/session");
  check(authenticated.status === 200, "Authenticated session should be accepted.");

  const originalSettingsResponse = await request("/api/admin/settings");
  check(originalSettingsResponse.status === 200, "Admin settings should load.");
  originalSettings = (await originalSettingsResponse.json()).settings;

  const entryResponse = await request("/api/admin/entries", {
    method: "POST",
    body: JSON.stringify({
      type: "publication",
      status: "published",
      title: "Temporary end-to-end test entry",
      category: "Testing",
      date: "2026-10-25",
      summary: "Created automatically and removed after the test.",
      body: "This record verifies the full content workflow.",
      image_url: "",
      external_url: "https://example.com/test",
    }),
  });
  check(entryResponse.status === 201, "Admin should create an entry.");
  createdEntryId = (await entryResponse.json()).entry.id;

  const publicWithEntry = await request("/api/site");
  const publicPayload = await publicWithEntry.json();
  check(publicPayload.entries.some((entry) => entry.id === createdEntryId), "Published entry should appear publicly.");

  const update = await request(`/api/admin/entries/${createdEntryId}`, {
    method: "PUT",
    body: JSON.stringify({
      type: "publication",
      status: "draft",
      title: "Temporary end-to-end test entry",
      category: "Testing",
      date: "2026-10-25",
      summary: "Created automatically and removed after the test.",
      body: "This record verifies the full content workflow.",
      image_url: "",
      external_url: "https://example.com/test",
    }),
  });
  check(update.status === 200, "Admin should update an entry.");

  const publicAfterDraft = await request("/api/site");
  const draftPayload = await publicAfterDraft.json();
  check(!draftPayload.entries.some((entry) => entry.id === createdEntryId), "Draft entry should be hidden publicly.");

  const settings = {
    about: "Temporary test biography.",
    portrait_url: "",
    email: "test@example.com",
    linkedin: "https://www.linkedin.com/in/example",
    scholar: "",
    orcid: "",
    other_link: "",
  };
  const saveSettings = await request("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
  check(saveSettings.status === 200, "Admin should save site settings.");

  const publicSettings = await request("/api/site");
  check((await publicSettings.json()).settings.about === settings.about, "Public API should return saved settings.");

  const uploadForm = new FormData();
  uploadForm.append("file", new Blob(["%PDF-1.4\n%%EOF\n"], { type: "application/pdf" }), "verification.pdf");
  const upload = await request("/api/admin/upload", { method: "POST", body: uploadForm });
  check(upload.status === 201, "Admin should upload an allowed file.");
  uploadedUrl = (await upload.json()).url;
  const media = await request(uploadedUrl);
  check(media.status === 200, "Uploaded media should be retrievable.");
  check(media.headers.get("content-type") === "application/pdf", "Uploaded media should preserve its content type.");

  const deleted = await request(`/api/admin/entries/${createdEntryId}`, { method: "DELETE" });
  check(deleted.status === 200, "Admin should delete an entry.");
  createdEntryId = "";

  const resetSettings = await request("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify(originalSettings),
  });
  check(resetSettings.status === 200, "Original settings should be restored.");

  const logout = await request("/api/admin/logout", { method: "POST", body: "{}" });
  check(logout.status === 200, "Admin should log out.");
  cookie = "";

  console.log(`${new URL(baseUrl).hostname} end-to-end checks passed (${assertions} assertions).`);
  console.log(`Temporary uploaded fixture: ${uploadedUrl}`);
} finally {
  if (createdEntryId && cookie) {
    await request(`/api/admin/entries/${createdEntryId}`, { method: "DELETE" }).catch(() => {});
  }
}
