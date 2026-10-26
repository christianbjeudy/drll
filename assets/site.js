(() => {
  "use strict";

  const state = {
    entries: [],
    settings: {},
    publicationFilter: "all",
  };

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
    elements.focusList.replaceChildren();
    items.forEach((item, index) => {
      const article = make("article");
      article.append(
        make("span", "", String(index + 1).padStart(2, "0")),
        make("h3", "", item),
        make("p", "", descriptions[item] || "A current area of clinical and academic focus."),
      );
      elements.focusList.append(article);
    });
  }

  function imageFor(entry, className = "") {
    const source = safeUrl(entry.image_url);
    if (!source) return null;
    const image = make("img", className);
    image.src = source;
    image.alt = entry.title ? `${entry.title} cover` : "Archive image";
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
      const link = make("a", "detail-resource", "Open external resource ↗");
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
      elements.journeyList.append(emptyMessage("Milestones will appear here as the archive grows.", "empty-inline"));
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
      button.append(copy, make("span", "category", entry.category || "Publication"), make("span", "arrow", "↗"));
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
    bottom.append(make("span", "", "↗"));
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
      elements.mediaList.append(emptyMessage("Images and media from the archive will appear here."));
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
    } else {
      elements.contactEmail.removeAttribute("href");
      elements.contactEmail.classList.add("is-disabled");
    }

    const bookingLinks = [
      ["Official appointment profile", settings.appointment_url, true],
      ["One Brooklyn Health", settings.one_brooklyn],
      ["Zocdoc", settings.zocdoc],
      ["Healthgrades", settings.healthgrades],
      ["Doximity", settings.doximity],
      ["WebMD", settings.webmd],
      ["NPI Registry", settings.npi],
    ];
    elements.bookingLinks.replaceChildren();
    for (const [label, value, primary = false] of bookingLinks) {
      const url = safeUrl(value);
      if (!url) continue;
      const link = make("a", primary ? "primary-booking" : "");
      link.append(make("span", "", label), make("span", "", "↗"));
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      elements.bookingLinks.append(link);
    }

    const links = [
      ["LinkedIn", settings.linkedin],
      ["Instagram", settings.instagram],
      ["Doximity", settings.doximity],
      ["Google Scholar", settings.scholar],
      ["ORCID", settings.orcid],
      ["Professional profile", settings.other_link],
    ];
    elements.socialLinks.replaceChildren();
    for (const [label, value] of links) {
      const url = safeUrl(value);
      if (!url) continue;
      const link = make("a", "", `${label} ↗`);
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      elements.socialLinks.append(link);
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
      elements.searchResults.append(make("p", "search-hint", "No archive entries matched your search."));
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
      console.error("Unable to load archive content.", error);
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
      detailBody: byId("detailBody"),
      detailClose: byId("detailClose"),
      detailDialog: byId("detailDialog"),
      entryCount: byId("entryCount"),
      eventCount: byId("eventCount"),
      eventList: byId("eventList"),
      focusList: byId("focusList"),
      heroAppointment: byId("heroAppointment"),
      heroIntro: byId("heroIntro"),
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
      trainingList: byId("trainingList"),
    });
    byId("year").textContent = String(new Date().getFullYear());
    setUpInteractions();
    loadContent();
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();
