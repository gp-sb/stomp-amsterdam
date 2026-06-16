/* ============================================================
   STOMP — frontend: render all sections from content + animations
   ============================================================ */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const ICONS = {
    heart: '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 21s-7.5-4.6-10-9.2C.3 8.3 2 5 5.3 5c2 0 3.4 1.2 4.2 2.4C10.3 6.2 11.7 5 13.7 5 17 5 18.7 8.3 17 11.8 14.5 16.4 12 21 12 21z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.4 5 5.1-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.5-5.8c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.8 1-.3.2-.5.1a6.6 6.6 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2.1-.2 0-.3 0-.5l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-1 2.2c0 1.3 1 2.6 1.1 2.8s1.9 3 4.7 4.2c1.7.7 2.4.8 3.2.7.5-.1 1.4-.6 1.6-1.2s.2-1 .1-1.1-.3-.2-.6-.3z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    play: "▶"
  };
  const BOOT_SVG = '<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" width="100%" fill="#15110f"><path d="M30 8c-3 0-5 2-5 5v44c0 4-1 7-4 11L8 88c-4 5-6 9-6 15 0 5 4 9 9 9h61c6 0 11-5 11-11 0-5-2-8-7-12l-9-7c-5-4-7-8-7-15V13c0-3-2-5-5-5H30zm2 6h16v40H32V14z"/><path d="M3 104c2 6 7 9 14 9h61c5 0 9-3 10-8-3 2-7 3-12 3H17c-5 0-10-1-14-4z" opacity=".55"/><circle cx="9" cy="112" r="3"/></svg>';

  function fdate(iso) { const d = new Date(iso + "T00:00:00"); return { day: d.getDate(), mon: MONTHS[d.getMonth()], week: WEEK[d.getDay()] }; }
  const statusLabel = (s) => ({ "on-sale": "Tickets", "few-left": "Few left", "sold-out": "Sold out", "free": "Free" }[s] || s);

  /* ---------------- render sections ---------------- */
  function renderHero(hero, events) {
    $("#hero-kicker").textContent = hero.kicker || "";
    $("#hero-sub").textContent = hero.sub || "";
    const titleEl = $("#hero-title");
    const text = (hero.headline || "STOMP").trim();
    titleEl.setAttribute("aria-label", text);
    titleEl.innerHTML = "";
    [...text].forEach((ch) => { const s = el("span", "char"); s.setAttribute("aria-hidden", "true"); s.textContent = ch === " " ? " " : ch; titleEl.appendChild(s); });
    if (hero.poster) { const img = $("#hero-poster"); img.src = hero.poster; img.alt = ""; }
    $("#hero-boot").innerHTML = BOOT_SVG;

    const wrap = $("#hero-events");
    wrap.innerHTML = "";
    events.slice(0, 4).forEach((e) => {
      const d = fdate(e.date);
      const row = el("div", "he-row");
      const sold = e.status === "sold-out";
      row.innerHTML = `
        <div class="he-row__date">${d.mon} ${d.day}</div>
        <div class="he-row__venue">${esc(e.venue)} <small>${esc(e.city)} · ${esc(e.start)}–${esc(e.end)}</small></div>
        <div class="he-row__cta">
          <span class="badge badge--type">${esc(e.type)}</span>
          ${sold ? '<span class="badge badge--sold-out"><span class="star">✷</span> Sold out</span>'
                 : `<a class="badge badge--${e.status}" href="${esc(e.ticketUrl || e.lumaUrl || "#")}" target="_blank" rel="noopener">${statusLabel(e.status)} →</a>`}
        </div>`;
      wrap.appendChild(row);
    });
  }

  function renderKeyLinks(links) {
    const g = $("#keylinks-grid"); g.innerHTML = "";
    (links || []).forEach((k) => {
      const a = el("a", "keylink reveal");
      a.href = k.url || "#"; a.target = "_blank"; a.rel = "noopener";
      a.innerHTML = `
        <div class="keylink__label">${ICONS[k.icon] || ""}${esc(k.label)}<span class="keylink__arrow">${ICONS.arrow}</span></div>
        <div class="keylink__sub">${esc(k.sub || "")}</div>`;
      g.appendChild(a);
    });
  }

  function renderWays(ways) {
    const g = $("#ways-grid"); g.innerHTML = "";
    (ways || []).forEach((w) => {
      const card = el("div", "way way--" + (w.color || "denim") + " reveal");
      card.innerHTML = `
        ${w.image ? `<img class="way__img" src="${esc(w.image)}" alt="${esc(w.name)}" loading="lazy">` : ""}
        <div class="way__body">
          <div class="way__name">✷ ${esc(w.name)}</div>
          <div class="way__level">${esc(w.level || "")}</div>
          <div class="way__hr"></div>
          <p class="way__blurb">${esc(w.blurb || "")}</p>
        </div>`;
      g.appendChild(card);
    });
  }

  function renderAbout(about) {
    $("#about-statement").innerHTML = `${esc(about.lead)} <span class="pride-text">${esc(about.highlight)}</span>`;
    $("#about-body").textContent = about.body || "";
    const ph = $("#about-photos"); ph.innerHTML = "";
    (about.photos || []).forEach((src) => { const i = el("img"); i.src = src; i.alt = ""; i.loading = "lazy"; ph.appendChild(i); });
    const link = $("#about-link"); link.href = about.fullStoryUrl || "#";
  }

  let ALL_EVENTS = [], TYPE_FILTER = "All";
  function renderSchedule() {
    const list = $("#sched-list"); if (!list) return;
    const shown = TYPE_FILTER === "All" ? ALL_EVENTS : ALL_EVENTS.filter((e) => e.type === TYPE_FILTER);
    list.innerHTML = "";
    if (!shown.length) { list.innerHTML = '<p style="padding:30px 0">Nothing in this category yet — check back soon.</p>'; return; }
    shown.forEach((e) => {
      const d = fdate(e.date);
      const sold = e.status === "sold-out";
      const row = el("div", "sched-row");
      row.innerHTML = `
        <div class="sched-row__date">${d.mon} ${d.day}<br><span style="font-size:13px;opacity:.7">${d.week}</span></div>
        <div>
          <div class="sched-row__title">${esc(e.title)}</div>
          <div class="sched-row__meta">${esc(e.venue)}, ${esc(e.city)} · ${esc(e.start)}–${esc(e.end)} · ${esc(e.blurb || "")}</div>
        </div>
        <div class="sched-row__right">
          <span class="badge badge--type">${esc(e.type)}</span>
          ${sold ? '<span class="badge badge--sold-out">✷ Sold out</span>'
                 : `<a class="btn btn--rodeo" href="${esc(e.ticketUrl || e.lumaUrl || "#")}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Get tickets</a>`}
        </div>`;
      if (e.lumaUrl) row.addEventListener("click", () => window.open(e.lumaUrl, "_blank", "noopener"));
      list.appendChild(row);
    });
  }
  function renderFilters() {
    const bar = $("#sched-filters"); if (!bar) return;
    const types = ["All", ...Array.from(new Set(ALL_EVENTS.map((e) => e.type)))];
    bar.innerHTML = "";
    types.forEach((t) => {
      const b = el("button", "chip"); b.textContent = t; b.setAttribute("aria-pressed", t === TYPE_FILTER);
      b.addEventListener("click", () => { TYPE_FILTER = t; bar.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c === b)); renderSchedule(); });
      bar.appendChild(b);
    });
  }

  function renderTutorials(tuts) {
    const g = $("#tut-grid"); g.innerHTML = "";
    (tuts || []).forEach((t) => {
      const a = el("a", "tut-card reveal");
      a.href = t.url || "#"; a.target = "_blank"; a.rel = "noopener";
      a.addEventListener("click", () => { try { (window.StompTrack || function () {})("tutorial", t.id); } catch (_) {} });
      a.innerHTML = `
        <div class="tut-card__thumb">
          ${t.thumb ? `<img src="${esc(t.thumb)}" alt="${esc(t.title)}" loading="lazy">` : ""}
          <div class="tut-card__play"><span>${ICONS.play}</span></div>
        </div>
        <div class="tut-card__body">
          <div class="tut-card__title">${esc(t.title)}</div>
          <div class="tut-card__meta">${esc(t.level || "")} · ${esc(t.duration || "")}</div>
        </div>`;
      g.appendChild(a);
    });
  }

  function renderSisters(clubs) {
    const list = $("#sister-list"); list.innerHTML = "";
    (clubs || []).forEach((c) => {
      const a = el("a", "sister-row reveal");
      a.href = c.url || "#"; a.target = "_blank"; a.rel = "noopener";
      a.innerHTML = `
        <div class="sister-row__name">${esc(c.name)}</div>
        <div class="sister-row__city">${esc(c.city || "")}</div>
        <div class="sister-row__note">${esc(c.note || "")} ${ICONS.arrow}</div>`;
      list.appendChild(a);
    });
  }

  function renderPrivate(p) {
    $("#private-title-h").textContent = p.headline || "Private party?";
    $("#private-body").textContent = p.body || "";
    $("#private-link").href = p.inquireUrl || "#";
    if (p.backdrop) { const b = $("#private-bg"); b.src = p.backdrop; b.alt = ""; }
    const cards = $("#private-cards"); cards.innerHTML = "";
    (p.options || []).forEach((o, i) => {
      const c = el("div", "pe-card reveal");
      c.innerHTML = `<img src="${esc(o.image)}" alt="${esc(o.label)}" loading="lazy"><div class="pe-card__label"><span>${esc(o.label)}</span><span>0${i + 1}</span></div>`;
      cards.appendChild(c);
    });
  }

  function renderFooter(f, brand) {
    $("#footer-blurb").textContent = f.blurb || "";
    const col = (sel, items) => { const c = $(sel); c.innerHTML = ""; (items || []).forEach((it) => { const a = el("a"); a.href = it.url; a.textContent = it.label; if (/^https?:/.test(it.url)) { a.target = "_blank"; a.rel = "noopener"; } c.appendChild(a); }); };
    col("#footer-pages", f.pages); col("#footer-findus", f.findUs); col("#footer-other", f.other);
    $("#footer-year").textContent = "© " + new Date().getFullYear() + " " + (brand.name || "STOMP");
  }

  /* ---------------- menu overlay ---------------- */
  function initMenu() {
    const ov = $("#overlay");
    $("#menu-open").addEventListener("click", () => { ov.classList.add("is-open"); document.body.style.overflow = "hidden"; });
    const close = () => { ov.classList.remove("is-open"); document.body.style.overflow = ""; };
    $("#menu-close").addEventListener("click", close);
    ov.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  /* ---------------- animations ---------------- */
  function initAnim() {
    if (reduce || typeof gsap === "undefined") {
      document.querySelectorAll(".reveal").forEach((n) => { n.style.opacity = 1; n.style.transform = "none"; });
      return;
    }
    gsap.set("#hero-title .char", { yPercent: 120 });
    gsap.to("#hero-title .char", { yPercent: 0, duration: 1, ease: "expo.out", stagger: 0.04, delay: 0.1 });
    gsap.from(".hero__kicker, #hero-sub, .he-row", { opacity: 0, y: 22, duration: 0.8, ease: "power3.out", stagger: 0.08, delay: 0.5 });

    if (typeof ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
      document.querySelectorAll(".reveal").forEach((n) => {
        gsap.to(n, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: n, start: "top 90%" } });
      });
      gsap.to("#hero-boot", { yPercent: 60, rotation: 12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      document.querySelectorAll(".star-decor").forEach((s, i) => {
        gsap.to(s, { y: (i % 2 ? -1 : 1) * 160, x: (i % 2 ? 1 : -1) * 60, rotation: 180, ease: "none", scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: true } });
      });
    } else {
      document.querySelectorAll(".reveal").forEach((n) => { n.style.opacity = 1; n.style.transform = "none"; });
    }
  }

  /* ---------------- luma enrichment (progressive) ---------------- */
  async function enrichEvents() {
    let changed = false;
    await Promise.all(ALL_EVENTS.map(async (e) => {
      if (!e.lumaUrl) return;
      const live = await window.StompStore.enrichFromLuma(e.lumaUrl);
      if (live) {
        if (live.title) e.title = live.title;
        if (live.cover) e.cover = live.cover;
        if (live.venue) e.venue = live.venue;
        if (live.city) e.city = live.city;
        if (live.startAt) { const d = new Date(live.startAt); e.date = d.toISOString().slice(0, 10); e.start = d.toTimeString().slice(0, 5); }
        if (live.endAt) { e.end = new Date(live.endAt).toTimeString().slice(0, 5); }
        if (live.description) e.blurb = live.description.slice(0, 160);
        changed = true;
      }
    }));
    if (changed) { ALL_EVENTS = window.StompStore.sortEvents(ALL_EVENTS); renderSchedule(); renderHero(window.__hero, ALL_EVENTS); }
  }

  async function init() {
    initMenu();
    let content;
    try { const r = await window.StompStore.loadForDisplay(); content = r.data; }
    catch (err) { document.body.innerHTML = '<p style="padding:60px;text-align:center">Could not load content. ' + err.message + "</p>"; return; }

    window.__hero = content.hero || {};
    ALL_EVENTS = window.StompStore.sortEvents(content.events);
    renderHero(content.hero || {}, ALL_EVENTS);
    renderKeyLinks(content.keyLinks);
    renderWays(content.waysToDance);
    renderAbout(content.about || {});
    renderFilters(); renderSchedule();
    renderTutorials(content.tutorials);
    renderSisters(content.sisterClubs);
    renderPrivate(content.privateEvents || {});
    renderFooter(content.footer || {}, content.brand || {});

    initAnim();
    enrichEvents();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
