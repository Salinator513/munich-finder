#!/usr/bin/env node
/*
 * verify-places.mjs — offline data verifier for Servus (no AI, no API keys).
 *
 * For EVERY place in data.js:
 *   - geocode-checks the name against OpenStreetMap Nominatim and reports how far
 *     the found coordinates are from the ones in data.js (candidate corrections).
 * For every place still WITHOUT a real photo (imageUrl == null):
 *   - hunts a real, freely-licensed photo via Wikimedia Commons (geosearch around
 *     the place + text search) and German/English Wikipedia page images,
 *     downloads the best candidate as a ~1600px thumb.
 *
 * Usage:  node tools/verify-places.mjs [outDir]
 * Output: <outDir>/verify-report.json + <outDir>/candidates/<id>.jpg
 * Runtime: ~10-12 min (Nominatim allows 1 req/s; Wikimedia downloads are spaced 3s).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.resolve(process.argv[2] || path.join(ROOT, "tools", "out"));
const CAND = path.join(OUT, "candidates");
fs.mkdirSync(CAND, { recursive: true });

const UA = "ServusMunichFinder/1.0 (family travel app; contact: tolik21@gmail.com)";
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- load data.js ---------- */
const src = fs.readFileSync(path.join(ROOT, "data.js"), "utf8");
const DATA = JSON.parse(src.slice(src.indexOf("{"), src.lastIndexOf("}") + 1));
const places = DATA.places;

function haversineM(a, b) {
  const R = 6371000, toR = d => (d * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
}

async function getJSON(url, extraHeaders) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: Object.assign({ "User-Agent": UA, "Accept": "application/json" }, extraHeaders || {}) });
      if (res.status === 429) { await sleep(5000 * attempt); continue; }
      if (!res.ok) return null;
      return await res.json();
    } catch (e) { await sleep(2000 * attempt); }
  }
  return null;
}

/* ---------- 1) Nominatim geocode check ---------- */
const cleanName = n => n.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
const parenName = n => (n.match(/\(([^)]+)\)/) || [])[1] || null;

async function nominatim(q) {
  const url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=0&q=" +
    encodeURIComponent(q) + "&viewbox=11.36,48.25,11.72,48.05&bounded=1";
  const j = await getJSON(url);
  await sleep(1150); // Nominatim usage policy: max 1 req/s
  return Array.isArray(j) ? j : [];
}

async function geocodeCheck(p) {
  const tried = [];
  let results = [];
  for (const q of [cleanName(p.name) + ", München", parenName(p.name) ? parenName(p.name) + ", München" : null, cleanName(p.name)]) {
    if (!q) continue;
    tried.push(q);
    results = await nominatim(q);
    if (results.length) break;
  }
  if (!results.length) return { status: "not_found", tried };
  const cur = { lat: p.lat, lng: p.lng };
  const cands = results.map(r => ({
    name: r.display_name.split(",").slice(0, 2).join(","),
    cls: r.class + "/" + r.type,
    lat: +r.lat, lng: +r.lon,
    distM: haversineM(cur, { lat: +r.lat, lng: +r.lon })
  })).sort((a, b) => a.distM - b.distM);
  return { status: "ok", tried, nearest: cands[0], all: cands };
}

/* ---------- 2) photo hunt (Commons + Wikipedia) ---------- */
const BAD_IMG = /\b(map|karte|plan|logo|wappen|coat|diagram|svg|icon|banner|schild|sign)\b/i;

function scoreTitle(title, placeName) {
  const t = title.toLowerCase();
  let s = 0;
  for (const w of cleanName(placeName).toLowerCase().split(/[^a-zäöüß0-9]+/))
    if (w.length > 3 && t.includes(w)) s += 2;
  if (/\.jpe?g$/i.test(title)) s += 1;
  if (BAD_IMG.test(title)) s -= 10;
  return s;
}

async function commonsGeo(p, lat, lng) {
  const j = await getJSON("https://commons.wikimedia.org/w/api.php?action=query&format=json&list=geosearch&gsnamespace=6&gslimit=20&gsradius=180&gscoord=" + lat + "%7C" + lng);
  await sleep(400);
  const files = (((j || {}).query || {}).geosearch || []).map(g => g.title);
  return files.sort((a, b) => scoreTitle(b, p.name) - scoreTitle(a, p.name));
}

async function commonsSearch(p) {
  const j = await getJSON("https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srnamespace=6&srlimit=10&srsearch=" + encodeURIComponent(cleanName(p.name) + " München"));
  await sleep(400);
  const files = (((j || {}).query || {}).search || []).map(g => g.title);
  return files.sort((a, b) => scoreTitle(b, p.name) - scoreTitle(a, p.name));
}

