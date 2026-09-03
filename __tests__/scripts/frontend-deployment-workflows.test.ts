import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const ROOT = process.cwd();
const readWorkflow = (name: string) => {
  const source = fs.readFileSync(
    path.join(ROOT, ".github", "workflows", name),
    "utf8"
  );
  return { source, workflow: YAML.parse(source) };
};

describe("frontend deployment workflow contract", () => {
  it("keeps canonical names and makes main merges non-deploying", () => {
    const staging = readWorkflow("deploy-staging.yml").workflow;
    const production = readWorkflow("build-upload-deploy-prod.yml").workflow;
    expect(staging.name).toBe("Web Deploy - STAGING");
    expect(staging.on.push.branches).toEqual(["1a-staging"]);
    expect(staging.on.workflow_dispatch).toBeDefined();
    expect(staging.concurrency).toEqual({
      group: "staging-deploy",
      "cancel-in-progress": false,
    });
    expect(production.name).toBe("Web Deploy - PROD");
    expect(production.on.push).toBeUndefined();
    expect(production.on.pull_request).toBeUndefined();
    expect(production.on.workflow_dispatch).toBeDefined();
    expect(production.concurrency).toEqual({
      group: "web-deploy-prod",
      "cancel-in-progress": false,
    });
  });

  it("removes Release Bus control-plane plumbing from active deployment and E2E paths", () => {
    const activePaths = [
      "build-upload-deploy-prod.yml",
      "deploy-staging.yml",
      "production-artifact-verifier.yml",
      "production-build-artifact.yml",
      "production-e2e.yml",
      "staging-e2e.yml",
    ];
    const forbidden =
      /release[-_ ]bus|deployment[-_ ]bus|operation_id|authority\/|authority completion/i;
    for (const workflow of activePaths) {
      const source = readWorkflow(workflow).source;
      expect(source).not.toMatch(forbidden);
    }
  });

  it("retains ordinary GitHub deployment records for both environments", () => {
    const staging = readWorkflow("deploy-staging.yml").workflow;
    const production = readWorkflow("build-upload-deploy-prod.yml").workflow;
    expect(staging.jobs["deploy-staging"].environment).toEqual({
      name: "staging",
      url: "https://staging.6529.io",
    });
    expect(production.jobs["build-upload-deploy"].environment).toBe(
      "production"
    );
  });

  it("holds each environment lock through its matching automatic E2E", () => {
    const staging = readWorkflow("deploy-staging.yml").workflow;
    const stagingE2e = readWorkflow("staging-e2e.yml");
    const production = readWorkflow("build-upload-deploy-prod.yml").workflow;
    const productionE2e = readWorkflow("production-e2e.yml");

    expect(staging.jobs["automatic-staging-e2e"]).toMatchObject({
      needs: ["deploy-staging", "notify-staging-outcome"],
      uses: "./.github/workflows/staging-e2e.yml",
      with: {
        pack: "all",
        trusted_deployed_sha: "${{ github.sha }}",
        parent_deploy_run_id: "${{ github.run_id }}",
      },
    });
    expect(production.jobs["automatic-production-e2e"]).toMatchObject({
      needs: ["build-upload-deploy", "notify-production-deployment"],
      uses: "./.github/workflows/production-e2e.yml",
      with: {
        trusted_deployed_sha: "${{ github.sha }}",
        parent_deploy_run_id: "${{ github.run_id }}",
      },
    });

    for (const e2e of [stagingE2e, productionE2e]) {
      expect(
        e2e.workflow.on.workflow_call.inputs.trusted_deployed_sha.required
      ).toBe(true);
      expect(
        e2e.workflow.on.workflow_dispatch.inputs.automatic_deploy_run_id
          .required
      ).toBe(false);
      expect(
        e2e.workflow.on.workflow_dispatch.inputs.target_sha
      ).toBeUndefined();
      expect(e2e.source).not.toContain("MANUAL_TARGET_SHA");
    }

    expect(stagingE2e.workflow.concurrency.group).toContain("staging-e2e");
    expect(stagingE2e.workflow.concurrency.group).toContain("staging-deploy");
    expect(productionE2e.workflow.concurrency.group).toContain(
      "production-e2e"
    );
    expect(productionE2e.workflow.concurrency.group).toContain(
      "web-deploy-prod"
    );
    expect(
      fs.existsSync(
        path.join(ROOT, ".github", "workflows", "staging-e2e-dispatch.yml")
      )
    ).toBe(false);
    expect(
      fs.existsSync(
        path.join(ROOT, ".github", "workflows", "production-e2e-dispatch.yml")
      )
    ).toBe(false);
  });

  it("notifies staging deployment before automatic E2E", () => {
    const staging = readWorkflow("deploy-staging.yml").workflow;
    const finalizer = staging.jobs["notify-staging-outcome"];
    const automaticE2e = staging.jobs["automatic-staging-e2e"];
    const requiredJobs = ["build-staging-artifact", "deploy-staging"];
    const failure = finalizer.steps.find(
      (step: { name?: string }) => step.name === "Notify CI wave about failure"
    );
    const success = finalizer.steps.find(
      (step: { name?: string }) => step.name === "Notify CI wave about success"
    );

    expect(finalizer.if).toBe("always()");
    expect(finalizer.needs).toEqual(requiredJobs);
    for (const job of requiredJobs) {
      expect(failure.if).toContain(`needs.${job}.result != 'success'`);
      expect(success.if).toContain(`needs.${job}.result == 'success'`);
    }
    expect(automaticE2e.needs).toEqual([
      "deploy-staging",
      "notify-staging-outcome",
    ]);
  });

  it("publishes production release notes after deploy before CI-wave E2E", () => {
    const production = readWorkflow("build-upload-deploy-prod.yml").workflow;
    const deployment = production.jobs["notify-production-deployment"];
    const automaticE2e = production.jobs["automatic-production-e2e"];
    const deploymentSuccess = deployment.steps.find(
      (step: { name?: string }) => step.name === "Notify CI wave about success"
    );

    expect(deployment.needs).toEqual([
      "build-production-artifact",
      "verify-production-artifact",
      "build-upload-deploy",
    ]);
    expect(deployment.needs).not.toContain("automatic-production-e2e");
    expect(deploymentSuccess.env.CI_RELEASE_NOTES_PROMPT_PATH).toBe(
      "ops/release-notes/release-notes.prompt.md"
    );
    expect(deploymentSuccess.env.CI_PIPELINES_ALERT_TYPE).toBe("deploy");
    expect(automaticE2e.needs).toEqual([
      "build-upload-deploy",
      "notify-production-deployment",
    ]);
    expect(production.jobs).not.toHaveProperty("notify-production-validation");
  });

  it("exposes the staging access code only after deployed-source authorization", () => {
    const stagingE2e = readWorkflow("staging-e2e.yml").workflow;
    const job = stagingE2e.jobs["staging-packs"];
    const runPacks = job.steps.find(
      (step: { name?: string }) => step.name === "Run read-only staging packs"
    );

    expect(job.env.PLAYWRIGHT_STAGING_ACCESS_CODE).toBeUndefined();
    expect(runPacks.env.PLAYWRIGHT_STAGING_ACCESS_CODE).toBe(
      "${{ secrets.PLAYWRIGHT_STAGING_ACCESS_CODE }}"
    );
  });

  it("keeps exact-production provenance and late downgrade guards fail-closed", () => {
    const production = readWorkflow("build-upload-deploy-prod.yml").source;
    const verifier = readWorkflow("production-artifact-verifier.yml").source;
    const productionE2e = readWorkflow("production-e2e.yml");
    const sourceCheckout = productionE2e.workflow.jobs.readonly.steps.find(
      (step: { name?: string }) =>
        step.name === "Check out exact deployed source"
    );

    expect(verifier).toContain(
      '.path == ".github/workflows/production-build-artifact.yml"'
    );
    expect(verifier).toContain(
      '.path == ".github/workflows/build-upload-deploy-prod.yml"'
    );
    expect(verifier).toContain(
      '$repository + "/.github/workflows/production-build-artifact.yml"'
    );
    expect(verifier).toContain(".sha == $workflow_sha");
    expect(production).toContain(
      'git merge-base --is-ancestor "$COMMIT_SHA" "$current_main_sha"'
    );
    expect(production).not.toContain(
      'test "$current_main_sha" = "$COMMIT_SHA"'
    );
    expect(production).not.toContain("refusing to announce stale production");
    expect(production).toContain("refusing to overwrite it with $COMMIT_SHA");
    expect(sourceCheckout).toMatchObject({
      uses: expect.stringMatching(/^actions\/checkout@/u),
      with: {
        ref: "${{ steps.source.outputs.sha }}",
        "persist-credentials": false,
      },
    });
    expect(productionE2e.source).toContain("path: .version-verifier");
  });
});
