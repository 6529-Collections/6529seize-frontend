import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiGroupBeneficiaryGrantMatchMode } from "@/generated/models/ApiGroupBeneficiaryGrantMatchMode";
import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiGroupTdhInclusionStrategy } from "@/generated/models/ApiGroupTdhInclusionStrategy";
import { useXtdhGrantQuery } from "@/hooks/useXtdhGrantQuery";
import { useGroupCriteriaIdentityLabels } from "@/hooks/useGroupCriteriaIdentityLabels";
import CreateWaveGroupInlinePanel from "@/components/waves/create-wave/groups/CreateWaveGroupInlinePanel";

jest.mock("@/hooks/useXtdhGrantQuery", () => ({
  useXtdhGrantQuery: jest.fn(),
}));

jest.mock("@/hooks/useGroupCriteriaIdentityLabels", () => ({
  useGroupCriteriaIdentityLabels: jest.fn(),
}));

const useXtdhGrantQueryMock = jest.mocked(useXtdhGrantQuery);
const useGroupCriteriaIdentityLabelsMock = jest.mocked(
  useGroupCriteriaIdentityLabels
);

jest.mock(
  "@/components/waves/create-wave/groups/CreateWaveInlineGroupIdentities",
  () =>
    function MockCreateWaveInlineGroupIdentities(props: any) {
      return (
        <div data-testid="identities-panel">
          <span data-testid="restored-included-identities">
            {props.includedIdentities
              .map((identity: { wallet: string }) => identity.wallet)
              .join(",")}
          </span>
          <span data-testid="restored-excluded-identities">
            {props.excludedIdentities
              .map((identity: { wallet: string }) => identity.wallet)
              .join(",")}
          </span>
          <button
            type="button"
            onClick={() =>
              props.onIncludedIdentitySelect({
                profile_id: "profile-1",
                handle: "alpha",
                normalised_handle: "alpha",
                primary_wallet: "0xABC",
                display: "Alpha",
                tdh: 0,
                level: 0,
                cic_rating: 0,
                wallet: "0xABC",
                pfp: null,
              })
            }
          >
            include identity
          </button>
          <button
            type="button"
            onClick={() =>
              props.onExcludedIdentitySelect({
                profile_id: "profile-2",
                handle: "beta",
                normalised_handle: "beta",
                primary_wallet: "0xDEF",
                display: "Beta",
                tdh: 0,
                level: 0,
                cic_rating: 0,
                wallet: "0xDEF",
                pfp: null,
              })
            }
          >
            exclude identity
          </button>
          <button
            type="button"
            onClick={() =>
              props.onIncludedWalletSourcesChange({
                emmaWallets: [
                  "0x1111111111111111111111111111111111111111",
                  "0x2222222222222222222222222222222222222222",
                ],
              })
            }
          >
            include EMMA wallets
          </button>
          <button
            type="button"
            onClick={() =>
              props.onExcludedWalletSourcesChange({
                uploadedWallets: [
                  "0x2222222222222222222222222222222222222222",
                  "0x3333333333333333333333333333333333333333",
                ],
                uploadedFileName: "excluded.csv",
              })
            }
          >
            exclude CSV wallets
          </button>
        </div>
      );
    }
);

jest.mock(
  "@/components/waves/create-wave/groups/CreateWaveInlineGroupXtdhGrant",
  () =>
    function MockCreateWaveInlineGroupXtdhGrant(props: any) {
      return (
        <div data-testid="rule-xtdh-grant">
          xTDH Grant
          <button
            type="button"
            onClick={() =>
              props.setBeneficiaryGrant(
                "1884c41e-d366-432f-a473-5f8e99dc61ab",
                "ANY_TOKEN"
              )
            }
          >
            select xTDH grant
          </button>
        </div>
      );
    }
);

