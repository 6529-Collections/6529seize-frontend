import {
  REGISTRY_V14,
  clusters,
  pairState,
  type DelegationEvent,
} from "@/components/explained/engine/tdh";

/**
 * "Four wallets, one identity" (TDH-DESIGN.md §5.9): each case as the
 * registrations it is made of, grouped by the TDH v1.4 engine (P26 §6.2,
 * §6.3, D136). Links made before the gate are registered long before it;
 * fresh ones after it. A link registered "one pair at a time" is confirmed
 * in its own blocks; D's batch confirms its three links in one block, after
 * A, B and C have each registered to D in a transaction of their own.
 */
const R = REGISTRY_V14;
const GATE = R.consolidation_gate_activation_s;
/** An old registration: two hundred days before the gate. */
const OLD = GATE - 200 * R.day_s;
/** A fresh one: a day after it. */
const FRESH = GATE + R.day_s;

export type WalletLetter = "A" | "B" | "C" | "D" | "E";

/** Lettered example wallets, never real addresses. */
const ADDRESS: Record<WalletLetter, string> = {
  A: "0x000000000000000000000000000000000000000a",
  B: "0x000000000000000000000000000000000000000b",
  C: "0x000000000000000000000000000000000000000c",
  D: "0x000000000000000000000000000000000000000d",
  E: "0x000000000000000000000000000000000000000e",
};
const LETTER = new Map(
  (Object.entries(ADDRESS) as [WalletLetter, string][]).map(([k, v]) => [v, k])
);

export type WalletPreset =
  | "three"
  | "missing"
  | "oldfour"
  | "step1"
  | "step2"
  | "step3"
  | "batch"
  | "five";

type LinkKind = "old" | "fresh" | "batch";
type LinkSpec = readonly [WalletLetter, WalletLetter, LinkKind];

const ABC: readonly LinkSpec[] = [
  ["A", "B", "old"],
  ["B", "C", "old"],
  ["A", "C", "old"],
];

const PRESETS: Record<WalletPreset, readonly LinkSpec[]> = {
  three: ABC,
  missing: [
    ["A", "B", "old"],
    ["B", "C", "old"],
  ],
  oldfour: [...ABC, ["D", "A", "old"], ["D", "B", "old"], ["D", "C", "old"]],
  step1: [...ABC, ["D", "A", "fresh"]],
  step2: [...ABC, ["D", "A", "fresh"], ["D", "B", "fresh"]],
  step3: [
    ...ABC,
    ["D", "A", "fresh"],
    ["D", "B", "fresh"],
    ["D", "C", "fresh"],
  ],
  batch: [
    ...ABC,
    ["D", "A", "batch"],
    ["D", "B", "batch"],
    ["D", "C", "batch"],
  ],
  five: [
    ["A", "B", "fresh"],
    ["A", "C", "fresh"],
    ["A", "D", "fresh"],
    ["B", "C", "fresh"],
    ["B", "D", "fresh"],
    ["C", "D", "fresh"],
    ["E", "A", "fresh"],
    ["E", "B", "fresh"],
    ["E", "C", "fresh"],
    ["E", "D", "fresh"],
  ],
};

function register(
  from: WalletLetter,
  to: WalletLetter,
  block: number,
  logIndex: number,
  time: number
): DelegationEvent {
  return {
    block,
    txIndex: 0,
    logIndex,
    kind: "REGISTER",
    from: ADDRESS[from],
    to: ADDRESS[to],
    collection: R.memes,
    timestamp: time,
  };
}

/** The registrations of a case, in the order they land on chain. */
function presetEvents(preset: WalletPreset): DelegationEvent[] {
  const events: DelegationEvent[] = [];
  let block = 100;
  const batch: LinkSpec[] = [];
  for (const link of PRESETS[preset]) {
    const [a, b, kind] = link;
    if (kind === "batch") {
      // b (A, B or C) registers to a (D) in a transaction of its own.
      events.push(register(b, a, block, 0, FRESH));
      block += 1;
      batch.push(link);
      continue;
    }
    const time = kind === "old" ? OLD : FRESH;
    events.push(register(a, b, block, 0, time));
    events.push(register(b, a, block + 1, 0, time));
    block += 2;
  }
  // D signs last: one transaction, its three registrations in one block.
  batch.forEach(([a, b], index) => {
    events.push(register(a, b, block + 10, index, FRESH));
  });
  return events;
}

export interface WalletCase {
  readonly wallets: readonly WalletLetter[];
  readonly links: readonly {
    readonly a: WalletLetter;
    readonly b: WalletLetter;
    readonly kind: "old" | "fresh";
  }[];
  /** Each identity of two or more wallets, its letters in order. */
  readonly groups: readonly (readonly WalletLetter[])[];
  readonly alone: readonly WalletLetter[];
}

const ORDER: readonly WalletLetter[] = ["A", "B", "C", "D", "E"];

export function walletCase(preset: WalletPreset): WalletCase {
  const result = clusters(pairState(presetEvents(preset)), R);
  const specs = PRESETS[preset];
  const present = new Set<WalletLetter>();
  for (const [a, b] of specs) {
    present.add(a);
    present.add(b);
  }
  const wallets = ORDER.filter((letter) => present.has(letter));
  const groups = result.clusters
    .map((group) =>
      group
        .map((address) => LETTER.get(address))
        .filter((letter): letter is WalletLetter => letter !== undefined)
        .sort()
    )
    .sort((x, y) => (x[0] ?? "").localeCompare(y[0] ?? ""));
  const grouped = new Set(groups.flat());
  return {
    wallets,
    links: specs.map(([a, b, kind]) => ({
      a,
      b,
      kind: kind === "old" ? "old" : "fresh",
    })),
    groups,
    alone: wallets.filter((letter) => !grouped.has(letter)),
  };
}

/**
 * Where each wallet is drawn, as shares of the figure. With five wallets the
 * one a rule left alone stands outside the group, so the group's boundary
 * never seems to hold it.
 */
export function walletPositions(
  found: WalletCase
): Record<string, { readonly x: number; readonly y: number }> {
  // The hull is a rounded box around its group, so a wallet left alone must
  // sit outside every group's box: with one alone, the groups take the right
  // and the lone wallets the left, as with five.
  if (found.wallets.length < 5 && found.alone.length === 0) {
    const corners: Record<string, { x: number; y: number }> = {
      A: { x: 0.22, y: 0.24 },
      B: { x: 0.78, y: 0.24 },
      C: { x: 0.78, y: 0.74 },
      D: { x: 0.22, y: 0.74 },
    };
    return Object.fromEntries(
      found.wallets.map((letter) => [
        letter,
        corners[letter] ?? { x: 0.5, y: 0.5 },
      ])
    );
  }
  const slots = [
    { x: 0.42, y: 0.24 },
    { x: 0.86, y: 0.24 },
    { x: 0.86, y: 0.76 },
    { x: 0.42, y: 0.76 },
  ];
  const out: Record<string, { x: number; y: number }> = {};
  const inGroup = found.wallets.filter((w) => !found.alone.includes(w));
  inGroup.forEach((letter, index) => {
    out[letter] = slots[index] ?? { x: 0.64, y: 0.5 };
  });
  found.alone.forEach((letter, index) => {
    out[letter] = { x: 0.1, y: 0.5 + index * 0.2 };
  });
  return out;
}
