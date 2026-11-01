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
let historyRepo: string;
let previousSha: string;
let expectedSha: string;
let newerSha: string;
let divergentSha: string;
const expectedDigest = "c".repeat(64);
const preflightScript = script.slice(
  0,
  script.indexOf("\nprune_release_cache\n")
);

function git(repo: string, ...args: string[]) {
  return childProcess
    .execFileSync("git", ["-C", repo, ...args], {
      encoding: "utf8",
      input: "",
      timeout: 10_000,
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: "Staging Test",
        GIT_AUTHOR_EMAIL: "staging@example.invalid",
        GIT_COMMITTER_NAME: "Staging Test",
        GIT_COMMITTER_EMAIL: "staging@example.invalid",
      },
    })
    .trim();
}

beforeAll(() => {
  historyRepo = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), "staging-history-"))
  );
  git(historyRepo, "init", "--quiet", "--initial-branch=1a-staging");
  const fixtureScripts = path.join(historyRepo, "ops", "scripts");
  fs.mkdirSync(fixtureScripts, { recursive: true });
  fs.writeFileSync(
    path.join(fixtureScripts, "deploy-staging-artifact.sh"),
    preflightScript
  );
  fs.copyFileSync(
    path.join(root, "ops", "scripts", "validate-ethereum-rpc-url.cjs"),
    path.join(fixtureScripts, "validate-ethereum-rpc-url.cjs")
  );
  const commit = (message: string, parent?: string) => {
    fs.writeFileSync(path.join(historyRepo, "source-version.txt"), message);
    git(historyRepo, "add", "ops", "source-version.txt");
    return git(
      historyRepo,
      "-c",
      "commit.gpgsign=false",
      "commit-tree",
      git(historyRepo, "write-tree"),
      "-m",
      message,
      ...(parent ? ["-p", parent] : [])
    );
  };
  previousSha = commit("Previously deployed");
  expectedSha = commit("Active deployment", previousSha);
  newerSha = commit("Queued deployment", expectedSha);
  divergentSha = commit("Divergent deployment", previousSha);
  git(historyRepo, "update-ref", "refs/heads/1a-staging", newerSha);
});

afterAll(() => {
  fs.rmSync(historyRepo, { recursive: true, force: true });
});

function copyHistory(repo: string) {
  fs.cpSync(path.join(historyRepo, ".git"), path.join(repo, ".git"), {
    recursive: true,
  });
  git(repo, "update-ref", "HEAD", expectedSha);
}

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

// Exercise actual source checks, runtime validation and rollback functions;
// replace host privileges, PM2, the lock command and HTTP transport.
const runtimeHostCommands = `
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
  if [[ "$4" == git ]]; then
    shift 4
    command git "$@"
    return
  fi
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
curl() { command cat "\${TEST_LOCAL_VERSION_FILE:-$REPO_DIR/.deploy/current/version.json}"; }
`;

