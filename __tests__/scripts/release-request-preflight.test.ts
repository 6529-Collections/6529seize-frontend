import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parse } from "yaml";

type FakeGitHubMode =
  | "success"
  | "auth-failure"
  | "dispatch-failure"
  | "workflow-failure";

type RunRecord = {
  status: string;
  errors: Array<{ code?: string; location?: string; message?: string }>;
  request: { id: string; path: string } | null;
  submission: {
    inbox_issue_number: number | null;
    inbox_issue_url: string | null;
    status: string;
    workflow_run_id: string | null;
    workflow_run_url: string | null;
    reason: string | null;
  } | null;
};

type Workflow = {
  jobs?: Record<
    string,
    {
      steps?: Array<{
        name?: string;
        run?: string;
      }>;
    }
  >;
};

const repoRoot = path.resolve(__dirname, "../..");
const wrapperPath = path.join(repoRoot, "bin", "6529");
const installedCliPath = path.join(
  repoRoot,
  "node_modules",
  ".bin",
  "6529-release-request"
);
const deploySkillPath = path.join(
  repoRoot,
  "ops",
  "skills",
  "deploy-6529",
  "SKILL.md"
);
const appPrCiWorkflowPath = path.join(
  repoRoot,
  ".github",
  "workflows",
  "app-pr-ci.yml"
);
const releaseBusDocPath = path.join(
  repoRoot,
  "ops",
  "docs",
  "developer",
  "simple-release-bus-v2.md"
);

/** Returns one valid frontend release-request fixture. */
function validInput() {
  return {
    requested_by: "release-agent",
    target: "staging",
    database_change: "no",
    release_parts: [
      {
        id: "frontend",
        repository: "6529seize-frontend",
        pull_requests: [
          {
            number: 456,
            branch: "feature/frontend-release",
            commit: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          },
        ],
        depends_on: [],
      },
    ],
  };
}

/** Replaces one expected token and fails loudly if the skill example drifts. */
function replaceExactlyOnce(
  source: string,
  token: string,
  replacement: string
) {
  const occurrences = source.split(token).length - 1;
  if (occurrences !== 1) {
    throw new Error(
      `Expected exactly one ${JSON.stringify(token)} token, found ${occurrences}.`
    );
  }
  return source.replace(token, replacement);
}

/** Extracts the documented submit block and supplies deterministic test input. */
function skillSubmitShellBlock(input: unknown) {
  const skill = fs.readFileSync(deploySkillPath, "utf8");
  const match = skill.match(
    /```bash\n(release_request_submit_status=0\n[\s\S]*?\nfi)\n```/u
  );
  if (!match?.[1]) {
    throw new Error(
      "The deploy skill has no executable submit observation block."
    );
  }

  const withInput = replaceExactlyOnce(
    match[1],
    "{...completed release-request JSON...}",
    JSON.stringify(input, null, 2)
  );
  const withProjectDirectory = replaceExactlyOnce(
    withInput,
    "submit --input -",
    'submit --input - --project-dir "$OBSERVATION_PROJECT_DIRECTORY"'
  );
  return replaceExactlyOnce(
    withProjectDirectory,
    "./bin/6529",
    '"$RELEASE_REQUEST_WRAPPER"'
  );
}