jest.mock(
  "@/components/waves/create-wave/groups/CreateWaveGroupSearchField",
  () =>
    function MockCreateWaveGroupSearchField(props: any) {
      return (
        <div data-testid="group-search">
          <div>{props.selectedGroup?.name ?? "No group selected"}</div>
          <button
            type="button"
            onClick={() =>
              props.onSelect({
                id: "group-2",
                name: "Selected Group",
                created_by: { handle: "builder" },
              })
            }
          >
            select group
          </button>
          <button type="button" onClick={() => props.onSelect(null)}>
            clear group
          </button>
        </div>
      );
    }
);

jest.mock("@/components/groups/page/create/config/GroupCreateLevel", () => {
  return function MockGroupCreateLevel() {
    return <div data-testid="rule-level">Level</div>;
  };
});

jest.mock("@/components/groups/page/create/config/GroupCreateTDH", () => {
  return function MockGroupCreateTDH(props: any) {
    return (
      <div data-testid="rule-tdh">
        TDH
        <button
          type="button"
          onClick={() => props.setTDH({ ...props.tdh, min: 10, max: 5 })}
        >
          set invalid tdh
        </button>
      </div>
    );
  };
});

jest.mock("@/components/groups/page/create/config/GroupCreateCIC", () => {
  return function MockGroupCreateCIC() {
    return <div data-testid="rule-cic">NIC</div>;
  };
});

jest.mock("@/components/groups/page/create/config/GroupCreateRep", () => {
  return function MockGroupCreateRep(props: any) {
    return (
      <div data-testid="rule-rep">
        Rep
        <button
          type="button"
          onClick={() => props.setRep({ ...props.rep, min: 5 })}
        >
          set rep min
        </button>
        <button
          type="button"
          onClick={() =>
            props.setRep({
              ...props.rep,
              min: 5,
              direction: "RECEIVED",
              user_identity: "0xfd22004806a6846ea67ad883356be810f0428793",
            })
          }
        >
          set rep wallet
        </button>
      </div>
    );
  };
});

jest.mock(
  "@/components/groups/page/create/config/nfts/GroupCreateCollections",
  () => {
    return function MockGroupCreateCollections() {
      return <div data-testid="rule-collections">Collections</div>;
    };
  }
);

jest.mock("@/components/groups/page/create/config/nfts/GroupCreateNfts", () => {
  return function MockGroupCreateNfts() {
    return <div data-testid="rule-nfts">NFTs</div>;
  };
});

const createdGroup: ApiGroupFull = {
  id: "group-created",
  name: "Created Group",
  created_by: { handle: "builder" },
} as ApiGroupFull;

