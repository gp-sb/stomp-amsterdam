/* ============================================================
   STOMP — admin dashboard logic (proof of concept)
   - simple client-side gate (NOT real security, see note in UI)
   - add / edit / delete events
   - changes saved to a local draft (localStorage) so they appear
     instantly on the frontend on this device
   - export schedule.json (the file you'd commit to publish for all)
   - import an existing schedule.json
   ============================================================ */
(function () {
  const DEMO_CODE = "stomp"; // POC only — replace with real auth before going live
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let model = null;
  let editingId = null;

  const $ = (s, r = document) => r.querySelector(s);

  function initGate() {
    const gate = $("#gate");
    const input = $("#gate-input");
    const err = $("#gate-err");
    $("#gate-form").addEventListener("submit", (e) => {
      e.preventDefault();
      if (input.value.trim().toLowerCase() === DEMO_CODE) {
        gate.style.display = "none";
        boot();
      } else {
        err.textContent = "Wrong code. (Hint for this demo: stomp)";
        input.value = "";
      }
    });
  }

  async function loadModel() {
    const draft = window.StompStore.loadDraft();
    if (draft) { model = draft; return; }
    try { model = await window.StompStore.loadPublished(); }
    catch (_) { model = { club: { name: "STOMP", city: "Amsterdam", updated: today() }, events: [] }; }
  }

  function today() { return new Date().toISOString().slice(0, 10); }
  function uid() { return "evt-" + Math.random().toString(36).slice(2, 8); }

  function persist() {
    model.club = model.club || {};
    model.club.updated = today();
    window.StompStore.saveDraft(model);
    renderList();
    updateStatusline();
  }

  function readForm() {
    const lineup = $("#f-lineup").value.split(",").map((s) => s.trim()).filter(Boolean);
    return {
      id: editingId || uid(),
      title: $("#f-title").value.trim(),
      date: $("#f-date").value,
      start: $("#f-start").value,
      end: $("#f-end").value,
      room: $("#f-room").value.trim(),
      genre: $("#f-genre").value.trim(),
      status: $("#f-status").value,
      price: $("#f-price").value.trim(),
      lineup,
      blurb: $("#f-blurb").value.trim()
    };
  }

  function fillForm(evt) {
    $("#f-title").value = evt.title || "";
    $("#f-date").value = evt.date || "";
    $("#f-start").value = evt.start || "";
    $("#f-end").value = evt.end || "";
    $("#f-room").value = evt.room || "";
    $("#f-genre").value = evt.genre || "";
    $("#f-status").value = evt.status || "on-sale";
    $("#f-price").value = evt.price || "";
    $("#f-lineup").value = (evt.lineup || []).join(", ");
    $("#f-blurb").value = evt.blurb || "";
  }

  function resetForm() {
    editingId = null;
    $("#event-form").reset();
    $("#f-status").value = "on-sale";
    $("#form-title").textContent = "Add a night";
    $("#submit-btn").textContent = "Add to schedule";
    $("#cancel-btn").hidden = true;
    document.querySelectorAll(".admin-event.is-editing").forEach((n) => n.classList.remove("is-editing"));
  }

  function startEdit(id) {
    const evt = model.events.find((e) => e.id === id);
    if (!evt) return;
    editingId = id;
    fillForm(evt);
    $("#form-title").textContent = "Edit night";
    $("#submit-btn").textContent = "Save changes";
    $("#cancel-btn").hidden = false;
    document.querySelectorAll(".admin-event").forEach((n) => n.classList.toggle("is-editing", n.dataset.id === id));
    $("#event-form").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function removeEvent(id) {
    const evt = model.events.find((e) => e.id === id);
    if (!evt) return;
    if (!confirm(`Delete "${evt.title}" from the schedule?`)) return;
    model.events = model.events.filter((e) => e.id !== id);
    if (editingId === id) resetForm();
    persist();
    toast("Night deleted");
  }

  function fmtDateShort(iso) {
    if (!iso) return { d: "--", m: "" };
    const dt = new Date(iso + "T00:00:00");
    return { d: String(dt.getDate()).padStart(2, "0"), m: MONTHS[dt.getMonth()] };
  }

  function renderList() {
    const wrap = $("#admin-list");
    const events = window.StompStore.sortEvents(model.events || []);
    $("#count").textContent = events.length + (events.length === 1 ? " night" : " nights");
    wrap.innerHTML = "";
    if (!events.length) {
      wrap.innerHTML = `<p style="color:var(--ink-dim)">No nights yet. Add your first one on the left.</p>`;
      return;
    }
    events.forEach((evt) => {
      const d = fmtDateShort(evt.date);
      const row = document.createElement("div");
      row.className = "admin-event";
      row.dataset.id = evt.id;
      row.innerHTML = `
        <div class="admin-event__date"><div class="d">${d.d}</div><div class="m">${d.m}</div></div>
        <div>
          <div class="admin-event__title">${evt.title || "Untitled"}</div>
          <div class="admin-event__meta">${evt.room || "—"} · ${evt.genre || "—"} · ${evt.start || "?"}–${evt.end || "?"} · ${evt.price || ""}</div>
        </div>
        <div class="admin-event__btns">
          <button class="icon-btn" data-edit aria-label="Edit ${evt.title}">✎</button>
          <button class="icon-btn icon-btn--danger" data-del aria-label="Delete ${evt.title}">✕</button>
        </div>`;
      row.querySelector("[data-edit]").addEventListener("click", () => startEdit(evt.id));
      row.querySelector("[data-del]").addEventListener("click", () => removeEvent(evt.id));
      wrap.appendChild(row);
      if (typeof gsap !== "undefined") gsap.from(row, { opacity: 0, y: 10, duration: 0.35, ease: "power2.out" });
    });
  }

  function updateStatusline() {
    const has = window.StompStore.hasDraft();
    $("#draft-state").textContent = has ? "Local draft active" : "Showing published file";
    $("#draft-state").style.color = has ? "var(--acid)" : "var(--ink-dim)";
    $("#discard-btn").hidden = !has;
  }

  function exportJSON() {
    model.club = model.club || {};
    model.club.updated = today();
    const blob = new Blob([JSON.stringify(model, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "schedule.json";
    a.click();
    URL.revokeObjectURL(url);
    toast("schedule.json downloaded");
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed.events) throw new Error("missing events");
        model = parsed;
        persist();
        toast("Imported schedule.json");
      } catch (e) {
        toast("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  }

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  async function boot() {
    await loadModel();
    resetForm();
    renderList();
    updateStatusline();

    $("#event-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const data = readForm();
      if (!data.title || !data.date) { toast("Title and date are required"); return; }
      const idx = model.events.findIndex((x) => x.id === data.id);
      if (idx >= 0) model.events[idx] = data; else model.events.push(data);
      const wasEditing = editingId;
      persist();
      resetForm();
      toast(wasEditing ? "Changes saved" : "Night added");
    });

    $("#cancel-btn").addEventListener("click", (e) => { e.preventDefault(); resetForm(); });
    $("#export-btn").addEventListener("click", exportJSON);
    $("#import-input").addEventListener("change", (e) => { if (e.target.files[0]) importJSON(e.target.files[0]); e.target.value = ""; });
    $("#discard-btn").addEventListener("click", () => {
      if (!confirm("Discard your local draft and revert to the published schedule?")) return;
      window.StompStore.clearDraft();
      boot();
      toast("Draft discarded");
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initGate);
  else initGate();
})();
