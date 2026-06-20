#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const VALIDATION_MANIFEST_SCHEMA_VERSION =
  "frontend-testing.validation-manifest.v1";
const MUTATION_REGISTRY_SCHEMA_VERSION =
  "frontend-testing.mutation-endpoint-registry.v1";
const MAX_RISK_LEVEL = 5;
const EXISTING_REVIEWBOT_INITIAL_LANES = Object.freeze([
  "general",
  "wcag",
  "i18n",
  "security",
  "responsiveness",
]);
const ARTIFACT_URI_PREFIXES = [
  "s3://",
  "ipfs://",
  "ipns://",
  "https://artifacts.6529.io/",
  "https://6529-artifacts",
];
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

const RISK_RULES = [
  {
    level: 5,
    name: "credentials-or-secrets",
    patterns: [
      /(^|\/)\.env($|[./_-])/,
      /(^|\/)(credentials?|secrets?|secret-handling|private[-_]?key)(\/|\.|$)/,
      /(^|\/)(staging_auth|staging_api_key|wallet[-_]?seed)(\/|\.|$)/,
    ],
    reason: "Credentials or secret-handling paths require release-captain review.",
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
      /^next\.config\./,
      /^sentry\./,
      /^scripts\/(build|start|dev|run-secure|enforce|require-6529|quality|typecheck)/,
      /(^|\/)(deploy|deployment|release|rollback|fix-forward)(\/|\.|$)/,
    ],
    reason: "Deployment, release, build, and operational controls affect promotion safety.",
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
    reason: "Native or cross-surface runtime behavior needs broader validation.",
  },
  {
    level: 3,
    name: "auth-wallet-upload-admin",
    patterns: [
      /(^|\/)(auth|session|login|logout|oauth|cookie|jwt|token)(\/|\.|$)/,
      /(^|\/)(wallet|wagmi|viem|ethers|ens)(\/|\.|$)/,
      /(^|\/)(profile|identity|tdh|delegation|owner|ownership)(\/|\.|$)/,
      /(^|\/)(upload|uploads|media|link-preview|open-graph|sanitize|safe-url)(\/|\.|$)/,
      /(^|\/)(waves?|drops?|posting|moderation|admin|vote|delete)(\/|\.|$)/,
    ],
    reason: "Auth, wallet, upload, posting, moderation, and admin paths are guarded.",
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
    reason: "API models, route handlers, and shared data paths can affect trust boundaries.",
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
      /^utils\//,
      /^styles\//,
      /^i18n\//,
    ],
    reason: "User-visible app behavior needs standard browser and component evidence.",
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
    .replace(/\\/g, "/")
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
    RISK_RULES[RISK_RULES.length - 1]
  );
}

