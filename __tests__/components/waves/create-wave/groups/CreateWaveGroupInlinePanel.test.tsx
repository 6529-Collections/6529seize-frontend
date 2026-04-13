import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import CreateWaveGroupInlinePanel from "@/components/waves/create-wave/groups/CreateWaveGroupInlinePanel";
import {
  createEmptyInlineGroupPayload,
  createInitialInlineGroupBuilderState,
  type CreateWaveInlineGroupBuilderState,
  type CreateWaveInlineGroupPanel,
  type CreateWaveInlineGroupRuleType,
} from "@/components/waves/create-wave/groups/createWaveInlineGroupBuilder";

jest.mock(
  "@/components/waves/create-wave/groups/CreateWaveInlineGroupIdentities",
  () =>
    function MockCreateWaveInlineGroupIdentities(props: any) {
      return (
        <div data-testid="identities-panel">
          <button
            type="button"
            onClick={() =>
              props.onIdentitySelect({
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
            add identity
          </button>
        </div>
      );
    }
);

jest.mock(
  "@/components/waves/create-wave/groups/CreateWaveInlineGroupXtdhGrant",
  () =>
    function MockCreateWaveInlineGroupXtdhGrant() {
      return <div data-testid="rule-xtdh-grant">xTDH Grant</div>;
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
  return function MockGroupCreateTDH() {
    return <div data-testid="rule-tdh">TDH</div>;
  };
});

jest.mock("@/components/groups/page/create/config/GroupCreateCIC", () => {
  return function MockGroupCreateCIC() {
    return <div data-testid="rule-cic">NIC</div>;
  };
});

jest.mock("@/components/groups/page/create/config/GroupCreateRep", () => {
  return function MockGroupCreateRep() {
    return <div data-testid="rule-rep">Rep</div>;
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

const exampleIdentity: CommunityMemberMinimal = {
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
};

const createdGroup: ApiGroupFull = {
  id: "group-created",
  name: "Created Group",
  created_by: { handle: "builder" },
} as ApiGroupFull;

function TestHarness({
  initialBuilder = createInitialInlineGroupBuilderState(),
  onGroupSelect = jest.fn(),
  onInlineGroupCreate = jest.fn().mockResolvedValue(createdGroup),
  selectedGroup = null,
  disabled = false,
}: {
  readonly initialBuilder?: CreateWaveInlineGroupBuilderState;
  readonly onGroupSelect?: jest.Mock;
  readonly onInlineGroupCreate?: jest.Mock;
  readonly selectedGroup?: ApiGroupFull | null;
  readonly disabled?: boolean;
}) {
  const [builder, setBuilder] =
    React.useState<CreateWaveInlineGroupBuilderState>(initialBuilder);
  const [currentGroup, setCurrentGroup] = React.useState<ApiGroupFull | null>(
    selectedGroup
  );

  const updatePanel = (panel: CreateWaveInlineGroupPanel) => {
    setBuilder((prev) => ({
      ...prev,
      panel,
    }));
  };

  const updateRule = (rule: CreateWaveInlineGroupRuleType | null) => {
    setBuilder((prev) => ({
      ...prev,
      activeRule: rule,
      panel: rule ? "rule-editor" : prev.panel,
    }));
  };

  return (
    <CreateWaveGroupInlinePanel
      waveName="My Wave"
      groupLabel="Who can view"
      defaultLabel="Anyone"
      disabled={disabled}
      selectedGroup={currentGroup}
      groupBuilder={builder}
      onGroupSelect={(group) => {
        setCurrentGroup(group);
        onGroupSelect(group);
      }}
      onInlineGroupCreate={onInlineGroupCreate}
      setGroupBuilderPanel={updatePanel}
      setGroupBuilderRule={updateRule}
      setGroupBuilderDraft={(draft) =>
        setBuilder((prev) => ({
          ...prev,
          draft,
        }))
      }
      addGroupBuilderIdentity={(identity) =>
        setBuilder((prev) => ({
          ...prev,
          identities: [identity],
          draft: {
            ...prev.draft,
            group: {
              ...prev.draft.group,
              identity_addresses: [
                (identity.primary_wallet ?? identity.wallet).toLowerCase(),
              ],
            },
          },
        }))
      }
      removeGroupBuilderIdentity={() =>
        setBuilder((prev) => ({
          ...prev,
          identities: [],
          draft: {
            ...prev.draft,
            group: {
              ...prev.draft.group,
              identity_addresses: null,
            },
          },
        }))
      }
      resetGroupBuilder={() =>
        setBuilder(createInitialInlineGroupBuilderState())
      }
    />
  );
}

describe("CreateWaveGroupInlinePanel", () => {
  it("renders the current state and primary actions", () => {
    render(<TestHarness />);

    expect(screen.getByText("Current state")).toBeInTheDocument();
    expect(screen.getByText("Anyone")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add identity" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add rule" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Use existing group" })
    ).toBeInTheDocument();
  });

  it("opens the identity panel", async () => {
    const user = userEvent.setup();
    render(<TestHarness />);

    await user.click(screen.getByRole("button", { name: "Add identity" }));

    expect(
      screen.getByRole("button", { name: "Add identity" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.queryByRole("button", { name: "Back to options" })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("identities-panel")).toBeInTheDocument();
  });

  it("returns to options when the active identity pill is clicked", async () => {
    const user = userEvent.setup();
    render(<TestHarness />);

    await user.click(screen.getByRole("button", { name: "Add identity" }));
    await user.click(screen.getByRole("button", { name: "Add identity" }));

    expect(screen.queryByTestId("identities-panel")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Use existing group" })
    ).toBeInTheDocument();
  });

  it("opens a quick rule editor", async () => {
    const user = userEvent.setup();
    render(<TestHarness />);

    await user.click(screen.getByRole("button", { name: "Add rule" }));
    await user.click(screen.getByRole("button", { name: "TDH" }));

    expect(screen.getByTestId("rule-tdh")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add rule" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "TDH" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(
      screen.queryByRole("button", { name: "Back to rules" })
    ).not.toBeInTheDocument();
  });

  it("returns to rule options when the active rule pill is clicked", async () => {
    const user = userEvent.setup();
    render(<TestHarness />);

    await user.click(screen.getByRole("button", { name: "Add rule" }));
    await user.click(screen.getByRole("button", { name: "TDH" }));
    await user.click(screen.getByRole("button", { name: "TDH" }));

    expect(screen.queryByTestId("rule-tdh")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "TDH" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("shows all rule options without an extra more-rules step", async () => {
    const user = userEvent.setup();
    render(<TestHarness />);

    await user.click(screen.getByRole("button", { name: "Add rule" }));

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

  it("returns to options when the active existing group pill is clicked", async () => {
    const user = userEvent.setup();
    render(<TestHarness />);

    await user.click(
      screen.getByRole("button", { name: "Use existing group" })
    );
    expect(screen.getByTestId("group-search")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Use existing group" })
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(
      screen.getByRole("button", { name: "Use existing group" })
    );

    expect(screen.queryByTestId("group-search")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add identity" })
    ).toBeInTheDocument();
  });

  it("returns to the actions view after selecting an existing group", async () => {
    const user = userEvent.setup();
    const onGroupSelect = jest.fn();
    render(<TestHarness onGroupSelect={onGroupSelect} />);

    await user.click(
      screen.getByRole("button", { name: "Use existing group" })
    );
    await user.click(screen.getByRole("button", { name: "select group" }));

    expect(onGroupSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Selected Group" })
    );
    expect(
      screen.getByRole("button", { name: "Add identity" })
    ).toBeInTheDocument();
  });

  it("creates and attaches a valid inline group draft", async () => {
    const user = userEvent.setup();
    const onGroupSelect = jest.fn();
    const onInlineGroupCreate = jest.fn().mockResolvedValue(createdGroup);
    const draft = createEmptyInlineGroupPayload();
    draft.group.rep = {
      ...draft.group.rep,
      min: 5,
    };

    render(
      <TestHarness
        onGroupSelect={onGroupSelect}
        onInlineGroupCreate={onInlineGroupCreate}
        initialBuilder={{
          ...createInitialInlineGroupBuilderState(),
          draft,
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: "Create + use" }));

    await waitFor(() => {
      expect(onInlineGroupCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "My Wave Who can view",
        })
      );
    });
    expect(onGroupSelect).toHaveBeenCalledWith(createdGroup);
  });

  it("keeps reset available when the draft is invalid", async () => {
    const user = userEvent.setup();
    const draft = createEmptyInlineGroupPayload();
    draft.group.tdh = {
      ...draft.group.tdh,
      min: 10,
      max: 5,
    };

    render(
      <TestHarness
        initialBuilder={{
          ...createInitialInlineGroupBuilderState(),
          draft,
        }}
      />
    );

    expect(screen.getByRole("button", { name: "Create + use" })).toBeDisabled();
    const startOverButton = screen.getByRole("button", { name: "Start over" });
    expect(startOverButton).toBeEnabled();

    await user.click(startOverButton);

    await waitFor(() => {
      expect(
        screen.queryByText("Ready to create this inline group")
      ).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: "Add identity" })
    ).toBeInTheDocument();
  });

  it("opens configured rules from the draft chips", async () => {
    const user = userEvent.setup();
    const draft = createEmptyInlineGroupPayload();
    draft.group.rep = {
      ...draft.group.rep,
      min: 5,
    };

    render(
      <TestHarness
        initialBuilder={{
          ...createInitialInlineGroupBuilderState(),
          draft,
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: "Rep" }));

    expect(screen.getByTestId("rule-rep")).toBeInTheDocument();
  });

  it("updates the draft summary after adding an identity", async () => {
    const user = userEvent.setup();
    render(<TestHarness />);

    await user.click(screen.getByRole("button", { name: "Add identity" }));
    await user.click(screen.getByRole("button", { name: "add identity" }));

    expect(
      screen.getByRole("button", { name: "1 identity" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add rule" })
    ).toBeInTheDocument();
  });
});
