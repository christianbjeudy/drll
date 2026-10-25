import { errorResponse, json } from "../_lib/http.js";
import { getSettings, listEntries } from "../_lib/store.js";

export async function onRequestGet(context) {
  try {
    const [entries, settings] = await Promise.all([
      listEntries(context.env.MEDIA_BUCKET),
      getSettings(context.env.MEDIA_BUCKET),
    ]);

    return json({
      settings,
      entries: entries.filter((entry) => entry.status === "published"),
    }, 200, {
      "cache-control": "public, max-age=60, stale-while-revalidate=300",
    });
  } catch (error) {
    return errorResponse(error, context.request);
  }
}