function inferRouteImpacts(files) {
  const routes = new Set();

  for (const file of files.map(normalizePath)) {
    const appMatch = /^app\/(.+)\/(?:page|layout|template|loading|error|not-found)\.(tsx?|jsx?)$/.exec(
      file,
    );
    if (appMatch) {
      const route = `/${appMatch[1]
        .replace(/\([^)]*\)\//g, "")
        .replace(/\/?page$/, "")
        .replace(/\/index$/, "")
        .replace(/\[[^\]]+\]/g, ":param")}`;
      routes.add(route === "/." ? "/" : route);
    }

    const pagesMatch = /^pages\/(.+)\.(tsx?|jsx?)$/.exec(file);
    if (pagesMatch && !pagesMatch[1].startsWith("api/")) {
      routes.add(`/${pagesMatch[1].replace(/\/index$/, "")}`);
    }
  }

  return [...routes].sort();
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
    0,
  );
  const modifiers = [];

  if (
    computedFloor < 4 &&
    fileEntries.some((file) => matchesAny(file.normalized, FEATURE_FLAG_PATTERNS))
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
    fileEntries.some((file) => matchesAny(file.normalized, I18N_PAYLOAD_PATTERNS))
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
    route_impacts: inferRouteImpacts(fileEntries.map((file) => file.normalized)),
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
        "must be a durable artifact pointer, not a local path or Git LFS object",
      );
    }
    if (!ARTIFACT_URI_PREFIXES.some((candidate) => lowerUri.startsWith(candidate))) {
      pushError(
        errors,
        `${prefix}.uri`,
        `must start with one of ${ARTIFACT_URI_PREFIXES.join(", ")}`,
      );
    }
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
      "must include at least one integrity field: sha256, cid, etag, or version_id",
    );
  }

  if (!ARTIFACT_REDACTION_STATUSES.has(artifact.redaction_status)) {
    pushError(
      errors,
      `${prefix}.redaction_status`,
      `must be one of ${[...ARTIFACT_REDACTION_STATUSES].join(", ")}`,
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
        `must include existing reviewbot lane: ${lane}`,
      );
    }
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
      `must be ${VALIDATION_MANIFEST_SCHEMA_VERSION}`,
    );
  }

  const risk = manifest.risk || {};
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

  if (!Array.isArray(manifest.changed_files)) {
    pushError(errors, "changed_files", "must be an array");
  }

  const hazards = manifest.hazards || [];
  if (!Array.isArray(hazards)) {
    pushError(errors, "hazards", "must be an array");
  } else {
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

  const commands = manifest.commands || [];
  if (!Array.isArray(commands)) {
    pushError(errors, "commands", "must be an array");
  } else {
    commands.forEach((command, index) => {
      if (!command?.command) {
        pushError(errors, `commands[${index}].command`, "required");
      }
      if (!COMMAND_STATUSES.has(command?.status)) {
        pushError(
          errors,
          `commands[${index}].status`,
          `must be one of ${[...COMMAND_STATUSES].join(", ")}`,
        );
      }
    });
  }

  const artifacts = manifest.artifacts || [];
  if (!Array.isArray(artifacts)) {
    pushError(errors, "artifacts", "must be an array");
  } else {
    artifacts.forEach((artifact, index) => {
      errors.push(...validateArtifactPointer(artifact, index));
    });
  }

  if (isIntegerRisk(risk.final) && risk.final >= 3 && artifacts.length === 0) {
    pushError(
      errors,
      "artifacts",
      "Level 3+ manifests require at least one validated durable artifact pointer",
    );
  }

  validateReviewbotLanes(manifest.review, errors);

  if (!manifest.review?.reviewbot?.required_lanes) {
    pushError(
      errors,
      "review.reviewbot.required_lanes",
      "required; every PR must preserve the existing reviewbot lanes",
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
      `must be ${MUTATION_REGISTRY_SCHEMA_VERSION}`,
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
      pushError(errors, `${prefix}.methods`, "must include at least one method");
    } else {
      for (const method of endpoint.methods) {
        if (!HTTP_METHODS.has(method)) {
          pushError(errors, `${prefix}.methods`, `invalid HTTP method: ${method}`);
        }
      }
    }
    if (!endpoint.surface) {
      pushError(errors, `${prefix}.surface`, "required");
    }
    if (!isIntegerRisk(endpoint.risk_level)) {
      pushError(errors, `${prefix}.risk_level`, "must be an integer from 0 through 5");
    }
    if (endpoint.mutation !== true) {
      pushError(errors, `${prefix}.mutation`, "must be true for registry entries");
    }
    if (endpoint.allowed_in_readonly_tests !== false) {
      pushError(
        errors,
        `${prefix}.allowed_in_readonly_tests`,
        "must be false unless a separate allowlist explicitly handles the endpoint",
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
  console.log(successMessage);
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
  return candidates.find((candidate) => fs.existsSync(candidate)) || "git";
}

function changedFilesFromGit(baseRef, cwd = process.cwd()) {
  const diffResult = spawnSync(
    resolveGitCommand(),
    ["diff", "--name-only", "--diff-filter=ACMR", "-z", `${baseRef}...HEAD`],
    {
      cwd,
      encoding: "buffer",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  if (diffResult.status !== 0) {
    throw new Error(diffResult.stderr.toString("utf8").trim() || "git diff failed");
  }

  const workspaceResult = spawnSync(
    resolveGitCommand(),
    ["diff", "--name-only", "--diff-filter=ACMR", "-z", "HEAD"],
    {
      cwd,
      encoding: "buffer",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  if (workspaceResult.status !== 0) {
    throw new Error(
      workspaceResult.stderr.toString("utf8").trim() ||
        "git diff HEAD failed",
    );
  }

  const untrackedResult = spawnSync(
    resolveGitCommand(),
    ["ls-files", "--others", "--exclude-standard", "-z"],
    {
      cwd,
      encoding: "buffer",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  if (untrackedResult.status !== 0) {
    throw new Error(
      untrackedResult.stderr.toString("utf8").trim() ||
        "git ls-files --others failed",
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
  node ops/scripts/testing-strategy.cjs validate-manifest --file <file>
  node ops/scripts/testing-strategy.cjs summarize-manifest --file <file>
  node ops/scripts/testing-strategy.cjs validate-mutation-registry --file <file>
`;
}

async function main(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv;
  const args = parseArgs(rest);

  try {
    switch (command) {
      case "compute-risk-floor": {
        const result = classifyChangedFiles(filesFromArgs(args));
        if (args.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`Risk floor: ${result.risk_level}`);
          for (const reason of result.reasons) {
            console.log(`- ${reason.path}: level-${reason.level} (${reason.rule})`);
          }
          for (const modifier of result.modifiers) {
            console.log(`- modifier ${modifier.name}: ${modifier.reason}`);
          }
        }
        break;
      }
      case "validate-manifest": {
        const result = validateValidationManifest(readJson(args.file));
        printValidation(result, "Validation manifest is valid.");
        if (!result.ok) {
          process.exitCode = 1;
        }
        break;
      }
      case "summarize-manifest": {
        console.log(summarizeValidationManifest(readJson(args.file)));
        break;
      }
      case "validate-mutation-registry": {
        const result = validateMutationRegistry(readJson(args.file));
        printValidation(result, "Mutation endpoint registry is valid.");
        if (!result.ok) {
          process.exitCode = 1;
        }
        break;
      }
      default:
        console.log(usage());
        process.exitCode = command ? 1 : 0;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  EXISTING_REVIEWBOT_INITIAL_LANES,
  MUTATION_REGISTRY_SCHEMA_VERSION,
  VALIDATION_MANIFEST_SCHEMA_VERSION,
  classifyChangedFiles,
  inferRouteImpacts,
  normalizePath,
  parseArgs,
  summarizeValidationManifest,
  validateArtifactPointer,
  validateMutationRegistry,
  validateValidationManifest,
};
