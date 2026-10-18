/**
 * Three more conformance vectors restated in full, for checking an
 * implementation by hand before the vector files are published (D116):
 * 04-mid-period-transfer, 06-consolidation-age-carry and 23-identity-sums,
 * as their files state them at 6529chain f840096 (unchanged at 6b32f3f and
 * at 3bfa7b0).
 * Every address, transaction and token is synthetic. Ages are whole days
 * before each vector's T; a record not listed is not checked. Generated
 * from the vector files; do not edit by hand.
 */

export interface ByHandTransfer {
  readonly block: number;
  readonly tx: number;
  readonly log: number;
  readonly token: string;
  /** The last two hex digits of the address, or "mint" for ZERO. */
  readonly from: string;
  readonly to: string;
  readonly amount: number;
  /** Whole days between the transfer's time and T. */
  readonly age: number;
  /** True when the age is not a whole number of days. */
  readonly partial: boolean;
}

export interface ByHandRecord {
  readonly kind: "identity" | "wallet";
  /** The record's wallets, by their last two hex digits. */
  readonly wallets: readonly string[];
  readonly balance: number;
  readonly raw: number;
  readonly base: number;
  readonly boostC: number;
  readonly final: number;
  readonly rateE4: number | null;
  readonly tokens: readonly {
    readonly token: string;
    readonly balance: number;
    readonly raw: number;
    readonly base: number;
    readonly final: number;
  }[];
}

export interface ByHandVector {
  readonly id: string;
  /** The letters the derivation uses, by the address's last two digits. */
  readonly names: Readonly<Record<string, string>>;
  readonly seasonStarts: readonly number[];
  readonly cycle: { readonly block: number; readonly timestamp: number };
  readonly transfers: readonly ByHandTransfer[];
  readonly links: readonly {
    readonly block: number;
    readonly from: string;
    readonly to: string;
  }[];
  readonly h: number | null;
  readonly rates: Readonly<Record<string, number>>;
  readonly records: readonly ByHandRecord[];
}

