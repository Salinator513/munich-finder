#!/usr/bin/env node
/*
 * fetch-ratings.mjs — pull REAL Google ratings (+ a coordinate cross-check) for every
 * place in data.js, using the Google Places API (New). No AI usage — just HTTP.
 *
 * You need a (free) Google Maps Platform API key with "Places API (New)" enabled:
 *   1. console.cloud.google.com → create project → "Keys & Credentials" → Create API key
 *   2. Enable "Places API (New)" for the project.
 *   The free monthly tier (1,000 Enterprise-SKU calls) covers this script ~6x over.
 *
 * Run:    GOOGLE_KEY=AIza... node tools/fetch-ratings.mjs
 * Output: tools/out/ratings.json  (then Claude merges it into data.js)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KEY = process.env.GOOGLE_KEY;
if (!KEY) { console.error("Set GOOGLE_KEY=<your Google Maps Platform API key>"); process.exit(1); }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "tools", "out");
fs.mkdirSync(OUT, { recursive: true });

const src = fs.readFileSync(path.join(ROOT, "data.js"), "utf8");
const DATA = JSON.parse(src.slice(src.indexOf("{"), src.lastIndexOf("}") + 1));

const sleep = ms => new Promise(r => setTimeout(r, ms));
function haversineM(a, b) {
  const R = 6371000, toR = d => (d * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
}

const results = [];
let i = 0;
for (const p of DATA.places) {
  i++;
  const body = {
    textQuery: p.name.replace(/\s*\([^)]*\)\s*/g, " ").trim() + ", München",
    locationBias: { circle: { center: { latitude: p.lat, longitude: p.lng }, radius: 2000 } },
    pageSize: 1
  };
  let entry = { id: p.id, name: p.name };
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": KEY,
        "X-Goog-FieldMask": "places.displayName,places.rating,places.userRatingCount,places.location"
      },
      body: JSON.stringify(body)
    });
    const j = await res.json();
    const g = (j.places || [])[0];
    if (g) {
      entry.googleName = g.displayName && g.displayName.text;
      entry.rating = g.rating != null ? g.rating : null;
      entry.ratingCount = g.userRatingCount != null ? g.userRatingCount : null;
      entry.lat = g.location.latitude; entry.lng = g.location.longitude;
      entry.distM = haversineM({ lat: p.lat, lng: p.lng }, { lat: entry.lat, lng: entry.lng });
    } else entry.error = j.error ? (j.error.message || "api error") : "no match";
  } catch (e) { entry.error = String(e); }
  results.push(entry);
  console.log(`[${i}/${DATA.places.length}] ${p.id} → ${entry.googleName || entry.error} ${entry.rating != null ? entry.rating + "★(" + entry.ratingCount + ")" : ""} ${entry.distM != null ? entry.distM + "m" : ""}`);
  fs.writeFileSync(path.join(OUT, "ratings.json"), JSON.stringify(results, null, 1));
  await sleep(120);
}
console.log("DONE →", path.join(OUT, "ratings.json"));
