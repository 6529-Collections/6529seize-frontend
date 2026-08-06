"use strict";

const SCHEMA_VERSION = "artifact-portability.v1";
const COMPARISON_SCHEMA_VERSION = "artifact-portability-comparison.v1";
const CONTRACT = "artifact-portability-v1";
const HEX_SHA256_PATTERN = /^[a-f0-9]{64}$/;
const GIT_SHA_PATTERN = /^[a-f0-9]{40}$/;
const {
  PROVENANCE_SCHEMA_VERSION,
  TRUSTED_REPORT_PRODUCERS,
  createReportSourceVerifier,
} = require("./artifact-portability-report-source.cjs");

const EXPLICIT_INPUT_CATEGORIES = new Map([
  ["API_ENDPOINT", "endpoint"],
  ["WS_ENDPOINT", "endpoint"],
  ["ALLOWLIST_API_ENDPOINT", "endpoint"],
  ["BASE_ENDPOINT", "endpoint"],
  ["IPFS_API_ENDPOINT", "endpoint"],
  ["IPFS_GATEWAY_ENDPOINT", "endpoint"],
  ["MEDIA_RESOLVER_ENDPOINT", "endpoint"],
  ["ANNOUNCED_VERSION_ENDPOINT", "announcement"],
  ["NEXTGEN_CHAIN_ID", "chain"],
  ["ASSETS_FROM_S3", "asset_source"],
  ["AWS_RUM_APP_ID", "telemetry"],
  ["AWS_RUM_REGION", "telemetry"],
  ["AWS_RUM_SAMPLE_RATE", "telemetry"],
  ["NEXT_PUBLIC_MIXPANEL_TOKEN", "telemetry"],
  ["SENTRY_DSN", "sentry"],
  ["SENTRY_REPLAY_ENABLED", "sentry"],
  ["PUBLIC_REVIEW_PROFILE", "public_review_profile"],
]);

const KNOWN_RUNTIME_KEYS = new Set([
  "NODE_ENV",
  "NEXT_RUNTIME",
  "VERSION",
  "VERSION_BUILD_TIMESTAMP",
  "ASSETS_FROM_S3",
  "ALLOWLIST_API_ENDPOINT",
  "API_ENDPOINT",
  "BASE_ENDPOINT",
  "WS_ENDPOINT",
  "STAGING_API_KEY",
  "GIPHY_API_KEY",
  "IPFS_API_ENDPOINT",
  "IPFS_GATEWAY_ENDPOINT",
  "MEDIA_RESOLVER_ENDPOINT",
  "IPFS_MFS_PATH",
  "CORE_SCHEME",
  "DEV_MODE_AUTH_JWT",
  "DEV_MODE_MEMES_WAVE_ID",
  "DEV_MODE_CURATION_WAVE_ID",
  "DEV_MODE_QUORUM_WAVE_ID",
  "DEV_MODE_WALLET_ADDRESS",
  "MOBILE_APP_SCHEME",
  "NEXTGEN_CHAIN_ID",
  "USE_DEV_AUTH",
  "FARCASTER_WARPCAST_API_BASE",
  "FARCASTER_WARPCAST_API_KEY",
  "ENABLE_SECURITY_LOGGING",
  "ANNOUNCED_VERSION_ENDPOINT",
  "DROP_FORGE_TESTNET",
  "STANDALONE_MAIN_SITE_BASE",
  "FEATURE_AB_CARD",
  "NEXT_PUBLIC_PROFILE_CMS_BUILDER_API_ENABLED",
  "NEXT_PUBLIC_PROFILE_CMS_BUILDER_ENABLED",
  "NEXT_PUBLIC_CLOUDFRONT_DOMAIN",
  "NEXT_PUBLIC_DEBUG_NAV",
  "NEXT_PUBLIC_FEATURE_AB_CARD",
  "PROFILE_CMS_BUILDER_API_ENABLED",
  "PROFILE_CMS_BUILDER_ENABLED",
  "PROFILE_CMS_RUNTIME_ENABLED",
  "PROFILE_CMS_RUNTIME_FIXTURE_PRIMARY",
  "NEXT_PUBLIC_VITE_FEATURE_AB_CARD",
  "VITE_FEATURE_AB_CARD",
  "PEPE_CACHE_MAX_ITEMS",
  "PEPE_CACHE_TTL_MINUTES",
  "AWS_RUM_APP_ID",
  "AWS_RUM_REGION",
  "AWS_RUM_SAMPLE_RATE",
  "NEXT_PUBLIC_MIXPANEL_TOKEN",
  "SENTRY_DSN",
  "SENTRY_REPLAY_ENABLED",
  "PORT",
  "PORT_SEARCH_LIMIT",
]);

