/* ============================================================
   STOMP — Luma enrichment endpoint (Vercel serverless function)

   GET /api/luma?url=https://lu.ma/<slug>   (or ?slug=<slug>)

   Resolves a public lu.ma event link to full event details using the
   Luma API, so the admin only has to paste a link + pick a status.

   Requires the LUMA_API_KEY env var (Luma Plus). Until that's set, the
   endpoint returns 501 and the site falls back to the stored fields in
   data/content.json — so the schedule still works today.

   Docs: https://docs.luma.com/reference  (base https://public-api.luma.com/v1)
   ============================================================ */
const LUMA_BASE = "https://public-api.luma.com/v1";

function slugFromInput(input) {
  if (!input) return null;
  let s = String(input).trim();
  const m = s.match(/lu\.ma\/([^/?#]+)/i);
  if (m) return m[1];
  if (/^https?:\/\//i.test(s)) {
    try { return new URL(s).pathname.replace(/^\/+/, "").split("/")[0] || null; }
    catch (_) { return null; }
  }
  return s;
}

async function lumaGet(path, params, key) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${LUMA_BASE}${path}?${qs}`, {
    headers: { "x-luma-api-key": key, accept: "application/json" }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`Luma ${path} -> ${res.status}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  return res.json();
}

function normalize(slug, lookupEvent, full) {
  const e = full || {};
  const geo = e.geo_address_json || {};
  return {
    source: "luma",
    slug,
    id: e.id || (lookupEvent && lookupEvent.id) || null,
    title: e.name || (lookupEvent && lookupEvent.name) || null,
    startAt: e.start_at || (lookupEvent && lookupEvent.start_at) || null,
    endAt: e.end_at || (lookupEvent && lookupEvent.end_at) || null,
    timezone: e.timezone || null,
    venue: geo.name || geo.address || null,
    city: geo.city || geo.city_state || null,
    fullAddress: geo.full_address || geo.address || null,
    cover: e.cover_url || (lookupEvent && lookupEvent.cover_url) || null,
    url: e.url || (slug ? `https://lu.ma/${slug}` : null),
    description: e.description || null
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  const key = process.env.LUMA_API_KEY;
  const slug = slugFromInput((req.query && (req.query.url || req.query.slug)) || "");

  if (!slug) {
    res.status(400).json({ error: "Pass ?url= a lu.ma link or ?slug=" });
    return;
  }
  if (!key) {
    res.status(501).json({ error: "LUMA_API_KEY not configured", slug, fallback: true });
    return;
  }

  try {
    const lookup = await lumaGet("/entity/lookup", { slug }, key);
    const entity = lookup && lookup.entity;
    if (!entity || entity.type !== "event") {
      res.status(404).json({ error: "No Luma event for that link", slug });
      return;
    }
    const lookupEvent = entity.event;
    let full = null;
    try {
      const got = await lumaGet("/event/get", { id: lookupEvent.id }, key);
      full = got && got.event;
    } catch (e) {
      full = null;
    }
    res.status(200).json(normalize(slug, lookupEvent, full));
  } catch (e) {
    res.status(e.status || 502).json({ error: e.message, slug });
  }
}
