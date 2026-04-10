import {
  buildInlineGroupName,
  createEmptyInlineGroupPayload,
  getInlineGroupDraftSummary,
  getInlineGroupRuleCount,
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
});
