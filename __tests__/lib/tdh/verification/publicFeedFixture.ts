import type {
  VerificationDayInput,
  VerificationIndexInput,
} from "@/lib/tdh/verification/schema";

/**
 * A verbatim copy of 6529's public TDH feed (`index.json` and
 * `days/{cycleDay}.json`) as published on 15 October 2026, for cycles 20,740
 * and 20,741 (14 and 15 October). Tests parse it to keep the page's schema
 * in step with the real feed. The pages never bundle it: they read the feed.
 */

export const PUBLIC_FEED_INDEX: VerificationIndexInput = {
  days: [
    {
      cycleDay: 20741,
      date: "2026-10-15",
      verdict: "OK",
      identitiesEqual: 10282,
      identitiesTotal: 10282,
      totalTdh: {
        rust: 2073214934,
        python: 2073214934,
        live: 2073214934,
      },
    },
    {
      cycleDay: 20740,
      date: "2026-10-14",
      verdict: "OK",
      identitiesEqual: 10282,
      identitiesTotal: 10282,
      totalTdh: {
        rust: 2070436337,
        python: 2070436337,
        live: 2070436337,
      },
    },
  ],
};

export const PUBLIC_FEED_DAYS: Readonly<Record<number, VerificationDayInput>> =
  {
    20740: {
      cycleDay: 20740,
      date: "2026-10-14",
      cutoffBlock: 26187014,
      mode: "unchecked-history",
      implementations: {
        rust: {
          commit: "2b172160e6daa50761ec054a5f53ba4c755cfbcc",
          totalTdh: 2070436337,
          identities: 10282,
          wallets: 11133,
          cycleRoot:
            "0x0a21505c92359cc78110f3fb00cf79a68e3b0805a3878ed829aad39dd40e95c5",
          walletRoot:
            "0xbd9d5a848575e7c7e040512856afabbb0b3a497e932d465e84ddad79874af30c",
          historyRoot:
            "0x5a8e834dc21a904080ba6f2275bf1ca1120f5666f6cb9d0906d418f126b46c5f",
          runtimeMs: 1271552,
        },
        python: {
          commit: "0621ed4651e7a3be37bfa1862648d0d0291215d5",
          totalTdh: 2070436337,
          identities: 10282,
          wallets: 11133,
          cycleRoot: null,
          walletRoot: null,
          historyRoot: null,
          rootsNote:
            "The Python reference has no Keccak tree, so it computes no roots; its records are compared with Rust's instead, and identical record files commit to identical roots.",
          runtimeMs: 12045,
        },
        live: {
          source: "arweave:5V7lje2GIOEr6opL7J6j7KPcBiZDeGFNSrUtkRPpQI8",
          sources: {
            identity: "arweave:5V7lje2GIOEr6opL7J6j7KPcBiZDeGFNSrUtkRPpQI8",
            wallet: "arweave:p1ZpChcxNbFasJyZKLplZbDO4ZLm3KB7C5NceNzrmjI",
          },
          totalTdh: 2070436337,
          identities: 10282,
          wallets: 11133,
        },
      },
      agreement: {
        rustVsPython: {
          identitiesEqual: 10282,
          identitiesTotal: 10282,
          walletsEqual: 11133,
          walletsTotal: 11133,
        },
        rustVsLive: {
          identitiesEqual: 10282,
          identitiesTotal: 10282,
          walletsEqual: 11133,
          walletsTotal: 11133,
        },
      },
      differences: [],
      differenceSummary: {
        identities: 0,
        wallets: 0,
        byClass: {
          A: 0,
          B: 0,
          C: 0,
          D: 0,
        },
        byCause: {},
        totalTdhDelta: {
          rustVsLive: 0,
          pythonVsLive: 0,
        },
      },
      verdict: "OK",
    },
    20741: {
      cycleDay: 20741,
      date: "2026-10-15",
      cutoffBlock: 26194188,
      mode: "unchecked-history",
      implementations: {
        rust: {
          commit: "e1276762ec5cf014bfb30efcb081f940d3d02154",
          totalTdh: 2073214934,
          identities: 10282,
          wallets: 11133,
          cycleRoot:
            "0x7d41f8c696a830433ddb545a352b2cc1ef6ef5905ed69c03031a550dd6ef8bdf",
          walletRoot:
            "0xc3710b38062be7b220c1c8440cacb4d0ee7d13c316a326496d2a90d0e8210c45",
          historyRoot:
            "0x10c44b2ae76ad962fb4ac3abc79616f26628197dbb2a5de9583d9ecb8668e396",
          runtimeMs: 815909,
        },
        python: {
          commit: "0621ed4651e7a3be37bfa1862648d0d0291215d5",
          totalTdh: 2073214934,
          identities: 10282,
          wallets: 11133,
          cycleRoot: null,
          walletRoot: null,
          historyRoot: null,
          rootsNote:
            "The Python reference has no Keccak tree, so it computes no roots; its records are compared with Rust's instead, and identical record files commit to identical roots.",
          runtimeMs: 12105,
        },
        live: {
          source: "arweave:4mTqQxjtPpArwMw4UzLvJbzsawWoWDPN7OJrncpEuQE",
          sources: {
            identity: "arweave:4mTqQxjtPpArwMw4UzLvJbzsawWoWDPN7OJrncpEuQE",
            wallet: "arweave:CYVo4T_kDRVAoMJUcWF1fDz6OI7CdZit8X4m-4jFC8Q",
          },
          totalTdh: 2073214934,
          identities: 10282,
          wallets: 11133,
        },
      },
      agreement: {
        rustVsPython: {
          identitiesEqual: 10282,
          identitiesTotal: 10282,
          walletsEqual: 11133,
          walletsTotal: 11133,
        },
        rustVsLive: {
          identitiesEqual: 10282,
          identitiesTotal: 10282,
          walletsEqual: 11133,
          walletsTotal: 11133,
        },
      },
      differences: [],
      differenceSummary: {
        identities: 0,
        wallets: 0,
        byClass: {
          A: 0,
          B: 0,
          C: 0,
          D: 0,
        },
        byCause: {},
        totalTdhDelta: {
          rustVsLive: 0,
          pythonVsLive: 0,
        },
      },
      verdict: "OK",
    },
  };
