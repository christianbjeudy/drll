import { requireAdmin } from "../../_lib/auth.js";
import { errorResponse, json } from "../../_lib/http.js";
import { listInquiries } from "../../_lib/store.js";

export async function onRequestGet(context) {
  try {
    await requireAdmin(context.request, context.env);
    return json({ inquiries: await listInquiries(context.env.MEDIA_BUCKET) });
  } catch (error) {
    return errorResponse(error, context.request);
  }
}
