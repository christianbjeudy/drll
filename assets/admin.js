(() => {
  "use strict";

  const state = {
    entries: [],
    inquiries: [],
    workflows: [],
    settings: {},
    view: "all",
    editingId: null,
    editingWorkflowId: null,
    emailDraftTouched: false,
    slideshowObjectUrls: [],
  };

  const elements = {};
  let copyCatalogPromise = null;
  const defaultSiteCopy = {
    hero_heading: "Movement.\nRecovery.\nPerformance.",
    hero_intro: "Double board-certified in Physical Medicine & Rehabilitation and Sports Medicine.",
    about_label: "01 / ABOUT",
    about_heading: "Care informed by movement & purpose.",
    about_intro: "Professional biography introduction.",
    expertise_label: "AREAS OF EXPERTISE",
    expertise_heading: "Specialized care for active lives.",
    expertise_intro: "Professional expertise reflected through Dr. Louissaint’s academic and clinical experience.",
    profile_label: "PROFESSIONAL PROFILE",
    profile_heading: "Credentials & Affiliations.",
    highlights_label: "PROFESSIONAL HIGHLIGHTS",
    highlights_heading: "Life in Motion.",
    appointments_label: "REQUESTS & PROFESSIONAL CONTACT",
    appointments_heading: "Connect with Dr. Louissaint.",
    appointments_intro: "Choose the request that best fits your needs.",
    appointments_disclaimer: "This website provides professional information only and does not offer medical advice. If you are experiencing an emergency, call 911.",
    brand_partnerships_title: "Brand Partnerships",
    brand_partnerships_description: "Professional collaborations aligned with health, movement, and performance.",
    speaking_engagements_title: "Speaking Engagements",
    speaking_engagements_description: "Conferences, panels, media, and public-health conversations.",
    sports_coverage_title: "Sports Coverage",
    sports_coverage_description: "On-site or on-call physician coverage for sporting events.",
    mentorship_title: "Mentorship",
    mentorship_description: "Guidance for students and others interested in pursuing medicine.",
    medical_appointment_title: "Book a Medical Appointment",
    medical_appointment_description: "Direct appointment lines for SUNY Downstate University Physicians of Brooklyn and Brookdale Hospital.",
    footer_name: "Dr. Laurenie Louissaint",
    footer_copyright: "© 2026 DR. LAURENIE LOUISSAINT, MD, MS, FAAPMR, CAQSM. ALL RIGHTS RESERVED.",
    tab_labels: { journey: "Education & Career", journal: "Articles & News", events: "Service & Engagement", athleticism: "Athleticism", media: "Social Media" },
  };
  const labels = {
    all: "All entries",
    publication: "Publications",
    event: "Events",
    milestone: "Journey",
    news: "News",
    media: "Media",
    workflows: "Workflows",
    inquiries: "Professional requests",
    settings: "Professional profile",
  };

  const workflowStatuses = {
    lead: "Lead",
    reviewing: "Reviewing",
    "awaiting-information": "Awaiting Information",
    confirmed: "Confirmed",
    completed: "Completed",
    declined: "Declined",
  };

  const workflowBlueprints = {
    "brand-partnerships": {
      label: "Brand Partnerships",
      requirements: ["Campaign goals and requested deliverables", "Audience and distribution channels", "Timeline and publication dates", "Budget and compensation", "Usage rights and exclusivity", "Medical accuracy and approval process"],
      subject: "Brand partnership inquiry with Dr. Laurenie Louissaint",
      introduction: "Thank you for reaching out about a potential brand partnership. Dr. Louissaint considers collaborations aligned with evidence-based health, movement, recovery, and performance. Please share the campaign goals, requested deliverables, timeline, audience, budget, usage rights, and any exclusivity requirements so the opportunity can be reviewed.",
    },
    "speaking-engagements": {
      label: "Speaking Engagements",
      requirements: ["Event name, host, and audience", "Proposed topic and format", "Date, time, and location", "Speaking length and Q&A expectations", "Honorarium, travel, and accommodations", "Recording, media, and promotional permissions"],
      subject: "Speaking engagement with Dr. Laurenie Louissaint",
      introduction: "Thank you for considering Dr. Louissaint for your program. Her speaking areas include sports medicine, interventional spine care, women’s musculoskeletal health, athlete development, rehabilitation, medical education, and leadership in sport. Please share the proposed topic, audience, format, date, location, honorarium, travel needs, and recording plans.",
    },
    "sports-coverage": {
      label: "Sports Coverage",
      requirements: ["Sport, event, and competition level", "Date, venue, and coverage hours", "Expected athlete and spectator count", "Existing medical and athletic-training staff", "Emergency action plan and local EMS details", "Coverage scope, insurance, and compensation"],
      subject: "Sports medicine coverage inquiry",
      introduction: "Thank you for reaching out about physician coverage. Please provide the sport, competition level, event date and venue, anticipated coverage hours, participant count, current medical staffing, emergency action plan, requested scope, and compensation details so availability and coverage needs can be reviewed.",
    },
    mentorship: {
      label: "Mentorship",
      requirements: ["Current school or career stage", "Area of medical interest", "Specific mentorship goals", "Questions or decisions to discuss", "Preferred meeting format", "Requested timeline and availability"],
      subject: "Mentorship request for Dr. Laurenie Louissaint",
      introduction: "Thank you for your interest in mentorship. To help Dr. Louissaint understand how she may be most useful, please share your current school or career stage, area of interest, specific goals, questions, preferred meeting format, and general availability.",
    },
    "press-public-engagement": {
      label: "Press & Public Engagement",
      requirements: ["Outlet, organization, and audience", "Interview topic and intended angle", "Format and estimated time commitment", "Deadline or event date", "Live, recorded, or written format", "Review, attribution, and usage expectations"],
      subject: "Press or public engagement request",
      introduction: "Thank you for inviting Dr. Louissaint to contribute. Please share the outlet or organization, topic and intended angle, audience, format, deadline, estimated time commitment, and how the resulting material will be attributed and used.",
    },
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function make(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function setMessage(element, message = "", type = "") {
    element.textContent = message;
    element.className = `message${type ? ` ${type}` : ""}`;
  }

  async function request(path, options = {}) {
    const response = await fetch(path, {
      credentials: "same-origin",
      ...options,
      headers: {
        accept: "application/json",
        ...(options.body instanceof FormData ? {} : { "content-type": "application/json" }),
        ...(options.headers || {}),
      },
    });

    let payload = {};
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }
    if (!response.ok) {
      if (response.status === 401 && !path.endsWith("/login") && !path.endsWith("/session")) showLogin();
      throw new Error(payload.error || `Request failed with ${response.status}.`);
    }
    return payload;
  }

  function showLogin() {
    elements.app.hidden = true;
    elements.login.hidden = false;
    elements.password.value = "";
    elements.password.focus();
  }

  function showApp() {
    elements.login.hidden = true;
    elements.app.hidden = false;
  }

  function prettyDate(value) {
    if (!value) return "No date";
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  function newestFirst(left, right) {
    const leftDate = Date.parse(left.date || left.updated_at || left.created_at || "") || 0;
    const rightDate = Date.parse(right.date || right.updated_at || right.created_at || "") || 0;
    return rightDate - leftDate
      || String(right.updated_at || "").localeCompare(String(left.updated_at || ""));
  }

  function filteredEntries() {
    const query = elements.entrySearch.value.trim().toLocaleLowerCase();
    return state.entries.filter((entry) => {
      if (state.view !== "all" && entry.type !== state.view) return false;
      if (!query) return true;
      return [entry.title, entry.category, entry.summary, entry.type, entry.status]
        .some((value) => String(value || "").toLocaleLowerCase().includes(query));
    }).sort(newestFirst);
  }

  function entryRow(entry) {
    const button = make("button", "entry-row");
    button.type = "button";
    button.dataset.id = entry.id;
    const thumbnail = make("span", "entry-thumbnail");
    if (entry.image_url) {
      const image = document.createElement("img");
      image.src = entry.image_url;
      image.alt = "";
      image.loading = "lazy";
      image.addEventListener("error", () => {
        image.remove();
        thumbnail.classList.add("is-empty");
      }, { once: true });
      thumbnail.append(image);
    } else {
      thumbnail.classList.add("is-empty");
    }
    const copy = make("span", "entry-copy");
    copy.append(make("strong", "", entry.title));
    copy.append(make("small", "", `${entry.category || labels[entry.type]} · Updated ${prettyDate(entry.updated_at?.slice(0, 10))}`));
    const status = make("span", `status status-${entry.status}`, entry.status);
    button.append(thumbnail, copy, status);
    button.addEventListener("click", () => openEditor(entry));
    return button;
  }

  function renderEntries() {
    const entries = filteredEntries();
    elements.entryRows.replaceChildren();
    elements.entryCount.textContent = `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`;
    if (!entries.length) {
      elements.entryRows.append(make("div", "empty-state", "No entries match this view. Create one when you are ready."));
      return;
    }
    for (const entry of entries) elements.entryRows.append(entryRow(entry));
  }

  function renderInquiries() {
    elements.inquiryRows.replaceChildren();
    if (!state.inquiries.length) {
      elements.inquiryRows.append(make("div", "empty-state", "No professional requests have been submitted yet."));
      return;
    }
    for (const inquiry of state.inquiries) {
      const article = make("article", "inquiry-row");
      const meta = make("div", "inquiry-meta");
      const type = String(inquiry.request_type || "request").replace(/-/gu, " ");
      meta.append(
        make("span", "status status-new", "New"),
        make("span", "inquiry-type", type),
        make("time", "", new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(inquiry.created_at))),
      );
      const heading = make("h2", "", inquiry.name);
      const contact = make("p", "inquiry-contact", `${inquiry.email}${inquiry.organization ? ` · ${inquiry.organization}` : ""}`);
      const message = make("p", "inquiry-message", inquiry.message);
      const existingWorkflow = state.workflows.find((workflow) => workflow.source_inquiry_id === inquiry.id);
      const action = make("button", "inquiry-workflow-action", existingWorkflow ? "Workflow created" : "Create workflow");
      action.type = "button";
      action.disabled = Boolean(existingWorkflow);
      action.addEventListener("click", () => openWorkflowEditor(null, inquiry));
      article.append(meta, heading, contact, message, action);
      elements.inquiryRows.append(article);
    }
  }

  function workflowTypeForInquiry(requestType) {
    if (requestType === "press") return "press-public-engagement";
    return workflowBlueprints[requestType] ? requestType : "speaking-engagements";
  }

  function workflowProgress(workflow) {
    const requirements = Array.isArray(workflow.requirements) ? workflow.requirements : [];
    const completed = requirements.filter((requirement) => requirement.completed).length;
    return { completed, total: requirements.length, percent: requirements.length ? Math.round((completed / requirements.length) * 100) : 0 };
  }

  function filteredWorkflows() {
    const query = elements.workflowSearch.value.trim().toLocaleLowerCase();
    const status = elements.workflowStatusFilter.value;
    return state.workflows.filter((workflow) => {
      if (status && workflow.status !== status) return false;
      if (!query) return true;
      return [workflow.title, workflow.contact_name, workflow.contact_email, workflow.organization, workflow.type]
        .some((value) => String(value || "").toLocaleLowerCase().includes(query));
    }).sort(newestFirst);
  }

  function renderWorkflows() {
    const active = state.workflows.filter((workflow) => !["completed", "declined"].includes(workflow.status));
    elements.activeWorkflowCount.textContent = String(active.length);
    elements.awaitingWorkflowCount.textContent = String(state.workflows.filter((workflow) => workflow.status === "awaiting-information").length);
    elements.confirmedWorkflowCount.textContent = String(state.workflows.filter((workflow) => workflow.status === "confirmed").length);
    elements.workflowRows.replaceChildren();
    const workflows = filteredWorkflows();
    if (!workflows.length) {
      elements.workflowRows.append(make("div", "empty-state", "No workflows match this view. Create one or convert a professional request."));
      return;
    }
    for (const workflow of workflows) {
      const article = make("article", "workflow-row");
      const top = make("div", "workflow-row-top");
      const type = make("span", "workflow-type", workflowBlueprints[workflow.type]?.label || workflow.type);
      const status = make("span", `status workflow-status status-${workflow.status}`, workflowStatuses[workflow.status] || workflow.status);
      top.append(type, status);
      const heading = make("h2", "", workflow.title);
      const contact = make("p", "workflow-contact", `${workflow.contact_name} · ${workflow.contact_email}${workflow.organization ? ` · ${workflow.organization}` : ""}`);
      const progress = workflowProgress(workflow);
      const progressCopy = make("div", "workflow-progress-copy");
      progressCopy.append(make("span", "", "Requirements"), make("strong", "", `${progress.completed} of ${progress.total}`));
      const progressTrack = make("div", "workflow-progress-track");
      const progressFill = make("span", "workflow-progress-fill");
      progressFill.style.width = `${progress.percent}%`;
      progressTrack.append(progressFill);
      const footer = make("div", "workflow-row-footer");
      footer.append(make("time", "", `Updated ${prettyDate(workflow.updated_at?.slice(0, 10))}`), make("span", "workflow-edit-label", "Open workflow"));
      article.append(top, heading, contact, progressCopy, progressTrack, footer);
      article.tabIndex = 0;
      article.setAttribute("role", "button");
      article.addEventListener("click", () => openWorkflowEditor(workflow));
      article.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openWorkflowEditor(workflow);
        }
      });
      elements.workflowRows.append(article);
    }
  }

  function currentRequirements() {
    return [...elements.workflowRequirements.querySelectorAll(".workflow-requirement")].map((row) => ({
      label: row.querySelector("input[type='text']").value.trim(),
      completed: row.querySelector("input[type='checkbox']").checked,
    })).filter((requirement) => requirement.label);
  }

  function requirementRow(requirement = { label: "", completed: false }) {
    const row = make("label", "workflow-requirement");
    const completed = document.createElement("input");
    completed.type = "checkbox";
    completed.checked = Boolean(requirement.completed);
    completed.setAttribute("aria-label", "Requirement completed");
    const label = document.createElement("input");
    label.type = "text";
    label.value = requirement.label || "";
    label.maxLength = 200;
    label.placeholder = "Requirement";
    const remove = make("button", "workflow-requirement-remove", "Remove");
    remove.type = "button";
    remove.addEventListener("click", () => row.remove());
    row.append(completed, label, remove);
    return row;
  }

  function renderRequirements(requirements) {
    elements.workflowRequirements.replaceChildren(...requirements.map(requirementRow));
  }

  function emailDraft(templateName = elements.workflowEmailTemplate.value) {
    const type = elements.workflowType.value;
    const blueprint = workflowBlueprints[type];
    const data = formObject(elements.workflowForm);
    const firstName = String(data.contact_name || "there").trim().split(/\s+/u)[0] || "there";
    const project = String(data.title || blueprint.label).trim();
    const organization = String(data.organization || "your organization").trim();
    const requirements = currentRequirements().map((requirement) => `• ${requirement.label}`).join("\n");
    const openings = {
      introduction: blueprint.introduction,
      requirements: `To continue reviewing “${project},” please send the following information:\n\n${requirements}\n\nOnce these details are available, we can review fit, timing, and next steps.`,
      "follow-up": `I’m following up regarding “${project}” with ${organization}. Please let us know whether the opportunity is still moving forward and if any of the requested details have changed.`,
      confirmation: `Thank you for confirming “${project}.” We have the opportunity marked as confirmed and will use the agreed details, timing, and deliverables as the working plan. Please send any final schedules, access instructions, or day-of contacts when available.`,
    };
    const closings = templateName === "confirmation"
      ? "We look forward to working together."
      : "Thank you,\nOffice of Dr. Laurenie Louissaint";
    return {
      subject: templateName === "introduction" ? blueprint.subject : `${workflowStatuses[data.status] || "Follow up"}: ${project}`,
      body: `Hello ${firstName},\n\n${openings[templateName] || openings.introduction}\n\n${closings}`,
    };
  }

  function applyEmailTemplate() {
    const draft = emailDraft();
    elements.workflowForm.elements.namedItem("email_subject").value = draft.subject;
    elements.workflowForm.elements.namedItem("email_body").value = draft.body;
    state.emailDraftTouched = false;
    updateWorkflowEmailLink();
  }

  function updateWorkflowEmailLink() {
    const data = formObject(elements.workflowForm);
    const href = `mailto:${encodeURIComponent(data.contact_email || "")}?subject=${encodeURIComponent(data.email_subject || "")}&body=${encodeURIComponent(data.email_body || "")}`;
    elements.openWorkflowEmail.href = href;
  }

  function openWorkflowEditor(workflow = null, inquiry = null) {
    state.editingWorkflowId = workflow?.id || null;
    state.emailDraftTouched = Boolean(workflow?.email_body);
    elements.workflowForm.reset();
    setMessage(elements.workflowEditorMessage);
    elements.workflowEditorTitle.textContent = workflow ? "Edit workflow" : "New workflow";
    elements.deleteWorkflowBtn.hidden = !workflow;
    const type = workflow?.type || workflowTypeForInquiry(inquiry?.request_type);
    const values = workflow || {
      type,
      status: "lead",
      title: inquiry ? `${workflowBlueprints[type].label}: ${inquiry.organization || inquiry.name}` : "",
      contact_name: inquiry?.name || "",
      contact_email: inquiry?.email || "",
      organization: inquiry?.organization || "",
      source_inquiry_id: inquiry?.id || "",
      notes: inquiry?.message || "",
    };
    fillForm(elements.workflowForm, values);
    elements.workflowType.value = type;
    const requirements = workflow?.requirements?.length
      ? workflow.requirements
      : workflowBlueprints[type].requirements.map((label) => ({ label, completed: false }));
    renderRequirements(requirements);
    if (!workflow?.email_body) applyEmailTemplate();
    else updateWorkflowEmailLink();
    elements.workflowEditor.showModal();
    elements.workflowForm.elements.namedItem(workflow ? "title" : "contact_name").focus();
  }

  async function saveWorkflow(event) {
    event.preventDefault();
    const submit = elements.workflowForm.querySelector('[type="submit"]');
    submit.disabled = true;
    setMessage(elements.workflowEditorMessage, "Saving workflow…");
    try {
      const data = formObject(elements.workflowForm);
      data.requirements = currentRequirements();
      const path = state.editingWorkflowId ? `/api/admin/workflows/${encodeURIComponent(state.editingWorkflowId)}` : "/api/admin/workflows";
      await request(path, { method: state.editingWorkflowId ? "PUT" : "POST", body: JSON.stringify(data) });
      await loadData();
      elements.workflowEditor.close();
      changeView("workflows");
      setMessage(elements.message, "Workflow saved.", "success");
    } catch (error) {
      setMessage(elements.workflowEditorMessage, error.message, "error");
    } finally {
      submit.disabled = false;
    }
  }

  async function deleteWorkflow() {
    if (!state.editingWorkflowId || !window.confirm("Delete this workflow? This cannot be undone.")) return;
    elements.deleteWorkflowBtn.disabled = true;
    try {
      await request(`/api/admin/workflows/${encodeURIComponent(state.editingWorkflowId)}`, { method: "DELETE" });
      await loadData();
      elements.workflowEditor.close();
      changeView("workflows");
      setMessage(elements.message, "Workflow deleted.", "success");
    } catch (error) {
      setMessage(elements.workflowEditorMessage, error.message, "error");
    } finally {
      elements.deleteWorkflowBtn.disabled = false;
    }
  }

  function fillForm(form, values) {
    for (const [name, value] of Object.entries(values)) {
      const field = form.elements.namedItem(name);
      if (field) field.value = value || "";
    }
  }

  function openEditor(entry = null) {
    state.editingId = entry?.id || null;
    elements.entryForm.reset();
    elements.entryUpload.value = "";
    setMessage(elements.editorMessage);
    elements.editorTitle.textContent = entry ? "Edit entry" : "New entry";
    elements.deleteBtn.hidden = !entry;
    if (entry) {
      fillForm(elements.entryForm, entry);
      elements.entryForm.elements.namedItem("date").value = entry.date || "";
    } else if (state.view !== "all" && state.view !== "settings") {
      elements.entryForm.elements.namedItem("type").value = state.view;
    }
    elements.editor.showModal();
    elements.entryForm.elements.namedItem("title").focus();
  }

  async function uploadFile(file) {
    if (!file) return "";
    const form = new FormData();
    form.append("file", file);
    const payload = await request("/api/admin/upload", { method: "POST", body: form });
    return payload.url;
  }

  function formObject(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  async function saveEntry(event) {
    event.preventDefault();
    const submit = elements.entryForm.querySelector('[type="submit"]');
    submit.disabled = true;
    setMessage(elements.editorMessage, "Saving…");
    try {
      const data = formObject(elements.entryForm);
      const file = elements.entryUpload.files[0];
      if (file) data.image_url = await uploadFile(file);
      const path = state.editingId ? `/api/admin/entries/${encodeURIComponent(state.editingId)}` : "/api/admin/entries";
      await request(path, {
        method: state.editingId ? "PUT" : "POST",
        body: JSON.stringify(data),
      });
      await loadData();
      elements.editor.close();
      setMessage(elements.message, "Entry saved.", "success");
    } catch (error) {
      setMessage(elements.editorMessage, error.message, "error");
    } finally {
      submit.disabled = false;
    }
  }

  async function deleteEntry() {
    if (!state.editingId) return;
    const entry = state.entries.find((item) => item.id === state.editingId);
    if (!window.confirm(`Delete “${entry?.title || "this entry"}”? This cannot be undone.`)) return;

    elements.deleteBtn.disabled = true;
    try {
      await request(`/api/admin/entries/${encodeURIComponent(state.editingId)}`, { method: "DELETE" });
      await loadData();
      elements.editor.close();
      setMessage(elements.message, "Entry deleted.", "success");
    } catch (error) {
      setMessage(elements.editorMessage, error.message, "error");
    } finally {
      elements.deleteBtn.disabled = false;
    }
  }

  function slideshowUrls() {
    const field = elements.settingsForm.elements.namedItem("hero_slideshow");
    return String(field?.value || "").split(/\r?\n/u).map((url) => url.trim()).filter(Boolean);
  }

  function defaultSlideshowUrls(portraitUrl = state.settings.portrait_url) {
    return [...new Set([
      portraitUrl || "/assets/images/dr-laurenie-louissaint-headshot.jpg",
      "/assets/images/dr-laurenie-louissaint-ross.jpg",
    ])];
  }

  function updateSlideshowUrls(urls) {
    elements.settingsForm.elements.namedItem("hero_slideshow").value = urls.join("\n");
    renderSlideshowPreview();
  }

  function slideshowCard(url, index, total, pending = false, readOnly = false) {
    const card = make("article", `slideshow-card${pending ? " is-pending" : ""}${readOnly ? " is-default" : ""}`);
    const imageWrap = make("div", "slideshow-card-image");
    const image = document.createElement("img");
    image.src = url;
    image.alt = pending ? `New slideshow photo ${index + 1}` : `Slideshow photo ${index + 1}`;
    image.loading = "lazy";
    image.addEventListener("error", () => imageWrap.classList.add("is-error"), { once: true });
    imageWrap.append(image);

    const footer = make("div", "slideshow-card-footer");
    footer.append(make("strong", "", pending ? `New photo ${index + 1}` : `${readOnly ? "Default slide" : "Slide"} ${index + 1}`));
    const controls = make("div", "slideshow-card-controls");
    if (readOnly) {
      controls.append(make("span", "slideshow-default-label", "Active default"));
    } else if (pending) {
      const remove = make("button", "slideshow-remove", "Remove");
      remove.type = "button";
      remove.addEventListener("click", () => {
        const transfer = new DataTransfer();
        [...elements.heroSlideshowUpload.files].forEach((file, fileIndex) => {
          if (fileIndex !== index) transfer.items.add(file);
        });
        elements.heroSlideshowUpload.files = transfer.files;
        renderSlideshowPreview();
      });
      controls.append(remove);
    } else {
      const urls = slideshowUrls();
      const earlier = make("button", "", "Earlier");
      earlier.type = "button";
      earlier.title = "Move photo earlier";
      earlier.setAttribute("aria-label", `Move slide ${index + 1} earlier`);
      earlier.disabled = index === 0;
      earlier.addEventListener("click", () => {
        [urls[index - 1], urls[index]] = [urls[index], urls[index - 1]];
        updateSlideshowUrls(urls);
      });
      const later = make("button", "", "Later");
      later.type = "button";
      later.title = "Move photo later";
      later.setAttribute("aria-label", `Move slide ${index + 1} later`);
      later.disabled = index === total - 1;
      later.addEventListener("click", () => {
        [urls[index], urls[index + 1]] = [urls[index + 1], urls[index]];
        updateSlideshowUrls(urls);
      });
      const remove = make("button", "slideshow-remove", "Remove");
      remove.type = "button";
      remove.addEventListener("click", () => updateSlideshowUrls(urls.filter((_, itemIndex) => itemIndex !== index)));
      controls.append(earlier, later, remove);
    }
    footer.append(controls);
    card.append(imageWrap, footer);
    return card;
  }

  function renderSlideshowPreview() {
    state.slideshowObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    state.slideshowObjectUrls = [];
    elements.heroSlideshowPreview.replaceChildren();

    const urls = slideshowUrls();
    if (urls.length) {
      urls.forEach((url, index) => elements.heroSlideshowPreview.append(slideshowCard(url, index, urls.length)));
    } else {
      const defaults = defaultSlideshowUrls();
      defaults.forEach((url, index) => elements.heroSlideshowPreview.append(slideshowCard(url, index, defaults.length, false, true)));
    }

    [...elements.heroSlideshowUpload.files].forEach((file, index) => {
      const objectUrl = URL.createObjectURL(file);
      state.slideshowObjectUrls.push(objectUrl);
      elements.heroSlideshowPreview.append(slideshowCard(objectUrl, index, elements.heroSlideshowUpload.files.length, true));
    });
  }

  function renderSettings() {
    fillForm(elements.settingsForm, state.settings);
    const copyField = elements.settingsForm.elements.namedItem("site_copy");
    if (copyField) {
      const savedCopy = state.settings.site_copy || {};
      copyField.value = JSON.stringify(savedCopy.selector_overrides ? savedCopy : { ...defaultSiteCopy, ...savedCopy }, null, 2);
      if (!savedCopy.selector_overrides && !copyCatalogPromise) {
        copyCatalogPromise = loadCopyCatalog().then((catalog) => {
          state.settings.site_copy = { ...savedCopy, selector_overrides: { ...catalog, ...(savedCopy.selector_overrides || {}) } };
          copyField.value = JSON.stringify(state.settings.site_copy, null, 2);
        }).catch(() => {});
      }
    }
    renderSlideshowPreview();
  }

  function selectorFor(element) {
    if (element.id) return `#${CSS.escape(element.id)}`;
    const parts = [];
    let node = element;
    while (node && node.nodeType === 1 && node.tagName !== "BODY") {
      let part = node.tagName.toLowerCase();
      if (node.classList.length) part += `.${[...node.classList].filter((name) => /^[a-z][\w-]*$/iu.test(name)).slice(0, 2).join(".")}`;
      const siblings = node.parentElement ? [...node.parentElement.children].filter((sibling) => sibling.tagName === node.tagName) : [];
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
      parts.unshift(part);
      node = node.parentElement;
      if (node?.id) return `#${CSS.escape(node.id)} > ${parts.join(" > ")}`;
    }
    return parts.join(" > ");
  }

  function editableText(element) {
    const clone = element.cloneNode(true);
    clone.querySelectorAll("br").forEach((breakNode) => breakNode.replaceWith("\n"));
    return clone.textContent.replace(/[ \t]+/gu, " ").replace(/\n[ \t]+/gu, "\n").trim();
  }

  async function loadCopyCatalog() {
    const response = await fetch("/", { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load the public site copy.");
    const html = await response.text();
    const documentCopy = new DOMParser().parseFromString(html, "text/html");
    const root = documentCopy.body;
    const catalog = {};
    const editableTags = new Set(["A", "BUTTON", "H1", "H2", "H3", "H4", "LABEL", "LI", "P", "SMALL", "SPAN", "STRONG"]);
    for (const element of root?.querySelectorAll("a,button,h1,h2,h3,h4,label,li,p,small,span,strong") || []) {
      if (!editableTags.has(element.tagName) || element.closest("script,style,svg") || element.children.length > 0) continue;
      const text = editableText(element);
      const selector = selectorFor(element);
      if (text && selector && !selector.includes("script") && !selector.includes("style")) catalog[selector] = text;
    }
    return catalog;
  }

  function selectSlideshowFiles() {
    renderSlideshowPreview();
    const files = [...elements.heroSlideshowUpload.files];
    if (!files.length) {
      setMessage(elements.slideshowMessage);
      return;
    }
    const oversized = files.find((file) => file.size > 10 * 1024 * 1024);
    if (oversized) {
      setMessage(elements.slideshowMessage, `${oversized.name} is larger than 10 MB. Choose a smaller image.`, "error");
      return;
    }
    setMessage(elements.slideshowMessage, `${files.length} new ${files.length === 1 ? "photo is" : "photos are"} ready. Select Save slideshow changes.`, "success");
  }

  async function saveSettings(event) {
    event.preventDefault();
    const submitButtons = [...elements.settingsForm.querySelectorAll('[type="submit"]')];
    const savingSlideshow = event.submitter === elements.slideshowSaveButton || elements.heroSlideshowUpload.files.length > 0;
    submitButtons.forEach((button) => { button.disabled = true; });
    setMessage(elements.message, "Saving settings…");
    if (savingSlideshow) setMessage(elements.slideshowMessage, "Uploading and saving slideshow…");
    try {
      const data = formObject(elements.settingsForm);
      const file = elements.portraitUpload.files[0];
      if (file) data.portrait_url = await uploadFile(file);
      const slideshowFiles = [...elements.heroSlideshowUpload.files];
      if (slideshowFiles.length) {
        const savedUrls = String(data.hero_slideshow || "").split(/\r?\n/u).map((url) => url.trim()).filter(Boolean);
        const existingUrls = savedUrls.length ? savedUrls : defaultSlideshowUrls(data.portrait_url);
        const uploadedUrls = await Promise.all(slideshowFiles.map(uploadFile));
        data.hero_slideshow = [...new Set([...existingUrls, ...uploadedUrls])].join("\n");
      }
      const payload = await request("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      state.settings = payload.settings;
      elements.portraitUpload.value = "";
      elements.heroSlideshowUpload.value = "";
      renderSettings();
      setMessage(elements.message, "Site settings saved.", "success");
      if (savingSlideshow) {
        const activeSlides = String(payload.settings.hero_slideshow || "").split(/\r?\n/u).filter(Boolean).length || defaultSlideshowUrls(payload.settings.portrait_url).length;
        setMessage(elements.slideshowMessage, `Slideshow saved. ${activeSlides} photos are active.`, "success");
      }
    } catch (error) {
      setMessage(elements.message, error.message, "error");
      if (savingSlideshow) setMessage(elements.slideshowMessage, error.message, "error");
    } finally {
      submitButtons.forEach((button) => { button.disabled = false; });
    }
  }

  function changeView(view) {
    state.view = view;
    elements.viewTitle.textContent = labels[view];
    for (const button of elements.navButtons) {
      button.classList.toggle("active", button.dataset.view === view);
      button.setAttribute("aria-current", button.dataset.view === view ? "page" : "false");
    }
    const settings = view === "settings";
    const inquiries = view === "inquiries";
    const workflows = view === "workflows";
    elements.entriesPane.hidden = settings || inquiries || workflows;
    elements.inquiriesPane.hidden = !inquiries;
    elements.workflowsPane.hidden = !workflows;
    elements.settingsPane.hidden = !settings;
    elements.newBtn.hidden = settings || inquiries;
    elements.newBtn.textContent = workflows ? "+ Create workflow" : "+ Create entry";
    setMessage(elements.message);
    if (settings) renderSettings();
    else if (inquiries) renderInquiries();
    else if (workflows) renderWorkflows();
    else renderEntries();
  }

  async function loadData() {
    const [entryPayload, settingsPayload, inquiryPayload, workflowPayload] = await Promise.all([
      request("/api/admin/entries"),
      request("/api/admin/settings"),
      request("/api/admin/inquiries"),
      request("/api/admin/workflows"),
    ]);
    state.entries = entryPayload.entries || [];
    state.settings = settingsPayload.settings || {};
    state.inquiries = inquiryPayload.inquiries || [];
    state.workflows = workflowPayload.workflows || [];
    renderEntries();
    renderSettings();
    renderInquiries();
    renderWorkflows();
  }

  async function login(event) {
    event.preventDefault();
    const submit = elements.loginForm.querySelector("button");
    submit.disabled = true;
    setMessage(elements.loginMsg, "Signing in…");
    try {
      await request("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password: elements.password.value }),
      });
      await loadData();
      showApp();
      setMessage(elements.loginMsg);
    } catch (error) {
      setMessage(elements.loginMsg, error.message, "error");
      elements.password.select();
    } finally {
      submit.disabled = false;
    }
  }

  async function logout() {
    try {
      await request("/api/admin/logout", { method: "POST", body: "{}" });
    } finally {
      showLogin();
    }
  }

  function setUpEvents() {
    elements.loginForm.addEventListener("submit", login);
    elements.logout.addEventListener("click", logout);
    elements.newBtn.addEventListener("click", () => (state.view === "workflows" ? openWorkflowEditor() : openEditor()));
    elements.entrySearch.addEventListener("input", renderEntries);
    elements.entryForm.addEventListener("submit", saveEntry);
    elements.deleteBtn.addEventListener("click", deleteEntry);
    elements.settingsForm.addEventListener("submit", saveSettings);
    elements.heroSlideshowUpload.addEventListener("change", selectSlideshowFiles);
    elements.closeEditor.addEventListener("click", () => elements.editor.close());
    elements.closeWorkflowEditor.addEventListener("click", () => elements.workflowEditor.close());
    elements.workflowEditor.addEventListener("click", (event) => {
      if (event.target === elements.workflowEditor) elements.workflowEditor.close();
    });
    elements.workflowForm.addEventListener("submit", saveWorkflow);
    elements.deleteWorkflowBtn.addEventListener("click", deleteWorkflow);
    elements.workflowSearch.addEventListener("input", renderWorkflows);
    elements.workflowStatusFilter.addEventListener("change", renderWorkflows);
    elements.addRequirement.addEventListener("click", () => {
      const row = requirementRow();
      elements.workflowRequirements.append(row);
      row.querySelector("input[type='text']").focus();
    });
    elements.workflowType.addEventListener("change", () => {
      renderRequirements(workflowBlueprints[elements.workflowType.value].requirements.map((label) => ({ label, completed: false })));
      applyEmailTemplate();
    });
    elements.workflowEmailTemplate.addEventListener("change", applyEmailTemplate);
    for (const name of ["contact_name", "contact_email", "organization", "title", "status"]) {
      elements.workflowForm.elements.namedItem(name).addEventListener("input", () => {
        if (!state.emailDraftTouched) applyEmailTemplate();
        else updateWorkflowEmailLink();
      });
    }
    elements.workflowForm.elements.namedItem("email_subject").addEventListener("input", () => {
      state.emailDraftTouched = true;
      updateWorkflowEmailLink();
    });
    elements.workflowForm.elements.namedItem("email_body").addEventListener("input", () => {
      state.emailDraftTouched = true;
      updateWorkflowEmailLink();
    });
    elements.copyWorkflowEmail.addEventListener("click", async () => {
      const subject = elements.workflowForm.elements.namedItem("email_subject").value;
      const body = elements.workflowForm.elements.namedItem("email_body").value;
      try {
        await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
        setMessage(elements.workflowEditorMessage, "Email copied to the clipboard.", "success");
      } catch {
        setMessage(elements.workflowEditorMessage, "Copy was unavailable. Select the email text and copy it manually.", "error");
      }
    });
    elements.openWorkflowEmail.addEventListener("click", updateWorkflowEmailLink);
    elements.editor.addEventListener("click", (event) => {
      if (event.target === elements.editor) elements.editor.close();
    });
    for (const button of elements.navButtons) {
      button.addEventListener("click", () => changeView(button.dataset.view));
    }
  }

  async function initialize() {
    Object.assign(elements, {
      app: byId("app"),
      activeWorkflowCount: byId("activeWorkflowCount"),
      addRequirement: byId("addRequirement"),
      awaitingWorkflowCount: byId("awaitingWorkflowCount"),
      closeEditor: byId("closeEditor"),
      closeWorkflowEditor: byId("closeWorkflowEditor"),
      confirmedWorkflowCount: byId("confirmedWorkflowCount"),
      copyWorkflowEmail: byId("copyWorkflowEmail"),
      deleteBtn: byId("deleteBtn"),
      deleteWorkflowBtn: byId("deleteWorkflowBtn"),
      editor: byId("editor"),
      editorMessage: byId("editorMessage"),
      editorTitle: byId("editorTitle"),
      entriesPane: byId("entriesPane"),
      entryCount: byId("entryCount"),
      entryForm: byId("entryForm"),
      entryRows: byId("entryRows"),
      entrySearch: byId("entrySearch"),
      entryUpload: byId("entryUpload"),
      heroSlideshowUpload: byId("heroSlideshowUpload"),
      heroSlideshowPreview: byId("heroSlideshowPreview"),
      inquiriesPane: byId("inquiriesPane"),
      inquiryRows: byId("inquiryRows"),
      login: byId("login"),
      loginForm: byId("loginForm"),
      loginMsg: byId("loginMsg"),
      logout: byId("logout"),
      message: byId("message"),
      navButtons: [...document.querySelectorAll(".sidebar .nav")],
      newBtn: byId("newBtn"),
      openWorkflowEmail: byId("openWorkflowEmail"),
      password: byId("password"),
      portraitUpload: byId("portraitUpload"),
      settingsForm: byId("settingsForm"),
      settingsPane: byId("settingsPane"),
      slideshowMessage: byId("slideshowMessage"),
      slideshowSaveButton: byId("slideshowSaveButton"),
      viewTitle: byId("viewTitle"),
      workflowEditor: byId("workflowEditor"),
      workflowEditorMessage: byId("workflowEditorMessage"),
      workflowEditorTitle: byId("workflowEditorTitle"),
      workflowEmailTemplate: byId("workflowEmailTemplate"),
      workflowForm: byId("workflowForm"),
      workflowRequirements: byId("workflowRequirements"),
      workflowRows: byId("workflowRows"),
      workflowSearch: byId("workflowSearch"),
      workflowStatusFilter: byId("workflowStatusFilter"),
      workflowsPane: byId("workflowsPane"),
      workflowType: byId("workflowType"),
    });
    setUpEvents();
    try {
      await request("/api/admin/session");
      await loadData();
      showApp();
    } catch {
      showLogin();
    }
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();
