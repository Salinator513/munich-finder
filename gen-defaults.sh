#!/usr/bin/env bash
# Generate a per-type "no photo available" default graphic via codex.
# Pass the category keys that need a default as arguments, e.g.: gen-defaults.sh bakery pharmacy
set -u
OUT="/home/Sashamino/munich-finder/assets/defaults"
GEN_DIR="$HOME/.codex/generated_images"
mkdir -p "$OUT"; cd "$OUT" || exit 1

declare -A DESC=(
[monument]="a classical column-and-pediment monument symbol"
[restaurant]="a fork, knife and plate dining symbol"
[bakery]="a pretzel and croissant symbol"
[active]="a mountain, tree and walking-person outdoor symbol"
[supermarket]="a shopping cart symbol"
[pharmacy]="a medical cross and pill symbol"
)
declare -A TINT=(
[monument]="soft indigo and violet"
[restaurant]="warm orange and soft red"
[bakery]="warm amber and gold"
[active]="fresh green and sky blue"
[supermarket]="fresh green and mint"
[pharmacy]="soft rose and red"
)

for key in "$@"; do
  target="$OUT/$key.png"
  if [ -f "$target" ] && [ "$(stat -c%s "$target" 2>/dev/null || echo 0)" -gt 20000 ]; then echo "[skip] $key"; continue; fi
  echo "[gen ] default $key"
  codex exec --skip-git-repo-check -s workspace-write \
    -c 'sandbox_workspace_write.network_access=true' <<PROMPT
Use your image_gen tool to create one clean, minimal, modern placeholder graphic that gently signals "no photo available". Center a single simple flat line-icon — ${DESC[$key]} — on a smooth soft ${TINT[$key]} gradient background with lots of calm empty space. Elegant, Apple-style, subtle, no text, no words, no letters, no numbers, 4:3 horizontal. Save the PNG as "$target".
PROMPT
  if [ ! -f "$target" ] || [ "$(stat -c%s "$target" 2>/dev/null || echo 0)" -lt 20000 ]; then
    newest=$(find "$GEN_DIR" -type f -name '*.png' -newermt '-3 minutes' 2>/dev/null | xargs -r ls -1t 2>/dev/null | head -n1)
    [ -n "${newest:-}" ] && [ -f "$newest" ] && cp "$newest" "$target" && echo "[copy] $key"
  fi
  echo "[done] $key -> $(stat -c%s "$target" 2>/dev/null || echo 0) bytes"
done
echo "DEFAULTS DONE"
