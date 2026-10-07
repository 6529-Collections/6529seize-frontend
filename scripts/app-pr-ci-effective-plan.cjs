#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { isMuseumPath, isPolicyPath } = require("./museum-release-tier.cjs");

const PACKAGE_GOVERNANCE_FILES = new Set([
  ".npmrc",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
]);
const TEST_TYPECHECK_CONFIG_FILES = new Set([
  "jest.config.js",
  "tsconfig.jest.json",
  "tsconfig.playwright.json",
]);
const REQUIRED_BASE_CHECKS = [
  "install",
  "lint_changed",
  "typecheck_changed",
  "jest_changed",
  "build",
  "playwright_smoke",
  "playwright_critical_shell",
  "dependency_governance",
  "reviewbot_contract",
  "agent_files_sync",
];
const DEPLOYMENT_CONTRACT_PATTERNS = [
  /^\.github\/workflows\//u,
  /^ops\/docs\/developer\/(?:artifact-portability-migration|frontend-deployment|production-artifact-verifier)\.md$/u,
  /^ops\/skills\/deploy-6529\//u,
  /^ops\/testing-strategy\/museum-/u,
  /^ops\/scripts\/(?:artifact-portability(?:-[A-Za-z0-9]+)*|deploy-staging-artifact|verify-deployment-version)\./u,
  /^scripts\/(?:app-pr-ci-effective-plan|e2e-packs|museum-|sync-e2e-manifest)/u,
  /^tests\/packs\.manifest\.cjs$/u,
  /^components\/museum\/MuseumNetworkProposition\.tsx$/u,
  /^__tests__\/components\/museum\/MuseumNetworkProposition\.test\.tsx$/u,
  /^__tests__\/scripts\/(?:app-pr-ci-effective-plan|deploy-staging-artifact|deployment-e2e-workflows|e2e-packs|frontend-deployment-workflows|museum-|production-|sync-e2e-manifest)/u,
  /^(?:package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml)$/u,
];
const ARTWORK_DOCUMENTATION_BROWSER_PATTERNS = [
  /^components\/providers\/LayoutWrapper\.tsx$/u,
  /^components\/layout\/(?:WebLayout|SmallScreenLayout|SmallScreenLayoutHeader)\.tsx$/u,
  /^(?:app|components|hooks|lib)\/artwork-documentation\//u,
  /^services\/api\/artwork-documentation(?:-assets)?-api\.ts$/u,
  /^i18n\/messages\/artwork-documentation(?:-[A-Za-z0-9]+)*\.ts$/u,
  /^utils\/monitoring\/artworkDocumentationUploadMonitoring\.ts$/u,
  /^tests\/artwork-documentation\//u,
  /^__tests__\/fixtures\/artwork-documentation(?:-profile-v3\.json|\.ts)$/u,
  /^tests\/support\/(?:composerSandboxServer\.cjs|localSandbox\.ts)$/u,
  /^tests\/packs\.manifest\.cjs$/u,
  /^scripts\/app-pr-ci-effective-plan\.cjs$/u,
  /^\.github\/workflows\/app-pr-ci\.yml$/u,
  /^playwright\.config\.ts$/u,
];
function check(required, reason) {
  return { required, reason };
}

function isTestFile(file) {
  return (
    file.startsWith("tests/") ||
    file.startsWith("__tests__/") ||
    file.includes(".test.") ||
    file.includes(".spec.")
  );
}

