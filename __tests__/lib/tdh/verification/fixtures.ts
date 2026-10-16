import type {
  VerificationDay,
  VerificationIndex,
} from "@/lib/tdh/verification/schema";

/**
 * Obviously synthetic verification data for tests (plan §11.4): values like
 * 1,000 against 1,120, never a real holder. Like the daily job's feed, a day
 * carries its differences only as counts (`differenceSummary`).
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
        rootsNote: null,
        runtimeMs: 612,
        ruleVersion: null,
        ruleId: null,
        registryHash: null,
        binarySha256: null,
      },
      python: {
        commit: "0f1e2d3c4b5a",
        totalTdh: 10_000,
        identities: 10,
        wallets: 12,
        cycleRoot: null,
        walletRoot: null,
        historyRoot: null,
        rootsNote: "No Keccak tree.",
        runtimeMs: 4_300,
        ruleVersion: null,
        ruleId: null,
        registryHash: null,
        binarySha256: null,
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
    differenceSummary: {
      identities: 1,
      wallets: 1,
      byClass: { A: 0, B: 0, C: 0, D: 2 },
      byCause: { unexplained: 2 },
      totalTdhDelta: { rustVsLive: -120, pythonVsLive: -120 },
    },
    verdict: "LIVE_UNEXPLAINED",
    sources: null,
    generatedAt: null,
    sha256: null,
    ...overrides,
  };
}

/** A day on which every record is equal, as the job publishes it. */
export function syntheticEqualDay(
  overrides: Partial<VerificationDay> = {}
): VerificationDay {
  const day = syntheticDay();
  return syntheticDay({
    implementations: {
      ...day.implementations,
      live: day.implementations.live
        ? { ...day.implementations.live, totalTdh: 10_000 }
        : null,
    },
    agreement: {
      rustVsPython: day.agreement.rustVsPython,
      rustVsLive: {
        identitiesEqual: 10,
        identitiesTotal: 10,
        walletsEqual: 12,
        walletsTotal: 12,
      },
    },
    differenceSummary: {
      identities: 0,
      wallets: 0,
      byClass: { A: 0, B: 0, C: 0, D: 0 },
      byCause: {},
      totalTdhDelta: { rustVsLive: 0, pythonVsLive: 0 },
    },
    verdict: "OK",
    ...overrides,
  });
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
        identitiesEqual: 10,
        identitiesTotal: 10,
        totalTdh: { rust: 9_900, python: 9_900, live: 9_900 },
        generatedAt: null,
        sha256: null,
      },
      {
        cycleDay: 20_741,
        date: "2026-10-15",
        verdict: "LIVE_UNEXPLAINED",
        identitiesEqual: 9,
        identitiesTotal: 10,
        totalTdh: { rust: 10_000, python: 10_000, live: 10_120 },
        generatedAt: null,
        sha256: null,
      },
    ],
    cutover: null,
    generatedAt: null,
    ...overrides,
  };
}
