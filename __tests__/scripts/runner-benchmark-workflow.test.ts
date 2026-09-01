import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";

const {
  DEFAULT_COMPLETION_TIMEOUT_SECONDS,
  DEFAULT_TIMEOUT_SECONDS,
  PINNED_PNPM_VERSION,
  MAX_REPEAT_COUNT,
  CONTROLLER_RUN_ATTEMPT,
  buildRequestId,
  calculateControllerTimeoutMinutes,
  MAX_TIMEOUT_SECONDS,
  MIN_TIMEOUT_SECONDS,
  normalizeCandidateInputs,
  normalizeCommonEvidence,
  normalizeControllerEvidence,
  normalizeInputs,
  selectRunnerLabel,
  validateContract,
  validateControllerRunMetadata,
  validateRunMetadata,
  validateTrustedSource,
  verifyCandidateEvidence,
  writeControllerEvidence,
  writeEvidence,
} = require("../../ops/scripts/runner-benchmark.cjs") as {
  DEFAULT_COMPLETION_TIMEOUT_SECONDS: number;
  DEFAULT_TIMEOUT_SECONDS: number;
  PINNED_PNPM_VERSION: string;
  MAX_REPEAT_COUNT: number;
  CONTROLLER_RUN_ATTEMPT: number;
  buildRequestId: (input: Record<string, unknown>) => string;
  calculateControllerTimeoutMinutes: (input: Record<string, unknown>) => number;
  MAX_TIMEOUT_SECONDS: number;
  MIN_TIMEOUT_SECONDS: number;
  normalizeCandidateInputs: (
    input: Record<string, unknown>
  ) => Record<string, unknown>;
  normalizeCommonEvidence: (
    input: Record<string, unknown>
  ) => Record<string, unknown>;
  normalizeControllerEvidence: (
    input: Record<string, unknown>
  ) => Record<string, unknown>;
  normalizeInputs: (input: Record<string, unknown>) => Record<string, unknown>;
  selectRunnerLabel: (input: Record<string, unknown>) => string;
  validateContract: (root?: string) => Record<string, string>;
  validateControllerRunMetadata: (
    run: Record<string, unknown>,
    input: Record<string, unknown>
  ) => Record<string, unknown>;
  validateRunMetadata: (
    run: Record<string, unknown>,
    input: Record<string, unknown>
  ) => Record<string, unknown>;
  validateTrustedSource: (
    input: Record<string, unknown>
  ) => Record<string, string>;
  verifyCandidateEvidence: (
    input: Record<string, unknown>,
    expected: Record<string, unknown>
  ) => Record<string, unknown>;
  writeControllerEvidence: (
    inputPath: string,
    outputDir: string
  ) => { digest: string };
  writeEvidence: (inputPath: string, outputDir: string) => { digest: string };
};

const readWorkflow = (name: string) =>
  fs.readFileSync(
    path.join(process.cwd(), ".github", "workflows", name),
    "utf8"
  );

interface WorkflowTrigger {
  readonly inputs: Readonly<Record<string, unknown>>;
}

interface WorkflowEnvironment extends Readonly<Record<string, unknown>> {
  readonly GH_TOKEN?: unknown;
}

interface WorkflowJob {
  readonly "runs-on": string;
  readonly "timeout-minutes"?: number | string;
  readonly permissions: Readonly<Record<string, string>>;
  readonly env?: WorkflowEnvironment;
  readonly steps: readonly unknown[];
  readonly [key: string]: unknown;
}

interface ControllerWorkflowDocument {
  readonly on: {
    readonly workflow_dispatch: WorkflowTrigger;
  };
  readonly permissions: Readonly<Record<string, string>>;
  readonly jobs: {
    readonly validate: WorkflowJob;
    readonly dispatch: WorkflowJob;
  };
}

interface CandidateWorkflowDocument {
  readonly on: {
    readonly workflow_dispatch: WorkflowTrigger;
    readonly workflow_call: WorkflowTrigger;
    readonly pull_request?: WorkflowTrigger;
    readonly pull_request_target?: WorkflowTrigger;
  };
  readonly permissions: Readonly<Record<string, string>>;
  readonly jobs: {
    readonly authorize: WorkflowJob;
    readonly benchmark: WorkflowJob;
    readonly verify: WorkflowJob;
  };
}

interface CandidateInputFixture {
  readonly eventName: string;
  readonly sourceSha: string;
  readonly candidateLabel: string;
  readonly timeoutSeconds: number;
  readonly completionTimeoutSeconds: number;
  readonly profile: string;
  readonly repeatNumber: number;
  readonly repeatCount: number;
  readonly controllerRunId: string;
  readonly controllerRunAttempt: number;
  readonly controllerNonce: string;
  readonly requestId?: string;
}

