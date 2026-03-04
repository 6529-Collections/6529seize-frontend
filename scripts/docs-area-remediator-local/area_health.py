#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, Sequence

INDEX_TEMPLATE_HEADINGS = (
    "Overview",
    "Features",
    "Flows",
    "Troubleshooting",
    "Stubs",
    "Related Areas",
)

EXTERNAL_PREFIXES = ("http://", "https://", "mailto:", "tel:", "data:")
PLACEHOLDER_RE = re.compile(r"No dedicated .* documented yet", re.IGNORECASE)
LINK_RE = re.compile(r"\[[^\]]+\]\(([^)]+)\)")
BACKTICK_RE = re.compile(r"`([^`\n]+)`")

SOURCE_DIR_CANDIDATES = (
    "app",
    "pages",
    "components",
    "hooks",
    "services",
    "contexts",
    "helpers",
    "lib",
    "src",
    "config",
    "constants",
    "types",
    "utils",
)

LARGE_PAGE_LINE_THRESHOLD = 150
SMALL_PAGE_LINE_THRESHOLD = 70
MERGE_CLUSTER_THRESHOLD = 6


@dataclass
class AreaAudit:
    area: str
    area_dir: Path
    total_pages: int = 0
    feature_pages: int = 0
    flow_pages: int = 0
    troubleshooting_pages: int = 0
    placeholder_count: int = 0
    area_missing_headings: list[str] = field(default_factory=list)
    subarea_missing_headings: dict[str, list[str]] = field(default_factory=dict)
    duplicate_targets: dict[str, list[str]] = field(default_factory=dict)
    missing_area_links: list[str] = field(default_factory=list)
    missing_subarea_links: list[str] = field(default_factory=list)
    missing_subpage_links: list[str] = field(default_factory=list)
    large_pages: list[str] = field(default_factory=list)
    stale_pages: dict[str, list[str]] = field(default_factory=dict)
    merge_candidates: list[str] = field(default_factory=list)
    split_candidates: list[str] = field(default_factory=list)
    score: int = 0


def run(args: Sequence[str], cwd: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, cwd=cwd, capture_output=True, text=True)


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def has_heading(text: str, heading: str) -> bool:
    pattern = rf"^##\s+{re.escape(heading)}\s*$"
    return re.search(pattern, text, flags=re.MULTILINE) is not None


def normalize_target(raw_target: str) -> str:
    target = raw_target.strip()
    if target.startswith("<") and target.endswith(">"):
        target = target[1:-1].strip()
    quoted_title = re.match(r"^(?P<path>.+?)\s+(['\"])(?P<title>.*)\2$", target)
    if quoted_title:
        target = quoted_title.group("path").strip()
    target = target.split("#", 1)[0].strip()
    return target


def local_targets(text: str) -> list[str]:
    targets: list[str] = []
    for raw in LINK_RE.findall(text):
        target = normalize_target(raw)
        if not target or target.startswith("#"):
            continue
        if target.startswith(EXTERNAL_PREFIXES):
            continue
        targets.append(target)
    return targets


def duplicate_targets(text: str) -> list[str]:
    counts = Counter(local_targets(text))
    return sorted([target for target, count in counts.items() if count > 1])


def extract_route_tokens(text: str) -> list[str]:
    tokens: set[str] = set()
    for raw in BACKTICK_RE.findall(text):
        token = raw.strip()
        if not token.startswith("/"):
            continue
        if "{" in token or "}" in token:
            continue
        token = token.rstrip(".,:;)")
        if len(token) < 2:
            continue
        tokens.add(token)
    return sorted(tokens)


def git_latest_timestamp(repo_root: Path, paths: Iterable[Path]) -> int | None:
    rel_paths: list[str] = []
    for path in paths:
        if path.is_absolute():
            try:
                rel_paths.append(str(path.relative_to(repo_root)))
            except ValueError:
                continue
        else:
            rel_paths.append(str(path))

    if not rel_paths:
        return None

    result = run(["git", "log", "-1", "--format=%ct", "--", *rel_paths], repo_root)
    if result.returncode != 0:
        return None

    output = result.stdout.strip()
    if not output:
        return None

    try:
        return int(output)
    except ValueError:
        return None


def existing_source_dirs(repo_root: Path) -> list[str]:
    return [name for name in SOURCE_DIR_CANDIDATES if (repo_root / name).exists()]


