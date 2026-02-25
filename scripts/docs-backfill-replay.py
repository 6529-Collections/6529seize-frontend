#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Sequence

DEFAULT_STATE_FILE = Path("docs/_meta/commit-docs-backfill-state.json")
DEFAULT_MODE = "first-parent"
DEFAULT_INSTRUCTION = (
    "Use $commit-docs-updater. Treat the current HEAD commit as the full scope for this run."
)
DEFAULT_COMMIT_MESSAGE = "docs: backfill commit-docs replay"
LINK_VALIDATION_CMD = [
    "python3",
    ".codex/skills/commit-docs-updater/scripts/validate_docs_links.py",
]


@dataclass
class ReplayState:
    last_processed_commit: str | None
    mode: str
    notes: str | None


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def run_cmd(
    args: Sequence[str],
    cwd: Path,
    *,
    check: bool = True,
    input_text: str | None = None,
) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        args,
        cwd=cwd,
        text=True,
        input=input_text,
        capture_output=True,
    )
    if check and result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip() or "unknown error"
        raise RuntimeError(f"{' '.join(args)} failed: {detail}")
    return result


def git(cwd: Path, *args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    return run_cmd(["git", *args], cwd=cwd, check=check)


def find_repo_root() -> Path:
    result = run_cmd(
        ["git", "rev-parse", "--show-toplevel"],
        cwd=Path.cwd(),
    )
    return Path(result.stdout.strip()).resolve()


def resolve_commit(repo_root: Path, ref: str) -> str:
    result = git(repo_root, "rev-parse", "--verify", f"{ref}^{{commit}}")
    return result.stdout.strip()


def short_commit(repo_root: Path, commit_sha: str) -> str:
    result = git(repo_root, "rev-parse", "--short=12", commit_sha)
    return result.stdout.strip()


def is_ancestor(repo_root: Path, older: str, newer: str) -> bool:
    result = git(repo_root, "merge-base", "--is-ancestor", older, newer, check=False)
    if result.returncode == 0:
        return True
    if result.returncode == 1:
        return False
    detail = result.stderr.strip() or result.stdout.strip() or "unknown git error"
    raise RuntimeError(f"Failed ancestry check for {older} -> {newer}: {detail}")


def ensure_clean_worktree(repo_root: Path) -> None:
    result = git(repo_root, "status", "--porcelain")
    if result.stdout.strip():
        raise RuntimeError(
            "Working tree is not clean. Commit or stash changes before running replay."
        )


def parse_state(raw: dict[str, Any]) -> ReplayState:
    last = raw.get("last_processed_commit")
    if isinstance(last, str):
        last = last.strip() or None
    else:
        last = None

    mode = raw.get("mode")
    if not isinstance(mode, str) or not mode.strip():
        mode = DEFAULT_MODE
    mode = mode.strip()

    notes = raw.get("notes")
    if isinstance(notes, str):
        notes = notes.strip() or None
    else:
        notes = None

    return ReplayState(last_processed_commit=last, mode=mode, notes=notes)


def load_state(path: Path) -> ReplayState:
    if not path.exists():
        return ReplayState(last_processed_commit=None, mode=DEFAULT_MODE, notes=None)

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"State file is invalid JSON: {path} ({exc})") from exc

    if not isinstance(payload, dict):
        raise RuntimeError(f"State file must contain a JSON object: {path}")

    return parse_state(payload)


def save_state(
    path: Path,
    *,
    last_processed_commit: str,
    mode: str,
    notes: str | None,
) -> None:
    payload: dict[str, Any] = {
        "last_processed_commit": last_processed_commit,
        "updated_at": utc_now(),
        "mode": mode,
    }
    if notes:
        payload["notes"] = notes
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def list_commits(repo_root: Path, *, start: str, end: str, mode: str) -> list[str]:
    if mode != DEFAULT_MODE:
        raise RuntimeError(f"Unsupported mode: {mode}")

    result = git(repo_root, "rev-list", "--first-parent", "--reverse", f"{start}..{end}")
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def build_docs_patch(worktree: Path) -> str | None:
    git(worktree, "add", "docs")
    diff = git(worktree, "diff", "--cached", "--binary", "--", "docs").stdout
    if not diff.strip():
        return None
    return diff


