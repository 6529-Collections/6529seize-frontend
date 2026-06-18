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

const bootstrapScss = stripComments(readRequiredFile(bootstrapScssPath));
const nextConfig = stripComments(readRequiredFile(nextConfigPath));
const failures = [];

if (!/(^|\n)\s*@use\s+["']bootstrap\/scss\/bootstrap["']/.test(bootstrapScss)) {
  failures.push(
    `${bootstrapScssPath} must import Bootstrap with @use "bootstrap/scss/bootstrap".`
  );
}

if (
  /(^|\n)\s*@(use|import)\s+["'][^"']*node_modules\/bootstrap\/scss\/bootstrap["']/.test(
    bootstrapScss
  )
) {
  failures.push(
    `${bootstrapScssPath} must not import Bootstrap through a node_modules path.`
  );
}

if (!/const\s+SASS_LOAD_PATHS\s*=\s*\[[\s\S]*node_modules/.test(nextConfig)) {
  failures.push(
    `${nextConfigPath} must keep SASS_LOAD_PATHS pointed at node_modules.`
  );
}

const sassOptionsUsesLoadPaths =
  /\bsassOptions\s*:/.test(nextConfig) &&
  /\bloadPaths\s*:\s*SASS_LOAD_PATHS\b/.test(nextConfig);
const sassOptionsUsesQuietDeps =
  /\bsassOptions\s*:/.test(nextConfig) &&
  /\bquietDeps\s*:\s*true\b/.test(nextConfig);

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
