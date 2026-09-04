import childProcess from "node:child_process";
import fs from "node:fs";
import os from "node:os";
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
const previousSha = "a".repeat(40);
const expectedSha = "b".repeat(40);
const expectedDigest = "c".repeat(64);
const preflightScript = script.slice(
  0,
  script.indexOf("\nprune_release_cache\n")
);

function createRelease(runtimeRoot: string, releaseId: string, sha: string) {
  const app = path.join(runtimeRoot, "releases", releaseId, "app");
  fs.mkdirSync(app, { recursive: true });
  fs.writeFileSync(path.join(app, "server.js"), "// Existing standalone app\n");
  fs.writeFileSync(
    path.join(app, "version.json"),
    JSON.stringify({ stale: false, version: sha })
  );
  return app;
}

function runHostPreflight(
  repo: string,
  pm2Current?: string,
  afterPreflight = "",
  lockHeld = false
) {
  // Exercise the real path adoption, PM2 validation and rollback functions;
  // replace only host privileges, PM2, the lock command and HTTP transport.
  const hostCommands = `
install() {
  while [[ "$1" == -* ]]; do
    case "$1" in
      -o|-g) shift 2 ;;
      -d) shift ;;
      *) return 1 ;;
    esac
  done
  command mkdir -p "$@"
}
chown() { :; }
flock() { [[ "$TEST_LOCK_HELD" != true ]]; }
sudo() {
  [[ "$1" == -H && "$2" == -u && "$4" == pm2 ]] || return 1
  shift 4
  case "$1" in
    --version) printf '6.0.0\\n' ;;
    jlist) printf '%s\\n' "$TEST_PM2_JSON" ;;
    startOrReload)
      [[ -f "$2" ]] || return 1
      printf 'reload %s\\n' "$2" >> "$REPO_DIR/pm2-events"
      ;;
    save) printf 'save\\n' >> "$REPO_DIR/pm2-events" ;;
    *) return 1 ;;
  esac
}
curl() { command cat "$REPO_DIR/.deploy/current/version.json"; }
`;
  const pm2Processes = pm2Current
    ? [
        {
          name: "6529seize",
          pm2_env: {
            exec_mode: "cluster_mode",
            pm_cwd: pm2Current,
            pm_exec_path: path.join(pm2Current, "server.js"),
            args: [],
          },
        },
      ]
    : [];
  return childProcess.spawnSync(
    "bash",
    ["-c", `${hostCommands}\n${preflightScript}\n${afterPreflight}`],
    {
      encoding: "utf8",
      timeout: 10_000,
      env: {
        ...process.env,
        REPO_DIR: repo,
        RUN_AS: os.userInfo().username,
        ARTIFACT_URL: "https://example.invalid/artifact.zip",
        EXPECTED_SHA: expectedSha,
        EXPECTED_DIGEST: expectedDigest,
        PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_B64: "e30=",
        SSR_CLIENT_ID_B64: "Y2xpZW50",
        SSR_CLIENT_SECRET_B64: "c2VjcmV0",
        TEST_PM2_JSON: JSON.stringify(pm2Processes),
        TEST_LOCK_HELD: String(lockHeld),
      },
    }
  );
}