def apply_patch(repo_root: Path, patch: str) -> None:
    result = run_cmd(
        ["git", "apply", "--3way", "--index", "--whitespace=nowarn", "-"],
        cwd=repo_root,
        check=False,
        input_text=patch,
    )
    if result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip() or "unknown git apply error"
        raise RuntimeError(f"Patch apply failed: {detail}")


def run_links_validation(repo_root: Path) -> None:
    run_cmd(LINK_VALIDATION_CMD, cwd=repo_root)


def run_commit_docs_updater(worktree: Path, instruction: str) -> None:
    result = run_cmd(["codex", "exec", "--", instruction], cwd=worktree, check=False)
    if result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip() or "unknown codex error"
        raise RuntimeError(f"commit-docs-updater run failed: {detail}")


def write_log(log_path: Path, entries: list[dict[str, str]]) -> None:
    lines = [json.dumps(entry, sort_keys=True) for entry in entries]
    content = "\n".join(lines)
    if lines:
        content += "\n"
    log_path.write_text(content, encoding="utf-8")


def finalize_docs_commit(
    repo_root: Path,
    *,
    subject: str,
    from_sha: str,
    to_sha: str,
    processed: int,
    docs_changed: int,
) -> bool:
    git(repo_root, "add", "docs")
    staged = git(repo_root, "diff", "--cached", "--name-only").stdout.strip()
    if not staged:
        return False

    body = "\n".join(
        [
            f"from: {from_sha}",
            f"to: {to_sha}",
            f"processed_commits: {processed}",
            f"docs_changed_commits: {docs_changed}",
        ]
    )
    git(repo_root, "commit", "-m", subject, "-m", body)
    return True


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Replay commit-docs-updater across a commit range using fresh per-commit worktrees "
            "and a tracked last-processed cursor."
        )
    )
    parser.add_argument(
        "--state-file",
        default=str(DEFAULT_STATE_FILE),
        help=f"Tracked cursor state file (default: {DEFAULT_STATE_FILE})",
    )
    parser.add_argument(
        "--from",
        dest="from_ref",
        help="Start commit (processed cursor). If omitted, read from state file.",
    )
    parser.add_argument(
        "--to",
        dest="to_ref",
        default="HEAD",
        help="End commit (inclusive upper bound; default: HEAD)",
    )
    parser.add_argument(
        "--mode",
        default=DEFAULT_MODE,
        choices=(DEFAULT_MODE,),
        help="Traversal mode (default: first-parent)",
    )
    parser.add_argument(
        "--init",
        dest="init_ref",
        help="Initialize cursor to this commit and exit.",
    )
    parser.add_argument(
        "--notes",
        help="Optional notes saved in state file when cursor is updated.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be processed without mutating git state.",
    )
    parser.add_argument(
        "--skip-links-validation",
        action="store_true",
        help="Skip docs link validation after each successful apply.",
    )
    parser.add_argument(
        "--codex-instruction",
        default=DEFAULT_INSTRUCTION,
        help="Instruction passed to codex exec for each commit.",
    )
    parser.add_argument(
        "--commit-message",
        default=DEFAULT_COMMIT_MESSAGE,
        help="Final squashed docs commit message subject.",
    )
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    repo_root = find_repo_root()
    state_path = Path(args.state_file)
    if not state_path.is_absolute():
        state_path = (repo_root / state_path).resolve()

    log_fd, log_path = tempfile.mkstemp(prefix="docs-backfill-replay-", suffix=".log")
    os.close(log_fd)
    log_file = Path(log_path)
    log_entries: list[dict[str, str]] = []

    try:
        if args.init_ref:
            init_sha = resolve_commit(repo_root, args.init_ref)
            if args.dry_run:
                print(f"[dry-run] would initialize cursor to {init_sha}")
                return 0

            ensure_clean_worktree(repo_root)
            save_state(
                state_path,
                last_processed_commit=init_sha,
                mode=args.mode,
                notes=args.notes,
            )
            print(f"Initialized cursor: {init_sha}")
            print(f"State file: {state_path}")
            return 0

        ensure_clean_worktree(repo_root)
        to_sha = resolve_commit(repo_root, args.to_ref)
        state = load_state(state_path)

        if args.from_ref:
            start_sha = resolve_commit(repo_root, args.from_ref)
        else:
            if not state.last_processed_commit:
                raise RuntimeError(
                    "State file has no last_processed_commit. Initialize with "
                    "`--init <commit-ref>` or pass `--from <commit-ref>`."
                )
            start_sha = resolve_commit(repo_root, state.last_processed_commit)

        if start_sha != to_sha and not is_ancestor(repo_root, start_sha, to_sha):
            raise RuntimeError(
                f"Start commit is not an ancestor of end commit: {start_sha} -> {to_sha}"
            )

        queue = list_commits(repo_root, start=start_sha, end=to_sha, mode=args.mode)

        print(f"repo_root={repo_root}")
        print(f"state_file={state_path}")
        print(f"from={start_sha}")
        print(f"to={to_sha}")
        print(f"mode={args.mode}")
        print(f"pending_commits={len(queue)}")
        print("")

        if not queue:
            print("No pending commits to process.")
            return 0

        processed = 0
        docs_changed = 0
        validate_links = not args.skip_links_validation

        for index, commit_sha in enumerate(queue, start=1):
            commit_short = short_commit(repo_root, commit_sha)
            print(f"[{index}/{len(queue)}] processing {commit_short}")

            if args.dry_run:
                log_entries.append(
                    {
                        "commit": commit_sha,
                        "status": "dry-run",
                        "timestamp": utc_now(),
                    }
                )
                continue

            worktree_path = Path(
                tempfile.mkdtemp(prefix=f"docs-backfill-{commit_short}-", dir=None)
            )
            git(repo_root, "worktree", "add", "--detach", str(worktree_path), commit_sha)

            try:
                run_commit_docs_updater(worktree_path, args.codex_instruction)
                patch = build_docs_patch(worktree_path)
                if patch:
                    apply_patch(repo_root, patch)
                    docs_changed += 1
                    status = "applied"
                    if validate_links:
                        run_links_validation(repo_root)
                else:
                    status = "noop"

                save_state(
                    state_path,
                    last_processed_commit=commit_sha,
                    mode=args.mode,
                    notes=args.notes,
                )

                processed += 1
                log_entries.append(
                    {
                        "commit": commit_sha,
                        "status": status,
                        "timestamp": utc_now(),
                    }
                )
            except Exception as exc:
                log_entries.append(
                    {
                        "commit": commit_sha,
                        "status": "failed",
                        "error": str(exc),
                        "timestamp": utc_now(),
                    }
                )
                raise RuntimeError(f"Backfill failed at {commit_short}: {exc}") from exc
            finally:
                git(repo_root, "worktree", "remove", "--force", str(worktree_path), check=False)
                if worktree_path.exists():
                    shutil.rmtree(worktree_path, ignore_errors=True)

        if args.dry_run:
            print("Dry run complete.")
            return 0

        committed = finalize_docs_commit(
            repo_root,
            subject=args.commit_message,
            from_sha=start_sha,
            to_sha=to_sha,
            processed=processed,
            docs_changed=docs_changed,
        )
        if committed:
            print("Created final squashed docs commit.")
        else:
            print("No docs changes detected; no commit created.")

        print(f"Processed commits: {processed}")
        print(f"Commits with docs changes: {docs_changed}")
        print(f"Updated cursor: {queue[-1]}")
        return 0
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    finally:
        write_log(log_file, log_entries)
        print(f"run_log={log_file}")


if __name__ == "__main__":
    raise SystemExit(main())
