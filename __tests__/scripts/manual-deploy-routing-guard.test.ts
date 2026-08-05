import childProcess from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";

type WorkflowStep = {
  readonly name?: string;
  readonly uses?: string;
  readonly run?: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly with?: Readonly<Record<string, unknown>>;
  readonly if?: string;
  readonly "continue-on-error"?: boolean;
};

type WorkflowJob = {
  readonly needs?: string | readonly string[];
  readonly if?: string;
  readonly permissions?: Readonly<Record<string, unknown>>;
  readonly steps: readonly WorkflowStep[];
};

type JobResult = "success" | "failure" | "skipped";

type Workflow = {
  readonly on: {
    readonly push?: {
      readonly branches?: readonly string[];
      readonly "paths-ignore"?: readonly string[];
    };
    readonly workflow_dispatch?: {
      readonly inputs?: Readonly<Record<string, unknown>>;
    };
  };
  readonly jobs: Readonly<Record<string, WorkflowJob>>;
};

const MANUAL_WORKFLOWS = [
  {
    environment: "staging",
    file: "deploy-staging.yml",
    deployJob: "deploy-staging",
    lane: "STAGING",
    sourceRef: "1a-staging",
  },
  {
    environment: "prod",
    file: "build-upload-deploy-prod.yml",
    deployJob: "build-upload-deploy",
    lane: "PRODUCTION",
    sourceRef: "main",
  },
] as const;

function workflow(file: string): Workflow {
  return YAML.parse(
    fs.readFileSync(
      path.join(process.cwd(), ".github", "workflows", file),
      "utf8"
    )
  ) as Workflow;
}

function workflowJob(parsed: Workflow, name: string): WorkflowJob {
  const job = parsed.jobs[name];
  if (!job) {
    throw new Error(`Workflow has no ${name} job`);
  }
  return job;
}

function guardStep(file: string): WorkflowStep {
  const guard = workflowJob(workflow(file), "manual-deployment-guard");
  const step = guard?.steps.find(({ name }) =>
    name?.startsWith("Require authoritative")
  );
  if (!step?.run) {
    throw new Error(`${file} has no executable manual deployment guard`);
  }
  return step;
}

