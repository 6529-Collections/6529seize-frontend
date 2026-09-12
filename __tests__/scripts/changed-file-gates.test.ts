import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = process.cwd();
const gitBash = path.join(
  process.env["ProgramFiles"] ?? "",
  "Git/bin/bash.exe"
);
const bash =
  process.platform === "win32" && fs.existsSync(gitBash) ? gitBash : "bash";
const { scripts } = JSON.parse(
  fs.readFileSync(path.join(ROOT, "package.json"), "utf8")
) as { scripts: Record<string, string> };
const GATES = [
  "lint:changed",
  "lint:changed:fix",
  "lint:changed:tight",
  "lint:uncommitted:tight",
  "lint:diff",
  "format:changed",
  "format:uncommitted",
];
const PROBE = [
  'const fs = require("node:fs");',
  'fs.appendFileSync("gate-invocations.log", JSON.stringify({',
  "  args: process.argv.slice(2), base: process.env.ESLINT_PLUGIN_DIFF_COMMIT",
  '}) + "\\n");',
  'if (process.argv.includes("src/fail.ts")) process.exit(2);',
].join("\n");

function write(root: string, file: string, content: string) {
  const destination = path.join(root, file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content);
}

function git(root: string, args: string[]) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || `git failed: ${args.join(" ")}`);
  }
  return result.stdout.trim();
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "changed-file-gates-"));
  git(root, ["init", "--initial-branch=main"]);
  git(root, ["config", "user.name", "Test Fixture"]);
  git(root, ["config", "user.email", "fixture@example.invalid"]);
  git(root, ["config", "commit.gpgsign", "false"]);
  write(root, ".gitignore", "node_modules/\ngate-invocations.log\n");
  write(root, "src/tracked.ts", "export const value = 1;\n");
  write(
    root,
    "scripts/require-6529-command.cjs",
    fs.readFileSync(path.join(ROOT, "scripts/require-6529-command.cjs"), "utf8")
  );
  git(root, ["add", "."]);
  git(root, ["commit", "-s", "-m", "Create gate fixture"]);
  git(root, ["update-ref", "refs/remotes/origin/main", "HEAD"]);
  write(root, "node_modules/eslint/bin/eslint.js", PROBE);
  write(root, "node_modules/prettier/bin/prettier.cjs", PROBE);
  return root;
}

interface Invocation {
  args: string[];
  base?: string;
}

function runGate(root: string, gate: string) {
  const log = path.join(root, "gate-invocations.log");
  fs.writeFileSync(log, "");
  // Execute the actual package command, including its wrapper guard, against
  // an isolated repository and recording CLI. Never format/lint app fixtures.
  const result = spawnSync(bash, ["-c", scripts[gate]!], {
    cwd: root,
    env: process.env,
    encoding: "utf8",
    timeout: 30000,
  });
  const calls = fs
    .readFileSync(log, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Invocation);
  return { ...result, calls };
}

function createLargeChange(root: string) {
  const files = Array.from(
    { length: 420 },
    (_, index) =>
      `src/[locale]/(group)/space and & symbols/${index}-${"segment".repeat(9)}.ts`
  );
  for (const file of files) write(root, file, "export {};\n");
  write(root, "generated/excluded.ts", "export {};\n");
  return files;
}

describe.each(GATES)("%s command transport", (gate) => {
  let root: string;

  beforeEach(() => {
    root = fixture();
  }, 30000);

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("does not invoke a CLI for an empty change set", () => {
    const result = runGate(root, gate);
    expect(result.error).toBeUndefined();
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(result.calls).toEqual([]);
  });

  it("passes option-shaped filenames after the end-of-options delimiter", () => {
    const file = "--config=other.js";
    write(root, file, "export {};\n");
    const result = runGate(root, gate);
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.calls).toHaveLength(1);
    const args = result.calls[0]!.args;
    expect(args.indexOf("--")).toBeGreaterThanOrEqual(0);
    expect(args.slice(args.indexOf("--") + 1)).toEqual([file]);
  });

  it("batches large path sets without losing metacharacters or exclusions", () => {
    const files = createLargeChange(root);
    const result = runGate(root, gate);
    expect(result.error).toBeUndefined();
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(result.calls.length).toBeGreaterThan(1);
    const received = result.calls.flatMap(({ args }) =>
      args.filter((arg) => arg.startsWith("src/"))
    );
    expect(received.sort()).toEqual(files.sort());
    expect(result.calls.flatMap(({ args }) => args)).not.toContain(
      "generated/excluded.ts"
    );
    for (const { args } of result.calls) {
      expect(Buffer.byteLength(args.join(" "), "utf8")).toBeLessThan(12000);
    }
    if (gate === "lint:changed" || gate === "lint:changed:fix") {
      const base = git(root, ["rev-parse", "origin/main"]);
      expect(result.calls.every((call) => call.base === base)).toBe(true);
    }
  }, 60000);

  it("propagates an error from a CLI chunk", () => {
    write(root, "src/fail.ts", "export {};\n");
    const result = runGate(root, gate);
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(123);
    expect(result.calls.some(({ args }) => args.includes("src/fail.ts"))).toBe(
      true
    );
  }, 60000);
});
