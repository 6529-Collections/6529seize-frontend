#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const argv = process.argv.slice(2);
const write = argv.includes("--write");
const includeDts = argv.includes("--include-dts");
const allIndices = argv.includes("--all-indices");

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

  return {
    fileNames: parsed.fileNames,
    options: parsed.options,
  };
}

function shouldProcessFile(filePath) {
  if (filePath.endsWith(".d.ts") && !includeDts) {
    return false;
  }
  return filePath.endsWith(".ts") || filePath.endsWith(".tsx");
}

function typeIncludesUndefined(type) {
  if (!type) {
    return false;
  }

  if (type.flags & ts.TypeFlags.Undefined) {
    return true;
  }

  if (type.isUnion()) {
    return type.types.some(typeIncludesUndefined);
  }

  return false;
}

function isNumericIndex(node) {
  if (!node) {
    return false;
  }

  if (ts.isNumericLiteral(node)) {
    return true;
  }

  if (
    ts.isPrefixUnaryExpression(node) &&
    (node.operator === ts.SyntaxKind.PlusToken ||
      node.operator === ts.SyntaxKind.MinusToken) &&
    ts.isNumericLiteral(node.operand)
  ) {
    return true;
  }

  return false;
}

function isOptionalChainNode(node) {
  return (
    ts.isPropertyAccessChain(node) ||
    ts.isElementAccessChain(node) ||
    ts.isCallChain(node)
  );
}

function isValidParent(node) {
  if (!node) {
    return false;
  }

  if (ts.isNonNullExpression(node)) {
    return false;
  }

  if (ts.isPropertyAccessExpression(node)) {
    return true;
  }

  if (ts.isElementAccessExpression(node)) {
    return true;
  }

  if (ts.isCallExpression(node)) {
    return true;
  }

  if (ts.isTaggedTemplateExpression(node)) {
    return true;
  }

  return false;
}

function applyEdits(text, edits) {
  const sorted = edits.slice().sort((a, b) => b.start - a.start);
  let output = text;
  for (const edit of sorted) {
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  }
  return output;
}

function collectEdits(sourceFile, checker) {
  const edits = [];
  let changeCount = 0;
  let skippedOptionalChain = 0;
  let skippedNonIndex = 0;
  let skippedAnyUnknown = 0;
  let skippedNoUndefined = 0;
  let skippedNonContext = 0;

  function shouldAddNonNull(node) {
    const parent = node.parent;
    if (!isValidParent(parent)) {
      skippedNonContext += 1;
      return false;
    }

    if (isOptionalChainNode(parent)) {
      skippedOptionalChain += 1;
      return false;
    }

    if (!allIndices && !isNumericIndex(node.argumentExpression)) {
      skippedNonIndex += 1;
      return false;
    }

    const type = checker.getTypeAtLocation(node);
    if (!type) {
      skippedAnyUnknown += 1;
      return false;
    }

    if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
      skippedAnyUnknown += 1;
      return false;
    }

    if (!typeIncludesUndefined(type)) {
      skippedNoUndefined += 1;
      return false;
    }

    return true;
  }

  function visit(node) {
    if (ts.isElementAccessExpression(node)) {
      if (shouldAddNonNull(node)) {
        const end = node.getEnd();
        edits.push({ start: end, end, text: "!" });
        changeCount += 1;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return {
    edits,
    changeCount,
    skippedOptionalChain,
    skippedNonIndex,
    skippedAnyUnknown,
    skippedNoUndefined,
    skippedNonContext,
  };
}

function run() {
  const { fileNames, options } = readProjectConfig(projectPath);
  const program = ts.createProgram({
    rootNames: fileNames,
    options,
  });
  const checker = program.getTypeChecker();

  let totalChanges = 0;
  let skippedOptionalChain = 0;
  let skippedNonIndex = 0;
  let skippedAnyUnknown = 0;
  let skippedNoUndefined = 0;
  let skippedNonContext = 0;
  let filesTouched = 0;

  for (const filePath of fileNames) {
    if (!shouldProcessFile(filePath)) {
      continue;
    }

    const sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) {
      continue;
    }

    const sourceText = sourceFile.getFullText();
    const {
      edits,
      changeCount,
      skippedOptionalChain: soc,
      skippedNonIndex: sni,
      skippedAnyUnknown: sau,
      skippedNoUndefined: snd,
      skippedNonContext: snc,
    } = collectEdits(sourceFile, checker);

    totalChanges += changeCount;
    skippedOptionalChain += soc;
    skippedNonIndex += sni;
    skippedAnyUnknown += sau;
    skippedNoUndefined += snd;
    skippedNonContext += snc;

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
        skippedOptionalChain,
        skippedNonIndex,
        skippedAnyUnknown,
        skippedNoUndefined,
        skippedNonContext,
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
