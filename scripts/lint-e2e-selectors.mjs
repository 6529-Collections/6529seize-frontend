import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import config from "../eslint.config.e2e-selectors.mjs";

const RULE = "e2e-selectors/prefer-accessible";
const SOURCE_FILE = /^(?:tests|e2e)\/.*\.(?:[cm]?[jt]s|[jt]sx)$/u;

function git(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function callText(source, message) {
  const lines = source.replaceAll("\r\n", "\n").split("\n");
  const selected = lines.slice(message.line - 1, message.endLine);
  selected[selected.length - 1] = selected
    .at(-1)
    .slice(0, message.endColumn - 1);
  selected[0] = selected[0].slice(message.column - 1);
  return selected.join("\n");
}

export function newViolations(
  currentSource,
  currentMessages,
  baseSource,
  baseMessages
) {
  // No editable grandfather list: the trusted base tree supplies the allowance.
  // Match exact calls per file, including receiver/arguments, with multiplicity.
  const remaining = new Map();
  for (const message of baseMessages) {
    if (message.ruleId !== RULE) continue;
    const key = callText(baseSource, message);
    remaining.set(key, (remaining.get(key) ?? 0) + 1);
  }
  return currentMessages.filter((message) => {
    if (message.ruleId !== RULE) return true;
    const key = callText(currentSource, message);
    const count = remaining.get(key) ?? 0;
    if (count === 0) return true;
    remaining.set(key, count - 1);
    return false;
  });
}

export async function lintSelectors({
  cwd = process.cwd(),
  baseRef = "origin/main",
} = {}) {
  // CI supplies its fetched exact BASE_SHA. Locally compare with the merge base
  // so unrelated main changes do not alter this branch's legacy allowance.
  const baseSha = git(["merge-base", baseRef, "HEAD"], cwd).trim();
  if (!/^[a-f0-9]{40}$/u.test(baseSha))
    throw new Error("Cannot resolve selector lint base SHA.");
  const files = [
    ...new Set(
      git(
        [
          "ls-files",
          "--cached",
          "--others",
          "--exclude-standard",
          "-z",
          "--",
          "tests",
          "e2e",
        ],
        cwd
      ).split("\0")
    ),
  ].filter((file) => SOURCE_FILE.test(file));
  const baseFiles = new Set(
    git(
      ["ls-tree", "-r", "--name-only", "-z", baseSha, "--", "tests", "e2e"],
      cwd
    ).split("\0")
  );
  const eslint = new ESLint({
    cwd,
    overrideConfigFile: true,
    overrideConfig: config,
    allowInlineConfig: false,
  });
  const failures = [];
  let checked = 0;
  let legacy = 0;
  for (const file of files.sort()) {
    const fullPath = path.join(cwd, file);
    if (!fs.existsSync(fullPath)) continue; // Locally deleted tracked file.
    const source = fs.readFileSync(fullPath, "utf8");
    const [result] = await eslint.lintText(source, { filePath: file });
    checked += 1;
    if (result.messages.length === 0) continue;
    const baseSource = baseFiles.has(file)
      ? git(["show", `${baseSha}:${file}`], cwd)
      : "";
    const [baseResult] = await eslint.lintText(baseSource, { filePath: file });
    if (baseResult.fatalErrorCount > 0)
      throw new Error(`Cannot parse selector lint base: ${file}`);
    const added = newViolations(
      source,
      result.messages,
      baseSource,
      baseResult.messages
    );
    legacy += result.messages.length - added.length;
    failures.push(...added.map((message) => ({ file, ...message })));
  }
  return { baseSha, checked, legacy, failures };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 0 && (args.length !== 2 || args[0] !== "--base-ref")) {
    throw new Error("Usage: lint-e2e-selectors.mjs [--base-ref <ref>]");
  }
  const result = await lintSelectors({
    baseRef: args[1] ?? process.env.BASE_SHA ?? "origin/main",
  });
  for (const failure of result.failures) {
    console.error(
      `${failure.file}:${failure.line}:${failure.column} ${failure.message}`
    );
  }
  console.log(
    `E2E selectors: ${result.checked} files, ${result.legacy} unchanged legacy calls, ${result.failures.length} new violations (base ${result.baseSha.slice(0, 12)}).`
  );
  process.exitCode = result.failures.length > 0 ? 1 : 0;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
