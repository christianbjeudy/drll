import { requireAdmin } from "../../../_lib/auth.js";
import { normalizeEntry } from "../../../_lib/content.js";
import { assertSameOrigin, errorResponse, json, readJson } from "../../../_lib/http.js";
import { listEntries, saveEntry } from "../../../_lib/store.js";

export async function onRequestGet(context) {
  try {
    await requireAdmin(context.request, context.env);
    return json({ entries: await listEntries(context.env.MEDIA_BUCKET) });
  } catch (error) {
    return errorResponse(error, context.request);
  }
}

export async function onRequestPost(context) {
  try {
    assertSameOrigin(context.request);
    await requireAdmin(context.request, context.env);
    const entry = normalizeEntry(await readJson(context.request));
    const now = new Date().toISOString();
    const saved = {
      id: crypto.randomUUID(),
      ...entry,
      date: entry.entry_date,
      entry_date: undefined,
      created_at: now,
      updated_at: now,
    };
    delete saved.entry_date;
    await saveEntry(context.env.MEDIA_BUCKET, saved);
    return json({ entry: saved }, 201);
  } catch (error) {
    return errorResponse(error, context.request);
  }
}