const SOURCE_SHA = "a".repeat(40);
const MAIN_SHA = "b".repeat(40);
const CONTROLLER_NONCE = "c".repeat(32);
const CONTROLLER_RUN_ID = "123";
const REQUEST_ID = buildRequestId({
  sourceSha: SOURCE_SHA,
  candidateLabel: "linux-16-vcpu",
  timeoutSeconds: DEFAULT_TIMEOUT_SECONDS,
  completionTimeoutSeconds: DEFAULT_COMPLETION_TIMEOUT_SECONDS,
  profile: "candidate",
  repeatNumber: 1,
  repeatCount: 1,
  controllerRunId: CONTROLLER_RUN_ID,
  controllerRunAttempt: CONTROLLER_RUN_ATTEMPT,
  controllerNonce: CONTROLLER_NONCE,
});
const CONTROL_REQUEST_ID = buildRequestId({
  sourceSha: SOURCE_SHA,
  candidateLabel: "ubuntu-latest",
  timeoutSeconds: DEFAULT_TIMEOUT_SECONDS,
  completionTimeoutSeconds: DEFAULT_COMPLETION_TIMEOUT_SECONDS,
  profile: "control",
  repeatNumber: 1,
  repeatCount: 1,
  controllerRunId: CONTROLLER_RUN_ID,
  controllerRunAttempt: CONTROLLER_RUN_ATTEMPT,
  controllerNonce: CONTROLLER_NONCE,
});

const candidateInputs = (overrides: Partial<CandidateInputFixture> = {}) => {
  const values: CandidateInputFixture = {
    eventName: "workflow_dispatch",
    sourceSha: SOURCE_SHA,
    candidateLabel: "linux-16-vcpu",
    timeoutSeconds: DEFAULT_TIMEOUT_SECONDS,
    completionTimeoutSeconds: DEFAULT_COMPLETION_TIMEOUT_SECONDS,
    profile: "candidate",
    repeatNumber: 1,
    repeatCount: 1,
    controllerRunId: CONTROLLER_RUN_ID,
    controllerRunAttempt: CONTROLLER_RUN_ATTEMPT,
    controllerNonce: CONTROLLER_NONCE,
    ...overrides,
  };
  return {
    ...values,
    requestId:
      values.requestId ??
      buildRequestId({
        sourceSha: values.sourceSha,
        candidateLabel:
          values.eventName === "workflow_call"
            ? "ubuntu-latest"
            : values.candidateLabel,
        timeoutSeconds: values.timeoutSeconds,
        completionTimeoutSeconds: values.completionTimeoutSeconds,
        profile:
          values.eventName === "workflow_call" ? "control" : values.profile,
        repeatNumber: values.repeatNumber,
        repeatCount: values.repeatCount,
        controllerRunId: values.controllerRunId,
        controllerRunAttempt: values.controllerRunAttempt,
        controllerNonce: values.controllerNonce,
      }),
  };
};