export const BY_HAND_VECTORS: readonly ByHandVector[] = [
  {
    id: "04-mid-period-transfer",
    names: { a1: "A", b2: "B" },
    seasonStarts: [1],
    cycle: { block: 26165481, timestamp: 1791676799 },
    transfers: [
      {
        block: 1001,
        tx: 0,
        log: 0,
        token: "memes#1",
        from: "mint",
        to: "a1",
        amount: 2,
        age: 30,
        partial: false,
      },
      {
        block: 1002,
        tx: 0,
        log: 0,
        token: "memes#1",
        from: "mint",
        to: "a1",
        amount: 1,
        age: 20,
        partial: false,
      },
      {
        block: 1003,
        tx: 0,
        log: 0,
        token: "memes#1",
        from: "a1",
        to: "b2",
        amount: 1,
        age: 10,
        partial: false,
      },
    ],
    links: [],
    h: null,
    rates: {},
    records: [
      {
        kind: "identity",
        wallets: ["a1"],
        balance: 2,
        raw: 60,
        base: 60,
        boostC: 105,
        final: 63,
        rateE4: null,
        tokens: [],
      },
      {
        kind: "identity",
        wallets: ["b2"],
        balance: 1,
        raw: 10,
        base: 10,
        boostC: 100,
        final: 10,
        rateE4: null,
        tokens: [],
      },
    ],
  },
  {
    id: "06-consolidation-age-carry",
    names: { a1: "A", b2: "B" },
    seasonStarts: [1],
    cycle: { block: 26165481, timestamp: 1791676799 },
    transfers: [
      {
        block: 1001,
        tx: 0,
        log: 0,
        token: "memes#1",
        from: "mint",
        to: "b2",
        amount: 1,
        age: 200,
        partial: false,
      },
      {
        block: 1002,
        tx: 0,
        log: 0,
        token: "memes#1",
        from: "mint",
        to: "a1",
        amount: 1,
        age: 100,
        partial: false,
      },
      {
        block: 1003,
        tx: 0,
        log: 0,
        token: "memes#1",
        from: "mint",
        to: "a1",
        amount: 1,
        age: 80,
        partial: false,
      },
      {
        block: 1004,
        tx: 0,
        log: 0,
        token: "memes#1",
        from: "b2",
        to: "a1",
        amount: 1,
        age: 50,
        partial: false,
      },
    ],
    links: [
      { block: 1100, from: "a1", to: "b2" },
      { block: 1101, from: "b2", to: "a1" },
    ],
    h: null,
    rates: {},
    records: [
      {
        kind: "identity",
        wallets: ["a1", "b2"],
        balance: 3,
        raw: 380,
        base: 380,
        boostC: 108,
        final: 410,
        rateE4: null,
        tokens: [],
      },
      {
        kind: "wallet",
        wallets: ["a1"],
        balance: 3,
        raw: 380,
        base: 380,
        boostC: 108,
        final: 410,
        rateE4: null,
        tokens: [],
      },
      {
        kind: "wallet",
        wallets: ["b2"],
        balance: 0,
        raw: 0,
        base: 0,
        boostC: 100,
        final: 0,
        rateE4: null,
        tokens: [],
      },
    ],
  },
  {
    id: "23-identity-sums",
    names: {
      a1: "A",
      b2: "B",
      f0: "F",
      "91": "P",
      "92": "Q",
      "93": "R",
      "99": "S",
    },
    seasonStarts: [1, 4],
    cycle: { block: 26165481, timestamp: 1791676799 },
    transfers: [
      {
        block: 1001,
        tx: 0,
        log: 0,
        token: "memes#1",
        from: "mint",
        to: "f0",
        amount: 4,
        age: 60,
        partial: false,
      },
      {
        block: 1001,
        tx: 1,
        log: 1,
        token: "memes#2",
        from: "mint",
        to: "f0",
        amount: 2,
        age: 60,
        partial: false,
      },
      {
        block: 1001,
        tx: 2,
        log: 2,
        token: "memes#3",
        from: "mint",
        to: "f0",
        amount: 2,
        age: 60,
        partial: false,
      },
      {
        block: 1001,
        tx: 3,
        log: 3,
        token: "memes#4",
        from: "mint",
        to: "f0",
        amount: 3,
        age: 60,
        partial: false,
      },
      {
        block: 1002,
        tx: 0,
        log: 0,
        token: "memes#3",
        from: "mint",
        to: "91",
        amount: 1,
        age: 100,
        partial: false,
      },
      {
        block: 1003,
        tx: 0,
        log: 0,
        token: "memes#3",
        from: "91",
        to: "92",
        amount: 1,
        age: 50,
        partial: false,
      },
      {
        block: 1004,
        tx: 0,
        log: 0,
        token: "memes#3",
        from: "mint",
        to: "93",
        amount: 1,
        age: 30,
        partial: false,
      },
      {
        block: 1005,
        tx: 0,
        log: 0,
        token: "memes#1",
        from: "mint",
        to: "a1",
        amount: 1,
        age: 25,
        partial: false,
      },
      {
        block: 1006,
        tx: 0,
        log: 0,
        token: "memes#3",
        from: "92",
        to: "93",
        amount: 1,
        age: 20,
        partial: false,
      },
      {
        block: 1007,
        tx: 0,
        log: 0,
        token: "memes#3",
        from: "mint",
        to: "b2",
        amount: 1,
        age: 10,
        partial: false,
      },
      {
        block: 1007,
        tx: 1,
        log: 1,
        token: "memes#4",
        from: "mint",
        to: "a1",
        amount: 1,
        age: 10,
        partial: false,
      },
      {
        block: 1007,
        tx: 2,
        log: 2,
        token: "memes#4",
        from: "mint",
        to: "b2",
        amount: 1,
        age: 10,
        partial: false,
      },
      {
        block: 1008,
        tx: 0,
        log: 0,
        token: "memes#3",
        from: "93",
        to: "99",
        amount: 1,
        age: 5,
        partial: false,
      },
      {
        block: 1009,
        tx: 0,
        log: 0,
        token: "memes#2",
        from: "mint",
        to: "a1",
        amount: 1,
        age: 1,
        partial: true,
      },
      {
        block: 1009,
        tx: 1,
        log: 1,
        token: "memes#2",
        from: "mint",
        to: "b2",
        amount: 1,
        age: 1,
        partial: true,
      },
    ],
    links: [
      { block: 900, from: "a1", to: "b2" },
      { block: 901, from: "b2", to: "a1" },
      { block: 910, from: "91", to: "92" },
      { block: 911, from: "92", to: "91" },
      { block: 912, from: "91", to: "93" },
      { block: 913, from: "93", to: "91" },
      { block: 914, from: "92", to: "93" },
      { block: 915, from: "93", to: "92" },
    ],
    h: 5,
    rates: { "memes#2": 125 },
    records: [
      {
        kind: "identity",
        wallets: ["a1", "b2"],
        balance: 6,
        raw: 57,
        base: 57,
        boostC: 105,
        final: 60,
        rateE4: 68250,
        tokens: [
          { token: "memes#2", balance: 2, raw: 2, base: 2, final: 2 },
          { token: "memes#4", balance: 2, raw: 20, base: 20, final: 21 },
        ],
      },
      {
        kind: "identity",
        wallets: ["91", "92", "93"],
        balance: 1,
        raw: 30,
        base: 30,
        boostC: 100,
        final: 30,
        rateE4: 10000,
        tokens: [],
      },
      {
        kind: "wallet",
        wallets: ["a1"],
        balance: 3,
        raw: 36,
        base: 36,
        boostC: 101,
        final: 36,
        rateE4: 32825,
        tokens: [],
      },
      {
        kind: "wallet",
        wallets: ["b2"],
        balance: 3,
        raw: 21,
        base: 21,
        boostC: 101,
        final: 21,
        rateE4: 32825,
        tokens: [],
      },
      {
        kind: "wallet",
        wallets: ["91"],
        balance: 0,
        raw: 0,
        base: 0,
        boostC: 100,
        final: 0,
        rateE4: 0,
        tokens: [],
      },
      {
        kind: "wallet",
        wallets: ["92"],
        balance: 0,
        raw: 0,
        base: 0,
        boostC: 100,
        final: 0,
        rateE4: 0,
        tokens: [],
      },
      {
        kind: "wallet",
        wallets: ["93"],
        balance: 1,
        raw: 30,
        base: 30,
        boostC: 100,
        final: 30,
        rateE4: 10000,
        tokens: [],
      },
      {
        kind: "wallet",
        wallets: ["99"],
        balance: 1,
        raw: 5,
        base: 5,
        boostC: 100,
        final: 5,
        rateE4: 10000,
        tokens: [],
      },
    ],
  },
];
