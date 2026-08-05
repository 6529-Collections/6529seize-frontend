import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const read = (file: string) =>
  fs.readFileSync(
    path.join(process.cwd(), ".github", "workflows", file),
    "utf8"
  );

describe("production prebuild and promotion contract", () => {
  const buildSource = read("production-build-artifact.yml");
  const deploySource = read("build-upload-deploy-prod.yml");
  const build = YAML.parse(buildSource);
  const deploy = YAML.parse(deploySource);

  it("builds exact main bytes without deployment authority", () => {
    expect(build.on.push.branches).toEqual(["main"]);
    expect(build.on.workflow_dispatch).toBeDefined();
    expect(build.on.push["paths-ignore"]).toEqual([
      ".github/**",
      "__tests__/**",
      "ops/**",
      "tests/**",
    ]);
    const job = build.jobs["build-production-artifact"];
    const serialized = JSON.stringify(job);
    const verifyIndex = job.steps.findIndex(
      (step: { name?: string }) => step.name === "Verify exact production SHA"
    );
    const installIndex = job.steps.findIndex(
      (step: { name?: string }) => step.name === "Install frozen dependencies"
    );

    expect(job.permissions).toEqual({ contents: "read" });
    expect(serialized).not.toContain("AWS_ACCESS_KEY_ID");
    expect(serialized).not.toContain("configure-aws-credentials");
    expect(verifyIndex).toBeGreaterThan(-1);
    expect(verifyIndex).toBeLessThan(installIndex);
    expect(buildSource).toContain('test "$GITHUB_REF" = refs/heads/main');
    expect(buildSource).toContain("./bin/6529 run build:ci");
    expect(buildSource).not.toContain("./bin/6529 run build\n");
    expect(buildSource).toContain('artifact_contract:"production-prebuild-v1"');
    expect(buildSource).toContain("find manifest.json target -type f -print0");
    expect(buildSource).toContain("production-frontend-${{ github.sha }}");
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
