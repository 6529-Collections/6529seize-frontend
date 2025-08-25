#!/usr/bin/env bash

# ----------------------------------------------------------------------------
# Script: dev-ec2-setup.sh
#
# Description:
#   Bootstraps a host to build & run 6529seize-frontend for staging/dev.
#   - Accepts Node >= 20; installs Node 20 only if Node missing or < 20.
#   - Ensures npm >= 10 (upgrades if < 10; leaves 10+ unchanged).
#   - Installs PM2, prompts ONCE at the beginning for all inputs (.env + nginx),
#     builds, starts via PM2, optionally configures NGINX + Let's Encrypt.
#   - Configures PM2 to start on boot + enables pm2-logrotate.
#
# Usage:
#   bash scripts/dev-ec2-setup.sh
# ----------------------------------------------------------------------------

set -Eeuo pipefail
trap 'echo -e "\033[31m[ERROR]\033[0m line $LINENO: \"$BASH_COMMAND\" failed. Exiting." >&2' ERR

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

color() {
  local code="$1"; shift
  local text="$*"
  case "$code" in
    red)     echo -e "\033[31m${text}\033[0m";;
    green)   echo -e "\033[32m${text}\033[0m";;
    yellow)  echo -e "\033[33m${text}\033[0m";;
    blue)    echo -e "\033[34m${text}\033[0m";;
    magenta) echo -e "\033[35m${text}\033[0m";;
    cyan)    echo -e "\033[36m${text}\033[0m";;
    *)       echo "$text";;
  esac
}

require_sudo_if_linux() {
  if [[ "$(uname -s)" != "Darwin" ]]; then
    if [[ "$EUID" -ne 0 ]] && ! command -v sudo >/dev/null 2>&1; then
      color red "This script needs root or sudo privileges on Linux. Aborting."
      exit 1
    fi
  fi
}

# ---------- Prompt helpers (one-shot input phase) ----------

