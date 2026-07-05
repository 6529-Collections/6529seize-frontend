#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const VALIDATION_MANIFEST_SCHEMA_VERSION =
  "frontend-testing.validation-manifest.v1";
const MUTATION_REGISTRY_SCHEMA_VERSION =
  "frontend-testing.mutation-endpoint-registry.v1";
const CI_PLAN_SCHEMA_VERSION = "frontend-testing.ci-plan.v1";
const SECRET_SCAN_SCHEMA_VERSION = "frontend-testing.secret-scan.v1";
const WORKFLOW_SECURITY_SCHEMA_VERSION =
  "frontend-testing.workflow-security.v1";
const MAX_RISK_LEVEL = 5;
const TEXT_SCAN_MAX_BYTES = 1024 * 1024;
const EXISTING_REVIEWBOT_INITIAL_LANES = Object.freeze([
  "general",
  "wcag",
  "i18n",
  "security",
  "responsiveness",
]);
const S3_ARTIFACT_PREFIX = "s3://6529-artifacts/";
const HTTPS_ARTIFACT_PREFIX = "https://artifacts.6529.io/";
const ARTIFACT_REDACTION_STATUSES = new Set([
  "verified-redacted",
  "not-sensitive",
  "public-redacted",
]);
const COMMAND_STATUSES = new Set(["passed", "failed", "skipped", "not-run"]);
const HTTP_METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
]);
const ROUTE_FILE_STEMS = new Set([
  "page",
  "layout",
  "template",
  "loading",
  "error",
  "not-found",
]);
const ROUTE_FILE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs"];
const FALLBACK_RISK_RULE = {
  level: 2,
  name: "unclassified-runtime-or-config",
  reason:
    "Unclassified files default to standard risk so runtime/config changes cannot silently enter the docs fast lane.",
};

