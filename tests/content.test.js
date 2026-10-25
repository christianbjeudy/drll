import test from "node:test";
import assert from "node:assert/strict";

import { normalizeEntry, normalizeSettings } from "../src/handlers/_lib/content.js";

test("normalizes a valid content entry", () => {
  const entry = normalizeEntry({
    type: "publication",
    status: "published",
    title: "  A Sample Title  ",
    category: "Research",
    date: "2026-10-25",
    summary: "Summary",
    external_url: "https://example.com/article",
  });
  assert.equal(entry.title, "A Sample Title");
  assert.equal(entry.entry_date, "2026-10-25");
  assert.equal(entry.external_url, "https://example.com/article");
});

test("rejects unsupported entry types and unsafe URLs", () => {
  assert.throws(() => normalizeEntry({ type: "page", title: "Bad" }), /Content type/u);
  assert.throws(() => normalizeEntry({ type: "news", title: "Bad", external_url: "javascript:alert(1)" }), /HTTP and HTTPS/u);
});

test("validates settings email and preserves safe relative portrait paths", () => {
  const settings = normalizeSettings({
    email: "hello@example.com",
    portrait_url: "/media/example.jpg",
    professional_title: "Assistant Professor",
    appointment_url: "https://example.com/appointments",
    affiliations: "Example University\nExample Hospital",
  });
  assert.equal(settings.email, "hello@example.com");
  assert.equal(settings.portrait_url, "/media/example.jpg");
  assert.equal(settings.professional_title, "Assistant Professor");
  assert.equal(settings.appointment_url, "https://example.com/appointments");
  assert.match(settings.affiliations, /Example Hospital/u);
  assert.throws(() => normalizeSettings({ email: "not-an-email" }), /email is invalid/u);
  assert.throws(() => normalizeSettings({ zocdoc: "javascript:alert(1)" }), /HTTP and HTTPS/u);
});

