import { isAdmin } from "../../_lib/auth.js";
import { errorResponse, json } from "../../_lib/http.js";

export async function onRequestGet(context) {
  try {
    const authenticated = await isAdmin(context.request, context.env);
    return json({ authenticated }, authenticated ? 200 : 401);
  } catch (error) {
    return errorResponse(error, context.request);
  }
}
