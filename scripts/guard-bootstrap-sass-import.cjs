#!/usr/bin/env node

const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const repoRoot = resolve(__dirname, "..");
const bootstrapScssPath = resolve(repoRoot, "styles/seize-bootstrap.scss");
const nextConfigPath = resolve(repoRoot, "config/nextConfig.ts");

function readRequiredFile(filePath) {
  try {
    return readFileSync(filePath, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to read ${filePath}: ${message}`);
    process.exit(1);
  }
}

function isQuote(char) {
  return char === '"' || char === "'" || char === "`";
}

function readQuotedString(source, startIndex) {
  const quote = source[startIndex];
  let text = quote;
  let index = startIndex + 1;

  while (index < source.length) {
    const char = source[index];
    text += char;

    if (char === "\\" && index + 1 < source.length) {
      text += source[index + 1];
      index += 2;
      continue;
    }

    index += 1;

    if (char === quote) {
      break;
    }
  }

  return { text, nextIndex: index };
}

function readLineCommentReplacement(source, startIndex) {
  let index = startIndex + 2;

  while (index < source.length && source[index] !== "\n") {
    index += 1;
  }

  return {
    text: index < source.length ? "\n" : "",
    nextIndex: index < source.length ? index + 1 : index,
  };
}

function readBlockCommentReplacement(source, startIndex) {
  let index = startIndex + 2;
  let text = "";

  while (
    index < source.length &&
    !(source[index] === "*" && source[index + 1] === "/")
  ) {
    if (source[index] === "\n") {
      text += "\n";
    }
    index += 1;
  }

  return {
    text,
    nextIndex: index < source.length ? index + 2 : index,
  };
}

function stripComments(source) {
  let result = "";
  let index = 0;

  while (index < source.length) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (isQuote(char)) {
      const quoted = readQuotedString(source, index);
      result += quoted.text;
      index = quoted.nextIndex;
      continue;
    }

    if (char === "/" && nextChar === "/") {
      const comment = readLineCommentReplacement(source, index);
      result += comment.text;
      index = comment.nextIndex;
      continue;
    }

    if (char === "/" && nextChar === "*") {
      const comment = readBlockCommentReplacement(source, index);
      result += comment.text;
      index = comment.nextIndex;
      continue;
    }

    result += char;
    index += 1;
  }

  return result;
}

function getSassImportStatements(source) {
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("@use ") || line.startsWith("@import "));
}

function hasBootstrapPackageUse(source) {
  return getSassImportStatements(source).some(
    (line) =>
      line.startsWith('@use "bootstrap/scss/bootstrap"') ||
      line.startsWith("@use 'bootstrap/scss/bootstrap'")
  );
}

function hasNodeModulesBootstrapStatement(source) {
  return getSassImportStatements(source).some((line) =>
    line.includes("node_modules/bootstrap/scss/bootstrap")
  );
}

const bootstrapScss = stripComments(readRequiredFile(bootstrapScssPath));
const nextConfig = stripComments(readRequiredFile(nextConfigPath));
const failures = [];

if (!hasBootstrapPackageUse(bootstrapScss)) {
  failures.push(
    `${bootstrapScssPath} must import Bootstrap with @use "bootstrap/scss/bootstrap".`
  );
}

if (hasNodeModulesBootstrapStatement(bootstrapScss)) {
  failures.push(
    `${bootstrapScssPath} must not import Bootstrap through a node_modules path.`
  );
}

if (
  !nextConfig.includes("const SASS_LOAD_PATHS") ||
  !nextConfig.includes('"node_modules"')
) {
  failures.push(
    `${nextConfigPath} must keep SASS_LOAD_PATHS pointed at node_modules.`
  );
}

const sassOptionsUsesLoadPaths =
  nextConfig.includes("sassOptions:") &&
  nextConfig.includes("loadPaths: SASS_LOAD_PATHS");
const sassOptionsUsesQuietDeps =
  nextConfig.includes("sassOptions:") && nextConfig.includes("quietDeps: true");

if (!sassOptionsUsesLoadPaths || !sassOptionsUsesQuietDeps) {
  failures.push(
    `${nextConfigPath} must keep sassOptions.loadPaths and quietDeps enabled.`
  );
}

if (failures.length > 0) {
  console.error("Bootstrap Sass import guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Bootstrap Sass import guard passed.");
