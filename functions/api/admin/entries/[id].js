import { requireAdmin } from "../../../_lib/auth.js";
import { normalizeEntry } from "../../../_lib/content.js";
import { assertSameOrigin, errorResponse, HttpError, json, readJson } from "../../../_lib/http.js";
import { deleteEntry, getEntry, saveEntry } from "../../../_lib/store.js";

export async function onRequestPut(context) {
  try {
    assertSameOrigin(context.request);
    await requireAdmin(context.request, context.env);
    const id = context.params.id;
    const existing = await getEntry(context.env.MEDIA_BUCKET, id);
    if (!existing) throw new HttpError(404, "Entry not found.");
    const entry = normalizeEntry(await readJson(context.request));
    const saved = {
      id,
      ...entry,
      date: entry.entry_date,
      entry_date: undefined,
      created_at: existing.created_at,
      updated_at: new Date().toISOString(),
    };
    delete saved.entry_date;
    await saveEntry(context.env.MEDIA_BUCKET, saved);
    return json({ entry: saved });
  } catch (error) {
    return errorResponse(error, context.request);
  }
}

export async function onRequestDelete(context) {
  try {
    assertSameOrigin(context.request);
    await requireAdmin(context.request, context.env);
    const existing = await getEntry(context.env.MEDIA_BUCKET, context.params.id);
    if (!existing) throw new HttpError(404, "Entry not found.");
    await deleteEntry(context.env.MEDIA_BUCKET, context.params.id);
    return json({ deleted: true });
  } catch (error) {
    return errorResponse(error, context.request);
  }
}
