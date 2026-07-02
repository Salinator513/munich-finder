#!/usr/bin/env node
/*
 * merge-verified.mjs — merge verify-places.mjs results (and optional Google ratings)
 * into data.js. Deterministic, no AI.
 *
 * Usage: node tools/merge-verified.mjs <verify-report.json> [accepts.json] [ratings.json]
 *   verify-report.json — output of verify-places.mjs
 *   accepts.json       — {"<place-id>": "<candidate filename>" | null} photo review verdicts;
 *                        ids absent from the file get NO photo change. Copies accepted files
 *                        from <report dir>/candidates/ into assets/places/.
 *   ratings.json       — output of fetch-ratings.mjs (Google); applies rating/ratingCount
 *                        when the Google match is within 500 m of the place.
 *
 * Coordinate rule: for places that were still unverified at scan time, adopt the nearest
 * OSM match when it's 25–800 m away (closer = already right, farther = suspicious → skipped
 * and listed for manual review). Verified places are never auto-moved.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [reportPath, acceptsPath, ratingsPath] = process.argv.slice(2);
if (!reportPath) { console.error("usage: merge-verified.mjs <verify-report.json> [accepts.json] [ratings.json]"); process.exit(1); }

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const accepts = acceptsPath ? JSON.parse(fs.readFileSync(acceptsPath, "utf8")) : {};
const ratings = ratingsPath ? JSON.parse(fs.readFileSync(ratingsPath, "utf8")) : [];
const CAND = path.join(path.dirname(path.resolve(reportPath)), "candidates");

const dataPath = path.join(ROOT, "data.js");
const src = fs.readFileSync(dataPath, "utf8");
const DATA = JSON.parse(src.slice(src.indexOf("{"), src.lastIndexOf("}") + 1));
const byId = new Map(DATA.places.map(p => [p.id, p]));

let moved = 0, photos = 0, rated = 0;
const manual = [];

for (const r of report) {
  const p = byId.get(r.id);
  if (!p) continue;
  // coordinates
  const near = r.geo && r.geo.nearest;
  if (!r.verified && near) {
    if (near.distM >= 25 && near.distM <= 800) { p.lat = near.lat; p.lng = near.lng; moved++; }
    else if (near.distM > 800) manual.push(`${r.id}: OSM nearest ${near.distM}m away (${near.name})`);
  } else if (!r.verified && r.geo && r.geo.status !== "ok") {
    manual.push(`${r.id}: not found on OSM`);
  }
  // photo
  const accepted = accepts[r.id];
  if (accepted) {
    const from = path.join(CAND, accepted);
    const to = path.join(ROOT, "assets", "places", accepted);
    fs.copyFileSync(from, to);
    p.imageUrl = "assets/places/" + accepted;
    p.isPhoto = true;
    photos++;
  }
}

for (const g of ratings) {
  const p = byId.get(g.id);
  if (!p || g.rating == null || g.distM == null || g.distM > 500) continue;
  p.rating = g.rating;
  p.ratingCount = g.ratingCount || p.ratingCount;
  rated++;
}

const banner = src.slice(0, src.indexOf("window.MUNICH_DATA"));
fs.writeFileSync(dataPath, banner + "window.MUNICH_DATA = " + JSON.stringify(DATA, null, 2) + ";\n");
console.log(`merged: ${moved} coord fixes, ${photos} photos, ${rated} ratings`);
if (manual.length) console.log("MANUAL REVIEW:\n  " + manual.join("\n  "));
