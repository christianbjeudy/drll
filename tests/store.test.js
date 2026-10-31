import test from "node:test";
import assert from "node:assert/strict";

import {
  deleteEntry,
  getEntry,
  getSettings,
  listInquiries,
  listEntries,
  saveEntry,
  saveInquiry,
  saveSettings,
} from "../src/handlers/_lib/store.js";

class MockBucket {
  constructor() {
    this.objects = new Map();
  }

  async get(key) {
    if (!this.objects.has(key)) return null;
    const value = this.objects.get(key);
    return { json: async () => structuredClone(value) };
  }

  async put(key, body) {
    this.objects.set(key, JSON.parse(body));
    return { key };
  }

  async delete(key) {
    this.objects.delete(key);
  }

  async list({ prefix }) {
    return {
      objects: [...this.objects.keys()].filter((key) => key.startsWith(prefix)).map((key) => ({ key })),
      truncated: false,
    };
  }
}

test("stores, sorts, reads, and deletes content entries", async () => {
  const bucket = new MockBucket();
  await saveEntry(bucket, { id: "older", title: "Older", date: "2025-01-01", updated_at: "2025-01-01" });
  await saveEntry(bucket, { id: "newer", title: "Newer", date: "2026-01-01", updated_at: "2026-01-01" });

  assert.deepEqual((await listEntries(bucket)).map((entry) => entry.id), ["newer", "older"]);
  assert.equal((await getEntry(bucket, "older")).title, "Older");
  await deleteEntry(bucket, "older");
  assert.equal(await getEntry(bucket, "older"), null);
});

test("returns default settings and persists updates", async () => {
  const bucket = new MockBucket();
  assert.equal((await getSettings(bucket)).about, "");
  assert.equal((await getSettings(bucket)).hero_slideshow, "");
  await saveSettings(bucket, { about: "Approved biography", email: "hello@example.com" });
  const settings = await getSettings(bucket);
  assert.equal(settings.about, "Approved biography");
  assert.equal(settings.email, "hello@example.com");
  assert.equal(settings.linkedin, "");
  assert.equal(settings.tiktok, "");
  assert.equal(settings.latest_social_url, "");
  assert.equal(settings.team_role, "");
  assert.equal(settings.appointment_url, "");
  assert.equal(settings.affiliations, "");
});

test("stores and sorts professional inquiries", async () => {
  const bucket = new MockBucket();
  await saveInquiry(bucket, { id: "older", name: "Older", created_at: "2026-10-30T12:00:00.000Z" });
  await saveInquiry(bucket, { id: "newer", name: "Newer", created_at: "2026-10-31T12:00:00.000Z" });
  assert.deepEqual((await listInquiries(bucket)).map((inquiry) => inquiry.id), ["newer", "older"]);
});
