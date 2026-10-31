import { HttpError, validateUrl } from "./http.js";

export const ENTRY_TYPES = new Set(["publication", "event", "milestone", "news", "media"]);
export const ENTRY_STATUSES = new Set(["draft", "published"]);
export const INQUIRY_TYPES = new Set(["mentorship", "press", "sports-coverage"]);

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

export function normalizeInquiry(input) {
  const requestType = cleanText(input.request_type, 40, "Request type");
  const name = cleanText(input.name, 120, "Name");
  const email = cleanText(input.email, 320, "Email");
  const message = cleanText(input.message, 2500, "Request details");

  if (!INQUIRY_TYPES.has(requestType)) throw new HttpError(400, "Request type is invalid.");
  if (!name) throw new HttpError(400, "Name is required.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    throw new HttpError(400, "A valid email address is required.");
  }
  if (!message) throw new HttpError(400, "Request details are required.");

  return {
    request_type: requestType,
    name,
    email,
    organization: cleanText(input.organization, 160, "Organization"),
    message,
  };
}

export function normalizeSettings(input) {
  const email = cleanText(input.email, 320, "Email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    throw new HttpError(400, "Contact email is invalid.");
  }
  const latestSocialPublishedAt = cleanText(input.latest_social_published_at, 40, "Latest social post date");
  if (latestSocialPublishedAt && Number.isNaN(Date.parse(latestSocialPublishedAt))) {
    throw new HttpError(400, "Latest social post date is invalid.");
  }

  return {
    about: cleanText(input.about, 4000, "Biography"),
    hero_intro: cleanText(input.hero_intro, 1000, "Hero introduction"),
    credentials: cleanText(input.credentials, 120, "Credentials"),
    professional_title: cleanText(input.professional_title, 250, "Professional title"),
    academic_appointment: cleanText(input.academic_appointment, 500, "Academic appointment"),
    team_role: cleanText(input.team_role, 500, "National team role"),
    clinical_focus: cleanText(input.clinical_focus, 2000, "Clinical focus"),
    affiliations: cleanText(input.affiliations, 4000, "Affiliations"),
    training: cleanText(input.training, 4000, "Education and training"),
    languages: cleanText(input.languages, 500, "Languages"),
    location: cleanText(input.location, 500, "Location"),
    appointment_phone: cleanText(input.appointment_phone, 50, "Appointment phone"),
    portrait_url: validateUrl(input.portrait_url),
    email,
    appointment_url: validateUrl(input.appointment_url, { allowRelative: false }),
    one_brooklyn: validateUrl(input.one_brooklyn, { allowRelative: false }),
    zocdoc: validateUrl(input.zocdoc, { allowRelative: false }),
    healthgrades: validateUrl(input.healthgrades, { allowRelative: false }),
    doximity: validateUrl(input.doximity, { allowRelative: false }),
    webmd: validateUrl(input.webmd, { allowRelative: false }),
    npi: validateUrl(input.npi, { allowRelative: false }),
    linkedin: validateUrl(input.linkedin, { allowRelative: false }),
    instagram: validateUrl(input.instagram, { allowRelative: false }),
    tiktok: validateUrl(input.tiktok, { allowRelative: false }),
    latest_social_platform: cleanText(input.latest_social_platform, 40, "Latest social platform"),
    latest_social_published_at: latestSocialPublishedAt ? new Date(latestSocialPublishedAt).toISOString() : "",
    latest_social_url: validateUrl(input.latest_social_url, { allowRelative: false }),
    scholar: validateUrl(input.scholar, { allowRelative: false }),
    orcid: validateUrl(input.orcid, { allowRelative: false }),
    other_link: validateUrl(input.other_link, { allowRelative: false }),
  };
}

