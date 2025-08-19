#!/usr/bin/env bash

# ----------------------------------------------------------------------------
# Script: dev-ec2-setup.sh
#
# Description:
#   Bootstraps a host to build & run 6529seize-frontend for staging/dev.
#   - Accepts Node >= 20; installs Node 20 only if Node missing or < 20.
#   - Ensures npm >= 10 (upgrades if < 10; leaves 10+ unchanged).
#   - Installs PM2, *creates/replaces* .env by prompting
#     builds, and starts via PM2.
#   - (Optional) Sets up NGINX + Let's Encrypt for https://<slug>staging.6529.io
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

ensure_node_ge20_and_npm_ge10() {
  # Accept Node >= 20; install Node 20 only if missing or < 20.
  local os="$(uname -s)"
  local need_major=20
  local have_major=0

  if command -v node >/dev/null 2>&1; then
    local have_ver
    have_ver="$(node -v | sed 's/^v//')"
    have_major="${have_ver%%.*}"
    if [[ "$have_major" -ge "$need_major" ]]; then
      color green "Node v$have_ver detected (>= 20). OK."
    else
      color yellow "Node v$have_ver detected (< 20). Installing Node 20…"
      have_major=0
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
        color red "Homebrew not found. Install Node 20 via Homebrew or nvm, then re-run."
        exit 1
      fi
    else
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
      sudo apt-get update -y
      sudo apt-get install -y nodejs build-essential
    fi
  fi

  local final_node
  final_node="$(node -v | sed 's/^v//')"
  local final_major="${final_node%%.*}"
  if [[ "$final_major" -lt 20 ]]; then
    color red "Node $(node -v) < 20 after installation. Please install Node >= 20 and re-run."
    exit 1
  fi

  local npm_major
  npm_major="$(npm -v | cut -d. -f1 || echo 0)"
  if [[ "$npm_major" -lt 10 ]]; then
    color yellow "Upgrading npm to >=10…"
    if [[ "$(uname -s)" == "Darwin" ]]; then npm i -g npm@^10; else sudo npm i -g npm@^10; fi
  fi
  color green "Using Node $(node -v), npm $(npm -v)"
}

install_pm2() {
  if ! command -v pm2 >/dev/null 2>&1; then
    color yellow "Installing PM2 globally…"
    if [[ "$(uname -s)" == "Darwin" ]]; then
      npm i -g pm2
    else
      sudo npm i -g pm2
    fi
  fi
  color green "PM2: $(pm2 -v)"
}

# ---------- Helpers ----------

sedi() {
  if [[ "$(uname -s)" == "Darwin" ]]; then sed -i '' "$@"; else sed -i "$@"; fi
}

prompt_dev_slug_and_port() {
  exec 3</dev/tty || true

  read -u 3 -r -p "Enter developer slug (e.g., prxt): " DEV_SLUG
  while [[ -z "${DEV_SLUG:-}" ]]; do
    color red "Slug is required."
    read -u 3 -r -p "Enter developer slug (e.g., prxt): " DEV_SLUG
  done

  read -u 3 -r -p "Proxy to local port [default: 3001]: " DEV_PORT
  DEV_PORT="${DEV_PORT:-3001}"

  DEV_DOMAIN="${DEV_SLUG}staging.6529.io"
  DEV_DOMAIN_URL="https://${DEV_DOMAIN}"
  color yellow "Will use domain: ${DEV_DOMAIN_URL}  (proxy → 127.0.0.1:${DEV_PORT})"

  exec 3<&- || true
}

prompt_choice() {
  # args: var_name question default_value option1_label option1_value option2_label option2_value ...
  local __varname="$1"; shift
  local question="$1"; shift
  local default="$1"; shift

  exec 3</dev/tty || true

  color cyan "$question"
  declare -a labels
  declare -a values
  while (( "$#" )); do
    local label="$1"; local val="$2"
    labels+=("$label"); values+=("$val")
    shift 2
  done

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
      local idx=$((choice-1))
      printf -v "$__varname" '%s' "${values[$idx]}"
    fi
  fi

  exec 3<&- || true
}

