import { HttpError, validateUrl } from "./http.js";

export const ENTRY_TYPES = new Set(["publication", "event", "milestone", "news", "media"]);
export const ENTRY_STATUSES = new Set(["draft", "published"]);

function cleanText(value, maxLength, field) {
  const text = String(value || "").trim();
  if (text.length > maxLength) {
    throw new HttpError(400, `${field} is too long.`);
  }
  return text;
}

export function normalizeEntry(input) {
  const type = cleanText(input.type, 40, "Content type");
  const status = cleanText(input.status || "draft", 20, "Status");
  const title = cleanText(input.title, 250, "Title");

  if (!ENTRY_TYPES.has(type)) throw new HttpError(400, "Content type is invalid.");
  if (!ENTRY_STATUSES.has(status)) throw new HttpError(400, "Visibility is invalid.");
  if (!title) throw new HttpError(400, "Title is required.");

  let entryDate = cleanText(input.date || input.entry_date, 10, "Date") || null;
  if (entryDate && !/^\d{4}-\d{2}-\d{2}$/u.test(entryDate)) {
    throw new HttpError(400, "Date must use YYYY-MM-DD format.");
  }

  return {
    type,
    status,
    title,
    category: cleanText(input.category, 100, "Category"),
    entry_date: entryDate,
    summary: cleanText(input.summary, 1000, "Summary"),
    body: cleanText(input.body, 50_000, "Content"),
    image_url: validateUrl(input.image_url),
    external_url: validateUrl(input.external_url, { allowRelative: false }),
  };
}

export function normalizeSettings(input) {
  const email = cleanText(input.email, 320, "Email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    throw new HttpError(400, "Contact email is invalid.");
  }

  return {
    about: cleanText(input.about, 4000, "Biography"),
    portrait_url: validateUrl(input.portrait_url),
    email,
    linkedin: validateUrl(input.linkedin, { allowRelative: false }),
    scholar: validateUrl(input.scholar, { allowRelative: false }),
    orcid: validateUrl(input.orcid, { allowRelative: false }),
    other_link: validateUrl(input.other_link, { allowRelative: false }),
  };
}

