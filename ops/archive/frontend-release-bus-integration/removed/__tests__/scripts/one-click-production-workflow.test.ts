import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const { OUTPUT_FIELDS } =
  require("../../ops/scripts/run-one-click-production-children.cjs") as {
    OUTPUT_FIELDS: readonly string[];
  };

const workflow = (name: string) =>
  YAML.parse(
    fs.readFileSync(
      path.join(process.cwd(), ".github", "workflows", name),
      "utf8"
    )
  );

const source = (name: string) =>
  fs.readFileSync(
    path.join(process.cwd(), ".github", "workflows", name),
    "utf8"
  );

const stepIndex = (
  job: { readonly steps: readonly { readonly name?: string }[] },
  name: string
) => job.steps.findIndex((step) => step.name === name);

describe("one-click production operation", () => {
  const deploySource = source("build-upload-deploy-prod.yml");
  const deploy = workflow("build-upload-deploy-prod.yml");

  it("acquires and binds authority before any checkout, artifact, or cloud action", () => {
    const acquire = deploy.jobs["acquire-production-authority"];
    const serialized = JSON.stringify(acquire);

    expect(acquire.needs).toBeUndefined();
    expect(acquire.permissions).toEqual({});
    expect(acquire.steps).toHaveLength(1);
    expect(serialized).toContain(
      "/deploy/release-bus-v2/production-authority/acquire-bind"
    );
    expect(serialized).toContain("frontend-prod-${GITHUB_RUN_ID}");
    expect(serialized).toContain("selection_digest:null");
    expect(serialized).toContain("workflow_run_id:$workflow_run_id");
    expect(serialized.match(/--retry 4 --retry-all-errors/g)).toHaveLength(1);
    expect(serialized).not.toMatch(
      /actions\/checkout|configure-aws-credentials|aws |download-artifact|production-artifact/i
    );
  });

  it("resolves operation-bound builder and verifier children without newest-run discovery", () => {
    const resolve = deploy.jobs["resolve-production-artifact"];
    const serialized = JSON.stringify(resolve);
    const childContract = fs.readFileSync(
      path.join(
        process.cwd(),
        "ops",
        "scripts",
        "one-click-production-children.cjs"
      ),
      "utf8"
    );

    expect(resolve.needs).toBe("acquire-production-authority");
    expect(resolve.permissions).toMatchObject({
      actions: "write",
      contents: "read",
    });
    expect(serialized).toContain("run-one-click-production-children.cjs");
    expect(serialized).not.toContain(
      "run-one-click-production-children.cjs run"
    );
    expect(childContract).toContain("production-build-artifact.yml");
    expect(childContract).toContain("production-artifact-verifier.yml");
    expect(childContract).toContain("frontend-prod-${normalizedParentRunId}");
    expect(resolve.outputs).toMatchObject({
      "artifact-run-attempt":
        "${{ steps.children.outputs.builder_run_attempt }}",
      "artifact-run-id": "${{ steps.children.outputs.builder_run_id }}",
    });
    for (const expression of Object.values(resolve.outputs)) {
      const match = String(expression).match(
        /^\$\{\{ steps\.children\.outputs\.([a-z0-9_]+) \}\}$/u
      );
      expect(match).not.toBeNull();
      expect(OUTPUT_FIELDS).toContain(match?.[1]);
    }
    expect(`${serialized}\n${childContract}`).not.toMatch(
      /sort_by\(|created_at|\|\s*last/
    );
  });

  it("uploads operation evidence before reauthorization and keeps reauthorization immediately before AWS", () => {
    const job = deploy.jobs["build-upload-deploy"];
    const serialized = JSON.stringify(job);
    const verifySelection = stepIndex(
      job,
      "Verify immutable production artifact selection"
    );
    const downloadSelection = job.steps.find(
      (step: { readonly name?: string }) =>
        step.name === "Download immutable production artifact selection"
    );
    const downloadArtifact = job.steps.find(
      (step: { readonly name?: string }) =>
        step.name === "Download exact selected production artifact"
    );
    const checkout = job.steps.find(
      (step: { readonly name?: string }) => step.name === "Checkout code"
    );
    const verifyPackage = stepIndex(job, "Verify selected production artifact");
    const operationCreate = stepIndex(
      job,
      "Create production operation evidence"
    );
    const operationUpload = stepIndex(
      job,
      "Upload production operation evidence"
    );
    const reauthorize = stepIndex(job, "Reauthorize exact production mutation");
    const aws = stepIndex(job, "Configure AWS Credentials");

    expect(job.needs).toEqual([
      "acquire-production-authority",
      "resolve-production-artifact",
    ]);
    expect(checkout?.with).toMatchObject({
      ref: "${{ github.sha }}",
      "persist-credentials": false,
    });
    expect(verifySelection).toBeGreaterThan(-1);
    expect(downloadSelection?.run).toMatch(
      /rm -rf \.one-click-production\/selection\s+mkdir -p \.one-click-production\/selection/
    );
    expect(downloadSelection?.run).toContain(
      "validate-selection-archive-members"
    );
    expect(
      downloadSelection?.run.indexOf("validate-selection-archive-members")
    ).toBeLessThan(downloadSelection?.run.indexOf("unzip -q") ?? -1);
    expect(downloadArtifact?.run).toMatch(
      /rm -rf production-artifact\s+mkdir -p production-artifact/
    );
    expect(downloadArtifact?.run).toContain("validate-archive-members");
    expect(downloadArtifact?.run).toContain(
      "zip-container overhead above the 500 MiB package limit"
    );
    expect(verifyPackage).toBeGreaterThan(verifySelection);
    expect(operationCreate).toBeGreaterThan(verifyPackage);
    expect(operationUpload).toBe(operationCreate + 1);
    expect(reauthorize).toBeGreaterThan(verifyPackage);
    expect(operationUpload).toBeLessThan(reauthorize);
    expect(reauthorize).toBe(aws - 1);
    expect(aws).toBeGreaterThan(reauthorize);
    expect(
      job.steps.filter(
        (step: { readonly name?: string }) =>
          step.name === "Create production operation evidence"
      )
    ).toHaveLength(1);
    expect(
      job.steps.filter(
        (step: { readonly name?: string }) =>
          step.name === "Upload production operation evidence"
      )
    ).toHaveLength(1);
    expect(serialized).toContain("verify-selection");
    expect(serialized).toContain(
      "/deploy/release-bus-v2/production-authority/reauthorize"
    );
    expect(serialized.match(/--retry 4 --retry-all-errors/g)).toHaveLength(1);
    expect(serialized).toContain("selection_digest:$selection_digest");
    expect(serialized).not.toContain("Install dependencies");
    expect(serialized).not.toContain("Build App");
    expect(serialized).not.toContain("latest_main_sha");
  });

  it("delegates terminal failure release to the isolated listener", () => {
    const deployJob = deploy.jobs["build-upload-deploy"];
    const operationEvidence = deployJob.steps.find(
      (step: { readonly name?: string }) =>
        step.name === "Upload production operation evidence"
    );

    expect(operationEvidence).toBeDefined();
    expect(deploy.jobs["fail-production-authority"]).toBeUndefined();
    expect(deploySource).not.toContain(
      "/deploy/release-bus-v2/production-authority/fail"
    );
    expect(deploySource).not.toContain(
      "/deploy/release-bus-v2/production-authority/complete"
    );
  });

  it("binds completion to the exact deploy-triggered E2E run", () => {
    const e2eSource = source("production-e2e.yml");
    const completionSource = source("production-authority-complete.yml");
    const completion = workflow("production-authority-complete.yml");

    expect(e2eSource).toContain(
      "format('automatic {0}', inputs.automatic_deploy_run_id)"
    );
    expect(completion.on.workflow_run.workflows).toEqual([
      "Production E2E",
      "Web Deploy - PROD",
    ]);
    expect(completionSource).toContain(
      "/deploy/release-bus-v2/production-authority/complete"
    );
    expect(completionSource).toContain(
      "/deploy/release-bus-v2/production-authority/fail"
    );
    expect(completionSource).toContain("ref: ${{ github.workflow_sha }}");
    expect(completionSource).toContain(
      ".authority-listener/ops/scripts/production-authority-failure-evidence.cjs"
    );
    expect(completionSource).toContain(
      "^Production\\ E2E\\ automatic\\ ([1-9][0-9]{0,19})$"
    );
    expect(completionSource).toContain("qualifier_workflow_run_id");
    expect(completionSource).toContain("evidence_digest");
  });
});
