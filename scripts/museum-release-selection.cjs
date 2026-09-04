#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const {
  CONTRACT: CLASSIFICATION_CONTRACT,
  classifyRange,
} = require("./museum-release-tier.cjs");

const CONTRACT = "museum-release-selection-v1";
const ACTIVATION_MODES = new Set(["tiered", "full"]);
const HOLD_STATES = new Set(["clear", "active", "unknown"]);
const ENVIRONMENTS = new Set(["pr", "staging", "production"]);
const TIERS = new Set(["NONE", "P0", "P1", "P2", "P3"]);
const EXACT_COMMIT_PATTERN = /^[a-f0-9]{40}$/u;
const STATIC_CORPUS_CONTRACT =
  "__tests__/lib/museum/publication/corpusContracts.test.ts";
const PACKS = Object.freeze({
  pr: Object.freeze([
    "test:e2e:museum-data-architecture",
    "test:e2e:museum-institutional-practice",
    "test:e2e:museum-about",
    "test:e2e:museum-inside-system",
    "test:e2e:museum-rights",
  ]),
  production: Object.freeze([
    "museum-data-architecture",
    "museum-institutional-practice",
    "museum-about",
    "museum-inside-system",
    "museum-rights",
  ]),
  staging: Object.freeze([
    "museum-data-architecture",
    "museum-institutional-practice",
    "museum-about",
    "museum-inside-system",
    "museum-rights",
  ]),
});
const P0_PACKS = Object.freeze({
  pr: Object.freeze(["test:e2e:museum-about"]),
  production: Object.freeze(["museum-about"]),
  staging: Object.freeze(["museum-about"]),
});

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normaliseActivationMode(value) {
  return ACTIVATION_MODES.has(value) ? value : "full";
}

function normaliseHoldState(value) {
  return HOLD_STATES.has(value) ? value : "unknown";
}

function failClosedClassification(root, base, head) {
  try {
    const classification = classifyRange(root, base, head);
    if (!TIERS.has(classification.tier)) {
      throw new Error("classifier returned an unsupported tier");
    }
    return classification;
  } catch (error) {
    return {
      affected_surfaces: [],
      base_sha: "",
      changed_files: [],
      classification_digest: "",
      contract: CLASSIFICATION_CONTRACT,
      head_sha: "",
      mode: "report_only",
      reason:
        error instanceof Error
          ? `Classification failed closed: ${error.message}`
          : "Classification failed closed.",
      tier: "P3",
    };
  }
}

function effectiveActivation({ activationMode, holdState }) {
  const requested = activationMode;
  const normalisedMode = normaliseActivationMode(requested);
  const normalisedHold = normaliseHoldState(holdState);
  if (normalisedMode !== "tiered") {
    return {
      effective_mode: "full",
      reason:
        requested === "full"
          ? "Immediate rollback switch requires every Museum pack."
          : "Invalid or missing activation mode requires every Museum pack.",
    };
  }
  if (normalisedHold !== "clear") {
    return {
      effective_mode: "full",
      reason:
        normalisedHold === "active"
          ? "An auditable Museum deployment hold is active."
          : "Museum hold state is unavailable or malformed.",
    };
  }
  return { effective_mode: "tiered", reason: "Tiered activation is clear." };
}

function packSelection(classification, environment, activation) {
  if (!ENVIRONMENTS.has(environment)) {
    throw new Error(
      "museum release selection: environment must be pr, staging, or production"
    );
  }
  if (activation.effective_mode === "full") {
    return {
      browser_scope: "all-museum-packs",
      selected_packs: [...PACKS[environment]],
      static_scope: "full",
      static_contracts: [STATIC_CORPUS_CONTRACT],
    };
  }
  if (classification.tier === "NONE") {
    return {
      browser_scope: "none",
      selected_packs: [],
      static_scope: "none",
      static_contracts: [],
    };
  }
  if (classification.tier === "P0") {
    return {
      browser_scope: "about-proposition-desktop-mobile-source-shell",
      selected_packs: [...P0_PACKS[environment]],
      static_scope: "source-shell-sentinel",
      static_contracts: [STATIC_CORPUS_CONTRACT],
    };
  }

  // Registry v1 proves surface ownership but does not yet carry trusted
  // template-to-pack mappings. P1 therefore stays a conservative superset;
  // P2/P3 require the same broad Museum pack inventory by policy.
  return {
    browser_scope: "all-museum-packs",
    selected_packs: [...PACKS[environment]],
    static_scope: classification.tier === "P1" ? "affected-plus-broad" : "full",
    static_contracts: [STATIC_CORPUS_CONTRACT],
  };
}

