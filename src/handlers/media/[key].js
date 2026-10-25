export async function onRequestGet(context) {
  const key = String(context.params.key || "");
  if (!/^[0-9a-f-]{36}\.(?:jpg|png|webp|gif|pdf)$/u.test(key)) {
    return new Response("Not found", { status: 404 });
  }

  const object = await context.env.MEDIA_BUCKET.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("x-content-type-options", "nosniff");
  return new Response(object.body, { headers });
}
