#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import * as ts from "typescript";

const input = fs.readFileSync(0, "utf8");
if (!input.trim()) {
  console.log("No TS2532 lines found on stdin.");
  process.exit(0);
}

const errorRegex = /^(.+?)\((\d+),(\d+)\): error TS2532:/;
const locationsByFile = new Map();
let totalErrors = 0;

for (const line of input.split(/\r?\n/)) {
  const match = errorRegex.exec(line);
  if (!match) {
    continue;
  }

  const [, file, lineText, colText] = match;
  const lineNumber = Number(lineText);
  const colNumber = Number(colText);
  if (!Number.isFinite(lineNumber) || !Number.isFinite(colNumber)) {
    continue;
  }

  totalErrors += 1;
  const filePath = path.resolve(process.cwd(), file);
  const key = `${lineNumber}:${colNumber}`;
  if (!locationsByFile.has(filePath)) {
    locationsByFile.set(filePath, new Map());
  }
  const perFile = locationsByFile.get(filePath);
  if (!perFile.has(key)) {
    perFile.set(key, { line: lineNumber, col: colNumber });
  }
}

const skipped = [];
const skippedCounts = new Map();
const updatedFiles = [];
let appliedFixes = 0;

function recordSkip(filePath, lineNumber, colNumber, reason) {
  skipped.push({ filePath, lineNumber, colNumber, reason });
  skippedCounts.set(reason, (skippedCounts.get(reason) ?? 0) + 1);
}

function isPropertyAccessNode(node) {
  return (
    ts.isPropertyAccessExpression(node) ||
    node.kind === ts.SyntaxKind.PropertyAccessChain
  );
}

function isElementAccessNode(node) {
  return (
    ts.isElementAccessExpression(node) ||
    node.kind === ts.SyntaxKind.ElementAccessChain
  );
}

function findElementPropertyAccess(node) {
  let current = node;
  while (current) {
    if (isPropertyAccessNode(current) && isElementAccessNode(current.expression)) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function getScriptKind(filePath) {
  if (filePath.endsWith(".tsx")) {
    return ts.ScriptKind.TSX;
  }
  if (filePath.endsWith(".ts")) {
    return ts.ScriptKind.TS;
  }
  if (filePath.endsWith(".jsx")) {
    return ts.ScriptKind.JSX;
  }
  if (filePath.endsWith(".js")) {
    return ts.ScriptKind.JS;
  }
  return ts.ScriptKind.Unknown;
}

for (const [filePath, entries] of locationsByFile.entries()) {
  if (!fs.existsSync(filePath)) {
    recordSkip(filePath, 0, 0, "file-missing");
    continue;
  }

  const original = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    original,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(filePath),
  );

  const insertPositions = new Set();
  for (const { line, col } of entries.values()) {
    if (line <= 0 || col <= 0) {
      recordSkip(filePath, line, col, "line-col-out-of-range");
      continue;
    }

    const pos = ts.getPositionOfLineAndCharacter(sourceFile, line - 1, col - 1);
    const token = ts.getTokenAtPosition(sourceFile, pos);
    const access = findElementPropertyAccess(token);
    if (!access) {
      recordSkip(filePath, line, col, "no-element-property-access");
      continue;
    }

    if ("questionDotToken" in access && access.questionDotToken) {
      recordSkip(filePath, line, col, "already-optional");
      continue;
    }

    const exprEnd = access.expression.getEnd();
    const nameStart = access.name.getStart(sourceFile);
    const between = original.slice(exprEnd, nameStart);
    const normalized = between.replace(/\s/g, "");
    if (normalized !== ".") {
      recordSkip(filePath, line, col, "non-simple-dot");
      continue;
    }

    const dotOffset = between.indexOf(".");
    if (dotOffset < 0) {
      recordSkip(filePath, line, col, "dot-not-found");
      continue;
    }

    insertPositions.add(exprEnd + dotOffset);
  }

  if (insertPositions.size > 0) {
    const sortedPositions = [...insertPositions].sort((a, b) => b - a);
    let updated = original;
    for (const pos of sortedPositions) {
      updated = `${updated.slice(0, pos)}?${updated.slice(pos)}`;
      appliedFixes += 1;
    }

    if (updated !== original) {
      fs.writeFileSync(filePath, updated, "utf8");
      updatedFiles.push(filePath);
    }
  }
}

console.log(`TS2532 locations: ${totalErrors}`);
console.log(`Applied optional chaining fixes: ${appliedFixes}`);
console.log(`Files updated: ${updatedFiles.length}`);

if (skipped.length) {
  console.log(`Skipped locations: ${skipped.length}`);
  const samples = skipped.slice(0, 20);
  for (const item of samples) {
    console.log(
      `- ${path.relative(process.cwd(), item.filePath)}:${item.lineNumber}:${item.colNumber} (${item.reason})`,
    );
  }
  if (skipped.length > samples.length) {
    console.log(`... ${skipped.length - samples.length} more skipped locations`);
  }
}
