import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

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
    expect(`${serialized}\n${childContract}`).not.toMatch(
      /sort_by\(|created_at|\|\s*last/
    );
  });

  it("reverifies exact immutable selection and package before just-in-time AWS authority", () => {
    const job = deploy.jobs["build-upload-deploy"];
    const serialized = JSON.stringify(job);
    const verifySelection = stepIndex(
      job,
      "Verify immutable production artifact selection"
    );
    const checkout = job.steps.find(
      (step: { readonly name?: string }) => step.name === "Checkout code"
    );
    const verifyPackage = stepIndex(job, "Verify selected production artifact");
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
    expect(verifyPackage).toBeGreaterThan(verifySelection);
    expect(reauthorize).toBeGreaterThan(verifyPackage);
    expect(aws).toBeGreaterThan(reauthorize);
    expect(serialized).toContain("verify-selection");
    expect(serialized).toContain(
      "/deploy/release-bus-v2/production-authority/reauthorize"
    );
    expect(serialized).toContain("selection_digest:$selection_digest");
    expect(serialized).not.toContain("Install dependencies");
    expect(serialized).not.toContain("Build App");
    expect(serialized).not.toContain("latest_main_sha");
  });

  it("holds authority through exact automatic E2E and releases failures explicitly", () => {
    const deployJob = deploy.jobs["build-upload-deploy"];
    const fail = deploy.jobs["fail-production-authority"];
    const operationEvidence = deployJob.steps.find(
      (step: { readonly name?: string }) =>
        step.name === "Upload production operation evidence"
    );

    expect(operationEvidence).toBeDefined();
    expect(JSON.stringify(fail)).toContain(
      "/deploy/release-bus-v2/production-authority/fail"
    );
    expect(fail.steps[0].run).toContain(
      'keys == ["failed","lock_row_version","operation_id","reused","status"]'
    );
    expect(fail.if.replace(/\s+/gu, " ")).toContain(
      "needs.build-upload-deploy.result != 'success'"
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
    expect(completion.on.workflow_run.workflows).toEqual(["Production E2E"]);
    expect(completionSource).toContain(
      "/deploy/release-bus-v2/production-authority/complete"
    );
    expect(completionSource).toContain(
      "/deploy/release-bus-v2/production-authority/fail"
    );
    expect(completionSource).toContain(
      "^Production\\ E2E\\ automatic\\ ([1-9][0-9]{0,19})$"
    );
    expect(completionSource).toContain("qualifier_workflow_run_id");
    expect(completionSource).toContain("evidence_digest");
  });
});
