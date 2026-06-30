#!/usr/bin/env bash
# Generate the six category banner images with codex image_gen.
# Resumable: skips a banner if its PNG already exists and is non-trivial.
set -u
OUT="/home/Sashamino/munich-finder/assets/banners"
GEN_DIR="$HOME/.codex/generated_images"
mkdir -p "$OUT"
cd "$OUT" || exit 1

declare -A PROMPTS
PROMPTS[monument]="A beautiful photorealistic wide cinematic hero photograph of famous Munich monuments: the Frauenkirche twin onion-dome towers rising behind the Marienplatz New Town Hall, soft golden morning light, clear blue sky, iconic and instantly recognizable, ultra sharp, no text, no watermark, 16:9 horizontal."
PROMPTS[restaurant]="A warm photorealistic wide cinematic hero photograph of a classic Munich Bavarian beer garden: long wooden communal tables under leafy green chestnut trees, pretzels and frothy beer steins on the table, cozy inviting golden-hour atmosphere, ultra sharp, no text, no watermark, 16:9 horizontal."
PROMPTS[bakery]="A warm photorealistic wide cinematic hero photograph of a traditional German bakery in Munich: a glowing shop window and counter full of fresh pretzels, crusty breads and pastries, inviting soft morning light, ultra sharp, no text, no watermark, 16:9 horizontal."
PROMPTS[active]="A vibrant photorealistic wide cinematic hero photograph of active outdoor Munich: a wetsuited surfer riding the famous Eisbach standing river wave at the edge of the green English Garden, dynamic spray and motion, energetic, ultra sharp, no text, no watermark, 16:9 horizontal."
PROMPTS[supermarket]="A clean bright photorealistic wide hero photograph of a modern European supermarket interior: colourful fresh fruit and vegetable produce aisles, neat and welcoming, soft even lighting, ultra sharp, no text, no watermark, 16:9 horizontal."
PROMPTS[pharmacy]="A clean photorealistic wide hero photograph of a European pharmacy Apotheke storefront with a clear red pharmacy cross sign and tidy well-lit shelves, friendly trustworthy mood, ultra sharp, no gibberish text, 16:9 horizontal."

for key in monument restaurant bakery active supermarket pharmacy; do
  target="$OUT/$key.png"
  if [ -f "$target" ] && [ "$(stat -c%s "$target" 2>/dev/null || echo 0)" -gt 20000 ]; then
    echo "[$key] already exists, skipping"
    continue
  fi
  echo "[$key] generating..."
  codex exec --skip-git-repo-check -s workspace-write \
    -c 'sandbox_workspace_write.network_access=true' <<PROMPT
Use your image_gen tool to create one image. ${PROMPTS[$key]}
Save the resulting PNG file as "$target".
PROMPT
  # Fallback: if codex saved only into its own dir, copy the newest png over.
  if [ ! -f "$target" ] || [ "$(stat -c%s "$target" 2>/dev/null || echo 0)" -lt 20000 ]; then
    newest=$(find "$GEN_DIR" -type f -name '*.png' -newermt '-3 minutes' 2>/dev/null | xargs -r ls -1t 2>/dev/null | head -n1)
    if [ -n "${newest:-}" ] && [ -f "$newest" ]; then
      cp "$newest" "$target" && echo "[$key] copied from $newest"
    else
      echo "[$key] WARNING: no output png found"
    fi
  fi
  echo "[$key] done -> $(stat -c%s "$target" 2>/dev/null || echo 0) bytes"
done
echo "ALL BANNERS DONE"
ls -la "$OUT"