def find_route_matches(
    token: str,
    repo_root: Path,
    source_dirs: list[str],
    cache: dict[str, list[Path]],
) -> list[Path]:
    if token in cache:
        return cache[token]

    if not source_dirs:
        cache[token] = []
        return []

    result = run(
        ["rg", "-l", "--fixed-strings", "--glob", "!docs/**", token, *source_dirs],
        repo_root,
    )

    if result.returncode not in (0, 1):
        cache[token] = []
        return []

    matches: list[Path] = []
    for raw in result.stdout.splitlines():
        raw = raw.strip()
        if not raw:
            continue
        path = (repo_root / raw).resolve()
        if path.exists():
            matches.append(path)

    cache[token] = matches
    return matches


def compute_merge_candidates(scope_name: str, feature_pages: list[Path]) -> list[str]:
    candidates: list[str] = []
    if len(feature_pages) < MERGE_CLUSTER_THRESHOLD:
        return candidates

    suffix_counts: Counter[str] = Counter()
    for page in feature_pages:
        stem_tokens = page.stem.split("-")
        if stem_tokens and stem_tokens[0] == "feature":
            stem_tokens = stem_tokens[1:]
        if not stem_tokens:
            continue
        if len(stem_tokens) >= 2:
            key = "-".join(stem_tokens[-2:])
        else:
            key = stem_tokens[0]
        suffix_counts[key] += 1

    for suffix, count in suffix_counts.items():
        if count >= MERGE_CLUSTER_THRESHOLD:
            candidates.append(
                f"{scope_name}: {count} feature pages share filename suffix '{suffix}'"
            )

    small_pages = []
    for page in feature_pages:
        line_count = len(read_text(page).splitlines())
        if line_count <= SMALL_PAGE_LINE_THRESHOLD:
            small_pages.append(page)

    if len(small_pages) >= MERGE_CLUSTER_THRESHOLD:
        candidates.append(
            f"{scope_name}: {len(small_pages)} small feature pages (<= {SMALL_PAGE_LINE_THRESHOLD} lines)"
        )

    return sorted(set(candidates))


def score_audit(audit: AreaAudit) -> int:
    score = 0
    score += 3 * len(audit.area_missing_headings)
    score += 2 * sum(len(v) for v in audit.subarea_missing_headings.values())
    score += 5 * len(audit.missing_area_links)
    score += 5 * len(audit.missing_subarea_links)
    score += 4 * len(audit.missing_subpage_links)
    score += 3 * sum(len(v) for v in audit.duplicate_targets.values())
    if audit.feature_pages > 8 and audit.flow_pages == 0:
        score += 12
    if audit.feature_pages > 8 and audit.troubleshooting_pages == 0:
        score += 12
    score += 2 * audit.placeholder_count
    score += 2 * len(audit.large_pages)
    score += 4 * len(audit.stale_pages)
    score += 3 * len(audit.merge_candidates)
    score += 3 * len(audit.split_candidates)
    return score