prompt_choice() {
  # args: var_name question default_value option1_label option1_value option2_label option2_value ...
  local __varname="$1"; shift
  local question="$1"; shift
  local default="$1"; shift
  exec 3</dev/tty || true
  color cyan "$question"
  declare -a labels values
  while (( "$#" )); do labels+=("$1"); values+=("$2"); shift 2; done
  for i in "${!labels[@]}"; do
    local n=$((i+1))
    if [[ "${values[$i]}" == "$default" ]]; then
      echo "  $n) ${labels[$i]} [default]"
    else
      echo "  $n) ${labels[$i]}"
    fi
  done
  local choice=""
  read -u 3 -r -p "Choose [1-${#labels[@]}] ($default): " choice || true
  if [[ -z "$choice" ]]; then
    printf -v "$__varname" '%s' "$default"
  else
    if ! [[ "$choice" =~ ^[0-9]+$ ]] || (( choice < 1 || choice > ${#labels[@]} )); then
      color yellow "Invalid choice. Using default ($default)."
      printf -v "$__varname" '%s' "$default"
    else
      local idx=$((choice-1)); printf -v "$__varname" '%s' "${values[$idx]}"
    fi
  fi
  exec 3<&- || true
}

prompt_input_required() {
  local __varname="$1"; shift
  local prompt="$1"; shift
  local default="${1:-}"
  exec 3</dev/tty || true
  local val=""
  while true; do
    if [[ -n "$default" ]]; then
      read -u 3 -r -p "$prompt [default: $default]: " val || true
      val="${val:-$default}"
    else
      read -u 3 -r -p "$prompt: " val || true
    fi
    [[ -n "$val" ]] && break
    color red "This value is required."
  done
  printf -v "$__varname" '%s' "$val"
  exec 3<&- || true
}

# ---------- Tech prerequisites ----------

ensure_node_ge20_and_npm_ge10() {
  # Accept Node >= 20; install Node 20 only if missing or < 20.
  local os="$(uname -s)"; local need_major=20; local have_major=0
  if command -v node >/dev/null 2>&1; then
    local have_ver; have_ver="$(node -v | sed 's/^v//')"; have_major="${have_ver%%.*}"
    if [[ "$have_major" -ge "$need_major" ]]; then
      color green "Node v$have_ver detected (>= 20). OK."
    else
      color yellow "Node v$have_ver detected (< 20). Installing Node 20…"; have_major=0
    fi
  else
    color yellow "Node not found. Installing Node 20…"
  fi

  if [[ "$have_major" -lt "$need_major" ]]; then
    if [[ "$os" == "Darwin" ]]; then
      if command -v brew >/dev/null 2>&1; then
        brew install node@20
        brew unlink node >/dev/null 2>&1 || true
        brew link --overwrite --force node@20
      else
        color red "Homebrew not found. Install Node 20 via Homebrew or nvm, then re-run."; exit 1
      fi
    else
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
      sudo apt-get update -y
      sudo apt-get install -y nodejs build-essential
    fi
  fi

  local final_node; final_node="$(node -v | sed 's/^v//')"
  local final_major="${final_node%%.*}"
  if [[ "$final_major" -lt 20 ]]; then
    color red "Node $(node -v) < 20 after installation. Please install Node >= 20 and re-run."; exit 1
  fi

  local npm_major; npm_major="$(npm -v | cut -d. -f1 || echo 0)"
  if [[ "$npm_major" -lt 10 ]]; then
    color yellow "Upgrading npm to >=10…"
    if [[ "$(uname -s)" == "Darwin" ]]; then npm i -g npm@^10; else sudo npm i -g npm@^10; fi
  fi
  color green "Using Node $(node -v), npm $(npm -v)"
}

install_pm2() {
  if ! command -v pm2 >/dev/null 2>&1; then
    color yellow "Installing PM2 globally…"
    if [[ "$(uname -s)" == "Darwin" ]]; then npm i -g pm2; else sudo npm i -g pm2; fi
  fi
  color green "PM2: $(pm2 -v)"
}

ensure_java_for_openapi() {
  if command -v java >/dev/null 2>&1; then
    color green "Java detected: $(java -version 2>&1 | head -n1)"; return 0
  fi
  color yellow "Java not found. Installing OpenJDK 17 (headless)…"
  if [[ "$(uname -s)" == "Darwin" ]]; then
    if command -v brew >/dev/null 2>&1; then
      brew install openjdk@17
      if [[ -d "/opt/homebrew/opt/openjdk@17/bin" ]]; then
        export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
      elif [[ -d "/usr/local/opt/openjdk@17/bin" ]]; then
        export PATH="/usr/local/opt/openjdk@17/bin:$PATH"
      fi
    else
      color red "Homebrew not found. Install OpenJDK 17 manually, then re-run."; exit 1
    fi
  else
    sudo apt-get update -y
    sudo apt-get install -y openjdk-17-jre-headless
  fi
  command -v java >/dev/null 2>&1 || { color red "Java installation failed."; exit 1; }
  color green "Java installed: $(java -version 2>&1 | head -n1)"
}

# ---------- NGINX + Certbot ----------

install_nginx_and_certbot() {
  color yellow "Installing NGINX and Certbot…"
  if [[ "$(uname -s)" == "Darwin" ]]; then
    color red "NGINX/Certbot automation is intended for Ubuntu/Debian on EC2."; return 0
  fi
  sudo apt-get update -y
  sudo apt-get install -y nginx
  if ! command -v snap >/dev/null 2>&1; then sudo apt-get install -y snapd; fi
  sudo snap install core
  sudo snap refresh core
  if ! snap list | grep -q certbot; then sudo snap install --classic certbot; fi
  sudo ln -sf /snap/bin/certbot /usr/bin/certbot
  sudo systemctl enable nginx
  sudo systemctl start nginx
  color green "NGINX: $(nginx -v 2>&1) ; Certbot: $(certbot --version 2>&1)"
}

create_nginx_vhost_http_only() {
  local domain="$1"; local port="$2"
  local file="/etc/nginx/sites-available/${domain}.conf"
  color yellow "Creating NGINX vhost for $domain → 127.0.0.1:$port (HTTP)…"
  sudo tee "$file" >/dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};

    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;

        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_set_header Connection "";
        proxy_buffering off;
    }
}
EOF
  sudo ln -sf "$file" "/etc/nginx/sites-enabled/${domain}.conf"
  sudo nginx -t
  sudo systemctl reload nginx
  color green "NGINX vhost created and reloaded."
}

confirm_dns_ready() {
  local domain="$1"
  color cyan "Checking DNS for $domain…"
  local resolved_ip; resolved_ip="$(getent ahostsv4 "$domain" | awk '{print $1}' | head -n1 || true)"
  [[ -n "$resolved_ip" ]] || { color red "DNS for $domain does not resolve yet."; return 1; }
  color green "$domain resolves to $resolved_ip"; return 0
}

obtain_cert_and_enable_https() {
  local domain="$1"; local email="$2"
  color yellow "Obtaining TLS certificate for $domain via Certbot…"
  sudo certbot --nginx -d "$domain" --non-interactive --agree-tos --no-eff-email -m "$email" --redirect
  color green "Certificate installed (auto-renew via systemd timer)."
  sudo systemctl list-timers | grep certbot || true
}

# ---------- Build & Run ----------

