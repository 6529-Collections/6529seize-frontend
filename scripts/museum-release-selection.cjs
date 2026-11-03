#!/usr/bin/env node
"use strict";

const { execFileSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const {
  CONTRACT: CLASSIFICATION_CONTRACT,
  classifyRange,
  isIntegrityPath,
  isMuseumPath,
} = require("./museum-release-tier.cjs");

const CONTRACT = "museum-release-selection-v1";
const ACTIVATION_MODES = new Set(["tiered", "full"]);
const HOLD_STATES = new Set(["clear", "active", "unknown"]);
const ENVIRONMENTS = new Set(["pr", "staging", "production"]);
const TIERS = new Set(["NONE", "P0", "P1", "P2", "P3"]);
const EXACT_COMMIT_PATTERN = /^[a-f0-9]{40}$/u;
const STATIC_CORPUS_CONTRACT =
  "__tests__/lib/museum/publication/corpusContracts.test.ts";
const SELECTION_POLICY = "affected-pages-v1";
// Network IA is the PR lane's always-on gate, so it is a pack only in the
// deployed environments.
const GATE_PACK_KEY = "network-ia";
const PACK_KEYS = Object.freeze([
  "data-architecture",
  "institutional-practice",
  "about",
  "inside-system",
  "rights",
  GATE_PACK_KEY,
]);
const SPEC_PACK_KEYS = Object.freeze({
  "tests/museum/about-readonly.spec.ts": "about",
  "tests/museum/data-architecture-readonly.spec.ts": "data-architecture",
  "tests/museum/inside-system-readonly.spec.ts": "inside-system",
  "tests/museum/institutional-practice-readonly.spec.ts":
    "institutional-practice",
  "tests/museum/network-ia-readonly.spec.ts": GATE_PACK_KEY,
  "tests/museum/rights-readonly.spec.ts": "rights",
});
const SOURCE_ROOTS = Object.freeze([
  "app/museum",
  "components/museum",
  "lib/museum",
]);
const MUSEUM_MESSAGES_PATH = "i18n/messages/museum.en-US.json";
// Changes to the selection machinery itself must prove every pack still runs.
const SELECTION_CONTROL_PATTERNS = Object.freeze([
  /^scripts\/(?:museum-|e2e-packs|sync-e2e-manifest|app-pr-ci-effective-plan)/u,
  /^ops\/testing-strategy\/museum-/u,
  /^tests\/packs\.manifest\.cjs$/u,
]);
// Lane wiring and dependency changes are checked by the Network IA gate alone.
const GATE_PATTERNS = Object.freeze([
  /^\.github\/workflows\/(?:app-pr-ci|staging-e2e|staging-e2e-dispatch|production-e2e|production-e2e-dispatch|museum-publication-compatibility)\.ya?ml$/u,
  /^ops\/scripts\/(?:artifact-portability|testing-strategy|verify-production-artifact)/u,
  /^(?:package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml)$/u,
]);

function packName(environment, key) {
  return environment === "pr" ? `test:e2e:museum-${key}` : `museum-${key}`;
}

function environmentPackKeys(environment) {
  return PACK_KEYS.filter(
    (key) => environment !== "pr" || key !== GATE_PACK_KEY
  );
}

const PACKS = Object.freeze(
  Object.fromEntries(
    ["pr", "production", "staging"].map((environment) => [
      environment,
      Object.freeze(
        environmentPackKeys(environment).map((key) =>
          packName(environment, key)
        )
      ),
    ])
  )
);
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

function git(root, args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

// Source files under the Museum roots at `commit` that contain any needle.
function referencingFiles(root, commit, needles) {
  try {
    return git(root, [
      "grep",
      "-l",
      "-F",
      ...needles.flatMap((needle) => ["-e", needle]),
      commit,
      "--",
      ...SOURCE_ROOTS,
    ])
      .split("\n")
      .filter(Boolean)
      .map((line) => line.slice(commit.length + 1));
  } catch (error) {
    if (error && error.status === 1) {
      return [];
    }
    throw error;
  }
}

function messagesAt(root, commit) {
  try {
    return JSON.parse(git(root, ["show", `${commit}:${MUSEUM_MESSAGES_PATH}`]));
  } catch {
    return {};
  }
}

// Exact string literals only, so a key never matches a longer key it prefixes.
function quotedLiterals(value) {
  return [`"${value}"`, `'${value}'`, `\`${value}\``];
}

// A copy edit affects the pages whose sources name the changed keys. Keys that
// no Museum source names as a literal make the change unmappable.
function messageReferences(root, classification) {
  const before = messagesAt(root, classification.base_sha);
  const after = messagesAt(root, classification.head_sha);
  const files = new Set();
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (before[key] === after[key]) {
      continue;
    }
    const found = referencingFiles(
      root,
      classification.head_sha,
      quotedLiterals(key)
    );
    if (found.length === 0 && Object.hasOwn(after, key)) {
      return null;
    }
    found.forEach((file) => files.add(file));
  }
  return [...files];
}

// Assets are named either as a quoted file name or as the final segment of a
// public URL; both anchors keep `a.svg` from matching `data.svg`.
function assetReferences(root, classification, file) {
  const name = path.posix.basename(file);
  const found = referencingFiles(root, classification.head_sha, [
    ...quotedLiterals(name),
    `/${name}`,
  ]);
  return found.length > 0 ? found : null;
}

function fileEffect(file) {
  if (file.startsWith("__tests__/")) {
    return { effect: "none", reason: "Unit or contract test." };
  }
  if (SELECTION_CONTROL_PATTERNS.some((pattern) => pattern.test(file))) {
    return {
      effect: "all",
      reason: "Museum selection, registry, or pack definitions changed.",
    };
  }
  if (GATE_PATTERNS.some((pattern) => pattern.test(file))) {
    return {
      effect: "gate",
      reason:
        "Museum lane workflow, packaging script, or dependencies changed.",
    };
  }
  if (file.startsWith(".github/workflows/")) {
    return { effect: "none", reason: "Workflow without Museum lanes." };
  }
  if (Object.hasOwn(SPEC_PACK_KEYS, file)) {
    return {
      effect: "packs",
      packs: [SPEC_PACK_KEYS[file]],
      reason: "Museum browser spec changed.",
    };
  }
  if (file.startsWith("tests/museum/")) {
    return { effect: "all", reason: "Unregistered Museum test file changed." };
  }
  if (isIntegrityPath(file)) {
    return {
      effect: "all",
      reason: "Publication, source-integrity, or shared-shell code changed.",
    };
  }
  if (isMuseumPath(file)) {
    return { effect: "surfaces", reason: "Museum page source changed." };
  }
  return { effect: "none", reason: "Not a Museum path." };
}

function loadSurfaceRegistry() {
  return require("./museum-surface-registry.cjs");
}

function createSurfaceMapper(root, classification) {
  const tools = loadSurfaceRegistry();
  const registry = JSON.parse(
    fs.readFileSync(path.join(root, tools.REGISTRY_PATH), "utf8")
  );
  const entryFiles = [
    ...registry.routes,
    ...registry.support_files,
    ...registry.components,
    ...registry.e2e_specs,
  ].map((entry) => entry.file);
  const graph = tools.buildReverseImportGraph(root, { entryFiles });
  const deletedEntries = tools.deletedEntriesFromGit(
    root,
    classification.base_sha,
    classification.head_sha
  );
  const specPacks = registry.e2e_specs.map((spec) => {
    if (!Object.hasOwn(SPEC_PACK_KEYS, spec.file)) {
      throw new Error(`Museum spec has no pack: ${spec.file}`);
    }
    return { key: SPEC_PACK_KEYS[spec.file], surfaces: spec.surface_ids };
  });
  return {
    specPacks,
    surfacesFor(files) {
      return tools.mapChangedFilesToSurfaces(files, {
        root,
        registry,
        graph,
        deletedEntries,
      }).affected_surfaces;
    },
  };
}

function sourceFilesFor(root, classification, file) {
  if (file === MUSEUM_MESSAGES_PATH) {
    return messageReferences(root, classification);
  }
  if (file.startsWith("public/museum/")) {
    return assetReferences(root, classification, file);
  }
  return [file];
}

function resolveFileEffect(root, classification, mapper, file) {
  const base = fileEffect(file);
  if (base.effect !== "surfaces") {
    return { file, ...base };
  }
  const sources = sourceFilesFor(root, classification, file);
  const surfaces = sources === null ? [] : mapper().surfacesFor(sources);
  if (surfaces.length === 0) {
    return {
      file,
      effect: "all",
      reason: "The changed Museum file could not be mapped to a page.",
    };
  }
  return { file, effect: "surfaces", reason: base.reason, surfaces };
}

function collectPacks(effects, specPacks) {
  const keys = new Set();
  const surfaces = new Set();
  const uncovered = new Set();
  for (const effect of effects) {
    (effect.packs ?? []).forEach((key) => keys.add(key));
    if (effect.effect === "gate") {
      keys.add(GATE_PACK_KEY);
    }
    for (const surface of effect.surfaces ?? []) {
      surfaces.add(surface);
      const covering = specPacks.filter((spec) =>
        spec.surfaces.includes(surface)
      );
      if (covering.length === 0) {
        uncovered.add(surface);
        keys.add(GATE_PACK_KEY);
      }
      covering.forEach((spec) => keys.add(spec.key));
    }
  }
  return {
    keys,
    surfaces: [...surfaces].sort(),
    uncovered: [...uncovered].sort(),
  };
}

// Selects the packs whose specs visit the pages a change can affect. Anything
// the analysis cannot map fails closed to every pack.
function affectedPageSelection(root, classification, environment) {
  let cachedMapper = null;
  const mapper = () => {
    cachedMapper ??= createSurfaceMapper(root, classification);
    return cachedMapper;
  };
  const effects = classification.changed_files.map(({ file }) =>
    resolveFileEffect(root, classification, mapper, file)
  );
  const fileEffects = effects.map(
    ({ file, effect, reason, surfaces, packs }) => ({
      file,
      effect,
      reason,
      ...(surfaces ? { surfaces } : {}),
      ...(packs ? { packs } : {}),
    })
  );
  if (effects.some((effect) => effect.effect === "all")) {
    return {
      affected_surfaces: [],
      browser_scope: "all-museum-packs",
      file_effects: fileEffects,
      selected_packs: [...PACKS[environment]],
      uncovered_surfaces: [],
    };
  }
  const specPacks = effects.some((effect) => effect.surfaces)
    ? mapper().specPacks
    : [];
  const { keys, surfaces, uncovered } = collectPacks(effects, specPacks);
  const selected = environmentPackKeys(environment)
    .filter((key) => keys.has(key))
    .map((key) => packName(environment, key));
  let browserScope = "none";
  if (selected.length > 0) {
    browserScope = "affected-pages";
  } else if (keys.has(GATE_PACK_KEY)) {
    browserScope = "gate-only";
  }
  return {
    affected_surfaces: surfaces,
    browser_scope: browserScope,
    file_effects: fileEffects,
    selected_packs: selected,
    uncovered_surfaces: uncovered,
  };
}

function analyseAffectedPages(root, classification, environment) {
  try {
    return affectedPageSelection(root, classification, environment);
  } catch (error) {
    return {
      affected_surfaces: [],
      analysis_error:
        error instanceof Error
          ? error.message
          : "Affected-page analysis failed.",
      browser_scope: "all-museum-packs",
      file_effects: [],
      selected_packs: [...PACKS[environment]],
      uncovered_surfaces: [],
    };
  }
}

function packSelection(classification, environment, activation, analysis) {
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

  // Without an affected-page analysis (for example after a failed
  // classification), every pack runs.
  if (!analysis || analysis.browser_scope === "all-museum-packs") {
    return {
      browser_scope: "all-museum-packs",
      selected_packs: [...PACKS[environment]],
      static_scope: "full",
      static_contracts: [STATIC_CORPUS_CONTRACT],
    };
  }
  return {
    browser_scope: analysis.browser_scope,
    selected_packs: [...analysis.selected_packs],
    static_scope: analysis.browser_scope === "none" ? "none" : "affected",
    static_contracts:
      analysis.browser_scope === "none" ? [] : [STATIC_CORPUS_CONTRACT],
  };
}

function needsAnalysis(classification, activation) {
  return (
    activation.effective_mode === "tiered" &&
    !["NONE", "P0"].includes(classification.tier) &&
    classification.base_sha !== "" &&
    classification.head_sha !== ""
  );
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
  const analysis = needsAnalysis(classification, activation)
    ? analyseAffectedPages(root, classification, environment)
    : null;
  const selection = packSelection(
    classification,
    environment,
    activation,
    analysis
  );
  const resolvedSourceCommit = normaliseSourceCommit(sourceCommit);
  const output = {
    activation: {
      effective_mode: activation.effective_mode,
      hold_state: normaliseHoldState(holdState),
      requested_mode: activationMode,
      reason: activation.reason,
    },
    affected_pages: analysis
      ? {
          affected_surfaces: analysis.affected_surfaces,
          file_effects: analysis.file_effects,
          uncovered_surfaces: analysis.uncovered_surfaces,
          ...(analysis.analysis_error
            ? { analysis_error: analysis.analysis_error }
            : {}),
        }
      : null,
    browser_scope: selection.browser_scope,
    classification,
    contract: CONTRACT,
    environment,
    selected_packs: selection.selected_packs,
    selection_policy: SELECTION_POLICY,
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
  fileEffect,
  normaliseSourceCommit,
  packSelection,
  selectMuseumRelease,
  verifySelectionDigest,
};
