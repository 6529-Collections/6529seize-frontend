#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_MINIMUM_RELEASE_AGE_MINUTES = 7 * 24 * 60;
const INSTALL_SCRIPT_NAMES = new Set([
  "preinstall",
  "install",
  "postinstall",
  "prepublish",
  "prepare",
]);

const HIGH_RISK_EXACT_PACKAGES = new Set([
  "@openapitools/openapi-generator-cli",
  "@types/react",
  "@types/react-dom",
  "@wagmi/core",
  "cheerio",
  "eslint",
  "eslint-config-next",
  "esbuild",
  "ethers",
  "highlight.js",
  "html-to-image",
  "next",
  "react",
  "react-dom",
  "react-markdown",
  "rehype-external-links",
  "rehype-sanitize",
  "remark-gfm",
  "sharp",
  "typescript",
  "typescript-eslint",
  "unified",
  "viem",
  "wagmi",
]);

const HIGH_RISK_PREFIXES = [
  "@capacitor/",
  "@reown/",
  "@sentry/",
  "@typescript-eslint/",
  "@wagmi/",
  "@walletconnect/",
  "eslint-",
];

const MANAGED_LABELS = [
  "risk:low",
  "risk:medium",
  "risk:high",
  "deps:dev-only",
  "deps:runtime",
  "deps:patch",
  "deps:minor",
  "deps:major",
  "deps:mixed",
  "deps:new-package",
  "deps:install-script",
  "auto-merge:candidate",
  "auto-merge:blocked",
];

const LABEL_ORDER = new Map(
  MANAGED_LABELS.map((label, index) => [label, index])
);

function compareStrings(left, right) {
  return left.localeCompare(right);
}

function parsePackageJson(value, label) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new Error(`Failed to parse ${label}: ${error.message}`);
    }
  }

  if (value && typeof value === "object") {
    return value;
  }

  throw new Error(`${label} must be a JSON string or object.`);
}

