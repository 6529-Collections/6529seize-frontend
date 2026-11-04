import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";

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
    "tests/support/videoArtworkSandbox.ts",
    "components/waves/drop/WaveDropAdditionalInfo.tsx",
    "components/waves/drop/WaveDropAdditionalInfoVideo.tsx",
    "hooks/useChatVideoPoster.ts",
    "public/video-preview-placeholder.svg",
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
    "components/waves/drops/wave-drops-all/utils/observeSerialScrollTarget.ts",
    "hooks/useVirtualizedWaveMessages.ts",
    "hooks/useMemesQuickVoteSessionState.ts",
    "hooks/memesQuickVote.queue.state.ts",
    "hooks/useMemesWaveFooterStats.ts",
    "components/brain/left-sidebar/waves/MemesWaveFooter.tsx",
    "components/brain/left-sidebar/waves/memes-quick-vote/MemesQuickVoteRuntime.tsx",
    "hooks/useNativeKeyboard.ts",
    "tests/support/surfaceSimulation.ts",
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

type WorkflowStep = {
  env?: Record<string, string>;
  id?: string;
  name?: string;
  run?: string;
  with?: Record<string, unknown>;
};

const gitBash = path.join(
  process.env["ProgramFiles"] ?? "",
  "Git/bin/bash.exe"
);
const bash =
  process.platform === "win32" && fs.existsSync(gitBash) ? gitBash : "bash";

/**
 * Builds the history behind the reported failure: the event payload names an
 * older base, while GitHub built the run's merge commit on a newer main tip.
 */
function mergeTreeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "app-pr-ci-merge-tree-"));
  const git = (...args: string[]) =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  const commit = (file: string, message: string) => {
    fs.writeFileSync(path.join(root, file), `${message}\n`);
    git("add", file);
    git("commit", "--quiet", "-m", message);
    return git("rev-parse", "HEAD");
  };
  git("init", "--quiet");
  git("config", "user.name", "Merge tree fixture");
  git("config", "user.email", "merge-tree@example.invalid");
  git("config", "commit.gpgsign", "false");
  const payloadBase = commit("base.txt", "Base named by the event payload");
  git("checkout", "--quiet", "-b", "feature");
  const head = commit("feature.txt", "Pull request head");
  git("checkout", "--quiet", "--detach", payloadBase);
  const mergeBase = commit("main.txt", "Main moved before GitHub merged");
  git("merge", "--quiet", "--no-ff", "--no-edit", head);
  const merge = git("rev-parse", "HEAD");
  git("checkout", "--quiet", "--detach", mergeBase);
  const laterMain = commit("later.txt", "Main moved again before checkout");
  git("update-ref", "refs/remotes/origin/main", laterMain);
  git("checkout", "--quiet", "--detach", merge);
  return { git, head, merge, mergeBase, payloadBase, root };
}

function requireRunStep(
  steps: WorkflowStep[],
  match: (step: WorkflowStep) => boolean,
  label: string
): WorkflowStep & { run: string } {
  const step = steps.find(match);
  if (!step?.run) throw new Error(`Missing workflow step: ${label}`);
  return { ...step, run: step.run };
}

function runWorkflowScript(
  script: string,
  cwd: string,
  env: Record<string, string>
) {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "app-pr-ci-step-"));
  const outputPath = path.join(outputDir, "output");
  fs.writeFileSync(outputPath, "");
  try {
    const result = spawnSync(bash, ["-c", script], {
      cwd,
      encoding: "utf8",
      timeout: 20_000,
      env: {
        ...process.env,
        ...env,
        GITHUB_OUTPUT: outputPath.replaceAll("\\", "/"),
      },
    });
    expect(result.error).toBeUndefined();
    return {
      output: fs.readFileSync(outputPath, "utf8"),
      status: result.status,
      stdout: result.stdout,
    };
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
}