// Rules are intentionally ordered from highest to lowest risk. First match wins.
const RISK_RULES = [
  {
    level: 5,
    name: "credentials-or-secrets",
    patterns: [
      /(^|\/)\.env($|[./_-])/,
      /(^|\/)(credentials?|secrets?|secret-handling|private[-_]?key)(\/|\.|$)/,
      /(^|\/)(staging_auth|staging_api_key|wallet[-_]?seed)(\/|\.|$)/,
    ],
    reason:
      "Credentials or secret-handling paths require release-captain review.",
  },
  {
    level: 5,
    name: "signing-funds-or-irreversible",
    patterns: [
      /(^|\/)(signing|signature|transaction|tx|funds?|mint|burn|transfer)(\/|\.|$)/,
      /(^|\/)(irreversible|destructive[-_]?action)(\/|\.|$)/,
    ],
    reason: "Signing, funds, or irreversible-action paths are safety critical.",
  },
  {
    level: 5,
    name: "deploy-authority-or-artifact-access",
    patterns: [
      /(^|\/)(iam|oidc|artifact[-_]?store[-_]?access|production[-_]?secrets)(\/|\.|$)/,
      /(^|\/)\.github\/workflows\/.*prod.*\.ya?ml$/,
    ],
    reason: "Production authority and artifact access controls are critical.",
  },
  {
    level: 4,
    name: "deployment-or-release-control",
    patterns: [
      /^\.github\/workflows\//,
      /^ops\/deployment-bus\//,
      /^ops\/scripts\/deployment-bus\.cjs$/,
      /^ops\/scripts\/testing-strategy\.cjs$/,
      /^ops\/testing-strategy\//,
      /^package\.json$/,
      /^pnpm-lock\.yaml$/,
      /^config\//,
      /^middleware\.(tsx?|jsx?|mjs|cjs)$/,
      /^instrumentation(?:-[^.]+)?\.(tsx?|jsx?|mjs|cjs)$/,
      /^next\.config\./,
      /^sentry\./,
      /^scripts\/(build|start|dev|run-secure|enforce|require-6529|quality|typecheck)/,
      /(^|\/)(deploy|deployment|release|rollback|fix-forward)(\/|\.|$)/,
    ],
    reason:
      "Deployment, release, build, and operational controls affect promotion safety.",
  },
  {
    level: 4,
    name: "native-or-cross-surface-runtime",
    patterns: [
      /^capacitor\.config\./,
      /^android\//,
      /^ios\//,
      /^electron\//,
      /(^|\/)(capacitor|electron|native-shell|webview2)(\/|\.|$)/,
    ],
    reason:
      "Native or cross-surface runtime behavior needs broader validation.",
  },
  {
    level: 3,
    name: "auth-wallet-upload-admin",
    patterns: [
      /(^|\/)(auth|session|login|logout|oauth|cookie|jwt|token)(\/|\.|$)/,
      /(^|[\/._-])(auth|session|login|logout|oauth|cookie|jwt|token)([\/._-]|$)/,
      /(^|\/)(wallet|wagmi|viem|ethers|ens)(\/|\.|$)/,
      /(^|[\/._-])(wallet|wagmi|viem|ethers|ens)([\/._-]|$)/,
      /(^|\/)(profile|identity|tdh|delegation|owner|ownership)(\/|\.|$)/,
      /(^|[\/._-])(profile|identity|tdh|delegation|owner|ownership)([\/._-]|$)/,
      /(^|\/)(upload|uploads|media|link-preview|open-graph|sanitize|safe-url)(\/|\.|$)/,
      /(^|[\/._-])(upload|uploads|media|link-preview|open-graph|sanitize|safe-url)([\/._-]|$)/,
      /(^|\/)(waves?|drops?|posting|moderation|admin|vote|delete)(\/|\.|$)/,
      /(^|[\/._-])(waves?|drops?|posting|moderation|admin|vote|delete)([\/._-]|$)/,
    ],
    reason:
      "Auth, wallet, upload, posting, moderation, and admin paths are guarded.",
  },
  {
    level: 3,
    name: "api-route-or-shared-data",
    patterns: [
      /^app\/api\//,
      /^generated\//,
      /^services\//,
      /^api\//,
      /(^|\/)(api-client|route-protection|server-action|data-fetch|query-client)(\/|\.|$)/,
    ],
    reason:
      "API models, route handlers, and shared data paths can affect trust boundaries.",
  },
  {
    level: 2,
    name: "user-visible-runtime",
    patterns: [
      /^app\//,
      /^components\//,
      /^contexts\//,
      /^hooks\//,
      /^store\//,
      /^helpers\//,
      /^lib\//,
      /^src\//,
      /^utils\//,
      /^styles\//,
      /^i18n\//,
    ],
    reason:
      "User-visible app behavior needs standard browser and component evidence.",
  },
  {
    level: 1,
    name: "presentational-assets",
    patterns: [/^public\//, /^assets\//, /\.(css|scss|svg|png|jpe?g|webp)$/],
    reason: "Presentational asset changes need fast visual/layout validation.",
  },
  {
    level: 0,
    name: "docs-tests-or-metadata",
    patterns: [
      /^ops\/.*\.md$/,
      /^.*\.md$/,
      /^__tests__\//,
      /^tests\//,
      /^docs\//,
      /^\.github\/(pull_request_template|ISSUE_TEMPLATE)\//,
    ],
    reason: "Docs, tests, and non-runtime metadata are fast-lane by default.",
  },
];

const FEATURE_FLAG_PATTERNS = [
  /(^|\/)(feature[-_]?flags?|flags?|experiments?)(\/|\.|$)/,
  /(^|\/)(env\.schema|runtime[-_]?config|eligibility)(\/|\.|$)/,
];

const I18N_PAYLOAD_PATTERNS = [
  /^i18n\/(messages|locales|translations)/,
  /(^|\/)(messages|locales|translations)\.(json|ts|tsx|js)$/,
  /(^|\/)(copy|labels|aria|forms|modals|navigation)(\/|\.|$)/,
];

const PACKAGE_GOVERNANCE_FILES = new Set([
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  ".npmrc",
]);
const REVIEWBOT_CONTRACT_FILES = new Set([
  ".github/6529bot.yml",
  "ops/testing-strategy/validation-manifest.v1.schema.json",
  "ops/scripts/testing-strategy.cjs",
  "__tests__/scripts/testing-strategy.test.ts",
]);
const SOURCE_CODE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
]);
const STYLE_EXTENSIONS = new Set([".css"]);
const SECRET_SCAN_EXTENSIONS = new Set([
  ...SOURCE_CODE_EXTENSIONS,
  ...STYLE_EXTENSIONS,
  ".json",
  ".md",
  ".mjs",
  ".cjs",
  ".yaml",
  ".yml",
  ".env",
  ".npmrc",
  ".pem",
  ".key",
  ".p8",
  ".toml",
  ".tfvars",
  ".txt",
  ".sh",
]);
const TEXT_SECRET_PATTERNS = [
  {
    // The negative lookahead skips code expressions that legitimately sit
    // to the right of a secret-named key in schema/config sources
    // (zod chains, env plumbing) so only literal-looking values match.
    // Accepted trade-off: a real secret VALUE that itself begins with one
    // of these identifier prefixes would be suppressed — vanishingly
    // unlikely for generated credentials, and the value must also sit on
    // a line naming one of these specific keys.
    name: "named-secret-assignment",
    pattern:
      /\b(?:ANTHROPIC_API_KEY|OPENROUTER_API_KEY|STAGING_AUTH|STAGING_API_KEY|AWS_SECRET_ACCESS_KEY|AWS_ACCESS_KEY_ID|SENTRY_AUTH_TOKEN|ALCHEMY_API_KEY|SSR_CLIENT_SECRET)\b\s*[:=]\s*['"]?(?!z\.|process\.|publicEnv\.|privateEnv\.|serverEnv\.|import\.|env\.)[A-Za-z0-9_./+=:@-]{8,}/i,
  },
  {
    name: "authorization-bearer-token",
    pattern: /\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9._~+/=-]{16,}/i,
  },
  {
    name: "private-key-block",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  },
  {
    name: "github-token",
    pattern: /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}/,
  },
  {
    name: "aws-access-key-id",
    pattern: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    // Three-part base64url token starting with the JWT header prefix
    // ("eyJ" is base64 for '{"'). Catches raw session/refresh tokens in
    // JSON or source even without an Authorization header around them —
    // the shape of the 2026-07-04 tmp/ bot-token leak. The segment length
    // floors ({10,}/{5,}) are a deliberate noise/coverage trade-off, not
    // exhaustive JWT detection: degenerate tokens with a sub-10-char
    // payload or sub-5-char signature slip past this net.
    name: "jwt-like-token",
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}/,
  },
  {
    name: "npm-auth-token",
    findLines: findNpmAuthTokenLines,
  },
];
const WORKFLOW_WRITE_PERMISSION_SCOPES = new Set([
  "actions",
  "attestations",
  "checks",
  "contents",
  "deployments",
  "discussions",
  "id-token",
  "issues",
  "models",
  "packages",
  "pages",
  "pull-requests",
  "repository-projects",
  "security-events",
  "statuses",
]);

function parseArgs(argv) {
  const args = { _: [] };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }

    const rawKey = token.slice(2);
    const eqIndex = rawKey.indexOf("=");
    if (eqIndex !== -1) {
      args[rawKey.slice(0, eqIndex)] = rawKey.slice(eqIndex + 1);
      continue;
    }

    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[rawKey] = true;
      continue;
    }

    args[rawKey] = next;
    i += 1;
  }

  return args;
}

function normalizePath(value) {
  return displayPath(value).toLowerCase();
}

