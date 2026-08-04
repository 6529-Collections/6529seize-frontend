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

    expect(
      e2e.on.workflow_dispatch.inputs.automatic_deploy_run_id.required
    ).toBe(false);
    expect(resolve.run).toContain('.name == "Web Deploy - PROD"');
    expect(resolve.run).toContain(
      '.path == ".github/workflows/build-upload-deploy-prod.yml"'
    );
    expect(resolve.run).toContain('.conclusion == "success"');
    expect(resolve.run).toContain('.head_branch == "main"');
    expect(e2eSource).toContain(
      "inputs.expected_sha || steps.automatic-deploy.outputs.deployed-sha"
    );
    expect(evidence.run).toContain(".release_binding == null");
    expect(e2eSource).toContain("args+=(--parallel 3)");
    expect(e2eSource).toContain("Restore Playwright browser");
  });
});
