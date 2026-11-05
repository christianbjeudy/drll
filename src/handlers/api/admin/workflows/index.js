import { requireAdmin } from "../../../_lib/auth.js";
import { normalizeWorkflow } from "../../../_lib/content.js";
import { assertSameOrigin, errorResponse, json, readJson } from "../../../_lib/http.js";
import { listWorkflows, saveWorkflow } from "../../../_lib/store.js";

export async function onRequestGet(context) {
  try {
    await requireAdmin(context.request, context.env);
    return json({ workflows: await listWorkflows(context.env.MEDIA_BUCKET) });
  } catch (error) {
    return errorResponse(error, context.request);
  }
}

export async function onRequestPost(context) {
  try {
    assertSameOrigin(context.request);
    await requireAdmin(context.request, context.env);
    const workflow = normalizeWorkflow(await readJson(context.request, 40 * 1024));
    const now = new Date().toISOString();
    const saved = { id: crypto.randomUUID(), ...workflow, created_at: now, updated_at: now };
    await saveWorkflow(context.env.MEDIA_BUCKET, saved);
    return json({ workflow: saved }, 201);
  } catch (error) {
    return errorResponse(error, context.request);
  }
}
