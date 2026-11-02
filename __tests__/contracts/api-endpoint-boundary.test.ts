/**
 * Every 6529 API URL starts from `services/api/api-endpoints.ts`. Code builds
 * URLs with `apiUrl(path)` or `getApiBase()` instead of reading
 * `publicEnv.API_ENDPOINT` or hardcoding the production host, so the endpoint
 * list there stays the single seam for a later gateway, node or failover.
 *
 * The env boundary itself (`config/`, `next.config.ts` and the standalone
 * `next.config.ts`) bakes and validates the value and is not scanned. Each
 * remaining exemption below names its reason.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(__dirname, "../..");

const SCAN_DIRS = [
  "app",
  "components",
  "contexts",
  "entities",
  "helpers",
  "hooks",
  "lib",
  "services",
  "utils",
  "wagmiConfig",
  "standalone/standalone-memes-mint/src/app",
  "standalone/standalone-memes-mint/src/components",
];
const SCAN_FILES = [
  "proxy.ts",
  "instrumentation.ts",
  "instrumentation-client.ts",
];
const EXCLUDED_DIR_NAMES = new Set(["__tests__", "__mocks__", "generated"]);
const CODE_FILE = /\.(?:[cm]?[jt]sx?)$/u;
const TEST_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$/u;

const HELPER = "services/api/api-endpoints.ts";

// Component reads that the follow-up components PR migrates. Delete this list
// there; the stale-exemption check fails once a file no longer matches.
const PENDING_COMPONENT_MIGRATION = [
  "components/6529Gradient/6529Gradient.tsx",
  "components/6529Gradient/GradientPage.tsx",
  "components/community-downloads/CommunityDownloadsRememes.tsx",
  "components/community-downloads/CommunityDownloadsRoyalties.tsx",
  "components/community-downloads/CommunityDownloadsTDH.tsx",
  "components/communityStats/CommunityStats.tsx",
  "components/delegation/consolidation-builder/useConsolidationBuilderData.ts",
  "components/delegation/safe-collecting/useSafeCollectingSetup.ts",
  "components/delegation/walletChecker/WalletChecker.tsx",
  "components/delegation/walletChecker/walletCheckerConsolidations.ts",
  "components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscriptionFooter.tsx",
  "components/distribution/Distribution.tsx",
  "components/drop-forge/craft/sections/DistributionSection.tsx",
  "components/gas-royalties/GasRoyalties.tsx",
  "components/leaderboard/Leaderboard.tsx",
  "components/leaderboard/leaderboard_helpers.ts",
  "components/mapping-tools/ConsolidationMappingTool.tsx",
  "components/mapping-tools/DelegationMappingTool.tsx",
  "components/memelab/MemeLabCollection.tsx",
  "components/memelab/MemeLabPage.tsx",
  "components/memelab/useMemeLabCatalog.ts",
  "components/nextGen/admin/NextGenAdminInitializeBurn.tsx",
  "components/nextGen/admin/NextGenAdminInitializeExternalBurnSwap.tsx",
  "components/nextGen/admin/NextGenAdminUploadAL.tsx",
  "components/nextGen/collections/NextGenArtists.tsx",
  "components/nextGen/collections/NextGenCollections.tsx",
  "components/nextGen/collections/collectionParts/NextGenCollectionHeader.tsx",
  "components/nextGen/collections/collectionParts/mint/NextGenMint.tsx",
  "components/nextGen/collections/collectionParts/mint/NextGenMintBurnWidget.tsx",
  "components/nextGen/collections/collectionParts/mint/NextGenMintWidget.tsx",
  "components/rememes/RememeAddComponent.tsx",
  "components/rememes/RememeAddPage.tsx",
  "components/rememes/RememePage.tsx",
  "components/rememes/Rememes.tsx",
  "components/subscriptions-report/SubscriptionsReport.tsx",
  "components/the-memes/MemePage.tsx",
  "components/the-memes/MemePageReferences.tsx",
  "components/the-memes/MemePageTimeline.tsx",
  "components/the-memes/MemeShared.tsx",
  "components/the-memes/TheMemes.tsx",
  "components/the-memes/useMemePageFallbackData.ts",
  "components/user/collected/UserPageCollected.tsx",
  "components/waves/drop/SingleWaveDropVotersDownload.tsx",
];

type Rule = {
  readonly name: string;
  readonly pattern: RegExp;
  readonly exemptions: Readonly<Record<string, string>>;
};

const RULES: readonly Rule[] = [
  {
    name: "direct API_ENDPOINT read",
    // Word boundaries keep ALLOWLIST_API_ENDPOINT and IPFS_API_ENDPOINT out.
    pattern: /\bAPI_ENDPOINT\b/u,
    exemptions: {
      [HELPER]: "The endpoint list reads the configured value here.",
      "app/layout.tsx":
        "Preconnect hint in the root layout, which the static-shell work owns; switch it to getApiBase() there.",
      ...Object.fromEntries(
        PENDING_COMPONENT_MIGRATION.map((file) => [
          file,
          "Pending: the follow-up components PR migrates this file.",
        ])
      ),
    },
  },
  {
    name: "hardcoded production API host",
    pattern: /\/\/api\.6529\.io\b/u,
    exemptions: {
      [HELPER]: "PUBLIC_PRODUCTION_API_BASE names the production API once.",
      "app/tools/api/page.tsx":
        "Copyable developer code samples document the public production API.",
      "app/tools/api/authentication/page.tsx":
        "Copyable developer code samples document the public production API.",
    },
  },
];

const listSourceFiles = (dir: string): string[] => {
  const absolute = path.join(projectRoot, dir);
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      return EXCLUDED_DIR_NAMES.has(entry.name)
        ? []
        : listSourceFiles(relative);
    }
    return CODE_FILE.test(entry.name) && !TEST_FILE.test(entry.name)
      ? [relative]
      : [];
  });
};

const sourceFiles = [...SCAN_DIRS.flatMap(listSourceFiles), ...SCAN_FILES];
const sources = new Map(
  sourceFiles.map((file) => [
    file,
    readFileSync(path.join(projectRoot, file), "utf8"),
  ])
);

describe("API endpoint boundary", () => {
  it("scans the shippable source tree", () => {
    expect(sources.size).toBeGreaterThan(1000);
    expect(sources.has(HELPER)).toBe(true);
  });

  describe.each(RULES)("$name", ({ pattern, exemptions }) => {
    it("appears only in exempted files (use apiUrl() or getApiBase())", () => {
      const offenders = [...sources]
        .filter(
          ([file, source]) => !(file in exemptions) && pattern.test(source)
        )
        .map(([file]) => file);

      expect(offenders).toEqual([]);
    });

    it("keeps every exemption in use", () => {
      const stale = Object.keys(exemptions).filter(
        (file) => !pattern.test(sources.get(file) ?? "")
      );

      expect(stale).toEqual([]);
    });
  });
});
