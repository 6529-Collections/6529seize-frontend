import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import CreateWaveGroupInlinePanel from "@/components/waves/create-wave/groups/CreateWaveGroupInlinePanel";

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

function renderInlinePanel({
  suggestedName = "My Wave Who can view",
  onChange = jest.fn(),
  onCreateGroup = jest.fn().mockResolvedValue(createdGroup),
  selectedGroup = null,
  disabled = false,
  allowGroupClear = true,
}: {
  readonly suggestedName?: string;
  readonly onChange?: jest.Mock;
  readonly onCreateGroup?: jest.Mock;
  readonly selectedGroup?: ApiGroupFull | null;
  readonly disabled?: boolean;
  readonly allowGroupClear?: boolean;
} = {}) {
  const initialSelectedGroup = selectedGroup;

  function ControlledPanel() {
    const [currentGroup, setCurrentGroup] = React.useState<ApiGroupFull | null>(
      () => initialSelectedGroup
    );

    return (
      <CreateWaveGroupInlinePanel
        suggestedName={suggestedName}
        defaultLabel="Anyone"
        disabled={disabled}
        selectedGroup={currentGroup}
        allowGroupClear={allowGroupClear}
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
  suggestedName = "My Wave Who can view",
  onChange = jest.fn(),
  onCreateGroup = jest.fn().mockResolvedValue(createdGroup),
  selectedGroup = null,
  initialDisabled = false,
  allowGroupClear = true,
}: {
  readonly suggestedName?: string;
  readonly onChange?: jest.Mock;
  readonly onCreateGroup?: jest.Mock;
  readonly selectedGroup?: ApiGroupFull | null;
  readonly initialDisabled?: boolean;
  readonly allowGroupClear?: boolean;
} = {}) {
  const initialSelectedGroup = selectedGroup;

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
          defaultLabel="Anyone"
          disabled={disabled}
          selectedGroup={currentGroup}
          allowGroupClear={allowGroupClear}
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
  it("renders the current state and primary actions", () => {
    renderInlinePanel();

    expect(screen.getByText("Current group")).toBeInTheDocument();
    expect(screen.getByText("Anyone")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add identity" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add rule" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose group" })
    ).toBeInTheDocument();
  });

  it("opens the identity panel", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Add identity" }));

    expect(
      screen.getByRole("button", { name: "Add identity" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.queryByRole("button", { name: "Back to options" })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("identities-panel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("returns to options when the active identity pill is clicked", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Add identity" }));
    await user.click(screen.getByRole("button", { name: "Add identity" }));

    expect(screen.queryByTestId("identities-panel")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose group" })
    ).toBeInTheDocument();
  });

  it("opens a quick rule editor", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

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
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Add rule" }));
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
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Choose group" }));
    expect(screen.getByTestId("group-search")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose group" })
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Choose group" }));

    expect(screen.queryByTestId("group-search")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add identity" })
    ).toBeInTheDocument();
  });

  it("returns to the actions view after selecting an existing group", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderInlinePanel({ onChange });

    await user.click(screen.getByRole("button", { name: "Choose group" }));
    await user.click(screen.getByRole("button", { name: "select group" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Selected Group" })
    );
    expect(
      screen.getByRole("button", { name: "Add identity" })
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
    expect(screen.getByText("Anyone")).toBeInTheDocument();
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
    renderInlinePanel({ onChange, onCreateGroup });

    await user.click(screen.getByRole("button", { name: "Add rule" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));
    await user.click(
      screen.getByRole("button", { name: "Create and use new group" })
    );

    await waitFor(() => {
      expect(onCreateGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "My Wave Who can view",
        })
      );
    });
    expect(onChange).toHaveBeenCalledWith(createdGroup);
  });

  it("keeps the draft when clicking outside an open editor", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Add rule" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));

    expect(screen.getByTestId("rule-rep")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.getByTestId("rule-rep")).toBeInTheDocument();

    expect(screen.getByText("Current group")).toBeInTheDocument();
    expect(screen.getByText("Anyone")).toBeInTheDocument();
    expect(screen.getByText("Unsaved group")).toBeInTheDocument();
    expect(screen.getAllByText("1 rule").length).toBeGreaterThan(0);
    expect(screen.getByText("Not applied yet.")).toBeInTheDocument();
    expect(screen.getByText("Create this new group")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard draft" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Create and use new group" })
    ).toBeEnabled();
  });

  it("keeps the rule draft when cancelling an open editor", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Add rule" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));

    expect(screen.getByTestId("rule-rep")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByTestId("rule-rep")).not.toBeInTheDocument();
    expect(screen.getByText("Unsaved group")).toBeInTheDocument();
    expect(screen.getAllByText("1 rule").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Create and use new group" })
    ).toBeEnabled();
  });

  it("keeps the identity draft when cancelling the identity panel", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Add identity" }));
    await user.click(screen.getByRole("button", { name: "add identity" }));

    expect(screen.getByTestId("identities-panel")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByTestId("identities-panel")).not.toBeInTheDocument();
    expect(screen.getByText("Unsaved group")).toBeInTheDocument();
    expect(screen.getAllByText("1 identity").length).toBeGreaterThan(0);
    expect(screen.getByText("Create this new group")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard draft" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Create and use new group" })
    ).toBeEnabled();
  });

  it("keeps draft actions visible after collapsing an active panel", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Add rule" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));
    await user.click(screen.getByRole("button", { name: "Add rule" }));

    expect(screen.queryByTestId("rule-rep")).not.toBeInTheDocument();
    expect(screen.getByText("Current group")).toBeInTheDocument();
    expect(screen.getByText("Anyone")).toBeInTheDocument();
    expect(screen.getByText("Unsaved group")).toBeInTheDocument();
    expect(screen.getAllByText("1 rule").length).toBeGreaterThan(0);
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

    await user.click(screen.getByRole("button", { name: "Add rule" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));
    await user.click(screen.getByRole("button", { name: "Add rule" }));

    expect(screen.queryByTestId("rule-rep")).not.toBeInTheDocument();
    expect(screen.getByText("Current group")).toBeInTheDocument();
    expect(screen.getByText("Existing Group")).toBeInTheDocument();
    expect(screen.getByText("Unsaved group")).toBeInTheDocument();
    expect(screen.getAllByText("1 rule").length).toBeGreaterThan(0);
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

    await user.click(screen.getByRole("button", { name: "Add rule" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));

    expect(screen.getByTestId("rule-rep")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.getByTestId("rule-rep")).toBeInTheDocument();

    expect(screen.getByText("Current group")).toBeInTheDocument();
    expect(screen.getAllByText("Existing Group").length).toBeGreaterThan(0);
    expect(screen.getByText("Unsaved group")).toBeInTheDocument();
    expect(screen.getAllByText("1 rule").length).toBeGreaterThan(0);
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

    await user.click(screen.getByRole("button", { name: "Add rule" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));
    await user.click(screen.getByRole("button", { name: "Choose group" }));

    expect(screen.getByTestId("group-search")).toBeInTheDocument();
    expect(screen.getByText("Current group")).toBeInTheDocument();
    expect(screen.getByText("Anyone")).toBeInTheDocument();
    expect(screen.getAllByText("Unsaved group")).toHaveLength(2);
    expect(screen.getByText("1 rule")).toBeInTheDocument();
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

    await user.click(screen.getByRole("button", { name: "Add rule" }));
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
      screen.getByRole("button", { name: "Add identity" })
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

    await user.click(screen.getByRole("button", { name: "Add rule" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));
    await user.click(screen.getByRole("button", { name: "Add rule" }));

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

    await user.click(screen.getByRole("button", { name: "Add rule" }));
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

    await user.click(screen.getByRole("button", { name: "Add rule" }));
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

    await user.click(screen.getByRole("button", { name: "Add rule" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));
    await user.click(screen.getByRole("button", { name: "Add rule" }));
    await user.click(screen.getByRole("button", { name: "Add rule" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));

    expect(screen.getByTestId("rule-rep")).toBeInTheDocument();
  });

  it("updates the draft summary after adding an identity", async () => {
    const user = userEvent.setup();
    renderInlinePanel();

    await user.click(screen.getByRole("button", { name: "Add identity" }));
    await user.click(screen.getByRole("button", { name: "add identity" }));

    expect(screen.getAllByText("1 identity").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Add rule" })
    ).toBeInTheDocument();
  });
});
