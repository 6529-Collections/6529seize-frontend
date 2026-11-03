/** @jest-environment node */
import { execFile, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { mkdir, rename, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import pRetry from "p-retry";
import {
  buildMuseumPublicationSnapshot,
  resolveMuseumBuildCommit,
} from "@/scripts/build-museum-publication-snapshot";
import { GitHubMuseumPublicationSource } from "@/lib/museum/publication/github";
import { legacyCaseyPublicationAssembler } from "@/lib/museum/publication/legacyCasey";
import { museumPublicationCatalogResolver } from "@/lib/museum/publication/catalog";
import {
  createCaseyFixture,
  EXACT_COMMIT,
} from "@/__tests__/lib/museum/publication/fixture";

jest.mock("node:child_process", () => {
  const actual =
    jest.requireActual<typeof import("node:child_process")>(
      "node:child_process"
    );
  const { promisify: actualPromisify } =
    jest.requireActual<typeof import("node:util")>("node:util");
  const command = jest.fn();
  Object.defineProperty(command, actualPromisify.custom, { value: jest.fn() });
  return { ...actual, execFile: command };
});
jest.mock("node:fs/promises", () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  rename: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("p-retry", () => ({
  __esModule: true,
  default: jest.fn((operation: () => Promise<unknown>) => operation()),
}));

const runGit = jest.mocked(promisify(execFile));

beforeEach(() => {
  jest.clearAllMocks();
  runGit.mockReset();
  runGit.mockResolvedValue({
    stdout: `${EXACT_COMMIT}\trefs/heads/main\n`,
    stderr: "",
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Museum build Git resolution", () => {
  it("accepts only the full main SHA and uses bounded, non-interactive Git", async () => {
    await expect(resolveMuseumBuildCommit()).resolves.toBe(EXACT_COMMIT);
    expect(runGit).toHaveBeenCalledWith(
      "git",
      [
        "-c",
        "credential.helper=",
        "-c",
        "core.askPass=",
        "ls-remote",
        "--exit-code",
        "--refs",
        "https://github.com/6529-Collections/6529networkmuseum.git",
        "refs/heads/main",
      ],
      expect.objectContaining({
        encoding: "utf8",
        timeout: 30_000,
        killSignal: "SIGKILL",
        maxBuffer: 4096,
        env: expect.objectContaining({
          GIT_TERMINAL_PROMPT: "0",
          GIT_ASKPASS: "",
          SSH_ASKPASS: "",
          GCM_INTERACTIVE: "never",
        }),
      })
    );
  });

  it.each([
    "",
    "\n",
    `${EXACT_COMMIT}\n`,
    `${EXACT_COMMIT}\nrefs/heads/main\n`,
    `${EXACT_COMMIT} refs/heads/main\n`,
    `main\trefs/heads/main\n`,
    `${EXACT_COMMIT.slice(0, 39)}\trefs/heads/main\n`,
    `${EXACT_COMMIT}a\trefs/heads/main\n`,
    `${"g".repeat(40)}\trefs/heads/main\n`,
    `${"A".repeat(40)}\trefs/heads/main\n`,
    `${EXACT_COMMIT}\trefs/heads/main-extra\n`,
    `${EXACT_COMMIT}\trefs/tags/main\n`,
    `${EXACT_COMMIT}\tHEAD\n`,
    `${EXACT_COMMIT}\trefs/heads/main\n${EXACT_COMMIT}\trefs/heads/main\n`,
    `${EXACT_COMMIT}\trefs/heads/main extra\n`,
  ])("fails closed for invalid or ambiguous output %j", async (stdout) => {
    runGit.mockResolvedValue({ stdout, stderr: "" });
    await expect(buildMuseumPublicationSnapshot()).rejects.toThrow(
      "publication_git_ref_invalid"
    );
    expect(writeFile).not.toHaveBeenCalled();
    expect(rename).not.toHaveBeenCalled();
  });

  it.each([
    Object.assign(new Error("git unavailable"), { code: "ENOENT" }),
    Object.assign(new Error("network failed"), { code: 128 }),
    Object.assign(new Error("no matching ref"), { code: 2 }),
    Object.assign(new Error("timed out"), { killed: true, signal: "SIGKILL" }),
    Object.assign(new Error("output exceeded limit"), {
      code: "ERR_CHILD_PROCESS_STDIO_MAXBUFFER",
    }),
  ])(
    "propagates command failures without writing a snapshot: %s",
    async (error) => {
      runGit.mockRejectedValue(error);
      await expect(buildMuseumPublicationSnapshot()).rejects.toBe(error);
      expect(writeFile).not.toHaveBeenCalled();
      expect(rename).not.toHaveBeenCalled();
    }
  );

  it("pins the exact resolved SHA and retains both publication validators", async () => {
    const fixture = createCaseyFixture();
    const state = await new GitHubMuseumPublicationSource({
      ref: EXACT_COMMIT,
      assembler: legacyCaseyPublicationAssembler,
      fetch: fixture.fetch,
    }).load();
    expect(state.status).toBe("current");
    expect(fixture.calls.length).toBeGreaterThan(0);
    expect(
      fixture.calls.every((url) => url.includes(`/${EXACT_COMMIT}/`))
    ).toBe(true);
    const load = jest
      .spyOn(GitHubMuseumPublicationSource.prototype, "load")
      .mockResolvedValue(state);
    const output = jest.spyOn(process.stdout, "write").mockReturnValue(true);

    await buildMuseumPublicationSnapshot();

    expect(load).toHaveBeenCalledTimes(1);
    expect(load.mock.instances[0]).toMatchObject({
      ref: EXACT_COMMIT,
      assembler: legacyCaseyPublicationAssembler,
      catalogResolver: museumPublicationCatalogResolver,
    });
    expect(runGit).toHaveBeenCalledTimes(1);
    expect(pRetry).toHaveBeenCalledTimes(2);
    for (const [, options] of jest.mocked(pRetry).mock.calls) {
      expect(options).toEqual({
        retries: 2,
        minTimeout: 1000,
        maxTimeout: 4000,
        factor: 2,
        randomize: true,
      });
    }
    expect(mkdir).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining(".museum-publication/current.json."),
      expect.stringContaining('"publicationSha256":"sha256:'),
      "utf8"
    );
    expect(rename).toHaveBeenCalledTimes(1);
    expect(output).toHaveBeenCalledWith(expect.stringContaining(EXACT_COMMIT));
  });

  it("does not write rejected publication content", async () => {
    jest
      .spyOn(GitHubMuseumPublicationSource.prototype, "load")
      .mockResolvedValue({
        status: "unavailable",
        publication: null,
        errorCode: "publication_document_hash_mismatch",
        failedAt: "2026-10-15T00:00:00Z",
        lastValidAcceptedAt: null,
      });
    await expect(buildMuseumPublicationSnapshot()).rejects.toThrow(
      "publication_document_hash_mismatch"
    );
    expect(writeFile).not.toHaveBeenCalled();
    expect(rename).not.toHaveBeenCalled();
  });

  it("retries a failing Git command exactly three times in the real CLI, then exits without replacing content", () => {
    const temporaryDirectory = mkdtempSync(
      path.join(os.tmpdir(), "museum-snapshot-git-")
    );
    const attemptsPath = path.join(temporaryDirectory, "attempts.txt");
    const snapshotDirectory = path.join(
      temporaryDirectory,
      ".museum-publication"
    );
    const snapshotPath = path.join(snapshotDirectory, "current.json");
    mkdirSync(snapshotDirectory);
    writeFileSync(snapshotPath, "existing snapshot");
    writeFileSync(
      path.join(temporaryDirectory, "git"),
      `#!${process.execPath}\nrequire("node:fs").appendFileSync(process.env.MUSEUM_TEST_ATTEMPTS, "attempt\\n");\nprocess.exit(128);\n`,
      { mode: 0o755 }
    );
    try {
      const execution = spawnSync(
        process.execPath,
        [
          require.resolve("tsx/cli"),
          path.resolve("scripts/build-museum-publication-snapshot.ts"),
        ],
        {
          cwd: temporaryDirectory,
          encoding: "utf8",
          timeout: 20_000,
          env: {
            ...process.env,
            PATH: `${temporaryDirectory}${path.delimiter}${process.env["PATH"] ?? ""}`,
            TSX_TSCONFIG_PATH: path.resolve("tsconfig.json"),
            MUSEUM_TEST_ATTEMPTS: attemptsPath,
          },
        }
      );
      expect(execution.error).toBeUndefined();
      expect(execution.status).toBe(1);
      expect(execution.stdout).toBe("");
      expect(execution.stderr).toContain("Command failed:");
      expect(
        readFileSync(attemptsPath, "utf8").trim().split("\n")
      ).toHaveLength(3);
      expect(readFileSync(snapshotPath, "utf8")).toBe("existing snapshot");
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  }, 25_000);
});
