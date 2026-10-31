import fs from "node:fs";
import childProcess from "node:child_process";
import os from "node:os";
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

describe("staging Ubuntu mirror preparation", () => {
  const steps = parse("staging-e2e.yml").workflow.jobs["staging-packs"].steps;
  const preparation = steps.find(
    (step: { name?: string }) =>
      step.name === "Use HTTPS Ubuntu archive for browser dependencies"
  );
  // Execute the actual inline program, changing only its file argument. No
  // package manager, sudo, host APT files or network access is involved.
  const source = (preparation.run as string)
    .split("<<'NODE'\n")[1]!
    .split("\nNODE")[0]!;

  it("prepares the mirror before apt can acquire installation locks", () => {
    const installIndex = steps.findIndex(
      (step: { id?: string }) => step.id === "playwright_dependencies_primary"
    );
    expect(steps.indexOf(preparation)).toBeLessThan(installIndex);
    expect(preparation.run).toContain(
      'sudo "$(command -v node)" - /etc/apt/apt-mirrors.txt'
    );
    expect(preparation["continue-on-error"]).toBeUndefined();
  });

  it.each([
    [
      "hosted runner priorities and CRLF",
      "http://azure.archive.ubuntu.com/ubuntu/\tpriority:1\r\nhttps://archive.ubuntu.com/ubuntu/\tpriority:2\r\nhttps://security.ubuntu.com/ubuntu/\tpriority:3\r\n",
      "https://archive.ubuntu.com/ubuntu/\tpriority:1\r\nhttps://archive.ubuntu.com/ubuntu/\tpriority:2\r\nhttps://security.ubuntu.com/ubuntu/\tpriority:3\r\n",
    ],
    [
      "bare URI",
      "http://azure.archive.ubuntu.com/ubuntu",
      "https://archive.ubuntu.com/ubuntu",
    ],
    [
      "indented URI",
      "  http://azure.archive.ubuntu.com/ubuntu priority:1\n",
      "  https://archive.ubuntu.com/ubuntu priority:1\n",
    ],
    [
      "custom mirror",
      "https://mirror.example.org/ubuntu/\n",
      "https://mirror.example.org/ubuntu/\n",
    ],
    [
      "similar URI",
      "http://azure.archive.ubuntu.com/ubuntu-ports/\n",
      "http://azure.archive.ubuntu.com/ubuntu-ports/\n",
    ],
    [
      "comment",
      "# http://azure.archive.ubuntu.com/ubuntu\n",
      "# http://azure.archive.ubuntu.com/ubuntu\n",
    ],
    ["missing mirror list", null, null],
  ])(
    "preserves %s while removing only the failing endpoint",
    (_label, before, after) => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-apt-mirror-"));
      try {
        const mirrorListPath = path.join(root, "apt-mirrors.txt");
        if (before !== null) fs.writeFileSync(mirrorListPath, before);
        const run = () =>
          childProcess.spawnSync(process.execPath, ["-", mirrorListPath], {
            input: source,
            encoding: "utf8",
            timeout: 5000,
          });
        for (let attempt = 0; attempt < 2; attempt += 1) {
          const result = run();
          expect(result.error).toBeUndefined();
          expect(result.status).toBe(0);
          if (after === null) expect(fs.existsSync(mirrorListPath)).toBe(false);
          else expect(fs.readFileSync(mirrorListPath, "utf8")).toBe(after);
        }
      } finally {
        fs.rmSync(root, { recursive: true, force: true });
      }
    }
  );
});