describe("staging runtime directory", () => {
  let repo: string;
  let runtimeRoot: string;

  beforeEach(() => {
    repo = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), "staging-runtime-"))
    );
    fs.mkdirSync(path.join(repo, ".git"));
    runtimeRoot = path.join(repo, ".deploy");
  });

  afterEach(() => {
    fs.rmSync(repo, { recursive: true, force: true });
  });

  function createPreviousRuntime() {
    const previousApp = createRelease(runtimeRoot, previousSha, previousSha);
    fs.symlinkSync(previousApp, path.join(runtimeRoot, "current"));
    fs.writeFileSync(path.join(runtimeRoot, "deploy.lock"), "existing lock");
    fs.writeFileSync(
      path.join(runtimeRoot, "ecosystem.config.cjs"),
      "// config\n"
    );
    fs.writeFileSync(path.join(runtimeRoot, "runtime-secrets.json"), "{}", {
      mode: 0o600,
    });
    return previousApp;
  }

  it.each(["current", "release"])(
    "recognizes a live %s path without moving files or replacing the lock",
    (pm2Path) => {
      const previousApp = createPreviousRuntime();
      const lockBefore = fs.statSync(path.join(runtimeRoot, "deploy.lock"));
      const secretsBefore = fs.statSync(
        path.join(runtimeRoot, "runtime-secrets.json")
      );
      const result = runHostPreflight(
        repo,
        pm2Path === "current" ? path.join(runtimeRoot, "current") : previousApp
      );

      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);
      expect(fs.lstatSync(runtimeRoot).isDirectory()).toBe(true);
      expect(fs.realpathSync(path.join(runtimeRoot, "current"))).toBe(
        previousApp
      );
      expect(fs.statSync(path.join(runtimeRoot, "deploy.lock")).ino).toBe(
        lockBefore.ino
      );
      const secretsAfter = fs.statSync(
        path.join(runtimeRoot, "runtime-secrets.json")
      );
      expect(secretsAfter.ino).toBe(secretsBefore.ino);
      expect(secretsAfter.mode & 0o777).toBe(0o600);
      expect(fs.existsSync(path.join(repo, "pm2-events"))).toBe(false);
    }
  );

  it("rolls back to the previous managed release", () => {
    const previousApp = createPreviousRuntime();
    createRelease(runtimeRoot, `${expectedSha}-${expectedDigest}`, expectedSha);

    const result = runHostPreflight(
      repo,
      path.join(runtimeRoot, "current"),
      'ln -sfn "$release_app" "$current_link"\nrollback_managed_process'
    );

    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(fs.realpathSync(path.join(runtimeRoot, "current"))).toBe(
      previousApp
    );
    expect(fs.readFileSync(path.join(repo, "pm2-events"), "utf8")).toBe(
      `reload ${runtimeRoot}/ecosystem.config.cjs\nsave\n`
    );
  });

  it("creates a neutral runtime directory on a fresh host", () => {
    const result = runHostPreflight(repo);

    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(fs.lstatSync(runtimeRoot).isDirectory()).toBe(true);
    expect(fs.existsSync(path.join(runtimeRoot, "deploy.lock"))).toBe(true);
  });

  it("keeps an already healthy exact artifact idempotent", () => {
    const releaseId = `${expectedSha}-${expectedDigest}`;
    const app = createRelease(runtimeRoot, releaseId, expectedSha);
    fs.symlinkSync(app, path.join(runtimeRoot, "current"));
    fs.writeFileSync(
      path.join(runtimeRoot, "releases", releaseId, "artifact.env"),
      `source_sha=${expectedSha}\npackage_sha256=${expectedDigest}\n`
    );

    const result = runHostPreflight(repo, path.join(runtimeRoot, "current"));

    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("deployment is idempotent");
    expect(fs.realpathSync(path.join(runtimeRoot, "current"))).toBe(app);
    expect(fs.existsSync(path.join(repo, "pm2-events"))).toBe(false);
  });

  it("stops when another deployment holds the shared lock", () => {
    const previousApp = createPreviousRuntime();
    const result = runHostPreflight(
      repo,
      path.join(runtimeRoot, "current"),
      "",
      true
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "Another instance-local staging deployment"
    );
    expect(fs.realpathSync(path.join(runtimeRoot, "current"))).toBe(
      previousApp
    );
    expect(fs.existsSync(path.join(repo, "pm2-events"))).toBe(false);
  });

  it("rejects an unexpected runtime symlink", () => {
    fs.symlinkSync(repo, runtimeRoot);

    const result = runHostPreflight(repo);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("staging runtime symlink");
    expect(fs.existsSync(path.join(repo, "deploy.lock"))).toBe(false);
  });

  it("rejects a current release outside the managed cache", () => {
    const otherApp = createRelease(repo, previousSha, previousSha);
    fs.mkdirSync(runtimeRoot);
    fs.symlinkSync(otherApp, path.join(runtimeRoot, "current"));

    const result = runHostPreflight(repo, otherApp);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("unrecognized staging current release");
    expect(fs.existsSync(path.join(otherApp, "server.js"))).toBe(true);
  });
});

