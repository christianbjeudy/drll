import { clearSessionCookie } from "../../_lib/auth.js";
import { assertSameOrigin, errorResponse, json } from "../../_lib/http.js";

export async function onRequestPost(context) {
  try {
    assertSameOrigin(context.request);
    return json({ authenticated: false }, 200, {
      "set-cookie": clearSessionCookie(context.request),
    });
  } catch (error) {
    return errorResponse(error, context.request);
  }
}