function displayPath(value) {
  return String(value || "")
    .replaceAll("\\", "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
}

function matchesAny(filePath, patterns) {
  return patterns.some((pattern) => pattern.test(filePath));
}

function ruleForFile(filePath) {
  const normalized = normalizePath(filePath);
  return (
    RISK_RULES.find((rule) => matchesAny(normalized, rule.patterns)) ||
    FALLBACK_RISK_RULE
  );
}

function routeFileStem(fileName) {
  if (!fileName) {
    return null;
  }
  for (const extension of ROUTE_FILE_EXTENSIONS) {
    if (fileName.endsWith(extension)) {
      return fileName.slice(0, -extension.length);
    }
  }
  return null;
}

function normalizeRouteSegment(segment) {
  if (segment.startsWith("(") && segment.endsWith(")")) {
    return null;
  }
  if (segment.startsWith("[") && segment.endsWith("]")) {
    return ":param";
  }
  return segment;
}

function routeFromSegments(segments) {
  const routeParts = segments.map(normalizeRouteSegment).filter(Boolean);
  return routeParts.length === 0 ? "/" : `/${routeParts.join("/")}`;
}

function appRouteImpact(file) {
  if (!file.startsWith("app/")) {
    return null;
  }
  const parts = file.slice("app/".length).split("/");
  const stem = routeFileStem(parts.at(-1));
  if (!ROUTE_FILE_STEMS.has(stem)) {
    return null;
  }
  return routeFromSegments(parts.slice(0, -1));
}

function pagesRouteImpact(file) {
  if (!file.startsWith("pages/")) {
    return null;
  }
  const parts = file.slice("pages/".length).split("/");
  if (parts[0] === "api") {
    return null;
  }
  const stem = routeFileStem(parts.at(-1));
  if (!stem) {
    return null;
  }
  const routeParts = [...parts.slice(0, -1), stem].filter(
    (part, index, source) => !(part === "index" && index === source.length - 1)
  );
  return routeFromSegments(routeParts);
}

function inferRouteImpacts(files) {
  const routes = new Set();

  for (const file of files.map(normalizePath)) {
    const route = appRouteImpact(file) || pagesRouteImpact(file);
    if (route) {
      routes.add(route);
    }
  }

  return [...routes].sort((left, right) => left.localeCompare(right));
}

function classifyChangedFiles(files) {
  const fileMap = new Map();
  for (const file of files) {
    const display = displayPath(file);
    if (display) {
      fileMap.set(normalizePath(display), display);
    }
  }
  const fileEntries = [...fileMap.entries()].map(([normalized, display]) => ({
    normalized,
    display,
  }));
  const reasons = fileEntries.map((file) => {
    const rule = ruleForFile(file.normalized);
    return {
      path: file.display,
      level: rule.level,
      rule: rule.name,
      reason: rule.reason,
    };
  });
  let computedFloor = reasons.reduce(
    (highest, reason) => Math.max(highest, reason.level),
    0
  );
  const modifiers = [];

  if (
    computedFloor < 4 &&
    fileEntries.some((file) =>
      matchesAny(file.normalized, FEATURE_FLAG_PATTERNS)
    )
  ) {
    computedFloor = Math.min(MAX_RISK_LEVEL, computedFloor + 1);
    modifiers.push({
      name: "feature-flag-diff-risk",
      level_delta: 1,
      reason:
        "Feature flag, runtime config, or eligibility changes can alter ON/OFF behavior.",
    });
  }

  if (
    fileEntries.some((file) =>
      matchesAny(file.normalized, I18N_PAYLOAD_PATTERNS)
    )
  ) {
    modifiers.push({
      name: "i18n-layout-risk",
      level_delta: 0,
      reason:
        "I18n or label payload changes require mobile overflow and accessible-name evidence.",
    });
  }

  return {
    schema_version: "frontend-testing.risk-floor.v1",
    computed_floor: computedFloor,
    risk_level: `level-${computedFloor}`,
    files: fileEntries.map((file) => file.display),
    reasons,
    modifiers,
    route_impacts: inferRouteImpacts(
      fileEntries.map((file) => file.normalized)
    ),
  };
}

function fileExtension(filePath) {
  const basename = filePath.split("/").at(-1) || "";
  const dotIndex = basename.lastIndexOf(".");
  return dotIndex === -1 ? "" : basename.slice(dotIndex).toLowerCase();
}

function isSourceCodeFile(filePath) {
  return SOURCE_CODE_EXTENSIONS.has(fileExtension(filePath));
}

function isStyleFile(filePath) {
  return STYLE_EXTENSIONS.has(fileExtension(filePath));
}

function isLintableFile(filePath) {
  return isSourceCodeFile(filePath);
}

function isPackageGovernanceFile(filePath) {
  return PACKAGE_GOVERNANCE_FILES.has(normalizePath(filePath));
}

function isWorkflowFile(filePath) {
  return /^\.github\/workflows\/[^/]+\.ya?ml$/i.test(normalizePath(filePath));
}

function isPlaywrightOrTestSupportFile(filePath) {
  const normalized = normalizePath(filePath);
  return (
    normalized.startsWith("tests/") ||
    normalized.startsWith("__tests__/") ||
    normalized === "playwright.config.ts" ||
    normalized === "tsconfig.playwright.json"
  );
}

function isTestOrTestSupportFile(filePath) {
  const normalized = normalizePath(filePath);
  return (
    normalized.startsWith("tests/") ||
    normalized.startsWith("__tests__/") ||
    normalized.includes(".test.") ||
    normalized.includes(".spec.")
  );
}

function isReviewbotContractFile(filePath) {
  return REVIEWBOT_CONTRACT_FILES.has(normalizePath(filePath));
}

function isBuildSensitiveFile(filePath) {
  const normalized = normalizePath(filePath);
  return (
    normalized === "package.json" ||
    normalized === "pnpm-lock.yaml" ||
    normalized === "next.config.js" ||
    normalized === "next.config.mjs" ||
    normalized === "next.config.ts" ||
    normalized === "openapi.yaml" ||
    normalized.startsWith(".github/workflows/") ||
    normalized.startsWith("generated/") ||
    normalized.startsWith("scripts/build") ||
    normalized.startsWith("scripts/start") ||
    normalized.startsWith("scripts/run-secure") ||
    normalized.startsWith("ops/testing-strategy/") ||
    normalized === "ops/scripts/testing-strategy.cjs" ||
    normalized === "playwright.config.ts" ||
    normalized.startsWith("app/") ||
    normalized.startsWith("pages/")
  );
}

function check(required, reason) {
  return { required: Boolean(required), reason };
}

function createCiPlan(files, options = {}) {
  const normalizedFiles = [
    ...new Map(
      files
        .map(displayPath)
        .filter(Boolean)
        .map((file) => [normalizePath(file), file])
    ).values(),
  ];
  const risk = classifyChangedFiles(normalizedFiles);
  const riskFloor = risk.computed_floor;
  const hasSourceCode = normalizedFiles.some(isSourceCodeFile);
  const hasStyle = normalizedFiles.some(isStyleFile);
  const hasLintable = normalizedFiles.some(isLintableFile);
  const hasPackageGovernance = normalizedFiles.some(isPackageGovernanceFile);
  const hasWorkflow = normalizedFiles.some(isWorkflowFile);
  const hasPlaywrightOrTests = normalizedFiles.some(
    isPlaywrightOrTestSupportFile
  );
  const hasReviewbotContract = normalizedFiles.some(isReviewbotContractFile);
  const hasBuildSensitive = normalizedFiles.some(isBuildSensitiveFile);
  const hasDeletedRuntimeSource = normalizedFiles.some(
    (file) =>
      isSourceCodeFile(file) &&
      !isTestOrTestSupportFile(file) &&
      !changedFileExists(file, options.cwd)
  );
  const hasRuntimeEvidenceNeed =
    riskFloor >= 2 || risk.route_impacts.length > 0 || hasStyle;
  const hasCriticalShellEvidenceNeed =
    riskFloor >= 3 || hasBuildSensitive || hasDeletedRuntimeSource;
  const needsInstall =
    hasLintable ||
    hasPackageGovernance ||
    hasPlaywrightOrTests ||
    hasRuntimeEvidenceNeed ||
    hasBuildSensitive;

  return {
    schema_version: CI_PLAN_SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    changed_files: normalizedFiles,
    risk,
    untrusted_pr: Boolean(options.untrustedPr),
    checks: {
      risk_floor: check(
        true,
        "Every PR gets deterministic risk-floor evidence."
      ),
      secret_scan: check(
        true,
        "Changed files are scanned before dependency install."
      ),
      workflow_security_review: check(
        hasWorkflow,
        hasWorkflow
          ? "Changed workflow files need pull_request secret and permission review."
          : "No changed workflow files."
      ),
      dependency_governance: check(
        hasPackageGovernance,
        hasPackageGovernance
          ? "Package manager or dependency policy files changed."
          : "No package governance files changed."
      ),
      reviewbot_contract: check(
        hasReviewbotContract,
        hasReviewbotContract
          ? "Reviewbot config, manifest schema, or strategy tooling changed and must preserve existing lanes."
          : "No reviewbot contract files changed."
      ),
      install: check(
        needsInstall,
        needsInstall
          ? "Node dependency install is needed for changed code checks."
          : "Docs or metadata only; no dependency install needed."
      ),
      lint_changed: check(
        hasLintable,
        hasLintable
          ? "Changed source files need eslint coverage."
          : "No lintable source files changed."
      ),
      typecheck_changed: check(
        hasSourceCode,
        hasSourceCode
          ? "Changed TypeScript/JavaScript files need focused typecheck coverage."
          : "No source files changed."
      ),
      test_typecheck: check(
        needsInstall,
        needsInstall
          ? "Installed PR CI runs Playwright/helper typecheck as the test typecheck baseline."
          : "No installed test typecheck needed for docs-only changes."
      ),
      jest_changed: check(
        hasPlaywrightOrTests || riskFloor >= 2,
        hasPlaywrightOrTests || riskFloor >= 2
          ? "Changed tests or standard-risk runtime code need focused Jest coverage."
          : "Fast-lane change without focused Jest requirement."
      ),
      build: check(
        riskFloor >= 3 || hasBuildSensitive || hasDeletedRuntimeSource,
        riskFloor >= 3 || hasBuildSensitive || hasDeletedRuntimeSource
          ? "Guarded, build-sensitive, or deleted runtime source changes need a production build."
          : "Build is deferred for fast or ordinary non-build-sensitive changes."
      ),
      playwright_smoke: check(
        hasRuntimeEvidenceNeed,
        hasRuntimeEvidenceNeed
          ? "Standard-risk UI, route, or style changes need a small browser smoke pack."
          : "No route, runtime UI, or style smoke needed."
      ),
      playwright_critical_shell: check(
        hasCriticalShellEvidenceNeed,
        hasCriticalShellEvidenceNeed
          ? "Guarded, build-sensitive, or deleted runtime source changes need critical route-shell browser evidence."
          : "No guarded or build-sensitive route-shell browser evidence needed."
      ),
    },
    security: {
      secrets_allowed: false,
      token_permissions: "contents:read",
      fork_pr_policy:
        "No repository secrets, deployment credentials, staging credentials, or artifact-store writes are used by this pull_request workflow.",
    },
  };
}

function shouldScanTextFile(filePath) {
  const normalized = normalizePath(filePath);
  const basename = normalized.split("/").at(-1) || "";
  const extension = fileExtension(normalized);
  return (
    SECRET_SCAN_EXTENSIONS.has(extension) ||
    normalized.startsWith(".env") ||
    normalized.endsWith(".env") ||
    /^(id_rsa|id_ed25519|id_ecdsa|credentials?|secrets?|private[-_]?key)$/i.test(
      basename
    )
  );
}

function changedFileExists(filePath, cwd = process.cwd()) {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI checks changed files only.
    return fs.statSync(`${cwd}/${filePath}`).isFile();
  } catch {
    return false;
  }
}