async function wikipediaImage(p, lang) {
  const j = await getJSON("https://" + lang + ".wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrlimit=1&gsrsearch=" +
    encodeURIComponent(cleanName(p.name) + " München") + "&prop=pageimages&piprop=original%7Cname&pilicense=any");
  await sleep(400);
  const pages = ((j || {}).query || {}).pages || {};
  const pg = Object.values(pages)[0];
  if (!pg || !pg.original || !pg.original.source) return null;
  if (BAD_IMG.test(pg.original.source) || /\.svg$/i.test(pg.original.source)) return null;
  return { url: pg.original.source, source: lang + ".wikipedia: " + pg.title, title: pg.pageimage || pg.title };
}

async function commonsThumb(fileTitle) {
  const j = await getJSON("https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url%7Csize%7Cextmetadata&iiurlwidth=1600&titles=" + encodeURIComponent(fileTitle));
  await sleep(400);
  const pg = Object.values((((j || {}).query || {}).pages) || {})[0];
  const ii = pg && pg.imageinfo && pg.imageinfo[0];
  if (!ii) return null;
  const meta = ii.extmetadata || {};
  return {
    url: ii.thumburl || ii.url, w: ii.thumbwidth || ii.width, h: ii.thumbheight || ii.height,
    source: "commons: " + fileTitle,
    license: (meta.LicenseShortName || {}).value || "?"
  };
}

async function download(url, dest) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.status === 429) { await sleep(6000 * attempt); continue; }
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 8000) return null;
      fs.writeFileSync(dest, buf);
      return buf.length;
    } catch (e) { await sleep(3000 * attempt); }
  }
  return null;
}

async function findPhoto(p, bestLat, bestLng) {
  // ordered candidate URLs; stop at first good download
  const cands = [];
  for (const t of (await commonsGeo(p, bestLat, bestLng)).slice(0, 3)) {
    if (scoreTitle(t, p.name) < 0) continue;
    const c = await commonsThumb(t);
    if (c) cands.push(c);
    if (cands.length >= 2) break;
  }
  const wp = (await wikipediaImage(p, "de")) || (await wikipediaImage(p, "en"));
  if (wp) cands.push(Object.assign({ license: "wikipedia pageimage" }, wp));
  if (cands.length < 2) {
    for (const t of (await commonsSearch(p)).slice(0, 2)) {
      if (scoreTitle(t, p.name) <= 0) continue;
      const c = await commonsThumb(t);
      if (c) cands.push(c);
      if (cands.length >= 3) break;
    }
  }
  for (const c of cands) {
    const ext = /\.png$/i.test(c.url) ? ".png" : ".jpg";
    const dest = path.join(CAND, p.id + ext);
    const bytes = await download(c.url, dest);
    await sleep(3000); // upload.wikimedia rate-limit courtesy (see 429 history)
    if (bytes) return { file: path.basename(dest), bytes, source: c.source, license: c.license || "?", url: c.url };
  }
  return null;
}

/* ---------- main ---------- */
const report = [];
let i = 0;
const subset = process.env.LIMIT ? places.filter(p => !p.imageUrl).slice(0, +process.env.LIMIT) : places;
for (const p of subset) {
  i++;
  const entry = { id: p.id, name: p.name, category: p.category, cur: { lat: p.lat, lng: p.lng }, verified: !!p.imageUrl };
  entry.geo = await geocodeCheck(p);
  const near = entry.geo.nearest;
  const bestLat = near && near.distM < 800 ? near.lat : p.lat;
  const bestLng = near && near.distM < 800 ? near.lng : p.lng;
  if (!p.imageUrl) entry.photo = await findPhoto(p, bestLat, bestLng);
  process.stderr.write(`[${i}/${subset.length}] ${p.id} geo=${entry.geo.status}${near ? " " + near.distM + "m" : ""}${entry.photo ? " photo=" + entry.photo.file : p.imageUrl ? "" : " photo=NONE"}\n`);
  report.push(entry);
  fs.writeFileSync(path.join(OUT, "verify-report.json"), JSON.stringify(report, null, 1)); // checkpoint every place
}
console.log("DONE", report.length, "places;",
  report.filter(r => r.geo.status !== "ok").length, "geo-misses;",
  report.filter(r => r.photo).length, "photos found of", report.filter(r => !r.verified).length, "needed");
