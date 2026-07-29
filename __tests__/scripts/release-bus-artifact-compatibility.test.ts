import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import YAML from "yaml";

const ROOT = process.cwd();
const EXPECTED_SHA = "a".repeat(40);
const TRAIN_ID = "compatibility-train";

type WorkflowStep = {
  name?: string;
  run?: string;
  uses?: string;
};

const LEGACY_PREFLIGHT_INPUT_CONTRACT_V0 = Object.freeze({
  release_train_id: { type: "string", required: true },
  release_train_revision: { type: "string", required: true },
  operation_key: { type: "string", required: true },
  source_ref: { type: "string", required: true },
  expected_sha: { type: "string", required: true },
  deploy_units: { type: "string", required: true },
  artifact_environment: {
    type: "choice",
    required: true,
    options: ["staging", "production"],
  },
  reuse_artifact_run_id: {
    type: "string",
    required: false,
    default: "",
  },
  reuse_artifact_name: { type: "string", required: false, default: "" },
  reuse_artifact_digest: { type: "string", required: false, default: "" },
});

function readWorkflow(name: string) {
  return YAML.parse(
    fs.readFileSync(path.join(ROOT, ".github", "workflows", name), "utf8")
  );
}

function modelWorkflowDispatch(
  workflow: any,
  supplied: Record<string, string>
) {
  const inputs = workflow.on.workflow_dispatch.inputs as Record<
    string,
    { required?: boolean; default?: string; options?: string[] }
  >;
  const unsupported = Object.keys(supplied)
    .filter((key) => !Object.prototype.hasOwnProperty.call(inputs, key))
    .sort();
  if (unsupported.length > 0) {
    return { accepted: false, unsupported, resolved: {} };
  }
  const resolved: Record<string, string> = {};
  for (const [key, contract] of Object.entries(inputs)) {
    const value = supplied[key] ?? contract.default;
    if (contract.required && (value === undefined || value === "")) {
      return { accepted: false, unsupported: [], resolved: {} };
    }
    if (
      value !== undefined &&
      contract.options &&
      !contract.options.includes(value)
    ) {
      return { accepted: false, unsupported: [], resolved: {} };
    }
    resolved[key] = value ?? "";
  }
  return { accepted: true, unsupported: [], resolved };
}

function findStep(workflow: any, job: string, name: string): WorkflowStep {
  const step = workflow.jobs[job].steps.find(
    (candidate: WorkflowStep) => candidate.name === name
  );
  if (!step?.run) {
    throw new Error(`Missing executable workflow step: ${job}/${name}`);
  }
  return step;
}

function runShell(
  source: string,
  {
    cwd = ROOT,
    env = {},
  }: { cwd?: string; env?: Record<string, string | undefined> } = {}
) {
  return spawnSync("bash", ["-c", source], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env } as NodeJS.ProcessEnv,
    timeout: 20_000,
  });
}

function sha256(value: string | Buffer) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function writeArtifact(
  root: string,
  environment: "staging" | "production",
  schema: 2 | 3,
  overrides: Record<string, unknown> = {}
) {
  const artifactRoot = path.join(root, "release-bus-artifact");
  fs.mkdirSync(artifactRoot, { recursive: true });
  const files = new Map<string, Buffer>();
  let manifest: Record<string, unknown>;
  if (schema === 2) {
    const staging = Buffer.from("staging-package");
    const production = Buffer.from("production-package");
    files.set("profiles/staging/target/package.zip", staging);
    files.set("profiles/production/target/package.zip", production);
    manifest = {
      schema_version: 2,
      repository: "frontend",
      train_id: TRAIN_ID,
      source_sha: EXPECTED_SHA,
      environment: "dual",
      profiles: {
        staging: { package_sha256: sha256(staging) },
        production: { package_sha256: sha256(production) },
      },
      ...overrides,
    };
  } else {
    const packageBytes = Buffer.from(`${environment}-v3-package`);
    files.set("target/package.zip", packageBytes);
    manifest = {
      schema_version: 3,
      artifact_contract: "environment-bound-v1",
      artifact_contract_version: "environment-bound-v3",
      repository: "frontend",
      train_id: TRAIN_ID,
      source_sha: EXPECTED_SHA,
      environment,
      source_evidence_reused: true,
      artifact_bytes_reused: false,
      package_sha256: sha256(packageBytes),
      ...overrides,
    };
  }
  files.set("manifest.json", Buffer.from(JSON.stringify(manifest)));
  for (const [relativePath, bytes] of files) {
    const destination = path.join(artifactRoot, relativePath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, bytes);
  }
  const checksumLines = [...files.entries()]
    .sort(([left], [right]) =>
      Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
    )
    .map(([relativePath, bytes]) => `${sha256(bytes)}  ./${relativePath}\n`)
    .join("");
  fs.writeFileSync(path.join(artifactRoot, "SHA256SUMS"), checksumLines);
  return sha256(checksumLines);
}

function deployEnv(
  environment: "staging" | "production",
  artifactDigest: string,
  contract: "legacy-v2" | "environment-bound-v3"
) {
  return {
    ARTIFACT_CONTRACT_VERSION: contract,
    ARTIFACT_ENVIRONMENT: environment,
    ARTIFACT_RUN_ID: "1234",
    ARTIFACT_TRAIN_ID: TRAIN_ID,
    EXPECTED_ARTIFACT_DIGEST: artifactDigest,
    EXPECTED_SHA,
    GITHUB_OUTPUT: path.join(os.tmpdir(), `compat-output-${process.pid}`),
    OPERATION_KEY: "rb2:compatibility:a1",
    RELEASE_CONTRIBUTORS: "[]",
    SOURCE_REF: "release-bus-v2/compatibility",
    TRAIN_ID,
    TRAIN_REVISION: "1",
  };
}

