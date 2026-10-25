import { requireAdmin } from "../../_lib/auth.js";
import { assertSameOrigin, errorResponse, HttpError, json } from "../../_lib/http.js";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["application/pdf", "pdf"],
]);

export async function onRequestPost(context) {
  try {
    assertSameOrigin(context.request);
    await requireAdmin(context.request, context.env);

    const declaredLength = Number(context.request.headers.get("content-length") || 0);
    if (declaredLength > MAX_FILE_BYTES + 256 * 1024) {
      throw new HttpError(413, "Upload must be 10 MB or smaller.");
    }

    const form = await context.request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "Choose a file to upload.");
    if (file.size > MAX_FILE_BYTES) throw new HttpError(413, "Upload must be 10 MB or smaller.");

    const extension = ALLOWED_TYPES.get(file.type);
    if (!extension) throw new HttpError(400, "Only JPG, PNG, WebP, GIF, and PDF files are allowed.");

    const key = `${crypto.randomUUID()}.${extension}`;
    await context.env.MEDIA_BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: "public, max-age=31536000, immutable",
      },
      customMetadata: {
        originalName: file.name.slice(0, 200),
      },
    });

    return json({ url: `/media/${key}` }, 201);
  } catch (error) {
    return errorResponse(error, context.request);
  }
}
