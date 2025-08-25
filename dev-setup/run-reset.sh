#!/usr/bin/env bash
set -euo pipefail

color() {
  case "$1" in
    red) echo -e "\033[31m$2\033[0m";;
    green) echo -e "\033[32m$2\033[0m";;
    yellow) echo -e "\033[33m$2\033[0m";;
    *) echo "$2";;
  esac
}

# Resolve repo root from this script's location, but fall back to ~/6529seize-frontend
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." 2>/dev/null && pwd || true)"
REPO_ROOT="${REPO_ROOT:-$HOME/6529seize-frontend}"

color yellow "Stopping PM2 process (if exists)…"
if command -v pm2 >/dev/null 2>&1; then
  pm2 delete 6529seize >/dev/null 2>&1 || true
  pm2 save >/dev/null 2>&1 || true
else
  color yellow "PM2 not installed; skipping."
fi

color yellow "Freeing default app port 3001 (best-effort)…"
if command -v lsof >/dev/null 2>&1; then
  for p in $(lsof -tiTCP:3001 -sTCP:LISTEN 2>/dev/null || true); do
    kill "$p" 2>/dev/null || true
    sleep 0.5
    kill -9 "$p" 2>/dev/null || true
  done
fi

color yellow "Removing NGINX vhosts (best-effort)…"
if command -v nginx >/dev/null 2>&1; then
  # Remove both the generic name (if you used it) and any per-slug staging vhosts
  sudo rm -f /etc/nginx/sites-enabled/6529seize-staging.conf /etc/nginx/sites-available/6529seize-staging.conf || true
  for f in /etc/nginx/sites-enabled/*staging.6529.io*.conf; do [[ -e "$f" ]] && sudo rm -f "$f" || true; done
  for f in /etc/nginx/sites-available/*staging.6529.io*.conf; do [[ -e "$f" ]] && sudo rm -f "$f" || true; done
  # Reload nginx if config still valid
  if sudo nginx -t >/dev/null 2>&1; then
    sudo systemctl reload nginx || true
  fi
else
  color yellow "NGINX not installed; skipping."
fi

# Move out of the repo before deleting it (so we don't nuke our CWD)
cd /tmp || cd /

color yellow "Removing repo at: $REPO_ROOT"
rm -rf "$REPO_ROOT" || true

color green "Reset complete. You can now re-clone the repo and run setup."