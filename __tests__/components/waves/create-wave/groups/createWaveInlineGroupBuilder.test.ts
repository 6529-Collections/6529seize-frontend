import {
  buildInlineGroupName,
  createEmptyInlineGroupPayload,
  createEmptyInlineGroupWalletSources,
  createInlineGroupBuilderStateFromSavedGroup,
  createInitialInlineGroupBuilderState,
  dedupeInlineIdentities,
  getInlineGroupConfiguredRules,
  getInlineGroupDraftSummary,
  getInlineIdentityAddresses,
  getInlineGroupRuleCount,
  CreateWaveInlineGroupRuleType,
} from "@/components/waves/create-wave/groups/createWaveInlineGroupBuilder";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";

describe("createWaveInlineGroupBuilder", () => {
  const currentUserIdentity = {
    profile_id: "profile-me",
    handle: "me",
    normalised_handle: "me",
    primary_wallet: "0xME",
    display: "Me",
    tdh: 42,
    level: 3,
    cic_rating: 5,
    wallet: "0xME",
    pfp: "me.png",
  };

  it("builds a deterministic default group name", () => {
    expect(
      buildInlineGroupName({
        waveName: "My Wave",
        groupLabel: "Visibility",
        fallbackName: "Wave Group",
      })
    ).toBe("My Wave Visibility");
  });

  it("uses the localized fallback when the name inputs are empty", () => {
    expect(
      buildInlineGroupName({
        waveName: " ",
        groupLabel: null,
        fallbackName: "Localized group",
      })
    ).toBe("Localized group");
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

  it("builds a readable criteria summary", () => {
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
    ).toBe("REP at least 5 and 2 explicitly included users");
  });

  it("uses the grant collection name in the inline summary", () => {
    const draft = createEmptyInlineGroupPayload();
    draft.group.is_beneficiary_of_grant_id =
      "1884c41e-d366-432f-a473-5f8e99dc61ab";

    expect(
      getInlineGroupDraftSummary({
        draft,
        identityCount: 1,
        beneficiaryGrantCollectionName: " Argonauts ",
      })
    ).toBe("xTDH grant for Argonauts and 1 explicitly included user");

    expect(
      getInlineGroupDraftSummary({
        draft,
        identityCount: 0,
      })
    ).toBe("Selected xTDH grant");
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

    expect(
      getInlineIdentityAddresses([firstSelectedWallet], {
        ...createEmptyInlineGroupWalletSources(),
        emmaWallets: ["0xAAA1", "0x1111111111111111111111111111111111111111"],
        uploadedWallets: [
          "0x1111111111111111111111111111111111111111",
          "0x2222222222222222222222222222222222222222",
        ],
      })
    ).toEqual([
      "0xaaa1",
      "0x1111111111111111111111111111111111111111",
      "0x2222222222222222222222222222222222222222",
    ]);
  });

  it("seeds the initial group payload with default identities", () => {
    const state = createInitialInlineGroupBuilderState([currentUserIdentity]);

    expect(state.identities).toEqual([currentUserIdentity]);
    expect(state.excludedIdentities).toEqual([]);
    expect(state.includedWalletSources).toEqual(
      createEmptyInlineGroupWalletSources()
    );
    expect(state.excludedWalletSources).toEqual(
      createEmptyInlineGroupWalletSources()
    );
    expect(state.draft.group.identity_addresses).toEqual(["0xme"]);
    expect(state.draft.group.excluded_identity_addresses).toBeNull();
    expect(state.criteriaReplacementActive).toBe(false);
  });

  it("hydrates a complete editable draft from a saved group", () => {
    const savedGroup = {
      id: "group-1",
      name: "Saved group",
      is_private: true,
      group: {
        tdh: { min: 1, max: 100, inclusion_strategy: "BOTH" },
        rep: {
          min: 4,
          max: 20,
          direction: "RECEIVED",
          user_identity: "prxt0",
          category: "dev",
        },
        cic: {
          min: 5,
          max: 30,
          direction: "SENT",
          user_identity: "punk6529",
        },
        level: { min: 10, max: 12 },
        owns_nfts: [
          { name: "MEMES", tokens: ["52"] },
          { name: "GRADIENTS", tokens: [] },
        ],
        identity_group_id: "included-group",
        identity_group_identities_count: 2,
        excluded_identity_group_id: "excluded-group",
        excluded_identity_group_identities_count: 2,
        is_beneficiary_of_grant_id: "grant-1",
        is_beneficiary_of_grant_match_mode: "ALL_TOKENS",
        is_beneficiary_of_grant: null,
      },
    } as ApiGroupFull;

    const state = createInlineGroupBuilderStateFromSavedGroup({
      group: savedGroup,
      includedWallets: [" 0xAAA ", "0xaaa", "0xCCC"],
      excludedWallets: ["0xBBB", "0xAAA", "0xbbb"],
    });

    expect(state.draft).toEqual({
      name: "Saved group",
      is_private: true,
      group: {
        tdh: { min: 1, max: 100, inclusion_strategy: "BOTH" },
        rep: {
          min: 4,
          max: 20,
          direction: "RECEIVED",
          user_identity: "prxt0",
          category: "dev",
        },
        cic: {
          min: 5,
          max: 30,
          direction: "SENT",
          user_identity: "punk6529",
        },
        level: { min: 10, max: 12 },
        owns_nfts: [
          { name: "MEMES", tokens: ["52"] },
          { name: "GRADIENTS", tokens: [] },
        ],
        identity_addresses: ["0xaaa", "0xccc"],
        excluded_identity_addresses: ["0xbbb"],
        is_beneficiary_of_grant_id: "grant-1",
        is_beneficiary_of_grant_match_mode: "ALL_TOKENS",
      },
    });
    expect(state.identities.map((identity) => identity.wallet)).toEqual([
      "0xaaa",
      "0xccc",
    ]);
    expect(state.excludedIdentities.map((identity) => identity.wallet)).toEqual(
      ["0xbbb"]
    );
    expect(state.criteriaReplacementActive).toBe(true);
    expect(state.panel).toBe("rule-list");
  });
});