function parseExactVersion(version) {
  if (typeof version !== "string") {
    return null;
  }

  const cleaned = version.trim().replace(/^[=v]/, "").split(/[+-]/)[0];
  const match = /^(\d+)\.(\d+)\.(\d+)(?:\D.*)?$/.exec(cleaned);
  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function getUpdateType(fromVersion, toVersion) {
  if (!fromVersion && toVersion) {
    return "new";
  }

  if (fromVersion && !toVersion) {
    return "removed";
  }

  const from = parseExactVersion(fromVersion);
  const to = parseExactVersion(toVersion);
  if (!from || !to) {
    return fromVersion === toVersion ? "unchanged" : "mixed";
  }

  if (to.major < from.major) {
    return "downgrade";
  }

  if (to.major !== from.major) {
    return "major";
  }

  if (to.minor < from.minor) {
    return "downgrade";
  }

  if (to.minor !== from.minor) {
    return "minor";
  }

  if (to.patch < from.patch) {
    return "downgrade";
  }

  if (to.patch !== from.patch) {
    return "patch";
  }

  return fromVersion === toVersion ? "unchanged" : "mixed";
}

function collectDirectDependencyChanges(basePackageJson, headPackageJson) {
  const fields = [
    { field: "dependencies", dependencyType: "production" },
    { field: "devDependencies", dependencyType: "development" },
  ];
  const changes = [];

  for (const { field, dependencyType } of fields) {
    const baseDeps = basePackageJson[field] ?? {};
    const headDeps = headPackageJson[field] ?? {};
    const names = new Set([...Object.keys(baseDeps), ...Object.keys(headDeps)]);

    for (const name of [...names].sort(compareStrings)) {
      const from = baseDeps[name];
      const to = headDeps[name];
      if (from === to) {
        continue;
      }

      changes.push({
        name,
        field,
        dependencyType,
        from: from ?? null,
        to: to ?? null,
        updateType: getUpdateType(from, to),
      });
    }
  }

  return changes;
}

function stripYamlQuotes(value) {
  const trimmed = value.trim();
  if (trimmed.length < 2) {
    return trimmed;
  }

  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  if ((first === "'" && last === "'") || (first === '"' && last === '"')) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function collectPnpmPackageKeys(lockfileText) {
  if (!lockfileText) {
    return [];
  }

  const keys = [];
  let inPackages = false;

  for (const line of lockfileText.split(/\r?\n/)) {
    if (/^packages:\s*$/.test(line)) {
      inPackages = true;
      continue;
    }

    if (inPackages && /^\S/.test(line) && !/^packages:\s*$/.test(line)) {
      break;
    }

    if (!inPackages) {
      continue;
    }

    const match = /^ {2}([^ ].*):\s*$/.exec(line);
    if (match) {
      keys.push(stripYamlQuotes(match[1]));
    }
  }

  return keys;
}

function collectRequiresBuildPackageKeys(lockfileText) {
  if (!lockfileText) {
    return new Set();
  }

  const packageKeys = new Set();
  let inPackages = false;
  let currentPackageKey = null;

  for (const line of lockfileText.split(/\r?\n/)) {
    if (/^packages:\s*$/.test(line)) {
      inPackages = true;
      continue;
    }

    if (inPackages && /^\S/.test(line) && !/^packages:\s*$/.test(line)) {
      break;
    }

    if (!inPackages) {
      continue;
    }

    const packageMatch = /^ {2}([^ ].*):\s*$/.exec(line);
    if (packageMatch) {
      currentPackageKey = stripYamlQuotes(packageMatch[1]);
      continue;
    }

    if (currentPackageKey && /^ {4}requiresBuild:\s*true\s*$/.test(line)) {
      packageKeys.add(currentPackageKey);
    }
  }

  return packageKeys;
}

function getPackageNameFromPnpmKey(packageKey) {
  const withoutPeerSuffix = packageKey.replace(/^\/?/, "").split("(")[0];
  if (withoutPeerSuffix.startsWith("@")) {
    const versionSeparator = withoutPeerSuffix.indexOf("@", 1);
    return versionSeparator === -1
      ? withoutPeerSuffix
      : withoutPeerSuffix.slice(0, versionSeparator);
  }

  const versionSeparator = withoutPeerSuffix.indexOf("@");
  return versionSeparator === -1
    ? withoutPeerSuffix
    : withoutPeerSuffix.slice(0, versionSeparator);
}

function isHighRiskPackage(name) {
  return (
    HIGH_RISK_EXACT_PACKAGES.has(name) ||
    HIGH_RISK_PREFIXES.some((prefix) => name.startsWith(prefix))
  );
}

function updateTypeLabel(changes) {
  const meaningfulTypes = changes
    .map((change) => change.updateType)
    .filter((updateType) => updateType !== "unchanged");

  if (meaningfulTypes.includes("major")) {
    return "deps:major";
  }

  const unique = new Set(meaningfulTypes);
  if (unique.size === 1 && unique.has("minor")) {
    return "deps:minor";
  }

  if (unique.size === 1 && unique.has("patch")) {
    return "deps:patch";
  }

  return "deps:mixed";
}

function sortLabels(labels) {
  return [...new Set(labels)].sort((a, b) => {
    const left = LABEL_ORDER.has(a)
      ? LABEL_ORDER.get(a)
      : Number.MAX_SAFE_INTEGER;
    const right = LABEL_ORDER.has(b)
      ? LABEL_ORDER.get(b)
      : Number.MAX_SAFE_INTEGER;
    if (left !== right) {
      return left - right;
    }

    return a.localeCompare(b);
  });
}

function formatPackageChange(change) {
  return `${change.name} ${change.from ?? "(new)"} -> ${change.to ?? "(removed)"}`;
}

function getBlockingSummary(reasons) {
  return reasons.length > 0 ? reasons : ["No policy blockers detected."];
}

async function fetchRegistryPackageInfo(name, version) {
  if (typeof fetch !== "function") {
    return {
      publishedAt: null,
      scripts: {},
      error: "global fetch is not available",
    };
  }

  const encodedName = encodeURIComponent(name).replace(/^%40/, "@");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let response;

  try {
    response = await fetch(`https://registry.npmjs.org/${encodedName}`, {
      headers: {
        accept: "application/vnd.npm.install-v1+json, application/json",
      },
      signal: controller.signal,
    });
  } catch (error) {
    return {
      publishedAt: null,
      scripts: {},
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    return {
      publishedAt: null,
      scripts: {},
      error: `npm registry returned ${response.status}`,
    };
  }

  let metadata;
  try {
    metadata = await response.json();
  } catch (error) {
    return {
      publishedAt: null,
      scripts: {},
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const versionMetadata = metadata.versions?.[version] ?? {};
  const publishedAt = metadata.time?.[version]
    ? new Date(metadata.time[version])
    : null;

  return {
    publishedAt:
      publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
    scripts: versionMetadata.scripts ?? {},
    error: null,
  };
}

function formatAge(publishedAt, now) {
  const ageMs = now.getTime() - publishedAt.getTime();
  const ageDays = ageMs / (24 * 60 * 60 * 1000);
  return `${ageDays.toFixed(1)} days`;
}

async function collectRegistryFindings(directChanges, fetchPackageInfo) {
  const registryFindings = [];

  for (const change of directChanges.filter((item) => item.to)) {
    try {
      const info = await fetchPackageInfo(change.name, change.to);
      registryFindings.push({
        change,
        publishedAt: info.publishedAt ?? null,
        scripts: info.scripts ?? {},
        error: info.error ?? null,
      });
    } catch (error) {
      registryFindings.push({
        change,
        publishedAt: null,
        scripts: {},
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return registryFindings;
}

function collectPackageAgeFindings(registryFindings, now, minimumReleaseAgeMs) {
  return registryFindings.map((finding) => {
    if (!finding.publishedAt) {
      return {
        ...finding,
        status: "unknown",
      };
    }

    const ageMs = now.getTime() - finding.publishedAt.getTime();
    return {
      ...finding,
      ageMs,
      status: ageMs >= minimumReleaseAgeMs ? "old-enough" : "too-new",
    };
  });
}

function collectInstallScriptPackageNames(
  registryFindings,
  addedRequiresBuildEntries
) {
  const registryInstallScriptFindings = registryFindings.filter((finding) =>
    Object.keys(finding.scripts ?? {}).some((scriptName) =>
      INSTALL_SCRIPT_NAMES.has(scriptName)
    )
  );

  return new Set([
    ...registryInstallScriptFindings.map((finding) => finding.change.name),
    ...addedRequiresBuildEntries.map((entry) => entry.name),
  ]);
}

function formatChangeList(changes) {
  return changes.map(formatPackageChange).join(", ");
}

function formatTransitiveEntries(entries) {
  const packageList = entries
    .slice(0, 10)
    .map((entry) => entry.key)
    .join(", ");
  return `${packageList}${entries.length > 10 ? ", ..." : ""}`;
}

function collectEligibilityBlockers(context) {
  const {
    isDependabot,
    directChanges,
    productionChanges,
    nonPatchChanges,
    downgradeChanges,
    highRiskChanges,
    newDirectChanges,
    addedTransitivePackageEntries,
    installScriptPackageNames,
    tooNewPackages,
    unknownAgePackages,
    minimumReleaseAgeMinutes,
    now,
  } = context;
  const eligibilityBlockers = [];

  if (!isDependabot) {
    eligibilityBlockers.push("PR author is not Dependabot.");
  }
  if (directChanges.length === 0) {
    eligibilityBlockers.push("No direct dependency update was detected.");
  }
  if (productionChanges.length > 0) {
    eligibilityBlockers.push(
      `Runtime dependency changed: ${formatChangeList(productionChanges)}.`
    );
  }
  if (nonPatchChanges.length > 0) {
    eligibilityBlockers.push(
      `Non-patch dependency change detected: ${formatChangeList(nonPatchChanges)}.`
    );
  }
  if (downgradeChanges.length > 0) {
    eligibilityBlockers.push(
      `Dependency downgrade detected: ${formatChangeList(downgradeChanges)}.`
    );
  }
  if (highRiskChanges.length > 0) {
    eligibilityBlockers.push(
      `High-risk package changed: ${formatChangeList(highRiskChanges)}.`
    );
  }
  if (newDirectChanges.length > 0) {
    eligibilityBlockers.push(
      `New direct dependency added: ${formatChangeList(newDirectChanges)}.`
    );
  }
  if (addedTransitivePackageEntries.length > 0) {
    eligibilityBlockers.push(
      `New transitive package entries detected: ${formatTransitiveEntries(
        addedTransitivePackageEntries
      )}.`
    );
  }
  if (installScriptPackageNames.size > 0) {
    eligibilityBlockers.push(
      `Install/build script exposure detected: ${[...installScriptPackageNames]
        .sort(compareStrings)
        .join(", ")}.`
    );
  }
  if (tooNewPackages.length > 0) {
    eligibilityBlockers.push(
      `Package version is younger than ${minimumReleaseAgeMinutes} minutes: ${tooNewPackages
        .map(
          (finding) =>
            `${finding.change.name} (${formatAge(finding.publishedAt, now)})`
        )
        .join(", ")}.`
    );
  }
  if (unknownAgePackages.length > 0) {
    eligibilityBlockers.push(
      `Package publish age could not be confirmed: ${unknownAgePackages
        .map((finding) => finding.change.name)
        .join(", ")}.`
    );
  }

  return getBlockingSummary(eligibilityBlockers);
}

function getRiskLevel(context) {
  const {
    majorChanges,
    downgradeChanges,
    highRiskChanges,
    installScriptPackageNames,
    productionChanges,
    newDirectChanges,
    addedTransitivePackageEntries,
    nonPatchChanges,
    tooNewPackages,
    unknownAgePackages,
  } = context;

  if (
    majorChanges.length > 0 ||
    downgradeChanges.length > 0 ||
    highRiskChanges.length > 0 ||
    installScriptPackageNames.size > 0 ||
    unknownAgePackages.length > 0
  ) {
    return "high";
  }

  if (
    productionChanges.length > 0 ||
    newDirectChanges.length > 0 ||
    addedTransitivePackageEntries.length > 0 ||
    nonPatchChanges.length > 0 ||
    tooNewPackages.length > 0
  ) {
    return "medium";
  }

  return "low";
}

function isAutoMergeEligible(context) {
  const {
    isDependabot,
    riskLevel,
    directChanges,
    developmentChanges,
    newDirectChanges,
    addedTransitivePackageEntries,
    installScriptPackageNames,
    tooNewPackages,
    unknownAgePackages,
  } = context;

  return (
    isDependabot &&
    riskLevel === "low" &&
    directChanges.length > 0 &&
    developmentChanges.length === directChanges.length &&
    directChanges.every((change) => change.updateType === "patch") &&
    newDirectChanges.length === 0 &&
    addedTransitivePackageEntries.length === 0 &&
    installScriptPackageNames.size === 0 &&
    tooNewPackages.length === 0 &&
    unknownAgePackages.length === 0
  );
}

function buildDependencyLabels(context) {
  const {
    riskLevel,
    productionChanges,
    directChanges,
    newDirectChanges,
    addedTransitivePackageEntries,
    installScriptPackageNames,
    autoMergeEligible,
  } = context;
  const labels = [`risk:${riskLevel}`];

  if (productionChanges.length > 0) {
    labels.push("deps:runtime");
  } else if (directChanges.length > 0) {
    labels.push("deps:dev-only");
  }
  labels.push(updateTypeLabel(directChanges));
  if (newDirectChanges.length > 0 || addedTransitivePackageEntries.length > 0) {
    labels.push("deps:new-package");
  }
  if (installScriptPackageNames.size > 0) {
    labels.push("deps:install-script");
  }
  labels.push(
    autoMergeEligible ? "auto-merge:candidate" : "auto-merge:blocked"
  );

  return sortLabels(labels);
}

async function analyzeDependencyRisk(options) {
  const basePackageJson = parsePackageJson(
    options.basePackageJson,
    "base package.json"
  );
  const headPackageJson = parsePackageJson(
    options.headPackageJson,
    "head package.json"
  );
  const baseLockfileText = options.baseLockfileText ?? "";
  const headLockfileText = options.headLockfileText ?? "";
  const now = options.now ? new Date(options.now) : new Date();
  const minimumReleaseAgeMinutes =
    options.minimumReleaseAgeMinutes ?? DEFAULT_MINIMUM_RELEASE_AGE_MINUTES;
  const minimumReleaseAgeMs = minimumReleaseAgeMinutes * 60 * 1000;
  const fetchPackageInfo = options.fetchPackageInfo ?? fetchRegistryPackageInfo;
  const isDependabot = options.isDependabot ?? false;

  const directChanges = collectDirectDependencyChanges(
    basePackageJson,
    headPackageJson
  );
  const changedDirectNames = new Set(
    directChanges.filter((change) => change.to).map((change) => change.name)
  );
  const productionChanges = directChanges.filter(
    (change) => change.dependencyType === "production"
  );
  const developmentChanges = directChanges.filter(
    (change) => change.dependencyType === "development"
  );
  const newDirectChanges = directChanges.filter(
    (change) => change.updateType === "new"
  );
  const majorChanges = directChanges.filter(
    (change) => change.updateType === "major"
  );
  const downgradeChanges = directChanges.filter(
    (change) => change.updateType === "downgrade"
  );
  const nonPatchChanges = directChanges.filter(
    (change) => change.updateType !== "patch"
  );
  const highRiskChanges = directChanges.filter((change) =>
    isHighRiskPackage(change.name)
  );

  const basePackageKeys = new Set(collectPnpmPackageKeys(baseLockfileText));
  const headPackageKeys = new Set(collectPnpmPackageKeys(headLockfileText));
  const addedPackageKeys = [...headPackageKeys].filter(
    (packageKey) => !basePackageKeys.has(packageKey)
  );
  const addedPackageEntries = addedPackageKeys.map((packageKey) => ({
    key: packageKey,
    name: getPackageNameFromPnpmKey(packageKey),
  }));
  const addedTransitivePackageEntries = addedPackageEntries.filter(
    (entry) => !changedDirectNames.has(entry.name)
  );
  const requiresBuildPackageKeys =
    collectRequiresBuildPackageKeys(headLockfileText);
  const addedRequiresBuildEntries = addedPackageEntries.filter((entry) =>
    requiresBuildPackageKeys.has(entry.key)
  );

  const registryFindings = await collectRegistryFindings(
    directChanges,
    fetchPackageInfo
  );
  const packageAgeFindings = collectPackageAgeFindings(
    registryFindings,
    now,
    minimumReleaseAgeMs
  );
  const tooNewPackages = packageAgeFindings.filter(
    (finding) => finding.status === "too-new"
  );
  const unknownAgePackages = packageAgeFindings.filter(
    (finding) => finding.status === "unknown"
  );
  const installScriptPackageNames = collectInstallScriptPackageNames(
    registryFindings,
    addedRequiresBuildEntries
  );
  const context = {
    isDependabot,
    directChanges,
    productionChanges,
    developmentChanges,
    newDirectChanges,
    majorChanges,
    downgradeChanges,
    nonPatchChanges,
    highRiskChanges,
    addedTransitivePackageEntries,
    installScriptPackageNames,
    tooNewPackages,
    unknownAgePackages,
    minimumReleaseAgeMinutes,
    now,
  };
  const riskLevel = getRiskLevel(context);
  const autoMergeEligible = isAutoMergeEligible({ ...context, riskLevel });
  const labels = buildDependencyLabels({
    ...context,
    riskLevel,
    autoMergeEligible,
  });

  return {
    riskLevel,
    autoMergeEligible,
    labels,
    directChanges,
    addedPackageEntries,
    addedTransitivePackageEntries,
    addedRequiresBuildEntries,
    registryFindings,
    packageAgeFindings,
    eligibilityBlockers: collectEligibilityBlockers(context),
    minimumReleaseAgeMinutes,
  };
}

function formatMarkdownTable(rows, emptyMessage = "_None._") {
  if (rows.length === 0) {
    return emptyMessage;
  }

  return rows.join("\n");
}

function buildMarkdownSummary(result) {
  const directTableRows = result.directChanges.map((change) => {
    return `| ${change.name} | ${change.dependencyType} | ${
      change.from ?? "(new)"
    } | ${change.to ?? "(removed)"} | ${change.updateType} |`;
  });
  const ageTableRows = result.packageAgeFindings.map((finding) => {
    const published = finding.publishedAt
      ? finding.publishedAt.toISOString()
      : "(unknown)";
    return `| ${finding.change.name} | ${finding.change.to} | ${published} | ${finding.status} |`;
  });
  const directTable =
    directTableRows.length > 0
      ? formatMarkdownTable([
          "| Package | Scope | From | To | Update |",
          "| --- | --- | --- | --- | --- |",
          ...directTableRows,
        ])
      : formatMarkdownTable([]);
  const ageTable =
    ageTableRows.length > 0
      ? formatMarkdownTable([
          "| Package | Version | Published | Status |",
          "| --- | --- | --- | --- |",
          ...ageTableRows,
        ])
      : formatMarkdownTable([], "_No changed package versions to check._");

  return [
    "## Dependency Risk Gate",
    "",
    `- Risk: **${result.riskLevel.toUpperCase()}**`,
    `- Auto-merge eligibility: **${
      result.autoMergeEligible ? "candidate" : "blocked"
    }**`,
    `- Minimum release age: ${result.minimumReleaseAgeMinutes} minutes`,
    `- Labels: ${result.labels.join(", ")}`,
    "",
    "### Changed Direct Dependencies",
    "",
    directTable,
    "",
    "### Eligibility Blockers",
    "",
    ...result.eligibilityBlockers.map((reason) => `- ${reason}`),
    "",
    "### Lockfile Delta",
    "",
    `- Added package entries: ${result.addedPackageEntries.length}`,
    `- Added transitive package entries: ${result.addedTransitivePackageEntries.length}`,
    `- Added entries with build requirements: ${result.addedRequiresBuildEntries.length}`,
    "",
    "### Package Age",
    "",
    ageTable,
    "",
  ].join("\n");
}

function resolveGitCommand() {
  if (process.env.GIT_COMMAND) {
    if (!path.isAbsolute(process.env.GIT_COMMAND)) {
      throw new Error("GIT_COMMAND must be an absolute path when set.");
    }

    if (!fs.existsSync(process.env.GIT_COMMAND)) {
      throw new Error(`GIT_COMMAND does not exist: ${process.env.GIT_COMMAND}`);
    }

    return process.env.GIT_COMMAND;
  }

  if (process.platform !== "win32") {
    return "git";
  }

  const candidates = [
    String.raw`C:\Program Files\Git\cmd\git.exe`,
    String.raw`C:\Program Files\Git\bin\git.exe`,
  ];
  const command = candidates.find((candidate) => fs.existsSync(candidate));
  if (!command) {
    throw new Error(
      "Unable to locate git.exe. Set GIT_COMMAND to an absolute git executable path."
    );
  }

  return command;
}

function runGit(args, options = {}) {
  const result = spawnSync(resolveGitCommand(), args, {
    cwd: options.cwd ?? process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    if (options.allowFailure) {
      return null;
    }
    throw result.error;
  }

  if (result.status !== 0) {
    if (options.allowFailure) {
      return null;
    }
    const stderr = result.stderr?.trim();
    throw new Error(stderr || `git ${args.join(" ")} failed`);
  }

  return result.stdout.trimEnd();
}

function resolveComparisonBase() {
  const configuredBase = process.env.DEPENDENCY_RISK_BASE_REF;
  const githubBase = process.env.GITHUB_BASE_REF
    ? `origin/${process.env.GITHUB_BASE_REF}`
    : null;
  const baseRef = configuredBase || githubBase || "HEAD";

  if (baseRef === "HEAD") {
    return "HEAD";
  }

  const mergeBase = runGit(["merge-base", "HEAD", baseRef], {
    allowFailure: true,
  });
  return mergeBase || baseRef;
}

function readGitFile(ref, filePath) {
  return runGit(["show", `${ref}:${filePath}`], { allowFailure: true }) ?? "";
}

function readWorkspaceFile(filePath) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  return fs.existsSync(absolutePath)
    ? fs.readFileSync(absolutePath, "utf8")
    : "";
}

function readMinimumReleaseAgeMinutes() {
  const workspaceConfig = readWorkspaceFile("pnpm-workspace.yaml");
  const match = /^minimumReleaseAge:\s*(\d+)\s*$/m.exec(workspaceConfig);
  return match ? Number(match[1]) : DEFAULT_MINIMUM_RELEASE_AGE_MINUTES;
}

function detectDependabot() {
  if (process.env.DEPENDENCY_RISK_IS_DEPENDABOT) {
    return process.env.DEPENDENCY_RISK_IS_DEPENDABOT === "true";
  }

  if (process.env.GITHUB_ACTOR === "dependabot[bot]") {
    return true;
  }

  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) {
    return false;
  }

  try {
    const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
    return event.pull_request?.user?.login === "dependabot[bot]";
  } catch {
    return false;
  }
}

function appendGithubOutput(outputs) {
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }

  const lines = Object.entries(outputs).map(
    ([key, value]) => `${key}=${value}`
  );
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join("\n")}\n`);
}

async function runCli() {
  const baseRef = resolveComparisonBase();
  const result = await analyzeDependencyRisk({
    basePackageJson: readGitFile(baseRef, "package.json"),
    headPackageJson: readWorkspaceFile("package.json"),
    baseLockfileText: readGitFile(baseRef, "pnpm-lock.yaml"),
    headLockfileText: readWorkspaceFile("pnpm-lock.yaml"),
    minimumReleaseAgeMinutes: readMinimumReleaseAgeMinutes(),
    isDependabot: detectDependabot(),
  });

  const summary = buildMarkdownSummary(result);
  console.log(summary);

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  }

  appendGithubOutput({
    labels: result.labels.join(","),
    risk: result.riskLevel,
    auto_merge_eligible: result.autoMergeEligible ? "true" : "false",
  });
}

if (require.main === module) {
  runCli().catch((error) => {
    console.error(
      error instanceof Error ? error.stack || error.message : error
    );
    process.exit(1);
  });
}

module.exports = {
  DEFAULT_MINIMUM_RELEASE_AGE_MINUTES,
  analyzeDependencyRisk,
  buildMarkdownSummary,
  collectDirectDependencyChanges,
  collectPnpmPackageKeys,
  collectRequiresBuildPackageKeys,
  getPackageNameFromPnpmKey,
  getUpdateType,
  isHighRiskPackage,
};
