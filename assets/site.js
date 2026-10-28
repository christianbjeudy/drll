(() => {
  "use strict";

  const state = {
    entries: [],
    settings: {},
    publicationFilter: "all",
    activeHighlight: "journey",
  };

  const highlightIds = ["journey", "publications", "events", "journal", "media"];

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
      "Musculoskeletal Ultrasound": "Ultrasound-supported assessment and procedural care.",
      "Cycling & Running Medicine": "Movement-focused care for endurance athletes and active patients.",
    };
    const expandedDescriptions = {
      "Sports Medicine": {
        overview: "Clinical interests include sports and overuse injuries, return-to-activity planning, and care organized around each patient’s movement goals.",
        points: ["Evaluation of sports, overuse, and activity-related concerns", "Individualized rehabilitation and return-to-activity planning", "Collaboration with therapists, trainers, and care teams"],
        detail: "This approach connects careful diagnosis with practical recovery planning so active patients can move forward with confidence and clear next steps.",
      },
      "Physical Medicine & Rehabilitation": {
        overview: "A function-first approach to conditions affecting muscles, joints, nerves, and mobility, with an emphasis on independence and quality of life.",
        points: ["Assessment of muscles, joints, nerves, and mobility", "Rehabilitation strategies designed around daily and athletic goals", "Emphasis on independence, participation, and quality of life"],
        detail: "Care is framed around the whole person, connecting medical findings to the movements, responsibilities, and activities that shape everyday life.",
      },
      "Pain Management": {
        overview: "Thoughtful assessment of musculoskeletal pain using rehabilitation, procedural, and lifestyle strategies when appropriate.",
        points: ["Evaluation of musculoskeletal and activity-related pain", "Rehabilitation, recovery, and lifestyle strategies", "Selected procedure options when clinically appropriate"],
        detail: "The goal is to understand how pain affects function, then build a balanced plan that supports sustainable progress rather than a one-size-fits-all response.",
      },
      "Interventional Spine": {
        overview: "Fellowship-informed evaluation of spine-related pain and selected image-guided treatment options.",
        points: ["Assessment of spine-related pain and function", "Non-operative care planning informed by fellowship training", "Selected image-guided treatment options when appropriate"],
        detail: "A detailed history and physical examination help connect symptoms with mobility and function before treatment options are considered.",
      },
      "Musculoskeletal Ultrasound": {
        overview: "Real-time ultrasound may support soft-tissue and joint evaluation and help guide selected procedures with precision.",
        points: ["Real-time soft-tissue and joint visualization", "Dynamic evaluation when movement matters", "Guidance for selected procedures when clinically appropriate"],
        detail: "Because ultrasound can show structures in motion, it can add useful context to an examination and support precise, patient-centered decision-making.",
      },
      "Cycling & Running Medicine": {
        overview: "Care for endurance athletes and active patients may include training-related concerns, biomechanics, recovery, and safe return to sport.",
        points: ["Training-related and overuse concerns", "Biomechanics, recovery, and training-load considerations", "Safe return to endurance activity and sport"],
        detail: "Her perspective as a cyclist complements clinical training with an appreciation for endurance, consistency, equipment, and the realities of returning to sport.",
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
        overview: "Learn more about this area of Dr. Louissaint’s clinical and academic work.",
        points: [],
        detail: "Each clinical plan is informed by the individual’s goals, function, and overall health.",
      };
      more.append(make("p", "", expanded.overview));
      if (expanded.points.length) {
        const list = make("ul");
        list.append(...expanded.points.map((point) => make("li", "", point)));
        more.append(list);
      }
      more.append(make("p", "expertise-detail", expanded.detail));
      card.append(summary, more);
      elements.focusList.append(card);
    });
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
    const category = make("span", "eyebrow purple", `${entry.category || entry.type} · ${prettyDate(entry.date)}`);
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

  function renderJourney() {
    const entries = state.entries.filter((entry) => entry.type === "milestone");
    elements.journeyList.replaceChildren();
    if (!entries.length) {
      elements.journeyList.append(emptyMessage("Professional milestones will appear here as this profile grows.", "empty-inline"));
      return;
    }

    for (const entry of entries) {
      const row = make("article", "timeline-entry");
      row.append(make("div", "year", prettyDate(entry.date, { yearOnly: true })));
      const copy = make("div");
      copy.append(make("h3", "", entry.title));
      if (entry.summary) copy.append(make("p", "", entry.summary));
      row.append(copy, make("div", "tag", entry.category || "Milestone"));
      if (entry.body || entry.external_url) {
        row.tabIndex = 0;
        row.setAttribute("role", "button");
        row.setAttribute("aria-label", `Read ${entry.title}`);
        row.addEventListener("click", () => openDetail(entry));
        row.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") openDetail(entry);
        });
      }
      elements.journeyList.append(row);
    }
  }

  function renderPublicationFilters(publications) {
    const categories = [...new Set(publications.map((entry) => entry.category).filter(Boolean))].sort();
    elements.pubFilters.replaceChildren();

    const filters = [{ value: "all", label: "All work" }, ...categories.map((category) => ({
      value: category,
      label: category,
    }))];

    for (const filter of filters) {
      const button = make("button", `chip${state.publicationFilter === filter.value ? " active" : ""}`, filter.label);
      button.type = "button";
      button.dataset.filter = filter.value;
      button.setAttribute("aria-pressed", String(state.publicationFilter === filter.value));
      button.addEventListener("click", () => {
        state.publicationFilter = filter.value;
        renderPublications();
      });
      elements.pubFilters.append(button);
    }
  }

  function renderPublications() {
    const publications = state.entries.filter((entry) => entry.type === "publication");
    if (state.publicationFilter !== "all" && !publications.some((entry) => entry.category === state.publicationFilter)) {
      state.publicationFilter = "all";
    }
    renderPublicationFilters(publications);
    const visible = state.publicationFilter === "all"
      ? publications
      : publications.filter((entry) => entry.category === state.publicationFilter);

    elements.publicationList.replaceChildren();
    elements.pubSummary.textContent = `${visible.length} ${visible.length === 1 ? "entry" : "entries"}`;
    if (!visible.length) {
      elements.publicationList.append(emptyMessage("Published work will be added to this library soon."));
      return;
    }

    for (const entry of visible) {
      const button = make("button", "publication-item");
      button.type = "button";
      button.append(make("span", "pub-year", prettyDate(entry.date, { yearOnly: true })));
      const copy = make("span", "publication-copy");
      copy.append(make("h3", "", entry.title));
      if (entry.summary) copy.append(make("p", "", entry.summary));
      button.append(copy, make("span", "category", entry.category || "Publication"));
      button.addEventListener("click", () => openDetail(entry));
      elements.publicationList.append(button);
    }
  }

  function cardFor(entry, kind) {
    const card = make("button", `${kind}-card`);
    card.type = "button";
    const art = make("span", "card-art");
    const image = imageFor(entry);
    art.append(image || make("span", "card-symbol", "✦"));
    const content = make("span", "card-content");
    content.append(make("span", "card-meta", `${entry.category || kind} · ${prettyDate(entry.date)}`));
    content.append(make("h3", "", entry.title));
    if (entry.summary) content.append(make("p", "", entry.summary));
    const bottom = make("span", "card-bottom", "Read more");
    card.append(art, content, bottom);
    card.addEventListener("click", () => openDetail(entry));
    return card;
  }

  function renderCards(type, container, kind, emptyText) {
    const entries = state.entries.filter((entry) => entry.type === type);
    container.replaceChildren();
    if (!entries.length) {
      container.append(emptyMessage(emptyText));
      return;
    }
    for (const entry of entries) container.append(cardFor(entry, kind));
  }

  function renderMedia() {
    const entries = state.entries.filter((entry) => entry.type === "media");
    elements.mediaList.replaceChildren();
    if (!entries.length) {
      elements.mediaList.append(emptyMessage("Professional images and media will appear here."));
      return;
    }

    for (const entry of entries) {
      const button = make("button", "media-item");
      button.type = "button";
      const image = imageFor(entry);
      button.append(image || make("span", "", "LL."));
      button.append(make("span", "media-caption", entry.title));
      button.addEventListener("click", () => openDetail(entry));
      elements.mediaList.append(button);
    }
  }

  function renderSettings() {
    const settings = state.settings;
    if (settings.about) elements.aboutLead.textContent = settings.about;
    if (settings.hero_intro) elements.heroIntro.textContent = settings.hero_intro;
    if (settings.credentials) elements.credentialLine.textContent = settings.credentials;
    if (settings.professional_title) {
      elements.roleSummary.textContent = settings.professional_title;
      elements.academicAppointment.textContent = settings.professional_title;
    }
    if (settings.academic_appointment) elements.academicAppointment.textContent = settings.academic_appointment;
    if (settings.team_role) elements.teamRoleSummary.textContent = settings.team_role;
    if (settings.location) {
      elements.locationSummary.textContent = settings.location;
      elements.appointmentLocation.textContent = settings.location;
    }
    if (settings.languages) elements.languageList.textContent = settings.languages;
    renderFocus(settings.clinical_focus);
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
      elements.appointmentPhone.href = appointmentPhone;
      elements.appointmentPhone.textContent = settings.appointment_phone;
      elements.heroAppointment.href = "#appointments";
    }

    if (settings.email) {
      elements.contactEmail.href = `mailto:${encodeURIComponent(settings.email)}`;
      elements.contactEmail.setAttribute("aria-label", `Email Dr. Louissaint at ${settings.email}`);
      elements.contactEmail.classList.remove("is-disabled");
      elements.contactEmail.hidden = false;
    } else {
      elements.contactEmail.removeAttribute("href");
      elements.contactEmail.classList.add("is-disabled");
      elements.contactEmail.hidden = true;
    }

    const bookingLinks = [
      ["Official appointment profile", settings.appointment_url, true],
      ["Zocdoc", settings.zocdoc],
      ["WebMD", settings.webmd],
    ];
    elements.bookingLinks.replaceChildren();
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
    elements.socialLinks.replaceChildren();
    for (const [label, value] of links) {
      const url = safeUrl(value);
      if (!url) continue;
      const icon = socialIcon(label);
      const link = make("a", icon ? `social-${label.toLowerCase()}` : "", icon ? undefined : label);
      if (icon) {
        link.append(icon);
        link.setAttribute("aria-label", label);
        link.title = label;
      }
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      elements.socialLinks.append(link);
    }

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
    renderMedia();
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
      const id = decodeURIComponent(link.getAttribute("href").slice(1));
      if (!highlightIds.includes(id)) return;
      event.preventDefault();
      manuallySelected = true;
      activateHighlight(id, { updateHash: true, scroll: true });
    });

    window.addEventListener("popstate", () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
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

    const initialId = decodeURIComponent(window.location.hash.slice(1));
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

    for (const dialog of [elements.searchDialog, elements.detailDialog]) {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
    }
    setUpHighlights();
  }

  async function loadContent() {
    const initialHash = window.location.hash;
    try {
      const response = await fetch("/api/site", { headers: { accept: "application/json" } });
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
      appointmentLocation: byId("appointmentLocation"),
      appointmentPhone: byId("appointmentPhone"),
      bookingLinks: byId("bookingLinks"),
      contactEmail: byId("contactEmail"),
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
      headerInstagram: byId("headerInstagram"),
      headerLinkedin: byId("headerLinkedin"),
      headerTiktok: byId("headerTiktok"),
      highlights: byId("professional-highlights"),
      highlightTabs: byId("highlightTabs"),
      journeyList: byId("journeyList"),
      languageList: byId("languageList"),
      locationSummary: byId("locationSummary"),
      mediaList: byId("mediaList"),
      menuToggle: byId("menuToggle"),
      nav: byId("nav"),
      newsList: byId("newsList"),
      portrait: byId("portrait"),
      roleSummary: byId("roleSummary"),
      pubCount: byId("pubCount"),
      pubFilters: byId("pubFilters"),
      publicationList: byId("publicationList"),
      pubSummary: byId("pubSummary"),
      searchDialog: byId("searchDialog"),
      searchInput: byId("searchInput"),
      searchResults: byId("searchResults"),
      searchToggle: byId("searchToggle"),
      socialLinks: byId("socialLinks"),
      teamRoleSummary: byId("teamRoleSummary"),
      trainingList: byId("trainingList"),
    });
    byId("year").textContent = String(new Date().getFullYear());
    setUpInteractions();
    loadContent();
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();