def audit_area(repo_root: Path, docs_root: Path, area: str) -> AreaAudit:
    area_dir = docs_root / area
    if not area_dir.exists() or not area_dir.is_dir():
        raise ValueError(f"Area not found: {area}")

    area_readme = area_dir / "README.md"
    if not area_readme.exists():
        raise ValueError(f"Missing area README: {area_readme}")

    audit = AreaAudit(area=area, area_dir=area_dir)
    source_dirs = existing_source_dirs(repo_root)
    route_cache: dict[str, list[Path]] = {}

    all_md = sorted(area_dir.rglob("*.md"))
    content_pages = [path for path in all_md if path.name != "README.md"]
    audit.total_pages = len(content_pages)
    audit.feature_pages = sum(1 for page in content_pages if page.name.startswith("feature-"))
    audit.flow_pages = sum(1 for page in content_pages if page.name.startswith("flow-"))
    audit.troubleshooting_pages = sum(
        1 for page in content_pages if page.name.startswith("troubleshooting-")
    )

    area_readme_text = read_text(area_readme)
    audit.placeholder_count += len(PLACEHOLDER_RE.findall(area_readme_text))

    for heading in INDEX_TEMPLATE_HEADINGS:
        if not has_heading(area_readme_text, heading):
            audit.area_missing_headings.append(heading)

    area_dups = duplicate_targets(area_readme_text)
    if area_dups:
        audit.duplicate_targets[str(area_readme.relative_to(repo_root))] = area_dups

    # Discoverability: direct pages should be linked from area README.
    direct_pages = [path for path in area_dir.glob("*.md") if path.name != "README.md"]
    for page in sorted(direct_pages):
        if page.name not in area_readme_text:
            audit.missing_area_links.append(str(page.relative_to(repo_root)))

    # Subareas and subarea discoverability.
    subareas = sorted([path for path in area_dir.iterdir() if path.is_dir()])
    for subarea_dir in subareas:
        subarea_readme = subarea_dir / "README.md"
        if not subarea_readme.exists():
            continue

        subarea_rel = str(subarea_readme.relative_to(repo_root))
        subarea_key = f"{subarea_dir.name}/README.md"
        subarea_text = read_text(subarea_readme)
        audit.placeholder_count += len(PLACEHOLDER_RE.findall(subarea_text))

        missing = [h for h in INDEX_TEMPLATE_HEADINGS if not has_heading(subarea_text, h)]
        if missing:
            audit.subarea_missing_headings[subarea_rel] = missing

        subarea_dups = duplicate_targets(subarea_text)
        if subarea_dups:
            audit.duplicate_targets[subarea_rel] = subarea_dups

        if subarea_key not in area_readme_text:
            audit.missing_subarea_links.append(subarea_rel)

        sub_pages = [path for path in subarea_dir.glob("*.md") if path.name != "README.md"]
        for page in sorted(sub_pages):
            if page.name not in subarea_text:
                audit.missing_subpage_links.append(str(page.relative_to(repo_root)))

    # Split candidates and stale checks.
    for page in content_pages:
        text = read_text(page)
        line_count = len(text.splitlines())
        if line_count >= LARGE_PAGE_LINE_THRESHOLD:
            audit.large_pages.append(f"{page.relative_to(repo_root)} ({line_count} lines)")

        route_tokens = extract_route_tokens(text)
        if not route_tokens:
            continue

        doc_ts = git_latest_timestamp(repo_root, [page])
        if doc_ts is None:
            continue

        stale_tokens: list[str] = []
        for token in route_tokens:
            matches = find_route_matches(token, repo_root, source_dirs, route_cache)
            if not matches:
                continue
            code_ts = git_latest_timestamp(repo_root, matches)
            if code_ts is not None and code_ts > doc_ts:
                stale_tokens.append(token)

        if stale_tokens:
            audit.stale_pages[str(page.relative_to(repo_root))] = sorted(set(stale_tokens))

    # Merge/split candidates by scope.
    root_features = [page for page in direct_pages if page.name.startswith("feature-")]
    audit.merge_candidates.extend(compute_merge_candidates(f"docs/{area}", root_features))

    for subarea_dir in subareas:
        sub_features = [
            path
            for path in subarea_dir.glob("feature-*.md")
            if path.is_file()
        ]
        scope = f"docs/{area}/{subarea_dir.name}"
        audit.merge_candidates.extend(compute_merge_candidates(scope, sub_features))

    if len(audit.large_pages) > 0:
        audit.split_candidates.extend(audit.large_pages)

    audit.merge_candidates = sorted(set(audit.merge_candidates))
    audit.split_candidates = sorted(set(audit.split_candidates))
    audit.score = score_audit(audit)
    return audit


def audit_all_areas(repo_root: Path, docs_root: Path) -> list[AreaAudit]:
    audits: list[AreaAudit] = []
    for area_dir in sorted(docs_root.iterdir()):
        if not area_dir.is_dir():
            continue
        if not (area_dir / "README.md").exists():
            continue
        audits.append(audit_area(repo_root, docs_root, area_dir.name))
    audits.sort(key=lambda item: item.score, reverse=True)
    return audits


def index_issue_count(audit: AreaAudit) -> int:
    return (
        len(audit.area_missing_headings)
        + sum(len(v) for v in audit.subarea_missing_headings.values())
        + sum(len(v) for v in audit.duplicate_targets.values())
        + len(audit.missing_area_links)
        + len(audit.missing_subarea_links)
        + len(audit.missing_subpage_links)
    )


def print_summary_table(audits: list[AreaAudit]) -> None:
    print(
        f"{'area':<16}{'score':>7}{'pages':>7}{'feat':>7}{'flow':>7}"
        f"{'trbl':>7}{'stale':>7}{'idx':>7}"
    )
    print("-" * 64)
    for audit in audits:
        print(
            f"{audit.area:<16}{audit.score:>7}{audit.total_pages:>7}{audit.feature_pages:>7}"
            f"{audit.flow_pages:>7}{audit.troubleshooting_pages:>7}"
            f"{len(audit.stale_pages):>7}{index_issue_count(audit):>7}"
        )


