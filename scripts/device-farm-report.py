#!/usr/bin/env python3
"""Summarize device-side evidence without replacing Device Farm's verdict."""

import json
import os
from pathlib import Path
import sys
import zipfile


def read_device_results(folder):
    results = []
    for archive in sorted(Path(folder).rglob("*Customer Artifacts.zip")):
        device = archive.relative_to(folder).parts[0]
        try:
            with zipfile.ZipFile(archive) as bundle:
                names = [n for n in bundle.namelist() if n.endswith("/devicefarm-result.json") or n == "devicefarm-result.json"]
                if len(names) != 1:
                    raise ValueError("expected one device result")
                if bundle.getinfo(names[0]).file_size > 1024 * 1024:
                    raise ValueError("device result exceeds size limit")
                result = json.loads(bundle.read(names[0]))
                counts = [result[key] for key in ("total", "passes", "pending", "notRun", "retries")]
                if (result["schemaVersion"] != 1
                        or not isinstance(result["outcome"], str)
                        or not isinstance(result["failures"], list)
                        or any(type(n) is not int or n < 0 for n in counts)):
                    raise ValueError("invalid device result schema")
                results.append((device, result, None))
        except (OSError, zipfile.BadZipFile):
            results.append((device, None, "archive unreadable"))
        except (ValueError, KeyError, TypeError):
            results.append((device, None, "result missing or invalid"))
    return results


def clean_pass(result):
    return bool(result and result["outcome"] == "passed"
                and result["total"] > 0 and result["passes"] == result["total"]
                and result["pending"] == 0 and result["notRun"] == 0
                and result["retries"] == 0 and result.get("failures") == [])


def summarize(folder, farm_result, platform, expected_devices):
    results = read_device_results(folder) if folder else []
    count = int(expected_devices) if str(expected_devices).isascii() and str(expected_devices).isdigit() else 0
    complete = count > 0 and len(results) == count and len({device for device, _, _ in results}) == count
    lines = [f"### Mobile web smoke ({platform})", "",
             f"Device Farm result: `{farm_result or 'unavailable'}`", "",
             f"Device reports: {len(results)} / {count or 'unknown'} expected", "",
             "| Device | Diagnosis | Passed / selected | Not run / pending | Retries |",
             "| --- | --- | --- | --- | --- |"]
    for device, result, evidence_error in results:
        # Device names are artifact directory names, never Markdown instructions.
        device = device.replace("|", " ").replace("\n", " ").replace("\r", " ")
        if result is None:
            lines.append(f"| {device} | Evidence unavailable ({evidence_error}); tests not verified | — | — | — |")
            continue
        outcome = result.get("outcome", "unknown")
        allowed = {"passed", "passed-after-retry", "tests-not-run", "infrastructure-failure", "test-failure"}
        if outcome not in allowed:
            outcome = "unknown"
        kinds = sorted({failure.get("kind") for failure in result["failures"]
                        if isinstance(failure, dict)
                        and failure.get("kind") in {"safari-session-startup", "device-connectivity", "test-failure"}})
        if kinds:
            outcome += " (" + ", ".join(kinds) + ")"
        lines.append(f"| {device} | {outcome} | {result['passes']} / {result['total']} | {result['notRun']} / {result['pending']} | {result['retries']} |")
    if not results:
        lines.append("\nDevice evidence unavailable: tests are not verified. Inspect setup and artifact collection logs.")
    lines.append("\nInfrastructure failures and missing evidence are not app-regression verdicts or passes.")
    if not complete:
        lines.append("\nDevice report count is incomplete or unverifiable; this run is not a clean pass.")
    passed = farm_result == "PASSED" and complete and all(clean_pass(r) for _, r, _ in results)
    return "\n".join(lines) + "\n", passed


if __name__ == "__main__":
    summary, passed = summarize(os.environ.get("ARTIFACT_FOLDER", ""),
                                os.environ.get("RUN_RESULT", ""),
                                os.environ.get("PLATFORM", "unknown"),
                                os.environ.get("EXPECTED_DEVICES", ""))
    with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as output:
        output.write(summary)
    if not passed:
        print("::error::Device Farm QA failed, required recovery, or lacks complete test evidence. See the device summary.")
    sys.exit(0 if passed else 1)