prompt_input_required() {
  # args: var_name prompt [default]
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

# ---------- ENV CREATION (NO .env.sample; BASE_ENDPOINT is FIXED to slug domain) ----------

create_env_file() {
  local env_file="$REPO_ROOT/.env"
  color yellow "Creating/replacing $env_file …"

  # API endpoints (user-chosen)
  local API_ENDPOINT
  prompt_choice API_ENDPOINT \
    "SEIZE API ENDPOINT" "https://api.staging.6529.io" \
    "Staging (https://api.staging.6529.io)" "https://api.staging.6529.io" \
    "Production (https://api.6529.io)" "https://api.6529.io"

  local ALLOWLIST_API_ENDPOINT
  prompt_choice ALLOWLIST_API_ENDPOINT \
    "ALLOWLIST API ENDPOINT" "https://allowlist-api.staging.6529.io" \
    "Staging (https://allowlist-api.staging.6529.io)" "https://allowlist-api.staging.6529.io" \
    "Production (https://allowlist-api.6529.io)" "https://allowlist-api.6529.io"

  # BASE_ENDPOINT is NOT configurable; it must match the nginx domain
  local BASE_ENDPOINT="$DEV_DOMAIN_URL"

  # Required & optional keys
  local ALCHEMY_API_KEY
  prompt_input_required ALCHEMY_API_KEY "Enter ALCHEMY_API_KEY"

  local TENOR_API_KEY=""
  exec 3</dev/tty || true
  read -u 3 -r -p "Enter TENOR_API_KEY (optional, can be empty): " TENOR_API_KEY || true
  exec 3<&- || true

  local NEXTGEN_CHAIN_ID
  prompt_choice NEXTGEN_CHAIN_ID \
    "NEXTGEN CHAIN ID" "1" \
    "Mainnet (1)" "1" \
    "Sepolia (11155111)" "11155111"

  local MOBILE_APP_SCHEME
  prompt_choice MOBILE_APP_SCHEME \
    "MOBILE APP SCHEME" "mobileStaging6529" \
    "Staging (mobileStaging6529)" "mobileStaging6529" \
    "Production (mobile6529)" "mobile6529"

  # Fixed values
  local CORE_SCHEME="core6529"
  local IPFS_API_ENDPOINT="https://api-ipfs.6529.io"
  local IPFS_GATEWAY_ENDPOINT="https://ipfs.6529.io"

  # Write .env (replace unconditionally)
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

# ---------- Build & Run ----------

ensure_java_for_openapi() {
  # Install Java runtime if missing (needed by @openapitools/openapi-generator-cli)
  if command -v java >/dev/null 2>&1; then
    color green "Java detected: $(java -version 2>&1 | head -n1)"
    return 0
  fi

  color yellow "Java not found. Installing OpenJDK 17 (headless)…"
  if [[ "$(uname -s)" == "Darwin" ]]; then
    if command -v brew >/dev/null 2>&1; then
      brew install openjdk@17
      # make java available on PATH for current shell
      if [[ -d "/opt/homebrew/opt/openjdk@17/bin" ]]; then
        export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
      elif [[ -d "/usr/local/opt/openjdk@17/bin" ]]; then
        export PATH="/usr/local/opt/openjdk@17/bin:$PATH"
      fi
    else
      color red "Homebrew not found. Please install Java (OpenJDK 17) manually, then re-run."
      exit 1
    fi
  else
    # Ubuntu/Debian
    sudo apt-get update -y
    sudo apt-get install -y openjdk-17-jre-headless
  fi

  if ! command -v java >/dev/null 2>&1; then
    color red "Java installation failed. Install OpenJDK 17 and re-run."
    exit 1
  fi
  color green "Java installed: $(java -version 2>&1 | head -n1)"
}

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

# ---------- NGINX + Certbot ----------

install_nginx_and_certbot() {
  color yellow "Installing NGINX and Certbot…"
  if [[ "$(uname -s)" == "Darwin" ]]; then
    color red "NGINX/Certbot automation is intended for Ubuntu/Debian on EC2."
    color red "You can still run the app locally without NGINX."
    return 0
  fi

  sudo apt-get update -y
  sudo apt-get install -y nginx

  if ! command -v snap >/dev/null 2>&1; then
    sudo apt-get install -y snapd
  fi
  sudo snap install core
  sudo snap refresh core
  if ! snap list | grep -q certbot; then
    sudo snap install --classic certbot
  fi
  sudo ln -sf /snap/bin/certbot /usr/bin/certbot

  sudo systemctl enable nginx
  sudo systemctl start nginx
  color green "NGINX: $(nginx -v 2>&1) ; Certbot: $(certbot --version 2>&1)"
}

create_nginx_vhost_http_only() {
  local domain="$1"   # e.g., prxtstaging.6529.io
  local port="$2"     # e.g., 3001
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

obtain_cert_and_enable_https() {
  local domain="$1"
  local email="$2"

  color yellow "Obtaining TLS certificate for $domain via Certbot…"
  sudo certbot --nginx -d "$domain" --non-interactive --agree-tos --no-eff-email -m "$email" --redirect
  color green "Certificate installed (auto-renew via systemd timer)."
  sudo systemctl list-timers | grep certbot || true
}

confirm_dns_ready() {
  local domain="$1"
  color cyan "Checking DNS for $domain…"
  local resolved_ip
  resolved_ip="$(getent ahostsv4 "$domain" | awk '{print $1}' | head -n1 || true)"
  if [[ -z "$resolved_ip" ]]; then
    color red "DNS for $domain does not resolve yet."
    return 1
  fi
  color green "$domain resolves to $resolved_ip"
  return 0
}

setup_nginx_and_certbot_flow() {
  local domain="$DEV_DOMAIN"
  local port="$DEV_PORT"

  # Email for Let's Encrypt
  exec 3</dev/tty || true
  local email
  read -u 3 -r -p "Admin email for Let's Encrypt (for expiry notices): " email
  while [[ -z "$email" ]]; do
    color red "Email is required for Let's Encrypt."
    read -u 3 -r -p "Admin email for Let's Encrypt (for expiry notices): " email
  done
  exec 3<&- || true

  install_nginx_and_certbot
  create_nginx_vhost_http_only "$domain" "$port"

  color yellow "Ensure DNS A record exists: ${domain} -> <this EC2 public IP>. Security Group must allow 80/443."
  color yellow "Testing DNS now…"
  if ! confirm_dns_ready "$domain"; then
    color yellow "DNS not ready. Re-run cert step later with:"
    color blue   "  sudo certbot --nginx -d $domain -m $email --agree-tos --no-eff-email --redirect"
    return 0
  fi

  obtain_cert_and_enable_https "$domain" "$email"
  color green "NGINX + HTTPS configured for https://${domain}"

  # Ensure .env BASE_ENDPOINT matches domain (it already does, but keep in sync if edited)
  if [[ -f "$REPO_ROOT/.env" ]]; then
    sedi "s|^BASE_ENDPOINT=.*$|BASE_ENDPOINT=https://${domain}|" "$REPO_ROOT/.env"
    color green "Synced BASE_ENDPOINT in .env → https://${domain}"
  fi
}



# ---------- Main ----------

main() {
  # 0) Get dev slug/port first so BASE_ENDPOINT can be fixed to the dev domain
  prompt_dev_slug_and_port
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

  # 3) Optional NGINX + HTTPS setup (uses same slug/port)
  exec 3</dev/tty || true
  local yn
  read -u 3 -r -p "Configure NGINX + HTTPS for ${DEV_DOMAIN_URL} now? [Y/n]: " yn || true
  exec 3<&- || true
  yn="${yn,,}"; yn="${yn:-y}"
  if [[ "$yn" == "y" || "$yn" == "yes" ]]; then
    setup_nginx_and_certbot_flow
  else
    color yellow "Skipping NGINX/HTTPS setup. You can run it later by re-running the script."
  fi

  # PM2 boot persistence
  if [[ "$(uname -s)" != "Darwin" ]]; then
    color yellow "Enabling PM2 startup on boot…"
    local u="${SUDO_USER:-$USER}"
    pm2 startup systemd -u "$u" --hp "$(eval echo "~$u")" >/dev/null
    pm2 save
    color green "PM2 will restart your app on reboot."
  fi
}

main "$@"