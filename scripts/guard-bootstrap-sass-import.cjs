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

function stripComments(source) {
  let result = "";
  let quote = null;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (quote !== null) {
      result += char;

      if (char === "\\" && nextChar !== undefined) {
        result += nextChar;
        index += 1;
        continue;
      }

      if (char === quote) {
        quote = null;
      }

      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      result += char;
      continue;
    }

    if (char === "/" && nextChar === "/") {
      while (index < source.length && source[index] !== "\n") {
        index += 1;
      }

      if (index < source.length) {
        result += "\n";
      }

      continue;
    }

    if (char === "/" && nextChar === "*") {
      index += 2;

      while (
        index < source.length &&
        !(source[index] === "*" && source[index + 1] === "/")
      ) {
        if (source[index] === "\n") {
          result += "\n";
        }
        index += 1;
      }

      index += 1;
      continue;
    }

    result += char;
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
