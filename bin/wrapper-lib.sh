# shellcheck shell=bash
# 6529-repo-command-wrapper
#
# Shared helpers for the repo command wrappers (bin/6529, bin/pnpm). Source it,
# do not run it.
#
# The wrappers find the real pnpm by searching PATH. PATH can hold the wrapper
# folder of this checkout in more than one spelling, and the wrapper folders of
# other checkouts of this repository (another worktree, for example). A search
# that only skips one exact spelling of this folder can therefore resolve to a
# wrapper again, and two wrappers can then start each other without end.
#
# These helpers never return a wrapper: a PATH entry is skipped when it is this
# wrapper's own folder in any spelling, and a candidate file is skipped when it
# is one of this repository's wrappers, whichever checkout it belongs to. A
# depth counter stops any chain of wrapper starts that still gets through.

# Wrapper starts allowed in one process chain. package.json scripts call pnpm
# again, so a few nested starts are normal; nothing legitimate comes near this.
SEIZE_WRAPPER_MAX_DEPTH=32

# How a wrapper of this repository is recognised:
# - this version carries the marker below as a comment line of its own;
# - the versions that older checkouts still have print the "blocked" line for
#   their command name, as a complete echo statement.
# Both are exact lines of our own files, so another program that merely mentions
# similar words is not mistaken for a wrapper.
SEIZE_WRAPPER_MARK_LINE="# 6529-repo-command-wrapper"

seize_wrapper_is_windows() {
  case "$(uname -s 2>/dev/null || true)" in
    MINGW* | MSYS* | CYGWIN*) return 0 ;;
    *) return 1 ;;
  esac
}

# Prints the physical, POSIX-style path of a directory: Windows spellings are
# converted, links and junctions are resolved, and a trailing slash is dropped.
# Fails when the directory does not exist.
seize_wrapper_canonical_dir() {
  local dir="$1"
  if [[ -z "$dir" ]]; then
    return 1
  fi
  if [[ "$dir" =~ ^[A-Za-z]:([\\/]|$) || "$dir" == *\\* ]]; then
    if command -v cygpath >/dev/null 2>&1; then
      dir="$(cygpath -u "$dir" 2>/dev/null || printf '%s' "$dir")"
    fi
  fi
  dir="$(cd "$dir" 2>/dev/null && pwd -P)" || return 1
  if seize_wrapper_is_windows; then
    dir="$(printf '%s' "$dir" | tr '[:upper:]' '[:lower:]')"
  fi
  printf '%s' "$dir"
}

# seize_wrapper_is_wrapper_file <file> <name>
# True when the file is one of this repository's command wrappers for <name>.
seize_wrapper_is_wrapper_file() {
  local file="$1" name="$2" line count=0
  local previous_line="echo \"Direct $name usage is blocked in this repository.\" >&2"
  # Wrappers are short scripts with these lines near the top; real tools are
  # not read beyond their first lines.
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$''}"
    if [[ "$line" == "$SEIZE_WRAPPER_MARK_LINE" ]]; then
      return 0
    fi
    # Leading spaces only: the statement sits inside an if block.
    if [[ "${line#"${line%%[![:space:]]*}"}" == "$previous_line" ]]; then
      return 0
    fi
    count=$((count + 1))
    if ((count >= 40)); then
      break
    fi
  done < <(head -c 4096 "$file" 2>/dev/null || true)
  return 1
}

# seize_wrapper_resolve <name> <wrapper-dir>
# Prints the first executable called <name> on PATH that is not in <wrapper-dir>
# and is not a wrapper of this repository. Prints nothing when there is none.
# The names tried are the ones bash itself resolves: <name> and <name>.exe
# (bash does not start .cmd or .bat files by bare name).
seize_wrapper_resolve() {
  local name="$1" own_dir="$2"
  local own_canonical part part_canonical candidate
  own_canonical="$(seize_wrapper_canonical_dir "$own_dir" || true)"

  local -a parts=()
  IFS=':' read -r -a parts <<< "${PATH:-}"
  for part in "${parts[@]}"; do
    if [[ -z "$part" ]]; then
      continue
    fi
    for candidate in "$part/$name" "$part/$name.exe"; do
      # Cheap test first: most PATH entries hold no such file, and resolving
      # every entry would start a subshell for each of them.
      if [[ ! -f "$candidate" || ! -x "$candidate" ]]; then
        continue
      fi
      part_canonical="$(seize_wrapper_canonical_dir "$part" || true)"
      if [[ -z "$part_canonical" ]]; then
        continue
      fi
      if [[ -n "$own_canonical" && "$part_canonical" == "$own_canonical" ]]; then
        continue
      fi
      if seize_wrapper_is_wrapper_file "$candidate" "$name"; then
        continue
      fi
      printf '%s' "$candidate"
      return 0
    done
  done
  return 0
}

# Counts this wrapper start and stops the chain when it is too deep. Call it
# once, early, in every wrapper.
seize_wrapper_enter() {
  local wrapper_name="$1" depth="${SEIZE_WRAPPER_DEPTH:-0}"
  if [[ ! "$depth" =~ ^[0-9]+$ ]]; then
    depth=0
  fi
  if ((depth >= SEIZE_WRAPPER_MAX_DEPTH)); then
    echo "The \`$wrapper_name\` wrapper was started $depth times in one chain of commands." >&2
    echo "Stopping: wrappers of this repository appear to be starting each other." >&2
    echo "Check PATH for the bin folder of more than one checkout of this repository." >&2
    exit 97
  fi
  export SEIZE_WRAPPER_DEPTH="$((depth + 1))"
}
