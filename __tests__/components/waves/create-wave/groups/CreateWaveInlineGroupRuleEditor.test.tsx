import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveInlineGroupRuleEditor from "@/components/waves/create-wave/groups/CreateWaveInlineGroupRuleEditor";
import {
  createEmptyInlineGroupPayload,
  CreateWaveInlineGroupRuleType,
} from "@/components/waves/create-wave/groups/createWaveInlineGroupBuilder";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import { ApiGroupBeneficiaryGrantMatchMode } from "@/generated/models/ApiGroupBeneficiaryGrantMatchMode";

/**
 * Each rule editor is a shared group-config component with its own spec; here we
 * only assert that the dispatcher wires the right child to the right slice of the
 * draft and folds its callback back into an updated draft. `jest.mock` factories
 * are hoisted above module scope, so the stub for each editor is spelled out
 * inline rather than produced by a shared local helper.
 */
jest.mock(
  "@/components/groups/page/create/config/GroupCreateLevel",
  () =>
    function MockLevel(props: {
      readonly setLevel: (level: { min: number | null; max: number | null }) => void;
    }) {
      return (
        <div data-testid="level-editor">
          <button
            type="button"
            onClick={() => props.setLevel({ min: 5, max: null })}
          >
            set-level-editor
          </button>
        </div>
      );
    }
);
jest.mock(
  "@/components/groups/page/create/config/GroupCreateTDH",
  () =>
    function MockTdh(props: {
      readonly setTDH: (tdh: { min: number | null; max: number | null }) => void;
    }) {
      return (
        <div data-testid="tdh-editor">
          <button
            type="button"
            onClick={() => props.setTDH({ min: 100, max: null })}
          >
            set-tdh-editor
          </button>
        </div>
      );
    }
);
jest.mock(
  "@/components/groups/page/create/config/GroupCreateCIC",
  () =>
    function MockCic(props: {
      readonly cic: { min: number | null };
      readonly setCIC: (cic: { min: number | null }) => void;
    }) {
      return (
        <div data-testid="cic-editor">
          <button type="button" onClick={() => props.setCIC({ min: 10 })}>
            set-cic-editor
          </button>
        </div>
      );
    }
);
jest.mock(
  "@/components/groups/page/create/config/GroupCreateRep",
  () =>
    function MockRep(props: {
      readonly rep: { min: number | null };
      readonly setRep: (rep: { min: number | null }) => void;
    }) {
      return (
        <div data-testid="rep-editor">
          <button type="button" onClick={() => props.setRep({ min: 20 })}>
            set-rep-editor
          </button>
        </div>
      );
    }
);
jest.mock(
  "@/components/groups/page/create/config/nfts/GroupCreateNfts",
  () =>
    function MockNfts(props: {
      readonly setNfts: (nfts: { name: string; tokens: string[] }[]) => void;
    }) {
      return (
        <div data-testid="nfts-editor">
          <button
            type="button"
            onClick={() => props.setNfts([{ name: "Memes", tokens: ["1"] }])}
          >
            set-nfts-editor
          </button>
        </div>
      );
    }
);
jest.mock(
  "@/components/groups/page/create/config/nfts/GroupCreateCollections",
  () =>
    function MockCollections(props: {
      readonly setNfts: (nfts: { name: string; tokens: string[] }[]) => void;
    }) {
      return (
        <div data-testid="collections-editor">
          <button
            type="button"
            onClick={() => props.setNfts([{ name: "Gradient", tokens: [] }])}
          >
            set-collections-editor
          </button>
        </div>
      );
    }
);
jest.mock(
  "@/components/waves/create-wave/groups/CreateWaveInlineGroupXtdhGrant",
  () =>
    function MockXtdhGrant(props: {
      readonly beneficiaryGrantId: string | null | undefined;
      readonly beneficiaryGrantMatchMode:
        | ApiGroupBeneficiaryGrantMatchMode
        | null
        | undefined;
      readonly setBeneficiaryGrantId: (id: string | null) => void;
      readonly setBeneficiaryGrantMatchMode: (
        mode: ApiGroupBeneficiaryGrantMatchMode | null
      ) => void;
    }) {
      return (
        <div
          data-testid="xtdh-grant-editor"
          data-grant-id={props.beneficiaryGrantId ?? ""}
          data-match-mode={props.beneficiaryGrantMatchMode ?? ""}
        >
          <button
            type="button"
            onClick={() => props.setBeneficiaryGrantId("grant-1")}
          >
            set-grant
          </button>
          <button
            type="button"
            onClick={() => props.setBeneficiaryGrantId(null)}
          >
            clear-grant
          </button>
          <button
            type="button"
            onClick={() =>
              props.setBeneficiaryGrantMatchMode(
                ApiGroupBeneficiaryGrantMatchMode.AllTokens
              )
            }
          >
            set-match-mode
          </button>
          <button
            type="button"
            onClick={() => props.setBeneficiaryGrantMatchMode(null)}
          >
            clear-match-mode
          </button>
        </div>
      );
    }
);

