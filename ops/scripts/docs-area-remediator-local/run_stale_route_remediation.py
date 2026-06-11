#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import subprocess
from pathlib import Path
from typing import Sequence


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    """Parse CLI arguments for stale-route remediation."""
    parser = argparse.ArgumentParser(
        description=(
            "Run docs stale-route remediation for a docs area using Codex skill prompts."
        )
    )
    parser.add_argument("--area", required=True, help="Docs area name under ops/docs/")
    parser.add_argument(
        "--target",
        help=(
            "Target docs file used for scope framing "
            "(default: ops/docs/<area>/README.md)"
        ),
    )
    return parser.parse_args(argv)


def run_codex(repo_root: Path, instruction: str) -> int:
    """Run Codex with a remediation instruction from the repo root."""
    result = subprocess.run(["codex", "exec", "--", instruction], cwd=repo_root)
    return result.returncode


def main(argv: Sequence[str] | None = None) -> int:
    """Run primary and second-view remediation passes for a docs area."""
    args = parse_args(argv)
    repo_root = Path.cwd().resolve()
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", args.area):
        print(f"ERROR: invalid docs area: {args.area}")
        return 1

    area_dir = repo_root / "ops" / "docs" / args.area
    if not area_dir.exists() or not area_dir.is_dir():
        print(f"ERROR: docs area not found: ops/docs/{args.area}")
        return 1

    target_path = args.target or f"ops/docs/{args.area}/README.md"
    instructions = [
        (
            "primary",
            "\n".join(
                [
                    "Use $docs-area-remediator.",
                    f"Target file: {target_path}",
                    "Run in strict stateless mode: do not rely on previous or next iterations.",
                    f"Validator reported stale-route signals for ops/docs/{args.area}.",
                    "Resolve stale-route signals by updating docs to match current user-facing code routes and behavior.",
                    "Keep scope local to this docs area and its index files.",
                ]
            ),
        ),
        (
            "second-view",
            "\n".join(
                [
                    "Use $docs-area-remediator.",
                    f"Target file: {target_path}",
                    "Run in strict stateless mode: do not rely on previous or next iterations.",
                    f"Perform a second-view stale-route cleanup pass for ops/docs/{args.area}.",
                    "Ensure route references and discoverability links stay coherent after edits.",
                ]
            ),
        ),
    ]

    for index, (label, instruction) in enumerate(instructions, start=1):
        print(
            f"[stale-route-remediator] running {label} pass "
            f"({index}/{len(instructions)})"
        )
        code = run_codex(repo_root, instruction)
        if code != 0:
            return code

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
