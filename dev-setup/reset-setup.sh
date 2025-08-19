#!/usr/bin/env bash
# Reset a dev/staging box WITHOUT uninstalling packages.
# - Stops/deletes PM2 app "6529seize" (if any)
# - Kills process on given port (default 3001)
# - Removes repo dir
# - Removes nginx vhost for <slug>staging.6529.io (if present) and reloads nginx
# Safe to run on a brand-new EC2 (no failures if things aren’t there).

set -uo pipefail  # no -e on purpose; we want best-effort cleanup
IFS=$'\n\t'

# -------- helpers --------
log()  { echo -e "\033[36m[info]\033[0m $*"; }
ok()   { echo -e "\033[32m[ok]\033[0m $*"; }
warn() { echo -e "\033[33m[warn]\033[0m $*"; }
err()  { echo -e "\033[31m[err]\033[0m  $*"; }

read_tty() {
  # read from tty even if stdin is redirected
  exec 3</dev/tty || true
  local __prompt="$1"; shift
  local __varname="$1"; shift
  local __default="${1:-}"
  local __val=""
  if [[ -n "$__default" ]]; then
    read -u 3 -r -p "$__prompt [default: ${__default}]: " __val || true
    __val="${__val:-$__default}"
  else
    read -u 3 -r -p "$__prompt: " __val || true
  fi
  printf -v "$__varname" '%s' "$__val"
  exec 3<&- || true
}

# cross-platform sed -i
sedi() { if [[ "$(uname -s)" == "Darwin" ]]; then sed -i '' "$@"; else sed -i "$@"; fi; }

# -------- inputs --------
# Repo path: try the parent of this script first; fall back to ~/6529seize-frontend
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_REPO_ROOT="$(cd "$SCRIPT_DIR/.." 2>/dev/null && pwd || echo "/home/ubuntu/6529seize-frontend")"

read_tty "Path to repo root" REPO_ROOT "$DEFAULT_REPO_ROOT"
if [[ ! -d "$REPO_ROOT" ]]; then
  warn "Repo directory not found at $REPO_ROOT (that’s OK on a fresh EC2)."
fi

# Port the app listens on (default 3001)
read_tty "App port to free" APP_PORT "3001"

# Dev slug (to compute domain)
read_tty "Developer slug (e.g., prxt) for domain cleanup" DEV_SLUG ""
DEV_DOMAIN=""
if [[ -n "${DEV_SLUG:-}" ]]; then
  DEV_DOMAIN="${DEV_SLUG}staging.6529.io"
  ok "Derived domain: $DEV_DOMAIN"
else
  warn "No slug provided — skipping domain-based NGINX cleanup."
fi

# -------- PM2 cleanup --------
if command -v pm2 >/dev/null 2>&1; then
  log "Stopping PM2 app '6529seize' (if any)…"
  pm2 stop 6529seize >/dev/null 2>&1 || true
  log "Deleting PM2 app '6529seize' (if any)…"
  pm2 delete 6529seize >/dev/null 2>&1 || true
  pm2 save >/dev/null 2>&1 || true
  ok "PM2 cleaned."
else
  warn "PM2 not found — skipping."
fi

# -------- kill anything on the port --------
if command -v lsof >/dev/null 2>&1; then
  PIDLIST="$(lsof -tiTCP:${APP_PORT} -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$PIDLIST" ]]; then
    log "Killing PIDs on port ${APP_PORT}: $PIDLIST"
    for p in $PIDLIST; do
      kill "$p" 2>/dev/null || true
    done
    sleep 1
    # force kill if still alive
    for p in $PIDLIST; do
      kill -9 "$p" 2>/dev/null || true
    done
    ok "Port ${APP_PORT} freed."
  else
    ok "No process is listening on port ${APP_PORT}."
  fi
else
  warn "lsof not found — skipping port kill."
fi

# -------- nginx cleanup --------
if command -v nginx >/dev/null 2>&1; then
  if [[ -n "$DEV_DOMAIN" ]]; then
    VHOST_AV="/etc/nginx/sites-available/${DEV_DOMAIN}.conf"
    VHOST_EN="/etc/nginx/sites-enabled/${DEV_DOMAIN}.conf"
    if [[ -f "$VHOST_EN" || -L "$VHOST_EN" ]]; then
      log "Removing $VHOST_EN"
      sudo rm -f "$VHOST_EN" || true
    fi
    if [[ -f "$VHOST_AV" ]]; then
      log "Removing $VHOST_AV"
      sudo rm -f "$VHOST_AV" || true
    fi
  else
    warn "No domain provided; attempting generic cleanup of *staging.6529.io vhosts."
    for f in /etc/nginx/sites-enabled/*staging.6529.io*.conf; do
      [[ -e "$f" ]] || continue
      log "Removing $f"
      sudo rm -f "$f" || true
    done
    for f in /etc/nginx/sites-available/*staging.6529.io*.conf; do
      [[ -e "$f" ]] || continue
      log "Removing $f"
      sudo rm -f "$f" || true
    done
  fi
  # test & reload nginx
  if sudo nginx -t >/dev/null 2>&1; then
    sudo systemctl reload nginx || true
    ok "NGINX reloaded."
  else
    warn "NGINX config test failed — maybe nothing left to load (that’s fine)."
  fi
else
  warn "NGINX not installed — skipping NGINX cleanup."
fi

# -------- repo cleanup --------
if [[ -d "$REPO_ROOT" ]]; then
  log "Removing repo directory: $REPO_ROOT"
  rm -rf "$REPO_ROOT" || true
  ok "Repo removed."
else
  ok "Repo directory not found — skipping."
fi

# -------- env/pm2 residuals --------
if [[ -d "$HOME/.pm2" ]]; then
  log "Keeping ~/.pm2 directory (PM2 installed). To fully nuke, remove manually."
fi

ok "Reset complete. This instance should now be clean enough to re-run your setup script."