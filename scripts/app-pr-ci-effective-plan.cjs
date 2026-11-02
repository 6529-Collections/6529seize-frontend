#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { requiresMuseumLane } = require("./museum-release-tier.cjs");

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
  // Start the Museum lane for any change that can affect a Museum page or the
  // Museum lane itself. The selection tool then runs only the affected packs.
  const playwrightMuseum = files.some(requiresMuseumLane);

  const playwrightProfileRep = files.some(
    (file) =>
      file.startsWith("components/user/rep/") ||
      file.startsWith("components/user/utils/rate/") ||
      file === "components/react-query-wrapper/ReactQueryWrapper.tsx" ||
      file === "hooks/useRepAllocation.ts" ||
      file === "tests/social/profile-rep-edit-sandbox.spec.ts"
  );

  const playwrightArtworkDocumentation = files.some((file) =>
    ARTWORK_DOCUMENTATION_BROWSER_PATTERNS.some((pattern) => pattern.test(file))
  );

  const playwrightNativeCompetition = files.some(
    (file) =>
      /^(?:components\/competitions\/|hooks\/competitions\/|__tests__\/competitions\/|app\/waves\/\[wave\]\/competitions\/|components\/waves\/create-wave\/|components\/waves\/leaderboard\/|__tests__\/components\/waves\/leaderboard\/|generated\/models\/ApiCompetition)/u.test(
        file
      ) ||
      /^(?:hooks\/(?:useMemesQuickVote|useMemesWaveFooterStats|memesQuickVote\.)|components\/brain\/left-sidebar\/waves\/memes-quick-vote\/)/u.test(
        file
      ) ||
      [
        "components/brain/left-sidebar/waves/MemesWaveFooter.tsx",
        "contexts/CompetitionContext.tsx",
        "helpers/competition.helpers.ts",
        "helpers/competition-labels.helpers.ts",
        "helpers/competition-config.helpers.ts",
        "services/api/competitions-api.ts",
        "services/wallet-signatures/competition-signature.ts",
        "i18n/messages/competitions.ts",
        "tests/social/native-competition-sandbox.spec.ts",
        "tests/media/waveImagePreviewCases.ts",
        "components/waves/drop/MemesDropArtworkHero.tsx",
        "components/drops/view/item/content/media/DropImagePreview.tsx",
        "components/drops/view/item/content/media/GifPreviewLoadingIndicator.tsx",
        "components/drops/view/item/content/media/DropListItemContentMedia.tsx",
        "components/drops/view/item/content/media/DropListItemContentMediaImage.tsx",
        "components/drops/view/item/content/media/MediaDisplay.tsx",
        "components/drops/view/item/content/media/MediaDisplayImage.tsx",
        "components/memes/drops/MemeParticipationDrop.tsx",
        "components/memes/drops/MemeWinnerDrop.tsx",
        "components/memes/drops/MemesLeaderboardDrop.tsx",
        "components/drops/view/item/content/media/ImageMediaModal.tsx",
        "components/drops/view/item/content/media/useOriginalImage.ts",
        "helpers/gif-preview.helpers.ts",
        "tests/social/wave-notification-settings-sandbox.spec.ts",
        "tests/social/wave-switch-loading.spec.ts",
        "tests/social/wave-loading-sandbox.spec.ts",
        "components/brain/my-stream/MyStreamWaveChat.tsx",
        "components/waves/drops/wave-drops-all/hooks/useWaveDropsSerialScroll.ts",
        "components/brain/left-sidebar/waves/SidebarDiscovery.tsx",
        "components/brain/left-sidebar/waves/SidebarDiscoverySkeletons.tsx",
        "components/brain/left-sidebar/waves/SidebarActiveVotes.tsx",
        "components/brain/left-sidebar/waves/UnifiedWavesListWaves.tsx",
        "components/brain/left-sidebar/web/WebUnifiedWavesListWaves.tsx",
        "components/brain/left-sidebar/waves/memes-quick-vote/MemesQuickVoteDialog.tsx",
        "components/brain/left-sidebar/waves/memes-quick-vote/MemesQuickVoteDialogSkeleton.tsx",
        "hooks/useWavesList.ts",
        "contexts/wave/MyStreamContext.tsx",
        "components/brain/my-stream/MyStreamWavePending.tsx",
        "components/header/AppHeader.tsx",
        "components/brain/mobile/WaveInformationSheet.tsx",
        "components/waves/specs/WaveNotificationSettings.tsx",
        "components/waves/specs/wave-notification-settings/WaveNotificationPreferenceButtons.tsx",
        "components/brain/mobile/WaveInformationPanelContext.ts",
        "components/brain/right-sidebar/BrainRightSidebar.tsx",
        "components/waves/specs/WaveSettingRow.tsx",
        "components/waves/specs/groups/group/edit/WaveGroupEditButtons.tsx",
        "components/waves/specs/groups/group/edit/WaveGroupChangeDialog.tsx",
        "components/groups/assignment/GroupAssignmentDialog.tsx",
        "contexts/WaveInformationContext.tsx",
        "components/mobile-wrapper-dialog/MobileWrapperDialog.tsx",
        "components/mobile-wrapper-dialog/MobileWrapperDialogHeader.tsx",
        "components/brain/my-stream/MyStreamActionTooltip.tsx",
        "tests/support/composerSandboxServer.cjs",
        "components/waves/WavesMobile.tsx",
        "components/brain/BrainMobile.tsx",
        "components/brain/my-stream/MyStreamWaveContent.tsx",
        "components/waves/drops/WaveDropActionsOpen.tsx",
        "__tests__/components/waves/drops/WaveDropActionsOpen.test.tsx",
        "components/waves/drops/WaveDropMobileMenuOpen.tsx",
        "__tests__/components/waves/drops/WaveDropMobileMenuOpen.test.tsx",
        "components/waves/drops/AdditionalActionPromiseBadge.tsx",
        "components/waves/drops/ArtistActiveSubmissionContent.tsx",
        "__tests__/components/waves/drops/ArtistActiveSubmissionContent.test.tsx",
        "components/utils/tooltip/BodyPortalTooltip.tsx",
        "components/waves/header/WaveJoinCta.tsx",
        "components/brain/left-sidebar/waves/BrainLeftSidebarWavePin.tsx",
        "tests/packs.manifest.cjs",
        "openapi.yaml",
        ".github/workflows/app-pr-ci.yml",
        "scripts/app-pr-ci-effective-plan.cjs",
        "__tests__/scripts/app-pr-ci-effective-plan.test.ts",
      ].includes(file)
  );

  const playwrightSubmissionArtwork = files.some((file) =>
    [
      "tests/media/submission-artwork-sandbox.spec.ts",
      "tests/media/waveImagePreviewCases.ts",
      "components/waves/drop/MemesDropArtworkHero.tsx",
      "components/drops/view/item/content/media/DropImagePreview.tsx",
      "components/drops/view/item/content/media/GifPreviewLoadingIndicator.tsx",
      "components/drops/view/item/content/media/DropListItemContentMedia.tsx",
      "components/drops/view/item/content/media/DropListItemContentMediaImage.tsx",
      "components/drops/view/item/content/media/MediaDisplay.tsx",
      "components/drops/view/item/content/media/MediaDisplayImage.tsx",
      "components/drops/view/item/content/media/ImageMediaModal.tsx",
      "components/drops/view/item/content/media/useOriginalImage.ts",
      "components/memes/drops/MemeParticipationDrop.tsx",
      "components/memes/drops/MemeWinnerDrop.tsx",
      "components/memes/drops/MemesLeaderboardDrop.tsx",
      "helpers/gif-preview.helpers.ts",
      "tests/support/composerSandboxServer.cjs",
      "tests/packs.manifest.cjs",
      "playwright.config.ts",
      "tsconfig.playwright.json",
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

  const playwrightPdfAttachments = files.some(
    (file) =>
      /^(?:components\/drops\/view\/item\/content\/attachments\/|__tests__\/components\/drops\/view\/item\/content\/attachments\/|tests\/media\/pdf-attachment|tests\/fixtures\/pdf\/)/u.test(
        file
      ) ||
      [
        "components/waves/drops/WaveDropPartContentAttachments.tsx",
        "hooks/useDeviceInfo.ts",
        "scripts/prepare-pdfjs-assets.cjs",
        "proxy.ts",
        "config/securityHeaders.ts",
        "package.json",
        "pnpm-lock.yaml",
        "tests/packs.manifest.cjs",
        "scripts/app-pr-ci-effective-plan.cjs",
        ".github/workflows/app-pr-ci.yml",
      ].includes(file)
  );

  const checks = {
    ...plan.checks,
    playwright_critical_shell: playwrightProfileRep
      ? check(
          true,
          "Profile REP and rating changes require the profile dialog browser pack."
        )
      : baseChecks.playwright_critical_shell,
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
    playwright_submission_artwork: check(
      playwrightSubmissionArtwork,
      playwrightSubmissionArtwork
        ? "Submission artwork media or its browser contract requires isolated desktop and mobile coverage."
        : "No submission artwork media or browser contract changed."
    ),
    playwright_wave_feature_usage: check(
      playwrightWaveFeatureUsage,
      playwrightWaveFeatureUsage
        ? "Wave tracking controls or SDK policy require isolated desktop/mobile visibility and privacy coverage."
        : "No Wave feature tracking boundary changed."
    ),
    playwright_pdf_attachments: check(
      playwrightPdfAttachments,
      "PDF attachment reader or its browser/runtime dependencies changed."
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
