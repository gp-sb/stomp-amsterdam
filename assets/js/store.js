/* ============================================================
   STOMP — shared content store
   Loads data/content.json (all editable site copy). The admin
   dashboard can keep a local draft in localStorage so edits show
   up instantly on this device; publishing = export content.json
   and commit it (auto-deploys on Vercel).
   ============================================================ */
window.StompStore = (function () {
  const LS_KEY = "stomp.content.draft.v2";
  const JSON_URL = "data/content.json";

  async function loadPublished() {
    const res = await fetch(JSON_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load content.json (" + res.status + ")");
    return res.json();
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }
  function saveDraft(data) { localStorage.setItem(LS_KEY, JSON.stringify(data)); }
  function clearDraft() { localStorage.removeItem(LS_KEY); }
  function hasDraft() { return !!localStorage.getItem(LS_KEY); }

  async function loadForDisplay() {
    const draft = loadDraft();
    if (draft) return { data: draft, source: "draft" };
    return { data: await loadPublished(), source: "published" };
  }

  function sortEvents(events) {
    return [...(events || [])].sort((a, b) => {
      const da = (a.date || "") + (a.start || "");
      const db = (b.date || "") + (b.start || "");
      return da < db ? -1 : da > db ? 1 : 0;
    });
  }

  /* Enrich an event from Luma when it has a lumaUrl. Falls back silently
     to the stored fields if the API/key isn't available (returns null). */
  async function enrichFromLuma(lumaUrl) {
    if (!lumaUrl) return null;
    try {
      const res = await fetch("/api/luma?url=" + encodeURIComponent(lumaUrl));
      if (!res.ok) return null;
      const data = await res.json();
      return data && data.source === "luma" ? data : null;
    } catch (_) { return null; }
  }

  return { loadPublished, loadDraft, saveDraft, clearDraft, hasDraft, loadForDisplay, sortEvents, enrichFromLuma };
})();
