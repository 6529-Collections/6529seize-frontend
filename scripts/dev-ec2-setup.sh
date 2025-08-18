#!/usr/bin/env bash

# ----------------------------------------------------------------------------
# Script: dev-ec2-setup.sh
#
# Description:
#   Bootstraps a host to build & run 6529seize-frontend for staging/dev.
#   - Accepts Node >= 20; installs Node 20 only if Node missing or < 20.
#   - Ensures npm >= 10 (upgrades if < 10; leaves 10+ unchanged).
#   - Installs PM2, *creates/replaces* .env by prompting (no .env.sample used),
#     builds, and starts via PM2.
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

# ------- ENV CREATION (NO .env.sample) -------

prompt_choice() {
  # args: var_name question default_value option1_label option1_value option2_label option2_value ...
  local __varname="$1"; shift
  local question="$1"; shift
  local default="$1"; shift

  # open tty for reliable prompts even inside while loops
  exec 3</dev/tty || true

  color cyan "$question"
  local idx=1
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
  read -u 3 -r -p "Choose [1-${#labels[@]}] (default shown above): " choice || true

  if [[ -z "$choice" ]]; then
    printf -v "$__varname" '%s' "$default"
  else
    if ! [[ "$choice" =~ ^[0-9]+$ ]] || (( choice < 1 || choice > ${#labels[@]} )); then
      color yellow "Invalid choice. Using default."
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

create_env_file() {
  local env_file="$REPO_ROOT/.env"
  color yellow "Creating/replacing $env_file …"

  # Choices
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

  local BASE_ENDPOINT
  prompt_choice BASE_ENDPOINT \
    "BASE ENDPOINT" "https://staging.6529.io" \
    "Staging (https://staging.6529.io)" "https://staging.6529.io" \
    "Production (https://6529.io)" "https://6529.io"

  local ALCHEMY_API_KEY
  prompt_input_required ALCHEMY_API_KEY "Enter ALCHEMY_API_KEY"

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

# BASE ENDPOINT
BASE_ENDPOINT=$BASE_ENDPOINT

# API KEYS
ALCHEMY_API_KEY=$ALCHEMY_API_KEY

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

install_dependencies() {
  color yellow "Installing project dependencies…"
  # Clean if previously installed under a different Node version
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
  color blue  "Port: see package.json (currently 3001)."
}

main() {
  require_sudo_if_linux
  ensure_node_ge20_and_npm_ge10
  install_pm2

  # IMPORTANT: .env BEFORE any npm step
  create_env_file

  install_dependencies
  build_project
  start_pm2
}

main "$@"