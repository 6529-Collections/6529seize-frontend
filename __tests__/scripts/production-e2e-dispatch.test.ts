import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const read = (file: string) =>
  fs.readFileSync(
    path.join(process.cwd(), ".github", "workflows", file),
    "utf8"
  );

describe("automatic post-deploy E2E", () => {
  const productionDispatchSource = read("production-e2e-dispatch.yml");
  const productionDispatch = YAML.parse(productionDispatchSource);
  const productionSource = read("production-e2e.yml");
  const production = YAML.parse(productionSource);
  const stagingSource = read("staging-e2e.yml");
  const staging = YAML.parse(stagingSource);

  it("dispatches production E2E only after a successful manual production deployment", () => {
    expect(productionDispatch.on.workflow_run).toEqual({
      workflows: ["Web Deploy - PROD"],
      types: ["completed"],
      branches: ["main"],
    });
    const job = productionDispatch.jobs["dispatch-successful-deploy"];
    expect(job.permissions).toEqual({ actions: "write" });
    expect(job.if).toContain("workflow_run.conclusion == 'success'");
    expect(job.if).toContain("head_repository.full_name == github.repository");
    expect(productionDispatchSource).toContain(
      "actions/workflows/production-e2e.yml/dispatches"
    );
    expect(productionDispatchSource).toContain(
      "automatic_deploy_run_id:$deploy_run_id"
    );
    expect(productionDispatchSource).not.toMatch(
      /sleep|operation_id|authority|release[-_ ]bus/i
    );
  });

  it.each([
    [
      "production",
      production,
      productionSource,
      "build-upload-deploy-prod.yml",
      "main",
    ],
    ["staging", staging, stagingSource, "deploy-staging.yml", "1a-staging"],
  ])(
    "binds %s E2E to the exact successful deploy SHA",
    (_environment, workflow, source, deployPath, branch) => {
      const job = workflow.jobs.readonly ?? workflow.jobs["staging-packs"];
      const resolve = job.steps.find(
        (step: { name?: string }) => step.name === "Resolve exact deployed SHA"
      );
      const sourceMaterialization = job.steps.find(
        (step: { name?: string }) =>
          step.name === "Check out exact deployed source" ||
          step.name === "Materialize exact deployed source"
      );
      expect(
        workflow.on.workflow_dispatch.inputs.automatic_deploy_run_id.required
      ).toBe(false);
      expect(resolve.run).toContain(
        `.path == ".github/workflows/${deployPath}"`
      );
      expect(resolve.run).toContain(`.head_branch == "${branch}"`);
      expect(resolve.run).toContain('.conclusion == "success"');
      expect(resolve.run).toContain(".repository.full_name == $repository");
      if (_environment === "production") {
        expect(sourceMaterialization.run).toContain(
          'git fetch --no-tags --depth=1 origin "$EXPECTED_SHA"'
        );
        expect(sourceMaterialization.env.EXPECTED_SHA).toBe(
          "${{ steps.source.outputs.sha }}"
        );
      } else {
        expect(sourceMaterialization.with.ref).toBe(
          "${{ steps.source.outputs.sha }}"
        );
      }
      expect(source).toContain(
        'test "$(git rev-parse HEAD)" = "$EXPECTED_SHA"'
      );
      expect(source).toContain("DEPLOYMENT_E2E_SOURCE_SHA");
      expect(source).toContain("./bin/6529 run e2e:packs");
      expect(source).not.toMatch(/operation_id|authority|release[-_ ]bus/i);
    }
  );

  it("keeps staging and production E2E concurrency serialized", () => {
    expect(staging.concurrency).toEqual({
      group: "staging-e2e",
      "cancel-in-progress": false,
    });
    expect(production.concurrency).toEqual({
      group: "production-e2e",
      "cancel-in-progress": false,
    });
  });
});
