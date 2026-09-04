#!/usr/bin/env bash

# Shared authentication UX for the one approved private GitHub Package.
# The low-level package policy remains the source of truth for token validation.

if [[ "${PRIVATE_GITHUB_PACKAGES_AUTH_SH_LOADED:-}" == "1" ]] &&
  declare -F ensure_private_package_auth >/dev/null 2>&1; then
  return 0
fi
readonly PRIVATE_GITHUB_PACKAGES_AUTH_SH_LOADED="1"
readonly PRIVATE_GITHUB_PACKAGES_KEYCHAIN_SERVICE="6529seize-frontend-github-packages"
PRIVATE_GITHUB_PACKAGES_AUTH_SCRIPT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")" && pwd
)"
readonly PRIVATE_GITHUB_PACKAGES_AUTH_SCRIPT_DIR
readonly PRIVATE_GITHUB_PACKAGES_WINDOWS_HELPER="${PRIVATE_GITHUB_PACKAGES_AUTH_SCRIPT_DIR}/private-github-packages-credential.ps1"

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

private_package_auth_is_macos() {
  [[ "$(uname -s)" == "Darwin" ]]
}

private_package_auth_is_windows() {
  case "$(uname -s)" in
    MINGW* | MSYS* | CYGWIN*) return 0 ;;
    *) return 1 ;;
  esac
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

private_package_auth_windows_powershell() {
  command -v powershell.exe || command -v pwsh.exe
}

private_package_auth_windows_helper_path() {
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -w "$PRIVATE_GITHUB_PACKAGES_WINDOWS_HELPER"
  else
    printf '%s\n' "$PRIVATE_GITHUB_PACKAGES_WINDOWS_HELPER"
  fi
}

private_package_auth_windows_credential_is_available() {
  private_package_auth_is_windows &&
    [[ -f "$PRIVATE_GITHUB_PACKAGES_WINDOWS_HELPER" ]] &&
    private_package_auth_windows_powershell >/dev/null 2>&1
}

private_package_auth_read_windows_credential() {
  local powershell_binary
  powershell_binary="$(private_package_auth_windows_powershell)" || return 1

  local helper_path
  helper_path="$(private_package_auth_windows_helper_path)" || return 1

  "$powershell_binary" \
    -NoLogo \
    -NoProfile \
    -NonInteractive \
    -ExecutionPolicy Bypass \
    -File "$helper_path" \
    read
}

private_package_auth_stored_credential_is_available() {
  private_package_auth_keychain_is_available ||
    private_package_auth_windows_credential_is_available
}

private_package_auth_stored_credential_label() {
  if private_package_auth_is_macos; then
    printf '%s\n' "the macOS Keychain"
  elif private_package_auth_is_windows; then
    printf '%s\n' "Windows Credential Manager"
  else
    printf '%s\n' "the operating system credential store"
  fi
}

private_package_auth_read_stored_credential() {
  if private_package_auth_keychain_is_available; then
    private_package_auth_read_keychain
  elif private_package_auth_windows_credential_is_available; then
    private_package_auth_read_windows_credential
  else
    return 1
  fi
}

private_package_auth_try_load_stored_credential() {
  private_package_auth_stored_credential_is_available || return 1

  local package_auth_token
  if ! package_auth_token="$(private_package_auth_read_stored_credential 2>/dev/null)"; then
    unset package_auth_token
    return 1
  fi
  if [[ -z "$package_auth_token" ]]; then
    unset package_auth_token
    return 1
  fi

  NODE_AUTH_TOKEN="$package_auth_token"
  export NODE_AUTH_TOKEN
  unset package_auth_token
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

  if private_package_auth_try_load_stored_credential; then
    private_package_auth_restore_xtrace "$restore_xtrace"
    return 0
  fi

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

  if ! private_package_auth_stored_credential_is_available; then
    echo "NODE_AUTH_TOKEN is required because no supported operating system credential store is available." >&2
    private_package_auth_restore_xtrace "$restore_xtrace"
    return 1
  fi

  local credential_label
  credential_label="$(private_package_auth_stored_credential_label)"
  local package_auth_token
  if ! package_auth_token="$(private_package_auth_read_stored_credential 2>/dev/null)"; then
    echo "No GitHub Packages token was found in ${credential_label}." >&2
    echo "Follow ops/docs/developer/pnpm-and-socket-firewall.md to add it once, then create the Codex worktree again." >&2
    private_package_auth_restore_xtrace "$restore_xtrace"
    return 1
  fi

  if [[ -z "$package_auth_token" ]]; then
    echo "The GitHub Packages token stored in ${credential_label} is empty." >&2
    unset package_auth_token
    private_package_auth_restore_xtrace "$restore_xtrace"
    return 1
  fi

  NODE_AUTH_TOKEN="$package_auth_token"
  export NODE_AUTH_TOKEN
  unset package_auth_token
  private_package_auth_restore_xtrace "$restore_xtrace"
}
