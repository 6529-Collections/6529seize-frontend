#!/usr/bin/env node
"use strict";

const { execFileSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

// Path/policy consumers run in the pre-install CI planning job. Keep the
// TypeScript parser lazy so those consumers can share the classifier's trusted
// predicates without requiring the full dependency tree before installation.
let ts;

function typeScript() {
  ts ??= require("typescript");
  return ts;
}

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
  /^ops\/testing-strategy\/museum-/u,
  /^ops\/scripts\/(?:artifact-portability|testing-strategy|verify-production-artifact)/u,
  /^scripts\/(?:app-pr-ci-effective-plan|e2e-packs|museum-|sync-e2e-manifest)/u,
  /^tests\/packs\.manifest\.cjs$/u,
  /^tests\/museum\//u,
  /^__tests__\/lib\/museum\/publication\/corpusContracts\.test\.ts$/u,
  /^__tests__\/scripts\/(?:app-pr-ci-effective-plan|deployment-e2e|e2e-packs|frontend-deployment|museum-|production-artifact|production-build|production-e2e|sync-e2e-manifest)/u,
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
  typeScript();
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
      // Existing dynamic className expressions are allowed only when they are
      // byte-for-byte unchanged. The masked-source comparison below keeps them
      // in the structural boundary, while letting an unrelated literal token
      // correction remain eligible for P0.
      if (literal !== null) {
        ranges.push({
          end: literal.getEnd(),
          start: literal.getStart(sourceFile),
          value: literal.text,
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return ranges;
}

function isNamedCall(expression, names) {
  if (ts.isIdentifier(expression)) {
    return names.has(expression.text);
  }
  if (ts.isPropertyAccessExpression(expression)) {
    return (
      ts.isIdentifier(expression.expression) &&
      names.has(expression.expression.text)
    );
  }
  return false;
}

function isExpectationExpression(expression) {
  const expectFunctions = new Set(["expect"]);
  if (ts.isCallExpression(expression)) {
    return (
      isNamedCall(expression.expression, expectFunctions) ||
      isExpectationExpression(expression.expression)
    );
  }
  if (ts.isPropertyAccessExpression(expression)) {
    return isExpectationExpression(expression.expression);
  }
  if (
    ts.isParenthesizedExpression(expression) ||
    ts.isAsExpression(expression) ||
    ts.isTypeAssertionExpression(expression) ||
    ts.isNonNullExpression(expression)
  ) {
    return isExpectationExpression(expression.expression);
  }
  return false;
}

function assertionOnlyTestRanges(source, file) {
  typeScript();
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
  const assertionRanges = [];
  const visit = (node) => {
    if (
      ts.isExpressionStatement(node) &&
      isExpectationExpression(node.expression)
    ) {
      assertionRanges.push({
        end: node.getEnd(),
        start: node.getStart(sourceFile),
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return { assertionRanges };
}

function maskTestRanges(source, ranges) {
  let result = source;
  for (const range of [...ranges].sort(
    (left, right) => right.start - left.start
  )) {
    result = `${result.slice(0, range.start)}${result.slice(range.end)}`;
  }
  return result.replaceAll("\r\n", "\n").replace(/\s+/gu, " ").trim();
}

function unwrapTestExpression(expression) {
  let result = expression;
  while (
    ts.isParenthesizedExpression(result) ||
    ts.isAsExpression(result) ||
    ts.isTypeAssertionExpression(result) ||
    ts.isNonNullExpression(result)
  ) {
    result = result.expression;
  }
  return result;
}

function isExpectationChain(expression) {
  const normalized = unwrapTestExpression(expression);
  if (ts.isIdentifier(normalized)) {
    return normalized.text === "expect";
  }
  if (
    ts.isCallExpression(normalized) ||
    ts.isPropertyAccessExpression(normalized)
  ) {
    return isExpectationChain(normalized.expression);
  }
  return false;
}

function isSafeScreenLookup(expression) {
  const normalized = unwrapTestExpression(expression);
  return (
    ts.isPropertyAccessExpression(normalized) &&
    ts.isIdentifier(normalized.expression) &&
    normalized.expression.text === "screen"
  );
}

function isSafeAssertionValue(expression) {
  const normalized = unwrapTestExpression(expression);
  if (
    ts.isIdentifier(normalized) ||
    ts.isStringLiteral(normalized) ||
    ts.isNoSubstitutionTemplateLiteral(normalized) ||
    ts.isNumericLiteral(normalized) ||
    ts.isBigIntLiteral(normalized) ||
    normalized.kind === ts.SyntaxKind.TrueKeyword ||
    normalized.kind === ts.SyntaxKind.FalseKeyword ||
    normalized.kind === ts.SyntaxKind.NullKeyword
  ) {
    return true;
  }
  if (ts.isArrayLiteralExpression(normalized)) {
    return normalized.elements.every((element) =>
      ts.isSpreadElement(element)
        ? isSafeAssertionValue(element.expression)
        : isSafeAssertionValue(element)
    );
  }
  if (ts.isObjectLiteralExpression(normalized)) {
    return normalized.properties.every((property) => {
      if (ts.isPropertyAssignment(property)) {
        return isSafeAssertionValue(property.initializer);
      }
      if (ts.isShorthandPropertyAssignment(property)) {
        return true;
      }
      return (
        ts.isSpreadAssignment(property) &&
        isSafeAssertionValue(property.expression)
      );
    });
  }
  if (ts.isPropertyAccessExpression(normalized)) {
    return isSafeAssertionValue(normalized.expression);
  }
  if (ts.isElementAccessExpression(normalized)) {
    return (
      isSafeAssertionValue(normalized.expression) &&
      (normalized.argumentExpression === undefined ||
        isSafeAssertionValue(normalized.argumentExpression))
    );
  }
  if (ts.isCallExpression(normalized)) {
    const callee = unwrapTestExpression(normalized.expression);
    const permitted =
      isExpectationChain(normalized.expression) ||
      isSafeScreenLookup(normalized.expression) ||
      (ts.isIdentifier(callee) && callee.text === "t");
    return (
      permitted &&
      normalized.arguments.every((argument) => isSafeAssertionValue(argument))
    );
  }
  if (ts.isBinaryExpression(normalized)) {
    return (
      isSafeAssertionValue(normalized.left) &&
      isSafeAssertionValue(normalized.right)
    );
  }
  if (ts.isConditionalExpression(normalized)) {
    return (
      isSafeAssertionValue(normalized.condition) &&
      isSafeAssertionValue(normalized.whenTrue) &&
      isSafeAssertionValue(normalized.whenFalse)
    );
  }
  if (ts.isPrefixUnaryExpression(normalized)) {
    return isSafeAssertionValue(normalized.operand);
  }
  if (ts.isTemplateExpression(normalized)) {
    return normalized.templateSpans.every((span) =>
      isSafeAssertionValue(span.expression)
    );
  }
  return false;
}

function isSafeAssertionStatement(statement) {
  if (ts.isExpressionStatement(statement)) {
    return (
      isExpectationExpression(statement.expression) &&
      isSafeAssertionValue(statement.expression)
    );
  }
  if (ts.isVariableStatement(statement)) {
    return statement.declarationList.declarations.every(
      (declaration) =>
        declaration.initializer !== undefined &&
        isSafeAssertionValue(declaration.initializer)
    );
  }
  if (ts.isForOfStatement(statement)) {
    const initializer = statement.initializer;
    if (
      !ts.isVariableDeclarationList(initializer) ||
      !initializer.declarations.every(
        (declaration) =>
          declaration.initializer === undefined ||
          isSafeAssertionValue(declaration.initializer)
      ) ||
      !isSafeAssertionValue(statement.expression)
    ) {
      return false;
    }
    if (ts.isBlock(statement.statement)) {
      return statement.statement.statements.every(isSafeAssertionStatement);
    }
    return isSafeAssertionStatement(statement.statement);
  }
  return ts.isEmptyStatement(statement);
}

function statementContainsExpectation(statement) {
  let found = false;
  const visit = (node) => {
    if (
      ts.isExpressionStatement(node) &&
      isExpectationExpression(node.expression)
    ) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(statement);
  return found;
}

function normaliseTestNode(source, sourceFile, node) {
  return source
    .slice(node.getStart(sourceFile), node.getEnd())
    .replaceAll("\r\n", "\n")
    .replace(/\s+/gu, " ")
    .trim();
}

function focusedTestPrograms(source, file) {
  typeScript();
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
  const testFunctions = new Set(["it", "test"]);
  const programs = [];
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      testFunctions.has(node.expression.text)
    ) {
      const title = node.arguments[0];
      const callback = node.arguments[1];
      if (
        !title ||
        (!ts.isStringLiteral(title) &&
          !ts.isNoSubstitutionTemplateLiteral(title)) ||
        !callback ||
        (!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback)) ||
        !ts.isBlock(callback.body)
      ) {
        throw new Error(
          "focused test declaration is not statically analyzable"
        );
      }
      programs.push({
        callback_header: source
          .slice(
            callback.getStart(sourceFile),
            callback.body.getStart(sourceFile)
          )
          .replaceAll("\r\n", "\n")
          .replace(/\s+/gu, " ")
          .trim(),
        callee: normaliseTestNode(source, sourceFile, node.expression),
        extra_arguments: node.arguments
          .slice(2)
          .map((argument) => normaliseTestNode(source, sourceFile, argument)),
        statements: callback.body.statements.map((statement) => ({
          contains_expectation: statementContainsExpectation(statement),
          eligible: isSafeAssertionStatement(statement),
          range: {
            end: statement.getEnd(),
            start: statement.getStart(sourceFile),
          },
          source: normaliseTestNode(source, sourceFile, statement),
        })),
        title_range: {
          end: title.getEnd(),
          start: title.getStart(sourceFile),
        },
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return programs;
}

function assertionOnlyTestProof(baseSource, headSource, file) {
  try {
    const base = assertionOnlyTestRanges(baseSource, file);
    const head = assertionOnlyTestRanges(headSource, file);
    if (head.assertionRanges.length <= base.assertionRanges.length) {
      return {
        eligible: false,
        reason: "focused assertion inventory was not strengthened",
      };
    }
    // Only literal titles and static post-assertion statements are masked.
    // Render/setup and every other test-file change remains byte-equivalent.
    const basePrograms = focusedTestPrograms(baseSource, file);
    const headPrograms = focusedTestPrograms(headSource, file);
    if (basePrograms.length !== headPrograms.length) {
      return { eligible: false, reason: "focused test inventory changed" };
    }
    const baseAllowedRanges = [];
    const headAllowedRanges = [];
    for (let index = 0; index < basePrograms.length; index += 1) {
      const baseProgram = basePrograms[index];
      const headProgram = headPrograms[index];
      const baseFirstAssertion = baseProgram.statements.findIndex(
        (statement) => statement.contains_expectation
      );
      const headFirstAssertion = headProgram.statements.findIndex(
        (statement) => statement.contains_expectation
      );
      if (
        baseFirstAssertion < 0 ||
        baseFirstAssertion !== headFirstAssertion ||
        baseProgram.callee !== headProgram.callee ||
        baseProgram.callback_header !== headProgram.callback_header ||
        JSON.stringify(baseProgram.extra_arguments) !==
          JSON.stringify(headProgram.extra_arguments)
      ) {
        return {
          eligible: false,
          reason: "focused test setup or declaration changed",
        };
      }
      for (
        let statementIndex = 0;
        statementIndex < baseFirstAssertion;
        statementIndex += 1
      ) {
        if (
          baseProgram.statements[statementIndex].source !==
          headProgram.statements[statementIndex]?.source
        ) {
          return {
            eligible: false,
            reason: "test setup changed before focused assertions",
          };
        }
      }
      for (const statement of baseProgram.statements.slice(
        baseFirstAssertion
      )) {
        if (statement.eligible) {
          baseAllowedRanges.push(statement.range);
        }
      }
      const headAssertionSourceCounts = new Map();
      for (const statement of headProgram.statements.slice(
        headFirstAssertion
      )) {
        if (statement.contains_expectation) {
          headAssertionSourceCounts.set(
            statement.source,
            (headAssertionSourceCounts.get(statement.source) ?? 0) + 1
          );
        }
      }
      for (const statement of baseProgram.statements.slice(
        baseFirstAssertion
      )) {
        if (!statement.contains_expectation) {
          continue;
        }
        const retainedCount =
          headAssertionSourceCounts.get(statement.source) ?? 0;
        if (retainedCount === 0) {
          return {
            eligible: false,
            reason: "an existing focused assertion was removed or rewritten",
          };
        }
        headAssertionSourceCounts.set(statement.source, retainedCount - 1);
      }
      for (const statement of headProgram.statements.slice(
        headFirstAssertion
      )) {
        if (statement.eligible) {
          headAllowedRanges.push(statement.range);
        }
      }
      baseAllowedRanges.push(baseProgram.title_range);
      headAllowedRanges.push(headProgram.title_range);
    }
    const baseMasked = maskTestRanges(baseSource, baseAllowedRanges);
    const headMasked = maskTestRanges(headSource, headAllowedRanges);
    if (baseMasked !== headMasked) {
      return {
        eligible: false,
        reason: "test syntax changed outside static assertion ranges",
      };
    }
    return {
      assertion_count: head.assertionRanges.length,
      eligible: true,
      reason: "only focused assertions changed",
    };
  } catch (error) {
    return {
      eligible: false,
      reason:
        error instanceof Error ? error.message : "test assertion proof failed",
    };
  }
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
      const testProofs = museumEntries
        .filter(({ file }) => policy.test_paths.includes(file))
        .map((entry) => {
          if (entry.status !== "M") {
            return {
              eligible: false,
              file: entry.file,
              reason: "focused test was not modified in place",
            };
          }
          try {
            return {
              file: entry.file,
              ...assertionOnlyTestProof(
                readFileAt("base", entry.file),
                readFileAt("head", entry.file),
                entry.file
              ),
            };
          } catch (error) {
            return {
              eligible: false,
              file: entry.file,
              reason:
                error instanceof Error
                  ? error.message
                  : "focused test source could not be read",
            };
          }
        });
      if (
        proof.eligible &&
        testProofs.every((testProof) => testProof.eligible)
      ) {
        return {
          affected_surfaces: [...policy.surface_ids],
          presentation_proof: proof,
          ...(testProofs.length > 0
            ? { test_assertion_proof: testProofs }
            : {}),
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
    ...(result.test_assertion_proof
      ? { test_assertion_proof: result.test_assertion_proof }
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
  assertionOnlyTestProof,
  classifyEntries,
  classifyRange,
  isMuseumPath,
  isPolicyPath,
  presentationComponentProof,
  readOption,
  withClassificationDigest,
};
