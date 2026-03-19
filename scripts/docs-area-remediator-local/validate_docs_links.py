#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Iterable, Sequence

LINK_RE = re.compile(r"\[[^\]]+\]\(([^)]+)\)")
EXTERNAL_PREFIXES = ("http://", "https://", "mailto:", "tel:", "data:")


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate local markdown links under docs/."
    )
    parser.add_argument(
        "--docs-root",
        default="docs",
        help="Docs root path relative to current working directory.",
    )
    return parser.parse_args(argv)


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def normalize_target(raw_target: str) -> str:
    target = raw_target.strip()
    if target.startswith("<") and target.endswith(">"):
        target = target[1:-1].strip()

    quoted_title = re.match(r"^(?P<path>.+?)\s+(['\"]).*\2$", target)
    if quoted_title:
        target = quoted_title.group("path").strip()

    target = target.split("#", 1)[0].strip()
    target = target.split("?", 1)[0].strip()
    return target


def resolve_candidates(source_file: Path, target: str, repo_root: Path) -> list[Path]:
    if target.startswith("/"):
        base = (repo_root / target.lstrip("/")).resolve()
    else:
        base = (source_file.parent / target).resolve()

    candidates = [base]

    if target.endswith("/"):
        candidates.append((base / "README.md").resolve())

    if base.suffix == "":
        candidates.append(base.with_suffix(".md"))
        candidates.append((base / "README.md").resolve())

    return candidates


def collect_broken_links(docs_files: Iterable[Path], repo_root: Path) -> list[tuple[Path, int, str]]:
    broken: list[tuple[Path, int, str]] = []

    for path in docs_files:
        lines = read_text(path).splitlines()
        for line_no, line in enumerate(lines, start=1):
            for raw in LINK_RE.findall(line):
                target = normalize_target(raw)
                if not target or target.startswith("#"):
                    continue
                if target.startswith(EXTERNAL_PREFIXES):
                    continue

                candidates = resolve_candidates(path, target, repo_root)
                if any(candidate.exists() for candidate in candidates):
                    continue

                broken.append((path, line_no, target))

    return broken


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    repo_root = Path.cwd().resolve()
    docs_root = (repo_root / args.docs_root).resolve()

    if not docs_root.exists() or not docs_root.is_dir():
        print(f"ERROR: docs root not found: {docs_root}")
        return 1

    docs_files = sorted(docs_root.rglob("*.md"))
    broken = collect_broken_links(docs_files, repo_root)

    print("Docs links validator")
    if not broken:
        print("Result: PASS")
        return 0

    print("errors:")
    for path, line_no, target in broken:
        rel = path.relative_to(repo_root)
        print(f"- {rel}:{line_no} -> {target}")
    print(f"Result: FAIL ({len(broken)} broken links)")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