function applyEffectiveAppPrCiPlan(plan) {
  const baseChecks = plan?.checks;
  const hasValidBaseChecks =
    baseChecks !== null &&
    typeof baseChecks === "object" &&
    !Array.isArray(baseChecks) &&
    REQUIRED_BASE_CHECKS.every(
      (name) =>
        Object.hasOwn(baseChecks, name) &&
        typeof baseChecks[name]?.required === "boolean"
    );

  if (!Array.isArray(plan?.changed_files) || !hasValidBaseChecks) {
    throw new Error("App PR CI plan is malformed.");
  }

  const files = plan.changed_files.map((file) =>
    String(file).replaceAll("\\", "/")
  );
  const packageGovernance = files.some((file) =>
    PACKAGE_GOVERNANCE_FILES.has(file)
  );
  const testTypecheck =
    packageGovernance ||
    files.some(
      (file) => isTestFile(file) || TEST_TYPECHECK_CONFIG_FILES.has(file)
    );
  const deploymentContract = files.some((file) =>
    DEPLOYMENT_CONTRACT_PATTERNS.some((pattern) => pattern.test(file))
  );
  // Keep App PR lane activation at least as broad as the tier classifier.
  // P1/P2 surface work and P3 policy/control-plane work must receive the
  // complete Museum inventory rather than being omitted by the legacy,
  // narrower ownership helper.
  const playwrightMuseum = files.some(
    (file) => isMuseumPath(file) || isPolicyPath(file)
  );

  const playwrightArtworkDocumentation = files.some((file) =>
    ARTWORK_DOCUMENTATION_BROWSER_PATTERNS.some((pattern) => pattern.test(file))
  );

  const playwrightNativeCompetition = files.some(
    (file) =>
      /^(?:components\/competitions\/|hooks\/competitions\/|__tests__\/competitions\/|app\/waves\/\[wave\]\/competitions\/|components\/waves\/create-wave\/|components\/waves\/leaderboard\/|__tests__\/components\/waves\/leaderboard\/|generated\/models\/ApiCompetition)/u.test(
        file
      ) ||
      [
        "contexts/CompetitionContext.tsx",
        "helpers/competition.helpers.ts",
        "helpers/competition-labels.helpers.ts",
        "helpers/competition-config.helpers.ts",
        "services/api/competitions-api.ts",
        "services/wallet-signatures/competition-signature.ts",
        "i18n/messages/competitions.ts",
        "tests/social/native-competition-sandbox.spec.ts",
        "tests/support/composerSandboxServer.cjs",
        "components/waves/WavesMobile.tsx",
        "components/brain/BrainMobile.tsx",
        "components/brain/my-stream/MyStreamWaveContent.tsx",
        "components/waves/drops/WaveDropActionsOpen.tsx",
        "__tests__/components/waves/drops/WaveDropActionsOpen.test.tsx",
        "components/waves/drops/WaveDropMobileMenuOpen.tsx",
        "__tests__/components/waves/drops/WaveDropMobileMenuOpen.test.tsx",
        "tests/packs.manifest.cjs",
        "openapi.yaml",
        ".github/workflows/app-pr-ci.yml",
        "scripts/app-pr-ci-effective-plan.cjs",
        "__tests__/scripts/app-pr-ci-effective-plan.test.ts",
      ].includes(file)
  );

  const playwrightWaveFeatureUsage = files.some(
    (file) =>
      /^(?:services\/analytics\/(?:mixpanel|waveFeature)|hooks\/useWaveFeatureUsage|tests\/(?:social\/wave-feature-usage-sandbox|support\/waveFeature)|components\/brain\/left-sidebar\/waves\/(?:SidebarDiscovery|SidebarActiveVotes|SidebarWaveNavigation|HighlyRatedWavesToggle)|components\/utils\/select\/)/u.test(
        file
      ) ||
      [
        "components/brain/my-stream/MyStreamWaveDesktopTabs.tsx",
        "components/brain/my-stream/MyStreamWaveTabOption.tsx",
        "components/common/TabToggle.tsx",
        "components/providers/MixpanelSetup.tsx",
        "components/brain/left-sidebar/web/WebProfileFeedShortcut.tsx",
        "components/waves/leaderboard/header/WaveleaderboardSort.tsx",
        "components/waves/leaderboard/header/WaveleaderboardHeader.tsx",
        "playwright.config.ts",
        "tsconfig.playwright.json",
        "tests/packs.manifest.cjs",
        "scripts/app-pr-ci-effective-plan.cjs",
        ".github/workflows/app-pr-ci.yml",
      ].includes(file)
  );

  const checks = {
    ...plan.checks,
    install: check(
      true,
      playwrightMuseum
        ? "Museum-owned public pages or their publication contract changed and need the isolated Museum browser lane."
        : baseChecks.install.required
          ? baseChecks.install.reason
          : "Repository-wide Knip runs for every pull request."
    ),
    deployment_contract: check(
      deploymentContract,
      deploymentContract
        ? "Deployment, workflow, artifact, or E2E policy files changed and need the frontend deployment contract suite."
        : "No frontend deployment or E2E policy files changed."
    ),
    test_typecheck: check(
      testTypecheck,
      testTypecheck
        ? "Changed test code, test configuration, or dependency policy needs test-helper typechecking."
        : "No test code, test configuration, or dependency policy changed."
    ),
    playwright_artwork_documentation: check(
      playwrightArtworkDocumentation,
      playwrightArtworkDocumentation
        ? "Artwork documentation editor, HTTP boundary fixtures or browser lane policy changed."
        : "No artwork documentation editor or browser lane contract changed."
    ),
    playwright_native_competition: check(
      playwrightNativeCompetition,
      playwrightNativeCompetition
        ? "Native competition changes require desktop and mobile sandbox browser coverage."
        : "No native competition surfaces changed."
    ),
    playwright_wave_feature_usage: check(
      playwrightWaveFeatureUsage,
      playwrightWaveFeatureUsage
        ? "Wave tracking controls or SDK policy require isolated desktop/mobile visibility and privacy coverage."
        : "No Wave feature tracking boundary changed."
    ),
    playwright_museum: check(
      playwrightMuseum,
      playwrightMuseum
        ? "Museum-owned public pages or their publication contract changed and need the isolated Museum browser lane."
        : "No Museum-owned public page, publication contract, or Museum browser test changed."
    ),
  };
  return { ...plan, checks };
}

function parsePlanPath(argv) {
  if (argv.length !== 2 || argv[0] !== "--plan" || !argv[1]) {
    throw new Error("Usage: app-pr-ci-effective-plan.cjs --plan <path>");
  }
  return path.resolve(argv[1]);
}

if (require.main === module) {
  try {
    const planPath = parsePlanPath(process.argv.slice(2));
    const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
    fs.writeFileSync(
      planPath,
      `${JSON.stringify(applyEffectiveAppPrCiPlan(plan), null, 2)}\n`
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