const renderEditor = (
  activeRule: CreateWaveInlineGroupRuleType | null,
  draft: ApiCreateGroup = createEmptyInlineGroupPayload()
) => {
  const onDraftChange = jest.fn();
  const view = render(
    <CreateWaveInlineGroupRuleEditor
      draft={draft}
      activeRule={activeRule}
      onDraftChange={onDraftChange}
    />
  );
  return { onDraftChange, draft, ...view };
};

describe("CreateWaveInlineGroupRuleEditor", () => {
  it("renders nothing when no rule is active", () => {
    const { container } = renderEditor(null);

    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    [CreateWaveInlineGroupRuleType.LEVEL, "level-editor"],
    [CreateWaveInlineGroupRuleType.TDH, "tdh-editor"],
    [CreateWaveInlineGroupRuleType.CIC, "cic-editor"],
    [CreateWaveInlineGroupRuleType.REP, "rep-editor"],
    [CreateWaveInlineGroupRuleType.NFTS, "nfts-editor"],
    [CreateWaveInlineGroupRuleType.COLLECTIONS, "collections-editor"],
    [CreateWaveInlineGroupRuleType.XTDH_GRANT, "xtdh-grant-editor"],
  ])("renders the %s editor and nothing else", (activeRule, testId) => {
    renderEditor(activeRule);

    expect(screen.getByTestId(testId)).toBeInTheDocument();
    expect(screen.getAllByTestId(/-editor$/)).toHaveLength(1);
  });

  it.each([
    [CreateWaveInlineGroupRuleType.LEVEL, "level-editor", "level"],
    [CreateWaveInlineGroupRuleType.TDH, "tdh-editor", "tdh"],
    [CreateWaveInlineGroupRuleType.CIC, "cic-editor", "cic"],
    [CreateWaveInlineGroupRuleType.REP, "rep-editor", "rep"],
  ])(
    "folds the %s editor value back into the draft",
    async (activeRule, testId, groupKey) => {
      const { onDraftChange, draft } = renderEditor(activeRule);

      await userEvent.click(
        screen.getByRole("button", { name: `set-${testId}` })
      );

      expect(onDraftChange).toHaveBeenCalledTimes(1);
      const next = onDraftChange.mock.calls[0]?.[0] as ApiCreateGroup;
      expect(next.group[groupKey as "level"]).not.toEqual(
        draft.group[groupKey as "level"]
      );
      expect(next.name).toBe(draft.name);
    }
  );

  it.each([
    [CreateWaveInlineGroupRuleType.NFTS, "nfts-editor", "Memes"],
    [CreateWaveInlineGroupRuleType.COLLECTIONS, "collections-editor", "Gradient"],
  ])(
    "writes %s selections onto owns_nfts",
    async (activeRule, testId, expectedName) => {
      const { onDraftChange } = renderEditor(activeRule);

      await userEvent.click(
        screen.getByRole("button", { name: `set-${testId}` })
      );

      const next = onDraftChange.mock.calls[0]?.[0] as ApiCreateGroup;
      expect(next.group.owns_nfts).toEqual([
        expect.objectContaining({ name: expectedName }),
      ]);
    }
  );

  it("passes the current grant slice into the xTDH grant editor", () => {
    const base = createEmptyInlineGroupPayload();
    renderEditor(CreateWaveInlineGroupRuleType.XTDH_GRANT, {
      ...base,
      group: {
        ...base.group,
        is_beneficiary_of_grant_id: "grant-9",
        is_beneficiary_of_grant_match_mode:
          ApiGroupBeneficiaryGrantMatchMode.AllTokens,
      },
    });

    const editor = screen.getByTestId("xtdh-grant-editor");
    expect(editor).toHaveAttribute("data-grant-id", "grant-9");
    expect(editor).toHaveAttribute(
      "data-match-mode",
      ApiGroupBeneficiaryGrantMatchMode.AllTokens
    );
  });

  it("keeps the existing match mode when a grant id is selected", async () => {
    const base = createEmptyInlineGroupPayload();
    const { onDraftChange } = renderEditor(
      CreateWaveInlineGroupRuleType.XTDH_GRANT,
      {
        ...base,
        group: {
          ...base.group,
          is_beneficiary_of_grant_match_mode:
            ApiGroupBeneficiaryGrantMatchMode.AllTokens,
        },
      }
    );

    await userEvent.click(screen.getByRole("button", { name: "set-grant" }));

    const next = onDraftChange.mock.calls[0]?.[0] as ApiCreateGroup;
    expect(next.group.is_beneficiary_of_grant_id).toBe("grant-1");
    expect(next.group.is_beneficiary_of_grant_match_mode).toBe(
      ApiGroupBeneficiaryGrantMatchMode.AllTokens
    );
  });

  it("resets the match mode when the grant id is cleared", async () => {
    const base = createEmptyInlineGroupPayload();
    const { onDraftChange } = renderEditor(
      CreateWaveInlineGroupRuleType.XTDH_GRANT,
      {
        ...base,
        group: {
          ...base.group,
          is_beneficiary_of_grant_id: "grant-9",
          is_beneficiary_of_grant_match_mode:
            ApiGroupBeneficiaryGrantMatchMode.AllTokens,
        },
      }
    );

    await userEvent.click(screen.getByRole("button", { name: "clear-grant" }));

    const next = onDraftChange.mock.calls[0]?.[0] as ApiCreateGroup;
    expect(next.group.is_beneficiary_of_grant_id).toBeNull();
    expect(next.group.is_beneficiary_of_grant_match_mode).toBe(
      ApiGroupBeneficiaryGrantMatchMode.AnyToken
    );
  });

  it("writes an explicit match mode selection through", async () => {
    const { onDraftChange } = renderEditor(
      CreateWaveInlineGroupRuleType.XTDH_GRANT
    );

    await userEvent.click(
      screen.getByRole("button", { name: "set-match-mode" })
    );

    const next = onDraftChange.mock.calls[0]?.[0] as ApiCreateGroup;
    expect(next.group.is_beneficiary_of_grant_match_mode).toBe(
      ApiGroupBeneficiaryGrantMatchMode.AllTokens
    );
  });

  it("falls back to any-token when the match mode is cleared", async () => {
    const base = createEmptyInlineGroupPayload();
    const { onDraftChange } = renderEditor(
      CreateWaveInlineGroupRuleType.XTDH_GRANT,
      {
        ...base,
        group: {
          ...base.group,
          is_beneficiary_of_grant_match_mode:
            ApiGroupBeneficiaryGrantMatchMode.AllTokens,
        },
      }
    );

    await userEvent.click(
      screen.getByRole("button", { name: "clear-match-mode" })
    );

    const next = onDraftChange.mock.calls[0]?.[0] as ApiCreateGroup;
    expect(next.group.is_beneficiary_of_grant_match_mode).toBe(
      ApiGroupBeneficiaryGrantMatchMode.AnyToken
    );
  });
});
