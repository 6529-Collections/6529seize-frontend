#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
META_FILE="$REPO_ROOT/docs/meta.json"
REPO_NAME="$(basename "$REPO_ROOT")"
PARENT_DIR="$(dirname "$REPO_ROOT")"
ACTIVE_WORKTREE_PATH=""

error() {
  printf '%s\n' "$1" >&2
}

cleanup() {
  if [ -n "$ACTIVE_WORKTREE_PATH" ] && [ -d "$ACTIVE_WORKTREE_PATH" ]; then
    git -C "$REPO_ROOT" worktree remove -f "$ACTIVE_WORKTREE_PATH" >/dev/null 2>&1 || true
  fi
}

update_last_commit() {
  local commit="$1"
  local tmp_meta_file="${META_FILE}.tmp"
  jq --indent 4 --arg commit "$commit" '.last_commit = $commit' "$META_FILE" > "$tmp_meta_file"
  mv "$tmp_meta_file" "$META_FILE"
}

trap cleanup EXIT INT TERM

if ! command -v jq >/dev/null 2>&1; then
  error "jq is required."
  exit 1
fi

if [ ! -r "$META_FILE" ]; then
  error "Missing or unreadable ${META_FILE}."
  exit 1
fi

if ! last_commit="$(jq -r '.last_commit // empty' "$META_FILE" 2>/dev/null)"; then
  error "Invalid JSON in ${META_FILE}."
  exit 1
fi

if [ -z "$last_commit" ]; then
  error "Missing or empty last_commit in ${META_FILE}."
  exit 1
fi

if ! git -C "$REPO_ROOT" cat-file -e "${last_commit}^{commit}" 2>/dev/null; then
  error "last_commit '${last_commit}' not found in repository."
  exit 2
fi

processed_count=0

while true; do
  if ! last_commit="$(jq -r '.last_commit // empty' "$META_FILE" 2>/dev/null)"; then
    error "Invalid JSON in ${META_FILE}."
    exit 1
  fi

  if [ -z "$last_commit" ]; then
    error "Missing or empty last_commit in ${META_FILE}."
    exit 1
  fi

  if ! git -C "$REPO_ROOT" cat-file -e "${last_commit}^{commit}" 2>/dev/null; then
    error "last_commit '${last_commit}' not found in repository."
    exit 2
  fi

  if ! next_commit="$(git -C "$REPO_ROOT" rev-list --first-parent --reverse "${last_commit}..HEAD" 2>/dev/null | sed -n '1p')"; then
    error "Failed to query git history."
    exit 4
  fi

  if [ -z "$next_commit" ]; then
    printf "No newer commit exists after '%s'. Queue exhausted.\n" "$last_commit"
    printf 'Processed %d commit(s) from docs queue.\n' "$processed_count"
    exit 0
  fi

  short_commit="$(git -C "$REPO_ROOT" rev-parse --short "$next_commit")"
  iteration=$((processed_count + 1))

  printf '=== Processing queued commit %d: %s (%s) ===\n' "$iteration" "$short_commit" "$next_commit"

  if ! git -C "$REPO_ROOT" diff-tree --no-commit-id --name-only -r --root "$next_commit" -- '*.ts' '*.tsx' | grep -q '.'; then
    printf 'Skipping queued commit %s: no .ts/.tsx changes.\n' "$next_commit"
    update_last_commit "$next_commit"
    processed_count=$((processed_count + 1))
    printf 'Skipped queued commit %s. Total processed: %d.\n' "$next_commit" "$processed_count"
    continue
  fi

  worktree_path="$PARENT_DIR/${REPO_NAME}-next-${short_commit}"

  if [ -e "$worktree_path" ]; then
    error "Target worktree path already exists: $worktree_path"
    exit 5
  fi

  git -C "$REPO_ROOT" worktree add --detach "$worktree_path" "$next_commit"
  ACTIVE_WORKTREE_PATH="$worktree_path"

  if [ -e "$REPO_ROOT/.codex" ] || [ -L "$REPO_ROOT/.codex" ]; then
    rm -rf "$worktree_path/.codex"
    cp -RP "$REPO_ROOT/.codex" "$worktree_path/.codex"
  fi

  rm -rf "$worktree_path/docs"
  ln -s "$REPO_ROOT/docs" "$worktree_path/docs"

  printf 'Running docs updater in worktree scope...\n'
  (cd "$worktree_path" && ./docs/update_docs.sh)

  update_last_commit "$next_commit"

  git -C "$REPO_ROOT" worktree remove -f "$worktree_path"
  ACTIVE_WORKTREE_PATH=""

  git -C "$REPO_ROOT" add docs


  processed_count=$((processed_count + 1))
  printf 'Completed queued commit %s. Total processed: %d.\n' "$next_commit" "$processed_count"
done