const BAKED_INPUTS = Object.freeze(
  [...new Set([...KNOWN_RUNTIME_KEYS, ...EXPLICIT_INPUT_CATEGORIES.keys()])]
    .sort(compareStrings)
    .map((name) =>
      Object.freeze({
        name,
        category: EXPLICIT_INPUT_CATEGORIES.get(name) || "runtime_config",
        classification: EXPLICIT_INPUT_CATEGORIES.has(name)
          ? "explicit_environment_bound"
          : "known_runtime_fail_closed",
        environment_bound: true,
      })
    )
);

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function compareStrings(left, right) {
  return left.localeCompare(right, "en");
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertExactKeys(value, expectedKeys, label) {
  invariant(isPlainObject(value), `${label} must be an object`);
  const actual = Object.keys(value).sort(compareStrings);
  const expected = [...expectedKeys].sort(compareStrings);
  invariant(
    actual.length === expected.length &&
      actual.every((key, index) => key === expected[index]),
    `${label} keys are invalid`
  );
}

function assertSha256(value, label) {
  invariant(
    typeof value === "string" && HEX_SHA256_PATTERN.test(value),
    `${label} must be a SHA-256 digest`
  );
}

function assertStringArray(value, label, { minItems = 0, maxItems } = {}) {
  invariant(
    Array.isArray(value) &&
      value.length >= minItems &&
      (maxItems === undefined || value.length <= maxItems) &&
      value.every((item) => typeof item === "string" && item.length > 0),
    `${label} must be a non-empty-string array`
  );
}

function validateIdentity(inventory) {
  assertExactKeys(inventory.source, ["git_sha"], "inventory source");
  invariant(
    GIT_SHA_PATTERN.test(inventory.source.git_sha),
    "inventory source SHA is invalid"
  );
  assertExactKeys(
    inventory.artifact,
    ["contract", "contract_version", "manifest_sha256", "package_size_bytes"],
    "inventory artifact"
  );
  invariant(
    inventory.artifact.contract === null ||
      (typeof inventory.artifact.contract === "string" &&
        inventory.artifact.contract.length > 0),
    "inventory artifact contract is invalid"
  );
  invariant(
    typeof inventory.artifact.contract_version === "string" &&
      inventory.artifact.contract_version.length > 0,
    "inventory artifact contract version is invalid"
  );
  assertSha256(inventory.artifact.manifest_sha256, "inventory manifest digest");
  invariant(
    Number.isInteger(inventory.artifact.package_size_bytes) &&
      inventory.artifact.package_size_bytes > 0,
    "inventory package size is invalid"
  );
  assertExactKeys(
    inventory.digests,
    [
      "source_sha",
      "content_sha256",
      "toolchain_sha256",
      "package_sha256",
      "runtime_config_sha256",
    ],
    "inventory digests"
  );
  invariant(
    inventory.digests.source_sha === inventory.source.git_sha,
    "inventory source digest does not match source identity"
  );
  for (const key of [
    "content_sha256",
    "toolchain_sha256",
    "package_sha256",
    "runtime_config_sha256",
  ]) {
    assertSha256(inventory.digests[key], `inventory digest ${key}`);
  }
}

function validateContent(inventory) {
  assertExactKeys(inventory.content, ["roots"], "inventory content");
  invariant(
    Array.isArray(inventory.content.roots) &&
      inventory.content.roots.length > 0,
    "inventory content roots are invalid"
  );
  const paths = new Set();
  for (const root of inventory.content.roots) {
    assertExactKeys(
      root,
      ["path", "sha256", "file_count"],
      "inventory content root"
    );
    invariant(
      typeof root.path === "string" &&
        root.path.length > 0 &&
        !paths.has(root.path),
      "inventory content root path is invalid or duplicated"
    );
    paths.add(root.path);
    assertSha256(root.sha256, "inventory content root digest");
    invariant(
      Number.isInteger(root.file_count) && root.file_count >= 0,
      "inventory content root file count is invalid"
    );
  }
}

function validateToolchainAndRuntime(inventory) {
  assertExactKeys(
    inventory.toolchain,
    ["digest", "inputs"],
    "inventory toolchain"
  );
  assertSha256(inventory.toolchain.digest, "inventory toolchain digest");
  invariant(
    inventory.toolchain.digest === inventory.digests.toolchain_sha256,
    "inventory toolchain digest does not match digests"
  );
  assertExactKeys(
    inventory.toolchain.inputs,
    ["package_json_sha256", "pnpm_lock_sha256", "node_version", "pnpm_version"],
    "inventory toolchain inputs"
  );
  assertSha256(
    inventory.toolchain.inputs.package_json_sha256,
    "inventory package.json digest"
  );
  assertSha256(
    inventory.toolchain.inputs.pnpm_lock_sha256,
    "inventory pnpm lock digest"
  );
  invariant(
    typeof inventory.toolchain.inputs.node_version === "string" &&
      inventory.toolchain.inputs.node_version.length > 0,
    "inventory Node version is invalid"
  );
  invariant(
    inventory.toolchain.inputs.pnpm_version === null ||
      (typeof inventory.toolchain.inputs.pnpm_version === "string" &&
        inventory.toolchain.inputs.pnpm_version.length > 0),
    "inventory pnpm version is invalid"
  );
  assertExactKeys(
    inventory.runtime_config,
    ["source_paths", "sha256", "key_count"],
    "inventory runtime config"
  );
  assertStringArray(
    inventory.runtime_config.source_paths,
    "inventory runtime source paths",
    {
      minItems: 1,
    }
  );
  assertSha256(
    inventory.runtime_config.sha256,
    "inventory runtime config digest"
  );
  invariant(
    inventory.runtime_config.sha256 === inventory.digests.runtime_config_sha256,
    "inventory runtime config digest does not match digests"
  );
  invariant(
    Number.isInteger(inventory.runtime_config.key_count) &&
      inventory.runtime_config.key_count >= 0,
    "inventory runtime config key count is invalid"
  );
}

function validateBakedInputs(inventory) {
  invariant(
    Array.isArray(inventory.baked_inputs) &&
      inventory.baked_inputs.length >= BAKED_INPUTS.length,
    "inventory baked_inputs must cover every known runtime key"
  );
  const byName = new Map();
  const classifications = new Set([
    "explicit_environment_bound",
    "known_runtime_fail_closed",
    "unclassified_runtime_fail_closed",
  ]);
  for (const input of inventory.baked_inputs) {
    assertExactKeys(
      input,
      [
        "name",
        "category",
        "classification",
        "environment_bound",
        "present",
        "source",
        "value_sha256",
      ],
      "inventory baked input"
    );
    invariant(
      typeof input.name === "string" &&
        input.name.length > 0 &&
        !byName.has(input.name),
      "inventory baked input name is invalid or duplicated"
    );
    invariant(
      typeof input.category === "string" &&
        input.category.length > 0 &&
        classifications.has(input.classification) &&
        input.environment_bound === true &&
        typeof input.present === "boolean" &&
        typeof input.source === "string" &&
        input.source.length > 0,
      `inventory baked input shape is invalid: ${input.name}`
    );
    invariant(
      (input.present && HEX_SHA256_PATTERN.test(input.value_sha256 || "")) ||
        (!input.present && input.value_sha256 === null),
      `inventory baked input digest is invalid: ${input.name}`
    );
    byName.set(input.name, input);
  }
  for (const descriptor of BAKED_INPUTS) {
    invariant(
      byName.has(descriptor.name),
      `inventory omits known runtime input: ${descriptor.name}`
    );
  }
  assertStringArray(
    inventory.unclassified_runtime_keys,
    "inventory unclassified runtime keys"
  );
  const expectedUnknown = [...byName.values()]
    .filter(
      (input) => input.classification === "unclassified_runtime_fail_closed"
    )
    .map((input) => input.name)
    .sort(compareStrings);
  invariant(
    JSON.stringify(
      [...inventory.unclassified_runtime_keys].sort(compareStrings)
    ) === JSON.stringify(expectedUnknown),
    "inventory unclassified runtime keys do not match classifications"
  );
  return byName;
}

function validateScanInput(input, bakedByName, scanByName) {
  assertExactKeys(
    input,
    [
      "name",
      "present",
      "value_sha256",
      "matched",
      "matched_file_count",
      "matched_paths_sha256",
      "sample_paths",
    ],
    "inventory package scan input"
  );
  invariant(
    typeof input.name === "string" &&
      bakedByName.has(input.name) &&
      !scanByName.has(input.name),
    "inventory package scan input name is invalid or duplicated"
  );
  const bakedInput = bakedByName.get(input.name);
  invariant(
    input.present === bakedInput.present &&
      input.value_sha256 === bakedInput.value_sha256,
    `inventory package scan input does not match baked input: ${input.name}`
  );
  invariant(
    typeof input.matched === "boolean" &&
      Number.isInteger(input.matched_file_count) &&
      input.matched_file_count >= 0 &&
      input.matched === input.matched_file_count > 0,
    `inventory package scan match count is invalid: ${input.name}`
  );
  assertSha256(
    input.matched_paths_sha256,
    `inventory package scan path digest: ${input.name}`
  );
  assertStringArray(
    input.sample_paths,
    `inventory package scan samples: ${input.name}`,
    {
      maxItems: 20,
    }
  );
  invariant(
    input.sample_paths.length <= input.matched_file_count,
    `inventory package scan samples exceed matches: ${input.name}`
  );
  scanByName.set(input.name, input);
}

function validatePackageScan(inventory, bakedByName) {
  const scan = inventory.package_scan;
  assertExactKeys(
    scan,
    [
      "root_name",
      "scan_mode",
      "scan_complete",
      "tree_sha256",
      "file_count",
      "total_bytes",
      "input_count",
      "present_input_count",
      "matched_input_count",
      "inputs",
    ],
    "inventory package scan"
  );
  invariant(
    typeof scan.root_name === "string" && /^[^/\\]+$/.test(scan.root_name),
    "inventory package scan root name is invalid"
  );
  invariant(
    scan.scan_mode === "all_regular_files_exact_utf8_and_json_literals" &&
      scan.scan_complete === true,
    "inventory package scan is not complete"
  );
  assertSha256(scan.tree_sha256, "inventory package tree digest");
  invariant(
    Number.isInteger(scan.file_count) &&
      scan.file_count > 0 &&
      Number.isInteger(scan.total_bytes) &&
      scan.total_bytes > 0 &&
      Array.isArray(scan.inputs),
    "inventory package scan totals are invalid"
  );
  const scanByName = new Map();
  for (const input of scan.inputs) {
    validateScanInput(input, bakedByName, scanByName);
  }
  invariant(
    scanByName.size === bakedByName.size &&
      scan.input_count === scanByName.size &&
      scan.present_input_count ===
        [...scanByName.values()].filter((input) => input.present).length &&
      scan.matched_input_count ===
        [...scanByName.values()].filter((input) => input.matched).length,
    "inventory package scan coverage totals are invalid"
  );
}

function validatePortability(inventory) {
  assertExactKeys(
    inventory.portability,
    [
      "status",
      "portable",
      "reuse_authorized",
      "promotion_authorized",
      "blockers",
    ],
    "inventory portability"
  );
  invariant(
    inventory.portability.status === "NOT_PORTABLE" &&
      inventory.portability.portable === false &&
      inventory.portability.reuse_authorized === false &&
      inventory.portability.promotion_authorized === false,
    "inventory must fail closed as NOT_PORTABLE"
  );
  assertStringArray(
    inventory.portability.blockers,
    "inventory portability blockers",
    {
      minItems: 1,
    }
  );
}

function validateInventory(inventory) {
  assertExactKeys(
    inventory,
    [
      "schema_version",
      "contract",
      "mode",
      "repository",
      "environment",
      "source",
      "artifact",
      "digests",
      "content",
      "toolchain",
      "runtime_config",
      "baked_inputs",
      "unclassified_runtime_keys",
      "package_scan",
      "portability",
    ],
    "inventory"
  );
  invariant(
    inventory.schema_version === SCHEMA_VERSION,
    "inventory schema version is invalid"
  );
  invariant(inventory.contract === CONTRACT, "inventory contract is invalid");
  invariant(
    inventory.mode === "report_only",
    "inventory mode must be report_only"
  );
  invariant(
    inventory.repository === "frontend",
    "inventory repository is invalid"
  );
  invariant(
    inventory.environment === "staging" ||
      inventory.environment === "production",
    "inventory environment is invalid"
  );
  validateIdentity(inventory);
  validateContent(inventory);
  validateToolchainAndRuntime(inventory);
  const bakedByName = validateBakedInputs(inventory);
  validatePackageScan(inventory, bakedByName);
  validatePortability(inventory);
  return inventory;
}

const { verifyReportRun, verifyReportSource } = createReportSourceVerifier({
  GIT_SHA_PATTERN,
  validateInventory,
});

module.exports = {
  BAKED_INPUTS,
  COMPARISON_SCHEMA_VERSION,
  CONTRACT,
  GIT_SHA_PATTERN,
  HEX_SHA256_PATTERN,
  KNOWN_RUNTIME_KEYS,
  PROVENANCE_SCHEMA_VERSION,
  SCHEMA_VERSION,
  TRUSTED_REPORT_PRODUCERS,
  validateInventory,
  verifyReportRun,
  verifyReportSource,
};
