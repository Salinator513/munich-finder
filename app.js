/* ============================================================
   Servus — Munich place finder · app logic
   ============================================================ */
(function () {
  "use strict";

  const DATA = window.MUNICH_DATA;

  /* ---------- config ---------- */
  const CATEGORIES = {
    monument:    { label: "Monument",          plural: "Monuments" },
    restaurant:  { label: "Restaurant",        plural: "Restaurants" },
    bakery:      { label: "Bakery",            plural: "Bakeries" },
    active:      { label: "Active",            plural: "Active attractions" },
    supermarket: { label: "Supermarket",       plural: "Supermarkets" },
    pharmacy:    { label: "Pharmacy",          plural: "Pharmacies" }
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
      '<path d="M6.2 3v5.1a1.8 1.8 0 0 0 1.8 1.8M9.8 3v5.1a1.8 1.8 0 0 1-1.8 1.8M8 9.9V21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M16.6 3c-1.5 1-2.4 3.2-2.4 5.2 0 1.9 1 3 2.4 3M16.6 11.2V21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
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
  const state = { type: null, travel: "any", rating: "any", userLoc: null, results: [], current: null };
  const detail = { pan: 0, maxPan: 0 };

  const VIEW_BG = { home: "#ffffff", results: "#f5f5f7", detail: "#000000" };

  /* ---------- helpers ---------- */
  const $ = sel => document.querySelector(sel);
  function el(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
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
    const walkMin = Math.max(1, Math.round((km / 4.8) * 60 * 1.25));   // ~4.8 km/h + detour
    const driveMin = Math.max(1, Math.round((km / 26) * 60 * 1.35));   // ~26 km/h urban + detour
    return { km, walkMin, driveMin };
  }
  function mapsUrl(p) {
    return "https://maps.apple.com/?q=" + encodeURIComponent(p.name) + "&ll=" + p.lat + "," + p.lng + "&t=m";
  }
  function setChrome(view) {
    const c = VIEW_BG[view] || "#ffffff";
    document.documentElement.style.background = c;
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", c);
  }

  /* ---------- press-grow: buttons enlarge + drift toward finger, spring back ---------- */
  function addPressGrow(node, scale) {
    scale = scale || 1.06;
    let active = false, sx = 0, sy = 0;
    const onMove = e => {
      if (!active) return;
      const dx = clamp(e.clientX - sx, -5, 5), dy = clamp(e.clientY - sy, -5, 5);
      node.style.transform = "translate(" + dx + "px," + dy + "px) scale(" + scale + ")";
    };
    const onUp = () => {
      if (!active) return;
      active = false;
      node.style.transition = "transform 0.34s var(--spring)";
      node.style.transform = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    node.addEventListener("pointerdown", e => {
      active = true; sx = e.clientX; sy = e.clientY;
      node.style.transition = "transform 0.12s var(--ease)";
      node.style.transform = "scale(" + scale + ")";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
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
    navigator.geolocation.getCurrentPosition(
      pos => { state.userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setFoot("Using your location for travel times", false, true); },
      () => { state.userLoc = DATA.center; setFoot("Location off — distances from Marienplatz", true); },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 120000 }
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

    // default selection for non-type fields = first option ("any")
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

  /* ---------- compute results ---------- */
  function compute() {
    let list = DATA.places
      .filter(p => p.category === state.type)
      .map(p => Object.assign({}, p, travelTimes(p)));
    if (state.travel !== "any") list = list.filter(p => p.driveMin <= state.travel);
    if (state.rating !== "any") list = list.filter(p => p.rating >= state.rating);
    list.sort((a, b) => a.driveMin - b.driveMin || b.rating - a.rating);
    return list;
  }

  /* ---------- results screen ---------- */
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
    const body = el(
      '<div class="card-body">' +
        '<div class="card-title">' + p.name + "</div>" +
        statHTML(p) +
      "</div>"
    );
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
        '<div class="empty">' +
          '<div class="empty-ico">' + ICON.search + "</div>" +
          "<h3>Nothing matches yet</h3>" +
          "<p>Try widening the travel time or lowering the rating.</p>" +
        "</div>"
      ));
      return;
    }
    state.results.forEach((p, i) => {
      const c = makeCard(p);
      c.style.animationDelay = Math.min(i * 45, 400) + "ms";
      listEl.appendChild(c);
    });
  }

  /* ---------- detail screen ---------- */
  function chip(inner, cls) { return '<span class="chip' + (cls ? " " + cls : "") + '">' + inner + "</span>"; }

  function computePan() {
    const img = $("#detail-img"), stage = $("#detail-stage"), moveBtn = $("#detail-move");
    const rw = img.getBoundingClientRect().width, sw = stage.clientWidth;
    detail.maxPan = Math.max(0, (rw - sw) / 2 - 2);
    if (detail.maxPan < 8) { moveBtn.hidden = true; detail.pan = 0; img.style.setProperty("--pan", "0px"); }
    else moveBtn.hidden = false;
  }
  function setCollapsed(c) {
    $("#detail-panel").classList.toggle("is-collapsed", c);
    requestAnimationFrame(() => requestAnimationFrame(updatePanelMetrics));
  }
  function updatePanelMetrics() {
    const panel = $("#detail-panel"), moveBtn = $("#detail-move");
    const r = panel.getBoundingClientRect();
    moveBtn.style.bottom = Math.max(80, window.innerHeight - r.top + 12) + "px";
  }

  function openDetail(p) {
    if (!p) return;
    state.current = p;
    detail.pan = 0;
    setCollapsed(false);
    $("#detail-name").textContent = p.name;

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

    $("#detail-stats-row").innerHTML = [
      chip(catIcon(p.category, 15) + '<span class="lbl">' + CATEGORIES[p.category].label + "</span>", "cat"),
      chip(ICON.star + "<b>" + p.rating.toFixed(1) + '</b><span class="cl">(' + compact(p.ratingCount) + ")</span>"),
      chip(ICON.walk + p.walkMin + ' <span class="cl">min</span>'),
      chip(ICON.car + p.driveMin + ' <span class="cl">min</span>')
    ].join("");
    $("#detail-loc").innerHTML = p.neighborhood ? chip(ICON.pin + '<span class="lbl">' + p.neighborhood + "</span>", "loc") : "";
    $("#detail-desc").textContent = p.description || "";
    $("#detail-maps").href = mapsUrl(p);
    requestAnimationFrame(updatePanelMetrics);
  }

  /* ---------- move / pan button ---------- */
  function setupMoveButton() {
    const btn = $("#detail-move"), img = $("#detail-img"), panel = $("#detail-panel");
    let active = false, startX = 0, startPan = 0, wasCollapsed = false;
    btn.addEventListener("pointerdown", e => {
      e.preventDefault();
      active = true; startX = e.clientX; startPan = detail.pan;
      try { btn.setPointerCapture(e.pointerId); } catch (err) {}
      btn.classList.add("is-held");
      haptic();
      wasCollapsed = panel.classList.contains("is-collapsed");
      setCollapsed(true);
    });
    btn.addEventListener("pointermove", e => {
      if (!active) return;
      const dx = e.clientX - startX;
      const pan = clamp(startPan + dx * 0.6, -detail.maxPan, detail.maxPan);  // slow, predictable
      detail.pan = pan;
      img.style.setProperty("--pan", pan + "px");
      btn.style.setProperty("--mv-x", clamp(dx, -9, 9) + "px");
    });
    const end = () => {
      if (!active) return;
      active = false;
      btn.classList.remove("is-held");
      btn.style.setProperty("--mv-x", "0px");
      setCollapsed(wasCollapsed);
    };
    btn.addEventListener("pointerup", end);
    btn.addEventListener("pointercancel", end);
  }

  /* ---------- grabber: drag down to minimise, up to restore ---------- */
  function setupGrabber() {
    const grab = $("#panel-grabber"), panel = $("#detail-panel");
    let active = false, sy = 0, moved = false;
    grab.addEventListener("pointerdown", e => {
      active = true; sy = e.clientY; moved = false;
      try { grab.setPointerCapture(e.pointerId); } catch (err) {}
      panel.style.transition = "none";
    });
    grab.addEventListener("pointermove", e => {
      if (!active) return;
      const dy = e.clientY - sy;
      if (Math.abs(dy) > 4) moved = true;
      panel.style.transform = "translateY(" + clamp(dy * 0.35, -14, 22) + "px)";
    });
    const end = e => {
      if (!active) return;
      active = false;
      const dy = (e && e.clientY != null ? e.clientY : sy) - sy;
      panel.style.transition = "transform 0.34s var(--spring)";
      panel.style.transform = "";
      if (!moved) setCollapsed(!panel.classList.contains("is-collapsed"));      // tap toggles
      else if (dy > 26) setCollapsed(true);
      else if (dy < -26) setCollapsed(false);
    };
    grab.addEventListener("pointerup", end);
    grab.addEventListener("pointercancel", end);
    grab.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setCollapsed(!panel.classList.contains("is-collapsed")); }
    });
  }

  /* ---------- back-swipe: drag right from the left edge → previous page ---------- */
  function currentView() {
    const a = document.querySelector(".screen.is-active");
    return a ? a.id : "home";
  }
  function prevView(v) { return v === "detail" ? "results" : (v === "results" ? "home" : null); }
  function clearSwipeStyles() {
    document.querySelectorAll(".screen").forEach(s => {
      s.classList.remove("swiping");
      s.style.transform = ""; s.style.filter = ""; s.style.boxShadow = ""; s.style.transition = "";
    });
  }
  function setupSwipeBack() {
    let active = false, decided = false, sx = 0, sy = 0, W = 0, curEl = null, prevEl = null, prevWasActive = false;
    document.addEventListener("pointerdown", e => {
      const v = currentView();
      if (v === "home") return;
      const t = e.target;
      if (!t || !t.closest) return;
      if (t.closest(".move-btn, .panel-grabber, .maps-btn, .dropdown")) return;
      if (v === "detail" && t.closest(".detail-panel")) return;
      const fromEdge = e.clientX < 36;
      if (v === "results" && !fromEdge) return;          // results list scrolls — edge only
      active = true; decided = false; sx = e.clientX; sy = e.clientY; W = window.innerWidth;
      curEl = document.getElementById(v);
      const pv = prevView(v); prevEl = pv ? document.getElementById(pv) : null;
    }, { passive: true });
    document.addEventListener("pointermove", e => {
      if (!active) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!decided) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx) || dx < 0) { active = false; return; }  // vertical or leftward → ignore
        decided = true;
        if (prevEl) {
          prevWasActive = prevEl.classList.contains("is-active");
          prevEl.classList.add("swiping", "is-active");
        }
        curEl.classList.add("swiping");
      }
      const d = Math.max(0, dx), p = d / W;
      curEl.style.transform = "translateX(" + d + "px)";
      curEl.style.boxShadow = "-14px 0 36px rgba(0,0,0,0.20)";
      if (prevEl) {
        prevEl.style.transform = "translateX(" + (-22 + 22 * p) + "%)";
        prevEl.style.filter = "brightness(" + (0.78 + 0.22 * p) + ")";
      }
    }, { passive: true });
    function settle(e) {
      if (!active) return;
      active = false;
      if (!decided) { clearSwipeStyles(); return; }
      const dx = (e && e.clientX != null ? e.clientX : sx) - sx;
      const commit = dx > W * 0.32;
      const cur = curEl, prev = prevEl, wasActive = prevWasActive;
      [cur, prev].forEach(s => { if (s) { s.classList.remove("swiping"); s.style.transition = "transform 0.34s var(--ease), filter 0.34s var(--ease), box-shadow 0.34s var(--ease)"; } });
      if (commit) {
        cur.style.transform = "translateX(" + W + "px)";
        if (prev) { prev.style.transform = "translateX(0)"; prev.style.filter = "brightness(1)"; }
        setTimeout(() => { history.back(); }, 300);   // popstate → applyView → clearSwipeStyles
      } else {
        cur.style.transform = "translateX(0)"; cur.style.boxShadow = "none";
        if (prev) { prev.style.transform = "translateX(-22%)"; prev.style.filter = "brightness(0.78)"; }
        setTimeout(() => {
          if (prev && !wasActive) prev.classList.remove("is-active");
          clearSwipeStyles();
        }, 340);
      }
    }
    document.addEventListener("pointerup", settle, { passive: true });
    document.addEventListener("pointercancel", settle, { passive: true });
  }

  /* ---------- navigation / router ---------- */
  function goTo(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.toggle("is-active", s.id === id));
  }
  function applyView(view, placeId) {
    clearSwipeStyles();
    setChrome(view);
    if (view === "results") { renderResults(); goTo("results"); }
    else if (view === "detail") {
      const p = state.results.find(x => x.id === placeId) || state.current;
      openDetail(p); goTo("detail");
    } else { goTo("home"); }
  }
  function pushView(view, placeId) {
    history.pushState({ view: view, placeId: placeId || null }, "");
    applyView(view, placeId);
  }
  window.addEventListener("popstate", e => {
    const s = e.state || { view: "home" };
    applyView(s.view, s.placeId);
  });
  window.addEventListener("resize", () => { if (currentView() === "detail") { computePan(); updatePanelMetrics(); } });

  /* ---------- Go ---------- */
  function onGo() {
    haptic();
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
    [$("#go"), $("#results-back"), $("#detail-back"), $("#detail-maps")].forEach(b => b && addPressGrow(b));
    setupMoveButton();
    setupGrabber();
    setupSwipeBack();
    history.replaceState({ view: "home" }, "");
    setChrome("home");
    requestLocation();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
