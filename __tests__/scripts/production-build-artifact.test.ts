import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const read = (file: string) =>
  fs.readFileSync(
    path.join(process.cwd(), ".github", "workflows", file),
    "utf8"
  );

describe("production artifact builder and promotion contract", () => {
  const buildSource = read("production-build-artifact.yml");
  const deploySource = read("build-upload-deploy-prod.yml");
  const build = YAML.parse(buildSource);
  const deploy = YAML.parse(deploySource);

  it("builds only an explicit exact-SHA operation without deployment authority", () => {
    expect(build.on.push).toBeUndefined();
    expect(build.on.workflow_dispatch.inputs.target_sha).toMatchObject({
      required: true,
      type: "string"
    });
    expect(build.on.workflow_dispatch.inputs.operation_id).toMatchObject({
      required: true,
      type: "string"
    });
    expect(build.on.workflow_call.inputs.target_sha).toMatchObject({
      required: true,
      type: "string"
    });
    expect(build.on.workflow_call.inputs.operation_id).toMatchObject({
      required: true,
      type: "string"
    });
    expect(build.on.workflow_call.outputs.artifact_id).toBeDefined();
    expect(build.on.workflow_call.outputs.artifact_digest).toBeDefined();
    expect(build.on.workflow_call.outputs.artifact_name).toBeDefined();
    expect(build.on.workflow_call.outputs.operation_id).toBeDefined();
    expect(build.on.workflow_call.outputs.protected_main_sha).toBeDefined();
    expect(build.on.workflow_call.outputs.producer_run_attempt).toBeDefined();
    expect(build.on.workflow_call.outputs.producer_run_id).toBeDefined();
    expect(build.on.workflow_call.outputs.target_sha).toBeDefined();
    expect(build.on.workflow_call.outputs.workflow_sha).toBeDefined();
    const job = build.jobs["build-production-artifact"];
    const serialized = JSON.stringify(job);
    const verifyIndex = job.steps.findIndex(
      (step: { name?: string }) =>
        step.name === "Verify target SHA is in protected main history"
    );
    const installIndex = job.steps.findIndex(
      (step: { name?: string }) => step.name === "Install frozen dependencies"
    );

    expect(job.permissions).toEqual({ contents: "read" });
    expect(serialized).not.toContain("AWS_ACCESS_KEY_ID");
    expect(serialized).not.toContain("configure-aws-credentials");
    expect(buildSource).toContain("ref: main");
    expect(buildSource).toContain("fetch-depth: 0");
    expect(buildSource).toContain('AUTHORIZATION: basic ${auth_header}');
    expect(buildSource).toContain('WORKFLOW_SHA: ${{ github.sha }}');
    expect(buildSource).toContain(
      'git merge-base --is-ancestor "$TARGET_SHA" "$main_sha"'
    );
    expect(buildSource).toContain(
      'git merge-base --is-ancestor "$WORKFLOW_SHA" "$main_sha"'
    );
    expect(buildSource).toContain('git checkout --detach "$TARGET_SHA"');
    expect(buildSource).toContain('TARGET_SHA: ${{ inputs.target_sha }}');
    expect(buildSource).toContain('OPERATION_ID: ${{ inputs.operation_id }}');
    expect(verifyIndex).toBeGreaterThan(-1);
    expect(verifyIndex).toBeLessThan(installIndex);
    expect(buildSource).toContain("./bin/6529 run build:ci");
    expect(buildSource).not.toContain("./bin/6529 run build\n");
    expect(buildSource).toContain(
      'artifact_contract:"production-prebuild-v2"'
    );
    expect(buildSource).toContain("artifact_name:$artifact_name");
    expect(buildSource).toContain("target_sha:$target_sha");
    expect(buildSource).toContain("operation_id:$operation_id");
    expect(buildSource).toContain("workflow_sha:$workflow_sha");
    expect(buildSource).toContain("protected_main_sha:$protected_main_sha");
    expect(buildSource).toContain("workflow_run_id:$producer_run_id");
    expect(buildSource).toContain("run_attempt:$producer_run_attempt");
    expect(buildSource).not.toContain(
      "production-frontend-${{ inputs.target_sha }}-${{ inputs.operation_id }}-${{ github.run_attempt }}"
    );
    expect(buildSource).toContain(
      "find manifest.json artifact-portability.json target -type f -print0"
    );
    expect(buildSource).toContain(
      "production-frontend-${{ inputs.target_sha }}-${{ inputs.operation_id }}"
    );
    expect(buildSource).toContain(
      "^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$"
    );
    expect(job["runs-on"]).toContain("PRODUCTION_BUILD_RUNNER");
    expect(JSON.stringify(build.jobs)).not.toContain('"uses":"./.github/');
  });

  it("promotes only a successful exact-workflow artifact and never rebuilds", () => {
    const job = deploy.jobs["build-upload-deploy"];
    const serialized = JSON.stringify(job);
    const locate = job.steps.find(
      (step: { name?: string }) =>
        step.name === "Locate successful exact production prebuild"
    );
    const verifyIndex = job.steps.findIndex(
      (step: { name?: string }) =>
        step.name === "Verify exact production artifact"
    );
    const awsIndex = job.steps.findIndex(
      (step: { name?: string }) => step.name === "Configure AWS Credentials"
    );

    expect(job.permissions).toMatchObject({
      actions: "read",
      contents: "read",
    });
    expect(locate["timeout-minutes"]).toBe(5);
    expect(locate.run).toContain(
      '.path == ".github/workflows/production-build-artifact.yml"'
    );
    expect(locate.run).toContain(".head_sha == $sha");
    expect(locate.run).toContain('.conclusion == "success"');
    expect(locate.run).toContain(
      '(.event == "push" or .event == "workflow_dispatch")'
    );
    expect(locate.run).toContain(
      "No successful exact production prebuild is available"
    );
    expect(verifyIndex).toBeGreaterThan(-1);
    expect(verifyIndex).toBeLessThan(awsIndex);
    expect(deploySource).toContain("sha256sum -c SHA256SUMS");
    expect(deploySource).toContain(".source_sha == $source_sha");
    expect(deploySource).toContain("aws s3 sync production-artifact/target");
    expect(serialized).not.toContain("Install dependencies");
    expect(serialized).not.toContain("Build App");
    expect(serialized).not.toContain("./bin/6529 run build");
    expect(job["runs-on"]).toContain("PRODUCTION_BUILD_RUNNER");
  });
});
