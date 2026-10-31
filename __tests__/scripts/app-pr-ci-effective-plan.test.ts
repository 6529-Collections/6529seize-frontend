import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type EffectivePlan = {
  checks: {
    deployment_contract: { required: boolean };
    test_typecheck: { required: boolean };
    playwright_smoke?: { required: boolean };
    playwright_critical_shell?: { required: boolean };
    playwright_museum: { required: boolean };
    playwright_artwork_documentation: { required: boolean };
    playwright_native_competition: { required: boolean };
    playwright_submission_artwork: { required: boolean };
    playwright_wave_feature_usage: { required: boolean };
    playwright_pdf_attachments: { required: boolean };
    install: { required: boolean };
  };
};

function plan(changedFiles: string[]) {
  return {
    changed_files: changedFiles,
    checks: {
      install: { required: true, reason: "existing" },
      lint_changed: { required: true, reason: "existing" },
      typecheck_changed: { required: true, reason: "existing" },
      jest_changed: { required: true, reason: "existing" },
      build: { required: true, reason: "existing" },
      playwright_smoke: { required: true, reason: "superseded" },
      playwright_critical_shell: { required: true, reason: "superseded" },
      dependency_governance: { required: false, reason: "existing" },
      reviewbot_contract: { required: false, reason: "existing" },
      agent_files_sync: { required: false, reason: "existing" },
      test_typecheck: { required: true, reason: "superseded" },
    },
  };
}