function runHostPreflight(
  repo: string,
  pm2Current?: string,
  afterPreflight = "",
  lockHeld = false,
  ethereumRpcUrl = "https://eth-mainnet.example.test",
  alchemyApiKey = "staging-test-key"
) {
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
    ["-c", `${runtimeHostCommands}\n${preflightScript}\n${afterPreflight}`],
    {
      encoding: "utf8",
      timeout: 10_000,
      env: {
        ...process.env,
        REPO_DIR: repo,
        SOURCE_DIR: repo,
        RUN_AS: os.userInfo().username,
        ARTIFACT_URL: "https://example.invalid/artifact.zip",
        EXPECTED_SHA: expectedSha,
        EXPECTED_DIGEST: expectedDigest,
        SSR_CLIENT_ID_B64: "Y2xpZW50",
        SSR_CLIENT_SECRET_B64: "c2VjcmV0",
        ETHEREUM_RPC_URL_B64: Buffer.from(ethereumRpcUrl).toString("base64"),
        ALCHEMY_API_KEY_B64: Buffer.from(alchemyApiKey).toString("base64"),
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
    copyHistory(repo);
    fs.mkdirSync(path.join(repo, "ops", "scripts"), { recursive: true });
    fs.copyFileSync(
      path.join(root, "ops", "scripts", "validate-ethereum-rpc-url.cjs"),
      path.join(repo, "ops", "scripts", "validate-ethereum-rpc-url.cjs")
    );
    runtimeRoot = path.join(repo, ".deploy");
  });

  afterEach(() => {
    fs.rmSync(repo, { recursive: true, force: true });
  });

  function createPreviousRuntime(sha = previousSha) {
    const previousApp = createRelease(runtimeRoot, sha, sha);
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

  it.each(["newer", "divergent", "missing history"] as const)(
    "rejects a candidate over a healthy runtime with %s source",
    (source) => {
      const versions = {
        newer: newerSha,
        divergent: divergentSha,
        "missing history": "e".repeat(40),
      };
      const previousApp = createPreviousRuntime(versions[source]);
      const result = runHostPreflight(repo, previousApp);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("Refusing to replace healthy staging");
      expect(fs.realpathSync(path.join(runtimeRoot, "current"))).toBe(
        previousApp
      );
      expect(fs.existsSync(path.join(repo, "pm2-events"))).toBe(false);
      expect(
        fs.existsSync(
          path.join(runtimeRoot, "releases", `${expectedSha}-${expectedDigest}`)
        )
      ).toBe(false);
    }
  );

  it("rejects an unhealthy runtime before activation", () => {
    const previousApp = createPreviousRuntime();
    fs.writeFileSync(
      path.join(previousApp, "version.json"),
      JSON.stringify({ stale: true, version: previousSha })
    );

    const result = runHostPreflight(repo, previousApp);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "without an exact healthy pre-mutation local version"
    );
    expect(fs.existsSync(path.join(repo, "pm2-events"))).toBe(false);
  });

  it("verifies the pinned checkout while holding the instance lock", () => {
    git(repo, "update-ref", "HEAD", newerSha);

    const result = runHostPreflight(repo);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "checkout that differs from the verified source"
    );
    expect(fs.existsSync(path.join(repo, "pm2-events"))).toBe(false);
  });

  it("rejects a malformed Ethereum RPC URL before changing runtime state", () => {
    const result = runHostPreflight(repo, undefined, "", false, "https://");

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "ETHEREUM_RPC_URL must be a complete HTTP(S) URL"
    );
    expect(fs.existsSync(runtimeRoot)).toBe(false);
  });

  it.each(["", "\n"])(
    "rejects an empty Alchemy key before changing runtime state (%j)",
    (key) => {
      const result = runHostPreflight(
        repo,
        undefined,
        "",
        false,
        undefined,
        key
      );

      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(/ALCHEMY_API_KEY_B64|Alchemy API key/);
      expect(fs.existsSync(runtimeRoot)).toBe(false);
      expect(fs.existsSync(path.join(repo, "pm2-events"))).toBe(false);
    }
  );

  it("passes the staging Alchemy key through the private runtime store into PM2", () => {
    createRelease(runtimeRoot, `${expectedSha}-${expectedDigest}`, expectedSha);
    const key = "test-key-'\"$;\\value";
    const runtimeSetup = script.slice(
      script.indexOf('runtime_secrets_tmp="$(mktemp'),
      script.indexOf('\nif [[ "$process_kind" == legacy ]]')
    );
    const result = runHostPreflight(
      repo,
      undefined,
      runtimeSetup,
      false,
      undefined,
      key
    );

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(`${result.stdout}${result.stderr}`).not.toContain(key);
    expect(`${result.stdout}${result.stderr}`).not.toContain(
      Buffer.from(key).toString("base64")
    );
    const secretsPath = path.join(runtimeRoot, "runtime-secrets.json");
    expect(JSON.parse(fs.readFileSync(secretsPath, "utf8"))).toEqual({
      SSR_CLIENT_ID: "client",
      SSR_CLIENT_SECRET: "secret",
      ETHEREUM_RPC_URL: "https://eth-mainnet.example.test",
      ALCHEMY_API_KEY: key,
    });
    expect(fs.statSync(secretsPath).mode & 0o777).toBe(0o600);
    const config = require(path.join(runtimeRoot, "ecosystem.config.cjs"));
    expect(config.apps[0].env.ALCHEMY_API_KEY).toBe(key);
    expect(config.apps[0].env.KEEP_ALIVE_TIMEOUT).toBe("65000");
    expect(config.apps[0].env.UV_THREADPOOL_SIZE).toBe("16");
    expect(config.apps[0].env).not.toHaveProperty("STAGING_ALCHEMY_API_KEY");
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

describe("staging SSM shell wrapper", () => {
  let repo: string;
  let commandLog: string;

  beforeEach(() => {
    repo = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), "staging-ssm-"))
    );
    copyHistory(repo);
    git(repo, "remote", "add", "origin", historyRepo);
    git(repo, "reset", "--hard", newerSha);
    commandLog = path.join(repo, "commands");
    fs.writeFileSync(commandLog, "");
  });

  afterEach(() => {
    fs.rmSync(repo, { recursive: true, force: true });
  });

  function runWrapper(
    fetchedSha: string,
    finalSha = expectedSha,
    candidateSha = expectedSha,
    runtime?: {
      kind: "managed" | "legacy";
      version: string;
      lockHeld?: boolean;
    }
  ) {
    git(historyRepo, "update-ref", "refs/heads/1a-staging", fetchedSha);
    const sendStep = workflow.jobs["deploy-staging"].steps.find(
      (step: { name?: string }) => step.name === "Send staging deploy command"
    );
    const body = sendStep.run.match(
      /cat <<'REMOTE_SCRIPT_BODY'\n([\s\S]*?)\nREMOTE_SCRIPT_BODY/u
    )?.[1];
    expect(body).toBeDefined();

    const preflightRunner = path.join(repo, "test-host.sh");
    fs.writeFileSync(preflightRunner, `${runtimeHostCommands}\nsource "$1"\n`);
    const localVersionFile = path.join(repo, "test-local-version.json");
    fs.writeFileSync(
      localVersionFile,
      JSON.stringify({ stale: false, version: runtime?.version })
    );
    let pm2Processes: unknown[] = [];
    if (runtime?.kind === "legacy") {
      pm2Processes = [
        {
          name: "6529seize",
          pm2_env: {
            exec_mode: "fork_mode",
            pm_exec_path: "/bin/bash",
            pm_cwd: repo,
            args: ["-lc", `cd "${repo}" && ./bin/6529 run start:standalone`],
          },
        },
      ];
    } else if (runtime?.kind === "managed") {
      const current = path.join(repo, ".deploy", "current");
      const app = createRelease(
        path.join(repo, ".deploy"),
        runtime.version,
        runtime.version
      );
      fs.symlinkSync(app, current);
      pm2Processes = [
        {
          name: "6529seize",
          pm2_env: {
            exec_mode: "cluster_mode",
            pm_exec_path: path.join(current, "server.js"),
            pm_cwd: current,
            args: [],
          },
        },
      ];
    }

    // Keep the real /bin/sh wrapper and real Git worktrees. The integrated
    // cases also execute the candidate's actual runtime preflight in Bash.
    const hostCommands = `
set -eu
id() { return 0; }
base64() { :; }
jq() { :; }
sudo() {
  [ "$1" = -H ] && [ "$2" = -u ] && [ "$3" = "$RUN_AS" ] &&
    [ "$4" = mktemp ] && { command mktemp -d "$REPO_DIR/.candidate.XXXXXX"; return; }
  [ "$1" = -H ] && [ "$2" = -u ] && [ "$3" = "$RUN_AS" ] &&
    [ "$4" = git ] && [ "$5" = -C ] || return 1
  git_dir="$6"
  shift 6
  printf 'git %s\\n' "$*" >> "$TEST_COMMAND_LOG"
  case "$1 $2" in
    'rev-parse HEAD') printf '%s\\n' "$TEST_FINAL_SHA" ;;
    'worktree add') command git -C "$git_dir" "$@" > /dev/null 2>&1 ;;
    *) command git -C "$git_dir" "$@" 2>/dev/null ;;
  esac
}
bash() {
  printf 'bash %s\\n' "$*" >> "$TEST_COMMAND_LOG"
  if [ "$1" = -n ]; then command bash "$@"; return; fi
  command git -C "$SOURCE_DIR" rev-parse HEAD > "$REPO_DIR/candidate-head"
  if [ "$TEST_RUN_PREFLIGHT" = true ]; then
    command bash "$TEST_PREFLIGHT_RUNNER" "$@"
  fi
}
`;
    return childProcess.spawnSync(
      "/bin/sh",
      ["-c", `${hostCommands}\n${body}`],
      {
        encoding: "utf8",
        timeout: 10_000,
        env: {
          ...process.env,
          REPO_DIR: repo,
          RUN_AS: os.userInfo().username,
          BRANCH: "1a-staging",
          EXPECTED_SHA: candidateSha,
          EXPECTED_DIGEST: expectedDigest,
          ARTIFACT_URL: "https://example.invalid/artifact.zip",
          SSR_CLIENT_ID_B64: "Y2xpZW50",
          SSR_CLIENT_SECRET_B64: "c2VjcmV0",
          TEST_COMMAND_LOG: commandLog,
          ETHEREUM_RPC_URL_B64: Buffer.from("https://example.invalid").toString(
            "base64"
          ),
          ALCHEMY_API_KEY_B64:
            Buffer.from("staging-test-key").toString("base64"),
          TEST_FINAL_SHA: finalSha,
          TEST_RUN_PREFLIGHT: String(Boolean(runtime)),
          TEST_PREFLIGHT_RUNNER: preflightRunner,
          TEST_LOCAL_VERSION_FILE: localVersionFile,
          TEST_PM2_JSON: JSON.stringify(pm2Processes),
          TEST_LOCK_HELD: String(runtime?.lockHeld ?? false),
        },
      }
    );
  }

  function commands() {
    return fs
      .readFileSync(commandLog, "utf8")
      .trim()
      .split("\n")
      .map((command) =>
        command.replace(/\/[^ ]+\/\.candidate\.[^ ]+/gu, "<candidate>")
      );
  }

  function makeShallowCheckout(sha: string) {
    git(historyRepo, "update-ref", "refs/heads/1a-staging", sha);
    fs.rmSync(repo, { recursive: true, force: true });
    fs.mkdirSync(repo);
    git(repo, "clone", "--quiet", "--depth=1", `file://${historyRepo}`, ".");
    fs.writeFileSync(commandLog, "");
    expect(git(repo, "rev-parse", "--is-shallow-repository")).toBe("true");
    expect(git(repo, "rev-list", "--count", "HEAD")).toBe("1");
  }

  it("rejects source outside staging history before changing the checkout", () => {
    const result = runWrapper(divergentSha);

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("is not in origin 1a-staging history");
    expect(result.stderr).not.toContain("[[: not found");
    expect(commands()).toEqual([
      "git rev-parse --is-shallow-repository",
      "git fetch --no-tags origin 1a-staging",
      "git rev-parse FETCH_HEAD",
      `git cat-file -e ${expectedSha}^{commit}`,
      `git merge-base --is-ancestor ${expectedSha} ${divergentSha}`,
    ]);
  });

  it.each(["matching", "advanced"])(
    "pins the verified source when staging is %s",
    (head) => {
      const fetchedSha = head === "advanced" ? newerSha : expectedSha;
      const result = runWrapper(fetchedSha);

      expect(result.error).toBeUndefined();
      expect(result.status).toBe(0);
      expect(result.stderr).toBe("");
      expect(commands()).toEqual([
        "git rev-parse --is-shallow-repository",
        "git fetch --no-tags origin 1a-staging",
        "git rev-parse FETCH_HEAD",
        `git cat-file -e ${expectedSha}^{commit}`,
        `git merge-base --is-ancestor ${expectedSha} ${fetchedSha}`,
        `git worktree add --detach <candidate> ${expectedSha}`,
        "git rev-parse HEAD",
        "bash -n ops/scripts/deploy-staging-artifact.sh",
        "bash ops/scripts/deploy-staging-artifact.sh",
        "git worktree remove <candidate>",
      ]);
      expect(git(repo, "rev-parse", "HEAD")).toBe(newerSha);
      expect(
        fs.readFileSync(path.join(repo, "candidate-head"), "utf8").trim()
      ).toBe(expectedSha);
      expect(
        git(repo, "worktree", "list", "--porcelain").match(/^worktree /gmu)
      ).toHaveLength(1);
    }
  );

  it.each(["matching", "advanced"])(
    "restores shallow history before pinning when staging is %s",
    (head) => {
      const fetchedSha = head === "advanced" ? newerSha : expectedSha;
      makeShallowCheckout(fetchedSha);

      const result = runWrapper(fetchedSha);

      expect(result.error).toBeUndefined();
      expect(result.status).toBe(0);
      expect(result.stderr).toBe("");
      expect(git(repo, "rev-parse", "--is-shallow-repository")).toBe("false");
      expect(git(repo, "rev-parse", "HEAD")).toBe(fetchedSha);
      expect(
        fs.readFileSync(path.join(repo, "candidate-head"), "utf8").trim()
      ).toBe(expectedSha);
      expect(
        git(repo, "merge-base", "--is-ancestor", previousSha, expectedSha)
      ).toBe("");
      expect(commands()).toContain(
        "git fetch --no-tags --unshallow origin 1a-staging"
      );
    }
  );

  it("stops before checkout and activation when unshallowing fails", () => {
    makeShallowCheckout(newerSha);
    git(repo, "remote", "set-url", "origin", path.join(repo, "missing-origin"));

    const result = runWrapper(newerSha);

    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(git(repo, "rev-parse", "HEAD")).toBe(newerSha);
    expect(
      commands().some((command) => command.startsWith("git checkout"))
    ).toBe(false);
    expect(commands().some((command) => command.startsWith("bash "))).toBe(
      false
    );
  });

  it("rejects an unavailable pinned commit before changing the checkout", () => {
    const result = runWrapper(newerSha, expectedSha, "f".repeat(40));

    expect(result.status).not.toBe(0);
    expect(
      commands().some((command) => command.startsWith("git checkout"))
    ).toBe(false);
    expect(commands().some((command) => command.startsWith("bash "))).toBe(
      false
    );
  });

  it("still refuses activation when final HEAD differs", () => {
    const result = runWrapper(expectedSha, previousSha);

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toBe("");
    expect(commands()).toContain("git rev-parse HEAD");
    expect(commands().at(-1)).toBe("git worktree remove <candidate>");
    expect(commands().some((command) => command.startsWith("bash "))).toBe(
      false
    );
  });

  it.each(["managed", "legacy"] as const)(
    "leaves the live checkout and %s runtime intact when rejecting an old rerun",
    (kind) => {
      const marker = path.join(repo, "source-version.txt");
      fs.writeFileSync(marker, "Live checkout local contents");
      const beforeStatus = git(
        repo,
        "diff",
        "HEAD",
        "--",
        "source-version.txt"
      );

      const result = runWrapper(newerSha, expectedSha, expectedSha, {
        kind,
        version: newerSha,
      });

      expect(result.error).toBeUndefined();
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("Refusing to replace healthy staging");
      expect(git(repo, "rev-parse", "HEAD")).toBe(newerSha);
      expect(fs.readFileSync(marker, "utf8")).toBe(
        "Live checkout local contents"
      );
      expect(git(repo, "diff", "HEAD", "--", "source-version.txt")).toBe(
        beforeStatus
      );
      expect(fs.existsSync(path.join(repo, "pm2-events"))).toBe(false);
      expect(
        git(repo, "worktree", "list", "--porcelain").match(/^worktree /gmu)
      ).toHaveLength(1);
      if (kind === "managed") {
        expect(
          JSON.parse(
            fs.readFileSync(
              path.join(repo, ".deploy", "current", "version.json"),
              "utf8"
            )
          ).version
        ).toBe(newerSha);
      }
    }
  );

  it.each(["managed", "legacy"] as const)(
    "accepts a forward candidate from isolated source with a %s runtime",
    (kind) => {
      git(repo, "reset", "--hard", previousSha);

      const result = runWrapper(newerSha, expectedSha, expectedSha, {
        kind,
        version: previousSha,
      });

      expect(result.error).toBeUndefined();
      expect(result.status).toBe(0);
      expect(result.stderr).toBe("");
      expect(git(repo, "rev-parse", "HEAD")).toBe(previousSha);
      expect(
        fs.readFileSync(path.join(repo, "source-version.txt"), "utf8")
      ).toBe("Previously deployed");
      expect(
        fs.readFileSync(path.join(repo, "candidate-head"), "utf8").trim()
      ).toBe(expectedSha);
      expect(
        git(repo, "worktree", "list", "--porcelain").match(/^worktree /gmu)
      ).toHaveLength(1);
    }
  );

  it("leaves the live checkout intact and cleans the candidate when the instance lock is held", () => {
    const result = runWrapper(newerSha, expectedSha, expectedSha, {
      kind: "managed",
      version: previousSha,
      lockHeld: true,
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "Another instance-local staging deployment"
    );
    expect(git(repo, "rev-parse", "HEAD")).toBe(newerSha);
    expect(fs.readFileSync(path.join(repo, "source-version.txt"), "utf8")).toBe(
      "Queued deployment"
    );
    expect(fs.existsSync(path.join(repo, "pm2-events"))).toBe(false);
    expect(
      git(repo, "worktree", "list", "--porcelain").match(/^worktree /gmu)
    ).toHaveLength(1);
  });
});

