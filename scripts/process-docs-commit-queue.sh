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

update_commit_queue() {
  local base_commit="$1"
  local head_commit="$2"
  local pending_json="$3"
  local tmp_meta_file="${META_FILE}.tmp"
  jq --indent 4 \
    --arg base_commit "$base_commit" \
    --arg head_commit "$head_commit" \
    --argjson pending "$pending_json" \
    '.docs_commit_queue = {base_commit: $base_commit, head_commit: $head_commit, pending: $pending}' \
    "$META_FILE" > "$tmp_meta_file"
  mv "$tmp_meta_file" "$META_FILE"
}

pop_next_queue_commit() {
  local tmp_meta_file="${META_FILE}.tmp"
  jq --indent 4 \
    '.docs_commit_queue.pending |= (if type == "array" and length > 0 then .[1:] else [] end)' \
    "$META_FILE" > "$tmp_meta_file"
  mv "$tmp_meta_file" "$META_FILE"
}

clear_commit_queue() {
  local tmp_meta_file="${META_FILE}.tmp"
  jq --indent 4 'del(.docs_commit_queue)' "$META_FILE" > "$tmp_meta_file"
  mv "$tmp_meta_file" "$META_FILE"
}

read_last_commit() {
  local last_commit_value=""
  if ! last_commit_value="$(jq -r '.last_commit // empty' "$META_FILE" 2>/dev/null)"; then
    error "Invalid JSON in ${META_FILE}."
    exit 1
  fi

  if [ -z "$last_commit_value" ]; then
    error "Missing or empty last_commit in ${META_FILE}."
    exit 1
  fi

  printf '%s\n' "$last_commit_value"
}

ensure_commit_exists() {
  local commit="$1"
  local label="$2"
  if ! git -C "$REPO_ROOT" cat-file -e "${commit}^{commit}" 2>/dev/null; then
    error "${label} '${commit}' not found in repository."
    exit 2
  fi
}

read_pending_count() {
  local pending_count=""
  if ! pending_count="$(jq -r '.docs_commit_queue.pending | if type == "array" then length else 0 end' "$META_FILE" 2>/dev/null)"; then
    error "Invalid JSON in ${META_FILE}."
    exit 1
  fi
  printf '%s\n' "$pending_count"
}

advance_commit_queue() {
  local queue_head_commit="$1"
  local remaining_count=""

  pop_next_queue_commit
  remaining_count="$(read_pending_count)"

  if [ "$remaining_count" -eq 0 ]; then
    update_last_commit "$queue_head_commit"
    clear_commit_queue
  fi
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

last_commit="$(read_last_commit)"
ensure_commit_exists "$last_commit" "last_commit"

processed_count=0

while true; do
  last_commit="$(read_last_commit)"
  ensure_commit_exists "$last_commit" "last_commit"

  pending_count="$(read_pending_count)"
  if ! queue_base_commit="$(jq -r '.docs_commit_queue.base_commit // empty' "$META_FILE" 2>/dev/null)"; then
    error "Invalid JSON in ${META_FILE}."
    exit 1
  fi

  if [ "$pending_count" -gt 0 ] && [ -n "$queue_base_commit" ] && [ "$queue_base_commit" != "$last_commit" ]; then
    printf "Resetting stale docs queue: base_commit '%s' does not match last_commit '%s'.\n" "$queue_base_commit" "$last_commit"
    clear_commit_queue
    pending_count=0
  fi

  if [ "$pending_count" -eq 0 ]; then
    queue_head_commit="$(git -C "$REPO_ROOT" rev-parse HEAD)"

    if ! mapfile -t pending_commits < <(git -C "$REPO_ROOT" rev-list --topo-order --reverse "${last_commit}..${queue_head_commit}" 2>/dev/null); then
      error "Failed to query git history."
      exit 4
    fi

    if [ "${#pending_commits[@]}" -eq 0 ]; then
      printf "No newer commit exists after '%s'. Queue exhausted.\n" "$last_commit"
      printf 'Processed %d commit(s) from docs queue.\n' "$processed_count"
      exit 0
    fi

    pending_json="$(printf '%s\n' "${pending_commits[@]}" | jq -R . | jq -s .)"
    update_commit_queue "$last_commit" "$queue_head_commit" "$pending_json"
    pending_count="${#pending_commits[@]}"
    printf "Queued %d commit(s) from '%s' to '%s'.\n" "$pending_count" "$last_commit" "$queue_head_commit"
  fi

  if ! next_commit="$(jq -r '.docs_commit_queue.pending[0] // empty' "$META_FILE" 2>/dev/null)"; then
    error "Invalid JSON in ${META_FILE}."
    exit 1
  fi

  if [ -z "$next_commit" ]; then
    error "Queue state is invalid: missing next queued commit."
    exit 1
  fi

  if ! queue_head_commit="$(jq -r '.docs_commit_queue.head_commit // empty' "$META_FILE" 2>/dev/null)"; then
    error "Invalid JSON in ${META_FILE}."
    exit 1
  fi

  if [ -z "$queue_head_commit" ]; then
    error "Queue state is invalid: missing queue head commit."
    exit 1
  fi

  ensure_commit_exists "$next_commit" "Queued commit"
  ensure_commit_exists "$queue_head_commit" "Queue head commit"

  short_commit="$(git -C "$REPO_ROOT" rev-parse --short "$next_commit")"
  iteration=$((processed_count + 1))

  printf '=== Processing queued commit %d: %s (%s) ===\n' "$iteration" "$short_commit" "$next_commit"

  if ! git -C "$REPO_ROOT" diff-tree --no-commit-id --name-only -r -m --root "$next_commit" -- '*.ts' '*.tsx' | grep -q '.'; then
    printf 'Skipping queued commit %s: no .ts/.tsx changes.\n' "$next_commit"
    advance_commit_queue "$queue_head_commit"
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

  git -C "$REPO_ROOT" worktree remove -f "$worktree_path"
  ACTIVE_WORKTREE_PATH=""

  git -C "$REPO_ROOT" add docs

  advance_commit_queue "$queue_head_commit"

  processed_count=$((processed_count + 1))
  printf 'Completed queued commit %s. Total processed: %d.\n' "$next_commit" "$processed_count"
done
