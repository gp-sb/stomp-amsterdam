/* ============================================================
   STOMP — admin dashboard (proof of concept)
   Schema-driven editor for every section of data/content.json.
   Edits save to a local draft (localStorage) so they show on the
   site on this device; Export content.json to publish for everyone.
   The gate is client-side only and NOT real security.
   ============================================================ */
(function () {
  const DEMO_CODE = "stomp";
  const $ = (s, r = document) => r.querySelector(s);
  let model = null, activeTab = "events", editingIndex = null;

  const SELECTS = {
    type: ["THE PARTY", "THE CLASS"],
    status: ["on-sale", "few-left", "sold-out", "free"],
    level: ["Beginner", "Intermediate", "Advanced"],
    icon: ["heart", "instagram", "whatsapp"],
    color: ["denim", "butter"]
  };

  const TABS = [
    { id: "events", label: "Events", key: "events", titleField: "title", metaFn: (e) => `${e.date || "?"} · ${e.type || ""} · ${e.status || ""}`,
      fields: [
        { name: "title", label: "Title", type: "text" },
        { name: "lumaUrl", label: "Luma link (autofills details when API key is set)", type: "text", placeholder: "https://lu.ma/your-event" },
        { name: "type", label: "Type", type: "select", options: SELECTS.type },
        { name: "status", label: "Status", type: "select", options: SELECTS.status },
        { name: "date", label: "Date", type: "date" }, { name: "start", label: "Start", type: "time" }, { name: "end", label: "End", type: "time" },
        { name: "venue", label: "Venue", type: "text" }, { name: "city", label: "City", type: "text" },
        { name: "blurb", label: "Short blurb", type: "textarea" }
      ] },
    { id: "tutorials", label: "Tutorials", key: "tutorials", titleField: "title", metaFn: (t) => `${t.level || ""} · ${t.duration || ""}`,
      fields: [
        { name: "title", label: "Dance name", type: "text" },
        { name: "level", label: "Level", type: "select", options: SELECTS.level },
        { name: "duration", label: "Duration", type: "text", placeholder: "5 min" },
        { name: "url", label: "Video link (YouTube / Drive)", type: "text" },
        { name: "thumb", label: "Thumbnail URL", type: "text" }
      ] },
    { id: "sisterClubs", label: "Sister clubs", key: "sisterClubs", titleField: "name", metaFn: (c) => `${c.city || ""}`,
      fields: [
        { name: "name", label: "Club name", type: "text" }, { name: "city", label: "City", type: "text" },
        { name: "url", label: "Link", type: "text" }, { name: "note", label: "Note", type: "text" }
      ] },
    { id: "keyLinks", label: "Key links", key: "keyLinks", titleField: "label", metaFn: (k) => k.url || "",
      fields: [
        { name: "label", label: "Label", type: "text" }, { name: "sub", label: "Subtitle", type: "text" },
        { name: "url", label: "URL", type: "text" }, { name: "icon", label: "Icon", type: "select", options: SELECTS.icon }
      ] },
    { id: "waysToDance", label: "Ways to dance", key: "waysToDance", titleField: "name", metaFn: (w) => w.level || "",
      fields: [
        { name: "name", label: "Name", type: "text" }, { name: "level", label: "Level", type: "text" },
        { name: "color", label: "Card colour", type: "select", options: SELECTS.color },
        { name: "image", label: "Image URL", type: "text" }, { name: "blurb", label: "Blurb", type: "textarea" }
      ] },
    { id: "text", label: "Text & links", type: "fields",
      fields: [
        { path: "brand.tagline", label: "Tagline" },
        { path: "hero.kicker", label: "Hero kicker" },
        { path: "hero.headline", label: "Hero headline" },
        { path: "hero.sub", label: "Hero subtext", type: "textarea" },
        { path: "hero.poster", label: "Hero poster image URL" },
        { path: "about.lead", label: "About — lead line" },
        { path: "about.highlight", label: "About — highlighted phrase" },
        { path: "about.body", label: "About — body", type: "textarea" },
        { path: "about.fullStoryUrl", label: "About — full story link" },
        { path: "privateEvents.headline", label: "Private events — headline" },
        { path: "privateEvents.body", label: "Private events — body", type: "textarea" },
        { path: "privateEvents.inquireUrl", label: "Private events — inquire link" },
        { path: "footer.blurb", label: "Footer blurb", type: "textarea" }
      ] }
  ];

  const getPath = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
  function setPath(o, p, v) { const ks = p.split("."); let c = o; for (let i = 0; i < ks.length - 1; i++) { c[ks[i]] = c[ks[i]] || {}; c = c[ks[i]]; } c[ks[ks.length - 1]] = v; }

  function initGate() {
    $("#gate-form").addEventListener("submit", (e) => {
      e.preventDefault();
      if ($("#gate-input").value.trim().toLowerCase() === DEMO_CODE) { $("#gate").style.display = "none"; boot(); }
      else { $("#gate-err").textContent = "Wrong code. (demo: stomp)"; $("#gate-input").value = ""; }
    });
  }

  async function loadModel() {
    const draft = window.StompStore.loadDraft();
    if (draft) { model = draft; return; }
    try { model = await window.StompStore.loadPublished(); } catch (_) { model = { brand: {}, events: [] }; }
  }

  function persist() { model.brand = model.brand || {}; model.brand.updated = new Date().toISOString().slice(0, 10); window.StompStore.saveDraft(model); updateState(); }
  function updateState() { const has = window.StompStore.hasDraft(); $("#state").textContent = has ? "Local draft active" : "Showing published"; $("#discard-btn").hidden = !has; }

  function renderTabs() {
    const nav = $("#tabs"); nav.innerHTML = "";
    TABS.forEach((t) => {
      const b = document.createElement("button"); b.className = "admin-tab"; b.textContent = t.label;
      b.setAttribute("aria-selected", t.id === activeTab);
      b.addEventListener("click", () => { activeTab = t.id; editingIndex = null; renderTabs(); renderPanel(); });
      nav.appendChild(b);
    });
  }

  function fieldInput(f, val) {
    const id = "f_" + (f.name || f.path).replace(/\W/g, "_");
    let inner;
    if (f.type === "textarea") inner = `<textarea id="${id}">${val == null ? "" : String(val).replace(/</g, "&lt;")}</textarea>`;
    else if (f.type === "select") inner = `<select id="${id}">${f.options.map((o) => `<option ${o === val ? "selected" : ""}>${o}</option>`).join("")}</select>`;
    else inner = `<input id="${id}" type="${f.type === "date" ? "date" : f.type === "time" ? "time" : "text"}" value="${val == null ? "" : String(val).replace(/"/g, "&quot;")}" placeholder="${f.placeholder || ""}">`;
    return `<div class="field"><label for="${id}">${f.label}</label>${inner}</div>`;
  }

  function renderPanel() {
    const tab = TABS.find((t) => t.id === activeTab);
    const panel = $("#panel");
    if (tab.type === "fields") {
      panel.innerHTML = `<h2>${tab.label}</h2><p class="panel__hint">Edit site copy. Changes save instantly to your local draft.</p>` +
        tab.fields.map((f) => fieldInput(f, getPath(model, f.path))).join("");
      tab.fields.forEach((f) => {
        const inp = $("#f_" + f.path.replace(/\W/g, "_"));
        inp.addEventListener("input", () => { setPath(model, f.path, inp.value); persist(); });
      });
      return;
    }
    model[tab.key] = model[tab.key] || [];
    const editing = editingIndex != null ? model[tab.key][editingIndex] : {};
    panel.innerHTML = `
      <h2>${editingIndex != null ? "Edit" : "Add"} ${tab.label.replace(/s$/, "").toLowerCase()}</h2>
      <p class="panel__hint">Changes save instantly to your local draft and show on the site on this device.</p>
      <form id="entity-form">${tab.fields.map((f) => fieldInput(f, editing[f.name])).join("")}
        <div class="form-actions">
          <button class="btn btn--rodeo" type="submit">${editingIndex != null ? "Save changes" : "Add"}</button>
          ${editingIndex != null ? '<button class="btn btn--ghost" type="button" id="cancel-btn">Cancel</button>' : ""}
        </div>
      </form>
      <div class="item-list" id="item-list"></div>`;

    $("#entity-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const obj = editingIndex != null ? model[tab.key][editingIndex] : {};
      tab.fields.forEach((f) => { obj[f.name] = $("#f_" + f.name).value; });
      if (tab.id === "events") { if (!obj.id) obj.id = "evt-" + Math.random().toString(36).slice(2, 7); if (!obj.ticketUrl || editingIndex != null) obj.ticketUrl = obj.lumaUrl; }
      if (editingIndex == null) model[tab.key].push(obj);
      editingIndex = null; persist(); renderPanel(); toast("Saved");
    });
    if ($("#cancel-btn")) $("#cancel-btn").addEventListener("click", () => { editingIndex = null; renderPanel(); });

    const list = $("#item-list");
    model[tab.key].forEach((it, i) => {
      const row = document.createElement("div"); row.className = "item" + (i === editingIndex ? " is-editing" : "");
      row.innerHTML = `<div class="item__main"><div class="item__title">${(it[tab.titleField] || "Untitled")}</div><div class="item__meta">${tab.metaFn(it)}</div></div>
        <div class="item__btns"><button class="icon-btn" data-edit>✎</button><button class="icon-btn icon-btn--danger" data-del>✕</button></div>`;
      row.querySelector("[data-edit]").addEventListener("click", () => { editingIndex = i; renderPanel(); window.scrollTo({ top: 0, behavior: "smooth" }); });
      row.querySelector("[data-del]").addEventListener("click", () => { if (confirm("Delete this item?")) { model[tab.key].splice(i, 1); if (editingIndex === i) editingIndex = null; persist(); renderPanel(); toast("Deleted"); } });
      list.appendChild(row);
    });
  }

  function exportJSON() {
    persist();
    const blob = new Blob([JSON.stringify(model, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "content.json"; a.click(); URL.revokeObjectURL(a.href);
    toast("content.json downloaded");
  }
  function importJSON(file) { const r = new FileReader(); r.onload = () => { try { model = JSON.parse(r.result); persist(); renderPanel(); toast("Imported"); } catch (_) { toast("Invalid JSON"); } }; r.readAsText(file); }

  let tt; function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 1800); }

  async function boot() {
    await loadModel(); updateState(); renderTabs(); renderPanel();
    $("#export-btn").addEventListener("click", exportJSON);
    $("#import-input").addEventListener("change", (e) => { if (e.target.files[0]) importJSON(e.target.files[0]); e.target.value = ""; });
    $("#discard-btn").addEventListener("click", () => { if (confirm("Discard local draft and revert to published content?")) { window.StompStore.clearDraft(); boot(); toast("Draft discarded"); } });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initGate); else initGate();
})();
