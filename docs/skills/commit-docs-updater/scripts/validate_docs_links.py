#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

EXTERNAL_PREFIXES = ("https://", "mailto:", "tel:", "data:")


def iter_markdown_link_targets(line: str):
    cursor = 0
    while cursor < len(line):
        label_start = line.find("[", cursor)
        if label_start == -1:
            return
        label_end = line.find("]", label_start + 1)
        if label_end == -1:
            return
        target_start = label_end + 1
        if target_start >= len(line) or line[target_start] != "(":
            cursor = label_end + 1
            continue
        target_end = line.find(")", target_start + 1)
        if target_end == -1:
            return
        yield line[target_start + 1 : target_end]
        cursor = target_end + 1


def normalize_target(raw_target: str) -> str:
    target = raw_target.strip()
    if target.startswith("<") and target.endswith(">"):
        target = target[1:-1].strip()
    for quote in ("'", '"'):
        title_marker = f" {quote}"
        title_start = target.find(title_marker)
        if title_start != -1 and target.endswith(quote):
            target = target[:title_start].strip()
            break
    target = target.split("#", 1)[0].strip()
    return target


def resolve_target(source_file: Path, target: str, repo_root: Path) -> Path:
    if target.startswith("/"):
        return (repo_root / target.lstrip("/")).resolve()
    return (source_file.parent / target).resolve()


def main() -> int:
    repo_root = Path.cwd().resolve()
    docs_root = repo_root / "docs"
    if not docs_root.exists():
        print("ERROR: docs directory not found at ./docs", file=sys.stderr)
        return 1

    broken: list[tuple[Path, int, str]] = []
    markdown_files = sorted(docs_root.rglob("*.md"))

    for md_file in markdown_files:
        lines = md_file.read_text(encoding="utf-8").splitlines()
        for idx, line in enumerate(lines, start=1):
            for raw_target in iter_markdown_link_targets(line):
                target = normalize_target(raw_target)
                if not target:
                    continue
                if target.startswith("#"):
                    continue
                if target.startswith(EXTERNAL_PREFIXES):
                    continue

                resolved = resolve_target(md_file, target, repo_root)
                if not resolved.exists():
                    broken.append((md_file, idx, target))

    if broken:
        print("Broken markdown links found:")
        for file_path, line_no, target in broken:
            rel = file_path.relative_to(repo_root)
            print(f"  {rel}:{line_no} -> {target}")
        return 1

    print(f"Link validation passed ({len(markdown_files)} markdown files checked).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
