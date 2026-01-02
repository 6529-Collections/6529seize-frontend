"use strict";

const path = require("path");
const { Project, Node, SyntaxKind } = require("ts-morph");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const tsConfigPath = path.resolve(process.cwd(), "tsconfig.json");

const project = new Project({
  tsConfigFilePath: tsConfigPath,
  skipFileDependencyResolution: true,
});

const cssModuleExtensions = [
  ".module.css",
  ".module.scss",
  ".module.sass",
];

const isCssModuleSpecifier = (specifier) =>
  cssModuleExtensions.some((ext) => specifier.endsWith(ext));

const collectCssModuleSymbols = (sourceFile) => {
  const symbols = new Set();

  for (const importDecl of sourceFile.getImportDeclarations()) {
    const specifier = importDecl.getModuleSpecifierValue();
    if (!isCssModuleSpecifier(specifier)) {
      continue;
    }

    const defaultImport = importDecl.getDefaultImport();
    if (defaultImport) {
      const symbol = defaultImport.getSymbol();
      if (symbol) {
        symbols.add(symbol);
        const aliased = symbol.getAliasedSymbol();
        if (aliased) {
          symbols.add(aliased);
        }
      }
    }

    const namespaceImport = importDecl.getNamespaceImport();
    if (namespaceImport) {
      const symbol = namespaceImport.getSymbol();
      if (symbol) {
        symbols.add(symbol);
        const aliased = symbol.getAliasedSymbol();
        if (aliased) {
          symbols.add(aliased);
        }
      }
    }
  }

  return symbols;
};

const isCssModuleIdentifier = (identifier, cssModuleSymbols) => {
  const symbol = identifier.getSymbol();
  if (!symbol) {
    return false;
  }

  if (cssModuleSymbols.has(symbol)) {
    return true;
  }

  const aliased = symbol.getAliasedSymbol();
  return aliased ? cssModuleSymbols.has(aliased) : false;
};

let totalChanges = 0;
let filesTouched = 0;

for (const sourceFile of project.getSourceFiles()) {
  const filePath = sourceFile.getFilePath();
  if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx")) {
    continue;
  }

  const cssModuleSymbols = collectCssModuleSymbols(sourceFile);
  if (cssModuleSymbols.size === 0) {
    continue;
  }

  const replacements = [];

  sourceFile.forEachDescendant((node) => {
    const kind = node.getKind();
    const isPropertyAccess =
      kind === SyntaxKind.PropertyAccessExpression ||
      kind === SyntaxKind.PropertyAccessChain;

    if (!isPropertyAccess) {
      return;
    }

    const propertyAccess = node;
    const expression = propertyAccess.getExpression();
    if (!Node.isIdentifier(expression)) {
      return;
    }

    if (!isCssModuleIdentifier(expression, cssModuleSymbols)) {
      return;
    }

    const name = propertyAccess.getName();
    if (!name) {
      return;
    }

    const expressionText = expression.getText();
    const isOptional = kind === SyntaxKind.PropertyAccessChain;
    const replacement = isOptional
      ? `${expressionText}?.[${JSON.stringify(name)}]`
      : `${expressionText}[${JSON.stringify(name)}]`;

    replacements.push({ node: propertyAccess, replacement });
  });

  if (replacements.length === 0) {
    continue;
  }

  replacements.sort((a, b) => b.node.getStart() - a.node.getStart());
  for (const { node, replacement } of replacements) {
    node.replaceWithText(replacement);
  }

  totalChanges += replacements.length;
  filesTouched += 1;

  if (!dryRun) {
    sourceFile.saveSync();
  }
}

const modeLabel = dryRun ? "Dry run: " : "";
console.log(
  `${modeLabel}updated ${totalChanges} property access${
    totalChanges === 1 ? "" : "es"
  } across ${filesTouched} file${filesTouched === 1 ? "" : "s"}.`
);

if (dryRun) {
  console.log("Dry run: no files written. Re-run without --dry-run to apply.");
}
