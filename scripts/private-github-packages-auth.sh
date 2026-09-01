#!/usr/bin/env bash

# Shared authentication UX for the one approved private GitHub Package.
# The low-level package policy remains the source of truth for token validation.

if [[ "${PRIVATE_GITHUB_PACKAGES_AUTH_SH_LOADED:-}" == "1" ]] &&
  declare -F ensure_private_package_auth >/dev/null 2>&1; then
  return 0
fi
readonly PRIVATE_GITHUB_PACKAGES_AUTH_SH_LOADED="1"
readonly PRIVATE_GITHUB_PACKAGES_KEYCHAIN_SERVICE="6529seize-frontend-github-packages"

private_package_auth_is_present() {
  [[ -n "${NODE_AUTH_TOKEN:-}" ]]
}

private_package_auth_is_ci() {
  [[ -n "${CI:-}" ]]
}

private_package_auth_is_interactive() {
  [[ -t 0 && -t 2 ]]
}

private_package_auth_restore_xtrace() {
  if [[ "${1:-0}" -eq 1 ]]; then
    set -x
  fi
}

ensure_private_package_auth() {
  if private_package_auth_is_present; then
    return 0
  fi

  if private_package_auth_is_ci || ! private_package_auth_is_interactive; then
    echo "NODE_AUTH_TOKEN is required for package commands in CI and other non-interactive shells." >&2
    return 1
  fi

  local restore_xtrace=0
  case "$-" in
    *x*)
      set +x
      restore_xtrace=1
      ;;
  esac

  printf "GitHub Packages read token (input hidden): " >&2
  local read_status=0
  IFS= read -r -s NODE_AUTH_TOKEN || read_status=$?
  if [[ "$read_status" -ne 0 && -z "${NODE_AUTH_TOKEN:-}" ]]; then
    printf "\n" >&2
    echo "Unable to read NODE_AUTH_TOKEN." >&2
    unset NODE_AUTH_TOKEN
    private_package_auth_restore_xtrace "$restore_xtrace"
    return 1
  fi
  printf "\n" >&2

  if [[ -z "$NODE_AUTH_TOKEN" ]]; then
    echo "NODE_AUTH_TOKEN cannot be empty." >&2
    private_package_auth_restore_xtrace "$restore_xtrace"
    return 1
  fi

  export NODE_AUTH_TOKEN
  private_package_auth_restore_xtrace "$restore_xtrace"
}

private_package_auth_is_macos() {
  [[ "$(uname -s)" == "Darwin" ]]
}

private_package_auth_keychain_is_available() {
  private_package_auth_is_macos && [[ -x /usr/bin/security ]]
}

private_package_auth_read_keychain() {
  /usr/bin/security find-generic-password \
    -a "$(id -un)" \
    -s "$PRIVATE_GITHUB_PACKAGES_KEYCHAIN_SERVICE" \
    -w
}

load_private_package_auth_for_codex() {
  if private_package_auth_is_present; then
    return 0
  fi

  local restore_xtrace=0
  case "$-" in
    *x*)
      set +x
      restore_xtrace=1
      ;;
  esac

  if ! private_package_auth_keychain_is_available; then
    echo "NODE_AUTH_TOKEN is required because secure Codex Keychain lookup is available only on macOS." >&2
    private_package_auth_restore_xtrace "$restore_xtrace"
    return 1
  fi

  local package_auth_token
  if ! package_auth_token="$(private_package_auth_read_keychain 2>/dev/null)"; then
    echo "No GitHub Packages token was found in the macOS Keychain." >&2
    echo "Follow ops/docs/developer/pnpm-and-socket-firewall.md to add it once, then create the Codex worktree again." >&2
    private_package_auth_restore_xtrace "$restore_xtrace"
    return 1
  fi

  if [[ -z "$package_auth_token" ]]; then
    echo "The GitHub Packages token stored in the macOS Keychain is empty." >&2
    unset package_auth_token
    private_package_auth_restore_xtrace "$restore_xtrace"
    return 1
  fi

  NODE_AUTH_TOKEN="$package_auth_token"
  export NODE_AUTH_TOKEN
  unset package_auth_token
  private_package_auth_restore_xtrace "$restore_xtrace"
}
