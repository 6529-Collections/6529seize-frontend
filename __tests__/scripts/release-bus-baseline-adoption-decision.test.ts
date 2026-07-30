import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const {
  decide,
  exactDecision,
} = require("../../scripts/release-bus-baseline-adoption-decision.cjs");
const YAML = require("yaml");

const SHA = "a".repeat(40);
const INTENT_ID = "8af60034-9741-4b9d-bb1c-80b483f75455";
const NOW = 1_900_000_000_000;

function environment(outputPath: string) {
  return {
    RELEASE_BUS_API_URL: "http://127.0.0.1:9876",
    RELEASE_BUS_WORKFLOW_AUTH_TOKEN: "workflow-secret",
    GITHUB_RUN_ID: "12345",
    DEPLOY_WORKFLOW_RUN_ID: "67890",
    DEPLOYED_REF: "1a-staging",
    DEPLOYED_SHA: SHA,
    GITHUB_OUTPUT: outputPath,
  };
}

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe("baseline-adoption automatic E2E decision client", () => {
  let directory: string;
  let outputPath: string;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "rb2-decision-"));
    outputPath = path.join(directory, "github-output");
  });

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it("preserves ordinary legacy E2E on the exact no-intent response", async () => {
    const fetchImpl = jest.fn(async (_url, request) => {
      expect(request).toMatchObject({
        method: "POST",
        headers: {
          authorization: "Bearer workflow-secret",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          e2e_workflow_run_id: "12345",
          deploy_workflow_run_id: "67890",
          deployed_ref: "1a-staging",
          deployed_sha: SHA,
        }),
      });
      return response({
        decision: "LEGACY",
        adoption_id: null,
        operation_key: null,
        expires_at: null,
      });
    });

    await expect(
      decide(environment(outputPath), fetchImpl, NOW)
    ).resolves.toEqual({
      decision: "LEGACY",
      manifestReady: false,
    });
    expect(fs.readFileSync(outputPath, "utf8")).toBe(
      "decision=LEGACY\nmanifest_ready=false\n"
    );
  });

  it("writes an exact DEFERRED decision without manufacturing evidence", async () => {
    const fetchImpl = jest.fn(async () =>
      response({
        decision: "DEFERRED",
        adoption_id: INTENT_ID,
        operation_key: `rb2:${INTENT_ID}:baseline-adoption-e2e:staging:a1`,
        expires_at: NOW + 60_000,
        manifest_ready: false,
      })
    );

    await expect(
      decide(environment(outputPath), fetchImpl, NOW)
    ).resolves.toEqual({
      decision: "DEFERRED",
      manifestReady: false,
    });
    expect(fs.readFileSync(outputPath, "utf8")).toContain("decision=DEFERRED");
  });

  it("keeps a manifest-ready automatic callback DEFERRED so only the bound dispatch can run tests", async () => {
    const fetchImpl = jest.fn(async () =>
      response({
        decision: "DEFERRED",
        adoption_id: INTENT_ID,
        operation_key: `rb2:${INTENT_ID}:baseline-adoption-e2e:staging:a1`,
        expires_at: NOW + 60_000,
        manifest_ready: true,
      })
    );

    await expect(
      decide(environment(outputPath), fetchImpl, NOW)
    ).resolves.toEqual({
      decision: "DEFERRED",
      manifestReady: true,
    });
    expect(fs.readFileSync(outputPath, "utf8")).toBe(
      "decision=DEFERRED\nmanifest_ready=true\n"
    );
  });

  it.each([
    [
      "ambiguous or stale server rejection",
      async () => response({ error: "ambiguous" }, 409),
    ],
    [
      "expired response",
      async () =>
        response({
          decision: "DEFERRED",
          adoption_id: INTENT_ID,
          operation_key: `rb2:${INTENT_ID}:baseline-adoption-e2e:staging:a1`,
          expires_at: NOW,
          manifest_ready: false,
        }),
    ],
    [
      "identity mismatch",
      async () =>
        response({
          decision: "DEFERRED",
          adoption_id: INTENT_ID,
          operation_key: "rb2:different:baseline-adoption-e2e:staging:a1",
          expires_at: NOW + 60_000,
          manifest_ready: false,
        }),
    ],
    [
      "non-v4 operation identity",
      async () =>
        response({
          decision: "DEFERRED",
          adoption_id: "8af60034-9741-3b9d-bb1c-80b483f75455",
          operation_key:
            "rb2:8af60034-9741-3b9d-bb1c-80b483f75455:baseline-adoption-e2e:staging:a1",
          expires_at: NOW + 60_000,
          manifest_ready: false,
        }),
    ],
  ])("fails closed on %s", async (_label, fetchImpl) => {
    await expect(
      decide(environment(outputPath), jest.fn(fetchImpl), NOW)
    ).rejects.toThrow();
    expect(fs.existsSync(outputPath)).toBe(false);
  });

  it("rejects malformed deployment identity before network access", async () => {
    const fetchImpl = jest.fn();
    await expect(
      decide(
        { ...environment(outputPath), DEPLOYED_REF: "main" },
        fetchImpl,
        NOW
      )
    ).rejects.toThrow("identity is malformed");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("requires exact nulls for the ordinary legacy response", () => {
    expect(() =>
      exactDecision(
        {
          decision: "LEGACY",
          adoption_id: INTENT_ID,
          operation_key: null,
          expires_at: null,
        },
        NOW
      )
    ).toThrow("malformed");
  });

  it("gates the expensive staging suite on LEGACY while bound dispatch remains unchanged", () => {
    const workflow = fs.readFileSync(
      path.join(process.cwd(), ".github/workflows/staging-e2e.yml"),
      "utf8"
    );
    expect(workflow).toContain("baseline-adoption-decision:");
    expect(workflow).toContain(
      "run: node scripts/release-bus-baseline-adoption-decision.cjs"
    );
    expect(workflow).toContain("needs: baseline-adoption-decision");
    expect(workflow).toContain(
      "needs.baseline-adoption-decision.outputs.decision == 'LEGACY'"
    );
    expect(workflow).toContain("github.event_name == 'workflow_dispatch'");
    expect(workflow).toContain("cancel-in-progress: false");
    expect(
      workflow.match(/name: Run staging packs against staging\.6529\.io/g)
    ).toHaveLength(1);
    expect(workflow).not.toContain(
      "continue-on-error: true\n        env:\n          DEPLOYED_REF"
    );

    const parsed = YAML.parse(workflow);
    expect(Object.keys(parsed.jobs)).toEqual([
      "baseline-adoption-decision",
      "staging-packs",
    ]);
    expect(parsed.jobs["staging-packs"].needs).toBe(
      "baseline-adoption-decision"
    );
    expect(parsed.jobs["staging-packs"].if).toContain(
      "needs.baseline-adoption-decision.outputs.decision == 'LEGACY'"
    );
    expect(parsed.jobs["staging-packs"].if).not.toContain("DEFERRED");
    expect(parsed.jobs["baseline-adoption-decision"].steps).toHaveLength(2);
    expect(
      parsed.jobs["baseline-adoption-decision"].steps[0].with
    ).toMatchObject({
      ref: "${{ github.workflow_sha }}",
      "persist-credentials": false,
    });
    expect(
      parsed.jobs["baseline-adoption-decision"].steps[1].env
    ).toMatchObject({
      DEPLOYED_REF: "${{ github.event.workflow_run.head_branch }}",
      DEPLOYED_SHA: "${{ github.event.workflow_run.head_sha }}",
      DEPLOY_WORKFLOW_RUN_ID: "${{ github.event.workflow_run.id }}",
    });
    expect(workflow).not.toMatch(/\b(?:sleep|setInterval|setTimeout)\b/);
  });
});
