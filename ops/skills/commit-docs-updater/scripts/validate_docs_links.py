#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

EXTERNAL_PREFIXES = ("https://", "mailto:", "tel:", "data:")
BrokenLink = tuple[Path, int, str]


def is_code_fence(line: str) -> bool:
    """Return whether a Markdown line starts a fenced code block."""
    stripped = line.lstrip()
    return stripped.startswith(("```", "~~~"))


def is_indented_code(line: str) -> bool:
    """Return whether a Markdown line is an indented code block line."""
    return line.startswith(("    ", "\t"))


def strip_inline_code(line: str) -> str:
    """Remove inline code spans before link extraction."""
    result: list[str] = []
    cursor = 0
    while cursor < len(line):
        if line[cursor] != "`":
            result.append(line[cursor])
            cursor += 1
            continue

        tick_count = 1
        while cursor + tick_count < len(line) and line[cursor + tick_count] == "`":
            tick_count += 1

        marker = "`" * tick_count
        closing = line.find(marker, cursor + tick_count)
        if closing == -1:
            result.append(line[cursor])
            cursor += 1
            continue
        cursor = closing + tick_count

    return "".join(result)


def iter_markdown_link_targets(line: str):
    """Yield inline Markdown link targets from a non-code line."""
    # Reference-style links are intentionally out of scope for this scanner.
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
    """Normalize a Markdown link target for local path checks."""
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
    """Resolve a local Markdown target against its source file."""
    if target.startswith("/"):
        return (repo_root / target.lstrip("/")).resolve()
    return (source_file.parent / target).resolve()


def should_skip_target(target: str) -> bool:
    """Return whether a normalized target should be ignored."""
    return (
        not target
        or target.startswith("#")
        or target.startswith(EXTERNAL_PREFIXES)
    )


def find_broken_links(md_file: Path, repo_root: Path) -> list[BrokenLink]:
    """Find broken local Markdown links in one Markdown file."""
    broken: list[BrokenLink] = []
    lines = md_file.read_text(encoding="utf-8").splitlines()
    in_fenced_code = False
    for idx, line in enumerate(lines, start=1):
        if is_code_fence(line):
            in_fenced_code = not in_fenced_code
            continue
        if in_fenced_code or is_indented_code(line):
            continue

        for raw_target in iter_markdown_link_targets(strip_inline_code(line)):
            target = normalize_target(raw_target)
            if should_skip_target(target):
                continue

            resolved = resolve_target(md_file, target, repo_root)
            if not resolved.exists():
                broken.append((md_file, idx, target))
    return broken


def print_broken_links(broken: list[BrokenLink], repo_root: Path) -> None:
    """Print broken links using repo-relative file paths."""
    print("Broken markdown links found:")
    for file_path, line_no, target in broken:
        rel = file_path.relative_to(repo_root)
        print(f"  {rel}:{line_no} -> {target}")


def main() -> int:
    """Validate all Markdown links under the docs directory."""
    repo_root = Path.cwd().resolve()
    docs_root = repo_root / "ops" / "docs"
    if not docs_root.exists():
        print("ERROR: docs directory not found at ./ops/docs", file=sys.stderr)
        return 1

    markdown_files = sorted(docs_root.rglob("*.md"))
    broken = [
        broken_link
        for md_file in markdown_files
        for broken_link in find_broken_links(md_file, repo_root)
    ]

    if broken:
        print_broken_links(broken, repo_root)
        return 1

    print(f"Link validation passed ({len(markdown_files)} markdown files checked).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
