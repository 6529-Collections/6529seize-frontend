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
    const selectionIndex = job.steps.findIndex(
      (step: { name?: string }) =>
        step.name ===
        "Select fail-closed Museum packs for the exact deployed range"
    );
    const selectionUploadIndex = job.steps.findIndex(
      (step: { name?: string }) =>
        step.name === "Upload immutable Museum selection evidence"
    );
    const packageManagerIndex = job.steps.findIndex(
      (step: { name?: string }) => step.name === "Activate pinned pnpm"
    );
    const dependenciesIndex = job.steps.findIndex(
      (step: { name?: string }) => step.name === "Install frozen dependencies"
    );
    const packsIndex = job.steps.findIndex(
      (step: { name?: string }) =>
        step.name === "Run production-safe read-only packs"
    );
    const evidenceUploadIndex = job.steps.findIndex(
      (step: { name?: string }) =>
        step.name === "Upload manifest-bound Playwright evidence"
    );
    const selection = job.steps[selectionIndex];
    const selectionUpload = job.steps[selectionUploadIndex];
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
    expect(controlCheckoutIndex).toBeGreaterThan(sourceVerificationIndex);
    expect(controlVerificationIndex).toBeGreaterThan(controlCheckoutIndex);
    expect(selectionIndex).toBeGreaterThan(controlVerificationIndex);
    expect(selectionIndex).toBeGreaterThan(checkoutIndex);
    expect(selectionUploadIndex).toBeGreaterThan(selectionIndex);
    expect(packageManagerIndex).toBeGreaterThan(selectionUploadIndex);
    expect(dependenciesIndex).toBeGreaterThan(packageManagerIndex);
    expect(packsIndex).toBeGreaterThan(selectionIndex);
    expect(packsIndex).toBeGreaterThan(dependenciesIndex);
    expect(evidenceUploadIndex).toBeGreaterThan(packsIndex);
    expect(job.steps[controlCheckoutIndex].with.path).toBe(
      ".release-bus-control"
    );
    expect(selectionUpload.uses).toBe(
      "actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02"
    );
    expect(selectionUpload.id).toBe("museum-selection-upload");
    expect(selectionUpload.with.name).toContain("production-e2e-selection-");
    expect(selectionUpload.with.path).toBe(
      "${{ steps.museum-selection.outputs.file }}"
    );
    expect(selection.run).toContain("scripts/museum-release-selection.cjs");
    expect(selection.run).toContain('test "$head_sha" = "$DEPLOYED_SHA"');
    expect(selection.run).not.toContain("NODE_PATH=");
    expect(job.steps[packsIndex].run).toContain(
      'pack.changeScope === "museum"'
    );
    expect(job.steps[packsIndex].run).toContain(
      'args+=(--exclude-pack "$museum_pack_alias")'
    );
    expect(result.env).toEqual(
      expect.objectContaining({
        DEPENDENCIES_OUTCOME: "${{ steps.dependencies.outcome }}",
        E2E_OUTCOME: "${{ steps.e2e.outcome }}",
        PLAYWRIGHT_OUTCOME: "${{ steps.playwright.outcome }}",
        SOCKET_OUTCOME: "${{ steps.socket-firewall.outcome }}",
      })
    );
    expect(job.steps[evidenceUploadIndex].id).toBe("evidence-upload");
    expect(e2eSource).toContain(
      'if ! control_status="$(git -C .release-bus-control status --porcelain=v1 --untracked-files=all)"; then'
    );
    expect(e2eSource).not.toContain(".release-bus-evidence-control");
    expect(e2eSource).toContain("args+=(--parallel 3)");
    expect(e2eSource).toContain("Restore Playwright browser");
  });

  it("qualifies uploaded evidence on a clean GitHub-hosted runner", () => {
    const readonly = e2e.jobs.readonly;
    const verifier = e2e.jobs["verify-evidence"];
    const stepIndex = (name: string) =>
      verifier.steps.findIndex((step: { name?: string }) => step.name === name);
    const identityIndex = stepIndex(
      "Resolve isolated verifier release identity"
    );
    const toolingIndex = stepIndex(
      "Verify immutable isolated verifier tooling"
    );
    const evidenceDownloadIndex = stepIndex(
      "Download untrusted production E2E evidence"
    );
    const selectionDownloadIndex = stepIndex(
      "Download immutable Museum selection evidence"
    );
    const evidenceIndex = stepIndex(
      "Validate production E2E evidence on isolated runner"
    );
    const reportIndex = stepIndex("Report structured Release Bus E2E result");
    const resultIndex = stepIndex("Return isolated production E2E result");
    const checkout = verifier.steps.find(
      (step: { name?: string }) =>
        step.name === "Check out immutable isolated verifier tooling"
    );
    const evidence = verifier.steps[evidenceIndex];
    const report = verifier.steps[reportIndex];
    const result = verifier.steps[resultIndex];

    expect(readonly.outputs["expected-sha"]).toContain(
      "steps.automatic-deploy.outputs.deployed-sha"
    );
    expect(readonly.outputs).toEqual(
      expect.objectContaining({
        "dependencies-outcome": "${{ steps.dependencies.outcome }}",
        "e2e-outcome": "${{ steps.e2e.outcome }}",
        "evidence-upload-outcome": "${{ steps.evidence-upload.outcome }}",
        "playwright-outcome": "${{ steps.playwright.outcome }}",
        "selection-outcome": "${{ steps.museum-selection.outcome }}",
        "selection-upload-outcome":
          "${{ steps.museum-selection-upload.outcome }}",
        "socket-outcome": "${{ steps.socket-firewall.outcome }}",
      })
    );
    expect(
      readonly.steps.some(
        (step: { name?: string }) =>
          step.name === "Report structured Release Bus E2E result"
      )
    ).toBe(false);
    expect(verifier.if).toBe("always()");
    expect(verifier.needs).toBe("readonly");
    expect(verifier["runs-on"]).toBe("ubuntu-latest");
    expect(verifier.permissions).toEqual({ actions: "read", contents: "read" });
    expect(identityIndex).toBeGreaterThanOrEqual(0);
    expect(toolingIndex).toBeGreaterThan(identityIndex);
    expect(evidenceDownloadIndex).toBeGreaterThan(identityIndex);
    expect(selectionDownloadIndex).toBeGreaterThan(identityIndex);
    expect(evidenceIndex).toBeGreaterThan(toolingIndex);
    expect(evidenceIndex).toBeGreaterThan(evidenceDownloadIndex);
    expect(evidenceIndex).toBeGreaterThan(selectionDownloadIndex);
    expect(reportIndex).toBeGreaterThan(evidenceIndex);
    expect(resultIndex).toBeGreaterThan(reportIndex);
    expect(checkout.with.ref).toBe("${{ github.workflow_sha }}");
    expect(checkout.with.path).toBe(".release-bus-verifier");
    expect(checkout.with["sparse-checkout"]).toContain(
      "tests/packs.manifest.cjs"
    );
    expect(verifier.steps[evidenceDownloadIndex].uses).toBe(
      "actions/download-artifact@37930b1c2abaa49bbe596cd826c3c89aef350131"
    );
    expect(verifier.steps[selectionDownloadIndex].uses).toBe(
      "actions/download-artifact@37930b1c2abaa49bbe596cd826c3c89aef350131"
    );
    expect(verifier.steps[evidenceDownloadIndex].with.name).toContain(
      "inputs.automatic_deploy_run_id"
    );
    expect(verifier.steps[selectionDownloadIndex].with.name).toContain(
      "production-e2e-selection-"
    );
    expect(evidence.if).toContain("needs.readonly.result == 'success'");
    expect(evidence.if).toContain(
      "steps.verifier-tooling.outcome == 'success'"
    );
    expect(evidence.if).toContain(
      "steps.evidence-download.outcome == 'success'"
    );
    expect(evidence.if).toContain(
      "steps.selection-download.outcome == 'success'"
    );
    expect(evidence.run).toContain(
      "isolated-production-e2e-selection/museum-release-selection.json"
    );
    expect(evidence.run).toContain("verifySelectionDigest");
    expect(evidence.run).toContain("$actual == $selected");
    expect(evidence.run).toContain("$actual == $complete");
    expect(evidence.run).toContain(".release_binding == null");
    expect(report.env.READONLY_RESULT).toContain("needs.readonly.result");
    expect(report.env.READONLY_SOCKET_OUTCOME).toContain(
      "needs.readonly.outputs.socket-outcome"
    );
    expect(report.env.READONLY_E2E_OUTCOME).toContain(
      "needs.readonly.outputs.e2e-outcome"
    );
    expect(report.run).toContain("failure_phase=production_e2e_setup");
    expect(report.run).toContain("failure_phase=production_e2e_selection");
    expect(report.env.ISOLATED_EVIDENCE_OUTCOME).toContain(
      "steps.isolated-evidence.outcome"
    );
    expect(report.env.SELECTION_DOWNLOAD_OUTCOME).toContain(
      "steps.selection-download.outcome"
    );
    expect(result.run).toContain('test "$READONLY_RESULT" = success');
    expect(result.run).toContain(
      'test "$SELECTION_DOWNLOAD_OUTCOME" = success'
    );
    expect(result.run).toContain('test "$ISOLATED_EVIDENCE_OUTCOME" = success');
  });
});
