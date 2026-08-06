import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const read = (file: string) =>
  fs.readFileSync(
    path.join(process.cwd(), ".github", "workflows", file),
    "utf8"
  );

describe("automatic production E2E dispatch", () => {
  const dispatchSource = read("production-e2e-dispatch.yml");
  const e2eSource = read("production-e2e.yml");
  const dispatch = YAML.parse(dispatchSource);
  const e2e = YAML.parse(e2eSource);

  it("dispatches only successful same-repository main deployments", () => {
    expect(dispatch.on.workflow_run).toMatchObject({
      workflows: ["Web Deploy - PROD"],
      types: ["completed"],
      branches: ["main"],
    });
    const job = dispatch.jobs["dispatch-successful-deploy"];
    expect(job.permissions).toEqual({ actions: "write" });
    expect(job.if).toContain(
      "github.event.workflow_run.conclusion == 'success'"
    );
    expect(job.if).toContain(
      "github.event.workflow_run.head_repository.full_name == github.repository"
    );
    expect(dispatchSource).toContain(
      "actions/workflows/production-e2e.yml/dispatches"
    );
    expect(dispatchSource).toContain(
      "inputs:{automatic_deploy_run_id:$deploy_run_id}"
    );
  });

  it("re-reads the deployment and binds readonly packs to its exact SHA", () => {
    const job = e2e.jobs.readonly;
    const resolve = job.steps.find(
      (step: { name?: string }) =>
        step.name === "Resolve successful automatic production deploy"
    );
    const evidence = job.steps.find(
      (step: { name?: string }) =>
        step.name === "Validate exact production E2E evidence"
    );
    const checkoutIndex = job.steps.findIndex(
      (step: { name?: string }) =>
        step.name === "Check out exact production SHA"
    );
    const sourceVerificationIndex = job.steps.findIndex(
      (step: { name?: string }) => step.name === "Verify immutable source"
    );
    const controlCheckoutIndex = job.steps.findIndex(
      (step: { name?: string }) =>
        step.name === "Check out immutable Release Bus Museum selection tooling"
    );
    const controlVerificationIndex = job.steps.findIndex(
      (step: { name?: string }) =>
        step.name === "Verify immutable Museum selection tooling"
    );
    const dependenciesIndex = job.steps.findIndex(
      (step: { name?: string }) => step.name === "Install frozen dependencies"
    );
    const packsIndex = job.steps.findIndex(
      (step: { name?: string }) =>
        step.name === "Run production-safe read-only packs"
    );
    const selectionIndex = job.steps.findIndex(
      (step: { name?: string }) =>
        step.name ===
        "Select fail-closed Museum packs for the exact deployed range"
    );
    const evidenceControlCheckoutIndex = job.steps.findIndex(
      (step: { name?: string }) =>
        step.name === "Check out immutable Release Bus Museum evidence tooling"
    );
    const evidenceControlVerificationIndex = job.steps.findIndex(
      (step: { name?: string }) =>
        step.name === "Verify immutable Museum evidence tooling"
    );
    const evidenceIndex = job.steps.findIndex(
      (step: { name?: string }) =>
        step.name === "Validate exact production E2E evidence"
    );
    const evidencePath = job.steps[evidenceControlCheckoutIndex - 1];
    const evidenceControlCheckout = job.steps[evidenceControlCheckoutIndex];
    const evidenceControlVerification =
      job.steps[evidenceControlVerificationIndex];
    const report = job.steps.find(
      (step: { name?: string }) =>
        step.name === "Report structured Release Bus E2E result"
    );
    const result = job.steps.find(
      (step: { name?: string }) => step.name === "Return production E2E result"
    );

    expect(
      e2e.on.workflow_dispatch.inputs.automatic_deploy_run_id.required
    ).toBe(false);
    expect(resolve.run).toContain('.name == "Web Deploy - PROD"');
    expect(resolve.run).toContain(
      '.path == ".github/workflows/build-upload-deploy-prod.yml"'
    );
    expect(resolve.run).toContain('.conclusion == "success"');
    expect(resolve.run).toContain('.head_branch == "main"');
    expect(resolve.run).toContain("previous_deployed_sha=$previous_sha");
    expect(resolve.run).toContain(".run_started_at < $started_at");
    expect(e2eSource).toContain(
      "inputs.expected_sha || steps.automatic-deploy.outputs.deployed-sha"
    );
    expect(job.steps[checkoutIndex].with.ref).toBe(
      "${{ inputs.expected_sha || steps.automatic-deploy.outputs.deployed-sha }}"
    );
    expect(sourceVerificationIndex).toBeGreaterThan(checkoutIndex);
    expect(dependenciesIndex).toBeGreaterThan(sourceVerificationIndex);
    expect(controlCheckoutIndex).toBeGreaterThan(dependenciesIndex);
    expect(controlVerificationIndex).toBeGreaterThan(controlCheckoutIndex);
    expect(packsIndex).toBeGreaterThan(checkoutIndex);
    expect(selectionIndex).toBeGreaterThan(controlVerificationIndex);
    expect(selectionIndex).toBeGreaterThan(checkoutIndex);
    expect(packsIndex).toBeGreaterThan(selectionIndex);
    expect(evidenceControlCheckoutIndex).toBeGreaterThan(packsIndex);
    expect(evidenceControlVerificationIndex).toBeGreaterThan(
      evidenceControlCheckoutIndex
    );
    expect(evidenceIndex).toBeGreaterThan(evidenceControlVerificationIndex);
    expect(job.steps[controlCheckoutIndex].with.path).toBe(
      ".release-bus-control"
    );
    expect(job.steps[evidenceControlCheckoutIndex].with.path).toBe(
      ".release-bus-evidence-control"
    );
    expect(evidencePath.id).toBe("museum-evidence-path");
    expect(evidenceControlCheckout.id).toBe("museum-evidence-checkout");
    expect(evidenceControlCheckout.if).toContain(
      "steps.museum-evidence-path.outcome == 'success'"
    );
    expect(evidenceControlVerification.id).toBe("museum-evidence-tooling");
    expect(evidenceControlVerification.if).toContain(
      "steps.museum-evidence-checkout.outcome == 'success'"
    );
    expect(job.steps[evidenceIndex].if).toContain(
      "steps.museum-evidence-tooling.outcome == 'success'"
    );
    expect(job.steps[selectionIndex].run).toContain(
      "scripts/museum-release-selection.cjs"
    );
    expect(job.steps[selectionIndex].run).toContain(
      'test "$head_sha" = "$DEPLOYED_SHA"'
    );
    expect(job.steps[packsIndex].run).toContain(
      'pack.changeScope === "museum"'
    );
    expect(job.steps[packsIndex].run).toContain(
      'args+=(--exclude-pack "$museum_pack_alias")'
    );
    expect(evidence.run).toContain("!isMuseumPack(pack)");
    expect(evidence.run).toContain(".release_binding == null");
    expect(evidence.env.MUSEUM_RELEASE_SELECTION_TOOL).toBe(
      ".release-bus-evidence-control/scripts/museum-release-selection.cjs"
    );
    expect(evidence.run).toContain('node - "$MUSEUM_SELECTION_FILE"');
    for (const outcome of [
      "MUSEUM_EVIDENCE_PATH_OUTCOME",
      "MUSEUM_EVIDENCE_CHECKOUT_OUTCOME",
      "MUSEUM_EVIDENCE_TOOLING_OUTCOME",
    ]) {
      expect(report.env[outcome]).toContain("steps.museum-evidence-");
      expect(report.run).toContain(`$${outcome}`);
      expect(result.env[outcome]).toContain("steps.museum-evidence-");
      expect(result.run).toContain(`$${outcome}`);
    }
    expect(e2eSource).toContain(
      'if ! control_status="$(git -C .release-bus-control status --porcelain=v1 --untracked-files=all)"; then'
    );
    expect(e2eSource).toContain(
      'if ! control_status="$(git -C .release-bus-evidence-control status --porcelain=v1 --untracked-files=all)"; then'
    );
    expect(e2eSource).toContain("args+=(--parallel 3)");
    expect(e2eSource).toContain("Restore Playwright browser");
  });
});