it("allows the Museum job to finish its recovery and browser budgets", () => {
  const job = parse("app-pr-ci.yml").workflow.jobs["app-checks"];
  expect(job["timeout-minutes"]).toBe(
    "${{ startsWith(matrix.lane, 'playwright-museum-') && 75 || 60 }}"
  );
  const setupBudget = job.steps
    .filter(
      (step: { id?: string; name?: string }) =>
        [
          "playwright_dependencies_primary",
          "playwright_dependencies_retry",
        ].includes(step.id ?? "") ||
        [
          "Ensure package-lock inspection tool",
          "Install Playwright browser",
        ].includes(step.name ?? "")
    )
    .reduce(
      (minutes: number, step: { "timeout-minutes": number }) =>
        minutes + step["timeout-minutes"],
      0
    );
  const browser = job.steps.find(
    (step: { name?: string }) =>
      step.name === "Run Network Museum Playwright packs"
  ).run as string;
  const phaseBudgets = [...browser.matchAll(/--kill-after=30s (\d+)m/gu)].map(
    (match) => Number(match[1])
  );
  expect(phaseBudgets).toEqual([10, 20]);
  expect(
    setupBudget + phaseBudgets.reduce((sum, minutes) => sum + minutes, 0)
  ).toBeLessThanOrEqual(70);
});

it.each(["staging", "production"])(
  "%s failure notifications use evidence from the same run attempt",
  (environment) => {
    const { workflow } = parse(`${environment}-e2e.yml`);
    const packJob =
      workflow.jobs[environment === "staging" ? "staging-packs" : "readonly"];
    const upload = packJob.steps.find(
      (step: { name: string }) => step.name === "Upload Playwright evidence"
    );
    const notificationJobs = Object.entries(workflow.jobs).filter(([name]) =>
      name.startsWith("notify-")
    );
    expect(upload.with.name).toBe(
      `${environment}-e2e-artifacts-\${{ github.run_id }}-attempt-\${{ github.run_attempt }}`
    );
    for (const [, job] of notificationJobs) {
      const notification = job as {
        permissions: Record<string, string>;
        steps: Array<{
          name: string;
          with?: Record<string, string>;
          env?: Record<string, string>;
          "continue-on-error"?: boolean;
        }>;
      };
      const download = notification.steps.find(
        (step) => step.name === "Download failed validation evidence"
      )!;
      const checkout = notification.steps.find(
        (step) => step.name === "Check out CI wave notifier"
      )!;
      const post = notification.steps.find((step) =>
        step.name.startsWith("Post ")
      )!;
      expect(notification.permissions["actions"]).toBe("read");
      expect(download.with?.["name"]).toBe(upload.with.name);
      expect(download["continue-on-error"]).toBe(true);
      expect(post.env?.["CI_PIPELINES_FAILURE_ARTIFACT_ROOT"]).toBe(
        download.with?.["path"]
      );
      expect(checkout.with?.["sparse-checkout"]).toContain(
        "scripts/ci-failure-details.cjs"
      );
    }
  }
);

const museumPacks = [
  "museum-data-architecture",
  "museum-institutional-practice",
  "museum-about",
  "museum-inside-system",
  "museum-rights",
  "museum-network-ia",
];
// Deployed Museum pack aliases in manifest order, as the workflows derive them.
const manifestMuseumPacks = [
  "museum-data-architecture",
  "museum-institutional-practice",
  "museum-network-ia",
  "museum-about",
  "museum-inside-system",
  "museum-rights",
];
const bash = fs.existsSync("/opt/homebrew/bin/bash")
  ? "/opt/homebrew/bin/bash"
  : "bash";

function writeExecutable(root: string, name: string, source: string) {
  const destination = path.join(root, "bin", name);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, source, { mode: 0o755 });
}