install_dependencies() {
  color yellow "Installing project dependencies…"
  if [[ -d "$REPO_ROOT/node_modules" ]]; then
    color yellow "Removing existing node_modules and lockfile for a clean install…"
    rm -rf "$REPO_ROOT/node_modules" "$REPO_ROOT/package-lock.json"
  fi
  ( cd "$REPO_ROOT" && npm install )
  color green "Dependencies installed."
}

build_project() {
  color yellow "Building the Next.js project…"
  ( cd "$REPO_ROOT" && npm run build )
  color green "Build completed."
}

start_pm2() {
  local pm2_name="6529seize"
  color yellow "Starting the application with PM2…"
  ( cd "$REPO_ROOT" && pm2 start npm --name="$pm2_name" -- run start )
  pm2 save
  color green "App started under PM2 as '$pm2_name'."
  color blue  "Logs: pm2 logs $pm2_name"
  color blue  "Port: $DEV_PORT (proxy target). Ensure your app listens on this port."
}

enable_pm2_logrotate() {
  color yellow "Enabling pm2-logrotate…"
  # Install module if not installed yet
  pm2 install pm2-logrotate >/dev/null 2>&1 || true
  # Configure sane defaults
  pm2 set pm2-logrotate:max_size 10M >/dev/null
  pm2 set pm2-logrotate:retain 7 >/dev/null
  pm2 set pm2-logrotate:compress true >/dev/null
  pm2 set pm2-logrotate:dateFormat "YYYY-MM-DD_HH-mm-ss" >/dev/null
  pm2 set pm2-logrotate:rotateInterval "0 0 * * *" >/dev/null  # daily at 00:00
  color green "pm2-logrotate configured (10M, keep 7, daily, compress)."
}

enable_pm2_startup() {
  if [[ "$(uname -s)" == "Darwin" ]]; then
    color yellow "Skipping PM2 startup on macOS."
    return 0
  fi
  color yellow "Enabling PM2 startup on boot…"
  local u="${SUDO_USER:-$USER}"
  local home_dir; home_dir="$(getent passwd "$u" | cut -d: -f6)"
  home_dir="${home_dir:-$(eval echo "~$u")}"
  if command -v systemctl >/dev/null 2>&1; then
    sudo env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$u" --hp "$home_dir" >/dev/null
    pm2 save
    color green "PM2 will restart your app on reboot for user '$u'."
  else
    color yellow "systemd not detected; skipping pm2 startup registration."
  fi
}

# ---------- One-shot input phase (all prompts first) ----------

collect_all_inputs() {
  exec 3</dev/tty || true

  # Dev slug & port
  read -u 3 -r -p "Enter developer slug (e.g. punk6529): " DEV_SLUG
  while [[ -z "${DEV_SLUG:-}" ]]; do
    color red "Slug is required."
    read -u 3 -r -p "Enter developer slug (e.g. punk6529): " DEV_SLUG
  done
  read -u 3 -r -p "Proxy to local port [default: 3001]: " DEV_PORT
  DEV_PORT="${DEV_PORT:-3001}"
  DEV_DOMAIN="${DEV_SLUG}staging.6529.io"
  DEV_DOMAIN_URL="https://${DEV_DOMAIN}"
  color yellow "Will use domain: ${DEV_DOMAIN_URL}  (proxy → 127.0.0.1:${DEV_PORT})"

  # API endpoints
  prompt_choice API_ENDPOINT \
    "SEIZE API ENDPOINT" "https://api.staging.6529.io" \
    "Staging (https://api.staging.6529.io)" "https://api.staging.6529.io" \
    "Production (https://api.6529.io)"      "https://api.6529.io"

  prompt_choice ALLOWLIST_API_ENDPOINT \
    "ALLOWLIST API ENDPOINT" "https://allowlist-api.staging.6529.io" \
    "Staging (https://allowlist-api.staging.6529.io)" "https://allowlist-api.staging.6529.io" \
    "Production (https://allowlist-api.6529.io)"      "https://allowlist-api.6529.io"

  # Required / optional keys
  prompt_input_required ALCHEMY_API_KEY "Enter ALCHEMY_API_KEY"
  exec 3</dev/tty || true
  read -u 3 -r -p "Enter TENOR_API_KEY (optional, can be empty): " TENOR_API_KEY || true
  exec 3<&- || true

  prompt_choice NEXTGEN_CHAIN_ID \
    "NEXTGEN CHAIN ID" "1" \
    "Mainnet (1)" "1" \
    "Sepolia (11155111)" "11155111"

  prompt_choice MOBILE_APP_SCHEME \
    "MOBILE APP SCHEME" "mobileStaging6529" \
    "Staging (mobileStaging6529)" "mobileStaging6529" \
    "Production (mobile6529)"     "mobile6529"

  # NGINX configuration choice + email (ask now so we don't prompt later)
  exec 3</dev/tty || true
  local nginx_answer=""
  read -u 3 -r -p "Configure NGINX + HTTPS for ${DEV_DOMAIN_URL}? [Y/n]: " nginx_answer || true
  nginx_answer="${nginx_answer,,}"; nginx_answer="${nginx_answer:-y}"
  if [[ "$nginx_answer" == "y" || "$nginx_answer" == "yes" ]]; then
    CONFIGURE_NGINX="yes"
    read -u 3 -r -p "Admin email for Let's Encrypt (for expiry notices): " CERTBOT_EMAIL
    while [[ -z "${CERTBOT_EMAIL:-}" ]]; do
      color red "Email is required for Let's Encrypt."
      read -u 3 -r -p "Admin email for Let's Encrypt (for expiry notices): " CERTBOT_EMAIL
    done
  else
    CONFIGURE_NGINX="no"
    CERTBOT_EMAIL=""
  fi
  exec 3<&- || true
}

