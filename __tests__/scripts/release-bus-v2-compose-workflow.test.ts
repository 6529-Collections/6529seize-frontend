import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function composeScript(): string {
  const workflow = readFileSync(
    path.join(process.cwd(), ".github/workflows/release-bus-v2-compose.yml"),
    "utf8"
  );
  // This executes the workflow's shell verbatim; keep the expression coupled
  // to the YAML step indentation so formatting drift fails the test loudly.
  const match = workflow.match(
    /\n {8}id: compose\n[\s\S]*?\n {8}run: \|\n([\s\S]*?)(?=\n {6}- )/
  );
  if (!match) {
    throw new Error("Compose workflow script was not found");
  }
  return match[1]!
    .split("\n")
    .map((line) => line.replace(/^ {10}/, ""))
    .join("\n");
}

describe("Release Bus v2 frontend composition workflow", () => {
  it("accepts immutable rollback branches for forward-only staging recovery", () => {
    const workflow = readFileSync(
      path.join(process.cwd(), ".github/workflows/release-bus-v2-compose.yml"),
      "utf8"
    );
    expect(workflow).toContain(
      "(staging|production|qualification|rollback)-train-"
    );
  });

  it("creates a cumulative release whose first parent is exact staging", () => {
    const root = mkdtempSync(
      path.join(tmpdir(), "release-bus-v2-frontend-compose-")
    );
    const origin = path.join(root, "origin.git");
    const repository = path.join(root, "repository");
    const runnerTemp = path.join(root, "runner-temp");

    try {
      execFileSync("git", ["init", "--bare", origin]);
      execFileSync("git", ["init", "--initial-branch=main", repository]);
      mkdirSync(runnerTemp);
      git(repository, "config", "user.name", "Release Bus Test");
      git(repository, "config", "user.email", "release-bus-test@example.com");
      git(repository, "remote", "add", "origin", origin);
      writeFileSync(path.join(repository, "main.txt"), "main\n");
      git(repository, "add", "main.txt");
      git(repository, "commit", "-m", "main");
      const baseSha = git(repository, "rev-parse", "HEAD");
      git(repository, "push", "origin", "main");

      git(repository, "switch", "-c", "staging-parent", baseSha);
      writeFileSync(path.join(repository, "candidate-a.txt"), "candidate a\n");
      git(repository, "add", "candidate-a.txt");
      git(repository, "commit", "-m", "candidate a");
      const stagingParentSha = git(repository, "rev-parse", "HEAD");
      git(repository, "push", "origin", "staging-parent");

      git(repository, "switch", "-c", "candidate-b", baseSha);
      writeFileSync(path.join(repository, "candidate-b.txt"), "candidate b\n");
      git(repository, "add", "candidate-b.txt");
      git(repository, "commit", "-m", "candidate b");
      const candidateSha = git(repository, "rev-parse", "HEAD");
      git(repository, "push", "origin", "candidate-b");
      git(repository, "switch", "main");

      execFileSync("bash", ["-c", composeScript()], {
        cwd: repository,
        env: {
          ...process.env,
          BASE_SHA: baseSha,
          CANDIDATE_SHAS: JSON.stringify([stagingParentSha, candidateSha]),
          RELEASE_BRANCH: "release-bus-v2/staging-train-cumulative-frontend",
          RELEASE_BUS_GIT_EMAIL: "release-bus-test@example.com",
          RELEASE_BUS_GIT_NAME: "Release Bus Test",
          RELEASE_PARENT_SHA: stagingParentSha,
          RUNNER_TEMP: runnerTemp,
          TRAIN_ID: "cumulative",
        },
        stdio: ["ignore", "pipe", "pipe"],
      });

      const releaseSha = git(repository, "rev-parse", "HEAD");
      const parents = git(
        repository,
        "rev-list",
        "--parents",
        "-n",
        "1",
        releaseSha
      ).split(" ");
      expect(parents[1]).toBe(stagingParentSha);
      expect(git(repository, "show", `${releaseSha}:candidate-a.txt`)).toBe(
        "candidate a"
      );
      expect(git(repository, "show", `${releaseSha}:candidate-b.txt`)).toBe(
        "candidate b"
      );
      expect(
        JSON.parse(
          readFileSync(path.join(runnerTemp, "composition.json"), "utf8")
        )
      ).toEqual({
        composed_sha: releaseSha,
        excluded_shas: [],
        reused: false,
      });

      const releaseBranch = "release-bus-v2/staging-train-cumulative-frontend";
      git(
        repository,
        "push",
        "origin",
        `${releaseSha}:refs/heads/${releaseBranch}`
      );
      git(repository, "switch", "main");
      execFileSync("bash", ["-c", composeScript()], {
        cwd: repository,
        env: {
          ...process.env,
          BASE_SHA: baseSha,
          CANDIDATE_SHAS: JSON.stringify([stagingParentSha, candidateSha]),
          RELEASE_BRANCH: releaseBranch,
          RELEASE_BUS_GIT_EMAIL: "release-bus-test@example.com",
          RELEASE_BUS_GIT_NAME: "Release Bus Test",
          RELEASE_PARENT_SHA: stagingParentSha,
          RUNNER_TEMP: runnerTemp,
          TRAIN_ID: "cumulative",
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
      expect(
        JSON.parse(
          readFileSync(path.join(runnerTemp, "composition.json"), "utf8")
        )
      ).toEqual({
        composed_sha: releaseSha,
        excluded_shas: [],
        reused: true,
      });

      expect(() =>
        execFileSync("bash", ["-c", composeScript()], {
          cwd: repository,
          env: {
            ...process.env,
            BASE_SHA: baseSha,
            CANDIDATE_SHAS: JSON.stringify([stagingParentSha, candidateSha]),
            RELEASE_BRANCH: releaseBranch,
            RELEASE_BUS_GIT_EMAIL: "release-bus-test@example.com",
            RELEASE_BUS_GIT_NAME: "Release Bus Test",
            RELEASE_PARENT_SHA: baseSha,
            RUNNER_TEMP: runnerTemp,
            TRAIN_ID: "wrong-parent",
          },
          stdio: ["ignore", "pipe", "pipe"],
        })
      ).toThrow();

      git(repository, "switch", "--detach", stagingParentSha);
      execFileSync("bash", ["-c", composeScript()], {
        cwd: repository,
        env: {
          ...process.env,
          BASE_SHA: stagingParentSha,
          CANDIDATE_SHAS: JSON.stringify([stagingParentSha]),
          RELEASE_BRANCH:
            "release-bus-v2/staging-train-empty-cumulative-frontend",
          RELEASE_BUS_GIT_EMAIL: "release-bus-test@example.com",
          RELEASE_BUS_GIT_NAME: "Release Bus Test",
          RELEASE_PARENT_SHA: stagingParentSha,
          RUNNER_TEMP: runnerTemp,
          TRAIN_ID: "empty-cumulative",
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
      const emptyReleaseSha = git(repository, "rev-parse", "HEAD");
      expect(emptyReleaseSha).not.toBe(stagingParentSha);
      expect(
        git(repository, "rev-list", "--parents", "-n", "1", emptyReleaseSha)
      ).toBe(`${emptyReleaseSha} ${stagingParentSha}`);
      expect(
        git(repository, "show", "-s", "--format=%B", emptyReleaseSha)
      ).toContain(`Release-Parent-SHA: ${stagingParentSha}`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