describe("PR Museum lock-tool prerequisite", () => {
  const steps = parse("app-pr-ci.yml").workflow.jobs["app-checks"].steps;
  const prerequisite = steps.find(
    (step: { name?: string }) =>
      step.name === "Ensure package-lock inspection tool"
  );

  it("provides the tool before either dependency installation can acquire locks", () => {
    expect(prerequisite.if).toBe(
      "startsWith(matrix.lane, 'playwright-museum-')"
    );
    expect(prerequisite["timeout-minutes"]).toBe(5);
    expect(prerequisite["continue-on-error"]).toBeUndefined();
    const installIndex = steps.findIndex(
      (step: { id?: string }) => step.id === "playwright_dependencies_primary"
    );
    expect(steps.indexOf(prerequisite)).toBeLessThan(installIndex);
  });

  it.each([
    ["present", 0, []],
    ["missing", 0, ["install"]],
    ["install-fails", 77, ["install"]],
    ["tool-still-missing", 1, ["install"]],
  ])(
    "handles %s without running a real package manager",
    (mode, status, events) => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-lock-tool-"));
      try {
        writeExecutable(root, "sudo", '#!/bin/bash\nexec "$@"\n');
        writeExecutable(
          root,
          "apt-get",
          `#!/bin/bash
[[ "$*" == '-o DPkg::Lock::Timeout=120 install --no-install-recommends -y psmisc' ]] || exit 99
echo install >> "$EVENTS"
[[ "$TOOL_MODE" != install-fails ]] || exit 77
if [[ "$TOOL_MODE" != tool-still-missing ]]; then
  echo '#!/bin/bash' > "$TOOL_BIN/fuser"
  chmod +x "$TOOL_BIN/fuser"
fi
`
        );
        // Deliberately exclude the host's PATH: the missing-tool cases must remain
        // missing even if the test runner itself already supplies fuser.
        const chmod = childProcess
          .execFileSync("which", ["chmod"], { encoding: "utf8" })
          .trim();
        fs.symlinkSync(chmod, path.join(root, "bin", "chmod"));
        if (mode === "present")
          writeExecutable(root, "fuser", "#!/bin/bash\nexit 0\n");
        const eventFile = path.join(root, "events");
        const result = childProcess.spawnSync(
          "/bin/bash",
          ["-c", prerequisite.run],
          {
            cwd: root,
            encoding: "utf8",
            timeout: 5000,
            env: {
              ...process.env,
              PATH: path.join(root, "bin"),
              TOOL_BIN: path.join(root, "bin"),
              TOOL_MODE: mode,
              EVENTS: eventFile,
            },
          }
        );
        expect(result.error).toBeUndefined();
        expect(result.status).toBe(status);
        expect(
          fs.existsSync(eventFile)
            ? fs.readFileSync(eventFile, "utf8").trim().split("\n")
            : []
        ).toEqual(events);
      } finally {
        fs.rmSync(root, { recursive: true, force: true });
      }
    }
  );
});