function normaliseSourceCommit(value) {
  if (value === "") {
    return null;
  }
  if (!EXACT_COMMIT_PATTERN.test(value)) {
    throw new Error(
      "museum release selection: source commit must be an exact 40-hex SHA"
    );
  }
  return value;
}

function selectMuseumRelease({
  activationMode = "",
  base,
  environment,
  head,
  holdState = "unknown",
  root,
  sourceCommit = "",
}) {
  if (!ENVIRONMENTS.has(environment)) {
    throw new Error(
      "museum release selection: environment must be pr, staging, or production"
    );
  }
  if (typeof root !== "string" || !path.isAbsolute(root)) {
    throw new Error("museum release selection: root must be an absolute path");
  }
  if (!base || !head) {
    throw new Error(
      "museum release selection: exact base and head refs are required"
    );
  }
  const classification = failClosedClassification(root, base, head);
  const activation = effectiveActivation({ activationMode, holdState });
  const selection = packSelection(classification, environment, activation);
  const resolvedSourceCommit = normaliseSourceCommit(sourceCommit);
  const output = {
    activation: {
      effective_mode: activation.effective_mode,
      hold_state: normaliseHoldState(holdState),
      requested_mode: activationMode,
      reason: activation.reason,
    },
    browser_scope: selection.browser_scope,
    classification,
    contract: CONTRACT,
    environment,
    selected_packs: selection.selected_packs,
    source_commit: resolvedSourceCommit,
    static_contracts: selection.static_contracts,
    static_scope: selection.static_scope,
  };
  return {
    ...output,
    selection_digest: sha256(JSON.stringify(output)),
  };
}

function verifySelectionDigest(selection) {
  if (
    typeof selection !== "object" ||
    selection === null ||
    Array.isArray(selection) ||
    typeof selection.selection_digest !== "string" ||
    !/^[a-f0-9]{64}$/u.test(selection.selection_digest)
  ) {
    return false;
  }
  const { selection_digest: claimedDigest, ...unsigned } = selection;
  const expectedDigest = sha256(JSON.stringify(unsigned));
  return crypto.timingSafeEqual(
    Buffer.from(claimedDigest, "hex"),
    Buffer.from(expectedDigest, "hex")
  );
}

function readOption(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? "" : (argv[index + 1] ?? "");
}

function main(argv = process.argv.slice(2)) {
  const base = readOption(argv, "--base");
  const head = readOption(argv, "--head");
  const environment = readOption(argv, "--environment");
  const output = readOption(argv, "--output");
  const activationMode = readOption(argv, "--activation-mode");
  const holdState = readOption(argv, "--hold-state");
  const repositoryRoot = readOption(argv, "--repository-root");
  const sourceCommit = readOption(argv, "--source-commit");
  if (!base || !head || !environment || !output) {
    throw new Error(
      "Usage: museum-release-selection.cjs --base <ref> --head <ref> --environment <pr|staging|production> --output <path> [--activation-mode <tiered|full>] [--hold-state <clear|active|unknown>] [--repository-root <absolute-path>] [--source-commit <40-hex SHA>]"
    );
  }
  const result = selectMuseumRelease({
    activationMode,
    base,
    environment,
    head,
    holdState,
    root: path.resolve(repositoryRoot || path.resolve(__dirname, "..")),
    sourceCommit,
  });
  const outputPath = path.resolve(output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "museum release selection: failed"
    );
    process.exitCode = 1;
  }
}

module.exports = {
  CONTRACT,
  PACKS,
  P0_PACKS,
  STATIC_CORPUS_CONTRACT,
  effectiveActivation,
  failClosedClassification,
  normaliseSourceCommit,
  packSelection,
  selectMuseumRelease,
  verifySelectionDigest,
};
