#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
META_FILE="$REPO_ROOT/docs/meta.json"

error() {
  printf '%s\n' "$1" >&2
}

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

if ! next_commit="$(git -C "$REPO_ROOT" rev-list --first-parent --reverse "${last_commit}..HEAD" 2>/dev/null | sed -n '1p')"; then
  error "Failed to query git history."
  exit 4
fi

if [ -z "$next_commit" ]; then
  error "No newer commit exists after '${last_commit}'."
  exit 3
fi

short_commit="$(git -C "$REPO_ROOT" rev-parse --short "$next_commit")"
repo_name="$(basename "$REPO_ROOT")"
parent_dir="$(dirname "$REPO_ROOT")"
worktree_path="$parent_dir/${repo_name}-next-${short_commit}"

if [ -e "$worktree_path" ]; then
  error "Target worktree path already exists: $worktree_path"
  exit 5
fi

git -C "$REPO_ROOT" worktree add --detach "$worktree_path" "$next_commit"

if [ -e "$REPO_ROOT/.codex" ] || [ -L "$REPO_ROOT/.codex" ]; then
  rm -rf "$worktree_path/.codex"
  cp -RP "$REPO_ROOT/.codex" "$worktree_path/.codex"
fi

rm -rf "$worktree_path/docs"
ln -s "$REPO_ROOT/docs" "$worktree_path/docs"

printf 'Running docs updater in worktree scope...\n'
(cd "$worktree_path" && ./docs/update_docs.sh)

tmp_meta_file="${META_FILE}.tmp"
jq --indent 4 --arg commit "$next_commit" '.last_commit = $commit' "$META_FILE" > "$tmp_meta_file"
mv "$tmp_meta_file" "$META_FILE"

git -C "$REPO_ROOT" worktree remove -f "$worktree_path"

git -C "$REPO_ROOT" add docs
git -C "$REPO_ROOT" commit -m "docs updated ${next_commit}"

printf 'Updated docs/meta.json to %s, removed worktree, committed source branch.\n' "$next_commit"