describe("staging immutable artifact deployment", () => {
  it("validates canonical help before generating and preserving the staging variant", () => {
    const buildStep = workflow.jobs["build-staging-artifact"].steps.find(
      (step: { name?: string }) =>
        step.name === "Build and package exact staging bytes"
    );
    const buildCommands: string = buildStep.run;
    const canonicalGeneration = buildCommands.indexOf(
      "BASE_ENDPOINT=https://6529.io ./bin/6529 run help-index:sync"
    );
    const canonicalCheck = buildCommands.indexOf(
      'test -z "$(git status --porcelain=v1 --untracked-files=all -- public/help-index.json public/glossary.json public/llms.txt)"'
    );
    const stagingGeneration = buildCommands.indexOf(
      "\n./bin/6529 run help-index:sync",
      canonicalCheck
    );
    const stagingSnapshot = buildCommands.indexOf(
      'help_artifact_checksums="$(sha256sum public/help-index.json public/glossary.json public/llms.txt)"'
    );
    const build = buildCommands.indexOf("./bin/6529 run base-build");
    const packageValidation = buildCommands.indexOf(
      "node scripts/package-web-artifact.cjs assert-zip"
    );
    const unchangedCheck = buildCommands.indexOf(
      `printf '%s\\n' "$help_artifact_checksums" | sha256sum -c -`
    );

    expect(canonicalGeneration).toBeGreaterThanOrEqual(0);
    expect(canonicalCheck).toBeGreaterThan(canonicalGeneration);
    expect(stagingGeneration).toBeGreaterThan(canonicalCheck);
    expect(stagingSnapshot).toBeGreaterThan(stagingGeneration);
    expect(build).toBeGreaterThan(stagingSnapshot);
    expect(packageValidation).toBeGreaterThan(build);
    expect(unchangedCheck).toBeGreaterThan(packageValidation);
  });

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
    expect(script).not.toMatch(/PUBLIC_REVIEW|destinations/u);
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

  it("loads required server runtime values from deployment secrets", () => {
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
    expect(script).toContain(
      "['ETHEREUM_RPC_URL']: requireRuntimeEnv('ETHEREUM_RPC_URL')"
    );
    expect(script).toContain(
      "['ALCHEMY_API_KEY']: requireRuntimeEnv('ALCHEMY_API_KEY')"
    );
    expect(workflowSource).toContain(
      "STAGING_SSR_CLIENT_ID: ${{ secrets.STAGING_SSR_CLIENT_ID }}"
    );
    expect(workflowSource).toContain(
      "STAGING_SSR_CLIENT_SECRET: ${{ secrets.STAGING_SSR_CLIENT_SECRET }}"
    );
    expect(workflowSource).toContain(
      "STAGING_ETHEREUM_RPC_URL: ${{ secrets.STAGING_ETHEREUM_RPC_URL }}"
    );
    expect(workflowSource).not.toContain("secrets.SSR_CLIENT_");
    expect(workflowSource).toContain(
      "STAGING_ALCHEMY_API_KEY: ${{ secrets.STAGING_ALCHEMY_API_KEY }}"
    );
    expect(workflowSource).not.toContain("secrets.ALCHEMY_API_KEY");
    expect(workflowSource).toContain('test -n "$STAGING_ALCHEMY_API_KEY"');
    expect(workflowSource).toContain(
      "printf '%s' \"$STAGING_ALCHEMY_API_KEY\" | base64 -w0"
    );
    expect(workflowSource).toContain(
      "ALCHEMY_API_KEY_B64=$alchemy_api_key_b64_q"
    );
    expect(workflowSource).toContain(
      'ALCHEMY_API_KEY_B64="$ALCHEMY_API_KEY_B64" \\'
    );
    expect(workflowSource).toContain(
      'SSR_CLIENT_ID_B64="$SSR_CLIENT_ID_B64" \\'
    );
    expect(workflowSource).toContain(
      'SSR_CLIENT_SECRET_B64="$SSR_CLIENT_SECRET_B64" \\'
    );
    expect(workflowSource).toContain(
      'ETHEREUM_RPC_URL_B64="$ETHEREUM_RPC_URL_B64" \\'
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
    expect(build.permissions).toEqual({ contents: "read" });
    expect(installStep.env).not.toHaveProperty("NODE_AUTH_TOKEN");
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
    expect(sendStep.run).toContain(
      'run_git worktree add --detach "$source_dir" "$EXPECTED_SHA"'
    );
    expect(sendStep.run).not.toContain("run_git checkout");
    expect(sendStep.run).not.toContain("run_git reset");
    expect(sendStep.run).toContain('SOURCE_DIR="$source_dir"');
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