function runGuard({
  body,
  environment,
  file,
  httpStatus = "200",
  sourceRef,
  runId = "12345",
  transportFailure = false,
}: {
  readonly body: unknown;
  readonly environment: "staging" | "prod";
  readonly file: string;
  readonly httpStatus?: string;
  readonly sourceRef: "1a-staging" | "main";
  readonly runId?: string;
  readonly transportFailure?: boolean;
}) {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "manual-deploy-routing-guard-")
  );
  const curlPath = path.join(tempDir, "curl");
  fs.writeFileSync(
    curlPath,
    `#!/usr/bin/env bash
set -euo pipefail
output_file=
while [ "$#" -gt 0 ]; do
  case "$1" in
    --output)
      output_file="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done
test -n "$output_file"
printf '%s' "$FAKE_RESPONSE_BODY" > "$output_file"
if [ "$FAKE_TRANSPORT_FAILURE" = true ]; then
  exit 7
fi
printf '%s' "$FAKE_HTTP_STATUS"
`
  );
  fs.chmodSync(curlPath, 0o755);

  try {
    const step = guardStep(file);
    return childProcess.spawnSync("bash", ["-c", step.run!], {
      cwd: tempDir,
      encoding: "utf8",
      env: {
        ...process.env,
        FAKE_HTTP_STATUS: httpStatus,
        FAKE_RESPONSE_BODY: JSON.stringify(body),
        FAKE_TRANSPORT_FAILURE: String(transportFailure),
        GITHUB_REF_NAME: sourceRef,
        GITHUB_RUN_ATTEMPT: "1",
        GITHUB_RUN_ID: runId,
        GITHUB_SHA: "a".repeat(40),
        PATH: `${tempDir}:${process.env["PATH"] ?? ""}`,
        RELEASE_BUS_API_URL: "https://release-bus.example.test",
        RELEASE_BUS_WORKFLOW_AUTH_TOKEN: "fixture-workflow-token",
        TARGET_ENVIRONMENT: environment,
        TARGET_LANE: environment === "staging" ? "STAGING" : "PRODUCTION",
      },
    });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function commandOutput(result: childProcess.SpawnSyncReturns<string>): string {
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

function normalizeExpression(expression: string | undefined): string {
  return expression?.replace(/\s+/gu, " ").trim() ?? "";
}

function ciWaveSteps(job: WorkflowJob): readonly WorkflowStep[] {
  return job.steps.filter(
    (step) => step.run?.endsWith("scripts/notify-ci-wave.mjs") === true
  );
}

function terminalNotificationRuns(
  environment: "staging" | "production",
  results: Readonly<Record<string, JobResult>>
): boolean {
  if (environment === "staging") {
    return (
      results["manual-deployment-guard"] === "failure" &&
      results["deploy-staging"] === "skipped"
    );
  }
  return (
    results["build-upload-deploy"] === "skipped" &&
    (results["manual-deployment-guard"] === "failure" ||
      results["assert-main-ref"] === "failure")
  );
}

function deploymentFailureNotificationRuns(result: JobResult): boolean {
  return result === "failure";
}

describe("frontend manual deployment routing guards", () => {
  it.each(MANUAL_WORKFLOWS)(
    "allows $environment fallback only with exact authoritative OFF readiness evidence",
    ({ environment, file, lane, sourceRef }) => {
      const result = runGuard({
        body: {
          ready: true,
          mode: "manual",
          lane,
          repository: "frontend",
          environment,
          service: "frontend",
          workflow_run_id: "12345",
          workflow_run_attempt: 1,
          source_ref: sourceRef,
          source_sha: "a".repeat(40),
        },
        environment,
        file,
        sourceRef,
      });

      expect(result.status).toBe(0);
    }
  );

  it.each(MANUAL_WORKFLOWS)(
    "rejects $environment fallback when the lane is ON",
    ({ environment, file, sourceRef }) => {
      const result = runGuard({
        body: {
          error: `Manual ${environment} deployment is unavailable while that Release Bus lane is ON`,
        },
        environment,
        file,
        httpStatus: "409",
        sourceRef,
      });

      expect(result.status).not.toBe(0);
      expect(commandOutput(result)).toContain(
        `fallback readiness was rejected with HTTP 409`
      );
    }
  );

  it.each(MANUAL_WORKFLOWS)(
    "fails closed for malformed or mismatched $environment readiness",
    ({ environment, file, lane, sourceRef }) => {
      const otherEnvironment = environment === "staging" ? "prod" : "staging";
      const result = runGuard({
        body: {
          ready: true,
          mode: "manual",
          lane,
          repository: "frontend",
          environment: otherEnvironment,
          service: "frontend",
          workflow_run_id: "12345",
          workflow_run_attempt: 1,
          source_ref: sourceRef,
          source_sha: "a".repeat(40),
        },
        environment,
        file,
        sourceRef,
      });

      expect(result.status).not.toBe(0);
      expect(commandOutput(result)).toContain(
        "malformed or mismatched readiness evidence"
      );
    }
  );

  it.each(MANUAL_WORKFLOWS)(
    "fails closed when $environment readiness is unavailable",
    ({ environment, file, sourceRef }) => {
      const result = runGuard({
        body: {},
        environment,
        file,
        sourceRef,
        transportFailure: true,
      });

      expect(result.status).not.toBe(0);
      expect(commandOutput(result)).toContain("readiness is unavailable");
    }
  );

  it.each(MANUAL_WORKFLOWS)(
    "binds $environment readiness before checkout, artifact, ref, or cloud mutation",
    ({ environment, file, deployJob, lane }) => {
      const parsed = workflow(file);
      const guard = workflowJob(parsed, "manual-deployment-guard");
      const deploy = workflowJob(parsed, deployJob);
      const needs = Array.isArray(deploy.needs) ? deploy.needs : [deploy.needs];
      const guardSource = guard.steps.map(({ run }) => run ?? "").join("\n");

      expect(needs).toContain("manual-deployment-guard");
      expect(guard.permissions).toEqual({
        actions: "read",
        contents: "read",
      });
      expect(guard.steps).toHaveLength(1);
      expect(guard.steps[0]?.uses).toBeUndefined();
      expect(guard.steps[0]?.env).toMatchObject({
        TARGET_ENVIRONMENT: environment,
        TARGET_LANE: lane,
      });
      expect(guardSource).toContain(
        "/deploy/release-bus-v2/manual-deployment-readiness"
      );
      expect(guardSource).toContain("workflow_run_id:$workflow_run_id");
      expect(guardSource).toContain(
        "workflow_run_attempt:$workflow_run_attempt"
      );
      expect(guardSource).toContain("source_ref:$source_ref");
      expect(guardSource).toContain("source_sha:$source_sha");
      expect(guardSource).toContain("--connect-timeout 10");
      expect(guardSource).toContain("--max-time 30");
      expect(guardSource).not.toMatch(
        /actions\/checkout|aws |git (?:fetch|push|checkout|update-ref)|deployment-bus|artifact/i
      );
    }
  );

  it("keeps staging and production fallback decisions lane-local", () => {
    const staging = guardStep("deploy-staging.yml");
    const production = guardStep("build-upload-deploy-prod.yml");

    expect(staging.env?.["TARGET_ENVIRONMENT"]).toBe("staging");
    expect(production.env?.["TARGET_ENVIRONMENT"]).toBe("prod");
    expect(staging.env?.["TARGET_LANE"]).toBe("STAGING");
    expect(production.env?.["TARGET_LANE"]).toBe("PRODUCTION");
    expect(staging.run).not.toContain("ALL");
    expect(production.run).not.toContain("ALL");
  });

  it("guards both staging push and workflow-dispatch entry points", () => {
    const staging = workflow("deploy-staging.yml");
    const production = workflow("build-upload-deploy-prod.yml");

    expect(staging.on.push?.branches).toEqual(["1a-staging"]);
    expect(staging.on.push?.["paths-ignore"]).toEqual(["ops/**"]);
    expect(staging.on.workflow_dispatch).toBeDefined();
    expect(production.on.push).toBeUndefined();
    expect(production.on.workflow_dispatch).toBeDefined();
    expect(workflowJob(staging, "deploy-staging").needs).toEqual([
      "manual-deployment-guard",
      "build-staging-artifact",
    ]);
  });

  it("pins manual staging deployment to the SHA authorized by its guard", () => {
    const stagingDeploy = workflowJob(
      workflow("deploy-staging.yml"),
      "deploy-staging"
    );
    const checkout = stagingDeploy.steps.find(
      ({ name }) => name === "Checkout staging branch"
    );

    expect(checkout?.with?.["ref"]).toBe("${{ github.sha }}");
    expect(checkout?.with?.["ref"]).not.toBe("${{ env.STAGING_BRANCH }}");
  });

  it.each([
    {
      file: "deploy-staging.yml",
      deploy: "deploy-staging",
      terminal: "notify-staging-prerequisite-failure",
      needs: ["manual-deployment-guard", "deploy-staging"],
      condition:
        "${{ always() && needs.manual-deployment-guard.result == 'failure' && needs.deploy-staging.result == 'skipped' }}",
      environment: "staging",
    },
    {
      file: "build-upload-deploy-prod.yml",
      deploy: "build-upload-deploy",
      terminal: "notify-production-prerequisite-failure",
      needs: [
        "manual-deployment-guard",
        "assert-main-ref",
        "build-upload-deploy",
      ],
      condition:
        "${{ always() && needs.build-upload-deploy.result == 'skipped' && ( needs.manual-deployment-guard.result == 'failure' || needs.assert-main-ref.result == 'failure' ) }}",
      environment: "production",
    },
  ])(
    "defines one exact-SHA terminal notifier for $file",
    ({ condition, deploy, environment, file, needs, terminal }) => {
      const parsed = workflow(file);
      const deployJob = workflowJob(parsed, deploy);
      const terminalJob = workflowJob(parsed, terminal);

      expect(terminalJob.needs).toEqual(needs);
      expect(normalizeExpression(terminalJob.if)).toBe(condition);
      expect(
        ciWaveSteps(deployJob).map((step) => step.env?.["CI_PIPELINES_STATUS"])
      ).toEqual(["failure", "success"]);
      expect(ciWaveSteps(terminalJob)).toHaveLength(1);
      expect(ciWaveSteps(terminalJob)[0]).toMatchObject({
        if: "always() && hashFiles('.ci-wave-notifier/scripts/notify-ci-wave.mjs') != ''",
        "continue-on-error": true,
        env: {
          CI_PIPELINES_ENVIRONMENT: environment,
          CI_PIPELINES_SERVICE: "web",
          CI_PIPELINES_SHA: "${{ github.sha }}",
          CI_PIPELINES_STATUS: "failure",
          CI_PIPELINES_TARGET_ENV: environment,
          CI_PIPELINES_TITLE: `Seize ${environment === "staging" ? "STAGING" : "PROD"} WEB DEPLOY: CI pipeline is broken!!!`,
        },
      });
      for (const job of [deployJob, terminalJob]) {
        expect(
          job.steps.find(({ name }) => name === "Check out CI wave notifier")
        ).toMatchObject({
          "continue-on-error": true,
          with: {
            ref: "${{ github.workflow_sha }}",
            path: ".ci-wave-notifier",
            "persist-credentials": false,
            "sparse-checkout": "scripts/notify-ci-wave.mjs",
            "sparse-checkout-cone-mode": false,
          },
        });
      }
    }
  );

  it.each([
    ["staging guard failure", "staging", "failure", "success", "skipped", true],
    [
      "production guard failure",
      "production",
      "failure",
      "success",
      "skipped",
      true,
    ],
    [
      "production main-ref failure",
      "production",
      "success",
      "failure",
      "skipped",
      true,
    ],
    [
      "ordinary staging failure",
      "staging",
      "success",
      "success",
      "failure",
      false,
    ],
    [
      "ordinary production failure",
      "production",
      "success",
      "success",
      "failure",
      false,
    ],
    ["staging success", "staging", "success", "success", "success", false],
    [
      "production success",
      "production",
      "success",
      "success",
      "success",
      false,
    ],
  ] as const)(
    "routes $path without duplicating the deployment-job notifier",
    (_path, environment, guard, mainRef, deployment, expected) => {
      expect(
        terminalNotificationRuns(environment, {
          "manual-deployment-guard": guard,
          "assert-main-ref": mainRef,
          "deploy-staging": deployment,
          "build-upload-deploy": deployment,
        })
      ).toBe(expected);
    }
  );

  it("suppresses the deployment-job notifier when the job is skipped", () => {
    expect(deploymentFailureNotificationRuns("skipped")).toBe(false);
  });

  it("keeps the production prerequisite Discord alert singular and non-blocking", () => {
    const terminal = workflowJob(
      workflow("build-upload-deploy-prod.yml"),
      "notify-production-prerequisite-failure"
    );
    const discord = terminal.steps.filter(({ uses }) =>
      uses?.startsWith("sarisia/actions-status-discord@")
    );

    expect(discord).toHaveLength(1);
    expect(discord[0]?.["continue-on-error"]).toBe(true);
  });

  it.each([
    ["staging", "release-bus-deploy-staging.yml"],
    ["prod", "release-bus-deploy-production.yml"],
  ] as const)(
    "keeps valid %s operation identities on the strict immutable-artifact path",
    (environment, file) => {
      const parsed = workflow(file);
      const deploy = workflowJob(parsed, "deploy");
      const inputNames = Object.keys(parsed.on.workflow_dispatch?.inputs ?? {});
      const authorizationIndex = deploy.steps.findIndex(
        ({ name }) => name === "Authorize immutable Release Bus operation"
      );
      const artifactIndex = deploy.steps.findIndex(
        ({ name }) => name === "Download immutable preflight artifact"
      );
      const authorization = deploy.steps[authorizationIndex]?.run ?? "";

      expect(inputNames).toEqual(
        expect.arrayContaining([
          "release_train_id",
          "operation_key",
          "expected_sha",
          "artifact_run_id",
          "artifact_digest",
        ])
      );
      expect(authorization).toContain("/deploy/release-bus-v2/authorize");
      expect(authorization).toContain(`environment:"${environment}"`);
      expect(authorization).toContain("workflow_run_id:$workflow_run_id");
      expect(authorizationIndex).toBeGreaterThanOrEqual(0);
      expect(authorizationIndex).toBeLessThan(artifactIndex);
      expect(
        deploy.steps.slice(0, authorizationIndex).some(({ uses }) => uses)
      ).toBe(false);
    }
  );
});
