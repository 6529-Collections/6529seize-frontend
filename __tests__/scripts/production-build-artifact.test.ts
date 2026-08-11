import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const read = (file: string) =>
  fs.readFileSync(
    path.join(process.cwd(), ".github", "workflows", file),
    "utf8"
  );

describe("production exact-artifact deployment contract", () => {
  const buildSource = read("production-build-artifact.yml");
  const deploySource = read("build-upload-deploy-prod.yml");
  const build = YAML.parse(buildSource);
  const deploy = YAML.parse(deploySource);

  it("builds an explicit main-history SHA without deployment credentials", () => {
    expect(build.on.push).toBeUndefined();
    expect(build.on.workflow_dispatch.inputs).toEqual({
      target_sha: expect.objectContaining({ required: true, type: "string" }),
    });
    expect(build.on.workflow_call.inputs).toEqual({
      target_sha: expect.objectContaining({ required: true, type: "string" }),
    });
    expect(build.on.workflow_call.outputs).toEqual(
      expect.objectContaining({
        artifact_id: expect.any(Object),
        artifact_digest: expect.any(Object),
        artifact_name: expect.any(Object),
        package_sha256: expect.any(Object),
        protected_main_sha: expect.any(Object),
        target_sha: expect.any(Object),
        workflow_sha: expect.any(Object),
      })
    );
    expect(buildSource).toContain(
      'git merge-base --is-ancestor "$TARGET_SHA" "$main_sha"'
    );
    expect(buildSource).toContain('git checkout --detach "$TARGET_SHA"');
    expect(buildSource).toContain("./bin/6529 run build:ci");
    expect(buildSource).toContain(
      'artifact_contract:"production-deployment-v1"'
    );
    expect(buildSource).toContain(
      "production-frontend-${TARGET_SHA}-${PRODUCER_RUN_ID}"
    );
    expect(buildSource).toContain("artifact-portability.cjs inventory");
    expect(buildSource).toContain("sha256sum > SHA256SUMS");
    expect(JSON.stringify(build.jobs)).not.toContain("AWS_ACCESS_KEY_ID");
    expect(JSON.stringify(build.jobs)).not.toContain(
      "configure-aws-credentials"
    );
  });

  it("keeps production manual and deploys only the independently verified artifact", () => {
    expect(deploy.name).toBe("Web Deploy - PROD");
    expect(deploy.on.push).toBeUndefined();
    expect(deploy.on.workflow_dispatch).toBeDefined();
    expect(deploy.concurrency).toEqual({
      group: "web-deploy-prod",
      "cancel-in-progress": false,
    });
    expect(deploy.jobs["build-production-artifact"].uses).toBe(
      "./.github/workflows/production-build-artifact.yml"
    );
    expect(deploy.jobs["verify-production-artifact"].uses).toBe(
      "./.github/workflows/production-artifact-verifier.yml"
    );
    expect(deploy.jobs["build-upload-deploy"].needs).toEqual([
      "build-production-artifact",
      "verify-production-artifact",
    ]);
    expect(deploySource).toContain("sha256sum -c SHA256SUMS");
    expect(deploySource).toContain(
      '.artifact_contract == "production-deployment-v1"'
    );
    expect(deploySource).toContain("aws s3 sync production-artifact/target");
    expect(deploySource).toContain("Refuse stale main or production downgrade");
    expect(deploySource).toContain(
      'if [ "$current_main_sha" != "$COMMIT_SHA" ]'
    );
    expect(deploySource).toContain(
      'git merge-base --is-ancestor "$current_version" "$COMMIT_SHA"'
    );
    expect(deploySource).not.toMatch(/release[-_ ]bus/i);
    expect(deploySource).not.toMatch(/operation_id|authority/i);
  });
});
