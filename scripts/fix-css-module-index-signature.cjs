"use strict";

const fs = require("fs");
const path = require("path");
const { Project, Node, SyntaxKind } = require("ts-morph");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const tsConfigPath = path.resolve(process.cwd(), "tsconfig.json");

const project = new Project({
  tsConfigFilePath: tsConfigPath,
  skipFileDependencyResolution: true,
});

const diagnostics = project
  .getPreEmitDiagnostics()
  .filter((diagnostic) => diagnostic.getCode() === 4111);

const findPropertyAccessNode = (sourceFile, position) => {
  let current = sourceFile.getDescendantAtPos(position);
  while (current) {
    const kind = current.getKind();
    if (
      kind === SyntaxKind.PropertyAccessExpression ||
      kind === SyntaxKind.PropertyAccessChain ||
      kind === SyntaxKind.SuperPropertyAccessExpression
    ) {
      return current;
    }
    current = current.getParent();
  }
  return null;
};

const replacementsByFile = new Map();

for (const diagnostic of diagnostics) {
  const sourceFile = diagnostic.getSourceFile();
  if (!sourceFile) {
    continue;
  }

  const start = diagnostic.getStart();
  if (start == null) {
    continue;
  }

  const propertyAccess = findPropertyAccessNode(sourceFile, start);
  if (!propertyAccess) {
    continue;
  }

  const expression = propertyAccess.getExpression();
  const nameNode = propertyAccess.getNameNode?.();
  if (!nameNode) {
    continue;
  }

  const replaceStart = expression.getEnd();
  const replaceEnd = nameNode.getEnd();
  if (replaceStart >= replaceEnd) {
    continue;
  }

  const name = propertyAccess.getName();
  const optionalPrefix = propertyAccess.hasQuestionDotToken() ? "?.[" : "[";
  const replacement = `${optionalPrefix}${JSON.stringify(name)}]`;

  const filePath = sourceFile.getFilePath();
  if (!replacementsByFile.has(filePath)) {
    replacementsByFile.set(filePath, []);
  }

  replacementsByFile.get(filePath).push({
    start: replaceStart,
    end: replaceEnd,
    replacement,
  });
}

let totalChanges = 0;
let filesTouched = 0;

for (const [filePath, replacements] of replacementsByFile.entries()) {
  const originalText = fs.readFileSync(filePath, "utf8");

  const deduped = [];
  const seen = new Set();
  for (const replacement of replacements) {
    const key = `${replacement.start}:${replacement.end}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(replacement);
  }

  if (deduped.length === 0) {
    continue;
  }

  deduped.sort((a, b) => b.start - a.start);

  let updatedText = originalText;
  for (const { start, end, replacement } of deduped) {
    updatedText =
      updatedText.slice(0, start) + replacement + updatedText.slice(end);
  }

  if (updatedText !== originalText) {
    totalChanges += deduped.length;
    filesTouched += 1;
    if (!dryRun) {
      fs.writeFileSync(filePath, updatedText, "utf8");
    }
  }
}

const modeLabel = dryRun ? "Dry run: " : "";
console.log(`Found ${diagnostics.length} TS4111 diagnostics.`);
console.log(
  `${modeLabel}updated ${totalChanges} property access${
    totalChanges === 1 ? "" : "es"
  } across ${filesTouched} file${filesTouched === 1 ? "" : "s"}.`
);

if (dryRun) {
  console.log("Dry run: no files written. Re-run without --dry-run to apply.");
}
