import { requireAdmin } from "../../../_lib/auth.js";
import { normalizeWorkflow } from "../../../_lib/content.js";
import { assertSameOrigin, errorResponse, HttpError, json, readJson } from "../../../_lib/http.js";
import { deleteWorkflow, getWorkflow, saveWorkflow } from "../../../_lib/store.js";

export async function onRequestPut(context) {
  try {
    assertSameOrigin(context.request);
    await requireAdmin(context.request, context.env);
    const existing = await getWorkflow(context.env.MEDIA_BUCKET, context.params.id);
    if (!existing) throw new HttpError(404, "Workflow not found.");
    const workflow = normalizeWorkflow(await readJson(context.request, 40 * 1024));
    const saved = {
      id: existing.id,
      ...workflow,
      created_at: existing.created_at,
      updated_at: new Date().toISOString(),
    };
    await saveWorkflow(context.env.MEDIA_BUCKET, saved);
    return json({ workflow: saved });
  } catch (error) {
    return errorResponse(error, context.request);
  }
}

export async function onRequestDelete(context) {
  try {
    assertSameOrigin(context.request);
    await requireAdmin(context.request, context.env);
    const existing = await getWorkflow(context.env.MEDIA_BUCKET, context.params.id);
    if (!existing) throw new HttpError(404, "Workflow not found.");
    await deleteWorkflow(context.env.MEDIA_BUCKET, existing.id);
    return json({ deleted: true });
  } catch (error) {
    return errorResponse(error, context.request);
  }
}
