"""Offline contract checks for nested Device Farm result artifacts."""

import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location(
    "device_farm_report", Path(__file__).parents[1] / "device-farm-report.py"
)
report = importlib.util.module_from_spec(spec)
spec.loader.exec_module(report)


class DeviceFarmReportTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.folder = Path(self.directory.name)

    def result(self, **overrides):
        return dict(schemaVersion=1, outcome="passed", total=7, passes=7,
                    pending=0, notRun=0, retries=0, failures=[], **overrides)

    def archive(self, device, result):
        file = self.folder / device / "Tests Suite/Tests/00004-Customer Artifacts.zip"
        file.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(file, "w") as bundle:
            bundle.writestr("logs/devicefarm-result.json", json.dumps(result))

    def test_all_devices_must_pass_with_a_passing_farm_verdict(self):
        self.archive("iPhone 16", self.result())
        self.archive("iPhone SE", self.result())
        summary, passed = report.summarize(self.folder, "PASSED", "ios-safari", 2)
        self.assertTrue(passed)
        self.assertIn("iPhone 16", summary)
        self.assertIn("7 / 7", summary)
        for verdict in ["FAILED", "ERRORED", "STOPPED", "", "WARNED"]:
            self.assertFalse(report.summarize(self.folder, verdict, "ios-safari", 2)[1])

    def test_partial_or_unverifiable_device_counts_cannot_pass(self):
        self.archive("iPhone 16", self.result())
        for count in [2, "", "None", 0, "1x", -1]:
            self.assertFalse(report.summarize(self.folder, "PASSED", "ios-safari", count)[1])

    def test_missing_malformed_and_empty_evidence_never_pass(self):
        self.assertFalse(report.summarize(self.folder, "PASSED", "ios-safari", 2)[1])
        for result in [{}, [], {"schemaVersion": 2}, {**self.result(), "total": "7"}]:
            self.archive("iPhone 16", result)
            summary, passed = report.summarize(self.folder, "PASSED", "ios-safari", 2)
            self.assertFalse(passed)
            self.assertIn("Evidence unavailable", summary)

    def test_one_missing_device_report_does_not_get_hidden_by_another_pass(self):
        self.archive("iPhone SE", self.result())
        self.archive("iPhone 16", {})
        self.assertFalse(report.summarize(self.folder, "PASSED", "ios-safari", 2)[1])

    def test_retries_skips_and_failures_do_not_count_as_clean_runs(self):
        for change in [
            {"outcome": "passed-after-retry", "retries": 1},
            {"outcome": "tests-not-run", "passes": 0, "notRun": 7},
            {"outcome": "infrastructure-failure", "passes": 0, "notRun": 7},
            {"outcome": "test-failure", "passes": 6},
            {"pending": 1}, {"total": 0, "passes": 0},
            {"failures": [{"kind": "test-failure"}]},
        ]:
            self.archive("iPhone 16", {**self.result(), **change})
            self.assertFalse(report.summarize(self.folder, "PASSED", "ios-safari", 1)[1])


if __name__ == "__main__":
    unittest.main()
