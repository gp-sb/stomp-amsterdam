/* ============================================================
   STOMP — frontend behaviour
   - animated hero canvas (lightweight particle/grid field)
   - split-letter hero title intro (GSAP)
   - scroll reveals
   - schedule rendering, genre filtering with FLIP-style reorder
   - expandable event rows
   ============================================================ */
(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function initHeroCanvas() {
    const canvas = document.getElementById("hero-canvas");
    if (!canvas || prefersReduced) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w, h, dpr, nodes = [], raf;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.floor((w * h) / 16000);
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.4
      }));
    }

    function step() {
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 14000) {
            const o = 1 - d2 / 14000;
            ctx.strokeStyle = "rgba(216,255,62," + (o * 0.18).toFixed(3) + ")";
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.fillStyle = "rgba(244,241,234,0.55)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(step);
    }

    resize();
    step();
    window.addEventListener("resize", () => { cancelAnimationFrame(raf); resize(); step(); });
  }

  function initHeroTitle() {
    const title = document.querySelector(".hero__title");
    if (!title) return;
    const text = title.textContent.trim();
    title.setAttribute("aria-label", text);
    title.innerHTML = "";
    [...text].forEach((ch) => {
      const span = document.createElement("span");
      span.className = "char";
      span.setAttribute("aria-hidden", "true");
      span.textContent = ch;
      title.appendChild(span);
    });
    if (prefersReduced || typeof gsap === "undefined") return;
    gsap.set(".hero__title .char", { yPercent: 115 });
    gsap.to(".hero__title .char", {
      yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.06, delay: 0.15
    });
    gsap.from(".hero__kicker, .hero__sub", { opacity: 0, y: 20, duration: 0.9, ease: "power3.out", delay: 0.7, stagger: 0.12 });
  }

  function initReveals() {
    const els = document.querySelectorAll(".reveal");
    if (prefersReduced || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      els.forEach((el) => { el.style.opacity = 1; el.style.transform = "none"; });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    els.forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" }
      });
    });
  }

  let allEvents = [];
  let activeGenre = "All";

  function fmtDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return { day: String(d.getDate()).padStart(2, "0"), month: MONTHS[d.getMonth()], weekday: WEEKDAYS[d.getDay()] };
  }

  function eventNode(evt) {
    const d = fmtDate(evt.date);
    const el = document.createElement("article");
    el.className = "event reveal";
    el.dataset.genre = evt.genre;
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-expanded", "false");
    const statusLabel = { "on-sale": "On sale", "few-left": "Few left", "free": "Free entry" }[evt.status] || evt.status;
    el.innerHTML = `
      <div class="event__date">
        <span class="event__day">${d.day}</span>
        <span class="event__month">${d.month}</span>
        <span class="event__weekday">${d.weekday}</span>
      </div>
      <div class="event__main">
        <h3 class="event__title">${evt.title}</h3>
        <p class="event__lineup">${(evt.lineup || []).join("  ·  ")}</p>
        <div class="event__tags">
          <span class="tag tag--room">${evt.room}</span>
          <span class="tag">${evt.genre}</span>
        </div>
      </div>
      <div class="event__right">
        <span class="event__time">${evt.start}–${evt.end}</span>
        <span class="status status--${evt.status}">${statusLabel}</span>
      </div>
      <div class="event__detail">
        <div class="event__detail-inner">
          <p class="event__blurb">${evt.blurb || ""}</p>
          <span class="event__price">${evt.price || ""}</span>
        </div>
      </div>`;
    el.addEventListener("click", () => toggleEvent(el));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleEvent(el); }
    });
    return el;
  }

  function toggleEvent(el) {
    const detail = el.querySelector(".event__detail");
    const open = el.classList.toggle("is-open");
    el.setAttribute("aria-expanded", open ? "true" : "false");
    detail.style.height = open ? detail.querySelector(".event__detail-inner").offsetHeight + 22 + "px" : "0px";
  }

  function renderSchedule() {
    const list = document.getElementById("schedule-list");
    if (!list) return;
    const shown = activeGenre === "All" ? allEvents : allEvents.filter((e) => e.genre === activeGenre);

    const prev = new Map();
    list.querySelectorAll(".event").forEach((n) => prev.set(n.dataset.id, n.getBoundingClientRect().top));

    list.innerHTML = "";
    if (!shown.length) {
      list.innerHTML = `<p style="color:var(--ink-dim);padding:40px 0">No events in this category yet — check back soon.</p>`;
      return;
    }
    shown.forEach((evt) => {
      const node = eventNode(evt);
      node.dataset.id = evt.id;
      list.appendChild(node);
    });

    if (!prefersReduced && typeof gsap !== "undefined") {
      list.querySelectorAll(".event").forEach((n) => {
        n.style.opacity = 1; n.style.transform = "none";
        const oldTop = prev.get(n.dataset.id);
        if (oldTop != null) {
          const delta = oldTop - n.getBoundingClientRect().top;
          gsap.fromTo(n, { y: delta }, { y: 0, duration: 0.5, ease: "power3.out" });
        } else {
          gsap.fromTo(n, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
        }
      });
    } else {
      list.querySelectorAll(".event").forEach((n) => { n.style.opacity = 1; n.style.transform = "none"; });
    }
  }

  function initFilters() {
    const bar = document.getElementById("filters");
    if (!bar) return;
    const genres = ["All", ...Array.from(new Set(allEvents.map((e) => e.genre)))];
    bar.innerHTML = "";
    genres.forEach((g) => {
      const b = document.createElement("button");
      b.className = "chip";
      b.textContent = g;
      b.setAttribute("aria-pressed", g === activeGenre ? "true" : "false");
      b.addEventListener("click", () => {
        activeGenre = g;
        bar.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c === b ? "true" : "false"));
        renderSchedule();
      });
      bar.appendChild(b);
    });
  }

  function fillMeta(club) {
    const set = (sel, val) => { const el = document.querySelector(sel); if (el && val) el.textContent = val; };
    set("[data-club-address]", club.address);
    set("[data-club-updated]", "Updated " + club.updated);
    set("[data-club-tagline]", club.tagline);
  }

  async function init() {
    initHeroCanvas();
    initHeroTitle();
    try {
      const { data, source } = await window.StompStore.loadForDisplay();
      allEvents = window.StompStore.sortEvents(data.events || []);
      if (data.club) fillMeta(data.club);
      const banner = document.getElementById("draft-banner");
      if (banner && source === "draft") banner.hidden = false;
      initFilters();
      renderSchedule();
    } catch (err) {
      const list = document.getElementById("schedule-list");
      if (list) list.innerHTML = `<p style="color:var(--hot);padding:40px 0">Couldn't load the schedule. ${err.message}</p>`;
    }
    initReveals();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
