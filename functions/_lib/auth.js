import { HttpError, json } from "./http.js";

const COOKIE_NAME = "drll_session";
const SESSION_SECONDS = 12 * 60 * 60;
const encoder = new TextEncoder();

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function fromBase64Url(value) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function digest(value) {
  return crypto.subtle.digest("SHA-256", encoder.encode(value));
}

async function fixedTimeEqual(left, right) {
  const [leftHash, rightHash] = await Promise.all([digest(left), digest(right)]);
  if (typeof crypto.subtle.timingSafeEqual === "function") {
    return crypto.subtle.timingSafeEqual(leftHash, rightHash);
  }

  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0;
}

async function signature(payload, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))));
}

function getSecret(env, name) {
  const value = String(env[name] || "");
  if (!value) throw new HttpError(503, "Administrator access is not configured.");
  return value;
}

function parseCookies(request) {
  const pairs = (request.headers.get("cookie") || "").split(";");
  return Object.fromEntries(pairs.map((pair) => {
    const separator = pair.indexOf("=");
    if (separator < 0) return [pair.trim(), ""];
    return [pair.slice(0, separator).trim(), pair.slice(separator + 1).trim()];
  }).filter(([key]) => key));
}

export async function passwordMatches(provided, env) {
  return fixedTimeEqual(String(provided || ""), getSecret(env, "ADMIN_PASSWORD"));
}

export async function createSessionCookie(request, env) {
  const secret = getSecret(env, "SESSION_SECRET");
  const payload = toBase64Url(encoder.encode(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
    nonce: crypto.randomUUID(),
  })));
  const token = `${payload}.${await signature(payload, secret)}`;
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; HttpOnly${secure}; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}`;
}

export function clearSessionCookie(request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=; HttpOnly${secure}; SameSite=Strict; Path=/; Max-Age=0`;
}

export async function isAdmin(request, env) {
  const token = parseCookies(request)[COOKIE_NAME];
  if (!token) return false;

  const separator = token.lastIndexOf(".");
  if (separator < 1) return false;
  const payload = token.slice(0, separator);
  const suppliedSignature = token.slice(separator + 1);

  try {
    const expectedSignature = await signature(payload, getSecret(env, "SESSION_SECRET"));
    if (!(await fixedTimeEqual(suppliedSignature, expectedSignature))) return false;
    const session = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    return Number.isFinite(session.exp) && session.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function requireAdmin(request, env) {
  if (!(await isAdmin(request, env))) {
    throw new HttpError(401, "Administrator sign-in is required.");
  }
}

export function unauthorized() {
  return json({ authenticated: false }, 401);
}
