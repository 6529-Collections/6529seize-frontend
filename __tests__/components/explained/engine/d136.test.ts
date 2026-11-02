/** @jest-environment node */
import {
  REGISTRY_V14,
  clusters,
  fork,
  pairState,
  type DelegationEvent,
  type Registry,
} from "@/components/explained/engine/tdh";

/**
 * The nine D136 checks: the four-wallet rule on the scenarios the decision
 * describes, the ones the Your wallets and Consolidation design models draw
 * (TDH-DESIGN §5.9). A registration at or after the registry's activation
 * time (2026-10-15 00:00 UTC) is fresh; one 200 days before it is old.
 */
const R = REGISTRY_V14;
const FRESH = R.consolidation_gate_activation_s;
const OLD = FRESH - 86_400 * 200;
/** tdh-v1.0's limit: groups of three, never four. */
const THREE_WALLETS: Registry = fork(R, {
  consolidation_max_wallets: 3,
  consolidation_ungated_max_wallets: 3,
});

let block = 0;
function reg(
  from: string,
  to: string,
  time: number,
  at?: { readonly block: number; readonly logIndex: number }
): DelegationEvent {
  return {
    block: at?.block ?? ++block,
    txIndex: 0,
    logIndex: at?.logIndex ?? 0,
    kind: "REGISTER",
    from,
    to,
    collection: R.memes,
    timestamp: time,
  };
}
function revoke(from: string, to: string): DelegationEvent {
  return { ...reg(from, to, 0), kind: "REVOKE" };
}
/** A, B and C linked both ways long before activation. */
function threeOld(): DelegationEvent[] {
  block = 0;
  return ["AB", "BA", "AC", "CA", "BC", "CB"].map((pair) =>
    reg(pair[0] as string, pair[1] as string, OLD)
  );
}
function groups(events: readonly DelegationEvent[], r: Registry = R): string {
  return clusters(pairState(events), r)
    .clusters.map((group) => group.join(""))
    .sort()
    .join(" ");
}
function largest(events: readonly DelegationEvent[], r: Registry = R): number {
  return Math.max(
    ...clusters(pairState(events), r).clusters.map((group) => group.length)
  );
}

describe("D136: up to four wallets count as one collector", () => {
  it("1. three old links make one identity", () => {
    expect(groups(threeOld())).toBe("ABC");
  });

  it("2. D registering to all three is pending only", () => {
    const events = [
      ...threeOld(),
      reg("D", "A", FRESH + 10),
      reg("D", "B", FRESH + 10),
      reg("D", "C", FRESH + 10),
    ];
    expect(groups(events)).toBe("ABC");
  });

  /** D registers to all three, then they confirm in turn: A, B, C. */
  function confirmations(count: number): DelegationEvent[] {
    const events = [
      ...threeOld(),
      reg("D", "A", FRESH + 10),
      reg("D", "B", FRESH + 10),
      reg("D", "C", FRESH + 10),
    ];
    ["A", "B", "C"]
      .slice(0, count)
      .forEach((w, i) => events.push(reg(w, "D", FRESH + 20 + 10 * i)));
    return events;
  }

  it("3. A confirms first: the newest link, A-D, splits the group", () => {
    expect(groups(confirmations(1))).toBe("AD BC");
  });

  it("4. B confirms: A, B and D; C alone", () => {
    expect(groups(confirmations(2))).toBe("ABD");
  });

  it("5. C confirms: D is a fresh hub, so the group grows to four", () => {
    expect(groups(confirmations(3))).toBe("ABCD");
  });

  it("6. D signing last, in one block, never splits the group", () => {
    const events = [
      ...threeOld(),
      reg("A", "D", FRESH + 10),
      reg("B", "D", FRESH + 11),
      reg("C", "D", FRESH + 12),
    ];
    const batch = ++block;
    events.push(
      reg("D", "A", FRESH + 20, { block: batch, logIndex: 0 }),
      reg("D", "B", FRESH + 20, { block: batch, logIndex: 1 }),
      reg("D", "C", FRESH + 20, { block: batch, logIndex: 2 })
    );
    expect(groups(events)).toBe("ABCD");
  });

  it("7. with one of D's links old and no other hub, the fourth is refused", () => {
    const events = [
      ...threeOld(),
      reg("A", "D", OLD + 5),
      reg("D", "A", OLD + 6),
      reg("B", "D", FRESH + 1),
      reg("D", "B", FRESH + 2),
      reg("C", "D", FRESH + 3),
      reg("D", "C", FRESH + 4),
    ];
    expect(largest(events)).toBe(3);
    const result = clusters(pairState(events), R);
    expect(result.refusals.length).toBeGreaterThan(0);
  });

  it("8. re-registering A-D fresh makes D a hub", () => {
    const events = [
      ...threeOld(),
      reg("A", "D", OLD + 5),
      reg("D", "A", OLD + 6),
      reg("B", "D", FRESH + 1),
      reg("D", "B", FRESH + 2),
      reg("C", "D", FRESH + 3),
      reg("D", "C", FRESH + 4),
      revoke("A", "D"),
      reg("A", "D", FRESH + 60),
      reg("D", "A", FRESH + 61),
    ];
    expect(groups(events)).toBe("ABCD");
  });

  it("9. the three-wallet registry of tdh-v1.0 never groups four", () => {
    const events = [
      ...threeOld(),
      reg("D", "A", FRESH),
      reg("A", "D", FRESH + 1),
      reg("D", "B", FRESH + 2),
      reg("B", "D", FRESH + 3),
      reg("D", "C", FRESH + 4),
      reg("C", "D", FRESH + 5),
    ];
    expect(largest(events, THREE_WALLETS)).toBe(3);
    expect(largest(events)).toBe(4);
  });
});

describe("the Four wallets, one identity model's presets (TDH-DESIGN §5.9)", () => {
  // Old links at 1,700,000,000; fresh ones at 1,792,100,000.
  const old = 1_700_000_000;
  const fresh = 1_792_100_000;
  const linked = (pairs: readonly string[], time: number): DelegationEvent[] =>
    pairs.flatMap((pair) => [
      reg(pair[0] as string, pair[1] as string, time),
      reg(pair[1] as string, pair[0] as string, time),
    ]);

  it("one pair missing: B + C, A alone", () => {
    block = 0;
    const result = clusters(pairState(linked(["AC", "BC"], old)), R);
    expect(result.clusters).toEqual([["B", "C"]]);
    expect(result.of["A"]).toEqual(["A"]);
  });

  it("four linked before Oct 15: three together, one alone", () => {
    block = 0;
    const events = linked(["AB", "AC", "AD", "BC", "BD", "CD"], old);
    expect(largest(events)).toBe(3);
    expect(groups(events)).toHaveLength(3);
  });

  it("five wallets: the group of four is built from the newest links, so an older wallet can be pushed out", () => {
    block = 0;
    const events = [
      ...linked(["AB", "AC", "BC"], old),
      ...linked(["DA", "DB", "DC"], fresh),
      ...linked(["ED", "EB", "EC"], fresh + 100),
    ];
    const result = clusters(pairState(events), R);
    expect(result.clusters).toEqual([["B", "C", "D", "E"]]);
    expect(result.of["A"]).toEqual(["A"]);
  });
});