const defaultIncludedIdentity = {
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

const savedGroupCriteria: ApiGroupFull["group"] = {
  cic: {
    min: null,
    max: null,
    user_identity: null,
    direction: ApiGroupFilterDirection.Received,
  },
  rep: {
    min: null,
    max: null,
    user_identity: null,
    direction: ApiGroupFilterDirection.Received,
    category: null,
  },
  level: { min: null, max: null },
  tdh: {
    min: null,
    max: null,
    inclusion_strategy: ApiGroupTdhInclusionStrategy.Both,
  },
  owns_nfts: [],
  identity_group_id: null,
  identity_group_identities_count: 0,
  excluded_identity_group_id: null,
  excluded_identity_group_identities_count: 0,
  is_beneficiary_of_grant_id: null,
  is_beneficiary_of_grant_match_mode:
    ApiGroupBeneficiaryGrantMatchMode.AnyToken,
  is_beneficiary_of_grant: null,
};

function renderInlinePanel({
  suggestedName = "My Wave Visibility",
  onChange = jest.fn(),
  onCreateGroup = jest.fn().mockResolvedValue(createdGroup),
  selectedGroup = null,
  disabled = false,
  allowGroupClear = true,
  includedIdentity = null,
  selectedGroupIncludedWallets,
  selectedGroupExcludedWallets,
  onCriteriaReplacementChange = jest.fn(),
}: {
  readonly suggestedName?: string;
  readonly onChange?: jest.Mock;
  readonly onCreateGroup?: jest.Mock;
  readonly selectedGroup?: ApiGroupFull | null;
  readonly disabled?: boolean;
  readonly allowGroupClear?: boolean;
  readonly includedIdentity?: typeof defaultIncludedIdentity | null;
  readonly selectedGroupIncludedWallets?: readonly string[] | undefined;
  readonly selectedGroupExcludedWallets?: readonly string[] | undefined;
  readonly onCriteriaReplacementChange?: jest.Mock;
} = {}) {
  const initialSelectedGroup = selectedGroup
    ? ({
        ...selectedGroup,
        group: selectedGroup.group ?? savedGroupCriteria,
        is_private: selectedGroup.is_private ?? false,
      } as ApiGroupFull)
    : null;

  function ControlledPanel() {
    const [currentGroup, setCurrentGroup] = React.useState<ApiGroupFull | null>(
      () => initialSelectedGroup
    );

    return (
      <CreateWaveGroupInlinePanel
        suggestedName={suggestedName}
        defaultLabel="Public"
        disabled={disabled}
        selectedGroup={currentGroup}
        selectedGroupIncludedWallets={
          selectedGroupIncludedWallets ??
          (currentGroup === null ? undefined : [])
        }
        selectedGroupExcludedWallets={
          selectedGroupExcludedWallets ??
          (currentGroup === null ? undefined : [])
        }
        allowGroupClear={allowGroupClear}
        defaultIncludedIdentity={includedIdentity}
        onCriteriaReplacementChange={onCriteriaReplacementChange}
        onChange={(group) => {
          setCurrentGroup(group);
          onChange(group);
        }}
        onCreateGroup={onCreateGroup}
      />
    );
  }

  return render(<ControlledPanel />);
}

function renderInlinePanelWithDisabledControls({
  suggestedName = "My Wave Visibility",
  onChange = jest.fn(),
  onCreateGroup = jest.fn().mockResolvedValue(createdGroup),
  selectedGroup = null,
  initialDisabled = false,
  allowGroupClear = true,
  onCriteriaReplacementChange = jest.fn(),
}: {
  readonly suggestedName?: string;
  readonly onChange?: jest.Mock;
  readonly onCreateGroup?: jest.Mock;
  readonly selectedGroup?: ApiGroupFull | null;
  readonly initialDisabled?: boolean;
  readonly allowGroupClear?: boolean;
  readonly onCriteriaReplacementChange?: jest.Mock;
} = {}) {
  const initialSelectedGroup = selectedGroup
    ? ({
        ...selectedGroup,
        group: selectedGroup.group ?? savedGroupCriteria,
        is_private: selectedGroup.is_private ?? false,
      } as ApiGroupFull)
    : null;

  function ControlledPanel() {
    const [currentGroup, setCurrentGroup] = React.useState<ApiGroupFull | null>(
      () => initialSelectedGroup
    );
    const [disabled, setDisabled] = React.useState(initialDisabled);

    return (
      <>
        <button type="button" onClick={() => setDisabled(true)}>
          disable panel
        </button>
        <button type="button" onClick={() => setDisabled(false)}>
          enable panel
        </button>
        <CreateWaveGroupInlinePanel
          suggestedName={suggestedName}
          defaultLabel="Public"
          disabled={disabled}
          selectedGroup={currentGroup}
          selectedGroupIncludedWallets={currentGroup === null ? undefined : []}
          selectedGroupExcludedWallets={currentGroup === null ? undefined : []}
          allowGroupClear={allowGroupClear}
          onCriteriaReplacementChange={onCriteriaReplacementChange}
          onChange={(group) => {
            setCurrentGroup(group);
            onChange(group);
          }}
          onCreateGroup={onCreateGroup}
        />
      </>
    );
  }

  return render(<ControlledPanel />);
}

describe("CreateWaveGroupInlinePanel", () => {
  beforeEach(() => {
    useXtdhGrantQueryMock.mockReturnValue({
      grant: undefined,
    } as ReturnType<typeof useXtdhGrantQuery>);
    useGroupCriteriaIdentityLabelsMock.mockReturnValue({});
  });

  it("renders the public state without a current group title", () => {
    renderInlinePanel();

    expect(screen.queryByText("Current group")).not.toBeInTheDocument();
    expect(screen.getByText("Public")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Identities" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit criteria" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose group" })
    ).toBeInTheDocument();
  });

  it("reports a pending replacement until the draft is discarded", async () => {
    const user = userEvent.setup();
    const onCriteriaReplacementChange = jest.fn();
    renderInlinePanel({ onCriteriaReplacementChange });

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));

    expect(onCriteriaReplacementChange).toHaveBeenLastCalledWith(true);

    await user.click(screen.getByRole("button", { name: "Discard draft" }));

    expect(onCriteriaReplacementChange.mock.calls).toEqual([[true], [false]]);
  });

  it("creates a private inline group when privacy is enabled", async () => {
    const user = userEvent.setup();
    const onCreateGroup = jest.fn().mockResolvedValue(createdGroup);
    renderInlinePanel({
      includedIdentity: defaultIncludedIdentity,
      onCreateGroup,
    });

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));

    const privacyToggle = screen.getByRole("switch", {
      name: "Hide criteria and members",
    });
    expect(privacyToggle).not.toBeChecked();
    expect(privacyToggle.nextElementSibling).toHaveClass(
      "peer-focus-visible:tw-ring-2"
    );

    await user.click(privacyToggle);
    expect(privacyToggle).toBeChecked();

    await user.click(
      screen.getByRole("button", { name: "Create and use new group" })
    );

    await waitFor(() => {
      expect(onCreateGroup).toHaveBeenCalledWith(
        expect.objectContaining({ is_private: true })
      );
    });
  });

  it("opens the identity panel", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Identities" }));

    expect(screen.getByTestId("identities-panel")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit criteria" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.queryByRole("button", { name: "Back to options" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Identities" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "TDH" })).toBeInTheDocument();
  });

  it("returns from identity search to the criteria choices", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Identities" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByTestId("identities-panel")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Identities" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "TDH" })).toBeInTheDocument();
  });

  it("opens a quick rule editor", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "TDH" }));

    expect(screen.getByTestId("rule-tdh")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit criteria" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "TDH" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(
      screen.getByRole("button", { name: "Identities" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Back to rules" })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Identities" }));

    expect(screen.getByTestId("identities-panel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rep" })).toBeInTheDocument();
  });

  it("returns to rule options when the active rule pill is clicked", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "TDH" }));
    await user.click(screen.getByRole("button", { name: "TDH" }));

    expect(screen.queryByTestId("rule-tdh")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "TDH" })).not.toHaveAttribute(
      "aria-pressed"
    );
  });

  it("shows all rule options without an extra more-rules step", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));

    expect(
      screen.getByRole("button", { name: "Required NFTs" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Collection Access" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "xTDH Grant" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "More rules" })
    ).not.toBeInTheDocument();
  });

  it("shows the selected grant collection in the unsaved group summary", async () => {
    useXtdhGrantQueryMock.mockReturnValue({
      grant: {
        target_collection_name: "Argonauts",
      },
    } as ReturnType<typeof useXtdhGrantQuery>);
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "xTDH Grant" }));
    await user.click(screen.getByRole("button", { name: "select xTDH grant" }));

    expect(
      screen.getAllByText("xTDH grant for Argonauts").length
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText("1884c41e-d366-432f-a473-5f8e99dc61ab")
    ).not.toBeInTheDocument();
    expect(useXtdhGrantQueryMock).toHaveBeenLastCalledWith({
      grantId: "1884c41e-d366-432f-a473-5f8e99dc61ab",
      enabled: true,
    });
  });

  it("returns to options when the active existing group pill is clicked", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Choose group" }));
    expect(screen.getByTestId("group-search")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose group" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Close" })).toHaveClass(
      "tw-h-10",
      "tw-text-sm"
    );

    await user.click(screen.getByRole("button", { name: "Choose group" }));

    expect(screen.queryByTestId("group-search")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit criteria" })
    ).toBeInTheDocument();
  });

  it("returns to the actions view after selecting an existing group", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const onCreateGroup = jest.fn().mockResolvedValue(createdGroup);
    renderInlinePanel({
      onChange,
      onCreateGroup,
      includedIdentity: defaultIncludedIdentity,
    });

    await user.click(screen.getByRole("button", { name: "Choose group" }));
    await user.click(screen.getByRole("button", { name: "select group" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Selected Group" })
    );
    expect(onCreateGroup).not.toHaveBeenCalled();
    expect(screen.queryByText("Unsaved group")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit criteria" })
    ).toBeInTheDocument();
  });

  it("returns null when clearing an existing group", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderInlinePanel({
      onChange,
      selectedGroup: { id: "group-1", name: "Existing Group" } as ApiGroupFull,
    });

    await user.click(screen.getByRole("button", { name: "Choose group" }));
    await user.click(screen.getByRole("button", { name: "clear group" }));

    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.queryByText("Current group")).not.toBeInTheDocument();
    expect(screen.getByText("Public")).toBeInTheDocument();
  });

  it("restores every saved criterion and both identity lists before editing", async () => {
    useXtdhGrantQueryMock.mockReturnValue({
      grant: {
        target_collection_name: "NextGen 6529",
      },
    } as ReturnType<typeof useXtdhGrantQuery>);
    const user = userEvent.setup();
    const onCreateGroup = jest.fn().mockResolvedValue(createdGroup);
    const savedGroup = {
      id: "group-saved",
      name: "Saved visibility",
      created_by: { handle: "builder" },
      is_private: true,
      group: {
        tdh: { min: 1, max: null, inclusion_strategy: "BOTH" },
        rep: {
          min: 4,
          max: null,
          user_identity: "prxt0",
          direction: "RECEIVED",
          category: "dev",
        },
        cic: {
          min: 5,
          max: null,
          user_identity: "punk6529",
          direction: "RECEIVED",
        },
        level: { min: 10, max: null },
        owns_nfts: [
          { name: "MEMES", tokens: ["52"] },
          { name: "GRADIENTS", tokens: [] },
        ],
        identity_group_id: "included-group",
        identity_group_identities_count: 1,
        excluded_identity_group_id: "excluded-group",
        excluded_identity_group_identities_count: 1,
        is_beneficiary_of_grant_id: "f03ed989-0fe2-46db-89c1-8ab8b89efb01",
        is_beneficiary_of_grant_match_mode: "ANY_TOKEN",
        is_beneficiary_of_grant: null,
      },
    } as ApiGroupFull;

    renderInlinePanel({
      selectedGroup: savedGroup,
      selectedGroupIncludedWallets: ["0xAAA"],
      selectedGroupExcludedWallets: ["0xBBB"],
      onCreateGroup,
    });

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));

    expect(
      screen.getByRole("switch", { name: "Hide criteria and members" })
    ).toBeChecked();

    expect(
      screen.getAllByText(/TDH \+ xTDH at least 1/).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/REP in dev from prxt0 at least 4/).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/NIC from punk6529 at least 5/).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/Level at least 10/).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/xTDH grant for NextGen 6529/).length
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Identities" }));

    expect(
      screen.getByTestId("restored-included-identities")
    ).toHaveTextContent("0xaaa");
    expect(
      screen.getByTestId("restored-excluded-identities")
    ).toHaveTextContent("0xbbb");

    await user.click(
      screen.getByRole("button", { name: "Create and use new group" })
    );

    await waitFor(() => {
      expect(onCreateGroup).toHaveBeenCalledWith({
        name: "My Wave Visibility",
        is_private: true,
        group: {
          tdh: { min: 1, max: null, inclusion_strategy: "BOTH" },
          rep: {
            min: 4,
            max: null,
            user_identity: "prxt0",
            direction: "RECEIVED",
            category: "dev",
          },
          cic: {
            min: 5,
            max: null,
            user_identity: "punk6529",
            direction: "RECEIVED",
          },
          level: { min: 10, max: null },
          owns_nfts: [
            { name: "MEMES", tokens: ["52"] },
            { name: "GRADIENTS", tokens: [] },
          ],
          identity_addresses: ["0xaaa"],
          excluded_identity_addresses: ["0xbbb"],
          is_beneficiary_of_grant_id: "f03ed989-0fe2-46db-89c1-8ab8b89efb01",
          is_beneficiary_of_grant_match_mode: "ANY_TOKEN",
        },
      });
    });
  });

  it("preserves unsaved edits when toggling criteria for a saved group", async () => {
    const user = userEvent.setup();
    renderInlinePanel({
      selectedGroup: {
        id: "group-saved",
        name: "Saved visibility",
        created_by: { handle: "builder" },
        is_private: false,
        group: savedGroupCriteria,
      } as ApiGroupFull,
    });

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));

    expect(screen.getByTestId("rule-rep")).toBeInTheDocument();
    expect(screen.getAllByText("REP at least 5").length).toBeGreaterThan(0);
  });

  it("keeps the selected group when clearing is disabled", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderInlinePanel({
      onChange,
      allowGroupClear: false,
      selectedGroup: { id: "group-1", name: "Existing Group" } as ApiGroupFull,
    });

    await user.click(screen.getByRole("button", { name: "Choose group" }));
    await user.click(screen.getByRole("button", { name: "clear group" }));

    expect(onChange).not.toHaveBeenCalledWith(null);
    expect(screen.getAllByText("Existing Group").length).toBeGreaterThan(0);
  });

  it("creates and attaches a valid inline group draft", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const onCreateGroup = jest.fn().mockResolvedValue(createdGroup);
    const onCriteriaReplacementChange = jest.fn();
    renderInlinePanel({
      onChange,
      onCreateGroup,
      onCriteriaReplacementChange,
    });

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));
    await user.click(
      screen.getByRole("button", { name: "Create and use new group" })
    );

    await waitFor(() => {
      expect(onCreateGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "My Wave Visibility",
        })
      );
    });
    expect(onChange).toHaveBeenCalledWith(createdGroup);
    expect(onCriteriaReplacementChange).toHaveBeenNthCalledWith(1, true);
    expect(onCriteriaReplacementChange).toHaveBeenLastCalledWith(false);
  });

  it("includes the creator when creating a rule-only group", async () => {
    const user = userEvent.setup();
    const onCreateGroup = jest.fn().mockResolvedValue(createdGroup);
    renderInlinePanel({
      onCreateGroup,
      includedIdentity: defaultIncludedIdentity,
    });

    expect(screen.queryByText("Unsaved group")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));
    await user.click(
      screen.getByRole("button", { name: "Create and use new group" })
    );

    await waitFor(() => {
      expect(onCreateGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          group: expect.objectContaining({
            identity_addresses: ["0xme"],
          }),
        })
      );
    });
  });

  it("keeps the draft when clicking outside an open editor", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));

    expect(screen.getByTestId("rule-rep")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.getByTestId("rule-rep")).toBeInTheDocument();

    expect(screen.queryByText("Current group")).not.toBeInTheDocument();
    expect(screen.getByText("Public")).toBeInTheDocument();
    expect(screen.getByText("Unsaved group")).toBeInTheDocument();
    expect(screen.getAllByText("REP at least 5").length).toBeGreaterThan(0);
    expect(screen.getByText("Not applied yet.")).toBeInTheDocument();
    expect(screen.getByText("Create this new group")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard draft" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Create and use new group" })
    ).toBeEnabled();
  });

  it("keeps the rule draft when closing an open editor", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));

    expect(screen.getByTestId("rule-rep")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByTestId("rule-rep")).not.toBeInTheDocument();
    expect(screen.getByText("Unsaved group")).toBeInTheDocument();
    expect(screen.getAllByText("REP at least 5").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Create and use new group" })
    ).toBeEnabled();
  });

  it("keeps the identity draft when closing the identity panel", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Identities" }));
    await user.click(screen.getByRole("button", { name: "include identity" }));

    expect(screen.getByTestId("identities-panel")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByTestId("identities-panel")).not.toBeInTheDocument();
    expect(screen.getByText("Unsaved group")).toBeInTheDocument();
    expect(
      screen.getAllByText("1 explicitly included user").length
    ).toBeGreaterThan(0);
    expect(screen.getByText("Create this new group")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard draft" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Create and use new group" })
    ).toBeEnabled();
  });

  it("keeps draft actions visible after collapsing an active panel", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByTestId("rule-rep")).not.toBeInTheDocument();
    expect(screen.queryByText("Current group")).not.toBeInTheDocument();
    expect(screen.getByText("Public")).toBeInTheDocument();
    expect(screen.getByText("Unsaved group")).toBeInTheDocument();
    expect(screen.getAllByText("REP at least 5").length).toBeGreaterThan(0);
    expect(screen.getByText("Not applied yet.")).toBeInTheDocument();
    expect(screen.getByText("Create this new group")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard draft" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Create and use new group" })
    ).toBeEnabled();
  });

  it("shows the collapsed draft as the active state when a selected group already exists", async () => {
    const user = userEvent.setup();
    renderInlinePanel({
      selectedGroup: {
        id: "group-1",
        name: "Existing Group",
      } as ApiGroupFull,
    });

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByTestId("rule-rep")).not.toBeInTheDocument();
    expect(screen.getByText("Current group")).toBeInTheDocument();
    expect(screen.getByText("Existing Group")).toBeInTheDocument();
    expect(screen.getByText("Unsaved group")).toBeInTheDocument();
    expect(screen.getAllByText("REP at least 5").length).toBeGreaterThan(0);
    expect(screen.getByText("Not applied yet.")).toBeInTheDocument();
    expect(
      screen.queryByText("Based on Existing Group. Not applied yet.")
    ).not.toBeInTheDocument();
    expect(screen.getByText("Create this new group")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard draft" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Create and use new group" })
    ).toBeEnabled();
  });

  it("keeps the collapsed draft label honest after clicking outside with a selected group", async () => {
    const user = userEvent.setup();
    renderInlinePanel({
      selectedGroup: {
        id: "group-1",
        name: "Existing Group",
      } as ApiGroupFull,
    });

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));

    expect(screen.getByTestId("rule-rep")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.getByTestId("rule-rep")).toBeInTheDocument();

    expect(screen.getByText("Current group")).toBeInTheDocument();
    expect(screen.getAllByText("Existing Group").length).toBeGreaterThan(0);
    expect(screen.getByText("Unsaved group")).toBeInTheDocument();
    expect(screen.getAllByText("REP at least 5").length).toBeGreaterThan(0);
    expect(screen.getByText("Not applied yet.")).toBeInTheDocument();
    expect(
      screen.queryByText("Based on Existing Group. Not applied yet.")
    ).not.toBeInTheDocument();
    expect(screen.getByText("Create this new group")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard draft" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Create and use new group" })
    ).toBeEnabled();
  });

  it("keeps the two-state summary while hiding footer actions during group search", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));
    await user.click(screen.getByRole("button", { name: "Choose group" }));

    expect(screen.getByTestId("group-search")).toBeInTheDocument();
    expect(screen.queryByText("Current group")).not.toBeInTheDocument();
    expect(screen.getByText("Public")).toBeInTheDocument();
    expect(screen.getAllByText("Unsaved group")).toHaveLength(2);
    expect(screen.getByText("REP at least 5")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Choosing another group will discard this unsaved group."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("Create this new group")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Discard draft" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create and use new group" })
    ).not.toBeInTheDocument();
  });

  it("keeps reset available when the draft is invalid", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "TDH" }));
    await user.click(screen.getByRole("button", { name: "set invalid tdh" }));
    expect(
      screen.getByRole("button", { name: "Create and use new group" })
    ).toBeDisabled();
    const discardDraftButton = screen.getByRole("button", {
      name: "Discard draft",
    });
    expect(discardDraftButton).toBeEnabled();

    await user.click(discardDraftButton);

    await waitFor(() => {
      expect(
        screen.queryByText("Create this new group")
      ).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: "Edit criteria" })
    ).toBeInTheDocument();
  });

  it("returns the selected group as the primary state after clearing a draft", async () => {
    const user = userEvent.setup();
    renderInlinePanel({
      selectedGroup: {
        id: "group-1",
        name: "Existing Group",
      } as ApiGroupFull,
    });

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.getByText("Unsaved group")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Discard draft" }));

    await waitFor(() => {
      expect(
        screen.queryByText("Create this new group")
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText("Current group")).toBeInTheDocument();
    expect(screen.getByText("Existing Group")).toBeInTheDocument();
    expect(screen.queryByText("Unsaved group")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Based on Existing Group. Not applied yet.")
    ).not.toBeInTheDocument();
  });

  it("hides the draft footer when the panel becomes disabled", async () => {
    const user = userEvent.setup();
    renderInlinePanelWithDisabledControls();

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));

    expect(screen.getByText("Create this new group")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "disable panel" }));

    expect(screen.queryByText("Create this new group")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Discard draft" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create and use new group" })
    ).not.toBeInTheDocument();
  });

  it("shows the same draft again when the panel is re-enabled", async () => {
    const user = userEvent.setup();
    renderInlinePanelWithDisabledControls();

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));
    await user.click(screen.getByRole("button", { name: "disable panel" }));
    await user.click(screen.getByRole("button", { name: "enable panel" }));

    expect(screen.getByText("Create this new group")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard draft" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Create and use new group" })
    ).toBeEnabled();
  });

  it("opens configured rules from the draft chips", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));

    expect(screen.getByTestId("rule-rep")).toBeInTheDocument();
  });

  it("updates the draft summary after adding an identity", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Identities" }));
    await user.click(screen.getByRole("button", { name: "include identity" }));

    expect(
      screen.getAllByText("1 explicitly included user").length
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Edit criteria" })
    ).toBeInTheDocument();
  });

  it("shows a resolved handle in the draft criteria summary", async () => {
    useGroupCriteriaIdentityLabelsMock.mockReturnValue({
      "0xfd22004806a6846ea67ad883356be810f0428793": "pinkapewife",
    });
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep wallet" }));

    expect(
      screen.getAllByText("REP from pinkapewife at least 5").length
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText(/0xfd22004806a6846ea67ad883356be810f0428793/i)
    ).not.toBeInTheDocument();
  });

  it("serializes explicitly included and excluded identities", async () => {
    const user = userEvent.setup();
    const onCreateGroup = jest.fn().mockResolvedValue(createdGroup);
    renderInlinePanel({ onCreateGroup });

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Identities" }));
    await user.click(screen.getByRole("button", { name: "include identity" }));
    await user.click(screen.getByRole("button", { name: "exclude identity" }));
    await user.click(
      screen.getByRole("button", { name: "Create and use new group" })
    );

    await waitFor(() => {
      expect(onCreateGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          group: expect.objectContaining({
            identity_addresses: ["0xabc"],
            excluded_identity_addresses: ["0xdef"],
          }),
        })
      );
    });
  });

  it("persists and serializes bulk identity sources with exclusion winning overlaps", async () => {
    const user = userEvent.setup();
    const onCreateGroup = jest.fn().mockResolvedValue(createdGroup);
    renderInlinePanel({ onCreateGroup });

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Identities" }));
    await user.click(
      screen.getByRole("button", { name: "include EMMA wallets" })
    );
    await user.click(
      screen.getByRole("button", { name: "exclude CSV wallets" })
    );
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(
      screen.getAllByText(
        "1 explicitly included user and 2 explicitly excluded users"
      ).length
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Identities" }));
    await user.click(
      screen.getByRole("button", { name: "Create and use new group" })
    );

    await waitFor(() => {
      expect(onCreateGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          group: expect.objectContaining({
            identity_addresses: ["0x1111111111111111111111111111111111111111"],
            excluded_identity_addresses: [
              "0x2222222222222222222222222222222222222222",
              "0x3333333333333333333333333333333333333333",
            ],
          }),
        })
      );
    });
  });
});
