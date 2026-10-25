import { requireAdmin } from "../../_lib/auth.js";
import { normalizeSettings } from "../../_lib/content.js";
import { assertSameOrigin, errorResponse, json, readJson } from "../../_lib/http.js";
import { getSettings, saveSettings } from "../../_lib/store.js";

export async function onRequestGet(context) {
  try {
    await requireAdmin(context.request, context.env);
    return json({ settings: await getSettings(context.env.MEDIA_BUCKET) });
  } catch (error) {
    return errorResponse(error, context.request);
  }
}

export async function onRequestPut(context) {
  try {
    assertSameOrigin(context.request);
    await requireAdmin(context.request, context.env);
    const settings = normalizeSettings(await readJson(context.request));
    await saveSettings(context.env.MEDIA_BUCKET, settings);
    return json({ settings });
  } catch (error) {
    return errorResponse(error, context.request);
  }
}
