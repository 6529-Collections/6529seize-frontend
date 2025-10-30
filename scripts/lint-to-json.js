#!/usr/bin/env node
/**
 * Transform lint.txt output into lint.json summary.
 *
 * lint.json will be an array of objects with:
 * - key: absolute path to the file.
 * - item: combined warning lines exactly as in lint.txt.
 * - count: number of warnings captured for that path.
 *
 * Usage: node scripts/lint-to-json.js [inputPath] [outputPath]
 * Defaults: lint.txt -> lint.json relative to repo root.
 */
import fs from "node:fs";
import path from "node:path";

const [inputArg, outputArg] = process.argv.slice(2);
const inputPath = inputArg ?? path.resolve(process.cwd(), "lint.txt");
const outputPath = outputArg ?? path.resolve(process.cwd(), "lint.json");

const fileContents = fs.readFileSync(inputPath, "utf8");
const lines = fileContents.split(/\r?\n/);

const entries = [];
let currentPath = null;
let currentWarnings = [];

const flushCurrent = () => {
  if (!currentPath) return;

  const warningText = currentWarnings.join("\n\n");
  entries.push({
    key: currentPath,
    item: warningText,
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