function selectionFixture(
  environment: string,
  historyAvailable: boolean,
  manifestSource = fs.readFileSync(
    path.join(process.cwd(), "tests/packs.manifest.cjs"),
    "utf8"
  )
) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "deployment-selection-"));
  fs.mkdirSync(path.join(root, "tests"));
  fs.writeFileSync(path.join(root, "tests/packs.manifest.cjs"), manifestSource);
  const git = (...args: string[]) =>
    childProcess
      .execFileSync("git", args, {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      })
      .trim();
  git("init");
  git("config", "user.name", "Deployment fixture");
  git("config", "user.email", "deployment@example.invalid");
  fs.writeFileSync(path.join(root, "unrelated.txt"), "before\n");
  git("add", ".");
  git("commit", "-m", "Before unrelated change");
  const base = git("rev-parse", "HEAD");
  fs.writeFileSync(path.join(root, "unrelated.txt"), "after\n");
  git("add", ".");
  git("commit", "-m", "Unrelated change");
  const head = git("rev-parse", "HEAD");
  const workflow =
    environment === "staging"
      ? "deploy-staging.yml"
      : "build-upload-deploy-prod.yml";
  const repository = "6529-Collections/6529seize-frontend";
  fs.writeFileSync(
    path.join(root, "current-run.json"),
    JSON.stringify({ id: 100, created_at: "2026-09-03T00:00:00Z" })
  );
  fs.writeFileSync(
    path.join(root, "previous-runs.json"),
    JSON.stringify({
      workflow_runs: [
        {
          id: 90,
          created_at: "2026-09-02T00:00:00Z",
          path: `.github/workflows/${workflow}`,
          head_branch: environment === "staging" ? "1a-staging" : "main",
          event: "workflow_dispatch",
          status: "completed",
          conclusion: "success",
          head_sha: base,
          repository: { full_name: repository },
          head_repository: { full_name: repository },
        },
      ],
    })
  );
  writeExecutable(
    root,
    "gh",
    `#!/usr/bin/env bash
if [[ "$2" == *"/actions/workflows/"* ]]; then
  [[ "$HISTORY_AVAILABLE" == true ]] || exit 1
  cat "$GITHUB_WORKSPACE/previous-runs.json"
else
  cat "$GITHUB_WORKSPACE/current-run.json"
fi
`
  );
  writeExecutable(
    root,
    "git",
    `#!/usr/bin/env bash
if [[ "$1" == ls-remote ]]; then
  printf '%s\\trefs/heads/main\\n' "$MUSEUM_SOURCE_SHA"
else
  exec "$REAL_GIT" "$@"
fi
`
  );
  writeExecutable(
    root,
    "6529",
    `#!/usr/bin/env bash
if [[ "$1" == exec && "$2" == node && "$3" == -e ]]; then
  shift 2
  exec "$NODE_BINARY" "$@"
fi
[[ "$1" == exec && "$2" == node && "$3" == scripts/museum-release-selection.cjs ]] || exit 1
shift 3
exec "$NODE_BINARY" "$MUSEUM_SELECTION_TOOL" "$@"
`
  );
  const realGit = childProcess
    .execFileSync("which", ["git"], { encoding: "utf8" })
    .trim();
  return {
    root,
    env: {
      ...process.env,
      PATH: `${path.join(root, "bin")}:${process.env["PATH"]}`,
      REAL_GIT: realGit,
      NODE_BINARY: process.execPath,
      MUSEUM_SELECTION_TOOL: path.join(
        process.cwd(),
        "scripts/museum-release-selection.cjs"
      ),
      MUSEUM_SOURCE_SHA: "a".repeat(40),
      MUSEUM_RELEASE_TIER_MODE: "tiered",
      HISTORY_AVAILABLE: String(historyAvailable),
      DEPLOYED_SHA: head,
      DEPLOY_RUN_ID: "100",
      GITHUB_REPOSITORY: repository,
      GITHUB_WORKSPACE: root,
      GITHUB_OUTPUT: path.join(root, "outputs"),
      RUNNER_TEMP: root,
    },
  };
}

