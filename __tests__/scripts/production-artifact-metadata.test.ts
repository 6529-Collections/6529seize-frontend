import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import YAML from "yaml";

const readWorkflow = (name: string) =>
  YAML.parse(
    fs.readFileSync(path.join(process.cwd(), ".github/workflows", name), "utf8")
  );
const metadata = readWorkflow("production-artifact-metadata.yml");
const deployment = readWorkflow("build-upload-deploy-prod.yml");
const sha = "a1".repeat(20);
const digest = `sha256:${"b1".repeat(32)}`;
const artifact = () => ({
  id: 123,
  name: `production-frontend-${sha}-456`,
  digest,
  expired: false,
  created_at: "2026-09-03T12:05:00Z",
  workflow_run: { id: 456, head_branch: "main", head_sha: sha },
});
const builder = () => ({
  name: "Build exact production artifact / Build exact production artifact",
  run_id: 456,
  run_attempt: 1,
  head_sha: sha,
  status: "completed",
  conclusion: "success",
  started_at: "2026-09-03T12:00:00Z",
  completed_at: "2026-09-03T12:06:00Z",
});

function resolve({
  artifacts = [artifact()],
  jobs = [builder()],
  attempt = "1",
  ref = "refs/heads/main",
}: {
  artifacts?: ReturnType<typeof artifact>[];
  jobs?: ReturnType<typeof builder>[];
  attempt?: string;
  ref?: string;
} = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "production-metadata-"));
  try {
    fs.writeFileSync(
      path.join(root, "artifacts.json"),
      JSON.stringify(artifacts)
    );
    fs.writeFileSync(path.join(root, "jobs.json"), JSON.stringify(jobs));
    fs.writeFileSync(
      path.join(root, "gh"),
      `#!/usr/bin/env bash
set -euo pipefail
case "$*" in
  *"/456/artifacts?per_page=100"*) cat "$RUNNER_TEMP/artifacts.json" ;;
  *"/456/jobs?filter=all&per_page=100"*) cat "$RUNNER_TEMP/jobs.json" ;;
  *) exit 2 ;;
esac
`,
      { mode: 0o755 }
    );
    const output = path.join(root, "output");
    const result = spawnSync(
      "bash",
      ["-c", metadata.jobs.resolve.steps[0].run],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${root}:${process.env["PATH"]}`,
          RUNNER_TEMP: root,
          GITHUB_OUTPUT: output,
          GITHUB_REF: ref,
          GITHUB_SHA: sha,
          GITHUB_RUN_ID: "456",
          GITHUB_RUN_ATTEMPT: attempt,
          GITHUB_REPOSITORY: "6529-Collections/6529seize-frontend",
        },
      }
    );
    return {
      status: result.status,
      stderr: result.stderr,
      output: fs.existsSync(output) ? fs.readFileSync(output, "utf8") : "",
    };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

describe("production artifact metadata without build secrets", () => {
  it("does not depend on outputs redacted by the secret-bearing builder", () => {
    expect(metadata.on.workflow_call.secrets).toBeUndefined();
    expect(metadata.permissions).toEqual({ actions: "read" });
    expect(JSON.stringify(metadata.jobs)).not.toContain("${{ secrets.");
    expect(
      deployment.jobs["resolve-production-artifact"].secrets
    ).toBeUndefined();
    expect(deployment.jobs["resolve-production-artifact"].permissions).toEqual({
      actions: "read",
    });
    expect(JSON.stringify(deployment.jobs)).not.toContain(
      "needs.build-production-artifact.outputs."
    );
    expect(deployment.jobs["verify-production-artifact"].needs).toBe(
      "resolve-production-artifact"
    );
    const result = resolve();
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(result.output).toBe(
      `artifact_id=123\nartifact_digest=${digest}\nproducer_run_attempt=1\n`
    );
  });

  it("retains the successful producer attempt when only failed jobs rerun", () => {
    const result = resolve({ attempt: "2" });
    expect(result.status).toBe(0);
    expect(result.output).toContain("producer_run_attempt=1\n");
  });

  it("uses the builder that uploaded the selected artifact across attempts", () => {
    const earlier = {
      ...builder(),
      started_at: "2026-09-03T11:00:00Z",
      completed_at: "2026-09-03T11:06:00Z",
    };
    const result = resolve({
      attempt: "2",
      jobs: [earlier, { ...builder(), run_attempt: 2 }],
    });
    expect(result.status).toBe(0);
    expect(result.output).toContain("producer_run_attempt=2\n");
  });

  it.each([
    ["missing artifact", { artifacts: [] }],
    ["duplicate artifact", { artifacts: [artifact(), artifact()] }],
    ["expired artifact", { artifacts: [{ ...artifact(), expired: true }] }],
    ["invalid digest", { artifacts: [{ ...artifact(), digest: "invalid" }] }],
    [
      "wrong source",
      {
        artifacts: [
          {
            ...artifact(),
            workflow_run: {
              ...artifact().workflow_run,
              head_sha: "c".repeat(40),
            },
          },
        ],
      },
    ],
    [
      "wrong run",
      {
        artifacts: [
          {
            ...artifact(),
            workflow_run: { ...artifact().workflow_run, id: 789 },
          },
        ],
      },
    ],
    ["missing builder", { jobs: [] }],
    ["failed builder", { jobs: [{ ...builder(), conclusion: "failure" }] }],
    ["duplicate builder", { jobs: [builder(), builder()] }],
    ["future builder attempt", { jobs: [{ ...builder(), run_attempt: 2 }] }],
    [
      "artifact outside builder lifetime",
      { jobs: [{ ...builder(), completed_at: "2026-09-03T12:04:00Z" }] },
    ],
    ["non-main caller", { ref: "refs/heads/feature" }],
  ])("rejects %s before publishing metadata", (_name, options) => {
    const result = resolve(options);
    expect(result.status).not.toBe(0);
    expect(result.output).toBe("");
  });
});
