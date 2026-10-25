import test from "node:test";
import assert from "node:assert/strict";

import { createSessionCookie, isAdmin, passwordMatches } from "../src/handlers/_lib/auth.js";

const env = {
  ADMIN_PASSWORD: "a-long-test-password",
  SESSION_SECRET: "a-different-session-secret-that-is-long-enough",
};

test("compares administrator passwords", async () => {
  assert.equal(await passwordMatches("a-long-test-password", env), true);
  assert.equal(await passwordMatches("wrong", env), false);
});

test("creates and verifies a signed session cookie", async () => {
  const loginRequest = new Request("https://example.com/api/admin/login");
  const setCookie = await createSessionCookie(loginRequest, env);
  assert.match(setCookie, /HttpOnly/u);
  assert.match(setCookie, /Secure/u);
  assert.match(setCookie, /SameSite=Strict/u);

  const cookie = setCookie.split(";")[0];
  const request = new Request("https://example.com/api/admin/session", { headers: { cookie } });
  assert.equal(await isAdmin(request, env), true);
});

test("rejects a tampered session cookie", async () => {
  const setCookie = await createSessionCookie(new Request("https://example.com"), env);
  const cookie = `${setCookie.split(";")[0]}tampered`;
  const request = new Request("https://example.com/api/admin/session", { headers: { cookie } });
  assert.equal(await isAdmin(request, env), false);
});