describe("separate post-deploy E2E", () => {
  const stagingE2e = parse("staging-e2e.yml");
  const productionE2e = parse("production-e2e.yml");

  it.each([
    [
      "production",
      productionE2e,
      "build-upload-deploy-prod.yml",
      "main",
      "Deploy verified production artifact",
      "production-e2e",
    ],
    [
      "staging",
      stagingE2e,
      "deploy-staging.yml",
      "1a-staging",
      "Deploy exact staging artifact",
      "staging-e2e",
    ],
  ])(
    "binds %s manual E2E to a successful canonical deploy job that is still live",
    (environment, e2e, deployPath, branch, deployJobName, automaticGroup) => {
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
      ).toBe(true);
      expect(
        e2e.workflow.on.workflow_dispatch.inputs.target_sha
      ).toBeUndefined();
      expect(e2e.workflow.on.workflow_call).toBeUndefined();
      expect(resolve.run).toContain(
        `.path == ".github/workflows/${deployPath}"`
      );
      expect(resolve.run).toContain(`.head_branch == "${branch}"`);
      expect(resolve.run).toContain(`.name == "${deployJobName}"`);
      const [runSelection, jobSelection] = resolve.run.split(
        "deploy_run_attempt="
      );
      expect(runSelection).toContain('.conclusion == "success"');
      expect(jobSelection).toContain('.conclusion == "success"');
      expect(resolve.run).toContain('test "$GITHUB_REF" = refs/heads/main');
      expect(resolve.run).toContain("/attempts/\${deploy_run_attempt}/jobs");
      expect(resolve.run).not.toContain("MANUAL_TARGET_SHA");
      expect(liveVersion.run).toContain(
        "ops/scripts/verify-deployment-version.cjs"
      );
      expect(liveVersion.if).toBeUndefined();
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
  ])("keeps %s deployed-source execution cache-free", (_environment, e2e) => {
    const source = e2e.source;
    const job =
      e2e.workflow.jobs.readonly ?? e2e.workflow.jobs["staging-packs"];
    const nodeSetups = job.steps.filter((step: { uses?: string }) =>
      step.uses?.startsWith("actions/setup-node@")
    );

    expect(nodeSetups).toHaveLength(1);
    expect(nodeSetups[0].with["package-manager-cache"]).toBe(false);
    expect(nodeSetups[0].with.cache).toBeUndefined();
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

  describe.each([
    ["staging", stagingE2e],
    ["production", productionE2e],
    ["PR Museum", parse("app-pr-ci.yml")],
  ])("%s dependency installation recovery", (environment, e2e) => {
    const job =
      e2e.workflow.jobs["app-checks"] ??
      e2e.workflow.jobs.readonly ??
      e2e.workflow.jobs["staging-packs"];
    const retryCondition =
      environment === "PR Museum"
        ? "startsWith(matrix.lane, 'playwright-museum-') && steps.playwright_dependencies_primary.outcome != 'success'"
        : "steps.playwright_dependencies_primary.outcome != 'success'";
    const primary = job.steps.find(
      (step: { id?: string }) => step.id === "playwright_dependencies_primary"
    );
    const retry = job.steps.find(
      (step: { id?: string }) => step.id === "playwright_dependencies_retry"
    );
    const verify = job.steps.find(
      (step: { name?: string }) =>
        step.name === "Verify Playwright dependencies"
    );

    it.each([
      ["free", "", 0, ["check", "install"]],
      ["clears", "", 0, ["check", "wait", "check", "install"]],
      ["expires", "", 124, ["check", "wait"]],
      ["free", "77", 77, ["check", "install"]],
    ])(
      "handles a %s lock and installer exit %s",
      (lock, installExit, status, events) => {
        const root = fs.mkdtempSync(
          path.join(os.tmpdir(), "e2e-dependencies-")
        );
        try {
          writeExecutable(root, "sudo", '#!/usr/bin/env bash\nexec "$@"\n');
          writeExecutable(
            root,
            "timeout",
            `#!/usr/bin/env bash
[[ "$1" == 300 ]] || exit 99
shift
if [[ "$LOCK_MODE" == expires ]]; then
  "$@"
  child_status=$?
  [[ "$child_status" == 143 ]] || exit 99
  exit 124
fi
exec "$@"
`
          );
          writeExecutable(
            root,
            "fuser",
            `#!/usr/bin/env bash
[[ "$*" == '/var/lib/dpkg/lock-frontend /var/lib/dpkg/lock /var/lib/apt/lists/lock' ]] || exit 99
echo check >> "$EVENTS"
[[ "$LOCK_MODE" != expires ]] || exit 0
if [[ "$LOCK_MODE" == clears && ! -f "$RELEASED" ]]; then
  touch "$RELEASED"
  exit 0
fi
exit 1
`
          );
          writeExecutable(
            root,
            "sleep",
            `#!/usr/bin/env bash
echo wait >> "$EVENTS"
# Simulate timeout's termination after the held-lock loop reaches its wait.
[[ "$LOCK_MODE" != expires ]] || kill -TERM "$PPID"
`
          );
          writeExecutable(
            root,
            "6529",
            `#!/usr/bin/env bash
[[ "$*" == 'exec playwright install-deps chromium' ]] || exit 99
echo install >> "$EVENTS"
exit "\${INSTALL_EXIT:-0}"
`
          );
          const eventFile = path.join(root, "events");
          const result = childProcess.spawnSync(bash, ["-c", retry.run], {
            cwd: root,
            encoding: "utf8",
            timeout: 5000,
            env: {
              ...process.env,
              PATH: `${path.join(root, "bin")}:${process.env["PATH"]}`,
              LOCK_MODE: lock,
              INSTALL_EXIT: installExit,
              RELEASED: path.join(root, "released"),
              EVENTS: eventFile,
            },
          });
          expect(result.error).toBeUndefined();
          expect(result.status).toBe(status);
          expect(
            fs.existsSync(eventFile)
              ? fs.readFileSync(eventFile, "utf8").trim().split("\n")
              : []
          ).toEqual(events);
        } finally {
          fs.rmSync(root, { recursive: true, force: true });
        }
      }
    );

    it.each([
      ["success", "skipped", 0],
      ["failure", "success", 0],
      ["failure", "failure", 1],
    ])(
      "keeps setup fatal unless an install succeeds (%s/%s)",
      (first, second, status) => {
        expect(primary["timeout-minutes"]).toBe(10);
        expect(retry["timeout-minutes"]).toBe(15);
        expect(retry.if).toBe(retryCondition);
        const result = childProcess.spawnSync(bash, ["-c", verify.run], {
          encoding: "utf8",
          env: {
            ...process.env,
            PRIMARY_OUTCOME: first,
            RETRY_OUTCOME: second,
          },
        });
        expect(result.status).toBe(status);
      }
    );
  });

  it("posts manual production E2E to the CI wave against the original deployment", () => {
    const notificationJob = productionE2e.workflow.jobs["notify-ci-wave"];
    const notification = notificationJob.steps.find(
      (step: { name?: string }) =>
        step.name === "Post production WEB validation outcome"
    );

    expect(notification.env.CI_PIPELINES_ALERT_TYPE).toBe("web_e2e");
    expect(notification.env.CI_PIPELINES_PARENT_DEPLOY_RUN_ID).toBe(
      "${{ inputs.automatic_deploy_run_id }}"
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

  it("runs the opt-in stateful E2EE pack alone, serially and never under all", () => {
    const job = stagingE2e.workflow.jobs["staging-packs"];
    const options: string[] =
      stagingE2e.workflow.on.workflow_dispatch.inputs.pack.options;
    const readonlyStep = job.steps.find(
      (step: { name?: string }) => step.name === "Run read-only staging packs"
    );
    const statefulStep = job.steps.find(
      (step: { name?: string }) =>
        step.name === "Run opt-in stateful staging pack"
    );

    expect(stagingE2e.workflow.on.workflow_dispatch.inputs.pack.default).toBe(
      "all"
    );
    expect(options).toContain("e2ee-staging");
    expect(job.env.SELECTED_PACK).toBe("${{ inputs.pack || 'all' }}");
    expect(readonlyStep.if).toBe("env.SELECTED_PACK != 'e2ee-staging'");
    expect(statefulStep.if).toBe("env.SELECTED_PACK == 'e2ee-staging'");
    expect(statefulStep.env.PLAYWRIGHT_STAGING_ACCESS_CODE).toBe(
      "${{ secrets.PLAYWRIGHT_STAGING_ACCESS_CODE }}"
    );

    // Every dispatchable alias is a staging pack of the manifest; only the
    // stateful one bypasses the post-deploy selection.
    const { PACKS } = require("../../tests/packs.manifest.cjs") as {
      PACKS: Array<{
        alias?: string;
        environments: string[];
        safety: string;
        triggers: string[];
      }>;
    };
    for (const option of options.filter((value) => value !== "all")) {
      const pack = PACKS.find(
        (candidate) =>
          candidate.environments.includes("staging") &&
          candidate.alias === option
      );
      expect(pack).toBeDefined();
      if (option === "e2ee-staging") {
        expect(pack).toMatchObject({
          safety: "stateful",
          triggers: ["manual"],
        });
      } else {
        expect(pack?.triggers).toContain("post-deploy");
      }
    }

    const root = fs.mkdtempSync(path.join(os.tmpdir(), "stateful-pack-"));
    writeExecutable(
      root,
      "6529",
      `#!/usr/bin/env node
require('node:fs').writeFileSync(process.env.RESULT_PATH, JSON.stringify({
  args: process.argv.slice(2),
  sourceSha: process.env.DEPLOYMENT_E2E_SOURCE_SHA
}));
`
    );
    try {
      const result = childProcess.spawnSync(bash, ["-c", statefulStep.run], {
        cwd: root,
        encoding: "utf8",
        env: {
          ...process.env,
          DEPLOYED_SHA: "c".repeat(40),
          RESULT_PATH: path.join(root, "arguments.json"),
          SELECTED_PACK: "e2ee-staging",
        },
      });
      expect(result.status).toBe(0);
      const invocation = JSON.parse(
        fs.readFileSync(path.join(root, "arguments.json"), "utf8")
      );
      expect(invocation).toEqual({
        args: [
          "run",
          "e2e:packs",
          "--",
          "--env",
          "staging",
          "--trigger",
          "manual",
          "--pack",
          "e2ee-staging",
          "--artifact-root",
          "staging-e2e-artifacts",
          "--parallel",
          "1",
          "--retry-failed-packs",
          "0",
        ],
        sourceSha: "c".repeat(40),
      });
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it.each([
    ["staging", stagingE2e, true],
    ["production", productionE2e, true],
    ["staging", stagingE2e, false],
    ["production", productionE2e, false],
  ])(
    "selects %s Museum coverage conservatively with deployment history available=%s",
    (environment, e2e, historyAvailable) => {
      const job =
        e2e.workflow.jobs.readonly ?? e2e.workflow.jobs["staging-packs"];
      const selection = job.steps.find(
        (step: { name?: string }) =>
          step.name === "Select Museum packs for the deployed change"
      );
      const fixture = selectionFixture(environment, historyAvailable);
      try {
        const result = childProcess.spawnSync(bash, ["-c", selection.run], {
          cwd: fixture.root,
          env: fixture.env,
          encoding: "utf8",
          timeout: 10_000,
        });
        expect(result.status).toBe(0);
        const evidence = JSON.parse(
          fs.readFileSync(
            path.join(fixture.root, "museum-release-selection.json"),
            "utf8"
          )
        );
        expect(evidence.selected_packs).toEqual(
          historyAvailable ? [] : museumPacks
        );
        expect(
          fs.readFileSync(path.join(fixture.root, "outputs"), "utf8")
        ).toContain(`museum_packs=${JSON.stringify(manifestMuseumPacks)}`);
        expect(evidence.source_commit).toBe(fixture.env.MUSEUM_SOURCE_SHA);
        expect(evidence.classification.tier).toBe(
          historyAvailable ? "NONE" : "P3"
        );
      } finally {
        fs.rmSync(fixture.root, { recursive: true, force: true });
      }
    }
  );

  it.each([
    ["staging", stagingE2e],
    ["production", productionE2e],
  ])(
    "passes selected %s Museum packs and exact publication identity to Playwright",
    (environment, e2e) => {
      const job =
        e2e.workflow.jobs.readonly ?? e2e.workflow.jobs["staging-packs"];
      const runPacks = job.steps.find(
        (step: { name?: string }) =>
          step.name === `Run read-only ${environment} packs`
      );
      const root = fs.mkdtempSync(path.join(os.tmpdir(), "deployment-packs-"));
      writeExecutable(
        root,
        "6529",
        `#!/usr/bin/env node
require('node:fs').writeFileSync(process.env.RESULT_PATH, JSON.stringify({
  args: process.argv.slice(2),
  publication: process.env.MUSEUM_PUBLICATION_EXPECTED_COMMIT
}));
`
      );
      try {
        const result = childProcess.spawnSync(bash, ["-c", runPacks.run], {
          cwd: root,
          encoding: "utf8",
          env: {
            ...process.env,
            DEPLOYED_SHA: "a".repeat(40),
            RESULT_PATH: path.join(root, "arguments.json"),
            MUSEUM_SELECTED_PACKS_JSON: JSON.stringify(["museum-about"]),
            MUSEUM_AVAILABLE_PACKS_JSON: JSON.stringify(manifestMuseumPacks),
            MUSEUM_PUBLICATION_EXPECTED_COMMIT: "b".repeat(40),
            SELECTED_PACK: "all",
          },
        });
        expect(result.status).toBe(0);
        const invocation = JSON.parse(
          fs.readFileSync(path.join(root, "arguments.json"), "utf8")
        );
        expect(invocation.publication).toBe("b".repeat(40));
        const excluded = invocation.args.flatMap(
          (arg: string, index: number) =>
            arg === "--exclude-pack" ? [invocation.args[index + 1]] : []
        );
        expect(excluded).toEqual(
          manifestMuseumPacks.filter((pack) => pack !== "museum-about")
        );
        expect(runPacks.env.MUSEUM_PUBLICATION_EXPECTED_COMMIT).toBe(
          "${{ steps.museum-publication.outputs.publication_commit }}"
        );
        const preserved = job.steps.find(
          (step: { name?: string }) =>
            step.name === "Preserve Museum selection and publication evidence"
        );
        expect(preserved.if).toBe("always()");
      } finally {
        fs.rmSync(root, { recursive: true, force: true });
      }
    }
  );
  function runSelectionWithTool(
    e2e: ReturnType<typeof parse>,
    environment: string,
    manifestSource: string,
    selectedPacks: string[]
  ) {
    const job =
      e2e.workflow.jobs.readonly ?? e2e.workflow.jobs["staging-packs"];
    const selection = job.steps.find(
      (step: { name?: string }) =>
        step.name === "Select Museum packs for the deployed change"
    );
    const fixture = selectionFixture(environment, true, manifestSource);
    const tool = path.join(fixture.root, "fake-selection.cjs");
    fs.writeFileSync(
      tool,
      `const fs = require("node:fs");
const args = process.argv.slice(2);
const value = (name) => args[args.indexOf(name) + 1];
fs.writeFileSync(value("--output"), JSON.stringify({
  contract: "museum-release-selection-v1",
  environment: value("--environment"),
  source_commit: value("--source-commit"),
  selected_packs: ${JSON.stringify(selectedPacks)},
  selection_digest: "${"a".repeat(64)}"
}));
`
    );
    try {
      return childProcess.spawnSync(bash, ["-c", selection.run], {
        cwd: fixture.root,
        env: { ...fixture.env, MUSEUM_SELECTION_TOOL: tool },
        encoding: "utf8",
        timeout: 10_000,
      });
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  }

  const futureManifest = `module.exports = { PACKS: [
  { alias: "museum-future", changeScope: "museum", environments: ["staging", "production"] },
  { alias: "core", environments: ["staging", "production"] },
] };
`;

  it.each([
    ["staging", stagingE2e],
    ["production", productionE2e],
  ])(
    "accepts %s Museum packs that only the deployed manifest defines",
    (environment, e2e) => {
      expect(
        runSelectionWithTool(e2e, environment, futureManifest, [
          "museum-future",
        ]).status
      ).toBe(0);
      expect(
        runSelectionWithTool(e2e, environment, futureManifest, ["museum-about"])
          .status
      ).not.toBe(0);
    }
  );

  it.each([
    ["staging", stagingE2e],
    ["production", productionE2e],
  ])(
    "fails %s Museum selection closed when the deployed manifest has no Museum packs",
    (environment, e2e) => {
      const result = runSelectionWithTool(
        e2e,
        environment,
        "module.exports = { PACKS: [] };\n",
        []
      );
      expect(result.status).not.toBe(0);
    }
  );
});
