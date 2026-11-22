#!/usr/bin/env node
// Copies @6529-collections/provenance-core into lib/provenance-core/ from a clone of
// 6529-Collections/6529-provenance-app at a commit:
//
//   node ops/scripts/sync-provenance-core.mjs --repo ../6529-provenance-app --commit <sha>
//
// The copy is temporary: once the package is on npm, delete lib/provenance-core/ and depend on
// @6529-collections/provenance-core instead. The repository's package policy refuses link: and
// file: dependencies, which is why the source is copied rather than linked.
//
// Changes made while copying: relative imports lose their ".js" suffix (the package compiles as
// NodeNext ESM; this repository resolves TypeScript paths without it), and each file gets a header
// naming the source commit. Nothing else changes.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const repo = arg("--repo");
const commit = arg("--commit");
if (!repo || !commit) {
  console.error("usage: sync-provenance-core.mjs --repo PATH --commit SHA");
  process.exit(2);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const target = join(root, "lib", "provenance-core");
const git = (...a) => execFileSync("git", ["-C", repo, ...a], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const full = git("rev-parse", `${commit}^{commit}`).trim();
const files = git("ls-tree", "-r", "--name-only", full, "src", "vectors")
  .split("\n")
  .filter((f) => /\.(ts|json)$/.test(f));

// README.md belongs to this repository, not the package; keep it across copies.
const readmePath = join(target, "README.md");
const readme = existsSync(readmePath) ? readFileSync(readmePath) : undefined;
rmSync(target, { recursive: true, force: true });
const header = (path) =>
  [
    `// Copied from 6529-Collections/6529-provenance-app ${path} at commit ${full}.`,
    "// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.",
    "// Replaced by @6529-collections/provenance-core from npm once that is published.",
    "",
  ].join("\n");

for (const f of files) {
  let text = git("show", `${full}:${f}`);
  const out = join(target, f.replace(/^src\//, ""));
  mkdirSync(dirname(out), { recursive: true });
  if (f.endsWith(".ts")) {
    text = text.replace(/(from\s+"\.{1,2}\/[^"]+?)\.js"/g, '$1"').replace(/(import\(\s*"\.{1,2}\/[^"]+?)\.js"/g, '$1"');
    text = header(f) + text;
  }
  writeFileSync(out, text);
}
if (readme !== undefined) writeFileSync(readmePath, readme);
writeFileSync(
  join(target, "SOURCE.json"),
  `${JSON.stringify({ repository: "6529-Collections/6529-provenance-app", commit: full, files: files.length }, null, 2)}\n`,
);
console.log(`copied ${files.length} files from ${full}`);
