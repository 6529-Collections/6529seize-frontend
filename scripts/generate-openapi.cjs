#!/usr/bin/env node

require("./require-6529-command.cjs");

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const generatedDir = path.join(repoRoot, "generated");
const tmpGeneratorDir = path.join(repoRoot, "tmp_gen_outp");
const tmpFinalDir = path.join(repoRoot, "tmp_gen_final");
const backupDir = path.join(
  repoRoot,
  `.generated-backup-${process.pid}-${Date.now()}`
);

function removePath(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function exitCodeFor(error) {
  if (error && typeof error === "object" && "exitCode" in error) {
    const exitCode = Number(error.exitCode);
    if (Number.isInteger(exitCode) && exitCode > 0) {
      return exitCode;
    }
  }

  return 1;
}

function removePathBestEffort(targetPath, description) {
  try {
    removePath(targetPath);
  } catch (error) {
    console.warn(
      `Warning: failed to remove ${description}: ${errorMessage(error)}`
    );
  }
}

function assertDirectory(targetPath, description) {
  let stats;
  try {
    stats = fs.statSync(targetPath);
  } catch {
    throw new Error(`Missing ${description}: ${targetPath}`);
  }

  if (!stats.isDirectory()) {
    throw new Error(`${description} is not a directory: ${targetPath}`);
  }
}

function addTsNoCheck(rootDir) {
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const entryPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      addTsNoCheck(entryPath);
      continue;
    }

    if (!entry.isFile() || !/\.(ts|tsx)$/.test(entry.name)) {
      continue;
    }

    const original = fs.readFileSync(entryPath, "utf8");
    const normalized = original.replace(/\r\n?/g, "\n");
    const content = normalized.startsWith("// @ts-nocheck\n")
      ? normalized
      : `// @ts-nocheck\n${normalized}`;

    if (content !== original) {
      fs.writeFileSync(entryPath, content, "utf8");
    }
  }
}

function removeUnusedHttpFileImports(rootDir) {
  const importLine = "import { HttpFile } from '../http/http';";

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const entryPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      removeUnusedHttpFileImports(entryPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".ts")) {
      continue;
    }

    const content = fs.readFileSync(entryPath, "utf8");

    if (!content.includes(importLine)) {
      continue;
    }

    const withoutImport = content.replace(`${importLine}\n`, "");

    if (/\bHttpFile\b/.test(withoutImport)) {
      continue;
    }

    fs.writeFileSync(entryPath, withoutImport, "utf8");
  }
}

function isPureEnumModel(modelsDir, modelName) {
  const modelPath = path.join(modelsDir, `${modelName}.ts`);

  if (!fs.existsSync(modelPath)) {
    return false;
  }

  const content = fs.readFileSync(modelPath, "utf8");

  return (
    new RegExp(`export enum ${modelName}\\b`).test(content) &&
    !/\bexport (class|interface) \b/.test(content)
  );
}

function removeObjectSerializerPureEnumImports(modelsDir) {
  const objectSerializerPath = path.join(modelsDir, "ObjectSerializer.ts");

  if (!fs.existsSync(objectSerializerPath)) {
    return;
  }

  const content = fs.readFileSync(objectSerializerPath, "utf8");
  const updated = content
    .split("\n")
    .filter((line) => {
      const match = line.match(
        /^import \{ ([A-Za-z0-9_]+) \} from '\.\.\/models\/\1';$/
      );

      return !match || !isPureEnumModel(modelsDir, match[1]);
    })
    .join("\n");

  if (updated !== content) {
    fs.writeFileSync(objectSerializerPath, updated, "utf8");
  }
}

function replaceGeneratedDir() {
  const hadGeneratedDir = fs.existsSync(generatedDir);

  if (hadGeneratedDir) {
    fs.renameSync(generatedDir, backupDir);
  }

  try {
    fs.renameSync(tmpFinalDir, generatedDir);
  } catch (error) {
    if (hadGeneratedDir && !fs.existsSync(generatedDir)) {
      try {
        fs.renameSync(backupDir, generatedDir);
      } catch (restoreError) {
        throw new Error(
          `Failed to restore previous generated directory: ${errorMessage(
            restoreError
          )}`,
          { cause: error }
        );
      }
    }
    throw error;
  }

  if (hadGeneratedDir) {
    removePathBestEffort(backupDir, "generated backup directory");
  }
}

function runGenerator() {
  const generatorMain = path.join(
    "node_modules",
    "@openapitools",
    "openapi-generator-cli",
    "main"
  );

  const result = spawnSync(
    process.execPath,
    [
      generatorMain,
      "generate",
      "-i",
      "openapi.yaml",
      "-g",
      "typescript",
      "-o",
      "tmp_gen_outp",
      "--additional-properties=modelPropertyNaming=snake_case",
    ],
    {
      cwd: repoRoot,
      stdio: "inherit",
      shell: false,
    }
  );

  if (result.error) {
    throw result.error;
  }

  if (result.signal) {
    throw new Error(`OpenAPI generator terminated by signal ${result.signal}`);
  }

  if (result.status !== 0) {
    const error = new Error(
      `OpenAPI generator exited with status ${result.status ?? 1}`
    );
    error.exitCode = result.status ?? 1;
    throw error;
  }
}

try {
  removePath(tmpGeneratorDir);
  removePath(tmpFinalDir);
  removePath(backupDir);

  runGenerator();

  const generatedModelsDir = path.join(tmpGeneratorDir, "models");
  assertDirectory(generatedModelsDir, "generated models directory");

  fs.mkdirSync(tmpFinalDir, { recursive: true });
  fs.renameSync(generatedModelsDir, path.join(tmpFinalDir, "models"));

  const httpDir = path.join(tmpFinalDir, "http");
  fs.mkdirSync(httpDir, { recursive: true });
  fs.writeFileSync(
    path.join(httpDir, "http.ts"),
    "export type HttpFile = any;\n",
    "utf8"
  );

  removePath(path.join(tmpFinalDir, "models", "all.ts"));
  addTsNoCheck(tmpFinalDir);
  removeUnusedHttpFileImports(tmpFinalDir);
  removeObjectSerializerPureEnumImports(path.join(tmpFinalDir, "models"));
  replaceGeneratedDir();

  removePath(tmpGeneratorDir);
} catch (error) {
  console.error(errorMessage(error));
  process.exitCode = exitCodeFor(error);
} finally {
  removePathBestEffort(tmpGeneratorDir, "OpenAPI generator output directory");
  removePathBestEffort(tmpFinalDir, "OpenAPI final staging directory");
  if (fs.existsSync(generatedDir)) {
    removePathBestEffort(backupDir, "generated backup directory");
  }
}
