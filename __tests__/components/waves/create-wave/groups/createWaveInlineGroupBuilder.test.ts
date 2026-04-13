import {
  buildInlineGroupName,
  createEmptyInlineGroupPayload,
  dedupeInlineIdentities,
  getInlineGroupConfiguredRules,
  getInlineGroupDraftSummary,
  getInlineIdentityAddresses,
  getInlineGroupRuleCount,
  CreateWaveInlineGroupRuleType,
} from "@/components/waves/create-wave/groups/createWaveInlineGroupBuilder";

describe("createWaveInlineGroupBuilder", () => {
  it("builds a deterministic default group name", () => {
    expect(
      buildInlineGroupName({
        waveName: "My Wave",
        groupLabel: "Who can view",
      })
    ).toBe("My Wave Who can view");
  });

  it("counts configured rule types once per rule family", () => {
    const draft = createEmptyInlineGroupPayload();
    draft.group.level = { min: 3, max: null };
    draft.group.owns_nfts = [
      { name: "Memes" as any, tokens: [] },
      { name: "Gradients" as any, tokens: ["12"] },
    ];

    expect(getInlineGroupRuleCount(draft)).toBe(3);
  });

  it("returns configured rules in display order", () => {
    const draft = createEmptyInlineGroupPayload();
    draft.group.tdh = { ...draft.group.tdh, min: 10 };
    draft.group.cic = { ...draft.group.cic, max: 200 };
    draft.group.owns_nfts = [
      { name: "Memes" as any, tokens: [] },
      { name: "Gradients" as any, tokens: ["12"] },
    ];
    draft.group.is_beneficiary_of_grant_id = "grant-1";

    expect(getInlineGroupConfiguredRules(draft)).toEqual([
      CreateWaveInlineGroupRuleType.TDH,
      CreateWaveInlineGroupRuleType.CIC,
      CreateWaveInlineGroupRuleType.NFTS,
      CreateWaveInlineGroupRuleType.COLLECTIONS,
      CreateWaveInlineGroupRuleType.XTDH_GRANT,
    ]);
  });

  it("builds a compact draft summary", () => {
    const draft = createEmptyInlineGroupPayload();
    draft.group.rep = {
      ...draft.group.rep,
      min: 5,
    };

    expect(
      getInlineGroupDraftSummary({
        draft,
        identityCount: 2,
      })
    ).toBe("2 identities · 1 rule");
  });

  it("dedupes and serializes inline identities by selected wallet", () => {
    const firstSelectedWallet = {
      profile_id: "profile-1",
      handle: "alpha",
      normalised_handle: "alpha",
      primary_wallet: "0xPRIMARY",
      display: "Alpha",
      tdh: 0,
      level: 0,
      cic_rating: 0,
      wallet: "0xAAA1",
      pfp: null,
    };
    const secondSelectedWallet = {
      ...firstSelectedWallet,
      wallet: "0xAAA2",
    };

    expect(
      dedupeInlineIdentities([firstSelectedWallet, secondSelectedWallet]).map(
        (identity) => identity.wallet
      )
    ).toEqual(["0xAAA1", "0xAAA2"]);
    expect(
      getInlineIdentityAddresses([firstSelectedWallet, secondSelectedWallet])
    ).toEqual(["0xaaa1", "0xaaa2"]);
  });
});
