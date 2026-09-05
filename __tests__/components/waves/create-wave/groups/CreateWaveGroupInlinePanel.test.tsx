import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
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
        defaultLabel="Everyone"
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
          defaultLabel="Everyone"
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

  it("shows only the compact wave access actions before editing", () => {
    renderInlinePanel();

    expect(screen.getByText("Everyone")).toBeInTheDocument();
    expect(screen.queryByText("Before editing")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Choose group" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Identities" })
    ).not.toBeInTheDocument();
  });

  it("uses matching before and after summaries while editing", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(screen.getByText("Before editing")).toBeInTheDocument();
    expect(screen.getByText("Everyone")).toBeInTheDocument();
    expect(screen.getByText("After editing")).toBeInTheDocument();
    expect(screen.getByText("No criteria selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(
      screen.queryByRole("button", { name: "Choose group" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Preview matches" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Discard draft" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Close" })
    ).not.toBeInTheDocument();
  });

  it("cancels the criteria replacement from the header action", async () => {
    const user = userEvent.setup();
    const onCriteriaReplacementChange = jest.fn();
    renderInlinePanel({ onCriteriaReplacementChange });

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCriteriaReplacementChange.mock.calls).toEqual([[true], [false]]);
    expect(screen.queryByText("After editing")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("creates a private inline group with Save changes", async () => {
    const user = userEvent.setup();
    const onCreateGroup = jest.fn().mockResolvedValue(createdGroup);
    renderInlinePanel({
      includedIdentity: defaultIncludedIdentity,
      onCreateGroup,
    });

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const privacyToggle = screen.getByRole("switch", {
      name: "Hide criteria and members",
    });
    expect(privacyToggle).not.toBeChecked();
    expect(privacyToggle.nextElementSibling).toHaveClass(
      "peer-focus-visible:tw-ring-2"
    );

    await user.click(privacyToggle);
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(onCreateGroup).toHaveBeenCalledWith(
        expect.objectContaining({ is_private: true })
      );
    });
  });

  it("opens editors without a separate close button", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Identities" }));

    expect(screen.getByTestId("identities-panel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Close" })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Rep" }));
    expect(screen.queryByTestId("identities-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("rule-rep")).toBeInTheDocument();
  });

  it("marks configured criteria buttons", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));

    const configuredRep = screen.getByRole("button", {
      name: "Rep, Configured",
    });
    expect(configuredRep).toHaveAttribute("data-configured", "true");
    expect(configuredRep).toHaveClass("tw-bg-primary-500/15");
  });

  it("shows all criteria buttons without a more-rules step", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit" }));

    for (const name of [
      "Identities",
      "Level",
      "TDH",
      "NIC",
      "Rep",
      "Required NFTs",
      "Collection Access",
      "xTDH Grant",
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(
      screen.queryByRole("button", { name: "More rules" })
    ).not.toBeInTheDocument();
  });

  it("shows the selected grant collection in the after-editing summary", async () => {
    useXtdhGrantQueryMock.mockReturnValue({
      grant: { target_collection_name: "Argonauts" },
    } as ReturnType<typeof useXtdhGrantQuery>);
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "xTDH Grant" }));
    await user.click(screen.getByRole("button", { name: "select xTDH grant" }));

    expect(
      screen.getAllByText("xTDH grant for Argonauts").length
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText("1884c41e-d366-432f-a473-5f8e99dc61ab")
    ).not.toBeInTheDocument();
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

    await user.click(screen.getByRole("button", { name: "Edit" }));

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

    await user.click(
      screen.getByRole("button", { name: "Identities, Configured" })
    );

    expect(
      screen.getByTestId("restored-included-identities")
    ).toHaveTextContent("0xaaa");
    expect(
      screen.getByTestId("restored-excluded-identities")
    ).toHaveTextContent("0xbbb");

    await user.click(screen.getByRole("button", { name: "Save changes" }));

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

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

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

  it("includes the creator when saving a rule-only group", async () => {
    const user = userEvent.setup();
    const onCreateGroup = jest.fn().mockResolvedValue(createdGroup);
    renderInlinePanel({
      onCreateGroup,
      includedIdentity: defaultIncludedIdentity,
    });

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

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

  it("keeps identity changes when moving to a rule", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Identities" }));
    await user.click(screen.getByRole("button", { name: "include identity" }));

    await user.click(screen.getByRole("button", { name: "Rep" }));
    expect(screen.queryByTestId("identities-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("rule-rep")).toBeInTheDocument();
    expect(
      screen.getAllByText("1 explicitly included user").length
    ).toBeGreaterThan(0);
  });

  it("keeps Cancel available when the draft is invalid", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "TDH" }));
    await user.click(screen.getByRole("button", { name: "set invalid tdh" }));
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    expect(cancelButton).toBeEnabled();

    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText("After editing")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("returns a selected group to its primary state after cancelling", async () => {
    const user = userEvent.setup();
    renderInlinePanel({
      selectedGroup: {
        id: "group-1",
        name: "Existing Group",
      } as ApiGroupFull,
    });

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByText("After editing")).not.toBeInTheDocument();
    });

    expect(screen.queryByText("Before editing")).not.toBeInTheDocument();
    expect(screen.getByText("Existing Group")).toBeInTheDocument();
  });

  it("hides save controls when the panel becomes disabled", async () => {
    const user = userEvent.setup();
    renderInlinePanelWithDisabledControls();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));

    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "disable panel" }));

    expect(
      screen.queryByRole("button", { name: "Save changes" })
    ).not.toBeInTheDocument();
  });

  it("shows the same draft when the panel is re-enabled", async () => {
    const user = userEvent.setup();
    renderInlinePanelWithDisabledControls();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));
    await user.click(screen.getByRole("button", { name: "disable panel" }));
    await user.click(screen.getByRole("button", { name: "enable panel" }));

    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
    expect(screen.getAllByText("REP at least 5").length).toBeGreaterThan(0);
  });

  it("updates the draft summary after adding an identity", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Identities" }));
    await user.click(screen.getByRole("button", { name: "include identity" }));

    expect(
      screen.getAllByText("1 explicitly included user").length
    ).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("shows a resolved handle in the draft criteria summary", async () => {
    useGroupCriteriaIdentityLabelsMock.mockReturnValue({
      "0xfd22004806a6846ea67ad883356be810f0428793": "pinkapewife",
    });
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Edit" }));
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

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Identities" }));
    await user.click(screen.getByRole("button", { name: "include identity" }));
    await user.click(screen.getByRole("button", { name: "exclude identity" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

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

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Identities" }));
    await user.click(
      screen.getByRole("button", { name: "include EMMA wallets" })
    );
    await user.click(
      screen.getByRole("button", { name: "exclude CSV wallets" })
    );
    await user.click(
      screen.getByRole("button", { name: "Identities, Configured" })
    );

    expect(
      screen.getAllByText(
        "1 explicitly included user and 2 explicitly excluded users"
      ).length
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Save changes" }));

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