describe("staging immutable artifact deployment", () => {
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

  it("loads required SSR credentials from deployment secrets", () => {
    expect(script).toContain(
      'runtime_secrets_file="$release_root/runtime-secrets.json"'
    );
    expect(script).toContain("chmod 600");
    expect(script).toContain(
      "const runtimeSecretsPath = path.join(__dirname, 'runtime-secrets.json');"
    );
    expect(script).toContain(
      "['SSR_CLIENT_ID']: requireRuntimeEnv('SSR_CLIENT_ID')"
    );
    expect(script).toContain(
      "['SSR_CLIENT_SECRET']: requireRuntimeEnv('SSR_CLIENT_SECRET')"
    );
    expect(workflowSource).toContain(
      "STAGING_SSR_CLIENT_ID: ${{ secrets.STAGING_SSR_CLIENT_ID }}"
    );
    expect(workflowSource).toContain(
      "STAGING_SSR_CLIENT_SECRET: ${{ secrets.STAGING_SSR_CLIENT_SECRET }}"
    );
    expect(workflowSource).not.toContain("secrets.SSR_CLIENT_");
    expect(workflowSource).toContain(
      'SSR_CLIENT_ID_B64="$SSR_CLIENT_ID_B64" \\'
    );
    expect(workflowSource).toContain(
      'SSR_CLIENT_SECRET_B64="$SSR_CLIENT_SECRET_B64" \\'
    );
    expect(
      workflowSource.indexOf(
        'SSR_CLIENT_SECRET_B64="$SSR_CLIENT_SECRET_B64" \\'
      )
    ).toBeLessThan(
      workflowSource.indexOf("bash ops/scripts/deploy-staging-artifact.sh")
    );
    expect(
      script.indexOf('echo "$EXPECTED_DIGEST  $artifact_tmp" | sha256sum -c -')
    ).toBeLessThan(
      script.indexOf(
        'runtime_secrets_tmp="$(mktemp "$release_root/runtime-secrets.XXXXXX.json")"'
      )
    );
  });

  it("builds without deployment credentials and deploys only verified exact-SHA bytes", () => {
    const build = workflow.jobs["build-staging-artifact"];
    const deploy = workflow.jobs["deploy-staging"];
    const buildSource = JSON.stringify(build);
    const buildStep = build.steps.find(
      (step: { name?: string }) =>
        step.name === "Build and package exact staging bytes"
    );
    const installStep = build.steps.find(
      (step: { name?: string }) => step.name === "Install frozen dependencies"
    );
    const verifyStep = deploy.steps.find(
      (step: { name?: string }) => step.name === "Verify exact staging artifact"
    );
    const sendStep = deploy.steps.find(
      (step: { name?: string }) => step.name === "Send staging deploy command"
    );

    expect(build.needs).toBeUndefined();
    expect(build.permissions).toEqual({
      contents: "read",
      packages: "read",
    });
    expect(installStep.env.NODE_AUTH_TOKEN).toBe("${{ github.token }}");
    expect(build.env.NEXTGEN_CHAIN_ID).toBe(
      "${{ vars.STAGING_NEXTGEN_CHAIN_ID || '1' }}"
    );
    expect(buildSource).not.toContain("secrets.");
    expect(buildSource).not.toContain("11155111");
    expect(buildStep.run).toContain("./bin/6529 run base-build");
    expect(buildStep.run).not.toContain("./bin/6529 run build\n");
    expect(buildStep.run).toContain(
      'artifact_contract:"staging-deployment-v1"'
    );
    expect(deploy.needs).toBe("build-staging-artifact");
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

  it("has only canonical staging triggers and no external deployment authority", () => {
    expect(workflow.on.push.branches).toEqual(["1a-staging"]);
    expect(workflow.on.workflow_dispatch).toBeDefined();
    expect(workflowSource).toContain(
      'test "$GITHUB_REF" = refs/heads/1a-staging'
    );
    expect(workflowSource).not.toMatch(/release[ -]?bus/iu);
    expect(workflowSource).not.toContain("operation_id");
    expect(workflowSource).not.toContain("deployment-bus-manifest");
  });
});
