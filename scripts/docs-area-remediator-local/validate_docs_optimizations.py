#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Sequence

from area_health import AreaAudit, audit_all_areas, audit_area, read_text

PAGE_FILENAMES = {"page.tsx", "page.ts", "page.jsx", "page.js"}
PAGE_EXTENSIONS = {".tsx", ".ts", ".jsx", ".js"}
PAGES_SPECIAL_BASENAMES = {"_app", "_document", "_error"}
SCOPE_PREFIXES = (
    "/",
    "/waves",
    "/messages",
    "/network",
    "/notifications",
    "/delegation",
    "/open-data",
    "/emma",
    "/tools",
    "/6529-gradient",
    "/discover",
    "/{param}",
)
DEFAULT_SCORES_FILE = ".codex/skills/docs-area-remediator/.state/quality-scores.json"
HEADING_RE = re.compile(r"^##\s+(.+?)\s*$")
ROUTE_TOKEN_RE = re.compile(r"`([^`\n]+)`")
IGNORED_DOCUMENTED_ROUTES = {"/{param}/rep"}


def run(args: Sequence[str], cwd: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, cwd=cwd, capture_output=True, text=True)


def changed_docs_areas(repo_root: Path, staged: bool) -> list[str]:
    cmd = ["git", "diff", "--name-only", "--", "docs"]
    if staged:
        cmd = ["git", "diff", "--cached", "--name-only", "--", "docs"]
    result = run(cmd, repo_root)
    if result.returncode != 0:
        return []

    areas: set[str] = set()
    for raw in result.stdout.splitlines():
        rel = raw.strip()
        if not rel:
            continue
        parts = Path(rel).parts
        # Only treat nested docs paths as area-scoped (docs/<area>/...).
        if len(parts) >= 3 and parts[0] == "docs":
            areas.add(parts[1])

    if staged or areas:
        return sorted(areas)

    untracked = run(
        ["git", "ls-files", "--others", "--exclude-standard", "--", "docs"],
        repo_root,
    )
    if untracked.returncode != 0:
        return sorted(areas)

    for raw in untracked.stdout.splitlines():
        rel = raw.strip()
        if not rel:
            continue
        parts = Path(rel).parts
        if len(parts) >= 3 and parts[0] == "docs":
            areas.add(parts[1])

    return sorted(areas)


def summarize(audit: AreaAudit, strict: bool) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    # DoD: hard requirements
    if audit.area_missing_headings:
        errors.append(
            f"area README missing headings: {', '.join(audit.area_missing_headings)}"
        )

    for rel, headings in sorted(audit.subarea_missing_headings.items()):
        errors.append(f"{rel} missing headings: {', '.join(headings)}")

    if audit.missing_area_links:
        errors.append(
            f"area README missing discoverability links for {len(audit.missing_area_links)} pages"
        )
    if audit.missing_subarea_links:
        errors.append(
            f"area README missing subarea links for {len(audit.missing_subarea_links)} subareas"
        )
    if audit.missing_subpage_links:
        errors.append(
            f"subarea README files missing links for {len(audit.missing_subpage_links)} pages"
        )

    if audit.duplicate_targets:
        errors.append(
            f"duplicate local link targets found in {len(audit.duplicate_targets)} README files"
        )

    if audit.feature_pages > 8 and audit.flow_pages == 0:
        errors.append("feature-heavy area has zero flow pages")
    if audit.feature_pages > 8 and audit.troubleshooting_pages == 0:
        errors.append("feature-heavy area has zero troubleshooting pages")

    if audit.stale_pages:
        errors.append(
            f"{len(audit.stale_pages)} pages have stale-route signals (code newer than docs)"
        )

    if audit.placeholder_count:
        msg = f"{audit.placeholder_count} placeholder lines remain in indexes"
        if strict:
            errors.append(msg)
        else:
            warnings.append(msg)

    # Advisory signals
    if audit.large_pages:
        warnings.append(f"{len(audit.large_pages)} large pages look under-split")
    if audit.merge_candidates:
        warnings.append(f"{len(audit.merge_candidates)} merge candidates detected")

    return errors, warnings


