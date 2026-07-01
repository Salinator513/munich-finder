/* ============================================================
   Servus — Munich place finder · app logic
   ============================================================ */
(function () {
  "use strict";

  const DATA = window.MUNICH_DATA;

  /* ---------- config ---------- */
  const CATEGORIES = {
    monument:    { label: "Monument",    plural: "Monuments" },
    restaurant:  { label: "Restaurant",  plural: "Restaurants" },
    bakery:      { label: "Bakery",      plural: "Bakeries" },
    active:      { label: "Active",      plural: "Active attractions" },
    supermarket: { label: "Supermarket", plural: "Supermarkets" },
    pharmacy:    { label: "Pharmacy",    plural: "Pharmacies" }
  };
  const TYPE_ORDER = ["monument", "restaurant", "bakery", "active", "supermarket", "pharmacy"];

  const HERO_GRAD = {
    monument:    "linear-gradient(135deg,#a78bfa,#6366f1)",
    restaurant:  "linear-gradient(135deg,#fb923c,#ef4444)",
    bakery:      "linear-gradient(135deg,#fbbf24,#f59e0b)",
    active:      "linear-gradient(135deg,#34d399,#0ea5e9)",
    supermarket: "linear-gradient(135deg,#4ade80,#16a34a)",
    pharmacy:    "linear-gradient(135deg,#f472b6,#e11d48)"
  };

  const TRAVEL_OPTIONS = [
    { value: "any", label: "Any time" },
    { value: 5,  label: "Within 5 min" },
    { value: 10, label: "Within 10 min" },
    { value: 15, label: "Within 15 min" },
    { value: 20, label: "Within 20 min" },
    { value: 30, label: "Within 30 min" }
  ];
  const RATING_OPTIONS = [
    { value: "any", label: "Any rating" },
    { value: 4.5, label: "4.5 & up" },
    { value: 4.0, label: "4.0 & up" },
    { value: 3.5, label: "3.5 & up" }
  ];

  const FIELDS = [
    { key: "type",   label: "Type",        placeholder: "Choose a place", icon: true,
      options: TYPE_ORDER.map(k => ({ value: k, label: CATEGORIES[k].label })) },
    { key: "travel", label: "Travel time", placeholder: "Any time",  options: TRAVEL_OPTIONS },
    { key: "rating", label: "Rating",      placeholder: "Any rating", options: RATING_OPTIONS }
  ];

  /* ---------- monochrome SF-style symbols ---------- */
  const CAT_SVG = {
    monument:
      '<path d="M12 2.6 2.6 7.1V9.1h18.8V7.1L12 2.6Z" fill="currentColor"/>' +
      '<path d="M5 10.6v6.8M9.6 10.6v6.8M14.4 10.6v6.8M19 10.6v6.8" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>' +
      '<path d="M3.2 18.6h17.6M3.8 21h16.4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
    restaurant:
      '<path d="M6.6 3.8v3.9a2.05 2.05 0 0 0 4.1 0V3.8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M8.65 3.8v3.9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' +
      '<path d="M8.65 7.8V20.2" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>' +
      '<path d="M16.2 3.8c-1.7 0-2.75 2.4-2.75 5 0 1.95 1.1 3 2.75 3V20.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
    bakery:
      '<path d="M4.2 8.4h12.2v3.3a4.6 4.6 0 0 1-4.6 4.6H8.8a4.6 4.6 0 0 1-4.6-4.6V8.4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<path d="M16.4 9.3h2a2.1 2.1 0 0 1 0 4.2h-2" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
      '<path d="M4.8 19.6h11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    active:
      '<path d="M12.4 5.4 18.9 19H5.9L12.4 5.4Z" fill="currentColor"/>' +
      '<path d="M6.7 10.6 11 19H2.4L6.7 10.6Z" fill="currentColor" opacity="0.5"/>',
    supermarket:
      '<path d="M2.6 4h2.1l1.9 10.5a1.6 1.6 0 0 0 1.57 1.32h7.4a1.6 1.6 0 0 0 1.56-1.27L19.5 7.4H6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="9" cy="19.4" r="1.5" fill="currentColor"/><circle cx="16.4" cy="19.4" r="1.5" fill="currentColor"/>',
    pharmacy:
      '<path d="M9.4 3.4h5.2v6h6v5.2h-6v6H9.4v-6h-6V9.4h6V3.4Z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>'
  };
  function catIcon(cat, size, cls) {
    return '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" width="' + size + '" height="' + size +
      '" aria-hidden="true">' + (CAT_SVG[cat] || "") + "</svg>";
  }

  const ICON = {
    star: '<svg class="star" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 17.27l5.18 3.05-1.38-5.9 4.58-3.97-6.03-.52L12 3.5 9.65 9.93l-6.03.52 4.58 3.97-1.38 5.9z" fill="currentColor"/></svg>',
    walk: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9 7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6z" fill="currentColor"/></svg>',
    car: '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" fill="currentColor"/></svg>',
    check: '<svg class="opt-check" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    pin: '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M12 2.5c-3.6 0-6.5 2.9-6.5 6.5 0 4.8 6.5 12 6.5 12s6.5-7.2 6.5-12c0-3.6-2.9-6.5-6.5-6.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="9" r="2.2" fill="currentColor"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="38" height="38" aria-hidden="true"><circle cx="11" cy="11" r="6.4" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M16 16l4.4 4.4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>'
  };

  /* ---------- state ---------- */
  const state = { type: null, travel: "any", rating: "any", userLoc: null, located: false, results: [], current: null };
  const detail = { pan: 0, maxPan: 0, collapseP: 0, extraFull: 60 };

  const VIEW_BG = { home: "#ffffff", results: "#f5f5f7", detail: "#000000" };
  // top-bar tint per results category so the status bar blends into the hero photo (no visible strip)
  const HERO_TOP = {
    monument: "#8f74ef", restaurant: "#f2842f", bakery: "#f2ac12",
    active: "#25c489", supermarket: "#33ce67", pharmacy: "#ec5aa4"
  };

  /* ---------- helpers ---------- */
  const $ = sel => document.querySelector(sel);
  function el(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const sign = x => (x > 0 ? 1 : x < 0 ? -1 : 0);
  // Apple rubber-band: offset grows with diminishing returns, asymptotes to ±limit
  function rubber(x, limit) { const c = 0.55; return (x * limit * c) / (limit + c * Math.abs(x)); }
  function haptic() { if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) {} } }
  function compact(n) {
    if (n == null) return "";
    if (n >= 1000) { const v = n / 1000; return (v >= 10 ? Math.round(v) : Number(v.toFixed(1))) + "k"; }
    return String(n);
  }
  function haversineKm(a, b) {
    const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
    const la1 = a.lat * Math.PI / 180, la2 = b.lat * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  function travelTimes(place) {
    const loc = state.userLoc || DATA.center;
    const km = haversineKm(loc, place);
    const walkMin = Math.max(1, Math.round((km / 4.8) * 60 * 1.25));
    const driveMin = Math.max(1, Math.round((km / 26) * 60 * 1.35));
    return { km, walkMin, driveMin };
  }
  function mapsUrl(p) {
    return "https://maps.apple.com/?q=" + encodeURIComponent(p.name) + "&ll=" + p.lat + "," + p.lng + "&t=m";
  }
  function setChrome(view, topColor) {
    const c = VIEW_BG[view] || "#ffffff";
    // page background (bottom overscroll) stays the screen colour; the top bar can differ
    document.documentElement.style.background = c;
    document.body.style.background = c;
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", topColor || c);
  }
  function currentView() {
    const a = document.querySelector(".screen.is-active");
    return a ? a.id : "home";
  }

  /* ---------- Apple-style button: light rim + finger-tracked highlight + rubber-band drag ---------- */
  function enhanceButton(node, opts) {
    opts = opts || {};
    const limit = opts.limit || 34, scale = opts.scale || 1.06, drag = opts.drag !== false;
    const sheen = document.createElement("span");
    sheen.className = "btn-sheen";
    node.appendChild(sheen);
    let active = false, sx = 0, sy = 0;
    function hl(e) {
      const r = node.getBoundingClientRect();
      sheen.style.setProperty("--hx", ((e.clientX - r.left) / r.width * 100) + "%");
      sheen.style.setProperty("--hy", ((e.clientY - r.top) / r.height * 100) + "%");
    }
    function onMove(e) {
      if (!active) return;
      hl(e);
      if (drag) {
        const dx = rubber(e.clientX - sx, limit), dy = rubber(e.clientY - sy, limit);
        node.style.transform = "translate(" + dx + "px," + dy + "px) scale(" + scale + ")";
      }
    }
    function onUp() {
      if (!active) return;
      active = false;
      node.classList.remove("is-pressing");
      node.style.transition = "transform 0.42s var(--spring)";
      node.style.transform = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    }
    node.addEventListener("pointerdown", e => {
      active = true; sx = e.clientX; sy = e.clientY;
      node.classList.add("is-pressing");
      hl(e);
      node.style.transition = "transform 0.14s var(--ease)";
      node.style.transform = "scale(" + scale + ")";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    });
  }

  /* ---------- geolocation ---------- */
  function setFoot(text, isError, located) {
    const f = $("#home-foot");
    f.innerHTML = (located ? ICON.pin + " " : "") + "<span>" + text + "</span>";
    f.classList.toggle("is-error", !!isError);
  }
  function requestLocation() {
    if (!("geolocation" in navigator)) { state.userLoc = DATA.center; setFoot("Using Marienplatz for travel times"); return; }
    setFoot("Locating you…");
    navigator.geolocation.getCurrentPosition(
      pos => {
        state.userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        state.located = true;
        setFoot("Using your location for travel times", false, true);
      },
      () => { state.userLoc = state.userLoc || DATA.center; setFoot("Using Marienplatz for travel times", true); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  /* ---------- dropdowns ---------- */
  function closeAllDropdowns(except) {
    document.querySelectorAll(".dropdown.is-open").forEach(d => { if (d !== except) d.classList.remove("is-open"); });
  }
  function buildDropdown(field) {
    const wrap = el(
      '<div class="field">' +
        '<label class="field-label">' + field.label + '</label>' +
        '<div class="dropdown" data-key="' + field.key + '">' +
          '<button class="dropdown-trigger" type="button" aria-haspopup="listbox" aria-expanded="false">' +
            '<span class="dropdown-value is-placeholder"><span class="val-text">' + field.placeholder + '</span></span>' +
            '<svg class="chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '</button>' +
          '<div class="dropdown-menu" role="listbox"></div>' +
        '</div>' +
      '</div>'
    );
    const dd = wrap.querySelector(".dropdown");
    const trigger = wrap.querySelector(".dropdown-trigger");
    const valueEl = wrap.querySelector(".dropdown-value");
    const menu = wrap.querySelector(".dropdown-menu");

    function setValue(opt) {
      valueEl.innerHTML =
        (field.icon ? '<span class="val-ico">' + catIcon(opt.value, 18) + "</span>" : "") +
        '<span class="val-text">' + opt.label + "</span>";
      valueEl.classList.remove("is-placeholder");
    }

    field.options.forEach(opt => {
      const o = el(
        '<button class="opt" type="button" role="option" data-value="' + opt.value + '">' +
          (field.icon ? '<span class="opt-ico">' + catIcon(opt.value, 20) + "</span>" : "") +
          '<span class="opt-label">' + opt.label + "</span>" +
          ICON.check +
        "</button>"
      );
      o.addEventListener("click", () => {
        state[field.key] = (opt.value === "any") ? "any" : (field.key === "type" ? opt.value : Number(opt.value));
        setValue(opt);
        menu.querySelectorAll(".opt").forEach(x => x.classList.remove("is-selected"));
        o.classList.add("is-selected");
        dd.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
      });
      menu.appendChild(o);
    });

    if (field.key !== "type") {
      setValue(field.options[0]);
      menu.querySelector(".opt").classList.add("is-selected");
    }

    trigger.addEventListener("click", e => {
      e.stopPropagation();
      const open = dd.classList.contains("is-open");
      closeAllDropdowns(dd);
      dd.classList.toggle("is-open", !open);
      trigger.setAttribute("aria-expanded", String(!open));
    });

    return wrap;
  }

  function renderFields() {
    const host = $("#fields");
    FIELDS.forEach(f => host.appendChild(buildDropdown(f)));
    document.addEventListener("click", () => closeAllDropdowns(null));
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeAllDropdowns(null); });
  }

  /* ---------- compute ---------- */
  function compute() {
    let list = DATA.places
      .filter(p => p.category === state.type)
      .map(p => Object.assign({}, p, travelTimes(p)));
    if (state.travel !== "any") list = list.filter(p => p.driveMin <= state.travel);
    if (state.rating !== "any") list = list.filter(p => p.rating >= state.rating);
    list.sort((a, b) => a.driveMin - b.driveMin || b.rating - a.rating);
    return list;
  }

  /* ---------- results ---------- */
  function statHTML(p) {
    return (
      '<div class="card-stats">' +
        '<span class="stat">' + ICON.star + "<b>" + p.rating.toFixed(1) + '</b><span class="stat-count">(' + compact(p.ratingCount) + ")</span></span>" +
        '<span class="stat">' + ICON.walk + p.walkMin + " min</span>" +
        '<span class="stat">' + ICON.car + p.driveMin + " min</span>" +
      "</div>"
    );
  }
  function makeCard(p) {
    const card = el('<div class="card" tabindex="0" role="button"></div>');
    const thumb = el('<div class="card-thumb"></div>');
    function fallback() {
      thumb.appendChild(el('<div class="card-thumb-fallback">' + catIcon(p.category, 34) + "</div>"));
      thumb.style.background = HERO_GRAD[p.category];
    }
    if (p.imageUrl) {
      const img = el('<img alt="" loading="lazy">');
      img.src = p.imageUrl;
      img.addEventListener("error", () => { img.remove(); fallback(); });
      thumb.appendChild(img);
    } else { fallback(); }
    const body = el('<div class="card-body"><div class="card-title">' + p.name + "</div>" + statHTML(p) + "</div>");
    card.appendChild(thumb);
    card.appendChild(body);
    const open = () => { state.current = p; pushView("detail", p.id); };
    card.addEventListener("click", open);
    card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    return card;
  }
  function renderResults() {
    const cat = CATEGORIES[state.type];
    const hero = $(".results-hero");
    const heroImg = $("#hero-img");
    hero.style.background = HERO_GRAD[state.type];
    heroImg.style.display = "";
    heroImg.onerror = () => { heroImg.style.display = "none"; };
    heroImg.src = "assets/banners/" + state.type + ".png";
    $("#hero-title").textContent = cat.plural;

    const n = state.results.length;
    const bits = [];
    if (state.travel !== "any") bits.push("within " + state.travel + " min");
    if (state.rating !== "any") bits.push(state.rating.toFixed(1) + "★ & up");
    $("#hero-count").textContent = n + (n === 1 ? " place" : " places") + (bits.length ? " · " + bits.join(" · ") : "");

    const listEl = $("#results-list");
    listEl.innerHTML = "";
    listEl.scrollTop = 0;
    if (!n) {
      listEl.appendChild(el(
        '<div class="empty"><div class="empty-ico">' + ICON.search + "</div>" +
        "<h3>Nothing matches yet</h3><p>Try widening the travel time or lowering the rating.</p></div>"
      ));
      return;
    }
    state.results.forEach((p, i) => {
      const c = makeCard(p);
      c.style.animationDelay = Math.min(i * 45, 400) + "ms";
      listEl.appendChild(c);
    });
  }

  /* ---------- detail ---------- */
  function chip(inner, cls) { return '<span class="chip' + (cls ? " " + cls : "") + '">' + inner + "</span>"; }

  function computePan() {
    const img = $("#detail-img"), stage = $("#detail-stage"), moveBtn = $("#detail-move");
    const rw = img.getBoundingClientRect().width, sw = stage.clientWidth;
    detail.maxPan = Math.max(0, (rw - sw) / 2 - 2);
    if (detail.maxPan < 8) { moveBtn.hidden = true; detail.pan = 0; img.style.setProperty("--pan", "0px"); }
    else moveBtn.hidden = false;
  }
  function updatePanelMetrics() {
    const panel = $("#detail-panel"), moveBtn = $("#detail-move");
    const r = panel.getBoundingClientRect();
    moveBtn.style.bottom = Math.max(90, window.innerHeight - r.top + 18) + "px";  // sits above the panel
  }
  function setCollapseProgress(p) {
    detail.collapseP = p;
    const extra = $("#detail-extra"), panel = $("#detail-panel");
    extra.style.maxHeight = (detail.extraFull * (1 - p)) + "px";
    extra.style.opacity = String(1 - p);
    extra.style.marginTop = (8 * (1 - p)) + "px";
    panel.classList.toggle("is-collapsed", p > 0.5);
    updatePanelMetrics();
  }
  let collapseRAF = 0;
  function animateCollapse(target) {
    cancelAnimationFrame(collapseRAF);
    const start = detail.collapseP, t0 = performance.now(), dur = 300;
    function step(now) {
      const k = clamp((now - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      setCollapseProgress(start + (target - start) * e);
      if (k < 1) collapseRAF = requestAnimationFrame(step);
    }
    collapseRAF = requestAnimationFrame(step);
  }

  function openDetail(p) {
    if (!p) return;
    state.current = p;
    detail.pan = 0;
    $("#detail-title").textContent = p.name;

    const img = $("#detail-img"), fb = $("#detail-fallback"), bars = $("#detail-bars"), moveBtn = $("#detail-move");
    img.style.setProperty("--pan", "0px");
    img.style.display = "";
    fb.hidden = true;
    moveBtn.hidden = true;
    bars.classList.remove("blur-fill");
    bars.style.backgroundImage = "";
    bars.style.background = "#000";

    img.onload = () => {
      bars.style.backgroundImage = 'url("' + p.imageUrl + '")';
      bars.classList.add("blur-fill");
      computePan();
      updatePanelMetrics();
    };
    img.onerror = () => {
      img.style.display = "none";
      fb.hidden = false;
      $("#detail-fallback-icon").innerHTML = catIcon(p.category, 92);
      bars.classList.remove("blur-fill");
      bars.style.background = "linear-gradient(160deg,#2b2b30,#131316)";
      detail.maxPan = 0; moveBtn.hidden = true;
      updatePanelMetrics();
    };
    if (p.imageUrl) { img.src = p.imageUrl; } else { img.removeAttribute("src"); img.onerror(); }

    // spec row — rating · walk · drive (the type/category lives in the top-right pill)
    $("#detail-stats-row").innerHTML = [
      chip(ICON.star + "<b>" + p.rating.toFixed(1) + '</b><span class="cl">(' + compact(p.ratingCount) + ")</span>"),
      chip(ICON.walk + p.walkMin + ' <span class="cl">min</span>'),
      chip(ICON.car + p.driveMin + ' <span class="cl">min</span>')
    ].join("");

    // top-right pill — location TYPE (category), e.g. "Restaurant"
    const typeEl = $("#detail-type"), cat = CATEGORIES[p.category];
    if (cat) { typeEl.innerHTML = catIcon(p.category, 15) + '<span class="lbl">' + cat.label + "</span>"; typeEl.hidden = false; }
    else { typeEl.hidden = true; typeEl.innerHTML = ""; }

    // neighborhood location chip inside the box, next to the Maps button
    const locEl = $("#detail-loc");
    if (p.neighborhood) { locEl.innerHTML = ICON.pin + '<span class="lbl">' + p.neighborhood + "</span>"; locEl.hidden = false; }
    else { locEl.hidden = true; locEl.innerHTML = ""; }

    $("#detail-desc").textContent = p.description || "";
    $("#detail-maps").href = mapsUrl(p);

    // measure the collapsible region (description + Maps), then start expanded
    const extra = $("#detail-extra");
    extra.style.transition = "none";
    extra.style.maxHeight = "none"; extra.style.opacity = "1"; extra.style.marginTop = "8px";
    detail.extraFull = Math.max(20, extra.offsetHeight);
    setCollapseProgress(0);
    requestAnimationFrame(() => { extra.style.transition = ""; });
    requestAnimationFrame(updatePanelMetrics);
  }

  /* ---------- move / pan button (joystick: steady scroll in drag direction) ---------- */
  function setupMoveButton() {
    const btn = $("#detail-move"), img = $("#detail-img");
    const sheen = document.createElement("span"); sheen.className = "btn-sheen"; btn.appendChild(sheen);
    const SPEED = 2.6, DEAD = 6, BLIMIT = 22;
    let active = false, sx = 0, dx = 0, raf = 0, wasP = 0;
    function hl(e) {
      const r = btn.getBoundingClientRect();
      sheen.style.setProperty("--hx", ((e.clientX - r.left) / r.width * 100) + "%");
      sheen.style.setProperty("--hy", ((e.clientY - r.top) / r.height * 100) + "%");
    }
    function loop() {
      if (!active) return;
      if (Math.abs(dx) > DEAD && detail.maxPan > 0) {
        const dir = dx > 0 ? -1 : 1;   // drag right → reveal the right of the photo (steady, constant pace)
        detail.pan = clamp(detail.pan + dir * SPEED, -detail.maxPan, detail.maxPan);
        img.style.setProperty("--pan", detail.pan + "px");
      }
      raf = requestAnimationFrame(loop);
    }
    btn.addEventListener("pointerdown", e => {
      e.preventDefault();
      active = true; sx = e.clientX; dx = 0;
      try { btn.setPointerCapture(e.pointerId); } catch (err) {}
      btn.classList.add("is-held", "is-pressing");
      hl(e); haptic();
      wasP = detail.collapseP; animateCollapse(1);
      cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    });
    btn.addEventListener("pointermove", e => {
      if (!active) return;
      hl(e);
      dx = e.clientX - sx;
      btn.style.setProperty("--mv-x", rubber(dx, BLIMIT) + "px");   // button drifts toward finger with resistance
    });
    const end = () => {
      if (!active) return;
      active = false;
      cancelAnimationFrame(raf);
      btn.classList.remove("is-held", "is-pressing");
      btn.style.setProperty("--mv-x", "0px");
      animateCollapse(wasP);
    };
    btn.addEventListener("pointerup", end);
    btn.addEventListener("pointercancel", end);
  }

  /* ---------- grabber: live drag-down shrinks description, drag-up expands ---------- */
  function setupGrabber() {
    const grab = $("#panel-grabber"), extra = $("#detail-extra"), panel = $("#detail-panel");
    let active = false, sy = 0, startP = 0, moved = false;
    grab.addEventListener("pointerdown", e => {
      active = true; sy = e.clientY; startP = detail.collapseP; moved = false;
      cancelAnimationFrame(collapseRAF);
      try { grab.setPointerCapture(e.pointerId); } catch (err) {}
      extra.style.transition = "none"; panel.style.transition = "none";
    });
    grab.addEventListener("pointermove", e => {
      if (!active) return;
      const dy = e.clientY - sy;
      if (Math.abs(dy) > 3) moved = true;
      const raw = startP + dy / Math.max(1, detail.extraFull);
      setCollapseProgress(clamp(raw, 0, 1));
      // Apple rubber-band past the ends: the whole panel gives a little with resistance
      let over = 0;
      if (raw < 0) over = rubber(raw * detail.extraFull, 44);
      else if (raw > 1) over = rubber((raw - 1) * detail.extraFull, 44);
      panel.style.transform = over ? "translateY(" + over + "px)" : "";
    });
    const end = () => {
      if (!active) return;
      active = false;
      extra.style.transition = "";
      panel.style.transition = "transform 0.42s var(--spring)";
      panel.style.transform = "";
      if (!moved) animateCollapse(detail.collapseP > 0.5 ? 0 : 1);   // a tap toggles
      else animateCollapse(detail.collapseP > 0.5 ? 1 : 0);          // a drag snaps to nearest
    };
    grab.addEventListener("pointerup", end);
    grab.addEventListener("pointercancel", end);
    grab.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); animateCollapse(detail.collapseP > 0.5 ? 0 : 1); }
    });
  }

  /* ---------- router ---------- */
  function goTo(id, instant) {
    const app = document.getElementById("app");
    if (instant) app.classList.add("no-anim");   // pop: browser already animated the slide — swap instantly
    document.querySelectorAll(".screen").forEach(s => s.classList.toggle("is-active", s.id === id));
    if (instant) { void app.offsetWidth; requestAnimationFrame(() => app.classList.remove("no-anim")); }
  }
  function applyView(view, placeId, instant) {
    if (view === "results") { setChrome("results", HERO_TOP[state.type]); renderResults(); goTo("results", instant); }
    else if (view === "detail") {
      setChrome("detail");
      const p = state.results.find(x => x.id === placeId) || state.current;
      openDetail(p); goTo("detail", instant);
    } else { setChrome("home"); goTo("home", instant); }
  }
  function pushView(view, placeId) {
    history.pushState({ view: view, placeId: placeId || null }, "");
    applyView(view, placeId, false);
  }
  window.addEventListener("popstate", e => {
    const s = e.state || { view: "home" };
    applyView(s.view, s.placeId, true);
  });
  window.addEventListener("resize", () => { if (currentView() === "detail") { computePan(); updatePanelMetrics(); } });

  /* ---------- Go ---------- */
  function onGo() {
    haptic();
    if (!state.located) requestLocation();
    if (!state.type) {
      const typeDd = document.querySelector('.dropdown[data-key="type"]');
      typeDd.classList.add("nudge");
      setTimeout(() => typeDd.classList.remove("nudge"), 500);
      const t = typeDd.querySelector(".dropdown-trigger");
      closeAllDropdowns(typeDd); typeDd.classList.add("is-open"); t.setAttribute("aria-expanded", "true");
      return;
    }
    const go = $("#go");
    go.classList.add("is-busy");
    state.results = compute();
    requestAnimationFrame(() => {
      setTimeout(() => { pushView("results"); go.classList.remove("is-busy"); }, 160);
    });
  }

  /* ---------- init ---------- */
  function init() {
    renderFields();
    $("#go").addEventListener("click", onGo);
    $("#results-back").addEventListener("click", () => history.back());
    $("#detail-back").addEventListener("click", () => history.back());
    enhanceButton($("#go"), { scale: 1.05, limit: 26 });
    enhanceButton($("#results-back"), { scale: 1.32, limit: 30 });
    enhanceButton($("#detail-back"), { scale: 1.32, limit: 30 });
    enhanceButton($("#detail-maps"), { scale: 1.06, drag: false });   // Maps only grows — never drifts
    setupMoveButton();
    setupGrabber();
    history.replaceState({ view: "home" }, "");
    setChrome("home");
    requestLocation();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