function lineNumberForIndex(text, index) {
  return text.slice(0, index).split(/\r\n|\r|\n/).length;
}

function lineNumbersForPattern(text, pattern) {
  const flags = pattern.flags.includes("g")
    ? pattern.flags
    : `${pattern.flags}g`;
  const matcher = new RegExp(pattern.source, flags);
  const lineNumbers = [];
  let match = matcher.exec(text);
  while (match?.index !== undefined) {
    lineNumbers.push(lineNumberForIndex(text, match.index));
    if (match[0].length === 0) {
      matcher.lastIndex += 1;
    }
    match = matcher.exec(text);
  }
  return lineNumbers;
}

function findNpmAuthTokenLines(text) {
  const lineNumbers = [];
  text.split(/\r\n|\r|\n/).forEach((line, index) => {
    const trimmed = line.trimStart();
    const markerIndex = trimmed.indexOf(":_authToken");
    if (!trimmed.startsWith("//") || markerIndex < 3) {
      return;
    }
    const afterMarker = trimmed
      .slice(markerIndex + ":_authToken".length)
      .trimStart();
    if (!afterMarker.startsWith("=")) {
      return;
    }
    const tokenValue = afterMarker.slice(1).trimStart();
    if (tokenValue.length >= 8) {
      lineNumbers.push(index + 1);
    }
  });
  return lineNumbers;
}

