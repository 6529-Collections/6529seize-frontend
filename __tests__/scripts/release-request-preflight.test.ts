import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type CliSummary = {
  status: string;
  run_path: string;
  request_id: string | null;
  request_path: string | null;
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

/** Runs the repository-installed release-request CLI in an isolated project. */
function runInstalledCli(projectDirectory: string, input: unknown) {
  fs.accessSync(wrapperPath, fs.constants.X_OK);
  fs.accessSync(installedCliPath, fs.constants.X_OK);

  const result = spawnSync(
    wrapperPath,
    [
      "exec",
      "6529-release-request",
      "create",
      "--input",
      "-",
      "--project-dir",
      projectDirectory,
    ],
    {
      cwd: projectDirectory,
      encoding: "utf8",
      input: JSON.stringify(input),
    }
  );

  if (result.error) {
    throw result.error;
  }

  return result;
}

describe("local release-request preflight", () => {
  let projectDirectory: string | undefined;

  afterEach(() => {
    if (projectDirectory) {
      fs.rmSync(projectDirectory, { force: true, recursive: true });
      projectDirectory = undefined;
    }
  });

  it("uses the installed CLI through the repository wrapper to accept a valid request", () => {
    projectDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), "frontend-release-request-")
    );
    const input = {
      requested_by: "release-agent",
      target: "staging",
      database_change: "no",
      release_parts: [
        {
          id: "backend",
          repository: "6529seize-backend",
          pull_requests: [
            {
              number: 123,
              branch: "feature/backend-release",
              commit: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            },
          ],
          depends_on: [],
          deploy_units: ["api"],
          deploy_dependencies: [],
        },
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
          depends_on: ["backend"],
        },
      ],
    };

    const result = runInstalledCli(projectDirectory, input);

    expect(result.status).toBe(0);
    const summary = JSON.parse(result.stdout) as CliSummary;
    expect(summary).toMatchObject({
      status: "succeeded",
      run_path: expect.stringMatching(
        /^\.release-coordinator\/runs\/.+\.json$/
      ),
      request_id: expect.any(String),
      request_path: expect.stringMatching(
        /^\.release-coordinator\/outbox\/.+\.json$/
      ),
    });

    const run = JSON.parse(
      fs.readFileSync(path.join(projectDirectory, summary.run_path), "utf8")
    ) as { status: string; request: { id: string; path: string } };
    const request = JSON.parse(
      fs.readFileSync(
        path.join(projectDirectory, summary.request_path as string),
        "utf8"
      )
    ) as Record<string, unknown>;

    expect(run).toMatchObject({
      status: "succeeded",
      request: {
        id: summary.request_id,
        path: summary.request_path,
      },
    });
    expect(request).toMatchObject(input);
  });

  it("keeps a failed run and creates no accepted request for invalid input", () => {
    projectDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), "frontend-release-request-")
    );
    const result = runInstalledCli(projectDirectory, {
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
              commit: "not-a-40-character-sha",
            },
          ],
          depends_on: [],
        },
      ],
    });

    expect(result.status).not.toBe(0);
    const runsDirectory = path.join(
      projectDirectory,
      ".release-coordinator",
      "runs"
    );
    const runFiles = fs.readdirSync(runsDirectory);
    expect(runFiles).toHaveLength(1);
    const [runFile] = runFiles;
    if (!runFile) {
      throw new Error("The CLI did not create its failed run record.");
    }

    const failedRun = JSON.parse(
      fs.readFileSync(path.join(runsDirectory, runFile), "utf8")
    ) as { status: string; request: unknown; errors: unknown[] };
    expect(failedRun).toMatchObject({
      status: "failed",
      request: null,
    });
    expect(failedRun.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          location: expect.stringContaining("/commit"),
        }),
      ])
    );
    expect(
      fs.existsSync(
        path.join(projectDirectory, ".release-coordinator", "outbox")
      )
    ).toBe(false);
  });

  it("keeps the preflight after live status and before release mutation paths", () => {
    const skill = fs.readFileSync(deploySkillPath, "utf8");
    const normalizedSkill = skill.replace(/\s+/g, " ");
    const liveStatus = skill.indexOf("## Live routing gate");
    const preflight = skill.indexOf("## Local release-request preflight");
    const candidateRegistration = skill.indexOf("## V2 readiness");
    const manualMutation = skill.indexOf(
      "## Manual fallback while the target lane is OFF and changeable"
    );

    expect(liveStatus).toBeGreaterThanOrEqual(0);
    expect(preflight).toBeGreaterThan(liveStatus);
    expect(candidateRegistration).toBeGreaterThan(preflight);
    expect(manualMutation).toBeGreaterThan(preflight);
    expect(normalizedSkill).toContain(
      "The initial `release-bus-status.mjs` check above remains the first action."
    );
    expect(normalizedSkill).toContain(
      "stop before candidate registration, merges, deployment, or other environment mutation"
    );
  });

  it("documents every boundary that skips the preflight", () => {
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

  it("gitignores every local Release Coordinator record", () => {
    const gitignore = fs.readFileSync(
      path.join(repoRoot, ".gitignore"),
      "utf8"
    );

    expect(gitignore).toMatch(/^\/\.release-coordinator\/$/m);
  });
});
