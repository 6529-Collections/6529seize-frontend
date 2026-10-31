#!/usr/bin/env node
/**
 * Copies the Lean statement of every theorem the proof manifest names (the
 * proved ones and the counterexamples proved in the kernel) into
 * `lib/explained/data/lean.json`, so How sure can print each claim in plain
 * words (the manifest's own sentence) and in Lean (the theorem as the model
 * states it), without a hand-copied line.
 *
 *   node scripts/explained/sync-lean.mjs --chain <path to 6529chain> [--manifest <file>] [--check]
 *
 * - The manifest defaults to `lib/tdh/formal/bundledManifest.json`, the copy
 *   of the feed's `formal/manifest.json` kept with the page. Refresh that
 *   copy from the feed first, then run this.
 * - Each entry with a file and a line is read at the manifest's own commit
 *   (`source.commit`) with `git show`, from its line to the `:=` that ends
 *   its statement at the top level: the proof is left out, and so is the
 *   doc comment (the manifest's sentence says it in words).
 * - The first line must name the entry, so a manifest whose lines no longer
 *   match the source fails here, not on the page.
 *
 * The statements are the model's mathematics: no person, no address, no
 * host. `--check` exits 1 when the file is behind the manifest.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const OUT = path.join(ROOT, "lib/explained/data/lean.json");
const DEFAULT_MANIFEST = path.join(ROOT, "lib/tdh/formal/bundledManifest.json");
/** Where the model lives in 6529chain. */
const MODEL_DIR = "design/tdh-lean";
/** No statement in the model runs longer; a longer one means a bad line. */
const MAX_LINES = 40;

function args() {
  const out = { chain: null, manifest: DEFAULT_MANIFEST, check: false };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--chain") out.chain = argv[++i];
    else if (argv[i] === "--manifest") out.manifest = argv[++i];
    else if (argv[i] === "--check") out.check = true;
  }
  if (!out.chain) {
    console.error(
      "usage: sync-lean.mjs --chain <path to 6529chain> [--manifest <file>] [--check]"
    );
    process.exit(2);
  }
  return out;
}

const OPEN = new Set(["(", "[", "{", "⟨", "⦃"]);
const CLOSE = new Set([")", "]", "}", "⟩", "⦄"]);

/**
 * The declaration that starts at `line` (1-based), up to the `:=` that ends
 * its statement outside every bracket (a structure update's `:=` stays), or
 * to the first `|` case of a definition by cases.
 */
export function statementAt(lines, line) {
  const out = [];
  let depth = 0;
  for (let i = line - 1; i < lines.length && out.length < MAX_LINES; i += 1) {
    const text = lines[i];
    if (i > line - 1 && /^\s*\|/.test(text) && depth === 0) {
      return trimEnd(out);
    }
    for (let j = 0; j < text.length; j += 1) {
      const ch = text[j];
      if (ch === "-" && text[j + 1] === "-") {
        break;
      }
      if (OPEN.has(ch)) depth += 1;
      else if (CLOSE.has(ch)) depth = Math.max(0, depth - 1);
      else if (depth === 0 && ch === ":" && text[j + 1] === "=") {
        out.push(text.slice(0, j));
        return trimEnd(out);
      }
    }
    out.push(text);
    if (/^#guard\b/.test(text.trim()) && depth === 0) {
      return trimEnd(out);
    }
  }
  return null;
}

function trimEnd(lines) {
  const copy = [...lines];
  copy[copy.length - 1] = copy[copy.length - 1].replace(/\s+$/, "");
  while (copy.length > 0 && copy[copy.length - 1] === "") copy.pop();
  return copy.join("\n");
}

function git(chain, gitArgs) {
  return execFileSync("git", ["-C", chain, ...gitArgs], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

export function buildStatements(manifest, readFile) {
  const statements = {};
  const missing = [];
  for (const entry of manifest.theorems) {
    // Theorems only: a counterexample checked by evaluation is a #guard
    // over a definition, and a limit names no line.
    if (
      !entry.leanName ||
      !entry.file ||
      !entry.line ||
      !entry.file.endsWith(".lean")
    ) {
      continue;
    }
    const lines = readFile(entry.file).split(/\r?\n/);
    const text = statementAt(lines, entry.line);
    const short = (entry.leanName ?? "").split(".").pop();
    if (!text || (short && !text.split("\n")[0].includes(short))) {
      missing.push(`${entry.id} (${entry.file}:${entry.line})`);
      continue;
    }
    statements[entry.id] = text;
  }
  if (missing.length > 0) {
    throw new Error(
      `the manifest's lines do not match the source at its commit: ${missing.join(", ")}`
    );
  }
  return statements;
}

async function main() {
  const opts = args();
  const manifest = JSON.parse(readFileSync(opts.manifest, "utf8"));
  const commit = manifest.source?.commit;
  if (!commit) {
    throw new Error("the manifest names no source commit");
  }
  const files = new Map();
  const readFile = (file) => {
    if (!files.has(file)) {
      files.set(
        file,
        git(opts.chain, ["show", `${commit}:${MODEL_DIR}/${file}`])
      );
    }
    return files.get(file);
  };
  const statements = buildStatements(manifest, readFile);
  const data = {
    note: "Generated by scripts/explained/sync-lean.mjs from the Lean model at the proof manifest's commit. Do not edit by hand.",
    commit,
    generatedAt: manifest.generatedAt,
    statements,
  };
  if (opts.check) {
    const current = JSON.stringify(JSON.parse(readFileSync(OUT, "utf8")));
    if (current !== JSON.stringify(data)) {
      console.error(
        `lean.json is behind the manifest (commit ${commit.slice(0, 7)}). Run without --check.`
      );
      process.exit(1);
    }
    console.log(`lean.json matches the manifest at ${commit.slice(0, 7)}.`);
    return;
  }
  const prettier = await import("prettier");
  const options = (await prettier.resolveConfig(OUT)) ?? {};
  writeFileSync(
    OUT,
    await prettier.format(JSON.stringify(data, null, 2), {
      ...options,
      parser: "json",
    })
  );
  console.log(
    `wrote ${path.relative(ROOT, OUT)}: ${Object.keys(statements).length} statements at ${commit.slice(0, 7)}`
  );
}

const invoked = process.argv[1]
  ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;
if (invoked) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
