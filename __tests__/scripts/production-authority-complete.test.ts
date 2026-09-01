import fs from "node:fs";
import YAML from "yaml";

describe("one-click production authority completion", () => {
  const e2eSource = fs.readFileSync(
    ".github/workflows/production-e2e.yml",
    "utf8"
  );
  const e2e = YAML.parse(e2eSource);
  const completionSource = fs.readFileSync(
    ".github/workflows/production-authority-complete.yml",
    "utf8"
  );
  const completion = YAML.parse(completionSource);
  const completionJob = completion.jobs["complete-production-authority"];
  const membershipToken = completionJob.steps.find(
    (step: { readonly name?: string }) =>
      step.name === "Create maintainer membership token"
  );
  const authorizeMaintainer = completionJob.steps.find(
    (step: { readonly name?: string }) =>
      step.name === "Authorize maintainer recovery actor"
  );
  const proof = completionJob.steps.find(
    (step: { readonly name?: string }) =>
      step.name === "Read exact terminal workflow and immutable evidence"
  );
  const complete = completionJob.steps.find(
    (step: { readonly name?: string }) =>
      step.name === "Complete exact production authority"
  );
  const fail = completionJob.steps.find(
    (step: { readonly name?: string }) =>
      step.name === "Fail exact production authority after E2E failure"
  );

  it("gives automatic runs the exact deploy-linked title and publishes a narrow evidence artifact", () => {
    expect(e2eSource).toContain(
      "format('automatic {0}', inputs.automatic_deploy_run_id)"
    );
    expect(e2eSource).toContain(
      "name: production-authority-evidence-${{ inputs.automatic_deploy_run_id }}"
    );
    expect(e2eSource).toContain("path: production-e2e-artifacts/evidence.json");
    expect(e2eSource).toContain(
      "if: always() && inputs.automatic_deploy_run_id != '' && steps.e2e.outcome == 'success'"
    );
    expect(e2e["run-name"]).toContain("format('automatic {0}'");
    expect(e2e["run-name"]).toContain("inputs.release_train_id");
    expect(e2e["run-name"]).toContain("'manual'");
  });

  it("listens only to same-repository main terminal workflows on an isolated runner", () => {
    expect(completion.on.workflow_run).toEqual({
      workflows: ["Production E2E", "Web Deploy - PROD"],
      types: ["completed"],
      branches: ["main"],
    });
    expect(completion.on.workflow_dispatch).toEqual({
      inputs: {
        terminal_workflow_run_id: {
          description: "Exact terminal production workflow run to complete",
          required: true,
          type: "string",
        },
      },
    });
    expect(completionJob.if.replace(/\s+/gu, " ").trim()).toBe(
      "(github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main') || " +
        "(github.event_name == 'workflow_run' && " +
        "github.event.workflow_run.head_repository.full_name == github.repository && " +
        "github.event.workflow_run.head_branch == 'main' && " +
        "(github.event.workflow_run.path == '.github/workflows/production-e2e.yml' || " +
        "github.event.workflow_run.path == '.github/workflows/build-upload-deploy-prod.yml'))"
    );
    const dispatchGateLine = completionSource
      .split(/\r?\n/u)
      .find((line) => line.trimStart().startsWith("if: (github.event_name"));
    expect(dispatchGateLine).not.toContain("github.actor ==");
    expect(dispatchGateLine).toMatch(/# NOSONAR$/u);
    expect(completionJob.if).not.toContain("github.event.workflow_run.name");
    expect(completionJob["runs-on"]).toBe("ubuntu-latest");
    expect(completionJob.permissions).toEqual({
      actions: "read",
      contents: "read",
    });
    expect(completionSource).toContain("ref: ${{ github.workflow_sha }}");
    expect(completionSource).toContain("path: .authority-listener");
    expect(completionSource).toContain(
      ".authority-listener/ops/scripts/production-authority-failure-evidence.cjs"
    );
    expect(completionSource).not.toContain(
      "ref: ${{ github.event.workflow_run.head_sha }}"
    );
    expect(completionSource).toContain(
      "uses: actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10"
    );
    expect(completionSource).not.toMatch(
      /actions\/setup-node|(?:npm|pnpm|yarn)\s+(?:install|ci)|configure-aws-credentials|AWS_(?:ACCESS|SECRET)/i
    );
  });

  it("authorizes human recovery once through live maintainer-team membership", () => {
    expect(completion["run-name"]).toBe(
      "Production authority completion [${{ github.event.workflow_run.id || inputs.terminal_workflow_run_id }}]"
    );
    expect(membershipToken.if).toBe(
      "github.event_name == 'workflow_dispatch' && github.actor != 'github-actions[bot]'"
    );
    expect(membershipToken.uses).toBe(
      "actions/create-github-app-token@bcd2ba49218906704ab6c1aa796996da409d3eb1"
    );
    expect(membershipToken.with).toEqual({
      "app-id": "${{ vars.RELEASE_BUS_GITHUB_APP_ID }}",
      "private-key": "${{ secrets.RELEASE_BUS_GITHUB_PRIVATE_KEY }}",
      owner: "${{ github.repository_owner }}",
      repositories: "6529seize-frontend",
      "permission-members": "read",
    });
    expect(authorizeMaintainer.if).toBe(
      "github.event_name == 'workflow_dispatch'"
    );
    expect(authorizeMaintainer.env).toEqual({
      DISPATCH_ACTOR: "${{ github.actor }}",
      GH_TOKEN: "${{ steps.maintainer-token.outputs.token }}",
      MAINTAINER_ORGANIZATION: "${{ github.repository_owner }}",
      MAINTAINER_TEAM_SLUG: "6529seize-maintainers",
    });
    expect(authorizeMaintainer.run).toContain(
      "orgs/${MAINTAINER_ORGANIZATION}/teams/${MAINTAINER_TEAM_SLUG}/memberships/${DISPATCH_ACTOR}"
    );
    expect(authorizeMaintainer.run).toContain('.state == "active"');
    expect(authorizeMaintainer.run).toContain(
      '(.role == "member" or .role == "maintainer")'
    );
    expect(authorizeMaintainer.run).toContain(
      "Actor is not an active member of the production recovery team."
    );
    expect(authorizeMaintainer.run).toContain(
      'if [ "$DISPATCH_ACTOR" = \'github-actions[bot]\' ]; then'
    );
    expect(authorizeMaintainer.run).toContain(
      "Automatic recovery dispatcher admitted for exact Production E2E proof."
    );
    expect(authorizeMaintainer.run).toContain('test -n "$GH_TOKEN"');
    expect(
      completionJob.steps.findIndex(
        (step: { readonly name?: string }) =>
          step.name === "Authorize maintainer recovery actor"
      )
    ).toBeLessThan(
      completionJob.steps.findIndex(
        (step: { readonly name?: string }) =>
          step.name === "Read exact terminal workflow and immutable evidence"
      )
    );
    expect(completionSource.match(/\/memberships\//gu)).toHaveLength(1);
    expect(completionSource).not.toContain("punk6529");
    expect(completionSource).not.toContain("prxt6529");

    expect(proof.env.WORKFLOW_RUN_ID).toContain(
      "github.event.workflow_run.id || inputs.terminal_workflow_run_id"
    );
    expect(proof.env.EVENT_NAME).toBe("${{ github.event_name }}");
    expect(proof.env.DISPATCH_ACTOR).toBe("${{ github.actor }}");
    expect(proof.run).not.toContain("MAINTAINER_TEAM_SLUG");
    expect(proof.run).not.toContain("GITHUB_REF");
    expect(proof.run).toContain(
      'workflow_path="$(jq -er \'.path | strings\' "$workflow_file")"'
    );
    expect(proof.run).toContain(
      "Automatic authority completion accepts only an exact Production E2E run."
    );
    expect(proof.run).toContain(
      "[ \"$DISPATCH_ACTOR\" = 'github-actions[bot]' ] && [ \"$workflow_path\" != '.github/workflows/production-e2e.yml' ]"
    );
    expect(proof.run).not.toContain("workflow_name=");
  });

  it("derives the deploy run only from the exact automatic title and re-reads both identities", () => {
    expect(completionSource).toContain(
      "^Production\\ E2E\\ automatic\\ ([1-9][0-9]{0,19})$"
    );
    expect(completionSource).toContain(
      '.path == ".github/workflows/production-e2e.yml"'
    );
    expect(completionSource).toContain('.event == "workflow_dispatch"');
    expect(completionSource).toContain('.status == "completed"');
    expect(completionSource).toContain(".repository.full_name == $repository");
    expect(completionSource).toContain(
      ".head_repository.full_name == $repository"
    );
    expect(completionSource).toContain(
      '.path == ".github/workflows/build-upload-deploy-prod.yml"'
    );
    expect(completionSource).not.toContain('.name == "Web Deploy - PROD"');
    expect(completionSource).not.toContain('.name == "Production E2E"');
    expect(completionSource).toContain(
      '.display_title == ("Production deploy " + .head_sha + " [frontend-prod-" + $run_id + "]")'
    );
    expect(completionSource).toContain(
      'if [ "$deploy_conclusion" = success ]; then'
    );
    expect(completionSource).toContain(
      "Successful deployment remains bound until automatic Production E2E."
    );
    expect(completionSource).toContain(
      'select(.name == "Reauthorize exact production mutation" and .conclusion == "success")'
    );
    expect(completionSource).toContain(
      'select(.name == "Atomically acquire and bind production authority" and .conclusion == "success")'
    );
    const failedDeployJobProof = completionSource.slice(
      completionSource.indexOf('jobs_file="$proof_dir/failure-jobs.json"'),
      completionSource.indexOf("authority_acquisition_count=")
    );
    expect(failedDeployJobProof).toContain(
      '(.total_count | type == "number" and . <= 100)'
    );
    expect(failedDeployJobProof).toContain('(.jobs | type == "array")');
    expect(completionSource).toContain(
      'if [ "$authority_acquisition_count" = 0 ]; then'
    );
    expect(completionSource).toContain(
      "Failed deployment never acquired production authority."
    );
    expect(completionSource).toContain(
      "Production authority acquisition evidence is ambiguous; refusing failure release."
    );
    expect(completionSource).toContain('if [ "$operation_count" = 1 ]; then');
    expect(completionSource).toContain('created=">=${deploy_created_at}"');
    expect(completionSource).toContain(
      'if [ "$WORKFLOW_RUN_ID" != "$canonical_e2e_run_id" ]; then'
    );
    expect(completionSource).toContain("[.workflow_runs[] |");
    expect(completionSource).toContain(
      '"one-click-production-operation-${deploy_run_id}"'
    );
    expect(completionSource).toContain(
      '"production-authority-evidence-${deploy_run_id}"'
    );
    expect(completionSource).toContain(
      '"production-e2e-selection-${deploy_run_id}"'
    );
    expect(completionSource).toContain(
      '"production-e2e-qualification-${deploy_run_id}-a${e2e_attempt}"'
    );
    expect(completionSource).toContain('"qualification.json"');
    expect(completionSource).toContain("one-click-production-qualification-v1");
    expect(
      completionSource.match(/--retry 4 --retry-all-errors/g)
    ).toHaveLength(2);
    expect(completionSource).toContain("artifact_keys");
    expect(completionSource).toContain(".artifact.api_digest");
    expect(completionSource).toContain(".selection_artifact.api_digest");
    expect(completionSource).toContain("artifact_selection_digest");
    expect(completionSource).toContain(".workflow_run.id");
    expect(completionSource).not.toContain("filter=latest");
    expect(completionSource).toContain("unique | sort | .[0] | numbers");
    expect(completionSource).not.toMatch(/\bnewest\b/i);
    expect(completionSource).not.toMatch(/sort_by\(|\|\s*last\b/);
  });

  it("rejects ambiguous, expired, oversized, linked, or extra-file artifact evidence", () => {
    expect(completionSource).toContain('.total_count | type == "number"');
    expect(completionSource).toContain("length == 1");
    expect(completionSource).toContain(".expired == false");
    expect(completionSource).toContain("size_in_bytes");
    expect(completionSource).toContain(
      'download_artifact "$evidence_record" "$evidence_archive" 4194304'
    );
    expect(completionSource).toContain(
      'test "$(stat -c %s "$archive_file")" -le "$maximum_size"'
    );
    expect(
      completionSource.match(/Accept: application\/vnd\.github\+json/g)
    ).toHaveLength(2);
    expect(completionSource).not.toContain("Accept: application/octet-stream");
    expect(completionSource).toContain("len(members) != 1");
    expect(completionSource).toContain("stat.S_IFLNK");
    expect(completionSource).toContain("os.O_EXCL");
    expect(completionSource).toContain("sha256sum");
    expect(completionSource).toContain("evidence_digest");
    expect(completionSource).not.toContain(
      ".selection_digest == $selection_digest"
    );
    expect(completionSource).toContain(
      ".artifact_selection_digest == $artifact_selection_digest"
    );
    expect(completionSource).toContain("selection digest mismatch");
  });

  it("requires the exact isolated verifier attempt before completion", () => {
    expect(completionSource).toContain(
      "/attempts/${e2e_attempt}/jobs?per_page=100"
    );
    expect(completionSource).toContain(
      "Verify production evidence on isolated runner"
    );
    expect(completionSource).toContain(
      "Validate production E2E evidence on isolated runner"
    );
    expect(completionSource).toContain("Return isolated production E2E result");
    expect(completionSource).toContain('e2e_conclusion\" != success');
    expect(completionSource).toContain('.actor.login == "github-actions[bot]"');
    expect(completionSource).toContain(
      '.triggering_actor.login == "github-actions[bot]"'
    );
    expect(completionSource).toContain(
      'qualification_file="$proof_dir/qualification.json"'
    );
    expect(completionSource).toContain(".target_sha == $target_sha");
  });

  it("binds failed automatic E2E evidence to the deployed target SHA", () => {
    expect(completionSource).toContain(
      'target_sha="$(jq -er \'.head_sha\' "$deploy_file")"'
    );
    expect(completionSource).toContain("target_sha == $target_sha");
    expect(completionSource).not.toContain("e2e_head_sha");
    expect(completionSource).toContain(
      ".e2e_run_id | tostring) == $e2e_run_id"
    );
    expect(completionSource).toContain(
      ".deploy_run_id | tostring) == $deploy_run_id"
    );
  });

  it("keeps Museum pack selection and production artifact selection digests independent", () => {
    expect(completionSource).toContain(
      'artifact_selection_digest="$(jq -er \'.selection_digest\' "$operation_file")"'
    );
    expect(completionSource).toContain(
      ".artifact_selection_digest == $artifact_selection_digest"
    );
    expect(completionSource).not.toContain(
      ".selection_digest == $selection_digest"
    );
    expect(completionSource).toContain("if (claimedDigest !== actualDigest)");
    expect(completionSource).not.toContain("claimedDigest !== expectedDigest");
  });

  it("maps exact success to complete and terminal failure/cancellation to fail", () => {
    expect(complete.if).toContain("steps.proof.outputs.action == 'complete'");
    expect(complete.run).toContain(
      "/deploy/release-bus-v2/production-authority/complete"
    );
    expect(complete.run).toContain("qualifier_workflow_run_id");
    expect(complete.run).toContain("qualifier_workflow_run_attempt");
    expect(complete.run).toContain("evidence_digest");
    expect(complete.run).toContain(
      '[[ "$SELECTION_DIGEST" =~ ^[a-f0-9]{64}$ ]]'
    );
    expect(complete.run).toContain('.status == "COMPLETED"');
    expect(complete.run).toContain(".completed == true");
    expect(complete.run).toContain(
      'keys == ["completed","lock_row_version","operation_id","reused","status"]'
    );

    expect(fail.if).toContain("steps.proof.outputs.action == 'fail'");
    expect(fail.run).toContain(
      "/deploy/release-bus-v2/production-authority/fail"
    );
    expect(fail.run).toContain('--argjson selection_digest "$selection_json"');
    expect(fail.run).toContain("qualifier_workflow_run_id");
    expect(fail.run).toContain("qualifier_workflow_run_attempt");
    expect(fail.run).toContain("evidence_digest");
    expect(fail.run).toContain('--arg reason_code "$REASON_CODE"');
    expect(fail.run).toContain('.status == "FAILED"');
    expect(fail.run).toContain(".failed == true");
    expect(fail.run).toContain(
      'keys == ["failed","lock_row_version","operation_id","reused","status"]'
    );
    expect(completionSource).toContain(
      "failure|cancelled|timed_out|action_required|startup_failure|stale"
    );
    expect(completionSource).not.toContain(
      'IN("failure", "cancelled", "timed_out", "action_required", "neutral", "skipped", "stale")'
    );
    expect(completionSource).toContain('test "$http_status" = 200');
  });

  it("ignores manual, Release Bus, and other non-automatic E2E runs without mutation", () => {
    expect(proof.run).toContain(
      'if [[ "$e2e_title" != "Production E2E automatic "* ]]; then'
    );
    expect(proof.run).toContain('echo "action=ignore"');
    expect(proof.run).toContain("exit 0");
    expect(completionSource).not.toContain("report-progress");
    expect(completionSource).not.toContain("workflow_run_id:$E2E_RUN_ID");
  });
});
