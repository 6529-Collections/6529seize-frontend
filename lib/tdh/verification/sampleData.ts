/* eslint-disable sonarjs/no-duplicate-string -- a verbatim copy of the daily job's published files, whose field names repeat by design */
import type { VerificationDayInput, VerificationIndexInput } from "./schema";

/**
 * Sample verification data, shown only outside production while no data
 * source is configured, always under a "Sample" banner.
 *
 * These are the daily job's own published files for cycles 20,740 and 20,741
 * (14 and 15 October 2026): the feed fixtures of the validator code's
 * `tools/tdh-daily`, from runs of the Rust core at 80b5b1a and ae8e990 and of
 * the Python reference at 6529chain 07da329. Both runs were made before the
 * Rust core netted movements within a transaction (P26 §7.1, D131), so each
 * day two identities and two wallets differ from 6529.io: the DEV-2 cases, a
 * token sent out and back in one transaction. Re-run with netting, every
 * identity and wallet is equal on both days. `transactionNetting` records that
 * these runs did not net. Holders appear only as pseudonymous labels; every
 * value is also in 6529.io's public upload of that day.
 */

export const SAMPLE_VERIFICATION_INDEX: VerificationIndexInput = {
  days: [
    {
      cycleDay: 20_741,
      date: "2026-10-15",
      verdict: "OK",
      identitiesEqual: 10_280,
      identitiesTotal: 10_282,
      totalTdh: {
        rust: 2_073_214_694,
        python: 2_073_214_694,
        live: 2_073_214_934,
      },
    },
    {
      cycleDay: 20_740,
      date: "2026-10-14",
      verdict: "OK",
      identitiesEqual: 10_280,
      identitiesTotal: 10_282,
      totalTdh: {
        rust: 2_070_436_097,
        python: 2_070_436_097,
        live: 2_070_436_337,
      },
    },
  ],
  cutover: { plannedDate: "2026-10-23", status: "planned", cycleDay: null },
};

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
        commit: "80b5b1a7e65bb6b5dae000929eac3bb5fffbd6cc",
        totalTdh: 2_070_436_097,
        identities: 10_282,
        wallets: 11_133,
        cycleRoot:
          "0x186b2a0075b7b22f134aa1057552f751bed656e025b987dd5187da17b71a062f",
        walletRoot:
          "0x0780719389ced2909cc61d45acf0cedc62169a65954ed1ac97324c557e93465e",
        historyRoot:
          "0x5a8e834dc21a904080ba6f2275bf1ca1120f5666f6cb9d0906d418f126b46c5f",
        runtimeMs: 1_215_748,
        transactionNetting: false,
      },
      python: {
        commit: "07da329947c952917bdaa06f360236625e1065ac",
        totalTdh: 2_070_436_097,
        identities: 10_282,
        wallets: 11_133,
        cycleRoot: null,
        walletRoot: null,
        historyRoot: null,
        runtimeMs: 21_467,
        transactionNetting: false,
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
    differences: [
      {
        label: "holder-1",
        kind: "identity",
        fields: [
          {
            name: "boosted_memes_tdh",
            rust: 885_118,
            python: 885_118,
            live: 885_181,
          },
          {
            name: "boosted_tdh",
            rust: 885_118,
            python: 885_118,
            live: 885_181,
          },
          {
            name: "memes#208.tdh",
            rust: 8209,
            python: 8209,
            live: 8272,
          },
          {
            name: "memes#208.tdh__raw",
            rust: 652,
            python: 652,
            live: 657,
          },
          {
            name: "memes_tdh",
            rust: 885_118,
            python: 885_118,
            live: 885_181,
          },
          {
            name: "memes_tdh__raw",
            rust: 98_604,
            python: 98_604,
            live: 98_609,
          },
          {
            name: "tdh",
            rust: 885_118,
            python: 885_118,
            live: 885_181,
          },
          {
            name: "tdh__raw",
            rust: 98_604,
            python: 98_604,
            live: 98_609,
          },
        ],
        class: "A",
        cause: "DEV-2",
      },
      {
        label: "holder-2",
        kind: "identity",
        fields: [
          {
            name: "boosted_nextgen_tdh",
            rust: 938,
            python: 938,
            live: 1115,
          },
          {
            name: "boosted_tdh",
            rust: 938,
            python: 938,
            live: 1115,
          },
          {
            name: "nextgen#10000000049.tdh",
            rust: 776,
            python: 776,
            live: 953,
          },
          {
            name: "nextgen#10000000049.tdh__raw",
            rust: 197,
            python: 197,
            live: 242,
          },
          {
            name: "nextgen_tdh",
            rust: 938,
            python: 938,
            live: 1115,
          },
          {
            name: "nextgen_tdh__raw",
            rust: 238,
            python: 238,
            live: 283,
          },
          {
            name: "tdh",
            rust: 938,
            python: 938,
            live: 1115,
          },
          {
            name: "tdh__raw",
            rust: 238,
            python: 238,
            live: 283,
          },
        ],
        class: "A",
        cause: "DEV-2",
      },
      {
        label: "holder-1/w1",
        kind: "wallet",
        fields: [
          {
            name: "boosted_memes_tdh",
            rust: 885_118,
            python: 885_118,
            live: 885_181,
          },
          {
            name: "boosted_tdh",
            rust: 885_118,
            python: 885_118,
            live: 885_181,
          },
          {
            name: "memes#208.tdh",
            rust: 8209,
            python: 8209,
            live: 8272,
          },
          {
            name: "memes#208.tdh__raw",
            rust: 652,
            python: 652,
            live: 657,
          },
          {
            name: "memes_tdh",
            rust: 885_118,
            python: 885_118,
            live: 885_181,
          },
          {
            name: "memes_tdh__raw",
            rust: 98_604,
            python: 98_604,
            live: 98_609,
          },
          {
            name: "tdh",
            rust: 885_118,
            python: 885_118,
            live: 885_181,
          },
          {
            name: "tdh__raw",
            rust: 98_604,
            python: 98_604,
            live: 98_609,
          },
        ],
        class: "A",
        cause: "DEV-2",
      },
      {
        label: "holder-2/w1",
        kind: "wallet",
        fields: [
          {
            name: "boosted_nextgen_tdh",
            rust: 938,
            python: 938,
            live: 1115,
          },
          {
            name: "boosted_tdh",
            rust: 938,
            python: 938,
            live: 1115,
          },
          {
            name: "nextgen#10000000049.tdh",
            rust: 776,
            python: 776,
            live: 953,
          },
          {
            name: "nextgen#10000000049.tdh__raw",
            rust: 197,
            python: 197,
            live: 242,
          },
          {
            name: "nextgen_tdh",
            rust: 938,
            python: 938,
            live: 1115,
          },
          {
            name: "nextgen_tdh__raw",
            rust: 238,
            python: 238,
            live: 283,
          },
          {
            name: "tdh",
            rust: 938,
            python: 938,
            live: 1115,
          },
          {
            name: "tdh__raw",
            rust: 238,
            python: 238,
            live: 283,
          },
        ],
        class: "A",
        cause: "DEV-2",
      },
    ],
    verdict: "OK",
  },
  20_741: {
    cycleDay: 20_741,
    date: "2026-10-15",
    cutoffBlock: 26_194_188,
    mode: "unchecked-history",
    implementations: {
      rust: {
        commit: "ae8e990c08fc98fd63a12b04336100e18d50c5a8",
        totalTdh: 2_073_214_694,
        identities: 10_282,
        wallets: 11_133,
        cycleRoot:
          "0xad6daaee3c4fd40f2a2654b300773f63439b9f20cfa7fb51af9a1e8f3ca24e92",
        walletRoot:
          "0xf53c0e23332b2f197ff1dc877249329a98585c1986c6177e9be92d594a4e0482",
        historyRoot:
          "0x10c44b2ae76ad962fb4ac3abc79616f26628197dbb2a5de9583d9ecb8668e396",
        runtimeMs: 703_613,
        transactionNetting: false,
      },
      python: {
        commit: "07da329947c952917bdaa06f360236625e1065ac",
        totalTdh: 2_073_214_694,
        identities: 10_282,
        wallets: 11_133,
        cycleRoot: null,
        walletRoot: null,
        historyRoot: null,
        runtimeMs: 42_265,
        transactionNetting: false,
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
    differences: [
      {
        label: "holder-1",
        kind: "identity",
        fields: [
          {
            name: "boosted_memes_tdh",
            rust: 886_428,
            python: 886_428,
            live: 886_491,
          },
          {
            name: "boosted_tdh",
            rust: 886_428,
            python: 886_428,
            live: 886_491,
          },
          {
            name: "memes#208.tdh",
            rust: 8221,
            python: 8221,
            live: 8284,
          },
          {
            name: "memes#208.tdh__raw",
            rust: 653,
            python: 653,
            live: 658,
          },
          {
            name: "memes_tdh",
            rust: 886_428,
            python: 886_428,
            live: 886_491,
          },
          {
            name: "memes_tdh__raw",
            rust: 98_751,
            python: 98_751,
            live: 98_756,
          },
          {
            name: "tdh",
            rust: 886_428,
            python: 886_428,
            live: 886_491,
          },
          {
            name: "tdh__raw",
            rust: 98_751,
            python: 98_751,
            live: 98_756,
          },
        ],
        class: "A",
        cause: "DEV-2",
      },
      {
        label: "holder-2",
        kind: "identity",
        fields: [
          {
            name: "boosted_nextgen_tdh",
            rust: 945,
            python: 945,
            live: 1122,
          },
          {
            name: "boosted_tdh",
            rust: 945,
            python: 945,
            live: 1122,
          },
          {
            name: "nextgen#10000000049.tdh",
            rust: 780,
            python: 780,
            live: 957,
          },
          {
            name: "nextgen#10000000049.tdh__raw",
            rust: 198,
            python: 198,
            live: 243,
          },
          {
            name: "nextgen_tdh",
            rust: 945,
            python: 945,
            live: 1122,
          },
          {
            name: "nextgen_tdh__raw",
            rust: 240,
            python: 240,
            live: 285,
          },
          {
            name: "tdh",
            rust: 945,
            python: 945,
            live: 1122,
          },
          {
            name: "tdh__raw",
            rust: 240,
            python: 240,
            live: 285,
          },
        ],
        class: "A",
        cause: "DEV-2",
      },
      {
        label: "holder-1/w1",
        kind: "wallet",
        fields: [
          {
            name: "boosted_memes_tdh",
            rust: 886_428,
            python: 886_428,
            live: 886_491,
          },
          {
            name: "boosted_tdh",
            rust: 886_428,
            python: 886_428,
            live: 886_491,
          },
          {
            name: "memes#208.tdh",
            rust: 8221,
            python: 8221,
            live: 8284,
          },
          {
            name: "memes#208.tdh__raw",
            rust: 653,
            python: 653,
            live: 658,
          },
          {
            name: "memes_tdh",
            rust: 886_428,
            python: 886_428,
            live: 886_491,
          },
          {
            name: "memes_tdh__raw",
            rust: 98_751,
            python: 98_751,
            live: 98_756,
          },
          {
            name: "tdh",
            rust: 886_428,
            python: 886_428,
            live: 886_491,
          },
          {
            name: "tdh__raw",
            rust: 98_751,
            python: 98_751,
            live: 98_756,
          },
        ],
        class: "A",
        cause: "DEV-2",
      },
      {
        label: "holder-2/w1",
        kind: "wallet",
        fields: [
          {
            name: "boosted_nextgen_tdh",
            rust: 945,
            python: 945,
            live: 1122,
          },
          {
            name: "boosted_tdh",
            rust: 945,
            python: 945,
            live: 1122,
          },
          {
            name: "nextgen#10000000049.tdh",
            rust: 780,
            python: 780,
            live: 957,
          },
          {
            name: "nextgen#10000000049.tdh__raw",
            rust: 198,
            python: 198,
            live: 243,
          },
          {
            name: "nextgen_tdh",
            rust: 945,
            python: 945,
            live: 1122,
          },
          {
            name: "nextgen_tdh__raw",
            rust: 240,
            python: 240,
            live: 285,
          },
          {
            name: "tdh",
            rust: 945,
            python: 945,
            live: 1122,
          },
          {
            name: "tdh__raw",
            rust: 240,
            python: 240,
            live: 285,
          },
        ],
        class: "A",
        cause: "DEV-2",
      },
    ],
    verdict: "OK",
  },
};
