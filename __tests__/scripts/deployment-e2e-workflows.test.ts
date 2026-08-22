import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const read = (file: string) =>
  fs.readFileSync(
    path.join(process.cwd(), ".github", "workflows", file),
    "utf8"
  );

const parse = (file: string) => {
  const source = read(file);
  return { source, workflow: YAML.parse(source) };
};

describe("serialized post-deploy E2E", () => {
  const stagingDeploy = parse("deploy-staging.yml");
  const stagingE2e = parse("staging-e2e.yml");
  const productionDeploy = parse("build-upload-deploy-prod.yml");
  const productionE2e = parse("production-e2e.yml");

  it.each([
    [
      "staging",
      stagingDeploy.workflow,
      "automatic-staging-e2e",
      "deploy-staging",
      "notify-staging-outcome",
      "./.github/workflows/staging-e2e.yml",
    ],
    [
      "production",
      productionDeploy.workflow,
      "automatic-production-e2e",
      "build-upload-deploy",
      "notify-production-deployment",
      "./.github/workflows/production-e2e.yml",
    ],
  ])(
    "keeps the %s environment-owning workflow open through automatic E2E",
    (
      _environment,
      deploy,
      e2eJobName,
      deployJobName,
      notificationJobName,
      workflowPath
    ) => {
      expect(deploy.jobs[e2eJobName]).toMatchObject({
        needs: [deployJobName, notificationJobName],
        uses: workflowPath,
        with: {
          trusted_deployed_sha: "${{ github.sha }}",
          canonical_deploy_call: true,
          parent_deploy_run_id: "${{ github.run_id }}",
        },
      });
    }
  );

  it.each([
    ["staging", stagingDeploy, stagingE2e],
    ["production", productionDeploy, productionE2e],
  ])(
    "grants the %s reusable E2E every requested workflow permission",
    (_environment, deploy, e2e) => {
      expect(deploy.workflow.permissions).toEqual(
        expect.objectContaining(e2e.workflow.permissions)
      );
    }
  );

  it.each([
    [
      "production",
      productionE2e,
      "build-upload-deploy-prod.yml",
      "main",
      "Deploy verified production artifact",
      "web-deploy-prod",
      "production-e2e",
    ],
    [
      "staging",
      stagingE2e,
      "deploy-staging.yml",
      "1a-staging",
      "Deploy exact staging artifact",
      "staging-deploy",
      "staging-e2e",
    ],
  ])(
    "binds %s manual E2E to a successful canonical deploy job that is still live",
    (
      environment,
      e2e,
      deployPath,
      branch,
      deployJobName,
      environmentGroup,
      automaticGroup
    ) => {
      const job =
        e2e.workflow.jobs.readonly ?? e2e.workflow.jobs["staging-packs"];
      const resolve = job.steps.find(
        (step: { name?: string }) => step.name === "Resolve exact deployed SHA"
      );
      const liveVersion = job.steps.find(
        (step: { name?: string }) =>
          step.name ===
          `Require the selected ${environment} deployment to still be live`
      );
      const sourceMaterialization = job.steps.find(
        (step: { name?: string }) =>
          step.name === "Check out exact deployed source"
      );

      expect(
        e2e.workflow.on.workflow_dispatch.inputs.automatic_deploy_run_id
          .required
      ).toBe(false);
      expect(
        e2e.workflow.on.workflow_dispatch.inputs.target_sha
      ).toBeUndefined();
      expect(e2e.workflow.on.workflow_call.inputs.trusted_deployed_sha).toEqual(
        expect.objectContaining({ required: true, type: "string" })
      );
      expect(
        e2e.workflow.on.workflow_call.inputs.canonical_deploy_call
      ).toEqual(expect.objectContaining({ required: true, type: "boolean" }));
      expect(
        e2e.workflow.on.workflow_dispatch.inputs.canonical_deploy_call
      ).toBeUndefined();
      expect(resolve.run).toContain(
        `.path == ".github/workflows/${deployPath}"`
      );
      expect(resolve.run).toContain(`.head_branch == "${branch}"`);
      expect(resolve.run).toContain(`.name == "${deployJobName}"`);
      expect(resolve.run).toContain('.conclusion == "success"');
      expect(resolve.run).toContain('test "$GITHUB_REF" = refs/heads/main');
      expect(resolve.run).toContain("/attempts/\${deploy_run_attempt}/jobs");
      expect(resolve.run).not.toContain("MANUAL_TARGET_SHA");
      expect(liveVersion.run).toContain(
        "ops/scripts/verify-deployment-version.cjs"
      );
      expect(liveVersion.if).toBe(
        "inputs.tracking_id != '' || inputs.trusted_deployed_sha == ''"
      );
      expect(e2e.workflow.concurrency.group).toContain(environmentGroup);
      expect(e2e.workflow.concurrency.group).toContain(automaticGroup);

      expect(sourceMaterialization.with.ref).toBe(
        "${{ steps.source.outputs.sha }}"
      );
      expect(sourceMaterialization.with["persist-credentials"]).toBe(false);
      expect(e2e.source).toContain(
        'test "$(git rev-parse HEAD)" = "$EXPECTED_SHA"'
      );
      expect(e2e.source).toContain("DEPLOYMENT_E2E_SOURCE_SHA");
      expect(e2e.source).toContain("./bin/6529 run e2e:packs");
      expect(e2e.source).not.toMatch(/operation_id|authority/i);
    }
  );

  it.each([
    ["staging", stagingE2e],
    ["production", productionE2e],
  ])(
    "keeps the %s trusted-automation compatibility contract narrow",
    (_environment, e2e) => {
      const dispatchInputs = e2e.workflow.on.workflow_dispatch.inputs;
      const job = Object.values(e2e.workflow.jobs)[0] as {
        steps: Array<{
          name?: string;
          run?: string;
          env?: Record<string, string>;
        }>;
      };
      const resolve = job.steps.find(
        (step: { name?: string }) => step.name === "Resolve exact deployed SHA"
      );

      expect(dispatchInputs.trusted_deployed_sha).toEqual(
        expect.objectContaining({ required: false, type: "string" })
      );
      expect(dispatchInputs.tracking_id).toEqual(
        expect.objectContaining({ required: false, type: "string" })
      );
      expect(resolve?.run).toContain(
        "test \"$GITHUB_ACTOR\" = '6529-release-bus[bot]'"
      );
      expect(resolve?.env?.["TRACKING_ID"]).toBe("${{ inputs.tracking_id }}");
      expect(resolve?.env?.["CANONICAL_DEPLOY_CALL"]).toContain(
        "inputs.canonical_deploy_call"
      );
      expect(resolve?.env?.["CALLER_WORKFLOW_REF"]).toBe(
        "${{ github.workflow_ref }}"
      );
      expect(resolve?.run).toContain("$TRACKING_ID");
      expect(resolve?.run).toContain('test "$CANONICAL_DEPLOY_CALL" = true');
      expect(resolve?.run).not.toContain("inputs.tracking_id");
      expect(resolve?.run).not.toContain("GITHUB_EVENT_NAME");
      expect(e2e.source).not.toMatch(
        /release_manifest|artifact_digest|authorize|report-progress/i
      );
    }
  );

  it.each([
    ["staging", stagingE2e, "deploy-staging.yml", "1a-staging"],
    ["production", productionE2e, "build-upload-deploy-prod.yml", "main"],
  ])(
    "authenticates the canonical %s reusable-workflow caller",
    (_environment, e2e, deployPath, branch) => {
      const job = Object.values(e2e.workflow.jobs)[0] as {
        steps: Array<{
          name?: string;
          run?: string;
          env?: Record<string, string>;
        }>;
      };
      const resolve = job.steps.find(
        (step: { name?: string }) => step.name === "Resolve exact deployed SHA"
      );

      expect(resolve?.env?.["CALLER_WORKFLOW_REF"]).toBe(
        "${{ github.workflow_ref }}"
      );
      expect(resolve?.run).toContain(
        `"$GITHUB_REPOSITORY/.github/workflows/${deployPath}@refs/heads/${branch}"`
      );
    }
  );

  it.each([
    ["staging", stagingE2e],
    ["production", productionE2e],
  ])("keeps %s deployed-source execution cache-free", (_environment, e2e) => {
    const source = e2e.source;

    expect(source).not.toContain("actions/cache");
    expect(source).not.toContain("cache: pnpm");
    expect(source).not.toContain("PLAYWRIGHT_CACHE_HIT");
    expect(source).not.toContain("playwright install --with-deps chromium");
    expect(source).toContain(
      "./bin/6529 exec playwright install-deps chromium"
    );
    expect(source).toContain("Retry Playwright dependencies");
    expect(source).toContain("./bin/6529 exec playwright install chromium");
  });

  it("posts manual production E2E to the CI wave against the original deployment", () => {
    const notificationJob = productionE2e.workflow.jobs["notify-ci-wave"];
    const notification = notificationJob.steps.find(
      (step: { name?: string }) =>
        step.name === "Post production WEB validation outcome"
    );

    expect(notification.env.CI_PIPELINES_ALERT_TYPE).toBe("web_e2e");
    expect(notification.env.CI_PIPELINES_PARENT_DEPLOY_RUN_ID).toBe(
      "${{ inputs.parent_deploy_run_id || inputs.automatic_deploy_run_id }}"
    );
    expect(notification.env.CI_PIPELINES_VALIDATION_PACK).toBe("all");
    expect(notification.env).not.toHaveProperty(
      "CI_PIPELINES_NOTIFICATION_TYPE"
    );
  });

  it("does not expose the staging access code to source selection or checkout", () => {
    const job = stagingE2e.workflow.jobs["staging-packs"];
    const runPacks = job.steps.find(
      (step: { name?: string }) => step.name === "Run read-only staging packs"
    );

    expect(job.env.PLAYWRIGHT_STAGING_ACCESS_CODE).toBeUndefined();
    expect(runPacks.env.PLAYWRIGHT_STAGING_ACCESS_CODE).toBe(
      "${{ secrets.PLAYWRIGHT_STAGING_ACCESS_CODE }}"
    );
  });

  it("passes only the required E2E and CI-wave secrets across reusable boundaries", () => {
    const call = stagingDeploy.workflow.jobs["automatic-staging-e2e"];

    expect(call.secrets).toEqual({
      CI_PIPELINES_ALERT_API_AUTH: "${{ secrets.CI_PIPELINES_ALERT_API_AUTH }}",
      CI_PIPELINES_ALERT_SECRET: "${{ secrets.CI_PIPELINES_ALERT_SECRET }}",
      STAGING_AUTH: "${{ secrets.STAGING_AUTH }}",
      PLAYWRIGHT_STAGING_ACCESS_CODE:
        "${{ secrets.PLAYWRIGHT_STAGING_ACCESS_CODE }}",
    });
    const declaredSecrets = stagingE2e.workflow.on.workflow_call.secrets;
    expect(declaredSecrets.STAGING_AUTH).toEqual(
      expect.objectContaining({ required: false })
    );
    expect(declaredSecrets.PLAYWRIGHT_STAGING_ACCESS_CODE).toEqual(
      expect.objectContaining({ required: true })
    );
    expect(declaredSecrets.CI_PIPELINES_ALERT_SECRET).toEqual(
      expect.objectContaining({ required: true })
    );
    expect(
      productionDeploy.workflow.jobs["automatic-production-e2e"].secrets
    ).toEqual({
      CI_PIPELINES_ALERT_API_AUTH: "${{ secrets.CI_PIPELINES_ALERT_API_AUTH }}",
      CI_PIPELINES_ALERT_SECRET: "${{ secrets.CI_PIPELINES_ALERT_SECRET }}",
    });
  });
});