def reasons(audit: AreaAudit) -> list[str]:
    items: list[str] = []
    if audit.area_missing_headings:
        items.append(
            f"area README misses template headings: {', '.join(audit.area_missing_headings)}"
        )
    if audit.subarea_missing_headings:
        items.append(f"{len(audit.subarea_missing_headings)} subarea README files miss template headings")
    if audit.feature_pages > 8 and audit.flow_pages == 0:
        items.append("feature-heavy area with no flow pages")
    if audit.feature_pages > 8 and audit.troubleshooting_pages == 0:
        items.append("feature-heavy area with no troubleshooting pages")
    if audit.missing_subpage_links or audit.missing_area_links or audit.missing_subarea_links:
        missing = len(audit.missing_subpage_links) + len(audit.missing_area_links) + len(
            audit.missing_subarea_links
        )
        items.append(f"{missing} discoverability gaps in indexes")
    if audit.placeholder_count:
        items.append(f"{audit.placeholder_count} placeholder lines still in indexes")
    if audit.stale_pages:
        items.append(f"{len(audit.stale_pages)} pages have stale-route signals")
    if audit.merge_candidates:
        items.append(f"{len(audit.merge_candidates)} merge candidates detected")
    if audit.large_pages:
        items.append(f"{len(audit.large_pages)} oversized pages to split")
    return items


def print_pick(audit: AreaAudit, max_items: int) -> None:
    print(f"next_area={audit.area}")
    print(f"score={audit.score}")
    print("")
    print("why_now:")
    for item in reasons(audit)[:max_items]:
        print(f"- {item}")
    print("")
    print("next_commands:")
    print(f"- python3 .codex/skills/docs-area-remediator/scripts/area_health.py --area {audit.area}")
    print(
        "- python3 .codex/skills/docs-area-remediator/scripts/validate_docs_optimizations.py "
        f"--area {audit.area} --strict"
    )
    print("- python3 .codex/skills/commit-docs-updater/scripts/validate_docs_links.py")


def print_list(title: str, values: list[str], max_items: int) -> None:
    print(title)
    if not values:
        print("- none")
        print("")
        return

    shown = values[:max_items]
    for value in shown:
        print(f"- {value}")
    remaining = len(values) - len(shown)
    if remaining > 0:
        print(f"- ... and {remaining} more")
    print("")


def print_detail(audit: AreaAudit, max_items: int) -> None:
    print(f"area={audit.area}")
    print(f"score={audit.score}")
    print("")
    print("counts:")
    print(f"- total_pages: {audit.total_pages}")
    print(f"- feature_pages: {audit.feature_pages}")
    print(f"- flow_pages: {audit.flow_pages}")
    print(f"- troubleshooting_pages: {audit.troubleshooting_pages}")
    print(f"- stale_pages: {len(audit.stale_pages)}")
    print(f"- placeholder_lines: {audit.placeholder_count}")
    print(f"- index_issues: {index_issue_count(audit)}")
    print("")

    print_list("area_missing_headings:", audit.area_missing_headings, max_items)

    sub_missing = [
        f"{path}: {', '.join(headings)}"
        for path, headings in sorted(audit.subarea_missing_headings.items())
    ]
    print_list("subarea_missing_headings:", sub_missing, max_items)

    dup_targets = [
        f"{path}: {', '.join(targets)}"
        for path, targets in sorted(audit.duplicate_targets.items())
    ]
    print_list("duplicate_link_targets:", dup_targets, max_items)

    print_list("missing_area_links:", sorted(audit.missing_area_links), max_items)
    print_list("missing_subarea_links:", sorted(audit.missing_subarea_links), max_items)
    print_list("missing_subpage_links:", sorted(audit.missing_subpage_links), max_items)
    print_list("split_candidates:", sorted(audit.split_candidates), max_items)
    print_list("merge_candidates:", sorted(audit.merge_candidates), max_items)

    stale_items = [
        f"{page}: {', '.join(tokens)}"
        for page, tokens in sorted(audit.stale_pages.items())
    ]
    print_list("stale_route_signals:", stale_items, max_items)


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Audit docs areas for structure, discoverability, and stale-content signals. "
            "Use --pick to choose the next area to remediate."
        )
    )
    parser.add_argument("--area", help="Area name under docs/ (for example: waves)")
    parser.add_argument(
        "--pick",
        action="store_true",
        help="Pick the highest-priority area and print reasons",
    )
    parser.add_argument(
        "--max-items",
        type=int,
        default=12,
        help="Maximum list items per section in detailed output",
    )
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    repo_root = Path.cwd().resolve()
    docs_root = repo_root / "docs"
    if not docs_root.exists():
        print("ERROR: docs/ directory not found.", file=sys.stderr)
        return 1

    try:
        if args.area:
            audit = audit_area(repo_root, docs_root, args.area)
            print_detail(audit, max_items=max(1, args.max_items))
            return 0

        audits = audit_all_areas(repo_root, docs_root)
        if not audits:
            print("No docs areas found.")
            return 0

        if args.pick:
            print_pick(audits[0], max_items=max(1, args.max_items))
            return 0

        print_summary_table(audits)
        return 0
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
