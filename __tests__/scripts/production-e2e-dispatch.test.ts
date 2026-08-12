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
  const completionSource = read("production-authority-complete.yml");
  const dispatch = YAML.parse(dispatchSource);
  const e2e = YAML.parse(e2eSource);
  const completion = YAML.parse(completionSource);

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
    expect(dispatch.concurrency).toEqual({
      group: "production-e2e-dispatch-${{ github.event.workflow_run.id }}",
      "cancel-in-progress": false,
    });
  });

  it("reuses one exact E2E run and reconciles an ambiguous dispatch response", () => {
    const job = dispatch.jobs["dispatch-successful-deploy"];
    const step = job.steps.find(
      (candidate: { name?: string }) =>
        candidate.name === "Dispatch exact successful deploy to production E2E"
    );
    expect(job["timeout-minutes"]).toBe(120);
    expect(step.id).toBe("e2e");
    expect(step.run).toContain("list_exact_runs()");
    expect(step.run).toContain(".name == $title");
    expect(step.run).toContain(".display_title == $title");
    expect(step.run).not.toContain('.name == "Production E2E"');
    expect(step.run).toContain('created=">=${DEPLOY_CREATED_AT}"');
    expect(step.run).toContain('if [ "$existing_count" = 1 ]; then');
    expect(step.run.match(/echo "run_id=\$e2e_run_id"/g)).toHaveLength(2);
    expect(step.run).toContain("|| dispatch_status=$?");
    expect(step.run).toContain("for _ in $(seq 1 20); do");
    expect(step.run).toContain('if [ "$observed_count" -gt 1 ]; then');
    expect(step.run).toContain(
      "No exact automatic Production E2E run became visible after dispatch"
    );
  });

  it("waits for the exact E2E terminal state and dispatches exact authority completion", () => {
    const job = dispatch.jobs["dispatch-successful-deploy"];
    const step = job.steps.find(
      (candidate: { name?: string }) =>
        candidate.name ===
        "Dispatch authority completion after exact terminal E2E"
    );

    expect(step.env).toEqual(
      expect.objectContaining({
        DEPLOY_HEAD_SHA: "${{ github.event.workflow_run.head_sha }}",
        DEPLOY_WORKFLOW_RUN_ID: "${{ github.event.workflow_run.id }}",
        E2E_RUN_ID: "${{ steps.e2e.outputs.run_id }}",
      })
    );
    expect(step.run).toContain("for _ in $(seq 1 400); do");
    expect(step.run).toContain(
      '.name == ("Production E2E automatic " + $deploy_run_id)'
    );
    expect(step.run).toContain(".display_title == .name");
    expect(step.run).toContain(
      '.path == ".github/workflows/production-e2e.yml"'
    );
    expect(step.run).toContain(".head_sha == $head_sha");
    expect(step.run).toContain('.actor.login == "github-actions[bot]"');
    expect(step.run).toContain('if [ "$status" = completed ]; then');
    expect(step.run).toContain(
      "actions/workflows/production-authority-complete.yml/dispatches"
    );
    expect(step.run).toContain(
      "{ref:$ref,inputs:{terminal_workflow_run_id:$terminal_run_id}}"
    );
    expect(step.run).toContain(
      "date -u -d '5 seconds ago' +%Y-%m-%dT%H:%M:%SZ"
    );
    expect(step.run).toContain(
      '--arg title "Production authority completion [${E2E_RUN_ID}]"'
    );
    expect(step.run).toContain(
      "No exact authority completion run became visible for E2E"
    );
  });

  it("keeps automatic dispatch on protected main through completion", () => {
    const job = dispatch.jobs["dispatch-successful-deploy"];
    const step = job.steps.find(
      (candidate: { name?: string }) =>
        candidate.name === "Dispatch exact successful deploy to production E2E"
    );

    const protectedRef = step.env.DEPLOY_REF;
    expect(protectedRef).toBe("main");
    expect(step.run).toContain('test "$DEPLOY_REF" = main');
    expect(step.run).toContain('--arg ref "$DEPLOY_REF"');
    expect(dispatchSource).not.toContain(
      "github.event.repository.default_branch"
    );
    expect(completion.on.workflow_run.branches).toEqual([protectedRef]);
    expect(completion.jobs["complete-production-authority"].if).toContain(
      `github.event.workflow_run.head_branch == '${protectedRef}'`
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
    expect(resolve.run).toContain(
      '.name == ("Production deploy " + .head_sha + " [frontend-prod-" + ($run_id | tostring) + "]")'
    );
    expect(resolve.run).toContain(".display_title == .name");
    expect(resolve.run).toContain(
      '.path == ".github/workflows/build-upload-deploy-prod.yml"'
    );
    expect(resolve.run).toContain('.conclusion == "success"');
    expect(resolve.run).toContain('.head_branch == "main"');
    expect(resolve.run).toContain("previous_deployed_sha=$previous_sha");
    expect(resolve.run).toContain(".run_started_at < $started_at");
    expect(resolve.run).toContain(
      '.name == ("Production deploy " + .head_sha + " [frontend-prod-" + (.id | tostring) + "]")'
    );
    expect(resolve.run).not.toContain('.name == "Web Deploy - PROD"');
    expect(e2eSource).not.toContain('.name == "Web Deploy - PROD"');
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
    const qualification = verifier.steps.find(
      (step: { name?: string }) =>
        step.name === "Write automatic production qualification record"
    );
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
    expect(qualification.run).toContain("Accept: application/vnd.github+json");
    expect(qualification.run).not.toContain("Accept: application/octet-stream");
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
