import childProcess from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const {
  decide,
  exactDecision,
  formatDecisionToken,
} = require("../../scripts/release-bus-baseline-adoption-decision.cjs");
const YAML = require("yaml");

const SHA = "a".repeat(40);
const INTENT_ID = "8af60034-9741-4b9d-bb1c-80b483f75455";
const NOW = 1_900_000_000_000;

function environment() {
  return {
    RELEASE_BUS_API_URL: "http://127.0.0.1:9876",
    RELEASE_BUS_WORKFLOW_AUTH_TOKEN: "workflow-secret",
    GITHUB_RUN_ID: "12345",
    DEPLOY_WORKFLOW_RUN_ID: "67890",
    DEPLOYED_REF: "1a-staging",
    DEPLOYED_SHA: SHA,
  };
}

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

function runAutomaticDeployResolver(conclusion: string) {
  const workflow = YAML.parse(
    fs.readFileSync(
      path.join(process.cwd(), ".github/workflows/staging-e2e.yml"),
      "utf8"
    )
  );
  const resolver = workflow.jobs["baseline-adoption-decision"].steps.find(
    ({ name }: { name?: string }) =>
      name === "Resolve successful automatic deploy"
  );
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "staging-e2e-deploy-resolver-")
  );
  try {
    const ghPath = path.join(tempDir, "gh");
    const outputPath = path.join(tempDir, "github-output");
    fs.writeFileSync(
      ghPath,
      `#!/usr/bin/env bash
set -euo pipefail
printf '%s' "$FAKE_GH_RESPONSE"
`
    );
    fs.chmodSync(ghPath, 0o755);
    const result = childProcess.spawnSync("bash", ["-c", resolver.run], {
      encoding: "utf8",
      env: {
        ...process.env,
        AUTOMATIC_DEPLOY_RUN_ID: "67890",
        FAKE_GH_RESPONSE: JSON.stringify({
          id: 67890,
          name: "Web Deploy - STAGING",
          path: ".github/workflows/deploy-staging.yml",
          event: "push",
          status: "completed",
          conclusion,
          head_branch: "1a-staging",
          head_sha: SHA,
          repository: {
            full_name: "6529-Collections/6529seize-frontend",
          },
        }),
        GH_TOKEN: "test-token",
        GITHUB_OUTPUT: outputPath,
        GITHUB_REPOSITORY: "6529-Collections/6529seize-frontend",
        PATH: `${tempDir}:${process.env["PATH"] ?? ""}`,
      },
    });
    return {
      ...result,
      output: fs.existsSync(outputPath)
        ? fs.readFileSync(outputPath, "utf8")
        : "",
    };
  } finally {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
}

function runSuccessfulDeployDispatcher(conclusion: string) {
  const workflow = YAML.parse(
    fs.readFileSync(
      path.join(process.cwd(), ".github/workflows/staging-e2e-dispatch.yml"),
      "utf8"
    )
  );
  const dispatcher = workflow.jobs["dispatch-successful-deploy"].steps[0].run;
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "staging-e2e-dispatch-")
  );
  try {
    const ghPath = path.join(tempDir, "gh");
    const payloadPath = path.join(tempDir, "payload.json");
    fs.writeFileSync(
      ghPath,
      `#!/usr/bin/env bash
set -euo pipefail
cat > "$FAKE_PAYLOAD_PATH"
`
    );
    fs.chmodSync(ghPath, 0o755);
    const result = childProcess.spawnSync("bash", ["-c", dispatcher], {
      encoding: "utf8",
      env: {
        ...process.env,
        DEFAULT_BRANCH: "main",
        DEPLOY_CONCLUSION: conclusion,
        DEPLOY_HEAD_BRANCH: "1a-staging",
        DEPLOY_HEAD_REPOSITORY: "6529-Collections/6529seize-frontend",
        DEPLOY_WORKFLOW_RUN_ID: "67890",
        FAKE_PAYLOAD_PATH: payloadPath,
        GH_TOKEN: "test-token",
        GITHUB_REPOSITORY: "6529-Collections/6529seize-frontend",
        PATH: `${tempDir}:${process.env["PATH"] ?? ""}`,
      },
    });
    return {
      ...result,
      payload: fs.existsSync(payloadPath)
        ? JSON.parse(fs.readFileSync(payloadPath, "utf8"))
        : null,
    };
  } finally {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
}