describe("runner benchmark workflow boundary", () => {
  const controllerSource = readWorkflow("runner-benchmark.yml");
  const candidateSource = readWorkflow("runner-benchmark-candidate.yml");
  const controller = YAML.parse(controllerSource) as ControllerWorkflowDocument;
  const candidate = YAML.parse(candidateSource) as CandidateWorkflowDocument;

  it("is manually dispatched from main with strict, bounded inputs", () => {
    expect(controller["on"]).toEqual({
      workflow_dispatch: expect.objectContaining({
        inputs: expect.objectContaining({
          source_sha: expect.objectContaining({
            required: true,
            type: "string",
          }),
          candidate_label: expect.objectContaining({
            required: true,
            type: "string",
          }),
          timeout_seconds: expect.objectContaining({
            required: true,
            default: DEFAULT_TIMEOUT_SECONDS,
            type: "number",
          }),
          completion_timeout_seconds: expect.objectContaining({
            required: true,
            default: DEFAULT_COMPLETION_TIMEOUT_SECONDS,
            type: "number",
          }),
          profile: expect.objectContaining({
            required: true,
            options: ["control", "candidate"],
          }),
          repeat_count: expect.objectContaining({
            required: true,
            default: 1,
            type: "number",
          }),
        }),
      }),
    });
    expect(controller["jobs"].validate["runs-on"]).toBe("ubuntu-latest");
    expect(controller["jobs"].dispatch["runs-on"]).toBe("ubuntu-latest");
    expect(controller["permissions"]).toEqual({ contents: "read" });
    expect(controller["jobs"].validate["permissions"]).toEqual({
      contents: "read",
    });
    expect(controller["jobs"].dispatch["permissions"]).toEqual({
      contents: "read",
      actions: "write",
    });
    expect(controllerSource).toContain('test "$GITHUB_REF" = "$EXPECTED_REF"');
    expect(controllerSource).toContain("candidate_timeout");
    expect(controllerSource).toContain("status=unavailable");
    expect(controllerSource).toContain("actions/runs/$run_id/cancel");
    expect(controllerSource).toContain("randomBytes(16)");
    expect(controllerSource).toContain("reconcile_pending");
    expect(controllerSource).toContain("candidate_metadata_mismatch");
    expect(controllerSource).toContain('test "$GITHUB_RUN_ATTEMPT" = "1"');
    expect(controllerSource).toContain("request-id");
    expect(controllerSource).toContain("controller_run_attempt");
    expect(controllerSource).toContain(
      "timeout-minutes: ${{ fromJSON(needs.validate.outputs.controller_timeout_minutes) }}"
    );
    expect(controllerSource).toContain("Unexpected normalized output key");
    expect(controllerSource).toContain('test("^[^=\\\\r\\\\n]*$")');
    expect(controllerSource).toContain(
      'jq -e \'type == "object" and (.needs_reconciliation | type == "boolean")\''
    );
    expect(controllerSource).not.toContain("set +e");
    expect(controllerSource).not.toContain(
      ".failure_class // candidate_delayed_accepted"
    );
  });

  it("accepts only trusted source refs and keeps the candidate read-only", () => {
    expect(candidate["on"]).toEqual(
      expect.objectContaining({
        workflow_dispatch: expect.any(Object),
        workflow_call: expect.any(Object),
      })
    );
    expect(candidate["on"]["pull_request"]).toBeUndefined();
    expect(candidate["on"]["pull_request_target"]).toBeUndefined();
    expect(candidate["permissions"]).toEqual({
      contents: "read",
      actions: "read",
    });
    expect(candidate["on"]["workflow_dispatch"].inputs).toEqual(
      expect.objectContaining({
        controller_run_id: expect.objectContaining({
          required: true,
          type: "string",
        }),
        controller_run_attempt: expect.objectContaining({
          required: true,
          type: "number",
        }),
      })
    );
    expect(candidate["jobs"].authorize["runs-on"]).toBe("ubuntu-latest");
    expect(candidate["jobs"].benchmark["permissions"]).toEqual({
      contents: "read",
      actions: "none",
      packages: "read",
    });
    expect(candidate["jobs"].verify["runs-on"]).toBe("ubuntu-latest");
    expect(candidate["jobs"].verify["permissions"]).toEqual({
      contents: "read",
      actions: "read",
    });
    expect(candidate["jobs"].benchmark["runs-on"]).toBe(
      "${{ needs.authorize.outputs.runner_label }}"
    );
    expect(candidate["jobs"].benchmark["timeout-minutes"]).toBe(35);
    expect(candidate["jobs"].benchmark["runs-on"]).not.toContain(
      "inputs.candidate_label"
    );
    expect(candidateSource).toContain(
      "ref: ${{ steps.normalized.outputs.source_sha }}"
    );
    expect(candidateSource).toContain("ref: ${{ github.workflow_sha }}");
    expect(candidateSource).toContain("git merge-base --is-ancestor");
    expect(candidateSource).toContain("persist-credentials: false");
    expect(candidateSource).toContain("validate-candidate");
    expect(candidateSource).toContain("verify-controller-run");
    expect(candidateSource).toContain("verify-evidence");
    expect(candidateSource).toContain("github-actions[bot]");
    expect(candidateSource).toContain("controller_run_attempt");
    expect(candidateSource).toContain(
      "direct human candidate dispatch is unsupported"
    );
    expect(candidateSource).toContain("source execution is blocked");
    expect(candidateSource).toContain("Write untrusted benchmark observation");
    expect(candidateSource).toContain("actions/download-artifact@");
    expect(candidateSource).toContain("completion_timeout_seconds");
    expect(candidateSource).toContain("repeat_count");
    expect(candidateSource).toContain("steps.normalized.outputs.profile");
    expect(candidateSource).toContain(
      "corepack prepare pnpm@10.33.0 --activate"
    );
    expect(
      candidateSource.match(/test "\$\(pnpm --version\)" = "10\.33\.0"/g)
    ).toHaveLength(2);
    expect(candidateSource).toContain("Unexpected normalized output key");
    expect(candidateSource).toContain('test("^[^=\\\\r\\\\n]*$")');
    expect(candidateSource).toContain(
      "profile|event_name|repeat_number|repeat_count"
    );
    expect(candidateSource).toContain("actions/upload-artifact@");
    expect(candidateSource).toContain("retention-days: 30");
    expect(candidateSource).toContain("metadata_verified: false");
  });

  it("does not expose deployment authority to either workflow", () => {
    for (const source of [controllerSource, candidateSource]) {
      expect(source).not.toContain("secrets.");
      expect(source).not.toContain("contents: write");
      expect(source).not.toContain("id-token:");
      expect(source).not.toContain("deploy-staging.yml");
      expect(source).not.toContain("build-upload-deploy-prod.yml");
      expect(source).not.toContain("pull_request_target");
      expect(source).not.toContain("ALCHEMY_API_KEY");
      expect(source).not.toContain("GIPHY_API_KEY");
      expect(source).not.toContain("SENTRY_AUTH_TOKEN");
    }
  });

  it("keeps GH_TOKEN out of dependency and build steps", () => {
    expect(candidate["jobs"].benchmark.env).toBeUndefined();
    expect(controller["jobs"].dispatch.env?.GH_TOKEN).toBeUndefined();
    const candidateSteps = candidate["jobs"].benchmark.steps as Array<{
      name?: string;
      env?: WorkflowEnvironment;
    }>;
    for (const step of candidateSteps) {
      expect(step.env?.GH_TOKEN).toBeUndefined();
      if (
        step.name?.includes("Install frozen dependencies") ||
        step.name?.includes("Build exact source")
      ) {
        expect(step.env?.GH_TOKEN).toBeUndefined();
      }
    }
    const verifierSteps = candidate["jobs"].verify.steps as Array<{
      name?: string;
      env?: WorkflowEnvironment;
    }>;
    const metadataStep = verifierSteps.find((step) =>
      step.name?.includes("Verify run identity")
    );
    expect(metadataStep?.env?.GH_TOKEN).toContain("github.token");
    expect(
      candidateSource.indexOf("Write untrusted benchmark observation")
    ).toBeLessThan(
      candidateSource.indexOf("Verify run identity and untrusted observation")
    );
    const controllerSteps = controller["jobs"].dispatch.steps as Array<{
      name?: string;
      env?: WorkflowEnvironment;
    }>;
    expect(
      controllerSteps.find((step) => step.name?.includes("Write immutable"))
        ?.env?.GH_TOKEN
    ).toBeUndefined();
  });

  it("validates control/candidate labels, exact SHAs, timeouts, and repeats", () => {
    expect(
      normalizeInputs({
        sourceSha: SOURCE_SHA,
        candidateLabel: "ubuntu-latest",
        timeoutSeconds: DEFAULT_TIMEOUT_SECONDS,
        profile: "control",
        repeatCount: 1,
      })
    ).toMatchObject({ profile: "control", candidate_label: "ubuntu-latest" });
    expect(
      normalizeInputs({
        sourceSha: SOURCE_SHA,
        candidateLabel: "linux-16-vcpu",
        timeoutSeconds: MAX_TIMEOUT_SECONDS,
        profile: "candidate",
        repeatCount: MAX_REPEAT_COUNT,
      })
    ).toMatchObject({ profile: "candidate", candidate_label: "linux-16-vcpu" });

    expect(() =>
      normalizeInputs({
        sourceSha: SOURCE_SHA.toUpperCase(),
        candidateLabel: "linux-16-vcpu",
        timeoutSeconds: DEFAULT_TIMEOUT_SECONDS,
        profile: "candidate",
        repeatCount: 1,
      })
    ).toThrow();
    expect(() =>
      normalizeInputs({
        sourceSha: SOURCE_SHA,
        candidateLabel: "candidate runner",
        timeoutSeconds: DEFAULT_TIMEOUT_SECONDS,
        profile: "candidate",
        repeatCount: 1,
      })
    ).toThrow();
    expect(() =>
      normalizeInputs({
        sourceSha: SOURCE_SHA,
        candidateLabel: "linux-16-vcpu",
        timeoutSeconds: MIN_TIMEOUT_SECONDS - 1,
        profile: "candidate",
        repeatCount: 1,
      })
    ).toThrow();
    expect(() =>
      normalizeInputs({
        sourceSha: SOURCE_SHA,
        candidateLabel: "linux-16-vcpu",
        timeoutSeconds: DEFAULT_TIMEOUT_SECONDS,
        profile: "candidate",
        repeatCount: MAX_REPEAT_COUNT + 1,
      })
    ).toThrow();
  });

  it("validates candidate dispatches and makes reusable calls truthful control runs", () => {
    expect(normalizeCandidateInputs(candidateInputs())).toMatchObject({
      event_name: "workflow_dispatch",
      profile: "candidate",
      candidate_label: "linux-16-vcpu",
      repeat_number: 1,
      repeat_count: 1,
    });
    expect(
      normalizeCandidateInputs(
        candidateInputs({
          eventName: "workflow_call",
          requestId: buildRequestId({
            sourceSha: SOURCE_SHA,
            candidateLabel: "ubuntu-latest",
            timeoutSeconds: DEFAULT_TIMEOUT_SECONDS,
            completionTimeoutSeconds: DEFAULT_COMPLETION_TIMEOUT_SECONDS,
            profile: "control",
            repeatNumber: 1,
            repeatCount: 1,
            controllerRunId: CONTROLLER_RUN_ID,
            controllerRunAttempt: CONTROLLER_RUN_ATTEMPT,
            controllerNonce: CONTROLLER_NONCE,
          }),
        })
      )
    ).toMatchObject({
      event_name: "workflow_call",
      profile: "control",
      candidate_label: "ubuntu-latest",
    });

    for (const overrides of [
      { eventName: "pull_request" },
      { profile: "control" },
      { candidateLabel: "ubuntu-latest" },
      { requestId: "runner-without-nonce" },
      { controllerNonce: CONTROLLER_NONCE.toUpperCase() },
      { repeatNumber: 2 },
      { completionTimeoutSeconds: 91 },
    ]) {
      expect(() =>
        normalizeCandidateInputs(candidateInputs(overrides))
      ).toThrow();
    }
  });

  it("keeps direct human candidate dispatches on Ubuntu and fails closed before source execution", () => {
    expect(
      selectRunnerLabel({
        eventName: "workflow_dispatch",
        actor: "maintainer",
        profile: "candidate",
        candidateLabel: "linux-16-vcpu",
        authorized: false,
      })
    ).toBe("ubuntu-latest");
    expect(
      selectRunnerLabel({
        eventName: "workflow_dispatch",
        actor: "github-actions[bot]",
        profile: "candidate",
        candidateLabel: "linux-16-vcpu",
        authorized: false,
      })
    ).toBe("ubuntu-latest");
    expect(
      selectRunnerLabel({
        eventName: "workflow_dispatch",
        actor: "github-actions[bot]",
        profile: "candidate",
        candidateLabel: "linux-16-vcpu",
        authorized: true,
      })
    ).toBe("linux-16-vcpu");
    expect(
      selectRunnerLabel({
        eventName: "workflow_call",
        actor: "github-actions[bot]",
        profile: "candidate",
        candidateLabel: "linux-16-vcpu",
        authorized: true,
      })
    ).toBe("ubuntu-latest");
  });

  it("rejects replayed or input-mutated request correlations", () => {
    for (const overrides of [
      { sourceSha: MAIN_SHA },
      { candidateLabel: "linux-32-vcpu" },
      { timeoutSeconds: MAX_TIMEOUT_SECONDS },
      { repeatCount: 2 },
      { controllerRunId: "456" },
      { controllerRunAttempt: 2 },
      {
        requestId: `runner-123-1-1-deadbeefdeadbeef-${CONTROLLER_NONCE}`,
      },
    ]) {
      expect(() =>
        normalizeCandidateInputs(
          candidateInputs({
            ...overrides,
            requestId: overrides.requestId ?? REQUEST_ID,
          })
        )
      ).toThrow(/bound|attempt|replay/i);
    }
  });

  it("does not let reusable-call evidence claim candidate capacity", () => {
    expect(
      normalizeCommonEvidence({
        source_sha: SOURCE_SHA,
        candidate_label: "linux-16-vcpu",
        timeout_seconds: DEFAULT_TIMEOUT_SECONDS,
        completion_timeout_seconds: DEFAULT_COMPLETION_TIMEOUT_SECONDS,
        profile: "candidate",
        repeat_count: 1,
        repeat: 1,
        status: "failure",
        repository: "6529-Collections/6529seize-frontend",
        workflow_sha: MAIN_SHA,
        run_id: "123",
        request_id: CONTROL_REQUEST_ID,
        controller_nonce: CONTROLLER_NONCE,
        controller_run_id: CONTROLLER_RUN_ID,
        controller_run_attempt: CONTROLLER_RUN_ATTEMPT,
        event_name: "workflow_call",
        metadata_verified: true,
        observed_at: "2026-08-05T00:00:00.000Z",
        environment: {},
      })
    ).toMatchObject({
      event_name: "workflow_call",
      profile: "control",
      candidate_label: "ubuntu-latest",
    });
  });

  it("treats source-produced observations as untrusted until the verifier rebinds them", () => {
    const raw = {
      source_sha: SOURCE_SHA,
      candidate_label: "linux-16-vcpu",
      timeout_seconds: DEFAULT_TIMEOUT_SECONDS,
      completion_timeout_seconds: DEFAULT_COMPLETION_TIMEOUT_SECONDS,
      profile: "candidate",
      repeat_count: 1,
      repeat: 1,
      status: "success",
      repository: "6529-Collections/6529seize-frontend",
      workflow_sha: MAIN_SHA,
      run_id: "123",
      request_id: REQUEST_ID,
      controller_nonce: CONTROLLER_NONCE,
      controller_run_id: CONTROLLER_RUN_ID,
      controller_run_attempt: CONTROLLER_RUN_ATTEMPT,
      event_name: "workflow_dispatch",
      metadata_verified: false,
      observed_at: "2026-08-05T00:00:00.000Z",
      timings_ms: {
        queue_ms: 10,
        setup_ms: 20,
        checkout_ms: 30,
        install_ms: 40,
        build_ms: 50,
        package_ms: 60,
      },
      environment: {
        runner_os: "Linux",
        cpu_count: 8,
        pnpm_version: PINNED_PNPM_VERSION,
      },
    };
    expect(
      verifyCandidateEvidence(raw, {
        ...candidateInputs(),
        repository: "6529-Collections/6529seize-frontend",
        workflowSha: MAIN_SHA,
        runId: "123",
        status: "success",
      })
    ).toMatchObject({ metadata_verified: true, status: "success" });
    expect(() =>
      verifyCandidateEvidence(
        { ...raw, candidate_label: "forged-runner" },
        {
          ...candidateInputs(),
          repository: "6529-Collections/6529seize-frontend",
          workflowSha: MAIN_SHA,
          runId: "123",
          status: "success",
        }
      )
    ).toThrow(/candidate_label|bound/);
    expect(() =>
      verifyCandidateEvidence(
        { ...raw, metadata_verified: true },
        {
          ...candidateInputs(),
          repository: "6529-Collections/6529seize-frontend",
          workflowSha: MAIN_SHA,
          runId: "123",
          status: "success",
        }
      )
    ).toThrow(/self-attest/);
  });

  it("keeps the repeated completion budget below the dynamic controller timeout", () => {
    const timeoutMinutes = calculateControllerTimeoutMinutes({
      timeoutSeconds: DEFAULT_TIMEOUT_SECONDS,
      completionTimeoutSeconds: DEFAULT_COMPLETION_TIMEOUT_SECONDS,
      repeatCount: MAX_REPEAT_COUNT,
    });
    expect(timeoutMinutes).toBeGreaterThan(45);
    expect(timeoutMinutes * 60).toBeGreaterThanOrEqual(
      MAX_REPEAT_COUNT *
        (DEFAULT_TIMEOUT_SECONDS + DEFAULT_COMPLETION_TIMEOUT_SECONDS)
    );
    expect(timeoutMinutes).toBeLessThanOrEqual(360);
  });

  it("accepts an exact main source or an ancestor of trusted main", () => {
    expect(
      validateTrustedSource({
        sourceSha: MAIN_SHA,
        checkedOutSha: MAIN_SHA,
        mainSha: MAIN_SHA,
        isAncestor: false,
      })
    ).toMatchObject({
      source_sha: MAIN_SHA,
      checked_out_sha: MAIN_SHA,
      main_sha: MAIN_SHA,
    });
    expect(
      validateTrustedSource({
        sourceSha: SOURCE_SHA,
        checkedOutSha: SOURCE_SHA,
        mainSha: MAIN_SHA,
        isAncestor: true,
      })
    ).toMatchObject({ source_sha: SOURCE_SHA });
  });

  it("fails closed on source mismatch or an untrusted ref", () => {
    expect(() =>
      validateTrustedSource({
        sourceSha: SOURCE_SHA,
        checkedOutSha: "c".repeat(40),
        mainSha: MAIN_SHA,
        isAncestor: true,
      })
    ).toThrow(/does not match/);
    expect(() =>
      validateTrustedSource({
        sourceSha: SOURCE_SHA,
        checkedOutSha: SOURCE_SHA,
        mainSha: MAIN_SHA,
        isAncestor: false,
      })
    ).toThrow(/ancestor/);
  });

  it("requires nonce-bound, exact candidate run metadata before control actions", () => {
    const run = {
      id: 987,
      name: "Runner benchmark candidate",
      path: ".github/workflows/runner-benchmark-candidate.yml",
      event: "workflow_dispatch",
      head_branch: "main",
      head_sha: MAIN_SHA,
      display_title: `Runner benchmark candidate / ${REQUEST_ID}`,
      run_attempt: 1,
      actor: { login: "github-actions[bot]" },
    };
    expect(
      validateRunMetadata(run, {
        eventName: "workflow_dispatch",
        workflowPath: ".github/workflows/runner-benchmark-candidate.yml",
        runId: "987",
        runAttempt: "1",
        headSha: MAIN_SHA,
        headBranch: "main",
        displayTitle: run.display_title,
        requestId: REQUEST_ID,
        controllerNonce: CONTROLLER_NONCE,
        expectedActor: "github-actions[bot]",
      })
    ).toMatchObject({
      run_id: "987",
      run_attempt: 1,
      metadata_verified: true,
    });

    for (const overrides of [
      { event: "workflow_call" },
      { head_branch: "feature" },
      { head_sha: SOURCE_SHA },
      { path: ".github/workflows/other.yml" },
      { display_title: "Runner benchmark candidate / forged" },
      { id: 988 },
      { run_attempt: undefined },
      { run_attempt: 2 },
      { actor: { login: "maintainer" } },
    ]) {
      expect(() =>
        validateRunMetadata(
          { ...run, ...overrides },
          {
            eventName: "workflow_dispatch",
            workflowPath: ".github/workflows/runner-benchmark-candidate.yml",
            runId: "987",
            runAttempt: "1",
            headSha: MAIN_SHA,
            headBranch: "main",
            displayTitle: run.display_title,
            requestId: REQUEST_ID,
            controllerNonce: CONTROLLER_NONCE,
          }
        )
      ).toThrow();
    }
  });

  it("keeps the workflow contract self-checking", () => {
    expect(validateContract()).toMatchObject({
      contract: "runner-benchmark-workflow-contract-v1",
      controller: "runner-benchmark.yml",
      candidate: "runner-benchmark-candidate.yml",
    });
  });

  it("authenticates the controller run and rejects reruns or foreign workflows", () => {
    const run = {
      id: CONTROLLER_RUN_ID,
      name: "Runner benchmark controller",
      path: ".github/workflows/runner-benchmark.yml",
      event: "workflow_dispatch",
      head_branch: "main",
      head_sha: MAIN_SHA,
      run_attempt: CONTROLLER_RUN_ATTEMPT,
      actor: { login: "maintainer" },
    };
    expect(
      validateControllerRunMetadata(run, {
        runId: CONTROLLER_RUN_ID,
        runAttempt: CONTROLLER_RUN_ATTEMPT,
        headSha: MAIN_SHA,
      })
    ).toMatchObject({
      run_id: CONTROLLER_RUN_ID,
      run_attempt: CONTROLLER_RUN_ATTEMPT,
    });
    for (const overrides of [
      { run_attempt: 2 },
      { id: "456" },
      { head_sha: SOURCE_SHA },
      { path: ".github/workflows/other.yml" },
      { name: "Other workflow" },
    ]) {
      expect(() =>
        validateControllerRunMetadata(
          { ...run, ...overrides },
          {
            runId: CONTROLLER_RUN_ID,
            runAttempt: CONTROLLER_RUN_ATTEMPT,
            headSha: MAIN_SHA,
          }
        )
      ).toThrow();
    }
  });

  it("rejects controller evidence that hides duplicate or unverified runs", () => {
    const result = {
      repeat: 1,
      request_id: REQUEST_ID,
      run_id: null,
      status: "unavailable",
      failure_class: "candidate_unavailable",
      dispatch_ms: null,
      observed_ms: 90_000,
      cancellation_requested: false,
      metadata_verified: false,
      reconciliation_pending: false,
    };
    const evidence = {
      source_sha: SOURCE_SHA,
      candidate_label: "linux-16-vcpu",
      timeout_seconds: DEFAULT_TIMEOUT_SECONDS,
      completion_timeout_seconds: DEFAULT_COMPLETION_TIMEOUT_SECONDS,
      profile: "candidate",
      repeat_count: 1,
      controller_nonce: CONTROLLER_NONCE,
      repository: "6529-Collections/6529seize-frontend",
      controller_run_id: CONTROLLER_RUN_ID,
      controller_run_attempt: CONTROLLER_RUN_ATTEMPT,
      workflow_sha: MAIN_SHA,
      observed_at: "2026-08-05T00:00:00.000Z",
      controller_elapsed_ms: 90_000,
      reconciliation_completed: true,
      cleanup_complete: true,
      results: [result],
    };
    expect(normalizeControllerEvidence(evidence)).toMatchObject({
      cleanup_complete: true,
    });
    expect(() =>
      normalizeControllerEvidence({
        ...evidence,
        reconciliation_completed: false,
      })
    ).toThrow(/reconciliation/);
    expect(() =>
      normalizeControllerEvidence({
        ...evidence,
        results: [
          {
            ...result,
            run_id: "789",
            metadata_verified: false,
          },
        ],
      })
    ).toThrow(/verified metadata/);
    expect(() =>
      normalizeControllerEvidence({
        ...evidence,
        cleanup_complete: false,
      })
    ).toThrow(/cleanup/);
    expect(() =>
      normalizeControllerEvidence({
        ...evidence,
        results: [{ ...result, reconciliation_pending: true }],
      })
    ).toThrow(/reconciliation-pending/);
  });

  it("writes hashed JSON and Markdown without accepting secret-shaped fields", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "runner-benchmark-"));
    try {
      const inputPath = path.join(root, "raw.json");
      fs.writeFileSync(
        inputPath,
        JSON.stringify({
          source_sha: SOURCE_SHA,
          candidate_label: "linux-16-vcpu",
          timeout_seconds: 90,
          completion_timeout_seconds: DEFAULT_COMPLETION_TIMEOUT_SECONDS,
          profile: "candidate",
          repeat_count: 1,
          repeat: 1,
          status: "success",
          repository: "6529-Collections/6529seize-frontend",
          workflow_sha: MAIN_SHA,
          run_id: "123",
          request_id: REQUEST_ID,
          controller_nonce: CONTROLLER_NONCE,
          controller_run_id: CONTROLLER_RUN_ID,
          controller_run_attempt: CONTROLLER_RUN_ATTEMPT,
          event_name: "workflow_dispatch",
          metadata_verified: true,
          observed_at: "2026-08-05T00:00:00.000Z",
          timings_ms: {
            queue_ms: 10,
            setup_ms: 20,
            checkout_ms: 30,
            install_ms: 40,
            build_ms: 50,
            package_ms: 60,
          },
          environment: {
            runner_os: "Linux",
            cpu_count: 8,
            pnpm_version: PINNED_PNPM_VERSION,
          },
        })
      );
      const candidateOutput = path.join(root, "candidate");
      const candidateResult = writeEvidence(inputPath, candidateOutput);
      expect(candidateResult.digest).toMatch(/^[a-f0-9]{64}$/);
      expect(
        fs.existsSync(
          path.join(candidateOutput, "runner-benchmark-evidence.json")
        )
      ).toBe(true);
      const candidateMarkdown = fs.readFileSync(
        path.join(candidateOutput, "runner-benchmark-evidence.md"),
        "utf8"
      );
      expect(candidateMarkdown).toContain("Evidence SHA-256");
      expect(candidateMarkdown).not.toContain(
        String.fromCharCode(0x00e2, 0x20ac, 0x201d)
      );

      const controllerInputPath = path.join(root, "controller.json");
      fs.writeFileSync(
        controllerInputPath,
        JSON.stringify({
          source_sha: SOURCE_SHA,
          candidate_label: "linux-16-vcpu",
          timeout_seconds: 90,
          completion_timeout_seconds: DEFAULT_COMPLETION_TIMEOUT_SECONDS,
          profile: "candidate",
          repeat_count: 1,
          controller_nonce: CONTROLLER_NONCE,
          repository: "6529-Collections/6529seize-frontend",
          controller_run_id: CONTROLLER_RUN_ID,
          controller_run_attempt: CONTROLLER_RUN_ATTEMPT,
          workflow_sha: MAIN_SHA,
          observed_at: "2026-08-05T00:00:00.000Z",
          controller_elapsed_ms: 90_000,
          results: [
            {
              repeat: 1,
              request_id: REQUEST_ID,
              controller_nonce: CONTROLLER_NONCE,
              controller_run_id: CONTROLLER_RUN_ID,
              controller_run_attempt: CONTROLLER_RUN_ATTEMPT,
              status: "unavailable",
              failure_class: "candidate_unavailable",
              dispatch_ms: null,
              observed_ms: null,
              cancellation_requested: false,
              metadata_verified: false,
              reconciliation_pending: false,
            },
          ],
          reconciliation_completed: true,
          cleanup_complete: true,
        })
      );
      const controllerOutput = path.join(root, "controller");
      expect(
        writeControllerEvidence(controllerInputPath, controllerOutput).digest
      ).toMatch(/^[a-f0-9]{64}$/);
      const controllerMarkdown = fs.readFileSync(
        path.join(controllerOutput, "runner-benchmark-controller-evidence.md"),
        "utf8"
      );
      expect(controllerMarkdown).toContain(String.fromCharCode(0x2014));
      expect(controllerMarkdown).not.toContain(
        String.fromCharCode(0x00e2, 0x20ac, 0x201d)
      );

      const secretInputPath = path.join(root, "secret.json");
      fs.writeFileSync(
        secretInputPath,
        JSON.stringify({ token: "must reject" })
      );
      expect(() =>
        writeEvidence(secretInputPath, path.join(root, "secret"))
      ).toThrow(/secret-shaped/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
