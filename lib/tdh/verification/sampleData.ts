import type { VerificationDayInput, VerificationIndexInput } from "./schema";

/**
 * Sample verification data, shown only outside production while no data
 * source is configured, always under a "Sample" banner.
 *
 * A verbatim copy of the daily job's feed for cycles 20,740 and 20,741 (14 and
 * 15 October 2026): `tools/tdh-daily/fixtures/feed` in the validator code at
 * e127676, as `publish_feed.py` wrote it from test runs made on 15 October,
 * before the daily runs began. Rust ran at validator db72daa (tdh-core with
 * the uniform transaction netting of 6529chain 0621ed4) and the Python
 * reference at 6529chain 0621ed4. Both days, every identity and wallet is
 * equal to 6529.io's upload, and the totals are equal. Like the real feed,
 * the differences are counts only: no record is ever published.
 */

export const SAMPLE_VERIFICATION_INDEX: VerificationIndexInput = {
  days: [
    {
      cycleDay: 20_741,
      date: "2026-10-15",
      verdict: "OK",
      identitiesEqual: 10_282,
      identitiesTotal: 10_282,
      totalTdh: {
        rust: 2_073_214_934,
        python: 2_073_214_934,
        live: 2_073_214_934,
      },
    },
    {
      cycleDay: 20_740,
      date: "2026-10-14",
      verdict: "OK",
      identitiesEqual: 10_282,
      identitiesTotal: 10_282,
      totalTdh: {
        rust: 2_070_436_337,
        python: 2_070_436_337,
        live: 2_070_436_337,
      },
    },
  ],
};

const ROOTS_NOTE =
  "The Python reference has no Keccak tree, so it computes no roots; its records are compared with Rust's instead, and identical record files commit to identical roots.";

const ALL_EQUAL = {
  rustVsPython: {
    identitiesEqual: 10_282,
    identitiesTotal: 10_282,
    walletsEqual: 11_133,
    walletsTotal: 11_133,
  },
  rustVsLive: {
    identitiesEqual: 10_282,
    identitiesTotal: 10_282,
    walletsEqual: 11_133,
    walletsTotal: 11_133,
  },
} as const;

const NO_DIFFERENCES = {
  identities: 0,
  wallets: 0,
  byClass: { A: 0, B: 0, C: 0, D: 0 },
  byCause: {},
  totalTdhDelta: { rustVsLive: 0, pythonVsLive: 0 },
} as const;

export const SAMPLE_VERIFICATION_DAYS: Readonly<
  Record<number, VerificationDayInput>
> = {
  20_740: {
    cycleDay: 20_740,
    date: "2026-10-14",
    cutoffBlock: 26_187_014,
    mode: "unchecked-history",
    implementations: {
      rust: {
        commit: "db72daab2fc3112909ed0523637c8cf40908f141",
        totalTdh: 2_070_436_337,
        identities: 10_282,
        wallets: 11_133,
        cycleRoot:
          "0x0a21505c92359cc78110f3fb00cf79a68e3b0805a3878ed829aad39dd40e95c5",
        walletRoot:
          "0xbd9d5a848575e7c7e040512856afabbb0b3a497e932d465e84ddad79874af30c",
        historyRoot:
          "0x5a8e834dc21a904080ba6f2275bf1ca1120f5666f6cb9d0906d418f126b46c5f",
        runtimeMs: 1_314_787,
      },
      python: {
        commit: "0621ed4651e7a3be37bfa1862648d0d0291215d5",
        totalTdh: 2_070_436_337,
        identities: 10_282,
        wallets: 11_133,
        cycleRoot: null,
        walletRoot: null,
        historyRoot: null,
        rootsNote: ROOTS_NOTE,
        runtimeMs: 37_149,
      },
      live: {
        source: "arweave:5V7lje2GIOEr6opL7J6j7KPcBiZDeGFNSrUtkRPpQI8",
        sources: {
          identity: "arweave:5V7lje2GIOEr6opL7J6j7KPcBiZDeGFNSrUtkRPpQI8",
          wallet: "arweave:p1ZpChcxNbFasJyZKLplZbDO4ZLm3KB7C5NceNzrmjI",
        },
        totalTdh: 2_070_436_337,
        identities: 10_282,
        wallets: 11_133,
      },
    },
    agreement: ALL_EQUAL,
    differences: [],
    differenceSummary: NO_DIFFERENCES,
    verdict: "OK",
  },
  20_741: {
    cycleDay: 20_741,
    date: "2026-10-15",
    cutoffBlock: 26_194_188,
    mode: "unchecked-history",
    implementations: {
      rust: {
        commit: "db72daab2fc3112909ed0523637c8cf40908f141",
        totalTdh: 2_073_214_934,
        identities: 10_282,
        wallets: 11_133,
        cycleRoot:
          "0x7d41f8c696a830433ddb545a352b2cc1ef6ef5905ed69c03031a550dd6ef8bdf",
        walletRoot:
          "0xc3710b38062be7b220c1c8440cacb4d0ee7d13c316a326496d2a90d0e8210c45",
        historyRoot:
          "0x10c44b2ae76ad962fb4ac3abc79616f26628197dbb2a5de9583d9ecb8668e396",
        runtimeMs: 816_881,
      },
      python: {
        commit: "0621ed4651e7a3be37bfa1862648d0d0291215d5",
        totalTdh: 2_073_214_934,
        identities: 10_282,
        wallets: 11_133,
        cycleRoot: null,
        walletRoot: null,
        historyRoot: null,
        rootsNote: ROOTS_NOTE,
        runtimeMs: 37_848,
      },
      live: {
        source: "arweave:4mTqQxjtPpArwMw4UzLvJbzsawWoWDPN7OJrncpEuQE",
        sources: {
          identity: "arweave:4mTqQxjtPpArwMw4UzLvJbzsawWoWDPN7OJrncpEuQE",
          wallet: "arweave:CYVo4T_kDRVAoMJUcWF1fDz6OI7CdZit8X4m-4jFC8Q",
        },
        totalTdh: 2_073_214_934,
        identities: 10_282,
        wallets: 11_133,
      },
    },
    agreement: ALL_EQUAL,
    differences: [],
    differenceSummary: NO_DIFFERENCES,
    verdict: "OK",
  },
};
