import type {
  VerificationDay,
  VerificationIndex,
} from "@/lib/tdh/verification/schema";

/**
 * Obviously synthetic verification data for tests (plan §11.4): values like
 * 1,000 against 1,120, never a real holder. Labels and field names follow the
 * daily job's feed: `holder-N`, `holder-N/wM`, `boosted_tdh`, `memes#1.tdh`.
 */
export function syntheticDay(
  overrides: Partial<VerificationDay> = {}
): VerificationDay {
  return {
    cycleDay: 20_741,
    date: "2026-10-15",
    cutoffBlock: 26_194_188,
    cutoffBlockHash: null,
    cutoffTimestamp: null,
    ruleVersion: null,
    registryHash: null,
    mode: "unchecked-history",
    implementations: {
      rust: {
        commit: "a1b2c3d4e5f6",
        totalTdh: 10_000,
        identities: 10,
        wallets: 12,
        cycleRoot: `0x${"1".repeat(64)}`,
        walletRoot: null,
        historyRoot: null,
        runtimeMs: 612,
        transactionNetting: true,
      },
      python: {
        commit: "0f1e2d3c4b5a",
        totalTdh: 10_000,
        identities: 10,
        wallets: 12,
        cycleRoot: null,
        walletRoot: null,
        historyRoot: null,
        runtimeMs: 4_300,
        transactionNetting: true,
      },
      live: {
        source: `arweave:${"A".repeat(43)}`,
        sources: {
          identity: `arweave:${"A".repeat(43)}`,
          wallet: `arweave:${"B".repeat(43)}`,
        },
        totalTdh: 10_120,
        identities: 10,
        wallets: 12,
        sha256: null,
      },
    },
    agreement: {
      rustVsPython: {
        identitiesEqual: 10,
        identitiesTotal: 10,
        walletsEqual: 12,
        walletsTotal: 12,
      },
      rustVsLive: {
        identitiesEqual: 9,
        identitiesTotal: 10,
        walletsEqual: 11,
        walletsTotal: 12,
      },
    },
    differences: [
      {
        label: "holder-1",
        kind: "identity",
        fields: [
          { name: "boosted_tdh", rust: 1_000, python: 1_000, live: 1_120 },
          { name: "memes#1.tdh", rust: 500, python: 500, live: 620 },
          { name: "memes_tdh", rust: 1_000, python: 1_000, live: 1_120 },
        ],
        class: "A",
        cause: "DEV-2",
      },
      {
        label: "holder-1/w1",
        kind: "wallet",
        fields: [
          { name: "boosted_tdh", rust: 1_000, python: 1_000, live: 1_120 },
          { name: "memes#1.tdh", rust: 500, python: 500, live: 620 },
          { name: "memes_tdh", rust: 1_000, python: 1_000, live: 1_120 },
        ],
        class: "A",
        cause: "DEV-2",
      },
      {
        label: "holder-2/w1",
        kind: "wallet",
        fields: [{ name: "boosted_tdh", rust: 700, python: 700, live: 690 }],
        class: "D",
        cause: null,
      },
    ],
    verdict: "LIVE_UNEXPLAINED",
    ...overrides,
  };
}

export function syntheticIndex(
  overrides: Partial<VerificationIndex> = {}
): VerificationIndex {
  return {
    days: [
      {
        cycleDay: 20_740,
        date: "2026-10-14",
        verdict: "OK",
        identitiesEqual: 9,
        identitiesTotal: 10,
        totalTdh: { rust: 9_900, python: 9_900, live: 10_020 },
      },
      {
        cycleDay: 20_741,
        date: "2026-10-15",
        verdict: "LIVE_UNEXPLAINED",
        identitiesEqual: 9,
        identitiesTotal: 10,
        totalTdh: { rust: 10_000, python: 10_000, live: 10_120 },
      },
    ],
    cutover: { plannedDate: "2026-10-23", status: "planned", cycleDay: null },
    ...overrides,
  };
}