/** Writes the POSIX fake `gh` executable used by the observation harness. */
function writeFakeGitHubCli(fakeBinDirectory: string) {
  fs.mkdirSync(fakeBinDirectory, { recursive: true });
  const fakeGitHubCliPath = path.join(fakeBinDirectory, "gh");
  fs.writeFileSync(
    fakeGitHubCliPath,
    `#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);
const mode = process.env["FAKE_GH_MODE"] || "success";
const stateDirectory = process.env["FAKE_GH_STATE_DIR"];
if (!stateDirectory) {
  throw new Error("FAKE_GH_STATE_DIR is required.");
}
fs.mkdirSync(stateDirectory, { recursive: true });
fs.appendFileSync(
  path.join(stateDirectory, "invocations.jsonl"),
  JSON.stringify(args) + "\\n"
);

const command = args.slice(0, 2).join(" ");
if (command === "auth status") {
  if (mode === "auth-failure") {
    console.error("synthetic GitHub authentication failure");
    process.exit(1);
  }
  console.log("synthetic GitHub authentication is active");
  process.exit(0);
}

if (command === "workflow run") {
  if (mode === "dispatch-failure") {
    console.error("synthetic workflow dispatch failure");
    process.exit(1);
  }
  const payload = JSON.parse(fs.readFileSync(0, "utf8"));
  fs.writeFileSync(
    path.join(stateDirectory, "request.json"),
    JSON.stringify({ request_id: payload.request_id })
  );
  console.log(
    "https://github.com/6529-Collections/6529-release-coordinator/actions/runs/424242"
  );
  process.exit(0);
}

if (command === "run watch") {
  process.exit(mode === "workflow-failure" ? 1 : 0);
}

if (command === "run view") {
  const state = JSON.parse(
    fs.readFileSync(path.join(stateDirectory, "request.json"), "utf8")
  );
  const failed = mode === "workflow-failure";
  const result = {
    status: failed ? "failed" : "submitted",
    request_id: state.request_id,
    reason: failed ? "synthetic central workflow rejection" : null,
    errors: failed
      ? [
          {
            code: "synthetic_workflow_failure",
            location: "$",
            message: "synthetic central workflow rejection",
          },
        ]
      : [],
    inbox_issue_number: failed ? null : 73,
    inbox_issue_url: failed
      ? null
      : "https://github.com/6529-Collections/6529-release-coordinator/issues/73",
    github: {
      actor: "synthetic-actor",
      actor_id: "12345",
      workflow_run_id: "424242",
      workflow_run_url:
        "https://github.com/6529-Collections/6529-release-coordinator/actions/runs/424242",
    },
  };
  console.log(
    "RELEASE_REQUEST_RESULT=" +
      Buffer.from(JSON.stringify(result)).toString("base64url")
  );
  process.exit(0);
}

console.error("Unsupported synthetic gh invocation: " + args.join(" "));
process.exit(2);
`,
    { mode: 0o700 }
  );
  fs.chmodSync(fakeGitHubCliPath, 0o700);
}

/** Runs the skill's POSIX observation block without contacting GitHub. */
function runObservationHarness(
  projectDirectory: string,
  input: unknown,
  mode: FakeGitHubMode
) {
  fs.accessSync(wrapperPath, fs.constants.X_OK);
  fs.accessSync(installedCliPath, fs.constants.X_OK);
  const fakeBinDirectory = path.join(projectDirectory, "fake-bin");
  const stateDirectory = path.join(projectDirectory, "fake-gh-state");
  writeFakeGitHubCli(fakeBinDirectory);

  const script = [
    "set -euo pipefail",
    skillSubmitShellBlock(input),
    'printf "EXISTING_RELEASE_FLOW_CONTINUED=%s\\n" "$release_request_submit_status"',
  ].join("\n");
  const result = spawnSync("/bin/bash", ["-c", script], {
    cwd: projectDirectory,
    encoding: "utf8",
    env: {
      ...process.env,
      FAKE_GH_MODE: mode,
      FAKE_GH_STATE_DIR: stateDirectory,
      PATH: `${fakeBinDirectory}:${process.env["PATH"] ?? ""}`,
      OBSERVATION_PROJECT_DIRECTORY: projectDirectory,
      RELEASE_REQUEST_WRAPPER: wrapperPath,
    },
  });

  if (result.error) {
    throw result.error;
  }

  return { result, stateDirectory };
}

/** Reads the only CLI run record created by one harness execution. */
function readSingleRun(projectDirectory: string) {
  const runsDirectory = path.join(
    projectDirectory,
    ".release-coordinator",
    "runs"
  );
  const runFiles = fs.readdirSync(runsDirectory);
  expect(runFiles).toHaveLength(1);
  const [runFile] = runFiles;
  if (!runFile) {
    throw new Error("The CLI did not create its run record.");
  }
  return JSON.parse(
    fs.readFileSync(path.join(runsDirectory, runFile), "utf8")
  ) as RunRecord;
}

