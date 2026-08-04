import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const root = process.cwd();
const scriptPath = path.join(
  root,
  "ops",
  "scripts",
  "deploy-staging-artifact.sh"
);
const script = fs.readFileSync(scriptPath, "utf8");
const workflowSource = fs.readFileSync(
  path.join(root, ".github", "workflows", "deploy-staging.yml"),
  "utf8"
);
const workflow = YAML.parse(workflowSource);

describe("manual staging immutable artifact deployment", () => {
  it("keeps the remote activation script syntactically valid and fail-closed", () => {
    expect(childProcess.spawnSync("bash", ["-n", scriptPath]).status).toBe(0);
    expect(script).toContain('[[ "$ARTIFACT_URL" == https://* ]]');
    expect(script).toContain('[[ "$EXPECTED_DIGEST" =~ ^[a-f0-9]{64}$ ]]');
    expect(script).toContain('[[ "$EXPECTED_SHA" =~ ^[a-f0-9]{40}$ ]]');
    expect(script).toContain("flock -n 9");
    expect(script).toContain(
      "Refusing to replace an unrecognized 6529seize PM2 process"
    );
    expect(script).toContain(
      'echo "$EXPECTED_DIGEST  $artifact_tmp" | sha256sum -c -'
    );
    expect(script).toContain('release_id="$EXPECTED_SHA-$EXPECTED_DIGEST"');
    expect(script).toContain('[[ -f "$staging_app/server.js" ]]');
    expect(script).toContain('grep -qxF "package_sha256=$EXPECTED_DIGEST"');
    expect(script).toContain(
      "Refusing to replace the active staging release after its identity check failed"
    );
    expect(script).toContain(
      '(.pm_exec_path == "/usr/bin/bash" or .pm_exec_path == "/bin/bash")'
    );
    expect(script).toContain(
      'sudo -H -u "$RUN_AS" pm2 --version >/dev/null 2>&1'
    );
    expect(script).toContain("--connect-timeout 30");
    expect(script).toContain("--max-time 900");
    expect(script).toContain(
      'install -m 600 -o "$RUN_AS" -g "$RUN_AS" /dev/null "$destinations_file"'
    );
    expect(script).toContain(
      "unset review_destinations PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_B64"
    );
    expect(script).toContain(
      '[[ "$retain_destinations_file" != true && -n "$destinations_file" ]]'
    );
    expect(script.indexOf("retain_destinations_file=true")).toBeGreaterThan(
      script.indexOf('chown "$RUN_AS:$RUN_AS" "$destinations_file"')
    );
    expect(script).toContain('wait_for_local_version "$EXPECTED_SHA"');
    expect(script.match(/if ! rollback_process; then/g)).toHaveLength(3);
    expect(script).toContain("legacy) restore_legacy_process");
    expect(script).toContain("managed) rollback_managed_process");
    expect(script).toContain("absent) rollback_absent_process");
    expect(script).toContain("deployment is idempotent");
    expect(
      script.indexOf('unzip -q "$artifact_tmp" -d "$staging_app"')
    ).toBeLessThan(script.indexOf('rm -rf -- "$release_app"'));
    expect(script).not.toContain("curl -k");
    expect(script).not.toMatch(/\beval\b/u);
  });

  it("builds without deployment credentials and deploys only verified exact-SHA bytes", () => {
    const build = workflow.jobs["build-staging-artifact"];
    const deploy = workflow.jobs["deploy-staging"];
    const buildSource = JSON.stringify(build);
    const buildStep = build.steps.find(
      (step: { name?: string }) =>
        step.name === "Build and package exact staging bytes"
    );
    const verifyStep = deploy.steps.find(
      (step: { name?: string }) => step.name === "Verify exact staging artifact"
    );
    const sendStep = deploy.steps.find(
      (step: { name?: string }) => step.name === "Send staging deploy command"
    );

    expect(build.needs).toBe("manual-deployment-guard");
    expect(build.permissions).toEqual({ contents: "read" });
    expect(buildSource).not.toContain("secrets.");
    expect(buildStep.run).toContain("./bin/6529 run base-build");
    expect(buildStep.run).not.toContain("./bin/6529 run build\n");
    expect(buildStep.run).toContain('artifact_contract:"manual-staging-v1"');
    expect(deploy.needs).toEqual([
      "manual-deployment-guard",
      "build-staging-artifact",
    ]);
    expect(verifyStep.run).toContain("sha256sum -c SHA256SUMS");
    expect(verifyStep.run).toContain(".source_sha == $source_sha");
    expect(sendStep.run).toContain(
      "bash ops/scripts/deploy-staging-artifact.sh"
    );
    expect(sendStep.run).toContain(
      'sudo -H -u "$RUN_AS" git -C "$REPO_DIR" "$@"'
    );
    expect(sendStep.run).toContain("run_git fetch --no-tags origin");
    expect(sendStep.run).toContain("run_git checkout -B");
    expect(sendStep.run).not.toContain(
      "git config --global --add safe.directory"
    );
    expect(sendStep.run).not.toContain("install:frozen");
    expect(sendStep.run).not.toContain("./bin/6529 run build");
    expect(workflowSource).toContain("--expires-in 5400");
    expect(workflowSource).toContain("Staging artifact cleanup warning");
    expect(workflowSource).toContain("public/help-index.json");
  });

  it("rechecks manual readiness after the build and before cloud mutation", () => {
    const steps = workflow.jobs["deploy-staging"].steps;
    const readinessIndex = steps.findIndex(
      (step: { name?: string }) =>
        step.name === "Reconfirm manual fallback readiness before deployment"
    );
    const awsIndex = steps.findIndex(
      (step: { name?: string }) => step.name === "Configure AWS credentials"
    );

    expect(readinessIndex).toBeGreaterThanOrEqual(0);
    expect(readinessIndex).toBeLessThan(awsIndex);
    expect(steps[readinessIndex].run).toContain(
      "/deploy/release-bus-v2/manual-deployment-readiness"
    );
  });
});
