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

const museumPacks = [
  "museum-data-architecture",
  "museum-institutional-practice",
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

function selectionFixture(environment: string, historyAvailable: boolean) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "deployment-selection-"));
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
        `#!${process.execPath}
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
          museumPacks.filter((pack) => pack !== "museum-about")
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
});
