import type { VerificationDay, VerificationIndex } from "./schema";

/**
 * Sample verification data, shown only outside production while no data
 * source is configured, always under a "Sample data, not a measurement"
 * banner.
 *
 * The Rust and 6529.io figures are the real ones from the independent
 * comparison of 14 and 15 October 2026: each day 10,280 of 10,282 identities
 * and 11,131 of 11,133 wallets were equal, the independent totals were 240
 * lower, and both differences were a token sent out and back within one
 * transaction (DEV-2), which D131's netting settles. The Python figures are
 * copied from Rust to show the layout and were not computed. Roots, commits,
 * run times and per-holder values were never published, so they are null.
 */

export const SAMPLE_VERIFICATION_INDEX: VerificationIndex = {
  days: [
    {
      cycleDay: 20_740,
      date: "2026-10-14",
      verdict: "explained",
      identitiesEqual: 10_280,
      identitiesTotal: 10_282,
      totalTdh: {
        rust: 2_070_436_097,
        python: 2_070_436_097,
        live: 2_070_436_337,
      },
    },
    {
      cycleDay: 20_741,
      date: "2026-10-15",
      verdict: "explained",
      identitiesEqual: 10_280,
      identitiesTotal: 10_282,
      totalTdh: {
        rust: 2_073_214_694,
        python: 2_073_214_694,
        live: 2_073_214_934,
      },
    },
  ],
  cutover: { plannedDate: "2026-10-23", status: "planned", cycleDay: null },
};

const SAMPLE_DIFFERENCES: VerificationDay["differences"] = (
  [
    ["holder-1", "identity"],
    ["holder-2", "identity"],
    ["holder-1", "wallet"],
    ["holder-2", "wallet"],
  ] as const
).map(([label, kind]) => ({
  label,
  kind,
  fields: [{ name: "final", rust: null, python: null, live: null }],
  class: "A",
  cause: "DEV-2",
}));

interface SampleDayInput {
  readonly cycleDay: number;
  readonly date: string;
  readonly cutoffBlock: number;
  readonly rustTotal: number;
  readonly liveTotal: number;
  readonly liveSource: string | null;
}

function sampleDay({
  cycleDay,
  date,
  cutoffBlock,
  rustTotal,
  liveTotal,
  liveSource,
}: SampleDayInput): VerificationDay {
  const implementation = {
    commit: null,
    totalTdh: rustTotal,
    identities: 10_282,
    wallets: 11_133,
    cycleRoot: null,
    walletRoot: null,
    historyRoot: null,
    runtimeMs: null,
  };
  return {
    cycleDay,
    date,
    cutoffBlock,
    mode: "unchecked-history",
    implementations: {
      rust: implementation,
      python: { ...implementation },
      live: {
        source: liveSource,
        totalTdh: liveTotal,
        identities: 10_282,
        wallets: 11_133,
      },
    },
    agreement: {
      rustVsPython: {
        identitiesEqual: 10_282,
        identitiesTotal: 10_282,
        walletsEqual: 11_133,
        walletsTotal: 11_133,
      },
      rustVsLive: {
        identitiesEqual: 10_280,
        identitiesTotal: 10_282,
        walletsEqual: 11_131,
        walletsTotal: 11_133,
      },
    },
    differences: SAMPLE_DIFFERENCES,
    verdict: "explained",
  };
}

export const SAMPLE_VERIFICATION_DAYS: Readonly<
  Record<number, VerificationDay>
> = {
  20_740: sampleDay({
    cycleDay: 20_740,
    date: "2026-10-14",
    cutoffBlock: 26_187_014,
    rustTotal: 2_070_436_097,
    liveTotal: 2_070_436_337,
    // 6529.io's consolidated upload of that day.
    liveSource: "arweave:5V7lje2GIOEr6opL7J6j7KPcBiZDeGFNSrUtkRPpQI8",
  }),
  20_741: sampleDay({
    cycleDay: 20_741,
    date: "2026-10-15",
    cutoffBlock: 26_194_188,
    rustTotal: 2_073_214_694,
    liveTotal: 2_073_214_934,
    liveSource: null,
  }),
};
