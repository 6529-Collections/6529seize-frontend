#!/usr/bin/env python3
"""Collect a completed Device Farm run without scheduling or retrying tests."""

import http.client
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.request


def aws(operation, **parameters):
    command = ["aws", "devicefarm", operation, "--region", "us-west-2", "--output", "json"]
    for key, value in parameters.items():
        command.extend(["--" + key, value])
    # The AWS CLI paginates list calls; never truncate the device/artifact set.
    return json.loads(subprocess.check_output(command, text=True))


def safe_name(value):
    return re.sub(r"[^a-zA-Z0-9 ._-]", "_", value).strip(" .")[:160] or "unnamed"


def download(url, destination):
    if not url.startswith("https://"):
        raise ValueError("artifact URL must use HTTPS")
    temporary = destination.with_suffix(destination.suffix + ".part")
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=60) as response, temporary.open("wb") as output:
                shutil.copyfileobj(response, output)
                length = response.headers.get("Content-Length")
                if length is not None and output.tell() != int(length):
                    raise ConnectionError("incomplete artifact download")
            temporary.replace(destination)
            return
        except (OSError, http.client.HTTPException) as error:
            temporary.unlink(missing_ok=True)
            if isinstance(error, urllib.error.HTTPError) and error.code not in (408, 429) and error.code < 500:
                raise
            if attempt == 2:
                raise


def collect_job(job, folder):
    # Include job identity so devices with the same display name cannot collide.
    device = folder / (safe_name(job["name"]) + "-" + safe_name(job["arn"].split("/")[-1]))
    errors = []
    for kind in ("FILE", "LOG", "SCREENSHOT"):
        try:
            artifacts = aws("list-artifacts", arn=job["arn"], type=kind)["artifacts"]
        except (subprocess.CalledProcessError, ValueError, KeyError):
            errors.append({"device": device.name, "type": kind, "error": "artifact listing failed"})
            continue
        for index, artifact in enumerate(artifacts):
            name = f"{index:05d}-{safe_name(artifact['name'])}.{safe_name(artifact['extension'])}"
            destination = device / kind / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            try:
                download(artifact["url"], destination)
            except (OSError, http.client.HTTPException, ValueError):
                # Never print presigned URLs or exception text containing them.
                errors.append({"device": device.name, "artifact": name, "error": "download failed"})
                print(f"::error::Could not download {device.name}/{name}; other artifacts are preserved.")
    return errors


def collect(run_arn, folder, output_file):
    folder.mkdir(parents=True, exist_ok=True)
    run = aws("get-run", arn=run_arn)["run"]
    # Persist identity and verdict BEFORE any potentially failing downloads.
    metadata = {key: run.get(key) for key in ("arn", "name", "status", "result", "totalJobs")}
    (folder / "run.json").write_text(json.dumps(metadata, indent=2) + "\n")
    with output_file.open("a") as output:
        output.write(f"result={run.get('result', '')}\nexpected-devices={run.get('totalJobs', '')}\n")
    if run.get("status") != "COMPLETED":
        raise ValueError("only completed runs can be collected")
    jobs = aws("list-jobs", arn=run_arn)["jobs"]
    (folder / "jobs.json").write_text(json.dumps([
        {key: job.get(key) for key in ("arn", "name", "result", "message")}
        for job in jobs
    ], indent=2) + "\n")
    errors = []
    if len(jobs) != run.get("totalJobs") or not jobs:
        errors.append({"error": "device job count incomplete"})
    for job in jobs:
        errors.extend(collect_job(job, folder))
    (folder / "collection-errors.json").write_text(json.dumps(errors, indent=2) + "\n")
    return not errors


def main():
    try:
        run_arn = os.environ["RUN_ARN"]
        if not re.fullmatch(r"arn:aws:devicefarm:us-west-2:[0-9]{12}:run:[a-f0-9-]+/[a-f0-9-]+", run_arn):
            raise ValueError("expected a Device Farm run ARN in us-west-2")
        ok = collect(run_arn, Path(os.environ["ARTIFACT_FOLDER"]), Path(os.environ["GITHUB_OUTPUT"]))
        return 0 if ok else 1
    except (OSError, ValueError, KeyError, subprocess.CalledProcessError):
        print("::error::Device Farm evidence collection failed; retained metadata/artifacts remain available.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