function scanTextForSecrets(text, filePath) {
  const findings = [];
  for (const { name, pattern, findLines } of TEXT_SECRET_PATTERNS) {
    const lineNumbers = findLines
      ? findLines(text)
      : lineNumbersForPattern(text, pattern);
    for (const line of lineNumbers) {
      findings.push({
        file: displayPath(filePath),
        line,
        pattern: name,
      });
    }
  }
  return findings;
}

function scanFilesForSecrets(files, cwd = process.cwd()) {
  const findings = [];
  const skipped = [];

  for (const file of files.map(displayPath).filter(Boolean)) {
    if (!changedFileExists(file, cwd)) {
      continue;
    }
    if (!shouldScanTextFile(file)) {
      skipped.push({ file, reason: "not-text-extension" });
      continue;
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI checks changed files only.
    const stat = fs.statSync(`${cwd}/${file}`);
    if (stat.size > TEXT_SCAN_MAX_BYTES) {
      skipped.push({ file, reason: "too-large" });
      continue;
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI checks changed files only.
    const text = fs.readFileSync(`${cwd}/${file}`, "utf8");
    findings.push(...scanTextForSecrets(text, file));
  }

  return {
    schema_version: SECRET_SCAN_SCHEMA_VERSION,
    ok: findings.length === 0,
    findings,
    skipped,
  };
}

function workflowSecurityFindingsForText(text, filePath) {
  const findings = [];
  const workflowLines = text.split(/\r\n|\r|\n/).map((line) => line.trim());
  const hasPullRequestTrigger = workflowHasTrigger(
    workflowLines,
    "pull_request"
  );

  if (workflowHasTrigger(workflowLines, "pull_request_target")) {
    findings.push({
      file: displayPath(filePath),
      pattern: "pull_request_target",
      reason:
        "pull_request_target can expose privileged tokens to untrusted code and needs a separate security design.",
    });
  }

  if (hasPullRequestTrigger && workflowReferencesSecrets(text)) {
    findings.push({
      file: displayPath(filePath),
      pattern: "pull_request-secrets",
      reason:
        "pull_request workflows must not reference repository secrets or deployment credentials.",
    });
  }

  if (
    hasPullRequestTrigger &&
    workflowLines.some(
      (line) => line.toLowerCase() === "permissions: write-all"
    )
  ) {
    findings.push({
      file: displayPath(filePath),
      pattern: "pull_request-write-all",
      reason: "pull_request workflows must use least-privilege permissions.",
    });
  }

  if (
    hasPullRequestTrigger &&
    workflowLines.some(isWorkflowWritePermissionLine)
  ) {
    findings.push({
      file: displayPath(filePath),
      pattern: "pull_request-write-permission",
      reason:
        "ordinary app PR CI must stay read-only; write permissions need a separate trusted workflow.",
    });
  }

  return findings;
}

function workflowHasTrigger(lines, trigger) {
  return lines.some((line) => {
    if (line === `${trigger}:` || line === `- ${trigger}`) {
      return true;
    }
    if (!line.startsWith("on:")) {
      return false;
    }
    const triggerValue = line.slice("on:".length).trim();
    if (triggerValue === trigger) {
      return true;
    }
    if (!triggerValue.startsWith("[") || !triggerValue.endsWith("]")) {
      return false;
    }
    return triggerValue
      .slice(1, -1)
      .split(",")
      .some((entry) => stripBoundaryQuotes(entry.trim()) === trigger);
  });
}

function workflowReferencesSecrets(text) {
  const compactText = text.replace(/[ \t]/g, "");
  return compactText.includes("secrets.") || compactText.includes("secrets[");
}

function isWorkflowWritePermissionLine(line) {
  const separatorIndex = line.indexOf(":");
  if (separatorIndex === -1) {
    return false;
  }
  const scope = line.slice(0, separatorIndex).trim().toLowerCase();
  const permission = line
    .slice(separatorIndex + 1)
    .trim()
    .toLowerCase();
  return WORKFLOW_WRITE_PERMISSION_SCOPES.has(scope) && permission === "write";
}

function stripBoundaryQuotes(value) {
  if (value.length < 2) {
    return value;
  }
  const first = value[0];
  const last = value[value.length - 1];
  if ((first === "'" || first === '"') && first === last) {
    return value.slice(1, -1);
  }
  return value;
}

function validateWorkflowSecurityFiles(files, cwd = process.cwd()) {
  const workflowFiles = files.map(displayPath).filter(isWorkflowFile);
  const findings = [];

  for (const file of workflowFiles) {
    if (!changedFileExists(file, cwd)) {
      continue;
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI checks changed workflow files only.
    const text = fs.readFileSync(`${cwd}/${file}`, "utf8");
    findings.push(...workflowSecurityFindingsForText(text, file));
  }

  return {
    schema_version: WORKFLOW_SECURITY_SCHEMA_VERSION,
    ok: findings.length === 0,
    checked_files: workflowFiles,
    findings,
  };
}

function isIntegerRisk(value) {
  return Number.isInteger(value) && value >= 0 && value <= MAX_RISK_LEVEL;
}

function readJson(file) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI reads caller-supplied manifest paths.
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function pushError(errors, pathName, message) {
  errors.push(`${pathName}: ${message}`);
}

function validateArtifactPointer(artifact, index) {
  const errors = [];
  const prefix = `artifacts[${index}]`;

  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
    pushError(errors, prefix, "must be an object");
    return errors;
  }

  if (!artifact.kind) {
    pushError(errors, `${prefix}.kind`, "required");
  }

  if (!artifact.uri || typeof artifact.uri !== "string") {
    pushError(errors, `${prefix}.uri`, "required");
  } else {
    validateArtifactUri(artifact, prefix, errors);
  }

  if (
    !artifact.sha256 &&
    !artifact.cid &&
    !artifact.etag &&
    !artifact.version_id
  ) {
    pushError(
      errors,
      prefix,
      "must include at least one integrity field: sha256, cid, etag, or version_id"
    );
  }

  if (!ARTIFACT_REDACTION_STATUSES.has(artifact.redaction_status)) {
    pushError(
      errors,
      `${prefix}.redaction_status`,
      `must be one of ${[...ARTIFACT_REDACTION_STATUSES].join(", ")}`
    );
  }

  if (!artifact.producing_command) {
    pushError(errors, `${prefix}.producing_command`, "required");
  }

  if (!artifact.retention_class) {
    pushError(errors, `${prefix}.retention_class`, "required");
  }

  return errors;
}

function validateArtifactUri(artifact, prefix, errors) {
  const uri = artifact.uri;
  const lowerUri = uri.toLowerCase();
  if (
    lowerUri.startsWith("file://") ||
    /^[a-z]:[\\/]/i.test(uri) ||
    lowerUri.includes("git-lfs")
  ) {
    pushError(
      errors,
      `${prefix}.uri`,
      "must be a durable artifact pointer, not a local path or Git LFS object"
    );
  }

  if (uri.startsWith(S3_ARTIFACT_PREFIX)) {
    return;
  }
  if (uri.startsWith(HTTPS_ARTIFACT_PREFIX)) {
    return;
  }
  if (uri.startsWith("ipfs://") || uri.startsWith("ipns://")) {
    if (artifact.redaction_status !== "public-redacted") {
      pushError(
        errors,
        `${prefix}.redaction_status`,
        "must be public-redacted for IPFS/IPNS artifact pointers"
      );
    }
    return;
  }

  pushError(
    errors,
    `${prefix}.uri`,
    `must start with ${S3_ARTIFACT_PREFIX}, ${HTTPS_ARTIFACT_PREFIX}, ipfs://, or ipns://`
  );
}

function validateReviewbotLanes(review, errors) {
  const lanes = review?.reviewbot?.required_lanes;
  if (!lanes) {
    return;
  }
  if (!Array.isArray(lanes)) {
    pushError(errors, "review.reviewbot.required_lanes", "must be an array");
    return;
  }

  for (const lane of EXISTING_REVIEWBOT_INITIAL_LANES) {
    if (!lanes.includes(lane)) {
      pushError(
        errors,
        "review.reviewbot.required_lanes",
        `must include existing reviewbot lane: ${lane}`
      );
    }
  }
}

function validateRiskSection(risk, errors) {
  for (const field of ["computed_floor", "declared", "final"]) {
    if (!isIntegerRisk(risk[field])) {
      pushError(errors, `risk.${field}`, "must be an integer from 0 through 5");
    }
  }
  if (!Array.isArray(risk.reasons)) {
    pushError(errors, "risk.reasons", "must be an array");
  }

  if (
    isIntegerRisk(risk.final) &&
    isIntegerRisk(risk.computed_floor) &&
    risk.final < risk.computed_floor
  ) {
    const approval = risk.downgrade_approval || {};
    if (!approval.approver) {
      pushError(errors, "risk.downgrade_approval.approver", "required");
    }
    if (!approval.reason) {
      pushError(errors, "risk.downgrade_approval.reason", "required");
    }
    if (!approval.expires_at) {
      pushError(errors, "risk.downgrade_approval.expires_at", "required");
    }
  }
}

function validateHazards(hazards, errors) {
  if (!Array.isArray(hazards)) {
    pushError(errors, "hazards", "must be an array");
    return;
  }

  hazards.forEach((hazard, index) => {
    for (const field of [
      "hazard",
      "severity",
      "likelihood",
      "detection",
      "required_test",
      "rollback_or_fix_forward",
    ]) {
      if (!hazard?.[field]) {
        pushError(errors, `hazards[${index}].${field}`, "required");
      }
    }
  });
}

function validateCommands(commands, errors) {
  if (!Array.isArray(commands)) {
    pushError(errors, "commands", "must be an array");
    return;
  }

  commands.forEach((command, index) => {
    if (!command?.command) {
      pushError(errors, `commands[${index}].command`, "required");
    }
    if (!COMMAND_STATUSES.has(command?.status)) {
      pushError(
        errors,
        `commands[${index}].status`,
        `must be one of ${[...COMMAND_STATUSES].join(", ")}`
      );
    }
  });
}

function validateArtifacts(artifacts, finalRisk, errors) {
  if (!Array.isArray(artifacts)) {
    pushError(errors, "artifacts", "must be an array");
    return;
  }

  artifacts.forEach((artifact, index) => {
    errors.push(...validateArtifactPointer(artifact, index));
  });

  if (isIntegerRisk(finalRisk) && finalRisk >= 3 && artifacts.length === 0) {
    pushError(
      errors,
      "artifacts",
      "Level 3+ manifests require at least one validated durable artifact pointer"
    );
  }
}

function validateValidationManifest(manifest) {
  const errors = [];
  const warnings = [];

  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return {
      ok: false,
      errors: ["manifest: must be an object"],
      warnings,
    };
  }

  if (manifest.schema_version !== VALIDATION_MANIFEST_SCHEMA_VERSION) {
    pushError(
      errors,
      "schema_version",
      `must be ${VALIDATION_MANIFEST_SCHEMA_VERSION}`
    );
  }

  const risk = manifest.risk || {};
  validateRiskSection(risk, errors);

  if (!Array.isArray(manifest.changed_files)) {
    pushError(errors, "changed_files", "must be an array");
  }

  validateHazards(manifest.hazards, errors);
  validateCommands(manifest.commands, errors);
  validateArtifacts(manifest.artifacts, risk.final, errors);

  validateReviewbotLanes(manifest.review, errors);

  if (!manifest.review?.reviewbot?.required_lanes) {
    pushError(
      errors,
      "review.reviewbot.required_lanes",
      "required; every PR must preserve the existing reviewbot lanes"
    );
  }

  return { ok: errors.length === 0, errors, warnings };
}

function summarizeValidationManifest(manifest) {
  const risk = manifest.risk || {};
  const reviewLanes = manifest.review?.reviewbot?.required_lanes || [];
  return [
    `schema_version: ${manifest.schema_version}`,
    `risk: computed ${risk.computed_floor}, declared ${risk.declared}, final ${risk.final}`,
    `changed_files: ${(manifest.changed_files || []).length}`,
    `hazards: ${(manifest.hazards || []).length}`,
    `commands: ${(manifest.commands || []).length}`,
    `artifacts: ${(manifest.artifacts || []).length}`,
    `reviewbot_lanes: ${reviewLanes.join(", ") || "not recorded"}`,
  ].join("\n");
}

function validateMutationRegistry(registry) {
  const errors = [];
  const warnings = [];

  if (!registry || typeof registry !== "object" || Array.isArray(registry)) {
    return {
      ok: false,
      errors: ["registry: must be an object"],
      warnings,
    };
  }

  if (registry.schema_version !== MUTATION_REGISTRY_SCHEMA_VERSION) {
    pushError(
      errors,
      "schema_version",
      `must be ${MUTATION_REGISTRY_SCHEMA_VERSION}`
    );
  }
  if (!registry.owner) {
    pushError(errors, "owner", "required");
  }
  if (!registry.updated_at) {
    pushError(errors, "updated_at", "required");
  }
  if (!Array.isArray(registry.endpoints)) {
    pushError(errors, "endpoints", "must be an array");
    return { ok: errors.length === 0, errors, warnings };
  }

  const ids = new Set();
  registry.endpoints.forEach((endpoint, index) => {
    const prefix = `endpoints[${index}]`;
    if (!endpoint || typeof endpoint !== "object" || Array.isArray(endpoint)) {
      pushError(errors, prefix, "must be an object");
      return;
    }
    if (!endpoint.id) {
      pushError(errors, `${prefix}.id`, "required");
    } else if (ids.has(endpoint.id)) {
      pushError(errors, `${prefix}.id`, `duplicate id: ${endpoint.id}`);
    } else {
      ids.add(endpoint.id);
    }
    if (!endpoint.pattern) {
      pushError(errors, `${prefix}.pattern`, "required");
    }
    if (!Array.isArray(endpoint.methods) || endpoint.methods.length === 0) {
      pushError(
        errors,
        `${prefix}.methods`,
        "must include at least one method"
      );
    } else {
      for (const method of endpoint.methods) {
        if (!HTTP_METHODS.has(method)) {
          pushError(
            errors,
            `${prefix}.methods`,
            `invalid HTTP method: ${method}`
          );
        }
      }
    }
    if (!endpoint.surface) {
      pushError(errors, `${prefix}.surface`, "required");
    }
    if (!isIntegerRisk(endpoint.risk_level)) {
      pushError(
        errors,
        `${prefix}.risk_level`,
        "must be an integer from 0 through 5"
      );
    }
    if (endpoint.mutation !== true) {
      pushError(
        errors,
        `${prefix}.mutation`,
        "must be true for registry entries"
      );
    }
    if (endpoint.allowed_in_readonly_tests !== false) {
      pushError(
        errors,
        `${prefix}.allowed_in_readonly_tests`,
        "must be false unless a separate allowlist explicitly handles the endpoint"
      );
    }
  });

  return { ok: errors.length === 0, errors, warnings };
}

function printValidation(result, successMessage) {
  for (const warning of result.warnings) {
    console.warn(`warning: ${warning}`);
  }
  if (!result.ok) {
    for (const error of result.errors) {
      console.error(`error: ${error}`);
    }
    return;
  }
  writeStdout(successMessage);
}

function writeStdout(message = "") {
  process.stdout.write(`${message}\n`);
}

function writeJsonResult(value, args) {
  const text = JSON.stringify(value, null, 2);
  if (args.output) {
    const outputDir = path.dirname(args.output);
    if (outputDir && outputDir !== ".") {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI writes caller-supplied output paths.
      fs.mkdirSync(outputDir, { recursive: true });
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI writes caller-supplied output paths.
    fs.writeFileSync(args.output, `${text}\n`);
  }
  if (args.json || !args.output) {
    writeStdout(text);
  }
}

function canRunCommand(command) {
  const result = spawnSync(command, ["--version"], {
    encoding: "utf8",
    stdio: ["ignore", "ignore", "ignore"],
  });
  return result.status === 0;
}

function resolveGitCommand() {
  if (process.env.GIT_COMMAND) {
    return process.env.GIT_COMMAND;
  }
  if (process.platform !== "win32") {
    return "git";
  }
  const candidates = [
    String.raw`C:\Program Files\Git\cmd\git.exe`,
    String.raw`C:\Program Files\Git\bin\git.exe`,
  ];
  return candidates.find((candidate) => canRunCommand(candidate)) || "git";
}

function changedFilesFromGit(baseRef, cwd = process.cwd()) {
  const diffResult = spawnSync(
    resolveGitCommand(),
    ["diff", "--name-only", "--diff-filter=ACMRD", "-z", `${baseRef}...HEAD`],
    {
      cwd,
      encoding: "buffer",
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  if (diffResult.status !== 0) {
    throw new Error(
      diffResult.stderr.toString("utf8").trim() || "git diff failed"
    );
  }

  const workspaceResult = spawnSync(
    resolveGitCommand(),
    ["diff", "--name-only", "--diff-filter=ACMRD", "-z", "HEAD"],
    {
      cwd,
      encoding: "buffer",
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  if (workspaceResult.status !== 0) {
    throw new Error(
      workspaceResult.stderr.toString("utf8").trim() || "git diff HEAD failed"
    );
  }

  const untrackedResult = spawnSync(
    resolveGitCommand(),
    ["ls-files", "--others", "--exclude-standard", "-z"],
    {
      cwd,
      encoding: "buffer",
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  if (untrackedResult.status !== 0) {
    throw new Error(
      untrackedResult.stderr.toString("utf8").trim() ||
        "git ls-files --others failed"
    );
  }

  return Buffer.concat([
    diffResult.stdout,
    workspaceResult.stdout,
    untrackedResult.stdout,
  ])
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
}

function filesFromArgs(args) {
  if (args.files) {
    return String(args.files)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (args["changed-from"]) {
    return changedFilesFromGit(args["changed-from"]);
  }
  return args._;
}

function usage() {
  return `Usage:
  node ops/scripts/testing-strategy.cjs compute-risk-floor --changed-from origin/main [--json]
  node ops/scripts/testing-strategy.cjs compute-risk-floor --files app/page.tsx,components/Foo.tsx [--json]
  node ops/scripts/testing-strategy.cjs ci-plan --changed-from origin/main --output ci-plan.json
  node ops/scripts/testing-strategy.cjs scan-changed-secrets --changed-from origin/main --output secret-scan.json
  node ops/scripts/testing-strategy.cjs validate-workflow-security --changed-from origin/main --output workflow-security.json
  node ops/scripts/testing-strategy.cjs validate-manifest --file <file>
  node ops/scripts/testing-strategy.cjs summarize-manifest --file <file>
  node ops/scripts/testing-strategy.cjs validate-mutation-registry --file <file>
`;
}

function commandComputeRiskFloor(args) {
  const result = classifyChangedFiles(filesFromArgs(args));
  if (args.json || args.output) {
    writeJsonResult(result, args);
    return;
  }

  writeStdout(`Risk floor: ${result.risk_level}`);
  for (const reason of result.reasons) {
    writeStdout(`- ${reason.path}: level-${reason.level} (${reason.rule})`);
  }
  for (const modifier of result.modifiers) {
    writeStdout(`- modifier ${modifier.name}: ${modifier.reason}`);
  }
}

function commandCiPlan(args) {
  const result = createCiPlan(filesFromArgs(args), {
    untrustedPr:
      args["untrusted-pr"] === true ||
      args["untrusted-pr"] === "true" ||
      args["untrusted-pr"] === "1",
  });
  writeJsonResult(result, args);
}

function commandScanChangedSecrets(args) {
  const result = scanFilesForSecrets(filesFromArgs(args));
  writeJsonResult(result, args);
  if (!result.ok) {
    for (const finding of result.findings) {
      console.error(
        `error: ${finding.file}:${finding.line}: possible secret (${finding.pattern})`
      );
    }
    process.exitCode = 1;
  }
}

function commandValidateWorkflowSecurity(args) {
  const result = validateWorkflowSecurityFiles(filesFromArgs(args));
  writeJsonResult(result, args);
  if (!result.ok) {
    for (const finding of result.findings) {
      console.error(
        `error: ${finding.file}: ${finding.pattern}: ${finding.reason}`
      );
    }
    process.exitCode = 1;
  }
}

function commandValidateManifest(args) {
  const result = validateValidationManifest(readJson(args.file));
  printValidation(result, "Validation manifest is valid.");
  if (!result.ok) {
    process.exitCode = 1;
  }
}

function commandSummarizeManifest(args) {
  writeStdout(summarizeValidationManifest(readJson(args.file)));
}

function commandValidateMutationRegistry(args) {
  const result = validateMutationRegistry(readJson(args.file));
  printValidation(result, "Mutation endpoint registry is valid.");
  if (!result.ok) {
    process.exitCode = 1;
  }
}

const COMMAND_HANDLERS = {
  "ci-plan": commandCiPlan,
  "compute-risk-floor": commandComputeRiskFloor,
  "scan-changed-secrets": commandScanChangedSecrets,
  "validate-manifest": commandValidateManifest,
  "summarize-manifest": commandSummarizeManifest,
  "validate-mutation-registry": commandValidateMutationRegistry,
  "validate-workflow-security": commandValidateWorkflowSecurity,
};

async function main(argv = process.argv.slice(2)) {
  if (argv[0] === "--") {
    argv = argv.slice(1);
  }
  const [command, ...rest] = argv;
  const args = parseArgs(rest);

  try {
    const handler = COMMAND_HANDLERS[command];
    if (!handler) {
      writeStdout(usage());
      process.exitCode = command ? 1 : 0;
      return;
    }
    await handler(args);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  CI_PLAN_SCHEMA_VERSION,
  EXISTING_REVIEWBOT_INITIAL_LANES,
  MUTATION_REGISTRY_SCHEMA_VERSION,
  SECRET_SCAN_SCHEMA_VERSION,
  VALIDATION_MANIFEST_SCHEMA_VERSION,
  WORKFLOW_SECURITY_SCHEMA_VERSION,
  classifyChangedFiles,
  createCiPlan,
  inferRouteImpacts,
  normalizePath,
  parseArgs,
  scanFilesForSecrets,
  summarizeValidationManifest,
  validateArtifactPointer,
  validateMutationRegistry,
  validateValidationManifest,
  validateWorkflowSecurityFiles,
};
