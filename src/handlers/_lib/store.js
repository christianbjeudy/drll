const ENTRY_PREFIX = "content/entries/";
const INQUIRY_PREFIX = "content/inquiries/";
const WORKFLOW_PREFIX = "content/workflows/";
const SETTINGS_KEY = "content/settings.json";

export const EMPTY_SETTINGS = {
  about: "",
  hero_intro: "",
  credentials: "",
  professional_title: "",
  academic_appointment: "",
  team_role: "",
  clinical_focus: "",
  affiliations: "",
  training: "",
  languages: "",
  location: "",
  appointment_phone: "",
  portrait_url: "",
  hero_slideshow: "",
  email: "",
  appointment_url: "",
  one_brooklyn: "",
  zocdoc: "",
  healthgrades: "",
  doximity: "",
  webmd: "",
  npi: "",
  linkedin: "",
  instagram: "",
  tiktok: "",
  latest_social_platform: "",
  latest_social_published_at: "",
  latest_social_url: "",
  scholar: "",
  orcid: "",
  other_link: "",
};

function entryKey(id) {
  return `${ENTRY_PREFIX}${id}.json`;
}

async function readJsonObject(bucket, key) {
  const object = await bucket.get(key);
  if (!object) return null;
  return object.json();
}

async function writeJsonObject(bucket, key, value) {
  return bucket.put(key, JSON.stringify(value), {
    httpMetadata: {
      contentType: "application/json; charset=utf-8",
      cacheControl: "no-store",
    },
  });
}

export async function listEntries(bucket) {
  const keys = [];
  let cursor;
  do {
    const page = await bucket.list({ prefix: ENTRY_PREFIX, cursor });
    keys.push(...page.objects.map((object) => object.key));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);

  const entries = (await Promise.all(keys.map((key) => readJsonObject(bucket, key)))).filter(Boolean);
  return entries.sort((left, right) => {
    const leftDate = left.date || left.updated_at || "";
    const rightDate = right.date || right.updated_at || "";
    return rightDate.localeCompare(leftDate) || String(right.updated_at || "").localeCompare(String(left.updated_at || ""));
  });
}

export function getEntry(bucket, id) {
  return readJsonObject(bucket, entryKey(id));
}

export function saveEntry(bucket, entry) {
  return writeJsonObject(bucket, entryKey(entry.id), entry);
}

export function deleteEntry(bucket, id) {
  return bucket.delete(entryKey(id));
}

export function saveInquiry(bucket, inquiry) {
  return writeJsonObject(bucket, `${INQUIRY_PREFIX}${inquiry.id}.json`, inquiry);
}

export async function listInquiries(bucket) {
  const keys = [];
  let cursor;
  do {
    const page = await bucket.list({ prefix: INQUIRY_PREFIX, cursor });
    keys.push(...page.objects.map((object) => object.key));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  const inquiries = (await Promise.all(keys.map((key) => readJsonObject(bucket, key)))).filter(Boolean);
  return inquiries.sort((left, right) => String(right.created_at || "").localeCompare(String(left.created_at || "")));
}

function workflowKey(id) {
  return `${WORKFLOW_PREFIX}${id}.json`;
}

export async function listWorkflows(bucket) {
  const keys = [];
  let cursor;
  do {
    const page = await bucket.list({ prefix: WORKFLOW_PREFIX, cursor });
    keys.push(...page.objects.map((object) => object.key));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  const workflows = (await Promise.all(keys.map((key) => readJsonObject(bucket, key)))).filter(Boolean);
  return workflows.sort((left, right) => String(right.updated_at || right.created_at || "").localeCompare(String(left.updated_at || left.created_at || "")));
}

export function getWorkflow(bucket, id) {
  return readJsonObject(bucket, workflowKey(id));
}

export function saveWorkflow(bucket, workflow) {
  return writeJsonObject(bucket, workflowKey(workflow.id), workflow);
}

export function deleteWorkflow(bucket, id) {
  return bucket.delete(workflowKey(id));
}

export async function getSettings(bucket) {
  return { ...EMPTY_SETTINGS, ...((await readJsonObject(bucket, SETTINGS_KEY)) || {}) };
}

export function saveSettings(bucket, settings) {
  return writeJsonObject(bucket, SETTINGS_KEY, settings);
}
