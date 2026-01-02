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

function isRepeatableExpression(node) {
  if (!node) {
    return false;
  }

  if (ts.isIdentifier(node) || node.kind === ts.SyntaxKind.ThisKeyword) {
    return true;
  }

  if (ts.isParenthesizedExpression(node)) {
    return isRepeatableExpression(node.expression);
  }

  if (ts.isPropertyAccessExpression(node)) {
    return isRepeatableExpression(node.expression);
  }

  return false;
}

function getPropertyName(nameNode) {
  if (!nameNode) {
    return null;
  }

  if (ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode)) {
    return nameNode.text;
  }

  return null;
}

function getPropertyText(nameNode, sourceFile) {
  if (!nameNode) {
    return null;
  }
  return nameNode.getText(sourceFile);
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
  let skippedUnion = 0;
  let skippedNonRepeatable = 0;
  let skippedNoContext = 0;

  const sourceText = sourceFile.getFullText();

  function getObjectTypesFromContextual(contextualType) {
    const types = contextualType.isUnion() ? contextualType.types : [contextualType];
    const objectTypes = [];
    let hasNonObject = false;

    for (const type of types) {
      if (
        type.flags &
        (ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Never | ts.TypeFlags.Void)
      ) {
        continue;
      }

      const apparent = checker.getApparentType(type);
      if (apparent.flags & ts.TypeFlags.Object) {
        objectTypes.push(apparent);
      } else {
        hasNonObject = true;
      }
    }

    return { objectTypes, hasNonObject };
  }

  function handleObjectLiteral(arg, contextualType) {
    if (!contextualType) {
      skippedNoContext += 1;
      return;
    }

    const { objectTypes, hasNonObject } = getObjectTypesFromContextual(
      contextualType
    );
    if (objectTypes.length === 0 || hasNonObject) {
      skippedUnion += 1;
      return;
    }

    for (const prop of arg.properties) {
      if (ts.isSpreadAssignment(prop)) {
        continue;
      }

      let nameNode = null;
      let initializer = null;

      if (ts.isShorthandPropertyAssignment(prop)) {
        nameNode = prop.name;
        initializer = prop.name;
      } else if (ts.isPropertyAssignment(prop)) {
        if (prop.questionToken || prop.initializer === undefined) {
          continue;
        }
        nameNode = prop.name;
        initializer = prop.initializer;
      } else {
        continue;
      }

      const propName = getPropertyName(nameNode);
      const propText = getPropertyText(nameNode, sourceFile);
      if (!propName || !propText) {
        continue;
      }

      if (!initializer || !isRepeatableExpression(initializer)) {
        skippedNonRepeatable += 1;
        continue;
      }

      let isOptionalEverywhere = true;
      let hasPropertyEverywhere = true;
      let propertyAllowsUndefined = false;

      for (const objectType of objectTypes) {
        const propertySymbol = checker.getPropertyOfType(objectType, propName);
        if (!propertySymbol) {
          hasPropertyEverywhere = false;
          break;
        }

        const isOptional =
          (propertySymbol.getFlags() & ts.SymbolFlags.Optional) !== 0;
        if (!isOptional) {
          isOptionalEverywhere = false;
          break;
        }

        const propertyType = checker.getTypeOfSymbolAtLocation(
          propertySymbol,
          prop
        );
        if (typeIncludesUndefined(propertyType)) {
          propertyAllowsUndefined = true;
          break;
        }
      }

      if (!hasPropertyEverywhere || !isOptionalEverywhere) {
        continue;
      }

      if (propertyAllowsUndefined) {
        continue;
      }

      const initializerType = checker.getTypeAtLocation(initializer);
      if (
        initializerType.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)
      ) {
        continue;
      }

      if (!typeIncludesUndefined(initializerType)) {
        continue;
      }

      const initializerText = sourceText.slice(
        initializer.getStart(sourceFile),
        initializer.getEnd()
      );

      const replacement = `...(${initializerText} !== undefined ? { ${propText}: ${initializerText} } : {})`;
      edits.push({
        start: prop.getStart(sourceFile),
        end: prop.getEnd(),
        text: replacement,
      });
      changeCount += 1;
    }
  }

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const signature = checker.getResolvedSignature(node);
      if (signature) {
        const args = node.arguments;
        const params = signature.getParameters();
        const restType = signature.hasRestParameter
          ? checker.getRestTypeOfSignature(signature)
          : null;

        for (let i = 0; i < args.length; i += 1) {
          const arg = args[i];
          if (!ts.isObjectLiteralExpression(arg)) {
            continue;
          }

          let contextualType = checker.getContextualType(arg);
          if (!contextualType) {
            if (i < params.length) {
              contextualType = checker.getTypeOfSymbolAtLocation(
                params[i],
                arg
              );
            } else if (restType) {
              contextualType = restType;
            }
          }

          handleObjectLiteral(arg, contextualType);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return {
    edits,
    changeCount,
    skippedUnion,
    skippedNonRepeatable,
    skippedNoContext,
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
  let skippedUnion = 0;
  let skippedNonRepeatable = 0;
  let skippedNoContext = 0;
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
    const { edits, changeCount, skippedUnion: su, skippedNonRepeatable: snr, skippedNoContext: snc } =
      collectEdits(sourceFile, checker);

    totalChanges += changeCount;
    skippedUnion += su;
    skippedNonRepeatable += snr;
    skippedNoContext += snc;

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
        skippedUnion,
        skippedNonRepeatable,
        skippedNoContext,
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
