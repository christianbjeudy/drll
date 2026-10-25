const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  });
}

export function methodNotAllowed(allowed) {
  return json(
    { error: "Method not allowed." },
    405,
    { allow: allowed.join(", ") },
  );
}

export async function readJson(request, maxBytes = 64 * 1024) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > maxBytes) {
    throw new HttpError(413, "Request body is too large.");
  }

  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > maxBytes) {
    throw new HttpError(413, "Request body is too large.");
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

export function assertSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return;

  const expected = new URL(request.url).origin;
  if (origin !== expected) {
    throw new HttpError(403, "Cross-origin request rejected.");
  }
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export function errorResponse(error, request) {
  if (error instanceof HttpError) {
    return json({ error: error.message }, error.status);
  }

  console.error(JSON.stringify({
    message: "Request failed",
    path: new URL(request.url).pathname,
    error: error instanceof Error ? error.message : String(error),
  }));
  return json({ error: "The request could not be completed." }, 500);
}

export function validateUrl(value, { allowRelative = true } = {}) {
  const input = String(value || "").trim();
  if (!input) return "";
  if (allowRelative && input.startsWith("/") && !input.startsWith("//")) return input;

  let url;
  try {
    url = new URL(input);
  } catch {
    throw new HttpError(400, "A URL field is invalid.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new HttpError(400, "Only HTTP and HTTPS URLs are allowed.");
  }
  return url.href;
}