describe("baseline-adoption automatic E2E decision client", () => {
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

    await expect(decide(environment(), fetchImpl, NOW)).resolves.toEqual({
      decision: "LEGACY",
      manifestReady: false,
    });
  });

  it("returns an exact DEFERRED decision without manufacturing evidence", async () => {
    const fetchImpl = jest.fn(async () =>
      response({
        decision: "DEFERRED",
        adoption_id: INTENT_ID,
        operation_key: `rb2:${INTENT_ID}:baseline-adoption-e2e:staging`,
        expires_at: NOW + 60_000,
        manifest_ready: false,
      })
    );

    await expect(decide(environment(), fetchImpl, NOW)).resolves.toEqual({
      decision: "DEFERRED",
      manifestReady: false,
    });
  });

  it("keeps a manifest-ready automatic callback DEFERRED so only the bound dispatch can run tests", async () => {
    const fetchImpl = jest.fn(async () =>
      response({
        decision: "DEFERRED",
        adoption_id: INTENT_ID,
        operation_key: `rb2:${INTENT_ID}:baseline-adoption-e2e:staging`,
        expires_at: NOW + 60_000,
        manifest_ready: true,
      })
    );

    await expect(decide(environment(), fetchImpl, NOW)).resolves.toEqual({
      decision: "DEFERRED",
      manifestReady: true,
    });
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
          operation_key: `rb2:${INTENT_ID}:baseline-adoption-e2e:staging`,
          expires_at: NOW,
          manifest_ready: false,
        }),
    ],
    [
      "dispatcher-owned attempt suffix in the durable operation key",
      async () =>
        response({
          decision: "DEFERRED",
          adoption_id: INTENT_ID,
          operation_key: `rb2:${INTENT_ID}:baseline-adoption-e2e:staging:a1`,
          expires_at: NOW + 60_000,
          manifest_ready: false,
        }),
    ],
    [
      "double attempt suffix in the durable operation key",
      async () =>
        response({
          decision: "DEFERRED",
          adoption_id: INTENT_ID,
          operation_key: `rb2:${INTENT_ID}:baseline-adoption-e2e:staging:a1:a1`,
          expires_at: NOW + 60_000,
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
            "rb2:8af60034-9741-3b9d-bb1c-80b483f75455:baseline-adoption-e2e:staging",
          expires_at: NOW + 60_000,
          manifest_ready: false,
        }),
    ],
  ])("fails closed on %s", async (_label, fetchImpl) => {
    await expect(
      decide(environment(), jest.fn(fetchImpl), NOW)
    ).rejects.toThrow();
  });

  it("rejects malformed deployment identity before network access", async () => {
    const fetchImpl = jest.fn();
    await expect(
      decide({ ...environment(), DEPLOYED_REF: "main" }, fetchImpl, NOW)
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

  it.each([
    [{ decision: "LEGACY", manifestReady: false }, "LEGACY:false\n"],
    [{ decision: "DEFERRED", manifestReady: false }, "DEFERRED:false\n"],
    [{ decision: "DEFERRED", manifestReady: true }, "DEFERRED:true\n"],
  ])("formats the exact workflow token for %j", (decision, expected) => {
    expect(formatDecisionToken(decision)).toBe(expected);
  });

  it("dispatches automatic E2E only from a successful exact staging deploy", () => {
    const workflow = fs.readFileSync(
      path.join(process.cwd(), ".github/workflows/staging-e2e.yml"),
      "utf8"
    );
    const dispatchWorkflow = fs.readFileSync(
      path.join(process.cwd(), ".github/workflows/staging-e2e-dispatch.yml"),
      "utf8"
    );
    expect(workflow).toContain("baseline-adoption-decision:");
    expect(workflow).toContain(
      "./bin/6529 exec node scripts/release-bus-baseline-adoption-decision.cjs"
    );
    expect(workflow).toContain("bin/6529");
    expect(workflow).toContain("LEGACY:false)");
    expect(workflow).toContain("DEFERRED:false)");
    expect(workflow).toContain("DEFERRED:true)");
    expect(workflow).toContain(
      'if ! result="$(./bin/6529 exec node scripts/release-bus-baseline-adoption-decision.cjs)"; then'
    );
    expect(workflow).toContain("needs: baseline-adoption-decision");
    expect(workflow).toContain(
      "needs.baseline-adoption-decision.outputs.decision == 'LEGACY'"
    );
    expect(workflow).toContain("automatic_deploy_run_id:");
    expect(workflow).toContain("cancel-in-progress: false");
    expect(workflow).not.toContain("workflow_run:");
    expect(workflow).not.toContain("github.event.workflow_run");
    expect(dispatchWorkflow).toContain("actions: write");
    expect(dispatchWorkflow).toContain(
      "github.event.workflow_run.conclusion == 'success'"
    );
    expect(dispatchWorkflow).toContain(
      "actions/workflows/staging-e2e.yml/dispatches"
    );
    expect(
      workflow.match(/name: Run staging packs against staging\.6529\.io/g)
    ).toHaveLength(1);
    expect(workflow).not.toContain(
      "continue-on-error: true\n        env:\n          DEPLOYED_REF"
    );

    const parsed = YAML.parse(workflow);
    const parsedDispatcher = YAML.parse(dispatchWorkflow);
    expect(parsed.on).toEqual({
      workflow_dispatch: expect.objectContaining({
        inputs: expect.objectContaining({
          automatic_deploy_run_id: expect.objectContaining({
            required: false,
            type: "string",
          }),
        }),
      }),
    });
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
    expect(parsed.jobs["baseline-adoption-decision"].if).toBe(
      "inputs.automatic_deploy_run_id != ''"
    );
    expect(parsed.jobs["baseline-adoption-decision"].permissions).toEqual({
      actions: "read",
      contents: "read",
    });
    expect(parsed.jobs["baseline-adoption-decision"].steps).toHaveLength(6);
    expect(parsed.jobs["baseline-adoption-decision"].steps[0].run).toContain(
      'test "$PACK" = all'
    );
    expect(parsed.jobs["baseline-adoption-decision"].steps[0].run).toContain(
      'test -z "$identity_values"'
    );
    expect(parsed.jobs["baseline-adoption-decision"].steps[1].run).toContain(
      '.conclusion == "success"'
    );
    expect(parsed.jobs["baseline-adoption-decision"].steps[1].run).toContain(
      '.path == ".github/workflows/deploy-staging.yml"'
    );
    expect(parsed.jobs["baseline-adoption-decision"].steps[1].run).toContain(
      '.head_branch == "1a-staging"'
    );
    expect(
      parsed.jobs["baseline-adoption-decision"].steps[2].with
    ).toMatchObject({
      ref: "${{ github.workflow_sha }}",
      "persist-credentials": false,
    });
    expect(parsed.jobs["baseline-adoption-decision"].steps[3]).toMatchObject({
      uses: "actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020",
      with: { "node-version": "22.17.1" },
    });
    expect(parsed.jobs["baseline-adoption-decision"].steps[4].run).toContain(
      "corepack prepare"
    );
    expect(
      parsed.jobs["baseline-adoption-decision"].steps[5].env
    ).toMatchObject({
      DEPLOYED_REF: "${{ steps.deploy-run.outputs.deployed_ref }}",
      DEPLOYED_SHA: "${{ steps.deploy-run.outputs.deployed_sha }}",
      DEPLOY_WORKFLOW_RUN_ID:
        "${{ steps.deploy-run.outputs.deploy_workflow_run_id }}",
    });
    expect(parsedDispatcher.concurrency).toBeUndefined();
    expect(parsedDispatcher.on.workflow_run).toEqual({
      workflows: ["Web Deploy - STAGING"],
      types: ["completed"],
      branches: ["1a-staging"],
    });
    expect(parsedDispatcher.jobs["dispatch-successful-deploy"].if).toContain(
      "github.event.workflow_run.conclusion == 'success'"
    );
    expect(
      parsedDispatcher.jobs["dispatch-successful-deploy"].permissions
    ).toEqual({ actions: "write" });
    expect(
      parsedDispatcher.jobs["dispatch-successful-deploy"].steps
    ).toHaveLength(1);
    expect(workflow).not.toMatch(/\b(?:sleep|setInterval|setTimeout)\b/);
  });

  it("dispatches the exact successful deploy run outside the E2E lane", () => {
    const result = runSuccessfulDeployDispatcher("success");

    expect(result.status).toBe(0);
    expect(result.payload).toEqual({
      ref: "main",
      inputs: {
        automatic_deploy_run_id: "67890",
        pack: "all",
      },
    });
  });

  it.each(["failure", "cancelled", "timed_out", "skipped"])(
    "does not dispatch staging E2E for a %s deploy",
    (conclusion) => {
      const result = runSuccessfulDeployDispatcher(conclusion);

      expect(result.status).not.toBe(0);
      expect(result.payload).toBeNull();
    }
  );

  it("resolves the exact successful staging deployment identity", () => {
    const result = runAutomaticDeployResolver("success");

    expect(result.status).toBe(0);
    expect(result.output).toBe(
      `deployed_ref=1a-staging\ndeployed_sha=${SHA}\ndeploy_workflow_run_id=67890\n`
    );
  });

  it.each(["failure", "cancelled", "timed_out", "skipped"])(
    "rejects an automatic E2E dispatch for a %s deployment",
    (conclusion) => {
      const result = runAutomaticDeployResolver(conclusion);

      expect(result.status).not.toBe(0);
      expect(result.output).toBe("");
    }
  );
});
