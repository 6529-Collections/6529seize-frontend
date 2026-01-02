#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const argv = process.argv.slice(2);
const write = argv.includes("--write");
const includeDts = argv.includes("--include-dts");

const projectFlagIndex = argv.findIndex((arg) => arg === "--project" || arg === "-p");
const projectPath =
  projectFlagIndex >= 0 && argv[projectFlagIndex + 1]
    ? argv[projectFlagIndex + 1]
    : "tsconfig.json";

function formatDiagnostics(diagnostics) {
  const host = {
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => "\n",
  };
  return ts.formatDiagnostics(diagnostics, host);
}

function readProjectConfig(configPath) {
  const resolvedPath = path.resolve(configPath);
  const configFile = ts.readConfigFile(resolvedPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(formatDiagnostics([configFile.error]));
  }

  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(resolvedPath),
    undefined,
    resolvedPath
  );

  if (parsed.errors && parsed.errors.length > 0) {
    throw new Error(formatDiagnostics(parsed.errors));
  }

  return parsed.fileNames;
}

function hasUndefinedType(typeNode) {
  if (!typeNode) {
    return false;
  }

  if (typeNode.kind === ts.SyntaxKind.UndefinedKeyword) {
    return true;
  }

  if (ts.isUnionTypeNode(typeNode)) {
    return typeNode.types.some(hasUndefinedType);
  }

  if (ts.isParenthesizedTypeNode(typeNode)) {
    return hasUndefinedType(typeNode.type);
  }

  return false;
}

function collectEdits(sourceFile) {
  const edits = [];
  let changeCount = 0;
  let skippedNoType = 0;

  function maybeRewrite(node) {
    if (
      (ts.isPropertySignature(node) || ts.isPropertyDeclaration(node)) &&
      node.questionToken
    ) {
      if (!node.type) {
        skippedNoType += 1;
        return;
      }

      if (hasUndefinedType(node.type)) {
        changeCount += 1;
        return;
      }

      edits.push({
        start: node.type.getEnd(),
        end: node.type.getEnd(),
        text: " | undefined",
      });
      changeCount += 1;
    }
  }

  function visit(node) {
    maybeRewrite(node);
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return { edits, changeCount, skippedNoType };
}

function applyEdits(text, edits) {
  const sorted = edits.slice().sort((a, b) => b.start - a.start);
  let output = text;
  for (const edit of sorted) {
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  }
  return output;
}

function shouldProcessFile(filePath) {
  if (filePath.endsWith(".d.ts") && !includeDts) {
    return false;
  }

  return filePath.endsWith(".ts") || filePath.endsWith(".tsx");
}

function run() {
  const files = readProjectConfig(projectPath);

  let totalChanges = 0;
  let totalSkipped = 0;
  let filesTouched = 0;

  for (const filePath of files) {
    if (!shouldProcessFile(filePath)) {
      continue;
    }

    const sourceText = fs.readFileSync(filePath, "utf8");
    const scriptKind = filePath.endsWith(".tsx")
      ? ts.ScriptKind.TSX
      : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      scriptKind
    );

    const { edits, changeCount, skippedNoType } = collectEdits(sourceFile);
    totalChanges += changeCount;
    totalSkipped += skippedNoType;

    if (edits.length === 0) {
      continue;
    }

    const outputText = applyEdits(sourceText, edits);
    if (outputText !== sourceText) {
      filesTouched += 1;
      if (write) {
        fs.writeFileSync(filePath, outputText, "utf8");
      }
    }
  }

  const mode = write ? "write" : "dry-run";
  console.log(
    JSON.stringify(
      {
        mode,
        project: path.resolve(projectPath),
        filesTouched,
        totalChanges,
        skippedNoType: totalSkipped,
      },
      null,
      2
    )
  );
}

try {
  run();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