def print_detail(title: str, lines: list[str], limit: int) -> None:
    print(title)
    if not lines:
        print("- none")
        return

    shown = lines[:limit]
    for line in shown:
        print(f"- {line}")
    remaining = len(lines) - len(shown)
    if remaining > 0:
        print(f"- ... and {remaining} more")


def strip_query_outside_placeholders(token: str) -> str:
    curly_depth = 0
    square_depth = 0
    for idx, ch in enumerate(token):
        if ch == "{":
            curly_depth += 1
            continue
        if ch == "}" and curly_depth > 0:
            curly_depth -= 1
            continue
        if ch == "[":
            square_depth += 1
            continue
        if ch == "]" and square_depth > 0:
            square_depth -= 1
            continue
        if ch == "?" and curly_depth == 0 and square_depth == 0:
            return token[:idx]
    return token


def canonicalize_route(route: str) -> str | None:
    token = route.strip()
    if not token.startswith("/"):
        return None

    token = token.split("#", 1)[0]
    token = strip_query_outside_placeholders(token)
    token = token.strip()
    if not token:
        return None

    segments = [s for s in token.split("/") if s]
    normalized: list[str] = []
    for seg in segments:
        if seg.startswith("(") and seg.endswith(")"):
            continue
        if seg in {"*", "**"}:
            normalized.append("{param*}")
            continue
        if seg.startswith("<") and seg.endswith(">"):
            normalized.append("{param}")
            continue
        if seg.startswith(":"):
            normalized.append("{param}")
            continue
        if seg.startswith("[[...") and seg.endswith("]]"):
            normalized.append("{param*}")
            continue
        if seg.startswith("[...") and seg.endswith("]"):
            normalized.append("{param+}")
            continue
        if seg.startswith("[") and seg.endswith("]"):
            normalized.append("{param}")
            continue
        if seg.startswith("{") and seg.endswith("}"):
            inner = seg[1:-1].strip()
            if inner.endswith("?"):
                normalized.append("{param*}")
            else:
                normalized.append("{param}")
            continue
        normalized.append(seg)

    if not normalized:
        return "/"
    return "/" + "/".join(normalized)


def in_scope_route(route: str) -> bool:
    for prefix in SCOPE_PREFIXES:
        if route == prefix:
            return True
        if prefix != "/" and route.startswith(prefix + "/"):
            return True
    return False


def app_route_from_page_path(path: str) -> str | None:
    root = "app/"
    if not path.startswith(root):
        return None

    rel = path[len(root) :]
    segments = rel.split("/")
    if not segments:
        return None
    if segments[-1] not in PAGE_FILENAMES:
        return None

    route_segments_raw = segments[:-1]
    if not route_segments_raw:
        return "/"

    normalized: list[str] = []
    for index, seg in enumerate(route_segments_raw):
        if index == 0 and seg == "api":
            return None
        if seg.startswith("(") and seg.endswith(")"):
            continue
        if seg.startswith("@"):
            continue
        normalized_seg = canonicalize_route("/" + seg)
        if normalized_seg is None:
            continue
        normalized.append(normalized_seg.lstrip("/"))

    if not normalized:
        return "/"
    return "/" + "/".join(normalized)


def pages_route_from_page_path(path: str) -> str | None:
    root = "pages/"
    if not path.startswith(root):
        return None

    rel = path[len(root) :]
    if rel.startswith("api/"):
        return None

    rel_path = Path(rel)
    if rel_path.suffix not in PAGE_EXTENSIONS:
        return None

    without_ext = rel_path.with_suffix("")
    segments = list(without_ext.parts)
    if not segments:
        return None

    if segments[-1] in PAGES_SPECIAL_BASENAMES:
        return None

    if segments[-1] == "index":
        segments = segments[:-1]

    normalized: list[str] = []
    for seg in segments:
        normalized_seg = canonicalize_route("/" + seg)
        if normalized_seg is None:
            continue
        normalized.append(normalized_seg.lstrip("/"))

    if not normalized:
        return "/"
    return "/" + "/".join(normalized)


