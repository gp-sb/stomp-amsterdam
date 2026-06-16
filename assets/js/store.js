/* ============================================================
   STOMP — shared schedule store
   Loads data/schedule.json. For the POC, the admin dashboard can
   override the published file with a local draft kept in
   localStorage so changes show up instantly on the frontend.
   In production this same JSON would be committed to the repo
   (e.g. via a Git-based CMS), which triggers a Vercel redeploy.
   ============================================================ */
window.StompStore = (function () {
  const LS_KEY = "stomp.schedule.draft.v1";
  const JSON_URL = "data/schedule.json";

  async function loadPublished() {
    const res = await fetch(JSON_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load schedule.json (" + res.status + ")");
    return res.json();
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function saveDraft(data) {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }

  function clearDraft() {
    localStorage.removeItem(LS_KEY);
  }

  function hasDraft() {
    return !!localStorage.getItem(LS_KEY);
  }

  async function loadForDisplay() {
    const draft = loadDraft();
    if (draft) return { data: draft, source: "draft" };
    return { data: await loadPublished(), source: "published" };
  }

  function sortEvents(events) {
    return [...events].sort((a, b) => {
      const da = a.date + (a.start || "");
      const db = b.date + (b.start || "");
      return da < db ? -1 : da > db ? 1 : 0;
    });
  }

  return { loadPublished, loadDraft, saveDraft, clearDraft, hasDraft, loadForDisplay, sortEvents };
})();
