import { normalizeInquiry } from "../_lib/content.js";
import { assertSameOrigin, errorResponse, HttpError, json, readJson } from "../_lib/http.js";
import { saveInquiry } from "../_lib/store.js";

export async function onRequestPost(context) {
  try {
    assertSameOrigin(context.request);
    const input = await readJson(context.request, 16 * 1024);

    if (String(input.website || "").trim()) {
      return json({ message: "Request received." }, 201);
    }

    const startedAt = Number(input.started_at);
    if (!Number.isFinite(startedAt) || Date.now() - startedAt < 1500) {
      throw new HttpError(400, "Please review the form and try again.");
    }

    const inquiry = {
      id: crypto.randomUUID(),
      ...normalizeInquiry(input),
      status: "new",
      created_at: new Date().toISOString(),
    };
    await saveInquiry(context.env.MEDIA_BUCKET, inquiry);
    return json({ message: "Thank you. Your request has been received." }, 201);
  } catch (error) {
    return errorResponse(error, context.request);
  }
}
