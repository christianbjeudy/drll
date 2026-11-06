import { HttpError, validateUrl } from "./http.js";

export const ENTRY_TYPES = new Set(["publication", "event", "milestone", "news", "media"]);
export const ENTRY_STATUSES = new Set(["draft", "published"]);
export const INQUIRY_TYPES = new Set(["brand-partnerships", "speaking-engagements", "mentorship", "press", "sports-coverage"]);
export const WORKFLOW_TYPES = new Set(["brand-partnerships", "speaking-engagements", "sports-coverage", "mentorship", "press-public-engagement"]);
export const WORKFLOW_STATUSES = new Set(["lead", "reviewing", "awaiting-information", "confirmed", "completed", "declined"]);

function cleanText(value, maxLength, field) {
  const text = String(value || "").trim();
  if (text.length > maxLength) {
    throw new HttpError(400, `${field} is too long.`);
  }
  return text;
}

function normalizeUrlList(value, field) {
  const text = cleanText(value, 8000, field);
  if (!text) return "";
  return [...new Set(text.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean).map((url) => validateUrl(url)))].join("\n");
}

function normalizeSiteCopy(value) {
  if (!value) return {};
  const raw = typeof value === "string" ? value : JSON.stringify(value);
  let copy;
  try {
    copy = JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Site wording must be valid JSON.");
  }
  if (!copy || typeof copy !== "object" || Array.isArray(copy) || raw.length > 150_000) {
    throw new HttpError(400, "Site wording must be a JSON object under 150 KB.");
  }
  return copy;
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

export function normalizeWorkflow(input) {
  const type = cleanText(input.type, 60, "Workflow type");
  const status = cleanText(input.status || "lead", 40, "Workflow status");
  const title = cleanText(input.title, 250, "Workflow title");
  const contactName = cleanText(input.contact_name, 120, "Contact name");
  const contactEmail = cleanText(input.contact_email, 320, "Contact email");
  const eventDate = cleanText(input.event_date, 10, "Event date");

  if (!WORKFLOW_TYPES.has(type)) throw new HttpError(400, "Workflow type is invalid.");
  if (!WORKFLOW_STATUSES.has(status)) throw new HttpError(400, "Workflow status is invalid.");
  if (!title) throw new HttpError(400, "Workflow title is required.");
  if (!contactName) throw new HttpError(400, "Contact name is required.");
  if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(contactEmail)) {
    throw new HttpError(400, "A valid contact email is required.");
  }
  if (eventDate && !/^\d{4}-\d{2}-\d{2}$/u.test(eventDate)) {
    throw new HttpError(400, "Event date must use YYYY-MM-DD format.");
  }

  const rawRequirements = Array.isArray(input.requirements) ? input.requirements : [];
  if (rawRequirements.length > 30) throw new HttpError(400, "A workflow can have no more than 30 requirements.");
  const requirements = rawRequirements.map((requirement, index) => {
    const label = cleanText(requirement?.label, 200, `Requirement ${index + 1}`);
    if (!label) throw new HttpError(400, `Requirement ${index + 1} is empty.`);
    return { label, completed: Boolean(requirement?.completed) };
  });

  return {
    type,
    status,
    title,
    contact_name: contactName,
    contact_email: contactEmail,
    organization: cleanText(input.organization, 180, "Organization"),
    contact_phone: cleanText(input.contact_phone, 50, "Contact phone"),
    event_date: eventDate || null,
    source_inquiry_id: cleanText(input.source_inquiry_id, 100, "Source inquiry"),
    requirements,
    notes: cleanText(input.notes, 10_000, "Workflow notes"),
    email_subject: cleanText(input.email_subject, 300, "Email subject"),
    email_body: cleanText(input.email_body, 20_000, "Email body"),
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
    hero_slideshow: normalizeUrlList(input.hero_slideshow, "Hero slideshow"),
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
    site_copy: normalizeSiteCopy(input.site_copy),
  };
}