def route_from_page_path(path: str) -> str | None:
    route = app_route_from_page_path(path)
    if route:
        return route
    return pages_route_from_page_path(path)


def collect_app_routes(repo_root: Path) -> set[str]:
    routes: set[str] = set()

    app_dir = repo_root / "app"
    if app_dir.exists():
        for path in sorted(app_dir.rglob("*")):
            if not path.is_file() or path.name not in PAGE_FILENAMES:
                continue
            rel = str(path.relative_to(repo_root))
            route = route_from_page_path(rel)
            if route:
                routes.add(route)

    pages_dir = repo_root / "pages"
    if pages_dir.exists():
        for path in sorted(pages_dir.rglob("*")):
            if not path.is_file() or path.suffix not in PAGE_EXTENSIONS:
                continue
            rel = str(path.relative_to(repo_root))
            route = route_from_page_path(rel)
            if route:
                routes.add(route)

    return routes


def section_body(text: str, heading: str) -> str:
    lines = text.splitlines()
    in_section = False
    body: list[str] = []

    for line in lines:
        m = HEADING_RE.match(line)
        if m:
            current = m.group(1).strip()
            if in_section and current.lower() != heading.lower():
                break
            if current.lower() == heading.lower():
                in_section = True
                continue

        if in_section:
            body.append(line)

    return "\n".join(body)


def extract_route_tokens_for_ownership(text: str) -> list[str]:
    tokens: set[str] = set()
    for raw in ROUTE_TOKEN_RE.findall(text):
        token = raw.strip()
        if not token.startswith("/"):
            continue
        token = token.rstrip(".,:;)")
        if not token:
            continue
        tokens.add(token)
    return sorted(tokens)


def has_negative_route_context(line: str) -> bool:
    lowered = line.lower()
    if "unsupported" in lowered:
        return True
    if "not found" in lowered:
        return True
    if "does not redirect" in lowered:
        return True
    if "no " in lowered and "route" in lowered:
        return True
    return False


def extract_documented_route_tokens(text: str) -> list[str]:
    tokens: set[str] = set()
    for line in text.splitlines():
        if has_negative_route_context(line):
            continue
        for raw in extract_route_tokens_for_ownership(line):
            tokens.add(raw)
    return sorted(tokens)


def route_matches_pattern(route: str, pattern: str) -> bool:
    route_segments = [seg for seg in route.split("/") if seg]
    pattern_segments = [seg for seg in pattern.split("/") if seg]
    return route_segments_match(route_segments, pattern_segments)


def route_segments_match(route_segments: list[str], pattern_segments: list[str]) -> bool:
    if not pattern_segments:
        return not route_segments

    head = pattern_segments[0]
    tail = pattern_segments[1:]

    if head == "{param}":
        if not route_segments:
            return False
        return route_segments_match(route_segments[1:], tail)

    if head == "{param+}":
        if not route_segments:
            return False
        if not tail:
            return True
        for idx in range(1, len(route_segments) + 1):
            if route_segments_match(route_segments[idx:], tail):
                return True
        return False

    if head == "{param*}":
        if not tail:
            return True
        for idx in range(0, len(route_segments) + 1):
            if route_segments_match(route_segments[idx:], tail):
                return True
        return False

    if not route_segments:
        return False
    if route_segments[0] != head:
        return False
    return route_segments_match(route_segments[1:], tail)


def routes_overlap(route_a: str, route_b: str) -> bool:
    return route_matches_pattern(route_a, route_b) or route_matches_pattern(
        route_b, route_a
    )


