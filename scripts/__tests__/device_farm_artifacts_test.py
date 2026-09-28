"""Offline tests for result preservation and independent artifact downloads."""

import http.client
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import urllib.error

spec = importlib.util.spec_from_file_location(
    "device_farm_artifacts", Path(__file__).parents[1] / "device-farm-artifacts.py"
)
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)


class Response(io.BytesIO):
    def __init__(self, content, length=None):
        super().__init__(content)
        self.headers = {"Content-Length": str(len(content) if length is None else length)}


class ArtifactTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.folder = self.root / "artifacts"
        self.output = self.root / "output"

    def test_connection_reset_retries_only_the_download_and_atomically_replaces_partial_file(self):
        destination = self.root / "Customer Artifacts.zip"
        with patch.object(collector.urllib.request, "urlopen", side_effect=[
            ConnectionResetError("reset"), Response(b"partial", length=100), Response(b"complete")
        ]) as request:
            collector.download("https://example.test/artifact", destination)
        self.assertEqual(request.call_count, 3)
        self.assertEqual(destination.read_bytes(), b"complete")
        self.assertFalse(destination.with_suffix(".zip.part").exists())

    def test_exhausted_download_leaves_no_partial_success(self):
        destination = self.root / "result.zip"
        for error in [TimeoutError("timeout"), http.client.IncompleteRead(b"partial")]:
            with patch.object(collector.urllib.request, "urlopen", side_effect=error) as request:
                with self.assertRaises(type(error)):
                    collector.download("https://example.test/artifact", destination)
            self.assertEqual(request.call_count, 3)
            self.assertFalse(destination.exists())
            self.assertFalse(destination.with_suffix(".zip.part").exists())

    def test_permanent_http_errors_and_insecure_urls_are_not_retried(self):
        error = urllib.error.HTTPError("https://example.test", 403, "denied", {}, None)
        with patch.object(collector.urllib.request, "urlopen", side_effect=error) as request:
            with self.assertRaises(urllib.error.HTTPError):
                collector.download("https://example.test", self.root / "result")
            self.assertEqual(request.call_count, 1)
            with self.assertRaises(ValueError):
                collector.download("http://example.test", self.root / "result")
            self.assertEqual(request.call_count, 1)

    def fake_aws(self, operation, **parameters):
        if operation == "get-run":
            return {"run": {"arn": "run", "name": "smoke", "status": "COMPLETED", "result": "FAILED", "totalJobs": 2}}
        if operation == "list-jobs":
            return {"jobs": [{"arn": f"job/{i}", "name": "Same phone", "result": "FAILED"} for i in range(2)]}
        self.assertEqual(operation, "list-artifacts")
        if parameters["type"] != "FILE":
            return {"artifacts": []}
        return {"artifacts": [
            {"name": "Video", "extension": "mp4", "url": "https://example.test/broken?secret"},
            {"name": "Customer Artifacts", "extension": "zip", "url": "https://example.test/evidence"},
        ]}

    def test_one_broken_video_preserves_verdict_and_other_devices_evidence(self):
        def fetch(url, destination):
            # The identity/result must already be durable when downloading starts.
            self.assertEqual(json.loads((self.folder / "run.json").read_text())["result"], "FAILED")
            self.assertIn("expected-devices=2", self.output.read_text())
            if "broken" in url:
                raise ConnectionResetError("URL with secret must not be logged")
            destination.write_bytes(b"evidence")

        with patch.object(collector, "aws", side_effect=self.fake_aws), patch.object(collector, "download", side_effect=fetch), patch("sys.stdout", new_callable=io.StringIO) as log:
            self.assertFalse(collector.collect("run", self.folder, self.output))
        self.assertEqual(len(list(self.folder.rglob("*Customer Artifacts.zip"))), 2)
        errors = (self.folder / "collection-errors.json").read_text()
        self.assertEqual(len(json.loads(errors)), 2)
        self.assertNotIn("secret", errors + log.getvalue())
        self.assertNotIn("https://", errors + log.getvalue())

    def test_failed_test_result_is_preserved_even_when_all_downloads_succeed(self):
        with patch.object(collector, "aws", side_effect=self.fake_aws), patch.object(collector, "download"):
            self.assertTrue(collector.collect("run", self.folder, self.output))
        self.assertIn("result=FAILED", self.output.read_text())

    def test_recovery_rejects_invalid_identity_before_reading_aws(self):
        for arn in ["", "--endpoint-url=https://example.test", "arn:aws:devicefarm:us-east-1:123456789012:run:abc/def"]:
            with patch.dict(collector.os.environ, {"RUN_ARN": arn}), patch.object(collector, "aws") as aws, patch("sys.stdout", new_callable=io.StringIO):
                self.assertEqual(collector.main(), 1)
            aws.assert_not_called()

    def test_running_run_is_not_polled_or_retried(self):
        with patch.object(collector, "aws", return_value={"run": {"status": "RUNNING"}}) as aws:
            with self.assertRaisesRegex(ValueError, "completed"):
                collector.collect("run", self.folder, self.output)
        aws.assert_called_once_with("get-run", arn="run")

    def test_artifact_listing_failure_does_not_prevent_other_devices_collection(self):
        def api(operation, **parameters):
            if operation == "list-artifacts" and parameters["arn"] == "job/0":
                raise ValueError("invalid API response")
            return self.fake_aws(operation, **parameters)
        with patch.object(collector, "aws", side_effect=api), patch.object(collector, "download") as download:
            self.assertFalse(collector.collect("run", self.folder, self.output))
        self.assertEqual(download.call_count, 2)

    def test_artifact_names_cannot_escape_the_output_directory(self):
        self.assertEqual(collector.safe_name("../../secret\n"), "_.._secret_")
        self.assertEqual(collector.safe_name(".."), "unnamed")


if __name__ == "__main__":
    unittest.main()
