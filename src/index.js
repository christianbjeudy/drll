import { onRequest as applySecurityHeaders } from "./handlers/_middleware.js";
import { onRequestGet as getPublicSite } from "./handlers/api/site.js";
import { onRequestPost as login } from "./handlers/api/admin/login.js";
import { onRequestPost as logout } from "./handlers/api/admin/logout.js";
import { onRequestGet as getSession } from "./handlers/api/admin/session.js";
import {
  onRequestGet as listAdminEntries,
  onRequestPost as createAdminEntry,
} from "./handlers/api/admin/entries/index.js";
import {
  onRequestDelete as deleteAdminEntry,
  onRequestPut as updateAdminEntry,
} from "./handlers/api/admin/entries/[id].js";
import {
  onRequestGet as getAdminSettings,
  onRequestPut as updateAdminSettings,
} from "./handlers/api/admin/settings.js";
import { onRequestPost as uploadAdminMedia } from "./handlers/api/admin/upload.js";
import { onRequestGet as getMedia } from "./handlers/media/[key].js";
import { json, methodNotAllowed } from "./handlers/_lib/http.js";

function contextFor(request, env, executionContext, params = {}) {
  return {
    request,
    env,
    params,
    waitUntil: executionContext.waitUntil.bind(executionContext),
  };
}

function methodHandler(request, handlers) {
  const handler = handlers[request.method];
  return handler || (() => methodNotAllowed(Object.keys(handlers)));
}

async function dispatch(request, env, executionContext) {
  const { pathname } = new URL(request.url);
  const context = contextFor(request, env, executionContext);

  if (pathname === "/api/site") return methodHandler(request, { GET: getPublicSite })(context);
  if (pathname === "/api/admin/login") return methodHandler(request, { POST: login })(context);
  if (pathname === "/api/admin/logout") return methodHandler(request, { POST: logout })(context);
  if (pathname === "/api/admin/session") return methodHandler(request, { GET: getSession })(context);
  if (pathname === "/api/admin/entries") {
    return methodHandler(request, { GET: listAdminEntries, POST: createAdminEntry })(context);
  }
  if (pathname === "/api/admin/settings") {
    return methodHandler(request, { GET: getAdminSettings, PUT: updateAdminSettings })(context);
  }
  if (pathname === "/api/admin/upload") return methodHandler(request, { POST: uploadAdminMedia })(context);

  const entryMatch = pathname.match(/^\/api\/admin\/entries\/([^/]+)$/u);
  if (entryMatch) {
    const entryContext = contextFor(request, env, executionContext, { id: decodeURIComponent(entryMatch[1]) });
    return methodHandler(request, { PUT: updateAdminEntry, DELETE: deleteAdminEntry })(entryContext);
  }

  const mediaMatch = pathname.match(/^\/media\/([^/]+)$/u);
  if (mediaMatch) {
    const mediaContext = contextFor(request, env, executionContext, { key: decodeURIComponent(mediaMatch[1]) });
    return methodHandler(request, { GET: getMedia })(mediaContext);
  }

  if (pathname.startsWith("/api/") || pathname.startsWith("/media/")) {
    return json({ error: "Not found." }, 404);
  }
  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request, env, executionContext) {
    return applySecurityHeaders({
      request,
      env,
      next: () => dispatch(request, env, executionContext),
    });
  },
};