def collect_docs_route_owners(docs_root: Path) -> tuple[dict[str, set[str]], set[str]]:
    owners: dict[str, set[str]] = {}
    all_documented_routes: set[str] = set()

    for path in sorted(docs_root.rglob("*.md")):
        is_root_readme = path == docs_root / "README.md"
        if path.name == "README.md" and not is_root_readme:
            continue

        text = read_text(path)
        if path.name != "README.md":
            for raw in extract_documented_route_tokens(text):
                normalized = canonicalize_route(raw)
                if normalized and normalized not in IGNORED_DOCUMENTED_ROUTES:
                    all_documented_routes.add(normalized)

        location = section_body(text, "Location in the Site")
        if not location:
            continue

        for raw in extract_route_tokens_for_ownership(location):
            normalized = canonicalize_route(raw)
            if not normalized:
                continue
            rel = str(path.relative_to(docs_root.parent))
            owners.setdefault(normalized, set()).add(rel)

    return owners, all_documented_routes


def route_ownership_report(repo_root: Path, docs_root: Path) -> tuple[list[str], list[str], list[str]]:
    app_routes = {route for route in collect_app_routes(repo_root) if in_scope_route(route)}
    owner_map, documented_routes = collect_docs_route_owners(docs_root)
    owner_routes = {route for route in owner_map if in_scope_route(route)}

    missing_owners = sorted(
        route
        for route in app_routes
        if not any(routes_overlap(route, owner_route) for owner_route in owner_routes)
    )
    orphan_owner_routes = sorted(
        route
        for route in owner_routes
        if not any(routes_overlap(route, app_route) for app_route in app_routes)
    )

    stale_doc_routes = sorted(
        route
        for route in documented_routes
        if in_scope_route(route)
        and not any(routes_overlap(route, app_route) for app_route in app_routes)
    )

    # If a route is stale but already captured as orphan owner route, avoid duplicate noise.
    stale_doc_routes = [route for route in stale_doc_routes if route not in orphan_owner_routes]
    return missing_owners, orphan_owner_routes, stale_doc_routes


def load_scores(path: Path) -> dict[str, int]:
    if not path.exists():
        return {}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}

    raw = payload.get("scores") if isinstance(payload, dict) else None
    if not isinstance(raw, dict):
        return {}

    scores: dict[str, int] = {}
    for key, value in raw.items():
        if isinstance(key, str) and isinstance(value, int):
            scores[key] = value
    return scores