function createStrictEvidence(root: string, mergeSha: string) {
  const evidenceRoot = path.join(root, "evidence-source");
  fs.mkdirSync(evidenceRoot);
  const policyBundle = `file\ta.cjs\t${"c".repeat(40)}\n`;
  const manifest = JSON.stringify({
    schema_version: 1,
    evidence_contract: "exact-merge-tree-pr-ci-v1",
    repository: "frontend",
    event: "pull_request",
    workflow: ".github/workflows/app-pr-ci.yml",
    merge_sha: mergeSha,
    head_sha: "e".repeat(40),
    production_build_required: true,
    policy_bundle_contract: "pr-ci-policy-bundle-v1",
    policy_bundle_digest: sha256(policyBundle),
    policy_bundle_line_count: 1,
    required_gates: [
      "package-manager-discipline",
      "dependency-analysis",
      "reviewbot-contract",
      "generated-agent-files",
      "release-bus-workflow-contract",
      "changed-lint",
      "changed-typecheck",
      "test-typecheck",
      "related-jest-selection",
      "production-build-or-plan-not-required",
      "pr-ci-policy-bundle",
    ],
  });
  fs.writeFileSync(path.join(evidenceRoot, "manifest.json"), manifest);
  fs.writeFileSync(path.join(evidenceRoot, "policy-bundle.txt"), policyBundle);
  fs.writeFileSync(
    path.join(evidenceRoot, "SHA256SUMS"),
    `${sha256(manifest)}  ./manifest.json\n${sha256(
      policyBundle
    )}  ./policy-bundle.txt\n`
  );
  return evidenceRoot;
}

function createMockGh(root: string) {
  const bin = path.join(root, "bin");
  fs.mkdirSync(bin);
  const executable = path.join(bin, "gh");
  fs.writeFileSync(
    executable,
    `#!/usr/bin/env bash
set -euo pipefail
if [ -n "\${MOCK_GH_INVOCATIONS:-}" ]; then
  printf '%s\\n' "$*" >> "$MOCK_GH_INVOCATIONS"
fi
if [ "\${MOCK_GH_FAILURE:-}" = transport ]; then
  echo 'HTTP 503 Service Unavailable' >&2
  exit 1
fi
if [ "\${MOCK_GH_FAILURE:-}" = missing ]; then
  echo 'HTTP 404 Not Found' >&2
  exit 1
fi
if [ "$1" = api ] && [[ "$2" == *"/artifacts?name="* ]]; then
  printf '{"artifacts":[{"expired":false,"name":"%s","digest":"sha256:%s"}]}\n' "$MOCK_ARTIFACT_NAME" "$MOCK_ARTIFACT_DIGEST"
elif [ "$1" = api ]; then
  printf '{"event":"pull_request","conclusion":"success","head_sha":"%s","path":".github/workflows/app-pr-ci.yml"}\n' "$MOCK_HEAD_SHA"
elif [ "$1" = run ] && [ "$2" = download ]; then
  destination=""
  while [ "$#" -gt 0 ]; do
    if [ "$1" = --dir ]; then destination="$2"; break; fi
    shift
  done
  test -n "$destination"
  mkdir -p "$destination"
  cp "$MOCK_EVIDENCE_SOURCE"/* "$destination/"
else
  exit 64
fi
`
  );
  fs.chmodSync(executable, 0o755);
  return bin;
}

function createMockCurl(bin: string) {
  const executable = path.join(bin, "curl");
  fs.writeFileSync(
    executable,
    `#!/usr/bin/env bash
set -euo pipefail
while [ "$#" -gt 0 ]; do
  if [ "$1" = --data ]; then
    payload="$2"
    printf '%s' "$payload" > "$MOCK_CURL_PAYLOAD"
    if [ -n "\${MOCK_AUTH_EXPECTED_AGGREGATE_DIGEST:-}" ]; then
      test "$(jq -r '.aggregate_candidate_evidence_digest' <<< "$payload")" = \
        "$MOCK_AUTH_EXPECTED_AGGREGATE_DIGEST"
    fi
    if [ -n "\${MOCK_AUTH_EXPECTED_REUSE_RUN_ID:-}" ]; then
      test "$(jq -r '.reuse_artifact_run_id' <<< "$payload")" = \
        "$MOCK_AUTH_EXPECTED_REUSE_RUN_ID"
      test "$(jq -r '.reuse_artifact_name' <<< "$payload")" = \
        "$MOCK_AUTH_EXPECTED_REUSE_NAME"
      test "$(jq -r '.reuse_artifact_digest' <<< "$payload")" = \
        "$MOCK_AUTH_EXPECTED_REUSE_DIGEST"
    fi
    exit 0
  fi
  shift
done
exit 64
`
  );
  fs.chmodSync(executable, 0o755);
}

function createMockRefGh(root: string) {
  const bin = path.join(root, "bin");
  fs.mkdirSync(bin);
  const executable = path.join(bin, "gh");
  fs.writeFileSync(
    executable,
    `#!/usr/bin/env bash
set -euo pipefail
if [ "\${MOCK_GH_FAIL:-0}" = 1 ]; then
  exit 1
fi
endpoint="$2"
if [[ "$endpoint" == *"/git/commits/"* ]]; then
  printf '{"sha":"%s"}\n' "\${MOCK_COMMIT_SHA:-$EXPECTED_SHA}"
elif [[ "$endpoint" == *"/git/ref/heads/"* ]]; then
  printf '{"object":{"type":"commit","sha":"%s"}}\n' "$MOCK_REF_SHA"
elif [[ "$endpoint" == *"/compare/"* ]]; then
  printf '{"status":"%s","base_commit":{"sha":"%s"},"merge_base_commit":{"sha":"%s"}}\n' \
    "\${MOCK_COMPARE_STATUS:-ahead}" \
    "\${MOCK_COMPARE_BASE_SHA:-$EXPECTED_SHA}" \
    "\${MOCK_MERGE_BASE_SHA:-$EXPECTED_SHA}"
else
  exit 64
fi
`
  );
  fs.chmodSync(executable, 0o755);
  return bin;
}

function createMock6529(root: string) {
  const bin = path.join(root, "bin");
  fs.mkdirSync(bin);
  const executable = path.join(bin, "6529");
  fs.writeFileSync(
    executable,
    `#!/usr/bin/env bash
set -euo pipefail
if [ "$*" = "exec node scripts/e2e-packs.cjs --capabilities" ]; then
  case "\${MOCK_RUNNER_CAPABILITY:-old}" in
    current)
      printf '%s\\n' '{"contract":"release-bus-e2e-runner-capabilities.v1","features":{"readonly_pack_parallelism":{"version":1,"max_parallel":4}}}'
      exit 0
      ;;
    incompatible)
      printf '%s\\n' '{"contract":"release-bus-e2e-runner-capabilities.v2","features":{"readonly_pack_parallelism":{"version":2,"max_parallel":8}}}'
      exit 0
      ;;
    old)
      exit 2
      ;;
  esac
fi
printf '%s\\n' "$@" > "$MOCK_6529_ARGS"
`
  );
  fs.chmodSync(executable, 0o755);
}

