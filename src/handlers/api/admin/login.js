import { createSessionCookie, passwordMatches } from "../../_lib/auth.js";
import { assertSameOrigin, errorResponse, HttpError, json, readJson } from "../../_lib/http.js";

export async function onRequestPost(context) {
  try {
    assertSameOrigin(context.request);
    const body = await readJson(context.request, 8 * 1024);
    if (!(await passwordMatches(body.password, context.env))) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      throw new HttpError(401, "The password is incorrect.");
    }

    return json({ authenticated: true }, 200, {
      "set-cookie": await createSessionCookie(context.request, context.env),
    });
  } catch (error) {
    return errorResponse(error, context.request);
  }
}
