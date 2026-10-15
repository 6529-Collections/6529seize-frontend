import type {
  VerificationDay,
  VerificationIndex,
} from "@/lib/tdh/verification/schema";

/**
 * Obviously synthetic verification data for tests (plan §11.4): values like
 * 1,000 against 1,120, never a real holder.
 */
export function syntheticDay(
  overrides: Partial<VerificationDay> = {}
): VerificationDay {
  return {
    cycleDay: 20_741,
    date: "2026-10-15",
    cutoffBlock: 26_194_188,
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
      },
      python: {
        commit: "0f1e2d3c4b5a",
        totalTdh: 10_000,
        identities: 10,
        wallets: 12,
        cycleRoot: `0x${"1".repeat(64)}`,
        walletRoot: null,
        historyRoot: null,
        runtimeMs: 4_300,
      },
      live: {
        source: `arweave:${"A".repeat(43)}`,
        totalTdh: 10_120,
        identities: 10,
        wallets: 12,
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
        fields: [{ name: "final", rust: 1_000, python: 1_000, live: 1_120 }],
        class: "A",
        cause: "DEV-2",
      },
      {
        label: "holder-1",
        kind: "wallet",
        fields: [{ name: "final", rust: 1_000, python: 1_000, live: 1_120 }],
        class: "D",
        cause: null,
      },
    ],
    verdict: "investigating",
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
        verdict: "explained",
        identitiesEqual: 9,
        identitiesTotal: 10,
        totalTdh: { rust: 9_900, python: 9_900, live: 10_020 },
      },
      {
        cycleDay: 20_741,
        date: "2026-10-15",
        verdict: "investigating",
        identitiesEqual: 9,
        identitiesTotal: 10,
        totalTdh: { rust: 10_000, python: 10_000, live: 10_120 },
      },
    ],
    cutover: { plannedDate: "2026-10-23", status: "planned", cycleDay: null },
    ...overrides,
  };
}