# ---------- .env creation ----------

create_env_file() {
  local env_file="$REPO_ROOT/.env"
  local BASE_ENDPOINT="$DEV_DOMAIN_URL"
  local CORE_SCHEME="core6529"
  local IPFS_API_ENDPOINT="https://api-ipfs.6529.io"
  local IPFS_GATEWAY_ENDPOINT="https://ipfs.6529.io"

  color yellow "Creating/replacing $env_file …"
  cat > "$env_file" <<EOF
# Autogenerated .env $(date -u +'%Y-%m-%dT%H:%M:%SZ')

# SEIZE API ENDPOINT
API_ENDPOINT=$API_ENDPOINT

# ALLOWLIST API ENDPOINT
ALLOWLIST_API_ENDPOINT=$ALLOWLIST_API_ENDPOINT

# BASE ENDPOINT (must match nginx/certbot domain)
BASE_ENDPOINT=$BASE_ENDPOINT

# API KEYS
ALCHEMY_API_KEY=$ALCHEMY_API_KEY

# TENOR API KEY (optional)
TENOR_API_KEY=$TENOR_API_KEY

# NEXTGEN CHAIN ID: 1 (mainnet) or 11155111 (sepolia)
NEXTGEN_CHAIN_ID=$NEXTGEN_CHAIN_ID

# MOBILE APP SCHEME
MOBILE_APP_SCHEME=$MOBILE_APP_SCHEME

# 6529 CORE SCHEME
CORE_SCHEME=$CORE_SCHEME

# IPFS ENDPOINTS
IPFS_API_ENDPOINT=$IPFS_API_ENDPOINT
IPFS_GATEWAY_ENDPOINT=$IPFS_GATEWAY_ENDPOINT
EOF
  color green "Wrote $env_file"
}

# ---------- Main ----------

main() {
  # 0) Gather ALL user input up front (single interaction)
  collect_all_inputs
  create_env_file

  # 1) Prerequisites
  require_sudo_if_linux
  ensure_node_ge20_and_npm_ge10
  install_pm2
  ensure_java_for_openapi

  # 2) Build & run app
  install_dependencies
  build_project
  start_pm2

  # 3) pm2 logrotate + startup on boot
  enable_pm2_logrotate
  enable_pm2_startup

  # 4) Optional NGINX + HTTPS setup (from earlier choice)
  if [[ "${CONFIGURE_NGINX}" == "yes" ]]; then
    install_nginx_and_certbot
    create_nginx_vhost_http_only "$DEV_DOMAIN" "$DEV_PORT"

    color yellow "Ensure DNS A record exists: ${DEV_DOMAIN} -> <this EC2 public IP>."
    color yellow "Testing DNS now…"
    if confirm_dns_ready "$DEV_DOMAIN"; then
      obtain_cert_and_enable_https "$DEV_DOMAIN" "$CERTBOT_EMAIL"
      color green "NGINX + HTTPS configured for https://${DEV_DOMAIN}"
      # sync BASE_ENDPOINT just in case
      sed -i "s|^BASE_ENDPOINT=.*$|BASE_ENDPOINT=https://${DEV_DOMAIN}|" "$REPO_ROOT/.env" || true
    else
      color yellow "DNS not ready. Re-run later:"
      color blue   "  sudo certbot --nginx -d $DEV_DOMAIN -m $CERTBOT_EMAIL --agree-tos --no-eff-email --redirect"
    fi
  else
    color yellow "Skipping NGINX/HTTPS setup as requested."
  fi

  color green "Done. App should be reachable via NGINX at ${DEV_DOMAIN_URL} (if configured), or directly on port ${DEV_PORT}."
  color blue  "PM2 logs → pm2 logs 6529seize"
}

main "$@"