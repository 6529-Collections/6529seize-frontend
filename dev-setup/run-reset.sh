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

color yellow "Stopping PM2 process (if exists)..."
pm2 delete 6529seize >/dev/null 2>&1 || true
pm2 save >/dev/null 2>&1 || true

color yellow "Removing repo..."
rm -rf ~/6529seize-frontend || true

color yellow "Removing Nginx config..."
sudo rm -f /etc/nginx/sites-enabled/6529seize-staging.conf || true
sudo rm -f /etc/nginx/sites-available/6529seize-staging.conf || true
sudo nginx -t >/dev/null 2>&1 && sudo systemctl reload nginx || true

color green "Reset complete. You can now re-clone the repo and run setup."