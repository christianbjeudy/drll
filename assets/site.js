(() => {
  "use strict";

  const state = {
    entries: [],
    settings: {},
    activeHighlight: "journey",
  };

  const highlightIds = ["journey", "journal", "events", "athleticism", "media"];

  const elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function make(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function socialIcon(label) {
    const namespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(namespace, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");

    const shape = (tag, attributes) => {
      const node = document.createElementNS(namespace, tag);
      for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
      return node;
    };

    if (label === "LinkedIn") {
      svg.append(shape("path", { d: "M6.7 8.4H3.3V21h3.4V8.4ZM5 3A2 2 0 1 0 5 7a2 2 0 0 0 0-4Zm8.1 5.4H9.9V21h3.4v-6.2c0-1.6.3-3.2 2.4-3.2 2.1 0 2.1 1.9 2.1 3.3V21h3.4v-6.9c0-3.4-.7-6-4.7-6a4.1 4.1 0 0 0-3.6 2h-.1V8.4Z" }));
    } else if (label === "Instagram") {
      svg.append(
        shape("rect", { x: "3", y: "3", width: "18", height: "18", rx: "5" }),
        shape("circle", { cx: "12", cy: "12", r: "4.2" }),
        shape("circle", { cx: "17.6", cy: "6.6", r: "1", class: "fill-dot" }),
      );
    } else if (label === "TikTok") {
      svg.append(shape("path", { d: "M16.6 5.8c1.2.9 2.8 1.4 4.4 1.5v3.3a10.2 10.2 0 0 1-4.4-1v6.5a6.1 6.1 0 1 1-5.3-6v3.4a2.8 2.8 0 1 0 2 2.6V3h3.3v2.8Z" }));
    } else {
      return null;
    }
    return svg;
  }

  function safeUrl(value, { allowMailto = false } = {}) {
    if (!value) return "";
    try {
      const url = new URL(value, window.location.origin);
      if (url.origin === window.location.origin) return url.href;
      if (url.protocol === "https:" || url.protocol === "http:") return url.href;
      if (allowMailto && url.protocol === "mailto:") return url.href;
    } catch {
      return "";
    }
    return "";
  }

  function prettyDate(value, { yearOnly = false } = {}) {
    if (!value) return "Date forthcoming";
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    if (yearOnly) return String(date.getFullYear());
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  function entryDateLabel(entry) {
    const value = String(entry.date || "");
    return value.endsWith("-01-01") ? prettyDate(value, { yearOnly: true }) : prettyDate(value);
  }

  function emptyMessage(message, className = "empty-card") {
    return make("div", className, message);
  }

  function lines(value) {
    return String(value || "").split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
  }

  function renderTextList(container, value) {
    const items = lines(value);
    if (!items.length) return;
    container.replaceChildren(...items.map((item) => make("li", "", item)));
  }

  function phoneHref(value) {
    const digits = String(value || "").replace(/[^\d+]/gu, "");
    return digits ? `tel:${digits}` : "";
  }

  function renderFocus(value) {
    const items = lines(value);
    if (!items.length) return;
    const descriptions = {
      "Sports Medicine": "Non-operative care supporting movement, recovery, and performance.",
      "Physical Medicine & Rehabilitation": "Function-focused care informed by rehabilitation medicine.",
      "Pain Management": "Evidence-informed evaluation and care for musculoskeletal pain.",
      "Interventional Spine": "Specialized training in spine care and image-guided procedures.",
      "Pain Management & Interventional Spine": "Evidence-informed spine and musculoskeletal pain care with image-guided options.",
      "Women’s Musculoskeletal Health": "Evidence-based sports medicine care for women across the lifespan.",
      "Musculoskeletal Ultrasound": "Ultrasound-supported assessment and procedural care.",
      "Cycling & Running Medicine": "Movement-focused care for endurance athletes and active patients.",
    };
    const expandedDescriptions = {
      "Sports Medicine": {
        meaning: "Sports medicine focuses on preventing, evaluating, and treating activity-related injuries while supporting a safe return to movement and performance.",
        approach: "Dr. Louissaint pairs her rehabilitation training and athletic background with movement-focused plans shaped around each patient’s goals.",
        care: "A consultation may include injury evaluation, rehabilitation planning, return-to-sport guidance, and coordination with therapists or athletic trainers.",
      },
      "Physical Medicine & Rehabilitation": {
        meaning: "Physiatry is a function-first medical specialty addressing conditions that affect muscles, joints, nerves, mobility, and quality of life.",
        approach: "Dr. Louissaint connects clinical findings with the activities, responsibilities, and movement goals that matter in a patient’s daily life.",
        care: "Visits may include a functional assessment, rehabilitation strategy, therapy coordination, and non-operative options tailored to mobility and independence.",
      },
      "Pain Management": {
        meaning: "Pain management evaluates how musculoskeletal pain affects movement, function, recovery, work, and participation in everyday activities.",
        approach: "Dr. Louissaint uses a balanced rehabilitation perspective to identify contributing factors and build practical, evidence-informed next steps.",
        care: "Consultation may involve a focused examination, recovery and lifestyle planning, therapy recommendations, or selected procedures when clinically appropriate.",
      },
      "Interventional Spine": {
        meaning: "Interventional spine care combines detailed evaluation of spine-related pain with non-operative treatment and image-guided options when appropriate.",
        approach: "Her fellowship training informs a careful assessment of symptoms, mobility, function, and the role of the spine in a patient’s goals.",
        care: "A visit may include a spine examination, review of prior imaging, rehabilitation planning, and discussion of appropriate image-guided procedures.",
      },
      "Pain Management & Interventional Spine": {
        meaning: "This specialty combines detailed evaluation of spine-related and musculoskeletal pain with rehabilitation, non-operative treatment, and image-guided options when appropriate.",
        approach: "Dr. Louissaint’s fellowship training informs a careful assessment of symptoms, mobility, function, and the individual’s recovery goals.",
        care: "A consultation may include a focused spine and musculoskeletal examination, imaging review, rehabilitation planning, or discussion of selected image-guided procedures.",
      },
      "Women’s Musculoskeletal Health": {
        meaning: "Women’s musculoskeletal health addresses injury prevention, diagnosis, recovery, concussion, pain, and physical performance across the lifespan.",
        approach: "Dr. Louissaint provides comprehensive, evidence-based sports medicine care shaped around each patient’s stage of life, activity, and athletic goals.",
        care: "Visits may include injury evaluation, non-surgical orthopedic care, concussion management, pain-management options, and guidance supporting physical health and performance.",
      },
      "Musculoskeletal Ultrasound": {
        meaning: "Musculoskeletal ultrasound provides real-time visualization of selected soft tissues and joints, including structures while they are moving.",
        approach: "Dr. Louissaint may use ultrasound to add context to a physical examination and support precise, patient-centered decisions.",
        care: "Consultation may include dynamic ultrasound assessment or ultrasound guidance for selected procedures when clinically indicated.",
      },
      "Cycling & Running Medicine": {
        meaning: "Endurance medicine addresses training-related pain, overuse concerns, biomechanics, recovery, and sustainable participation in cycling and running.",
        approach: "As a cyclist, Dr. Louissaint brings clinical training and a practical appreciation for endurance, consistency, equipment, and return to sport.",
        care: "Visits may include an overuse-injury evaluation, training-load review, biomechanics discussion, rehabilitation planning, and return-to-activity guidance.",
      },
    };
    elements.focusList.replaceChildren();
    items.forEach((item, index) => {
      const card = make("details", "expertise-card");
      const summary = make("summary", "expertise-summary");
      summary.append(
        make("span", "expertise-index", String(index + 1).padStart(2, "0")),
        make("span", "expertise-title", item),
        make("span", "expertise-summary-text", descriptions[item] || "A current area of clinical and academic focus."),
        make("span", "expertise-toggle", "+"),
      );
      summary.lastElementChild.setAttribute("aria-hidden", "true");
      const more = make("div", "expertise-more");
      const expanded = expandedDescriptions[item] || {
        meaning: "This is a current area of Dr. Louissaint’s clinical and academic work.",
        approach: "Her approach is informed by the individual’s goals, function, and overall health.",
        care: "Consultation options are tailored to the patient and discussed after an appropriate clinical evaluation.",
      };
      const columns = make("div", "expertise-columns");
      for (const [label, copy] of [
        ["What it means", expanded.meaning],
        ["Dr. Louissaint’s approach", expanded.approach],
        ["Consultation & care", expanded.care],
      ]) {
        const column = make("article", "expertise-blurb");
        column.append(make("h4", "", label), make("p", "", copy));
        columns.append(column);
      }
      more.append(columns);
      card.append(summary, more);
      elements.focusList.append(card);
    });
  }

  function renderCredentialLines(container, linesToRender) {
    container.replaceChildren(...linesToRender.filter(Boolean).map((line) => make("span", "", line)));
  }

  function renderAppointmentRoles(value) {
    const roles = String(value || "").split(/;\s*/u).map((role) => role.trim()).filter(Boolean);
    if (!roles.length) return;
    const nodes = [];
    roles.forEach((role, index) => {
      if (index) nodes.push(make("span", "appointment-role-divider"));
      const heading = make("h3");
      const [lead, ...remainder] = role.split(/,\s*/u);
      if (remainder.length) {
        heading.append(
          document.createTextNode(`${lead},`),
          document.createElement("br"),
          document.createTextNode(remainder.join(", ")),
        );
      } else {
        heading.textContent = role;
      }
      nodes.push(heading);
    });
    elements.academicAppointment.replaceChildren(...nodes);
  }

  function renderLatestSocialPost(settings) {
    const url = safeUrl(settings.latest_social_url);
    const publishedAt = Date.parse(settings.latest_social_published_at || "");
    const age = Date.now() - publishedAt;
    const recentWindow = 72 * 60 * 60 * 1000;
    const isRecent = url && Number.isFinite(publishedAt) && age >= -5 * 60 * 1000 && age <= recentWindow;

    elements.latestSocialPost.hidden = !isRecent;
    if (!isRecent) {
      elements.latestSocialPost.removeAttribute("href");
      return;
    }

    const inferredPlatform = url.includes("tiktok.com") ? "TikTok" : url.includes("instagram.com") ? "Instagram" : "social media";
    const platform = String(settings.latest_social_platform || inferredPlatform).trim();
    const elapsedHours = Math.max(0, Math.floor(age / (60 * 60 * 1000)));
    const ageLabel = elapsedHours < 1 ? "just posted" : elapsedHours < 24 ? `${elapsedHours}h ago` : `${Math.floor(elapsedHours / 24)}d ago`;
    elements.latestSocialPost.href = url;
    elements.latestSocialPost.setAttribute("aria-label", `Open Dr. Louissaint’s latest ${platform} post, ${ageLabel}`);
    elements.latestSocialLabel.textContent = `Latest ${platform} post · ${ageLabel}`;
  }

  function imageFor(entry, className = "") {
    const source = safeUrl(entry.image_url);
    if (!source) return null;
    const image = make("img", className);
    image.src = source;
    image.alt = entry.title ? `${entry.title} cover` : "Professional image";
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => image.remove(), { once: true });
    return image;
  }

  function openDetail(entry) {
    elements.detailBody.replaceChildren();
    const category = make("span", "eyebrow purple", `${entry.category || entry.type} · ${entryDateLabel(entry)}`);
    const title = make("h2", "", entry.title);
    elements.detailBody.append(category, title);

    const image = imageFor(entry);
    if (image) elements.detailBody.append(image);

    if (entry.summary) elements.detailBody.append(make("p", "detail-summary", entry.summary));
    if (entry.body) {
      for (const paragraph of entry.body.split(/\n{2,}/u)) {
        if (paragraph.trim()) elements.detailBody.append(make("p", "", paragraph.trim()));
      }
    }

    const externalUrl = safeUrl(entry.external_url);
    if (externalUrl) {
      const link = make("a", "detail-resource", "Open external resource");
      link.href = externalUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      elements.detailBody.append(link);
    }

    elements.detailDialog.showModal();
  }

  function highlightEntry(entry) {
    const card = make("details", "expertise-card highlight-entry");
    const summary = make("summary", "expertise-summary highlight-entry-summary");
    summary.append(
      make("span", "expertise-index highlight-entry-year", prettyDate(entry.date, { yearOnly: true })),
      make("span", "expertise-title", entry.title),
      make("span", "expertise-summary-text", entry.summary || `${entry.category || entry.type} from Dr. Louissaint’s professional work.`),
      make("span", "expertise-toggle", "+"),
    );
    summary.lastElementChild.setAttribute("aria-hidden", "true");

    const more = make("div", "expertise-more highlight-entry-more");
    const image = imageFor(entry, "highlight-entry-image");
    if (image) {
      more.classList.add("has-media");
      more.append(image);
    }
    const copy = make("div", "highlight-entry-copy");
    copy.append(make("span", "highlight-entry-meta", `${entry.category || entry.type} · ${entryDateLabel(entry)}`));
    if (entry.body) {
      for (const paragraph of entry.body.split(/\n{2,}/u)) {
        if (paragraph.trim()) copy.append(make("p", "", paragraph.trim()));
      }
    } else if (entry.summary) {
      copy.append(make("p", "", entry.summary));
    }
    const externalUrl = safeUrl(entry.external_url);
    if (externalUrl) {
      const link = make("a", "highlight-entry-link", "Open resource");
      link.href = externalUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      copy.append(link);
    }
    more.append(copy);
    card.append(summary, more);
    return card;
  }

  function renderJourney() {
    const entries = state.entries.filter((entry) => entry.type === "milestone");
    elements.journeyList.replaceChildren();
    if (!entries.length) {
      elements.journeyList.append(emptyMessage("Professional milestones will appear here as this profile grows.", "empty-inline"));
      return;
    }

    for (const entry of entries) elements.journeyList.append(highlightEntry(entry));
  }

  function renderPublications() {
    const publications = state.entries.filter((entry) => entry.type === "publication");
    elements.publicationList.replaceChildren();
    if (!publications.length) {
      elements.publicationList.append(emptyMessage("Published work will be added to this library soon."));
      return;
    }

    for (const entry of publications) elements.publicationList.append(highlightEntry(entry));
  }

  function renderCards(type, container, kind, emptyText) {
    const entries = state.entries.filter((entry) => entry.type === type);
    container.replaceChildren();
    if (!entries.length) {
      container.append(emptyMessage(emptyText));
      return;
    }
    for (const entry of entries) container.append(highlightEntry(entry));
  }

  function renderSocialLinks(container, links, { showLabel = false } = {}) {
    container.replaceChildren();
    for (const [label, value] of links) {
      const url = safeUrl(value);
      if (!url) continue;
      const icon = socialIcon(label);
      const link = make("a", icon ? `social-${label.toLowerCase()}` : "", icon ? undefined : label);
      if (icon) {
        link.append(icon);
        if (showLabel) link.append(make("span", "social-link-label", label));
        link.setAttribute("aria-label", label);
        link.title = label;
      }
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      container.append(link);
    }
  }

  function renderSettings() {
    const settings = state.settings;
    if (settings.about) elements.aboutLead.textContent = settings.about;
    if (settings.hero_intro) elements.heroIntro.textContent = settings.hero_intro;
    if (settings.credentials) elements.credentialLine.textContent = settings.credentials;
    if (settings.professional_title) {
      const role = settings.professional_title.replace(/ of Sports Medicine$/u, ", Sports Medicine");
      renderCredentialLines(elements.roleSummary, role.split(/,\s*/u).map((line, index, list) => index < list.length - 1 ? `${line},` : line));
      renderAppointmentRoles(settings.professional_title);
    }
    if (settings.academic_appointment) renderAppointmentRoles(settings.academic_appointment);
    if (settings.team_role) {
      const teamRole = settings.team_role.replace(/\s*[·–—]\s*/u, ", ");
      renderCredentialLines(elements.teamRoleSummary, teamRole.split(/,\s*/u).map((line, index, list) => index < list.length - 1 ? `${line},` : line));
    }
    if (settings.location) {
      renderCredentialLines(elements.locationSummary, [settings.location, "United States"]);
    }
    if (settings.languages) elements.languageList.textContent = settings.languages;
    renderFocus(settings.clinical_focus || [
      "Sports Medicine",
      "Physical Medicine & Rehabilitation",
      "Pain Management & Interventional Spine",
      "Women’s Musculoskeletal Health",
      "Musculoskeletal Ultrasound",
      "Cycling & Running Medicine",
    ].join("\n"));
    renderTextList(elements.affiliationList, settings.affiliations);
    renderTextList(elements.trainingList, settings.training);

    const portraitUrl = safeUrl(settings.portrait_url);
    if (portraitUrl) {
      const portrait = make("img");
      portrait.src = portraitUrl;
      portrait.alt = "Portrait of Dr. Laurenie Louissaint";
      portrait.decoding = "async";
      portrait.width = 1285;
      portrait.height = 1800;
      portrait.addEventListener("error", () => {
        portrait.src = "/assets/images/dr-laurenie-louissaint-headshot.jpg";
      }, { once: true });
      elements.portrait.replaceChildren(portrait);
    }

    const appointmentPhone = phoneHref(settings.appointment_phone);
    if (appointmentPhone) {
      elements.appointmentPhone.textContent = settings.appointment_phone;
      elements.appointmentRequestForm.dataset.phone = appointmentPhone;
    }

    const bookingLinks = [
      ["Official appointment profile", settings.appointment_url, true],
      ["Zocdoc", settings.zocdoc],
      ["WebMD", settings.webmd],
    ];
    elements.bookingLinks.replaceChildren();
    elements.appointmentRequestForm.dataset.appointmentUrl = safeUrl(settings.appointment_url);
    for (const [label, value, primary = false] of bookingLinks) {
      const url = safeUrl(value);
      if (!url) continue;
      const link = make("a", primary ? "primary-booking" : "", label);
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      elements.bookingLinks.append(link);
    }

    const credentialLinks = [
      ["One Brooklyn Health", settings.one_brooklyn],
      ["Healthgrades", settings.healthgrades],
      ["Doximity", settings.doximity],
      ["NPI Registry", settings.npi],
    ];
    elements.credentialLinks.replaceChildren();
    for (const [label, value] of credentialLinks) {
      const url = safeUrl(value);
      if (!url) continue;
      const link = make("a", "", label);
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      elements.credentialLinks.append(link);
    }

    const links = [
      ["LinkedIn", settings.linkedin],
      ["Instagram", settings.instagram],
      ["TikTok", settings.tiktok],
      ["Google Scholar", settings.scholar],
      ["ORCID", settings.orcid],
      ["Professional profile", settings.other_link],
    ];
    renderSocialLinks(elements.socialLinks, links.slice(0, 3));
    renderSocialLinks(elements.heroSocialLinks, links.slice(0, 3));
    renderSocialLinks(elements.profileSocialLinks, links.slice(0, 3), { showLabel: true });
    renderLatestSocialPost(settings);

    const headerLinks = [
      [elements.headerLinkedin, settings.linkedin],
      [elements.headerInstagram, settings.instagram],
      [elements.headerTiktok, settings.tiktok],
    ];
    for (const [link, value] of headerLinks) {
      const url = safeUrl(value);
      link.hidden = !url;
      if (url) link.href = url;
    }
  }

  function renderCounts() {
    if (elements.pubCount) elements.pubCount.textContent = String(state.entries.filter((entry) => entry.type === "publication").length).padStart(2, "0");
    if (elements.eventCount) elements.eventCount.textContent = String(state.entries.filter((entry) => entry.type === "event").length).padStart(2, "0");
    if (elements.entryCount) elements.entryCount.textContent = String(state.entries.length).padStart(2, "0");
  }

  function renderAll() {
    renderSettings();
    renderCounts();
    renderJourney();
    renderPublications();
    renderCards("event", elements.eventList, "event", "Upcoming and past engagements will appear here.");
    renderCards("news", elements.newsList, "news", "News and reflections will appear here.");
  }

  function restoreInitialAnchor(hash) {
    if (!hash || hash === "#") return;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;

    const settle = () => {
      if (window.location.hash === hash) target.scrollIntoView({ block: "start" });
    };

    const fontsReady = document.fonts?.ready || Promise.resolve();
    fontsReady.then(() => requestAnimationFrame(() => requestAnimationFrame(settle)));
  }

  function searchEntries(query) {
    const normalized = query.trim().toLocaleLowerCase();
    elements.searchResults.replaceChildren();
    if (!normalized) {
      elements.searchResults.append(make("p", "search-hint", "Type a title, topic, or keyword."));
      return;
    }

    const matches = state.entries.filter((entry) => [
      entry.title,
      entry.category,
      entry.summary,
      entry.body,
      entry.type,
    ].some((value) => String(value || "").toLocaleLowerCase().includes(normalized))).slice(0, 20);

    if (!matches.length) {
      elements.searchResults.append(make("p", "search-hint", "No entries matched your search."));
      return;
    }

    for (const entry of matches) {
      const result = make("button", "search-result");
      result.type = "button";
      result.append(make("span", "", entry.title), make("small", "", `${entry.type} · ${entry.category || prettyDate(entry.date)}`));
      result.addEventListener("click", () => {
        elements.searchDialog.close();
        openDetail(entry);
      });
      elements.searchResults.append(result);
    }
  }

  function setUpHighlights() {
    const tabs = [...elements.highlightTabs.querySelectorAll("[role='tab']")];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let rotationTimer = 0;
    let highlightsVisible = false;
    let manuallySelected = false;

    const stopRotation = () => {
      window.clearInterval(rotationTimer);
      rotationTimer = 0;
    };

    const startRotation = () => {
      stopRotation();
      if (reducedMotion.matches || document.hidden || !highlightsVisible || manuallySelected) return;
      rotationTimer = window.setInterval(() => {
        const index = highlightIds.indexOf(state.activeHighlight);
        activateHighlight(highlightIds[(index + 1) % highlightIds.length], { restart: false });
      }, 8000);
    };

    function activateHighlight(id, { focus = false, updateHash = false, scroll = false, restart = true } = {}) {
      if (id === "publications") id = "journal";
      if (!highlightIds.includes(id)) return;
      state.activeHighlight = id;
      for (const tab of tabs) {
        const selected = tab.dataset.highlight === id;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        if (selected && focus) tab.focus();
      }
      for (const panelId of highlightIds) {
        const panel = byId(panelId);
        panel.hidden = panelId !== id;
      }
      if (updateHash) window.history.pushState(null, "", `#${id}`);
      if (scroll) {
        elements.highlights.scrollIntoView({
          behavior: reducedMotion.matches ? "auto" : "smooth",
          block: "start",
        });
      }
      if (restart) startRotation();
    }

    for (const tab of tabs) {
      tab.addEventListener("click", () => {
        manuallySelected = true;
        activateHighlight(tab.dataset.highlight, { updateHash: true });
      });
      tab.addEventListener("keydown", (event) => {
        const current = highlightIds.indexOf(state.activeHighlight);
        let next = current;
        if (event.key === "ArrowRight") next = (current + 1) % highlightIds.length;
        if (event.key === "ArrowLeft") next = (current - 1 + highlightIds.length) % highlightIds.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = highlightIds.length - 1;
        if (next !== current) {
          event.preventDefault();
          manuallySelected = true;
          activateHighlight(highlightIds[next], { focus: true, updateHash: true });
        }
      });
    }

    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href^='#']");
      if (!link) return;
      const requestedId = decodeURIComponent(link.getAttribute("href").slice(1));
      const id = requestedId === "publications" ? "journal" : requestedId;
      if (!highlightIds.includes(id)) return;
      event.preventDefault();
      manuallySelected = true;
      activateHighlight(id, { updateHash: true, scroll: true });
    });

    window.addEventListener("popstate", () => {
      const requestedId = decodeURIComponent(window.location.hash.slice(1));
      const id = requestedId === "publications" ? "journal" : requestedId;
      if (highlightIds.includes(id)) activateHighlight(id, { scroll: true });
    });
    elements.highlights.addEventListener("mouseenter", stopRotation);
    elements.highlights.addEventListener("mouseleave", startRotation);
    elements.highlights.addEventListener("pointerdown", () => {
      manuallySelected = true;
      stopRotation();
    });
    elements.highlights.addEventListener("focusin", stopRotation);
    elements.highlights.addEventListener("focusout", () => {
      window.setTimeout(() => {
        if (!elements.highlights.contains(document.activeElement)) startRotation();
      }, 0);
    });
    document.addEventListener("visibilitychange", () => (document.hidden ? stopRotation() : startRotation()));
    reducedMotion.addEventListener?.("change", startRotation);

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      highlightsVisible = entry.isIntersecting;
      if (highlightsVisible) startRotation();
      else stopRotation();
    }, { threshold: 0.2 });
    visibilityObserver.observe(elements.highlights);

    const requestedInitialId = decodeURIComponent(window.location.hash.slice(1));
    const initialId = requestedInitialId === "publications" ? "journal" : requestedInitialId;
    activateHighlight(highlightIds.includes(initialId) ? initialId : "journey");
  }

  function setUpInteractions() {
    elements.menuToggle.addEventListener("click", () => {
      const open = elements.nav.classList.toggle("open");
      elements.menuToggle.setAttribute("aria-expanded", String(open));
    });
    elements.nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        elements.nav.classList.remove("open");
        elements.menuToggle.setAttribute("aria-expanded", "false");
      }
    });

    elements.searchToggle.addEventListener("click", () => {
      elements.searchDialog.showModal();
      elements.searchInput.focus();
      searchEntries("");
    });
    elements.searchInput.addEventListener("input", () => searchEntries(elements.searchInput.value));
    elements.detailClose.addEventListener("click", () => elements.detailDialog.close());
    elements.appointmentDialogClose.addEventListener("click", () => elements.appointmentDialog.close());

    const updateRequestForm = () => {
      const patientRequest = elements.inquiryType.value === "patient";
      elements.patientRequestFields.hidden = !patientRequest;
      elements.professionalRequestFields.hidden = patientRequest;
      elements.appointmentInterest.required = patientRequest;
      for (const fieldName of ["name", "email", "message"]) {
        elements.appointmentRequestForm.elements.namedItem(fieldName).required = !patientRequest;
      }
      elements.appointmentSubmit.textContent = patientRequest ? "Continue" : "Send request";
      elements.requestFormMessage.textContent = "";
      elements.requestFormMessage.className = "request-form-message";
    };

    const openRequestForm = (requestType = "patient") => {
      elements.appointmentRequestForm.reset();
      elements.inquiryType.value = requestType;
      elements.appointmentRequestForm.elements.namedItem("started_at").value = String(Date.now());
      updateRequestForm();
      elements.appointmentDialog.showModal();
      elements.inquiryType.focus();
    };

    elements.inquiryType.addEventListener("change", updateRequestForm);
    for (const trigger of document.querySelectorAll(".appointment-trigger")) {
      trigger.addEventListener("click", () => openRequestForm(trigger.dataset.inquiry || "patient"));
    }
    elements.appointmentRequestForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(elements.appointmentRequestForm);
      const requestType = formData.get("request_type");
      const route = formData.get("route");
      const appointmentUrl = safeUrl(elements.appointmentRequestForm.dataset.appointmentUrl);
      const appointmentPhone = elements.appointmentRequestForm.dataset.phone || "";

      if (requestType === "patient") {
        elements.appointmentDialog.close();
        if (route === "phone" && appointmentPhone) {
          window.location.href = appointmentPhone;
        } else if (appointmentUrl) {
          window.open(appointmentUrl, "_blank", "noopener,noreferrer");
        } else {
          byId("appointments").scrollIntoView({ behavior: "smooth", block: "start" });
        }
        return;
      }

      elements.appointmentSubmit.disabled = true;
      elements.requestFormMessage.textContent = "Sending…";
      try {
        const response = await fetch("/api/inquiries", {
          method: "POST",
          headers: { accept: "application/json", "content-type": "application/json" },
          body: JSON.stringify(Object.fromEntries(formData.entries())),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "The request could not be sent.");
        elements.requestFormMessage.textContent = payload.message;
        elements.requestFormMessage.className = "request-form-message success";
        elements.appointmentRequestForm.reset();
        elements.inquiryType.value = requestType;
        elements.appointmentRequestForm.elements.namedItem("started_at").value = String(Date.now());
        updateRequestForm();
        elements.requestFormMessage.textContent = payload.message;
        elements.requestFormMessage.className = "request-form-message success";
      } catch (error) {
        elements.requestFormMessage.textContent = error.message;
        elements.requestFormMessage.className = "request-form-message error";
      } finally {
        elements.appointmentSubmit.disabled = false;
      }
    });

    for (const dialog of [elements.searchDialog, elements.detailDialog, elements.appointmentDialog]) {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
    }
    setUpHighlights();
  }

  async function loadContent() {
    const initialHash = window.location.hash;
    try {
      const response = await fetch("/api/site", {
        cache: "no-store",
        headers: { accept: "application/json" },
      });
      if (!response.ok) throw new Error(`Content request failed with ${response.status}`);
      const payload = await response.json();
      state.settings = payload.settings || {};
      state.entries = Array.isArray(payload.entries) ? payload.entries : [];
    } catch (error) {
      console.error("Unable to load site content.", error);
      document.body.classList.add("content-unavailable");
    }
    renderAll();
    restoreInitialAnchor(initialHash);
  }

  function initialize() {
    Object.assign(elements, {
      academicAppointment: byId("academicAppointment"),
      affiliationList: byId("affiliationList"),
      aboutLead: byId("aboutLead"),
      appointmentDialog: byId("appointmentDialog"),
      appointmentDialogClose: byId("appointmentDialogClose"),
      appointmentInterest: byId("appointmentInterest"),
      appointmentPhone: byId("appointmentPhone"),
      appointmentRequestForm: byId("appointmentRequestForm"),
      appointmentSubmit: document.querySelector(".appointment-submit"),
      bookingLinks: byId("bookingLinks"),
      credentialLine: byId("credentialLine"),
      credentialLinks: byId("credentialLinks"),
      detailBody: byId("detailBody"),
      detailClose: byId("detailClose"),
      detailDialog: byId("detailDialog"),
      entryCount: byId("entryCount"),
      eventCount: byId("eventCount"),
      eventList: byId("eventList"),
      focusList: byId("focusList"),
      heroAppointment: byId("heroAppointment"),
      heroIntro: byId("heroIntro"),
      heroSocialLinks: byId("heroSocialLinks"),
      headerInstagram: byId("headerInstagram"),
      headerLinkedin: byId("headerLinkedin"),
      headerTiktok: byId("headerTiktok"),
      highlights: byId("professional-highlights"),
      highlightTabs: byId("highlightTabs"),
      journeyList: byId("journeyList"),
      languageList: byId("languageList"),
      latestSocialLabel: byId("latestSocialLabel"),
      latestSocialPost: byId("latestSocialPost"),
      inquiryType: byId("inquiryType"),
      locationSummary: byId("locationSummary"),
      menuToggle: byId("menuToggle"),
      nav: byId("nav"),
      newsList: byId("newsList"),
      portrait: byId("portrait"),
      patientRequestFields: byId("patientRequestFields"),
      professionalRequestFields: byId("professionalRequestFields"),
      profileSocialLinks: byId("profileSocialLinks"),
      roleSummary: byId("roleSummary"),
      pubCount: byId("pubCount"),
      publicationList: byId("publicationList"),
      searchDialog: byId("searchDialog"),
      searchInput: byId("searchInput"),
      searchResults: byId("searchResults"),
      searchToggle: byId("searchToggle"),
      socialLinks: byId("socialLinks"),
      requestFormMessage: byId("requestFormMessage"),
      teamRoleSummary: byId("teamRoleSummary"),
      trainingList: byId("trainingList"),
    });
    byId("year").textContent = String(new Date().getFullYear());
    setUpInteractions();
    loadContent();
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();