def save_scores(path: Path, scores: dict[str, int]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "scores": {k: scores[k] for k in sorted(scores)},
    }
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Validate docs optimization passes against current code and IA constraints."
        )
    )
    parser.add_argument(
        "--area",
        action="append",
        default=[],
        help="Specific docs area to validate (repeatable).",
    )
    parser.add_argument(
        "--staged",
        action="store_true",
        help="Validate areas touched in staged docs changes.",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Validate all docs areas and run global ownership checks.",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Enable strict DoD enforcement (placeholder lines become errors).",
    )
    parser.add_argument(
        "--enforce-monotonic",
        action="store_true",
        help="Fail if any validated area score does not improve versus previous run.",
    )
    parser.add_argument(
        "--scores-file",
        default=DEFAULT_SCORES_FILE,
        help=f"Path to persisted quality scores (default: {DEFAULT_SCORES_FILE}).",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=10,
        help="Max details to print per section.",
    )
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    repo_root = Path.cwd().resolve()
    docs_root = repo_root / "docs"
    if not docs_root.exists():
        print("ERROR: docs/ directory not found.", file=sys.stderr)
        return 1

    audits: dict[str, AreaAudit] = {}
    if args.all:
        audits = {audit.area: audit for audit in audit_all_areas(repo_root, docs_root)}
    else:
        areas = sorted(set(args.area))
        if not areas:
            areas = changed_docs_areas(repo_root, staged=args.staged)

        areas = [area for area in areas if area and area != "README.md"]
        if not areas:
            mode = "staged docs changes" if args.staged else "docs changes"
            print(f"No areas found from {mode}.")
            return 0

        for area in areas:
            try:
                audits[area] = audit_area(repo_root, docs_root, area)
            except ValueError as exc:
                print(f"[{area}] ERROR: {exc}")
                return 1

    areas = sorted(audits.keys())
    if not areas:
        print("No docs areas found.")
        return 0

    total_errors = 0
    total_warnings = 0

    print("Docs Optimization Validator")
    print(f"Areas: {', '.join(areas)}")
    print(f"Strict mode: {'on' if args.strict else 'off'}")
    print("")

    for area in areas:
        audit = audits[area]
        errors, warnings = summarize(audit, strict=args.strict)
        total_errors += len(errors)
        total_warnings += len(warnings)

        print(f"[{area}]")
        print(
            f"- score={audit.score} pages={audit.total_pages} feature={audit.feature_pages} "
            f"flow={audit.flow_pages} troubleshooting={audit.troubleshooting_pages}"
        )
        print(f"- stale_pages={len(audit.stale_pages)}")
        print_detail("errors:", errors, max(1, args.limit))
        print_detail("warnings:", warnings, max(1, args.limit))

        stale_details = [
            f"{path}: {', '.join(tokens)}"
            for path, tokens in sorted(audit.stale_pages.items())
        ]
        if stale_details:
            print_detail("stale_route_signals:", stale_details, max(1, args.limit))
        print("")

    if args.all:
        missing_owners, orphan_owner_routes, stale_doc_routes = route_ownership_report(
            repo_root, docs_root
        )

        route_errors: list[str] = []
        if missing_owners:
            route_errors.append(
                f"{len(missing_owners)} in-scope app routes have no docs owner page"
            )
        if orphan_owner_routes:
            route_errors.append(
                f"{len(orphan_owner_routes)} docs owner routes are not present in app routes"
            )
        if stale_doc_routes:
            route_errors.append(
                f"{len(stale_doc_routes)} documented in-scope routes are not present in app routes"
            )

        if route_errors:
            print("[route-ownership]")
            print_detail("errors:", route_errors, max(1, args.limit))
            print_detail("missing_owner_routes:", missing_owners, max(1, args.limit))
            print_detail("orphan_owner_routes:", orphan_owner_routes, max(1, args.limit))
            print_detail("stale_documented_routes:", stale_doc_routes, max(1, args.limit))
            print("")
            total_errors += len(route_errors)

    if args.enforce_monotonic:
        scores_path = Path(args.scores_file)
        if not scores_path.is_absolute():
            scores_path = (repo_root / scores_path).resolve()

        previous_scores = load_scores(scores_path)
        monotonic_errors: list[str] = []
        monotonic_stable: list[str] = []
        for area in areas:
            prev = previous_scores.get(area)
            current = audits[area].score
            if prev is None:
                continue
            if current > prev:
                monotonic_errors.append(
                    f"{area}: score regressed from {prev} to {current}"
                )
            elif current == prev:
                monotonic_stable.append(
                    f"{area}: score unchanged (still {current})"
                )

        if monotonic_errors:
            print("[monotonic-quality]")
            print_detail("errors:", monotonic_errors, max(1, args.limit))
            print("")
            total_errors += len(monotonic_errors)
        else:
            if monotonic_stable:
                print("[monotonic-quality]")
                print_detail("stable:", monotonic_stable, max(1, args.limit))
                print("")
            for area in areas:
                previous_scores[area] = audits[area].score
            save_scores(scores_path, previous_scores)
            print(f"Monotonic quality: PASS (scores updated at {scores_path})")
            print("")

    if total_errors > 0:
        print(f"Result: FAIL ({total_errors} errors, {total_warnings} warnings)")
        return 1

    print(f"Result: PASS ({total_warnings} warnings)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
