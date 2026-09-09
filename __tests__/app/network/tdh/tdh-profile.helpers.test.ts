import {
  getBoostLabel,
  reconcileTdhProfile,
  tdhProfileSchema,
} from "@/app/network/tdh/tdh-profile.helpers";

const snapshot = {
  block: 100,
  date: "2026-01-02T00:05:00Z",
  wallets: ["0x1111111111111111111111111111111111111111"],
  consolidation_display: "example",
  tdh: 202,
  tdh__raw: 200,
  boost: 1.5,
  boosted_tdh: 304,
  boosted_tdh_rate: 3.03,
  memes: [1, 2].map((id) => ({
    id,
    tdh: 101,
    tdh__raw: 100,
    balance: 1,
    hodl_rate: 1.01,
    days_held_per_edition: [100],
  })),
  gradients: [],
  nextgen: [],
  boost_breakdown: { memes_card_sets: { acquired: 0.5, available: 0.64 } },
};

describe("TDH snapshot reconciliation", () => {
  it("rounds each stored token base before summing the final score", () => {
    const result = reconcileTdhProfile(tdhProfileSchema.parse(snapshot));
    expect(result).toEqual({ total: 304, matches: true });
    expect(Math.round(snapshot.tdh * snapshot.boost)).toBe(303);
  });

  it("flags a stored total or base that cannot be reconciled", () => {
    expect(
      reconcileTdhProfile(
        tdhProfileSchema.parse({ ...snapshot, boosted_tdh: 303 })
      ).matches
    ).toBe(false);
    expect(
      reconcileTdhProfile(tdhProfileSchema.parse({ ...snapshot, tdh: 203 }))
        .matches
    ).toBe(false);
  });

  it("rejects incomplete and invalid snapshots instead of showing zero TDH", () => {
    expect(
      tdhProfileSchema.safeParse({ ...snapshot, nextgen: undefined }).success
    ).toBe(false);
    expect(
      tdhProfileSchema.safeParse({ ...snapshot, boost: Number.NaN }).success
    ).toBe(false);
    expect(
      tdhProfileSchema.safeParse({ ...snapshot, boosted_tdh: -1 }).success
    ).toBe(false);
  });

  it("labels arbitrary future season keys without a fixed season list", () => {
    expect(getBoostLabel("memes_szn20")).toEqual({
      kind: "season",
      season: 20,
    });
    expect(getBoostLabel("memes_szn20extra")).toEqual({
      kind: "other",
      label: "other",
    });
    expect(getBoostLabel("toString")).toEqual({
      kind: "other",
      label: "other",
    });
  });

  it("preserves decimal NextGen identifiers beyond safe JavaScript integer precision", () => {
    const id = "100000000260000000001";
    const parsed = tdhProfileSchema.parse({
      ...snapshot,
      nextgen: [{ ...snapshot.memes[0], id }],
    });
    expect(parsed.nextgen[0]?.id).toBe(id);
    expect(parsed.memes[0]?.id).toBe("1");
    expect(
      tdhProfileSchema.safeParse({
        ...snapshot,
        nextgen: [{ ...snapshot.memes[0], id: Number.MAX_SAFE_INTEGER + 1 }],
      }).success
    ).toBe(false);
    expect(
      tdhProfileSchema.safeParse({
        ...snapshot,
        nextgen: [{ ...snapshot.memes[0], id: "1e10" }],
      }).success
    ).toBe(false);
  });
});
