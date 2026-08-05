#!/usr/bin/env node
"use strict";

const { execFileSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const CONTRACT = "museum-release-classification-v1";
const MODE = "report_only";
const SHA_PATTERN = /^[a-f0-9]{40}$/u;
const TIER_ORDER = Object.freeze({ NONE: 0, P0: 1, P1: 2, P2: 3, P3: 4 });
const LEAF_PRESENTATION_COMPONENTS = Object.freeze({
  "components/museum/MuseumNetworkProposition.tsx": {
    surface_ids: ["museum.about.proposition"],
    test_paths: [
      "__tests__/components/museum/MuseumNetworkProposition.test.tsx",
    ],
  },
});
const MUSEUM_PREFIXES = Object.freeze([
  "app/museum/network/",
  "components/museum/",
  "lib/museum/",
  "tests/museum/",
  "__tests__/app/museum/network/",
  "__tests__/components/museum/",
  "__tests__/lib/museum/",
  "public/museum/",
]);
const MUSEUM_FILES = new Set([
  "config/museumPublicationEnv.server.ts",
  "i18n/messages/museum.en-US.json",
  "styles/museum.css",
]);
const POLICY_PATTERNS = Object.freeze([
  /^\.github\/workflows\//u,
  /^ops\/deployment-bus\//u,
  /^ops\/testing-strategy\/museum-/u,
  /^ops\/scripts\/(?:deployment-bus|release-bus|testing-strategy)/u,
  /^scripts\/(?:app-pr-ci-effective-plan|e2e-packs|museum-|pr-ci-policy-bundle|release-bus-|sync-e2e-manifest)/u,
  /^tests\/packs\.manifest\.cjs$/u,
  /^__tests__\/scripts\/(?:app-pr-ci-effective-plan|e2e-packs|museum-|pr-ci-policy-bundle|release-bus-|sync-e2e-manifest)/u,
  /^(?:package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml)$/u,
]);
const INTEGRITY_PATTERNS = Object.freeze([
  /^lib\/museum\/publication\//u,
  /^lib\/museum\/(?:source|normalize)\.ts$/u,
  /^config\/museumPublicationEnv\.server\.ts$/u,
  /^app\/museum\/network\/layout\.tsx$/u,
  /^components\/museum\/(?:MuseumMarkdown|MuseumShell|MuseumNavigation|MuseumSourceContribution)\.tsx$/u,
]);
const P1_PATTERNS = Object.freeze([
  /^i18n\/messages\/museum\.en-US\.json$/u,
  /^styles\/museum\.css$/u,
  /^public\/museum\/.+\.(?:avif|gif|jpe?g|png|webp)$/iu,
]);
const BANNED_PRESENTATION_TOKENS = Object.freeze([
  /(?:^|:)tw-(?:hidden|invisible|sr-only|pointer-events-none|select-none)(?:$|:)/u,
  /(?:^|:)tw-(?:absolute|fixed|sticky)(?:$|:)/u,
  /(?:^|:)tw-(?:content-|\[|bg-\[url)/u,
  /(?:^|:)tw-opacity-0(?:$|:)/u,
]);

function normalizePath(value) {
  return String(value).replaceAll("\\", "/");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function isMuseumPath(file) {
  const normalized = normalizePath(file);
  return (
    MUSEUM_FILES.has(normalized) ||
    MUSEUM_PREFIXES.some((prefix) => normalized.startsWith(prefix))
  );
}

function isPolicyPath(file) {
  return POLICY_PATTERNS.some((pattern) => pattern.test(normalizePath(file)));
}

function resolveCommit(root, ref) {
  const resolved = execFileSync("git", ["rev-parse", `${ref}^{commit}`], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
  if (!SHA_PATTERN.test(resolved)) {
    throw new Error(`Unable to resolve an exact commit for ${ref}.`);
  }
  return resolved;
}

function readChangedEntries(root, baseSha, headSha) {
  const output = execFileSync(
    "git",
    ["diff", "--name-status", "-z", "--no-renames", baseSha, headSha, "--"],
    {
      cwd: root,
      encoding: "buffer",
      maxBuffer: 16 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  const fields = output.toString("utf8").split("\0").filter(Boolean);
  if (fields.length % 2 !== 0) {
    throw new Error("Git returned a malformed name-status stream.");
  }
  const entries = [];
  for (let index = 0; index < fields.length; index += 2) {
    const status = fields[index];
    const file = normalizePath(fields[index + 1]);
    if (!/^[ACDMRTUXB][0-9]*$/u.test(status) || !file) {
      throw new Error("Git returned an unsupported change status.");
    }
    entries.push({ file, status });
  }
  return entries;
}

function readBlob(root, commit, file) {
  return execFileSync("git", ["show", `${commit}:${file}`], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function classNameRanges(source, file) {
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  if (sourceFile.parseDiagnostics.length > 0) {
    throw new Error(`TypeScript could not parse ${file}.`);
  }
  const ranges = [];
  const visit = (node) => {
    if (ts.isJsxAttribute(node) && node.name.text === "className") {
      const initializer = node.initializer;
      let literal = null;
      if (initializer && ts.isStringLiteral(initializer)) {
        literal = initializer;
      } else if (
        initializer &&
        ts.isJsxExpression(initializer) &&
        initializer.expression &&
        (ts.isStringLiteral(initializer.expression) ||
          ts.isNoSubstitutionTemplateLiteral(initializer.expression))
      ) {
        literal = initializer.expression;
      }
      if (literal === null) {
        throw new Error(
          `${file} contains a non-literal className and cannot enter P0.`
        );
      }
      ranges.push({
        end: literal.getEnd(),
        start: literal.getStart(sourceFile),
        value: literal.text,
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return ranges;
}

function maskRanges(source, ranges) {
  let result = source;
  for (const range of [...ranges].sort(
    (left, right) => right.start - left.start
  )) {
    result = `${result.slice(0, range.start)}"__MUSEUM_CLASSNAME__"${result.slice(range.end)}`;
  }
  return result.replaceAll("\r\n", "\n");
}

function presentationComponentProof(baseSource, headSource, file) {
  try {
    const baseRanges = classNameRanges(baseSource, file);
    const headRanges = classNameRanges(headSource, file);
    if (baseRanges.length === 0 || baseRanges.length !== headRanges.length) {
      return { eligible: false, reason: "className inventory changed" };
    }
    if (
      maskRanges(baseSource, baseRanges) !== maskRanges(headSource, headRanges)
    ) {
      return {
        eligible: false,
        reason: "syntax changed outside className literals",
      };
    }
    const changedValues = headRanges
      .map((range, index) => ({
        after: range.value,
        before: baseRanges[index].value,
      }))
      .filter(({ after, before }) => after !== before);
    if (changedValues.length === 0) {
      return { eligible: false, reason: "no className literal changed" };
    }
    for (const { after } of changedValues) {
      const tokens = after.split(/\s+/u).filter(Boolean);
      if (
        tokens.some((token) =>
          BANNED_PRESENTATION_TOKENS.some((pattern) => pattern.test(token))
        )
      ) {
        return {
          eligible: false,
          reason: "a changed className contains a restricted token",
        };
      }
    }
    return {
      changed_classname_literals: changedValues.length,
      eligible: true,
      reason: "only approved literal className values changed",
    };
  } catch (error) {
    return {
      eligible: false,
      reason:
        error instanceof Error ? error.message : "presentation proof failed",
    };
  }
}

function maxTier(left, right) {
  return TIER_ORDER[right] > TIER_ORDER[left] ? right : left;
}

function withClassificationDigest(classification) {
  return {
    ...classification,
    classification_digest: sha256(JSON.stringify(classification)),
  };
}

function classifyEntries(entries, { readFileAt }) {
  if (!Array.isArray(entries)) {
    throw new Error("Changed entries must be an array.");
  }
  if (entries.some(({ file }) => isPolicyPath(file))) {
    return {
      affected_surfaces: [],
      reason: "Release, classifier, workflow, or test-policy files changed.",
      tier: "P3",
    };
  }
  const museumEntries = entries.filter(({ file }) => isMuseumPath(file));
  if (museumEntries.length === 0) {
    return {
      affected_surfaces: [],
      reason: "No Museum-owned path changed.",
      tier: "NONE",
    };
  }
  if (
    museumEntries.some(({ file }) =>
      INTEGRITY_PATTERNS.some((pattern) => pattern.test(file))
    )
  ) {
    return {
      affected_surfaces: [],
      reason:
        "Museum publication, source-integrity, or shared-shell code changed.",
      tier: "P3",
    };
  }

  const componentEntries = museumEntries.filter(({ file }) =>
    Object.hasOwn(LEAF_PRESENTATION_COMPONENTS, file)
  );
  if (componentEntries.length === 1) {
    const componentEntry = componentEntries[0];
    const policy = LEAF_PRESENTATION_COMPONENTS[componentEntry.file];
    const allowed = new Set([componentEntry.file, ...policy.test_paths]);
    const onlyAllowedFiles = museumEntries.every(({ file }) =>
      allowed.has(file)
    );
    if (onlyAllowedFiles && componentEntry.status === "M") {
      let proof;
      try {
        proof = presentationComponentProof(
          readFileAt("base", componentEntry.file),
          readFileAt("head", componentEntry.file),
          componentEntry.file
        );
      } catch (error) {
        proof = {
          eligible: false,
          reason:
            error instanceof Error
              ? error.message
              : "presentation source could not be read",
        };
      }
      if (proof.eligible) {
        return {
          affected_surfaces: [...policy.surface_ids],
          presentation_proof: proof,
          reason: "Registered leaf presentation proof passed.",
          tier: "P0",
        };
      }
    }
  }

  let tier = "NONE";
  for (const { file } of museumEntries) {
    const fileTier = P1_PATTERNS.some((pattern) => pattern.test(file))
      ? "P1"
      : "P2";
    tier = maxTier(tier, fileTier);
  }
  return {
    affected_surfaces: [],
    reason:
      tier === "P1"
        ? "Museum copy, stylesheet, or raster presentation assets changed."
        : "Museum runtime or an unregistered presentation surface changed.",
    tier,
  };
}

function classifyRange(root, baseRef, headRef) {
  const base_sha = resolveCommit(root, baseRef);
  const head_sha = resolveCommit(root, headRef);
  const entries = readChangedEntries(root, base_sha, head_sha);
  const result = classifyEntries(entries, {
    readFileAt: (side, file) =>
      readBlob(root, side === "base" ? base_sha : head_sha, file),
  });
  return withClassificationDigest({
    affected_surfaces: result.affected_surfaces,
    base_sha,
    changed_files: entries.map(({ file, status }) => ({ file, status })),
    contract: CONTRACT,
    head_sha,
    mode: MODE,
    reason: result.reason,
    ...(result.presentation_proof
      ? { presentation_proof: result.presentation_proof }
      : {}),
    tier: result.tier,
  });
}

function readOption(argv, name) {
  const index = argv.indexOf(name);
  const value = index === -1 ? "" : (argv[index + 1] ?? "");
  return value.startsWith("--") ? "" : value;
}

function main(argv = process.argv.slice(2)) {
  const base = readOption(argv, "--base");
  const head = readOption(argv, "--head");
  const output = readOption(argv, "--output");
  if (!base || !head || !output) {
    throw new Error(
      "Usage: museum-release-tier.cjs --base <ref> --head <ref> --output <path>"
    );
  }
  let classification;
  try {
    classification = classifyRange(path.resolve(__dirname, ".."), base, head);
  } catch (error) {
    const root = path.resolve(__dirname, "..");
    let base_sha = "";
    let head_sha = "";
    try {
      base_sha = resolveCommit(root, base);
      head_sha = resolveCommit(root, head);
    } catch {
      // Exact identities remain empty and the report fails closed.
    }
    classification = withClassificationDigest({
      affected_surfaces: [],
      base_sha,
      changed_files: [],
      contract: CONTRACT,
      head_sha,
      mode: MODE,
      reason: error instanceof Error ? error.message : "Classification failed.",
      tier: "P3",
    });
  }
  const outputPath = path.resolve(output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(classification, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(classification)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Classification failed."
    );
    process.exitCode = 1;
  }
}

module.exports = {
  CONTRACT,
  LEAF_PRESENTATION_COMPONENTS,
  MODE,
  classifyEntries,
  classifyRange,
  isMuseumPath,
  isPolicyPath,
  presentationComponentProof,
  readOption,
  withClassificationDigest,
};
