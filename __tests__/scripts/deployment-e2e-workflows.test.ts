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
      "./.github/workflows/staging-e2e.yml",
    ],
    [
      "production",
      productionDeploy.workflow,
      "automatic-production-e2e",
      "build-upload-deploy",
      "./.github/workflows/production-e2e.yml",
    ],
  ])(
    "keeps the %s environment-owning workflow open through automatic E2E",
    (_environment, deploy, e2eJobName, deployJobName, workflowPath) => {
      expect(deploy.jobs[e2eJobName]).toMatchObject({
        needs: deployJobName,
        uses: workflowPath,
        with: { trusted_deployed_sha: "${{ github.sha }}" },
      });
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
          step.name === "Check out exact deployed source" ||
          step.name === "Materialize exact deployed source"
      );

      expect(
        e2e.workflow.on.workflow_dispatch.inputs.automatic_deploy_run_id
          .required
      ).toBe(true);
      expect(
        e2e.workflow.on.workflow_dispatch.inputs.target_sha
      ).toBeUndefined();
      expect(e2e.workflow.on.workflow_call.inputs.trusted_deployed_sha).toEqual(
        expect.objectContaining({ required: true, type: "string" })
      );
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
        "node ops/scripts/verify-deployment-version.cjs"
      );
      expect(e2e.workflow.concurrency.group).toContain(environmentGroup);
      expect(e2e.workflow.concurrency.group).toContain(automaticGroup);

      if (environment === "production") {
        expect(sourceMaterialization.with.ref).toBe(
          "${{ steps.source.outputs.sha }}"
        );
      } else {
        expect(sourceMaterialization.with.ref).toBe(
          "${{ steps.source.outputs.sha }}"
        );
      }
      expect(e2e.source).toContain(
        'test "$(git rev-parse HEAD)" = "$EXPECTED_SHA"'
      );
      expect(e2e.source).toContain("DEPLOYMENT_E2E_SOURCE_SHA");
      expect(e2e.source).toContain("./bin/6529 run e2e:packs");
      expect(e2e.source).not.toMatch(/operation_id|authority|release[-_ ]bus/i);
    }
  );

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
});
