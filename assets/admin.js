(() => {
  "use strict";

  const state = {
    entries: [],
    settings: {},
    view: "all",
    editingId: null,
  };

  const elements = {};
  const labels = {
    all: "All entries",
    publication: "Publications",
    event: "Events",
    milestone: "Journey",
    news: "News",
    media: "Media",
    settings: "Professional profile",
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

  function filteredEntries() {
    const query = elements.entrySearch.value.trim().toLocaleLowerCase();
    return state.entries.filter((entry) => {
      if (state.view !== "all" && entry.type !== state.view) return false;
      if (!query) return true;
      return [entry.title, entry.category, entry.summary, entry.type, entry.status]
        .some((value) => String(value || "").toLocaleLowerCase().includes(query));
    });
  }

  function entryRow(entry) {
    const button = make("button", "entry-row");
    button.type = "button";
    button.dataset.id = entry.id;
    const type = make("span", `type-icon type-${entry.type}`, entry.type.slice(0, 1).toUpperCase());
    const copy = make("span", "entry-copy");
    copy.append(make("strong", "", entry.title));
    copy.append(make("small", "", `${entry.category || labels[entry.type]} · Updated ${prettyDate(entry.updated_at?.slice(0, 10))}`));
    const status = make("span", `status status-${entry.status}`, entry.status);
    button.append(type, copy, status);
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

  function renderSettings() {
    fillForm(elements.settingsForm, state.settings);
  }

  async function saveSettings(event) {
    event.preventDefault();
    const submit = elements.settingsForm.querySelector('[type="submit"]');
    submit.disabled = true;
    setMessage(elements.message, "Saving settings…");
    try {
      const data = formObject(elements.settingsForm);
      const file = elements.portraitUpload.files[0];
      if (file) data.portrait_url = await uploadFile(file);
      const payload = await request("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      state.settings = payload.settings;
      renderSettings();
      elements.portraitUpload.value = "";
      setMessage(elements.message, "Site settings saved.", "success");
    } catch (error) {
      setMessage(elements.message, error.message, "error");
    } finally {
      submit.disabled = false;
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
    elements.entriesPane.hidden = settings;
    elements.settingsPane.hidden = !settings;
    elements.newBtn.hidden = settings;
    setMessage(elements.message);
    if (settings) renderSettings();
    else renderEntries();
  }

  async function loadData() {
    const [entryPayload, settingsPayload] = await Promise.all([
      request("/api/admin/entries"),
      request("/api/admin/settings"),
    ]);
    state.entries = entryPayload.entries || [];
    state.settings = settingsPayload.settings || {};
    renderEntries();
    renderSettings();
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
    elements.newBtn.addEventListener("click", () => openEditor());
    elements.entrySearch.addEventListener("input", renderEntries);
    elements.entryForm.addEventListener("submit", saveEntry);
    elements.deleteBtn.addEventListener("click", deleteEntry);
    elements.settingsForm.addEventListener("submit", saveSettings);
    elements.closeEditor.addEventListener("click", () => elements.editor.close());
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
      closeEditor: byId("closeEditor"),
      deleteBtn: byId("deleteBtn"),
      editor: byId("editor"),
      editorMessage: byId("editorMessage"),
      editorTitle: byId("editorTitle"),
      entriesPane: byId("entriesPane"),
      entryCount: byId("entryCount"),
      entryForm: byId("entryForm"),
      entryRows: byId("entryRows"),
      entrySearch: byId("entrySearch"),
      entryUpload: byId("entryUpload"),
      login: byId("login"),
      loginForm: byId("loginForm"),
      loginMsg: byId("loginMsg"),
      logout: byId("logout"),
      message: byId("message"),
      navButtons: [...document.querySelectorAll(".sidebar .nav")],
      newBtn: byId("newBtn"),
      password: byId("password"),
      portraitUpload: byId("portraitUpload"),
      settingsForm: byId("settingsForm"),
      settingsPane: byId("settingsPane"),
      viewTitle: byId("viewTitle"),
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