function executeRawPlan(rawPlan: unknown): EffectivePlan {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "app-pr-ci-plan-"));
  const planPath = path.join(tempDir, "ci-plan.json");
  try {
    fs.writeFileSync(planPath, JSON.stringify(rawPlan));
    execFileSync(
      process.execPath,
      [
        path.join(process.cwd(), "scripts/app-pr-ci-effective-plan.cjs"),
        "--plan",
        planPath,
      ],
      { cwd: process.cwd(), stdio: "pipe" }
    );
    return JSON.parse(fs.readFileSync(planPath, "utf8")) as EffectivePlan;
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function executePlan(changedFiles: string[]): EffectivePlan {
  return executeRawPlan(plan(changedFiles));
}

it.each([
  "services/analytics/mixpanelPrivacy.ts",
  "hooks/useWaveFeatureUsage.ts",
  "components/brain/left-sidebar/waves/SidebarDiscovery.tsx",
  "components/brain/my-stream/MyStreamWaveDesktopTabs.tsx",
  "components/waves/leaderboard/header/WaveleaderboardSort.tsx",
  "components/utils/select/dropdown/CommonDropdownItem.tsx",
  "playwright.config.ts",
  "tsconfig.playwright.json",
])("selects the isolated Wave tracking browser lane for %s", (file) => {
  expect(
    executePlan([file]).checks.playwright_wave_feature_usage.required
  ).toBe(true);
});

it("keeps the Wave tracking browser lane out of unrelated changes", () => {
  expect(
    executePlan(["README.md"]).checks.playwright_wave_feature_usage.required
  ).toBe(false);
});

describe("effective App PR CI plan", () => {
  it.each([
    "components/user/rep/modify-rep/UserPageRepModifyModal.tsx",
    "components/user/utils/rate/UserPageRateInput.tsx",
    "components/react-query-wrapper/ReactQueryWrapper.tsx",
    "hooks/useRepAllocation.ts",
    "tests/social/profile-rep-edit-sandbox.spec.ts",
  ])("selects the profile dialog browser pack for %s", (file) => {
    const input = plan([file]);
    input.checks.playwright_critical_shell = {
      required: false,
      reason: "Not selected by the base plan.",
    };
    expect(
      executeRawPlan(input).checks.playwright_critical_shell?.required
    ).toBe(true);
  });

  it("preserves the critical shell decision for unrelated changes", () => {
    const input = plan(["README.md"]);
    input.checks.playwright_critical_shell.required = false;
    expect(
      executeRawPlan(input).checks.playwright_critical_shell?.required
    ).toBe(false);
  });

  it.each([
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
    "tests/packs.manifest.cjs",
    ".github/workflows/app-pr-ci.yml",
    "scripts/app-pr-ci-effective-plan.cjs",
  ])("selects isolated submission artwork browser evidence for %s", (file) => {
    expect(
      executePlan([file]).checks.playwright_submission_artwork.required
    ).toBe(true);
  });

  it("keeps submission artwork out of unrelated competition changes", () => {
    expect(
      executePlan(["components/competitions/CompetitionVote.tsx"]).checks
        .playwright_submission_artwork.required
    ).toBe(false);
  });

  it.each([
    "components/competitions/CompetitionVote.tsx",
    "hooks/competitions/useCompetitionQueries.ts",
    "__tests__/competitions/competition-api.test.ts",
    "app/waves/[wave]/competitions/[competition]/page.tsx",
    "components/waves/create-wave/hooks/useCreateWaveSubmission.ts",
    "generated/models/ApiCompetition.ts",
    "contexts/CompetitionContext.tsx",
    "helpers/competition.helpers.ts",
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
    "tests/social/wave-switch-loading.spec.ts",
    "tests/social/wave-loading-sandbox.spec.ts",
    "components/brain/my-stream/MyStreamWaveChat.tsx",
    "components/waves/drops/wave-drops-all/hooks/useWaveDropsSerialScroll.ts",
    "hooks/useMemesQuickVoteSessionState.ts",
    "hooks/memesQuickVote.queue.state.ts",
    "hooks/useMemesWaveFooterStats.ts",
    "components/brain/left-sidebar/waves/MemesWaveFooter.tsx",
    "components/brain/left-sidebar/waves/memes-quick-vote/MemesQuickVoteRuntime.tsx",
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
    "tests/support/composerSandboxServer.cjs",
    "components/waves/WavesMobile.tsx",
    "components/brain/BrainMobile.tsx",
    "components/brain/my-stream/MyStreamWaveContent.tsx",
    "tests/packs.manifest.cjs",
    "openapi.yaml",
    ".github/workflows/app-pr-ci.yml",
    "scripts/app-pr-ci-effective-plan.cjs",
    "__tests__/scripts/app-pr-ci-effective-plan.test.ts",
  ])("selects native competition browser evidence for %s", (file) => {
    expect(
      executePlan([file]).checks.playwright_native_competition.required
    ).toBe(true);
  });
  it.each([
    "components/waves/leaderboard/WaveMySubmissions.tsx",
    "components/waves/leaderboard/MySubmissionsButton.tsx",
    "components/waves/leaderboard/MySubmissionsDialog.tsx",
    "components/waves/leaderboard/SubmissionConfirmation.tsx",
    "components/waves/leaderboard/WaveLeaderboardError.tsx",
    "components/waves/leaderboard/content/WaveLeaderboardDropContent.tsx",
    "components/waves/leaderboard/drops/DefaultWaveLeaderboardDrop.tsx",
    "components/waves/leaderboard/drops/WaveLeaderboardDrops.tsx",
    "components/waves/leaderboard/gallery/WaveLeaderboardGallery.tsx",
    "components/waves/leaderboard/grid/WaveLeaderboardGrid.tsx",
    "components/waves/leaderboard/header/WaveleaderboardHeader.tsx",
    "components/waves/leaderboard/header/WaveLeaderboardHeaderAuxiliary.tsx",
    "components/waves/leaderboard/header/WaveleaderboardSort.tsx",
    "components/waves/leaderboard/header/useLeaderboardHeaderControlMeasurements.ts",
    "components/waves/leaderboard/header/waveLeaderboardHeaderLayout.ts",
    "__tests__/components/waves/leaderboard/WaveMySubmissions.test.tsx",
    "components/waves/drops/WaveDropActionsOpen.tsx",
    "__tests__/components/waves/drops/WaveDropActionsOpen.test.tsx",
    "components/waves/drops/WaveDropMobileMenuOpen.tsx",
    "__tests__/components/waves/drops/WaveDropMobileMenuOpen.test.tsx",
    "components/waves/drops/AdditionalActionPromiseBadge.tsx",
    "components/waves/drops/ArtistActiveSubmissionContent.tsx",
    "__tests__/components/waves/drops/ArtistActiveSubmissionContent.test.tsx",
    "components/utils/tooltip/BodyPortalTooltip.tsx",
    "components/waves/header/WaveJoinCta.tsx",
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
    "tests/social/wave-notification-settings-sandbox.spec.ts",
    "components/header/AppHeader.tsx",
    "components/brain/mobile/WaveInformationSheet.tsx",
    "components/brain/left-sidebar/waves/BrainLeftSidebarWavePin.tsx",
    "components\\waves\\leaderboard\\MySubmissionsDialog.tsx",
  ])(
    "selects native competition browser evidence for shared surface %s",
    (file) => {
      expect(
        executePlan([file]).checks.playwright_native_competition.required
      ).toBe(true);
    }
  );

  it("selects the shared surface browser lane in a mixed change set", () => {
    expect(
      executePlan([
        "ops/docs/README.md",
        "components/waves/leaderboard/MySubmissionsButton.tsx",
      ]).checks.playwright_native_competition.required
    ).toBe(true);
  });

  it.each([
    "ops/docs/README.md",
    "components/waves/drops/WaveDropActions.tsx",
    "__tests__/components/waves/drops/WaveDropActions.test.tsx",
    "components/waves/drops/WaveDropMobileMenuCopyLink.tsx",
    "__tests__/components/waves/drops/WaveDropMobileMenuCopyLink.test.tsx",
    "components/waves/leaderboard-preview/Preview.tsx",
    "__tests__/components/waves/leaderboard-preview/Preview.test.tsx",
  ])(
    "keeps unrelated path %s out of the native competition browser lane",
    (file) => {
      expect(
        executePlan([file]).checks.playwright_native_competition.required
      ).toBe(false);
    }
  );

  it.each([
    "app/artwork-documentation/page.tsx",
    "components/providers/LayoutWrapper.tsx",
    "components/layout/WebLayout.tsx",
    "components/layout/SmallScreenLayout.tsx",
    "components/layout/SmallScreenLayoutHeader.tsx",
    "components/artwork-documentation/DocumentationUpload.tsx",
    "lib/artwork-documentation/draft-controller.ts",
    "services/api/artwork-documentation-assets-api.ts",
    "i18n/messages/artwork-documentation-chapters.ts",
    "tests/artwork-documentation/profile-v2.json",
    "tests/support/composerSandboxServer.cjs",
    "tests/packs.manifest.cjs",
    ".github/workflows/app-pr-ci.yml",
  ])(
    "selects the isolated artwork documentation browser pack for %s",
    (file) => {
      expect(
        executePlan([file]).checks.playwright_artwork_documentation.required
      ).toBe(true);
    }
  );

  it.each([
    "README.md",
    "components/header/AppHeader.tsx",
    "components/layout/AppLayout.tsx",
    "app/collect/page.tsx",
  ])(
    "does not select the artwork documentation browser pack for unrelated %s",
    (file) => {
      expect(
        executePlan([file]).checks.playwright_artwork_documentation.required
      ).toBe(false);
    }
  );

  it("preserves risk-selected browser checks for ordinary runtime changes", () => {
    const effective = executePlan(["components/header/AppHeader.tsx"]);

    expect(effective.checks.deployment_contract.required).toBe(false);
    expect(effective.checks.test_typecheck.required).toBe(false);
    expect(effective.checks.playwright_smoke?.required).toBe(true);
    expect(effective.checks.playwright_critical_shell?.required).toBe(true);
  });

  it("requires the installed quality lane for every pull request", () => {
    const rawPlan = plan(["README.md"]);
    rawPlan.checks.install = {
      required: false,
      reason: "No installed checks selected.",
    };

    const effective = executeRawPlan(rawPlan);

    expect(effective.checks.install.required).toBe(true);
    expect(effective.checks).not.toHaveProperty("deadcode");
  });

  it.each([
    "tests/pages/about.spec.ts",
    "__tests__/scripts/e2e-packs.test.ts",
    "tsconfig.playwright.json",
  ])("requires test typechecking for %s", (file) => {
    expect(executePlan([file]).checks.test_typecheck.required).toBe(true);
  });

  it.each([
    ".github/workflows/deploy-staging.yml",
    "ops/docs/developer/frontend-deployment.md",
    "ops/skills/deploy-6529/SKILL.md",
    "ops/scripts/deploy-staging-artifact.sh",
    "ops/scripts/artifact-portability-report-source.cjs",
    "scripts/museum-release-tier.cjs",
    "ops/testing-strategy/museum-surface-registry.v1.json",
    "tests/packs.manifest.cjs",
    "components/museum/MuseumNetworkProposition.tsx",
    "__tests__/components/museum/MuseumNetworkProposition.test.tsx",
    "__tests__/scripts/deployment-e2e-workflows.test.ts",
  ])("requires frontend deployment contracts for %s", (file) => {
    expect(executePlan([file]).checks.deployment_contract.required).toBe(true);
  });

  it("rejects malformed portability paths without ambiguous backtracking", () => {
    const malformed = `ops/scripts/artifact-portability-${"--".repeat(5_000)}.cjs`;

    expect(executePlan([malformed]).checks.deployment_contract.required).toBe(
      false
    );
  });

  it.each([
    "app/museum/network/page.tsx",
    "components/museum/MuseumShell.tsx",
    "lib/museum/publication/load.ts",
    "config/museumPublicationEnv.server.ts",
    "tests/museum/institutional-practice-readonly.spec.ts",
    "i18n/messages/museum.en-US.json",
    "styles/museum.css",
    "public/museum/about-proposition.avif",
    ".github/workflows/staging-e2e.yml",
    ".github/workflows/app-pr-ci.yml",
    "scripts/museum-release-selection.cjs",
    "package.json",
  ])("requires the isolated Museum browser lane for %s", (file) => {
    const effective = executePlan([file]);

    expect(effective.checks.playwright_museum.required).toBe(true);
    expect(effective.checks.install.required).toBe(true);
  });

  it.each([
    "app/about/page.tsx",
    "components/header/AppHeader.tsx",
    "tests/pages/about.spec.ts",
    "ops/docs/developer/release.md",
    "ops/docs/museum/release.md",
    "ops/help/help-index.json",
    "public/museum.png",
    "README.md",
    "__tests__/components/museum/MuseumShell.test.tsx",
    "__tests__/scripts/museum-release-selection.test.ts",
    ".github/workflows/deploy-staging.yml",
  ])("does not run Museum browser coverage for unrelated change %s", (file) => {
    expect(executePlan([file]).checks.playwright_museum.required).toBe(false);
  });

  it.each([
    ["null checks", { changed_files: [], checks: null }],
    ["array checks", { changed_files: [], checks: [] }],
    ["empty checks", { changed_files: [], checks: {} }],
    [
      "missing baseline check",
      (() => {
        const malformed = plan([]);
        const { install: _install, ...checks } = malformed.checks;
        return { ...malformed, checks };
      })(),
    ],
    [
      "non-boolean required value",
      {
        ...plan([]),
        checks: {
          ...plan([]).checks,
          install: { required: "true", reason: "malformed" },
        },
      },
    ],
  ])("rejects a malformed plan with %s", (_description, malformedPlan) => {
    expect(() => executeRawPlan(malformedPlan)).toThrow();
  });
});

it.each([
  "components/drops/view/item/content/attachments/PdfAttachmentReader.tsx",
  "scripts/prepare-pdfjs-assets.cjs",
  "config/securityHeaders.ts",
  "tests/media/pdf-attachment-preview-sandbox.spec.ts",
  "tests/fixtures/pdf/one-page.pdf",
])("selects PDF attachment WebKit coverage for %s", (file) => {
  expect(executePlan([file]).checks.playwright_pdf_attachments.required).toBe(
    true
  );
});
it("does not select PDF coverage for unrelated content", () => {
  expect(
    executePlan(["README.md"]).checks.playwright_pdf_attachments.required
  ).toBe(false);
});
