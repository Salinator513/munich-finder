# Servus — Where to in Munich

A simple, Apple-styled place finder for the family. Pick a **type**, a **walking time**, and a
**minimum rating**, tap **Go**, and get a list of real Munich spots sorted by how close they are —
each with a live walking-time estimate from your current location, a photo, and a one-tap **Open in Apple Maps** button.

55 real, fact-checked Munich places across 6 types: monuments, restaurants & beer gardens,
bakeries & cafés, active attractions, supermarkets, and pharmacies.

## Run it locally

It's a plain static site — no build step.

```bash
cd munich-finder
python3 -m http.server 8765
```

Then open <http://localhost:8765>. Geolocation works on `localhost` automatically.

## Put it on the family's phones

Phones need HTTPS for location to work. Easiest option: drag the `munich-finder` folder onto
[app.netlify.com/drop](https://app.netlify.com/drop) (free) — you get an HTTPS link to share.
(GitHub Pages or Vercel work too.)

## How it's built

- `index.html` / `styles.css` / `app.js` — the three screens (Home → Results → Detail).
- `data.js` — the place data (name, rating, # of ratings, address, coordinates, description).
- `assets/banners/` — one hero image per type.
- `assets/places/` — real photos found via web search (Wikimedia Commons, Wikipedia, official sites).
- `assets/defaults/` — per-type "no photo" placeholders, used only for the few places with no findable photo.

Walking times are estimated from your live location to each place using straight-line distance,
a walking detour factor, and a pace of about 5 km/h. To add or edit places, edit `data.js`.
