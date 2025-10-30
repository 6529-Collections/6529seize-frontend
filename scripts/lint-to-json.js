#!/usr/bin/env node
/**
 * Transform lint.txt output into lint.json summary.
 *
 * lint.json will be an array of objects with:
 * - key: relative path to the file.
 * - item: relative path followed by combined warning lines from lint.txt.
 *
 * Usage: node scripts/lint-to-json.js [inputPath] [outputPath]
 * Defaults: lint.txt -> lint.json relative to repo root.
 */
import fs from "node:fs";
import path from "node:path";

const [inputArg, outputArg] = process.argv.slice(2);
const inputPath = inputArg ?? path.resolve(process.cwd(), "lint.txt");
const outputPath = outputArg ?? path.resolve(process.cwd(), "lint.json");
const repoRoot = process.cwd();

const toRelativePath = (filePath) => {
  if (!filePath) return filePath;
  const resolved = path.resolve(repoRoot, filePath);
  const relative = path.relative(repoRoot, resolved);
  return relative || path.basename(resolved);
};

const fileContents = fs.readFileSync(inputPath, "utf8");
const lines = fileContents.split(/\r?\n/);

const entries = [];
let currentPath = null;
let currentWarnings = [];

const flushCurrent = () => {
  if (!currentPath) return;

  const relativePath = toRelativePath(currentPath);
  const warningText = currentWarnings.join("\n\n");
  entries.push({
    key: relativePath,
    item: [relativePath, warningText].filter(Boolean).join("\n\n"),
    prompt: null,
  });

  currentPath = null;
  currentWarnings = [];
};

for (const line of lines) {
  if (!line.trim()) {
    continue;
  }

  if (/^\/.+/.test(line)) {
    flushCurrent();
    currentPath = line.trim();
    continue;
  }

  if (currentPath && line.startsWith("  ")) {
    currentWarnings.push(line);
    continue;
  }

  // Non-path, non-warning lines (tool noise) are ignored.
}

flushCurrent();

const jsonOutput = `${JSON.stringify(entries, null, 2)}\n`;
fs.writeFileSync(outputPath, jsonOutput, "utf8");