describe("App PR CI merge-tree base", () => {
  const workflowPath = path.join(
    process.cwd(),
    ".github/workflows/app-pr-ci.yml"
  );
  const source = fs.readFileSync(workflowPath, "utf8");
  const workflow = YAML.parse(source);
  const planJob = workflow.jobs.plan;
  const planSteps = planJob.steps as WorkflowStep[];
  const appChecks = workflow.jobs["app-checks"];
  const appSteps = appChecks.steps as WorkflowStep[];
  const resolveIndex = planSteps.findIndex(({ id }) => id === "merge_tree");
  const resolve = requireRunStep(
    planSteps,
    ({ id }) => id === "merge_tree",
    "Resolve exact merge-tree base"
  );
  const evidence = requireRunStep(
    appSteps,
    ({ name }) => name === "Create exact PR merge-tree CI evidence",
    "Create exact PR merge-tree CI evidence"
  );
  const resolveScript = resolve.run;
  // Only the identity assertions run here; the rest needs the quality lane.
  const evidenceAssertions = evidence.run.split(
    "rm -rf exact-pr-ci-evidence"
  )[0]!;

  it("never takes a diff, selection or evidence base from the event payload", () => {
    expect(source).not.toContain("pull_request.base.sha");
    expect(source).not.toMatch(/github\.event\.pull_request\.base\b/u);
  });

  it("publishes the merge commit's first parent before any plan step uses it", () => {
    const mergeTreeBase = "${{ steps.merge_tree.outputs.base_sha }}";
    expect(planJob.outputs.base_sha).toBe(mergeTreeBase);
    expect(resolve.env).toEqual({
      BASE_REF: "${{ github.base_ref }}",
      EXPECTED_HEAD_SHA: "${{ github.event.pull_request.head.sha }}",
      EXPECTED_MERGE_SHA: "${{ github.sha }}",
    });
    const checkoutIndex = planSteps.findIndex(
      ({ name }) => name === "Checkout code"
    );
    // The default pull_request checkout is the merge commit, with history.
    expect(planSteps[checkoutIndex]?.with?.["ref"]).toBeUndefined();
    expect(planSteps[checkoutIndex]?.with?.["fetch-depth"]).toBe(0);
    expect(resolveIndex).toBe(checkoutIndex + 1);
    const baseConsumers = planSteps.filter(({ env }) => env?.["BASE_SHA"]);
    expect(baseConsumers.map(({ name }) => name)).toEqual([
      "Verify Sentry workflow offline contracts",
      "Create CI plan and security reports",
      "Apply protected Museum browser-lane floor",
    ]);
    for (const step of baseConsumers) {
      expect(step.env?.["BASE_SHA"]).toBe(mergeTreeBase);
      expect(planSteps.indexOf(step)).toBeGreaterThan(resolveIndex);
    }
  });

  it("feeds every app-check diff, selection and evidence base from the plan", () => {
    const planBase = "${{ needs.plan.outputs.base_sha }}";
    expect(appChecks.env.BASE_SHA).toBe(planBase);
    expect(
      appSteps.find(({ name }) => name === "Classify dependency risk")?.env
    ).toEqual({ DEPENDENCY_RISK_BASE_REF: planBase });
    expect(evidence.env).toMatchObject({
      EXPECTED_BASE_SHA: planBase,
      EXPECTED_HEAD_SHA: "${{ github.event.pull_request.head.sha }}",
      EXPECTED_MERGE_SHA: "${{ github.sha }}",
    });
  });

  it("names every failed evidence assertion without changing what it asserts", () => {
    const assertions = evidenceAssertions
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("[[ ") || line.startsWith("test "));
    expect(assertions).toHaveLength(9);
    for (const assertion of assertions) {
      expect(assertion).toMatch(/ \|\| \{ echo "::error::[^"]+"; exit 1; \}$/u);
    }
    expect(assertions).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /^test "\$\(git rev-parse HEAD\)" = "\$EXPECTED_MERGE_SHA" \|\| /u
        ),
        expect.stringMatching(
          /^test "\$\(git rev-parse HEAD\^1\)" = "\$EXPECTED_BASE_SHA" \|\| /u
        ),
      ])
    );
  });

  describe("against a merge commit built on a newer base", () => {
    const fixture = mergeTreeFixture();
    afterAll(() => {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    });
    const resolveEnv = {
      BASE_REF: "main",
      EXPECTED_HEAD_SHA: fixture.head,
      EXPECTED_MERGE_SHA: fixture.merge,
    };
    const evidenceEnv = (base: string) => ({
      BUILD_REQUIRED: "true",
      DEPLOYMENT_CONTRACT_REQUIRED: "true",
      EXPECTED_BASE_SHA: base,
      EXPECTED_HEAD_SHA: fixture.head,
      EXPECTED_MERGE_SHA: fixture.merge,
      MUSEUM_BROWSER_REQUIRED: "false",
      TEST_TYPECHECK_REQUIRED: "false",
    });

    it("resolves the base GitHub merged, not the payload snapshot", () => {
      expect(fixture.mergeBase).not.toBe(fixture.payloadBase);
      const result = runWorkflowScript(resolveScript, fixture.root, resolveEnv);
      expect(result.status).toBe(0);
      expect(result.output).toBe(`base_sha=${fixture.mergeBase}\n`);
    });

    it("passes the exact evidence identity checks with the resolved base", () => {
      const result = runWorkflowScript(
        evidenceAssertions,
        fixture.root,
        evidenceEnv(fixture.mergeBase)
      );
      expect(result.status).toBe(0);
    });

    it("fails loudly when evidence is given the payload snapshot base", () => {
      const result = runWorkflowScript(
        evidenceAssertions,
        fixture.root,
        evidenceEnv(fixture.payloadBase)
      );
      expect(result.status).toBe(1);
      expect(result.stdout).toContain(
        `::error::Merge commit first parent ${fixture.mergeBase} is not the plan base ${fixture.payloadBase}.`
      );
    });

    it.each([
      [
        "the PR head is not the second parent",
        { EXPECTED_HEAD_SHA: "PAYLOAD_BASE" },
        "is not the PR head",
      ],
      [
        "HEAD is not the run's merge commit",
        { EXPECTED_MERGE_SHA: "PAYLOAD_BASE" },
        "is not the run's merge commit",
      ],
      [
        "the merge SHA is not exact",
        { EXPECTED_MERGE_SHA: "main" },
        "Run merge commit is not an exact 40-hex SHA",
      ],
      ["the base branch is empty", { BASE_REF: "" }, "PR base branch is empty"],
    ])("fails closed when %s", (_case, overrides, message) => {
      const env = Object.fromEntries(
        Object.entries({ ...resolveEnv, ...overrides }).map(([key, value]) => [
          key,
          value === "PAYLOAD_BASE" ? fixture.payloadBase : value,
        ])
      );
      const result = runWorkflowScript(resolveScript, fixture.root, env);
      expect(result.status).toBe(1);
      expect(result.stdout).toContain("::error::");
      expect(result.stdout).toContain(message);
      expect(result.output).toBe("");
    });

    it("fails closed when the checked-out commit is not a merge", () => {
      fixture.git("checkout", "--quiet", "--detach", fixture.head);
      try {
        const result = runWorkflowScript(resolveScript, fixture.root, {
          ...resolveEnv,
          EXPECTED_MERGE_SHA: fixture.head,
        });
        expect(result.status).toBe(1);
        expect(result.stdout).toContain("does not have exactly two parents");
        expect(result.output).toBe("");
      } finally {
        fixture.git("checkout", "--quiet", "--detach", fixture.merge);
      }
    });

    it("fails closed when the merge base is not base-branch history", () => {
      const laterMain = fixture.git("rev-parse", "refs/remotes/origin/main");
      fixture.git(
        "update-ref",
        "refs/remotes/origin/main",
        fixture.payloadBase
      );
      try {
        const result = runWorkflowScript(
          resolveScript,
          fixture.root,
          resolveEnv
        );
        expect(result.status).toBe(1);
        expect(result.stdout).toContain(
          `::error::Merge commit first parent ${fixture.mergeBase} is not on origin/main.`
        );
        expect(result.output).toBe("");
      } finally {
        fixture.git("update-ref", "refs/remotes/origin/main", laterMain);
      }
    });
  });
});
