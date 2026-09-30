import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";

const workflow = YAML.parse(
  fs.readFileSync(".github/workflows/production-e2e.yml", "utf8")
);
const steps = workflow.jobs.readonly.steps as {
  id?: string;
  name: string;
  run?: string;
  if?: string;
  env?: Record<string, string>;
}[];
/** Finds a named workflow step, with a useful failure when the contract drifts. */
function requiredStep(name: string) {
  const step = steps.find((candidate) => candidate.name === name);
  if (!step)
    throw new Error(`Production E2E workflow step is missing: ${name}`);
  return step;
}
const source = requiredStep("Resolve exact deployed SHA");
const gitBash = path.join(
  process.env["ProgramFiles"] ?? "",
  "Git/bin/bash.exe"
);
const bash =
  process.platform === "win32" && fs.existsSync(gitBash) ? gitBash : "bash";
const repository = "6529-Collections/6529seize-frontend";
const sha = "a".repeat(40);
const deployment = {
  path: ".github/workflows/build-upload-deploy-prod.yml",
  event: "workflow_dispatch",
  head_branch: "main",
  status: "completed",
  conclusion: "success",
  repository: { full_name: repository },
  head_repository: { full_name: repository },
  run_attempt: 2,
  head_sha: sha,
};

/** Exercises the deployed-source resolver against isolated GitHub API fixtures. */
function resolveSource(
  options: {
    event?: string;
    ref?: string;
    run?: Record<string, unknown>;
    jobs?: Record<string, unknown>[];
    emptyHistory?: boolean;
    apiFailure?: {
      endpoint: "runs" | "run" | "jobs";
      count: number;
      message?: string;
    };
  } = {}
) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "production-canary-"));
  try {
    fs.writeFileSync(
      path.join(root, "run.json"),
      JSON.stringify({ ...deployment, ...options.run })
    );
    fs.writeFileSync(
      path.join(root, "jobs.json"),
      JSON.stringify({
        jobs: options.jobs ?? [
          {
            name: "Deploy verified production artifact",
            status: "completed",
            conclusion: "success",
          },
        ],
      })
    );
    fs.writeFileSync(
      path.join(root, "runs.json"),
      JSON.stringify({
        workflow_runs: options.emptyHistory
          ? []
          : [
              {
                id: 101,
                status: "completed",
                conclusion: "success",
                run_started_at: "2026-09-12T05:00:00Z",
              },
              {
                id: 100,
                status: "completed",
                conclusion: "success",
                run_started_at: "2026-09-11T05:00:00Z",
              },
            ],
      })
    );
    const result = spawnSync(
      bash,
      [
        "-c",
        `
gh() {
  local endpoint="\${@: -1}" fixture count_file count
  case "$endpoint" in
    */actions/workflows/*) fixture=runs ;;
    */attempts/*) fixture=jobs ;;
    *) fixture=run; printf '%s\\n' "$endpoint" > "$FIXTURE_ROOT/selected-run" ;;
  esac
  count_file="$FIXTURE_ROOT/$fixture-count"
  count=0
  if [ -f "$count_file" ]; then read -r count < "$count_file"; fi
  count=$((count + 1))
  printf '%s\\n' "$count" > "$count_file"
  if [ "$fixture" = "$FAILED_ENDPOINT" ] && [ "$count" -le "$FAILURE_COUNT" ]; then
    printf 'partial failed response'
    printf '%s\\n' "$FAILURE_MESSAGE" >&2
    return 1
  fi
  cat "$FIXTURE_ROOT/$fixture.json"
}
${source.run}
`,
      ],
      {
        encoding: "utf8",
        timeout: 10_000,
        env: {
          ...process.env,
          EVENT_NAME: options.event ?? "schedule",
          AUTOMATIC_DEPLOY_RUN_ID: "99",
          GITHUB_REF: options.ref ?? "refs/heads/main",
          GITHUB_REPOSITORY: repository,
          FIXTURE_ROOT: root.replaceAll("\\", "/"),
          RUNNER_TEMP: root.replaceAll("\\", "/"),
          GITHUB_OUTPUT: path.join(root, "output").replaceAll("\\", "/"),
          FAILED_ENDPOINT: options.apiFailure?.endpoint ?? "",
          FAILURE_COUNT: String(options.apiFailure?.count ?? 0),
          FAILURE_MESSAGE:
            options.apiFailure?.message ?? "gh: Server Error (HTTP 502)",
        },
      }
    );
    expect(result.error).toBeUndefined();
    return {
      status: result.status,
      output: fs.existsSync(path.join(root, "output"))
        ? fs.readFileSync(path.join(root, "output"), "utf8")
        : "",
      selected: fs.existsSync(path.join(root, "selected-run"))
        ? fs.readFileSync(path.join(root, "selected-run"), "utf8")
        : "",
      attempts: Object.fromEntries(
        ["runs", "run", "jobs"].map((endpoint) => {
          const counter = path.join(root, `${endpoint}-count`);
          return [
            endpoint,
            fs.existsSync(counter)
              ? Number(fs.readFileSync(counter, "utf8"))
              : 0,
          ];
        })
      ),
    };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

describe("daily production canary", () => {
  it("discovers the newest successful deployment and verifies its canonical job", () => {
    const result = resolveSource();
    expect(result.status).toBe(0);
    expect(result.selected).toContain("/actions/runs/101");
    expect(result.output).toContain(`sha=${sha}`);
    expect(result.output).toContain("deploy-run-id=101");
  });

  it("preserves exact run selection for manual and post-deploy dispatch", () => {
    const result = resolveSource({
      event: "workflow_dispatch",
      emptyHistory: true,
    });
    expect(result.status).toBe(0);
    expect(result.selected).toContain("/actions/runs/99");
  });

  it.each(["runs", "run", "jobs"] as const)(
    "recovers %s lookup after transient 502s without accepting partial responses",
    (endpoint) => {
      const result = resolveSource({ apiFailure: { endpoint, count: 2 } });
      expect(result.status).toBe(0);
      expect(result.attempts[endpoint]).toBe(3);
      expect(result.output).toContain(`sha=${sha}`);
      expect(result.output).toContain("deploy-run-id=101");
    }
  );

  it("recovers a transport failure on the exact post-deploy run lookup", () => {
    const result = resolveSource({
      event: "workflow_dispatch",
      apiFailure: {
        endpoint: "run",
        count: 1,
        message: "error connecting to api.github.com: dial tcp: i/o timeout",
      },
    });
    expect(result.status).toBe(0);
    expect(result.attempts["run"]).toBe(2);
    expect(result.output).toContain("deploy-run-id=99");
  });

  it.each([
    { message: "gh: Server Error (HTTP 502)", attempts: 3 },
    { message: "gh: Forbidden (HTTP 403)", attempts: 1 },
    { message: "gh: Not Found (HTTP 404)", attempts: 1 },
  ])(
    "fails closed after $attempts attempts for $message",
    ({ message, attempts }) => {
      const result = resolveSource({
        apiFailure: { endpoint: "run", count: 3, message },
      });
      expect(result.status).not.toBe(0);
      expect(result.attempts["run"]).toBe(attempts);
      expect(result.attempts["jobs"]).toBe(0);
      expect(result.output).toBe("");
    }
  );

  it("does not retry a successful API response with rejected deployment provenance", () => {
    const result = resolveSource({ run: { conclusion: "failure" } });
    expect(result.status).not.toBe(0);
    expect(result.attempts["run"]).toBe(1);
    expect(result.attempts["jobs"]).toBe(0);
    expect(result.output).toBe("");
  });

  it.each([
    { ref: "refs/heads/feature" },
    { emptyHistory: true },
    { run: { path: ".github/workflows/other.yml" } },
    { run: { head_repository: { full_name: "example/fork" } } },
    { run: { conclusion: "failure" } },
    { run: { head_sha: "invalid" } },
    { jobs: [] },
    {
      jobs: [
        {
          name: "Deploy verified production artifact",
          status: "completed",
          conclusion: "failure",
        },
      ],
    },
  ])("rejects invalid deployment provenance: %j", (options) => {
    const result = resolveSource(options);
    expect(result.status).not.toBe(0);
    expect(result.output).toBe("");
  });

  it("runs all cron packs using the shared source, publication and evidence controls", () => {
    expect(workflow.on.schedule).toEqual([{ cron: "30 5 * * *" }]);
    expect(workflow.on.workflow_dispatch.inputs.scope).toMatchObject({
      options: ["post-deploy", "canary"],
      default: "post-deploy",
    });
    expect(workflow.concurrency).toEqual({
      group: "production-e2e",
      "cancel-in-progress": false,
    });
    const run = requiredStep("Run daily read-only production canary packs");
    expect(run.run).toContain("--env production --trigger cron");
    expect(run.run).toContain("--parallel 3 --retry-failed-packs 1");
    expect(run.run).not.toContain("--exclude-pack");
    expect(run.env).toMatchObject({
      DEPLOYMENT_E2E_SOURCE_SHA: "${{ steps.source.outputs.sha }}",
      MUSEUM_PUBLICATION_EXPECTED_COMMIT:
        "${{ steps.museum-publication.outputs.publication_commit }}",
    });
    expect(
      requiredStep(
        "Require the selected production deployment to still be live"
      ).if
    ).toBeUndefined();
    expect(requiredStep("Verify exact deployed source").run).toContain(
      'git merge-base --is-ancestor "$EXPECTED_SHA" origin/main'
    );
    expect(workflow.jobs["notify-canary-failure"].if).toContain(
      "needs.readonly.result == 'failure'"
    );
    const notification = workflow.jobs["notify-canary-failure"].steps.at(-1);
    expect(notification.env.CI_PIPELINES_ALERT_TYPE).toBe("workflow");
    expect(notification.env.CI_PIPELINES_TITLE).toBe(
      "Production E2E: read-only canary failed"
    );
    expect(notification.env.CI_PIPELINES_PARENT_DEPLOY_RUN_ID).toBeUndefined();
  });
});