/** Reads the fake GitHub CLI invocation log when the scenario created one. */
function readGitHubInvocations(stateDirectory: string) {
  const logPath = path.join(stateDirectory, "invocations.jsonl");
  if (!fs.existsSync(logPath)) {
    return [] as string[][];
  }
  return fs
    .readFileSync(logPath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as string[]);
}

describe("release-request observation", () => {
  let projectDirectory: string | undefined;

  afterEach(() => {
    if (projectDirectory) {
      fs.rmSync(projectDirectory, { force: true, recursive: true });
      projectDirectory = undefined;
    }
  });

  it("submits exactly once and continues the existing flow on success", () => {
    projectDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), "frontend-release-request-")
    );
    const { result, stateDirectory } = runObservationHarness(
      projectDirectory,
      validInput(),
      "success"
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("EXISTING_RELEASE_FLOW_CONTINUED=0");
    expect(result.stdout).toContain('"status": "submitted"');
    expect(result.stdout).toContain('"request_id":');
    expect(result.stdout).toContain(
      '"workflow_run_url": "https://github.com/6529-Collections/6529-release-coordinator/actions/runs/424242"'
    );
    expect(result.stdout).toContain(
      '"inbox_issue_url": "https://github.com/6529-Collections/6529-release-coordinator/issues/73"'
    );
    const run = readSingleRun(projectDirectory);
    expect(run).toMatchObject({
      status: "succeeded",
      errors: [],
      request: { id: expect.any(String), path: expect.any(String) },
      submission: {
        status: "submitted",
        workflow_run_id: "424242",
        workflow_run_url:
          "https://github.com/6529-Collections/6529-release-coordinator/actions/runs/424242",
        inbox_issue_number: 73,
        inbox_issue_url:
          "https://github.com/6529-Collections/6529-release-coordinator/issues/73",
        reason: null,
      },
    });
    const workflowRuns = readGitHubInvocations(stateDirectory).filter(
      (args) => args[0] === "workflow" && args[1] === "run"
    );
    expect(workflowRuns).toHaveLength(1);
  });

  it("stops the release route after a signal-style submit exit", () => {
    projectDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), "frontend-release-request-")
    );
    const signalWrapperPath = path.join(projectDirectory, "signal-wrapper");
    fs.writeFileSync(
      signalWrapperPath,
      "#!/usr/bin/env bash\ncat >/dev/null\nexit 130\n",
      { mode: 0o700 }
    );
    const script = [
      "set -euo pipefail",
      skillSubmitShellBlock(validInput()),
      'printf "EXISTING_RELEASE_FLOW_CONTINUED=%s\\n" "$release_request_submit_status"',
    ].join("\n");

    const result = spawnSync("/bin/bash", ["-c", script], {
      cwd: projectDirectory,
      encoding: "utf8",
      env: {
        ...process.env,
        OBSERVATION_PROJECT_DIRECTORY: projectDirectory,
        RELEASE_REQUEST_WRAPPER: signalWrapperPath,
      },
    });

    expect(result.status).toBe(130);
    expect(result.stdout).not.toContain("EXISTING_RELEASE_FLOW_CONTINUED");
    expect(result.stderr).toContain(
      "signal-style status 130; stop and escalate to the Coordinator owner"
    );
  });

  it.each([
    {
      label: "validation",
      mode: "success" as const,
      input: {
        ...validInput(),
        release_parts: [
          {
            ...validInput().release_parts[0],
            pull_requests: [
              {
                ...validInput().release_parts[0]?.pull_requests[0],
                commit: "not-a-40-character-sha",
              },
            ],
          },
        ],
      },
      visibleReason: "must match pattern",
      recordEvidence: "/commit",
      hasRequestEvidence: false,
      hasWorkflowEvidence: false,
    },
    {
      label: "authentication",
      mode: "auth-failure" as const,
      input: validInput(),
      visibleReason: "synthetic GitHub authentication failure",
      recordEvidence: "synthetic GitHub authentication failure",
      hasRequestEvidence: true,
      hasWorkflowEvidence: false,
    },
    {
      label: "workflow dispatch",
      mode: "dispatch-failure" as const,
      input: validInput(),
      visibleReason: "synthetic workflow dispatch failure",
      recordEvidence: "synthetic workflow dispatch failure",
      hasRequestEvidence: true,
      hasWorkflowEvidence: false,
    },
    {
      label: "central workflow",
      mode: "workflow-failure" as const,
      input: validInput(),
      visibleReason: "synthetic central workflow rejection",
      recordEvidence: "synthetic central workflow rejection",
      hasRequestEvidence: true,
      hasWorkflowEvidence: true,
    },
  ])(
    "continues the existing flow after $label failure",
    ({
      mode,
      input,
      visibleReason,
      recordEvidence,
      hasRequestEvidence,
      hasWorkflowEvidence,
    }) => {
      projectDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), "frontend-release-request-")
      );
      const { result } = runObservationHarness(projectDirectory, input, mode);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("EXISTING_RELEASE_FLOW_CONTINUED=1");
      expect(result.stderr).toContain(visibleReason);
      expect(result.stderr).toContain(
        '"run_path": ".release-coordinator/runs/'
      );
      expect(result.stderr).toContain(
        hasRequestEvidence
          ? '"request_path": ".release-coordinator/outbox/'
          : '"request_path": null'
      );
      expect(result.stderr).toContain(
        hasWorkflowEvidence
          ? '"workflow_run_url": "https://github.com/6529-Collections/6529-release-coordinator/actions/runs/424242"'
          : '"workflow_run_url": null'
      );
      const run = readSingleRun(projectDirectory);
      expect(run.status).toBe("failed");
      expect(JSON.stringify(run)).toContain(recordEvidence);
    }
  );

  it("keeps observation after live status without gating later release paths", () => {
    const skill = fs.readFileSync(deploySkillPath, "utf8");
    const normalizedSkill = skill.replace(/\s+/g, " ");
    const liveStatus = skill.indexOf("## Live routing gate");
    const observation = skill.indexOf("## Release-request observation");
    const candidateRegistration = skill.indexOf("## V2 readiness");
    const manualMutation = skill.indexOf(
      "## Manual fallback while the target lane is OFF and changeable"
    );

    expect(liveStatus).toBeGreaterThanOrEqual(0);
    expect(observation).toBeGreaterThan(liveStatus);
    expect(candidateRegistration).toBeGreaterThan(observation);
    expect(manualMutation).toBeGreaterThan(observation);
    expect(normalizedSkill).toContain(
      "The initial `release-bus-status.mjs` check above remains the first action."
    );
    expect(normalizedSkill).toContain(
      "Run this observation only when introducing a new staging release intent"
    );
    expect(normalizedSkill).toContain("a new direct production release intent");
    expect(normalizedSkill).not.toContain("Run this preflight");
    expect(normalizedSkill).toContain(
      "A returned success or failure never gates, replaces, reorders, or weakens"
    );
  });

  it("documents every boundary that skips observation", () => {
    const skill = fs.readFileSync(deploySkillPath, "utf8");
    const normalizedSkill = skill.replace(/\s+/g, " ");

    for (const boundary of [
      "merge-only work",
      "status or monitoring",
      "retry or resume",
      "recovery",
      "production continuation",
      "promotion of an existing release",
      "lane toggles",
    ]) {
      expect(normalizedSkill).toContain(boundary);
    }
  });

  it("documents one synchronous submit with non-gating result handling", () => {
    const skill = fs.readFileSync(deploySkillPath, "utf8");
    const normalizedSkill = skill.replace(/\s+/g, " ");
    const submitCommands = skill.match(
      /\.\/bin\/6529 exec 6529-release-request submit --input -/gu
    );

    expect(submitCommands).toHaveLength(1);
    expect(skill).not.toContain("6529-release-request create --input -");
    expect(skill).not.toContain("gh workflow run");
    expect(skill).not.toContain("submit-release-request.yml");
    expect(normalizedSkill).toContain(
      "do not call `create` before or after this command"
    );
    expect(normalizedSkill).toContain("release_request_submit_status=$?");
    expect(normalizedSkill).toContain(
      "do not ask the developer to fix the observation during the release"
    );
    expect(normalizedSkill).toContain(
      "`submit` runs in the foreground and waits for the central GitHub workflow"
    );
    expect(normalizedSkill).toContain(
      "it can delay the release while GitHub queues or runs that workflow"
    );
    expect(normalizedSkill).toContain(
      "A true no-wait path requires a separate future change to the Coordinator CLI/package"
    );
    expect(normalizedSkill).toContain(
      "If the wait never returns, stop and escalate to the Coordinator owner"
    );
    expect(normalizedSkill).toContain(
      "do not invent a time limit or an interrupt-to-continue bypass"
    );
    expect(normalizedSkill).toContain(
      "a signal-style status of 128 or higher stops the release"
    );
    expect(normalizedSkill).toContain(
      "Keep the JSON limited to release metadata"
    );
    expect(normalizedSkill).toContain(
      "`requested_by` is descriptive context only"
    );
    expect(normalizedSkill).toContain(
      "The GitHub actor recorded by the central workflow is the trusted sender identity"
    );
    expect(normalizedSkill).toContain("a private Coordinator inbox Issue");
    expect(
      skill.match(/`inbox_issue_number`, `inbox_issue_url`/gu)
    ).toHaveLength(2);
  });

  it("keeps the developer documentation aligned with observation mode", () => {
    const documentation = fs.readFileSync(releaseBusDocPath, "utf8");
    const normalizedDocumentation = documentation.replace(/\s+/g, " ");

    expect(documentation).toContain("## Release-request observation");
    expect(documentation).toContain(
      "./bin/6529 exec 6529-release-request submit --input -"
    );
    expect(documentation).not.toContain(
      "./bin/6529 exec 6529-release-request create --input -"
    );
    expect(normalizedDocumentation).toContain(
      "Neither returned outcome gates, replaces, reorders, or weakens the existing release flow"
    );
    expect(normalizedDocumentation).toContain(
      "The command runs in the foreground and can delay the release"
    );
    expect(normalizedDocumentation).toContain(
      "If the wait never returns, stop and escalate to the Coordinator owner"
    );
    expect(normalizedDocumentation).toContain(
      "do not invent a time limit or an interrupt-to-continue bypass"
    );
    expect(normalizedDocumentation).toContain(
      "A signal-style status of 128 or higher stops the release"
    );
    expect(normalizedDocumentation).toContain(
      "`requested_by` is descriptive context, not authentication or approval"
    );
    expect(normalizedDocumentation).toContain(
      "The GitHub actor recorded by the central workflow is the trusted sender identity"
    );
    expect(normalizedDocumentation).toContain(
      "a private Coordinator inbox Issue"
    );
    expect(documentation.match(/inbox Issue number and URL/gu)).toHaveLength(2);
  });

  it("uses the canonical CLI template and exact release field names", () => {
    const skill = fs.readFileSync(deploySkillPath, "utf8");

    expect(skill).toContain("./bin/6529 exec 6529-release-request template");
    for (const field of [
      "`requested_by`",
      "`target`",
      "`database_change`",
      "`release_parts[]`",
      "`pull_requests[]`",
      "`depends_on[]`",
      "`number`",
      "`branch`",
      "`commit`",
      "`deploy_units[]`",
      "`deploy_dependencies[]`",
    ]) {
      expect(skill).toContain(field);
    }
    expect(skill).toContain('{ "before": "unit", "after": "unit" }');
  });

  it("runs this contract when the deploy skill changes in PR CI", () => {
    const workflow = parse(
      fs.readFileSync(appPrCiWorkflowPath, "utf8")
    ) as Workflow;
    const releaseBusContractStep = Object.values(workflow.jobs ?? {})
      .flatMap((job) => job.steps ?? [])
      .find((step) => step.name === "Verify Release Bus v2 workflow contract");

    expect(releaseBusContractStep?.run).toContain(
      "__tests__/scripts/release-request-preflight.test.ts"
    );
  });

  it("gitignores every local Release Coordinator record", () => {
    const gitignore = fs.readFileSync(
      path.join(repoRoot, ".gitignore"),
      "utf8"
    );

    expect(gitignore).toMatch(/^\/\.release-coordinator\/$/m);
  });
});