describe("Release Bus artifact rollout compatibility", () => {
  it("fails new-producer to old-workflow dispatch before jobs and maps old omissions only to legacy defaults", () => {
    const oldWorkflow = {
      on: {
        workflow_dispatch: {
          inputs: LEGACY_PREFLIGHT_INPUT_CONTRACT_V0,
        },
      },
    };
    const newWorkflow = readWorkflow("release-bus-v2-preflight.yml");
    const oldProducerInputs = {
      release_train_id: TRAIN_ID,
      release_train_revision: "1",
      operation_key: "rb2:compatibility:a1",
      source_ref: "release-bus-v2/compatibility",
      expected_sha: EXPECTED_SHA,
      deploy_units: "[]",
      artifact_environment: "staging",
      reuse_artifact_run_id: "",
      reuse_artifact_name: "",
      reuse_artifact_digest: "",
    };
    const newProducerToOld = modelWorkflowDispatch(oldWorkflow, {
      ...oldProducerInputs,
      artifact_contract_version: "environment-bound-v3",
      candidate_evidence_mode: "strict-aggregate",
      aggregate_candidate_evidence_digest: "f".repeat(64),
    });
    expect(newProducerToOld).toEqual({
      accepted: false,
      unsupported: [
        "aggregate_candidate_evidence_digest",
        "artifact_contract_version",
        "candidate_evidence_mode",
      ],
      resolved: {},
    });

    const oldProducerToNew = modelWorkflowDispatch(
      newWorkflow,
      oldProducerInputs
    );
    expect(oldProducerToNew.accepted).toBe(true);
    expect(oldProducerToNew.resolved).toMatchObject({
      artifact_contract_version: "legacy-v2",
      candidate_evidence_mode: "legacy-whole-train",
      aggregate_candidate_evidence_digest: "",
    });
  });

  for (const environment of ["staging", "production"] as const) {
    const workflowName = `release-bus-deploy-${environment}.yml`;

    it(`${environment} executably accepts schema2 only for the same train before credentials`, () => {
      const workflow = readWorkflow(workflowName);
      const validate = findStep(
        workflow,
        "deploy",
        "Validate dispatch inputs before using credentials"
      );
      const verify = findStep(
        workflow,
        "deploy",
        "Verify and bind immutable artifact"
      );
      const steps: WorkflowStep[] = workflow.jobs.deploy.steps;
      const validateIndex = steps.indexOf(validate);
      const credentialIndex = steps.findIndex(
        (step) => step.name === "Configure AWS credentials"
      );
      expect(validateIndex).toBeLessThan(credentialIndex);

      const root = fs.mkdtempSync(
        path.join(os.tmpdir(), `release-bus-${environment}-schema2-`)
      );
      try {
        const digest = writeArtifact(root, environment, 2);
        const env = deployEnv(environment, digest, "legacy-v2");
        expect(runShell(validate.run!, { env }).status).toBe(0);
        expect(runShell(verify.run!, { cwd: root, env }).status).toBe(0);

        const crossTrain = runShell(validate.run!, {
          env: { ...env, ARTIFACT_TRAIN_ID: "different-train" },
        });
        expect(crossTrain.status).not.toBe(0);
      } finally {
        fs.rmSync(root, { recursive: true, force: true });
      }
    });

    it(`${environment} executably accepts exact v3 and rejects the wrong environment`, () => {
      const workflow = readWorkflow(workflowName);
      const verify = findStep(
        workflow,
        "deploy",
        "Verify and bind immutable artifact"
      );
      const root = fs.mkdtempSync(
        path.join(os.tmpdir(), `release-bus-${environment}-schema3-`)
      );
      try {
        const digest = writeArtifact(root, environment, 3);
        const env = deployEnv(environment, digest, "environment-bound-v3");
        expect(runShell(verify.run!, { cwd: root, env }).status).toBe(0);
      } finally {
        fs.rmSync(root, { recursive: true, force: true });
      }

      const mismatchRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), `release-bus-${environment}-mismatch-`)
      );
      try {
        const wrongEnvironment =
          environment === "staging" ? "production" : "staging";
        const digest = writeArtifact(mismatchRoot, environment, 3, {
          environment: wrongEnvironment,
        });
        const env = deployEnv(environment, digest, "environment-bound-v3");
        expect(
          runShell(verify.run!, { cwd: mismatchRoot, env }).status
        ).not.toBe(0);
      } finally {
        fs.rmSync(mismatchRoot, { recursive: true, force: true });
      }
    });

    it(`${environment} preserves ordinary CAS and proves rollback reachability without checkout`, () => {
      const workflow = readWorkflow(`release-bus-deploy-${environment}.yml`);
      const source = findStep(
        workflow,
        "deploy",
        environment === "staging"
          ? "Verify immutable staging ref without checkout"
          : "Confirm immutable production ref without checkout"
      );
      const report = findStep(
        workflow,
        "deploy",
        "Report structured Release Bus deployment result"
      );
      const root = fs.mkdtempSync(
        path.join(os.tmpdir(), `release-bus-${environment}-source-`)
      );
      try {
        const mockBin = createMockRefGh(root);
        createMockCurl(mockBin);
        const sourceOutput = path.join(root, "source-output");
        const curlPayload = path.join(root, "report-payload.json");
        const sourceEnv = {
          EXPECTED_SHA,
          GITHUB_OUTPUT: sourceOutput,
          GITHUB_REPOSITORY: "6529-Collections/6529seize-frontend",
          MOCK_REF_SHA: EXPECTED_SHA,
          PATH: `${mockBin}:${process.env["PATH"]}`,
          TRAIN_REVISION: "1",
        };
        expect(runShell(source.run!, { env: sourceEnv }).status).toBe(0);
        expect(fs.readFileSync(sourceOutput, "utf8")).toContain(
          "failure_kind="
        );

        fs.writeFileSync(sourceOutput, "");
        expect(
          runShell(source.run!, {
            env: { ...sourceEnv, MOCK_REF_SHA: "b".repeat(40) },
          }).status
        ).not.toBe(0);
        expect(fs.readFileSync(sourceOutput, "utf8")).toContain(
          "failure_kind=ref-moved"
        );

        fs.writeFileSync(sourceOutput, "");
        expect(
          runShell(source.run!, {
            env: {
              ...sourceEnv,
              MOCK_REF_SHA: "b".repeat(40),
              TRAIN_REVISION: "rollback-2",
            },
          }).status
        ).toBe(0);
        expect(fs.readFileSync(sourceOutput, "utf8")).toContain(
          "failure_kind="
        );

        fs.writeFileSync(sourceOutput, "");
        expect(
          runShell(source.run!, {
            env: {
              ...sourceEnv,
              MOCK_COMPARE_BASE_SHA: EXPECTED_SHA,
              MOCK_COMPARE_STATUS: "diverged",
              MOCK_MERGE_BASE_SHA: "c".repeat(40),
              MOCK_REF_SHA: "b".repeat(40),
              TRAIN_REVISION: "rollback-2",
            },
          }).status
        ).not.toBe(0);
        expect(fs.readFileSync(sourceOutput, "utf8")).toContain(
          "failure_kind=rollback-not-reachable"
        );

        fs.writeFileSync(sourceOutput, "");
        expect(
          runShell(source.run!, {
            env: { ...sourceEnv, MOCK_GH_FAIL: "1" },
          }).status
        ).not.toBe(0);
        expect(fs.readFileSync(sourceOutput, "utf8")).toContain(
          "failure_kind=api"
        );

        const reportEnv = {
          ARTIFACT_CONTRACT: "environment-bound-v1",
          ARTIFACT_CONTRACT_VERSION: "environment-bound-v3",
          ARTIFACT_DIGEST: "c".repeat(64),
          ARTIFACT_ENVIRONMENT: environment,
          ARTIFACT_OUTCOME: "success",
          ARTIFACT_RUN_ID: "1234",
          ARTIFACT_TRAIN_ID: TRAIN_ID,
          AWS_OUTCOME: "success",
          DOWNLOAD_OUTCOME: "success",
          EVIDENCE_OUTCOME: "success",
          EXPECTED_SHA,
          GITHUB_RUN_ID: "9876",
          JOB_STATUS: "success",
          MOCK_CURL_PAYLOAD: curlPayload,
          OPERATION_KEY: "rb2:compatibility:a1",
          PACKAGE_DIGEST: "d".repeat(64),
          PATH: `${mockBin}:${process.env["PATH"]}`,
          RELEASE_BUS_API_URL: "https://release-bus.invalid",
          RELEASE_BUS_WORKFLOW_AUTH_TOKEN: "test-token",
          SCHEMA_VERSION: "3",
          SOURCE_FAILURE_KIND: "",
          SOURCE_OUTCOME: "success",
          TRAIN_ID,
        };
        expect(runShell(report.run!, { env: reportEnv }).status).toBe(0);
        expect(JSON.parse(fs.readFileSync(curlPayload, "utf8"))).toMatchObject({
          status: "SUCCEEDED",
          summary: {
            schema_version: 3,
            artifact_contract: "environment-bound-v1",
            artifact_contract_version: "environment-bound-v3",
            repository: "frontend",
            source_sha: EXPECTED_SHA,
            environment,
            service: null,
            artifact_run_id: "1234",
            artifact_train_id: TRAIN_ID,
            artifact_digest: "c".repeat(64),
            package_digest: "d".repeat(64),
            consumed_preflight_artifact: true,
            rebuilt: false,
            source_evidence_reused: true,
            artifact_bytes_reused: false,
          },
        });
        expect(
          runShell(report.run!, {
            env: {
              ...reportEnv,
              ARTIFACT_CONTRACT: "legacy-v2",
              ARTIFACT_CONTRACT_VERSION: "legacy-v2",
              SCHEMA_VERSION: "2",
            },
          }).status
        ).toBe(0);
        expect(JSON.parse(fs.readFileSync(curlPayload, "utf8"))).toMatchObject({
          status: "SUCCEEDED",
          summary: {
            schema_version: 2,
            artifact_contract: "legacy-v2",
            artifact_contract_version: "legacy-v2",
            repository: "frontend",
            source_sha: EXPECTED_SHA,
            environment: "portable",
            deployment_environment: environment,
            service: null,
            artifact_run_id: "1234",
            artifact_train_id: TRAIN_ID,
            artifact_digest: "c".repeat(64),
            package_digest: "d".repeat(64),
            consumed_preflight_artifact: true,
            rebuilt: false,
            source_evidence_reused: false,
            artifact_bytes_reused: false,
          },
        });

        expect(
          runShell(report.run!, {
            env: {
              ...reportEnv,
              ARTIFACT_CONTRACT: "",
              ARTIFACT_DIGEST: "",
              ARTIFACT_OUTCOME: "skipped",
              JOB_STATUS: "failure",
              PACKAGE_DIGEST: "",
              SCHEMA_VERSION: "",
              SOURCE_FAILURE_KIND: "ref-moved",
              SOURCE_OUTCOME: "failure",
            },
          }).status
        ).toBe(0);
        expect(JSON.parse(fs.readFileSync(curlPayload, "utf8"))).toMatchObject({
          status: "FAILED",
          failure_class: "INTERACTION",
          failure_phase: "source_ref_moved",
          retryable: false,
          summary: {
            artifact_digest: null,
            package_digest: null,
            consumed_preflight_artifact: false,
            rebuilt: false,
            source_evidence_reused: true,
            artifact_bytes_reused: false,
          },
        });

        expect(
          runShell(report.run!, {
            env: {
              ...reportEnv,
              ARTIFACT_CONTRACT: "",
              ARTIFACT_DIGEST: "",
              ARTIFACT_OUTCOME: "skipped",
              JOB_STATUS: "failure",
              PACKAGE_DIGEST: "",
              SCHEMA_VERSION: "",
              SOURCE_FAILURE_KIND: "rollback-not-reachable",
              SOURCE_OUTCOME: "failure",
            },
          }).status
        ).toBe(0);
        expect(JSON.parse(fs.readFileSync(curlPayload, "utf8"))).toMatchObject({
          status: "FAILED",
          failure_class: "INTERACTION",
          failure_phase: "rollback_source_not_reachable",
          retryable: false,
          summary: {
            artifact_digest: null,
            package_digest: null,
            consumed_preflight_artifact: false,
            rebuilt: false,
            source_evidence_reused: true,
            artifact_bytes_reused: false,
          },
        });
      } finally {
        fs.rmSync(root, { recursive: true, force: true });
      }
    });
  }

  for (const environment of ["staging", "production"] as const) {
    it(`${environment} falls back old runners to serial and fails closed without manifest evidence`, () => {
      const workflow = readWorkflow(
        environment === "staging" ? "staging-e2e.yml" : "production-e2e.yml"
      );
      const step = findStep(
        workflow,
        environment === "staging" ? "staging-packs" : "readonly",
        environment === "staging"
          ? "Run staging packs against staging.6529.io"
          : "Run production-safe read-only packs"
      );
      const evidence = findStep(
        workflow,
        environment === "staging" ? "staging-packs" : "readonly",
        "Validate exact manifest-bound E2E evidence"
      );
      const root = fs.mkdtempSync(
        path.join(os.tmpdir(), `release-bus-${environment}-runner-`)
      );
      try {
        createMock6529(root);
        const invocation = path.join(root, "runner-args");
        const baseEnv = {
          MOCK_6529_ARGS: invocation,
          SELECTED_PACK: "all",
        };

        expect(
          runShell(step.run!, {
            cwd: root,
            env: { ...baseEnv, MOCK_RUNNER_CAPABILITY: "current" },
          }).status
        ).toBe(0);
        const currentArgs = fs.readFileSync(invocation, "utf8").split("\n");
        expect(currentArgs).toEqual(
          expect.arrayContaining(["--parallel", "3"])
        );
        expect(currentArgs).toEqual(
          expect.arrayContaining(["--trigger", "post-deploy"])
        );

        expect(
          runShell(step.run!, {
            cwd: root,
            env: { ...baseEnv, MOCK_RUNNER_CAPABILITY: "old" },
          }).status
        ).toBe(0);
        const oldArgs = fs.readFileSync(invocation, "utf8").split("\n");
        expect(oldArgs).not.toContain("--parallel");
        expect(oldArgs).not.toContain("--pack");
        expect(oldArgs).toEqual(
          expect.arrayContaining(["--trigger", "post-deploy"])
        );

        expect(
          runShell(step.run!, {
            cwd: root,
            env: { ...baseEnv, MOCK_RUNNER_CAPABILITY: "incompatible" },
          }).status
        ).toBe(0);
        const incompatibleArgs = fs
          .readFileSync(invocation, "utf8")
          .split("\n");
        expect(incompatibleArgs).not.toContain("--parallel");
        expect(incompatibleArgs).not.toContain("--pack");
        expect(incompatibleArgs).toEqual(
          expect.arrayContaining(["--trigger", "post-deploy"])
        );
        expect(
          runShell(evidence.run!, {
            cwd: root,
            env: {
              E2E_OUTCOME: "success",
              EXPECTED_SHA,
              MANIFEST_ID: "manifest",
              MANIFEST_IDENTITY: "f".repeat(64),
              OPERATION_KEY: "rb2:compatibility:a1",
            },
          }).status
        ).not.toBe(0);
      } finally {
        fs.rmSync(root, { recursive: true, force: true });
      }
    });
  }

  it("rejects partial staging E2E operation identity before checkout", () => {
    const workflow = readWorkflow("staging-e2e.yml");
    const steps = workflow.jobs["staging-packs"]?.steps ?? [];
    const guard = findStep(
      workflow,
      "staging-packs",
      "Reject partial Release Bus identity"
    );
    const guardIndex = steps.indexOf(guard);
    const checkoutIndex = steps.findIndex(
      ({ name }) => name === "Check out the deployed ref"
    );
    const emptyIdentity = {
      BACKEND_ARTIFACT_DIGEST: "",
      BACKEND_SHA: "",
      EXPECTED_SHA: "",
      FRONTEND_ARTIFACT_DIGEST: "",
      FRONTEND_SHA: "",
      MANIFEST_ID: "",
      MANIFEST_IDENTITY: "",
      OPERATION_KEY: "",
      SOURCE_REF: "",
      TRAIN_ID: "",
      TRAIN_REVISION: "",
    };

    expect(guardIndex).toBeGreaterThanOrEqual(0);
    expect(guardIndex).toBeLessThan(checkoutIndex);
    expect(runShell(guard.run!, { env: emptyIdentity }).status).toBe(0);
    expect(
      runShell(guard.run!, {
        env: {
          ...emptyIdentity,
          OPERATION_KEY: "rb2:staging:e2e:a1",
        },
      }).status
    ).not.toBe(0);
    expect(
      runShell(guard.run!, {
        env: {
          ...emptyIdentity,
          TRAIN_ID: "train-without-operation",
        },
      }).status
    ).not.toBe(0);
  });

  it("executably enforces explicit single, aggregate, and legacy evidence modes", () => {
    const workflow = readWorkflow("release-bus-v2-preflight.yml");
    const validateLocal = findStep(
      workflow,
      "authorize",
      "Validate exact local inputs"
    );
    const validateEvidence = findStep(
      workflow,
      "evidence",
      "Validate exact authorized CI evidence"
    );
    const authorize = findStep(
      workflow,
      "authorize",
      "Authorize exact v2 operation"
    );
    const report = findStep(
      workflow,
      "finalize",
      "Report structured terminal result"
    );
    const root = fs.mkdtempSync(
      path.join(os.tmpdir(), "release-bus-evidence-mode-")
    );
    try {
      const mergeSha = "b".repeat(40);
      const artifactDigest = "d".repeat(64);
      const artifactName = `release-bus-v2-pr-${mergeSha}`;
      const evidenceSource = createStrictEvidence(root, mergeSha);
      const mockBin = createMockGh(root);
      createMockCurl(mockBin);
      const curlPayload = path.join(root, "authorize-payload.json");
      const evidenceOutput = path.join(root, "evidence-output");
      const ghInvocations = path.join(root, "gh-invocations");
      const baseEnv = {
        AGGREGATE_CANDIDATE_EVIDENCE_DIGEST: "",
        ARTIFACT_CONTRACT_VERSION: "environment-bound-v3",
        ARTIFACT_ENVIRONMENT: "staging",
        CANDIDATE_EVIDENCE_MODE: "strict-single",
        DEPLOY_UNITS: "[]",
        EXPECTED_SHA: execFileSync("git", ["rev-parse", "HEAD"], {
          cwd: ROOT,
          encoding: "utf8",
        }).trim(),
        GITHUB_REPOSITORY: "6529-Collections/6529seize-frontend",
        GITHUB_OUTPUT: evidenceOutput,
        MOCK_ARTIFACT_DIGEST: artifactDigest,
        MOCK_ARTIFACT_NAME: artifactName,
        MOCK_CURL_PAYLOAD: curlPayload,
        MOCK_EVIDENCE_SOURCE: evidenceSource,
        MOCK_HEAD_SHA: "e".repeat(40),
        MOCK_GH_INVOCATIONS: ghInvocations,
        MOCK_MERGE_SHA: mergeSha,
        OPERATION_KEY: "rb2:compatibility:a1",
        PATH: `${mockBin}:${process.env["PATH"]}`,
        REUSE_ARTIFACT_DIGEST: artifactDigest,
        REUSE_ARTIFACT_NAME: artifactName,
        REUSE_ARTIFACT_RUN_ID: "1234",
        RUNNER_TEMP: path.join(root, "runner"),
        SOURCE_REF: "release-bus-v2/compatibility",
        TRAIN_ID,
        TRAIN_REVISION: "1",
      };

      const authorizeSteps = workflow.jobs.authorize.steps as WorkflowStep[];
      expect(authorizeSteps.indexOf(validateLocal)).toBeLessThan(
        authorizeSteps.indexOf(authorize)
      );
      expect(workflow.jobs.evidence.needs).toBe("authorize");
      expect(workflow.jobs.build.needs).toBe("evidence");
      expect(runShell(validateLocal.run!, { env: baseEnv }).status).toBe(0);
      expect(fs.existsSync(ghInvocations)).toBe(false);
      expect(
        runShell(authorize.run!, {
          env: {
            ...baseEnv,
            EXPECTED_SHA: EXPECTED_SHA,
            GITHUB_RUN_ID: "9876",
            MOCK_AUTH_EXPECTED_REUSE_DIGEST: artifactDigest,
            MOCK_AUTH_EXPECTED_REUSE_NAME: artifactName,
            MOCK_AUTH_EXPECTED_REUSE_RUN_ID: "1234",
            RELEASE_BUS_API_URL: "https://release-bus.invalid",
            RELEASE_BUS_WORKFLOW_AUTH_TOKEN: "test-token",
          },
        }).status
      ).toBe(0);
      expect(fs.existsSync(curlPayload)).toBe(true);
      expect(runShell(validateEvidence.run!, { env: baseEnv }).status).toBe(0);
      expect(fs.readFileSync(ghInvocations, "utf8")).toContain(
        "actions/runs/1234/artifacts"
      );
      expect(
        runShell(validateEvidence.run!, {
          env: { ...baseEnv, MOCK_HEAD_SHA: "a".repeat(40) },
        }).status
      ).not.toBe(0);
      expect(
        runShell(validateLocal.run!, {
          env: {
            ...baseEnv,
            REUSE_ARTIFACT_DIGEST: "",
            REUSE_ARTIFACT_NAME: "",
            REUSE_ARTIFACT_RUN_ID: "",
          },
        }).status
      ).not.toBe(0);
      expect(
        runShell(validateLocal.run!, {
          env: {
            ...baseEnv,
            AGGREGATE_CANDIDATE_EVIDENCE_DIGEST: "f".repeat(64),
            CANDIDATE_EVIDENCE_MODE: "strict-aggregate",
            REUSE_ARTIFACT_DIGEST: "",
            REUSE_ARTIFACT_NAME: "",
            REUSE_ARTIFACT_RUN_ID: "",
          },
        }).status
      ).toBe(0);
      expect(
        runShell(validateEvidence.run!, {
          env: {
            ...baseEnv,
            AGGREGATE_CANDIDATE_EVIDENCE_DIGEST: "f".repeat(64),
            CANDIDATE_EVIDENCE_MODE: "strict-aggregate",
            REUSE_ARTIFACT_DIGEST: "",
            REUSE_ARTIFACT_NAME: "",
            REUSE_ARTIFACT_RUN_ID: "",
          },
        }).status
      ).toBe(0);
      fs.writeFileSync(evidenceOutput, "");
      expect(
        runShell(validateEvidence.run!, {
          env: { ...baseEnv, MOCK_GH_FAILURE: "missing" },
        }).status
      ).not.toBe(0);
      expect(fs.readFileSync(evidenceOutput, "utf8")).toContain(
        "failure_class=CANDIDATE"
      );
      expect(fs.readFileSync(evidenceOutput, "utf8")).toContain(
        "failure_phase=candidate_evidence_validation"
      );
      expect(fs.readFileSync(evidenceOutput, "utf8")).toContain(
        "retryable=false"
      );
      fs.writeFileSync(evidenceOutput, "");
      expect(
        runShell(validateEvidence.run!, {
          env: { ...baseEnv, MOCK_GH_FAILURE: "transport" },
        }).status
      ).not.toBe(0);
      expect(fs.readFileSync(evidenceOutput, "utf8")).toContain(
        "failure_class=INFRASTRUCTURE"
      );
      expect(fs.readFileSync(evidenceOutput, "utf8")).toContain(
        "failure_phase=candidate_evidence_transport"
      );
      expect(fs.readFileSync(evidenceOutput, "utf8")).toContain(
        "retryable=true"
      );
      expect(
        runShell(report.run!, {
          env: {
            ARTIFACT_CONTRACT_VERSION: "environment-bound-v3",
            ARTIFACT_ENVIRONMENT: "staging",
            AUTHORIZATION_RESULT: "success",
            BUILD_FAILURE_CLASS: "",
            BUILD_FAILURE_PHASE: "",
            BUILD_RETRYABLE: "",
            BUILD_RESULT: "skipped",
            DOWNLOAD_OUTCOME: "skipped",
            EVIDENCE_FAILURE_CLASS: "INFRASTRUCTURE",
            EVIDENCE_FAILURE_PHASE: "candidate_evidence_transport",
            EVIDENCE_RESULT: "failure",
            EVIDENCE_RETRYABLE: "true",
            EXPECTED_SHA,
            GITHUB_RUN_ID: "9876",
            MOCK_CURL_PAYLOAD: curlPayload,
            OPERATION_KEY: "rb2:compatibility:a1",
            PATH: `${mockBin}:${process.env["PATH"]}`,
            RELEASE_BUS_API_URL: "https://release-bus.invalid",
            RELEASE_BUS_WORKFLOW_AUTH_TOKEN: "test-token",
            TRAIN_ID,
            VERIFY_OUTCOME: "skipped",
          },
        }).status
      ).toBe(0);
      expect(JSON.parse(fs.readFileSync(curlPayload, "utf8"))).toMatchObject({
        status: "FAILED",
        failure_class: "INFRASTRUCTURE",
        failure_phase: "candidate_evidence_transport",
        retryable: true,
      });
      expect(
        runShell(report.run!, {
          env: {
            ...baseEnv,
            AUTHORIZATION_RESULT: "success",
            BUILD_FAILURE_CLASS: "",
            BUILD_FAILURE_PHASE: "",
            BUILD_RETRYABLE: "",
            BUILD_RESULT: "skipped",
            DOWNLOAD_OUTCOME: "skipped",
            EVIDENCE_FAILURE_CLASS: "",
            EVIDENCE_FAILURE_PHASE: "",
            EVIDENCE_RESULT: "cancelled",
            EVIDENCE_RETRYABLE: "",
            EXPECTED_SHA,
            GITHUB_RUN_ID: "9876",
            RELEASE_BUS_API_URL: "https://release-bus.invalid",
            RELEASE_BUS_WORKFLOW_AUTH_TOKEN: "test-token",
            VERIFY_OUTCOME: "skipped",
          },
        }).status
      ).toBe(0);
      expect(JSON.parse(fs.readFileSync(curlPayload, "utf8"))).toMatchObject({
        status: "FAILED",
        failure_class: "INFRASTRUCTURE",
        failure_phase: "candidate_evidence_runner",
        retryable: true,
      });
      expect(
        runShell(authorize.run!, {
          env: {
            ...baseEnv,
            EXPECTED_SHA: EXPECTED_SHA,
            GITHUB_RUN_ID: "9876",
            MOCK_AUTH_EXPECTED_REUSE_DIGEST: artifactDigest,
            MOCK_AUTH_EXPECTED_REUSE_NAME: artifactName,
            MOCK_AUTH_EXPECTED_REUSE_RUN_ID: "1234",
            RELEASE_BUS_API_URL: "https://release-bus.invalid",
            RELEASE_BUS_WORKFLOW_AUTH_TOKEN: "test-token",
          },
        }).status
      ).toBe(0);
      expect(JSON.parse(fs.readFileSync(curlPayload, "utf8"))).toMatchObject({
        train_id: TRAIN_ID,
        expected_sha: EXPECTED_SHA,
        source_ref: "release-bus-v2/compatibility",
        candidate_evidence_mode: "strict-single",
        aggregate_candidate_evidence_digest: null,
        reuse_artifact_run_id: "1234",
        reuse_artifact_name: artifactName,
        reuse_artifact_digest: artifactDigest,
      });
      const artifactRoot = path.join(root, "release-bus-artifact");
      fs.mkdirSync(artifactRoot);
      const packageDigest = "e".repeat(64);
      const writeManifest = (ciEvidence: Record<string, string | null>) => {
        fs.writeFileSync(
          path.join(artifactRoot, "manifest.json"),
          JSON.stringify({
            schema_version: 3,
            artifact_contract: "environment-bound-v1",
            artifact_contract_version: "environment-bound-v3",
            repository: "frontend",
            source_sha: EXPECTED_SHA,
            environment: "staging",
            package_sha256: packageDigest,
            ci_evidence: ciEvidence,
          })
        );
      };
      fs.writeFileSync(path.join(artifactRoot, "SHA256SUMS"), "fixture\n");
      const reportEnv = {
        ...baseEnv,
        AUTHORIZATION_RESULT: "success",
        BUILD_RESULT: "success",
        DOWNLOAD_OUTCOME: "success",
        EVIDENCE_RESULT: "success",
        EXPECTED_SHA: EXPECTED_SHA,
        GITHUB_RUN_ID: "9876",
        RELEASE_BUS_API_URL: "https://release-bus.invalid",
        RELEASE_BUS_WORKFLOW_AUTH_TOKEN: "test-token",
        VERIFY_OUTCOME: "success",
      };
      writeManifest({
        mode: "strict-single",
        aggregate_digest: null,
        run_id: "1234",
        name: artifactName,
        digest: artifactDigest,
      });
      expect(runShell(report.run!, { cwd: root, env: reportEnv }).status).toBe(
        0
      );
      expect(
        JSON.parse(fs.readFileSync(curlPayload, "utf8")).summary.ci_evidence
      ).toEqual({
        mode: "strict-single",
        aggregate_candidate_evidence_digest: null,
        artifact_run_id: "1234",
        artifact_name: artifactName,
        artifact_digest: artifactDigest,
      });
      writeManifest({
        mode: "strict-aggregate",
        aggregate_digest: "f".repeat(64),
        run_id: null,
        name: null,
        digest: null,
      });
      expect(runShell(report.run!, { cwd: root, env: reportEnv }).status).toBe(
        0
      );
      expect(
        JSON.parse(fs.readFileSync(curlPayload, "utf8")).summary.ci_evidence
      ).toEqual({
        mode: "strict-aggregate",
        aggregate_candidate_evidence_digest: "f".repeat(64),
        artifact_run_id: null,
        artifact_name: null,
        artifact_digest: null,
      });
      expect(
        runShell(authorize.run!, {
          env: {
            ...baseEnv,
            AGGREGATE_CANDIDATE_EVIDENCE_DIGEST: "f".repeat(64),
            CANDIDATE_EVIDENCE_MODE: "strict-aggregate",
            EXPECTED_SHA: EXPECTED_SHA,
            GITHUB_RUN_ID: "9876",
            RELEASE_BUS_API_URL: "https://release-bus.invalid",
            RELEASE_BUS_WORKFLOW_AUTH_TOKEN: "test-token",
          },
        }).status
      ).toBe(0);
      expect(JSON.parse(fs.readFileSync(curlPayload, "utf8"))).toMatchObject({
        train_id: TRAIN_ID,
        expected_sha: EXPECTED_SHA,
        source_ref: "release-bus-v2/compatibility",
        candidate_evidence_mode: "strict-aggregate",
        aggregate_candidate_evidence_digest: "f".repeat(64),
      });
      expect(
        runShell(authorize.run!, {
          env: {
            ...baseEnv,
            AGGREGATE_CANDIDATE_EVIDENCE_DIGEST: "f".repeat(64),
            CANDIDATE_EVIDENCE_MODE: "strict-aggregate",
            EXPECTED_SHA: EXPECTED_SHA,
            GITHUB_RUN_ID: "9876",
            MOCK_AUTH_EXPECTED_AGGREGATE_DIGEST: "0".repeat(64),
            RELEASE_BUS_API_URL: "https://release-bus.invalid",
            RELEASE_BUS_WORKFLOW_AUTH_TOKEN: "test-token",
          },
        }).status
      ).not.toBe(0);
      expect(
        runShell(validateLocal.run!, {
          env: {
            ...baseEnv,
            CANDIDATE_EVIDENCE_MODE: "",
            REUSE_ARTIFACT_DIGEST: "",
            REUSE_ARTIFACT_NAME: "",
            REUSE_ARTIFACT_RUN_ID: "",
          },
        }).status
      ).not.toBe(0);
      expect(
        runShell(validateLocal.run!, {
          env: {
            ...baseEnv,
            ARTIFACT_CONTRACT_VERSION: "legacy-v2",
            CANDIDATE_EVIDENCE_MODE: "legacy-whole-train",
            REUSE_ARTIFACT_DIGEST: "",
            REUSE_ARTIFACT_NAME: "",
            REUSE_ARTIFACT_RUN_ID: "",
          },
        }).status
      ).toBe(0);
      expect(
        runShell(authorize.run!, {
          env: {
            ...baseEnv,
            ARTIFACT_CONTRACT_VERSION: "legacy-v2",
            CANDIDATE_EVIDENCE_MODE: "legacy-whole-train",
            EXPECTED_SHA: EXPECTED_SHA,
            GITHUB_RUN_ID: "9876",
            RELEASE_BUS_API_URL: "https://release-bus.invalid",
            RELEASE_BUS_WORKFLOW_AUTH_TOKEN: "test-token",
          },
        }).status
      ).toBe(0);
      const legacyAuthorization = JSON.parse(
        fs.readFileSync(curlPayload, "utf8")
      );
      expect(legacyAuthorization).toMatchObject({
        train_id: TRAIN_ID,
        expected_sha: EXPECTED_SHA,
        repository: "frontend",
        environment: "orchestration",
      });
      expect(legacyAuthorization).not.toHaveProperty("candidate_evidence_mode");
      expect(legacyAuthorization).not.toHaveProperty(
        "aggregate_candidate_evidence_digest"
      );
      expect(legacyAuthorization).not.toHaveProperty("source_ref");
      expect(legacyAuthorization).not.toHaveProperty("reuse_artifact_run_id");
      expect(legacyAuthorization).not.toHaveProperty("reuse_artifact_name");
      expect(legacyAuthorization).not.toHaveProperty("reuse_artifact_digest");
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("executably attributes frontend preflight setup, install, build, and upload failures", () => {
    const workflow = readWorkflow("release-bus-v2-preflight.yml");
    const classify = findStep(
      workflow,
      "build",
      "Classify exact frontend preflight result"
    );
    const root = fs.mkdtempSync(
      path.join(os.tmpdir(), "release-bus-preflight-classification-")
    );
    const output = path.join(root, "github-output");
    const evidenceRoot = path.join(root, "release-bus-evidence");
    fs.mkdirSync(evidenceRoot);
    const baseEnv = {
      CHECKOUT_OUTCOME: "success",
      DEPENDENCIES_OUTCOME: "success",
      GENERATE_OUTCOME: "success",
      GITHUB_OUTPUT: output,
      NODE_OUTCOME: "success",
      PACKAGE_MANAGER_OUTCOME: "success",
      PACKAGE_OUTCOME: "success",
      RUNNER_TEMP: root,
      SOCKET_OUTCOME: "success",
      SOURCE_OUTCOME: "success",
      UPLOAD_OUTCOME: "success",
    };
    const runClassification = (overrides: Record<string, string>) => {
      fs.writeFileSync(output, "");
      expect(
        runShell(classify.run!, { env: { ...baseEnv, ...overrides } }).status
      ).toBe(0);
      return Object.fromEntries(
        fs
          .readFileSync(output, "utf8")
          .trim()
          .split("\n")
          .map((line) => {
            const separator = line.indexOf("=");
            return [line.slice(0, separator), line.slice(separator + 1)];
          })
      );
    };
    try {
      expect(runClassification({ NODE_OUTCOME: "failure" })).toMatchObject({
        failure_class: "INFRASTRUCTURE",
        failure_phase: "build_setup",
        retryable: "true",
      });

      fs.writeFileSync(
        path.join(evidenceRoot, "dependency-install.json"),
        JSON.stringify({ failure_class: "INFRASTRUCTURE_TRANSIENT" })
      );
      expect(
        runClassification({ DEPENDENCIES_OUTCOME: "failure" })
      ).toMatchObject({
        failure_class: "INFRASTRUCTURE",
        failure_phase: "dependency_install",
        retryable: "true",
      });

      fs.writeFileSync(
        path.join(evidenceRoot, "dependency-install.json"),
        JSON.stringify({ failure_class: "SOURCE" })
      );
      expect(
        runClassification({ DEPENDENCIES_OUTCOME: "failure" })
      ).toMatchObject({
        failure_class: "CANDIDATE",
        failure_phase: "dependency_contract",
        retryable: "false",
      });

      expect(runClassification({ PACKAGE_OUTCOME: "failure" })).toMatchObject({
        failure_class: "CANDIDATE",
        failure_phase: "environment_build",
        retryable: "false",
      });
      expect(runClassification({ UPLOAD_OUTCOME: "failure" })).toMatchObject({
        failure_class: "INFRASTRUCTURE",
        failure_phase: "artifact_upload",
        retryable: "true",
      });
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
