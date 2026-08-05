import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";

const {
  DEFAULT_TIMEOUT_SECONDS,
  MAX_REPEAT_COUNT,
  MAX_TIMEOUT_SECONDS,
  MIN_TIMEOUT_SECONDS,
  normalizeInputs,
  validateContract,
  validateTrustedSource,
  writeControllerEvidence,
  writeEvidence,
} = require("../../ops/scripts/runner-benchmark.cjs") as {
  DEFAULT_TIMEOUT_SECONDS: number;
  MAX_REPEAT_COUNT: number;
  MAX_TIMEOUT_SECONDS: number;
  MIN_TIMEOUT_SECONDS: number;
  normalizeInputs: (input: Record<string, unknown>) => Record<string, unknown>;
  validateContract: (root?: string) => Record<string, string>;
  validateTrustedSource: (
    input: Record<string, unknown>
  ) => Record<string, string>;
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

const SOURCE_SHA = "a".repeat(40);
const MAIN_SHA = "b".repeat(40);

describe("runner benchmark workflow boundary", () => {
  const controllerSource = readWorkflow("runner-benchmark.yml");
  const candidateSource = readWorkflow("runner-benchmark-candidate.yml");
  const controller = YAML.parse(controllerSource) as Record<string, any>;
  const candidate = YAML.parse(candidateSource) as Record<string, any>;

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
    expect(controller["permissions"]).toEqual({
      contents: "read",
      actions: "write",
    });
    expect(controllerSource).toContain('test "$GITHUB_REF" = "$EXPECTED_REF"');
    expect(controllerSource).toContain("candidate_timeout");
    expect(controllerSource).toContain("status=unavailable");
    expect(controllerSource).toContain("actions/runs/$run_id/cancel");
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
    expect(candidate["jobs"].benchmark["permissions"]).toEqual({
      contents: "read",
      actions: "read",
    });
    expect(candidate["jobs"].benchmark["runs-on"]).toContain("ubuntu-latest");
    expect(candidate["jobs"].benchmark["runs-on"]).toContain(
      "inputs.candidate_label"
    );
    expect(candidate["jobs"].benchmark["runs-on"]).toContain(
      "github.event_name == 'workflow_call'"
    );
    expect(candidateSource).toContain("ref: ${{ inputs.source_sha }}");
    expect(candidateSource).toContain("ref: ${{ github.workflow_sha }}");
    expect(candidateSource).toContain("git merge-base --is-ancestor");
    expect(candidateSource).toContain("persist-credentials: false");
    expect(candidateSource).toContain("actions/upload-artifact@");
    expect(candidateSource).toContain("retention-days: 30");
    expect(candidateSource).toContain("queue_ms: queueMs");
    expect(candidateSource).toContain("setup_ms: setupMs");
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

  it("keeps the workflow contract self-checking", () => {
    expect(validateContract()).toMatchObject({
      contract: "runner-benchmark-workflow-contract-v1",
      controller: "runner-benchmark.yml",
      candidate: "runner-benchmark-candidate.yml",
    });
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
          profile: "candidate",
          repeat_count: 1,
          repeat: 1,
          status: "success",
          repository: "6529-Collections/6529seize-frontend",
          workflow_sha: MAIN_SHA,
          run_id: "123",
          request_id: "runner-test-1",
          observed_at: "2026-08-05T00:00:00.000Z",
          timings_ms: {
            queue_ms: 10,
            setup_ms: 20,
            checkout_ms: 30,
            install_ms: 40,
            build_ms: 50,
            package_ms: 60,
          },
          environment: { runner_os: "Linux", cpu_count: 8 },
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
          profile: "candidate",
          repeat_count: 1,
          repository: "6529-Collections/6529seize-frontend",
          controller_run_id: "456",
          workflow_sha: MAIN_SHA,
          observed_at: "2026-08-05T00:00:00.000Z",
          controller_elapsed_ms: 90_000,
          results: [
            {
              repeat: 1,
              request_id: "runner-test-1",
              status: "unavailable",
              failure_class: "candidate_unavailable",
              dispatch_ms: null,
              observed_ms: null,
              cancellation_requested: false,
            },
          ],
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
